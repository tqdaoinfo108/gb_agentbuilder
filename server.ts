import express from 'express';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';

const PORT = 3000;

// --- Types ---
interface Agent {
  machine_id: string;
  hostname: string;
  os: string;
  status: 'online' | 'offline';
  last_seen: number;
  ws?: WebSocket;
}

interface Job {
  id: string;
  type: string;
  machine_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  logs: string;
  created_at: number;
}

interface Screenshot {
  id: string;
  job_id: string;
  machine_id: string;
  image_url: string;
  taken_at: string;
  created_at: number;
}

// --- In-Memory Stores ---
const agents = new Map<string, Agent>();
const jobs = new Map<string, Job>();
const screenshots = new Map<string, Screenshot>();

const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// --- Helper: Broadcast to UI ---
let uiClients = new Set<WebSocket>();
function broadcastToUI(type: string, payload: any) {
  const message = JSON.stringify({ type, payload });
  for (const client of uiClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- REST APIs ---
  app.get('/api/agents', (req, res) => {
    const agentList = Array.from(agents.values()).map(a => ({
      machine_id: a.machine_id,
      hostname: a.hostname,
      os: a.os,
      status: a.status,
      last_seen: a.last_seen,
    }));
    res.json(agentList);
  });

  app.get('/api/jobs', (req, res) => {
    const jobList = Array.from(jobs.values()).sort((a, b) => b.created_at - a.created_at);
    res.json(jobList);
  });

  app.post('/api/jobs', (req, res) => {
    const { type, machine_id } = req.body;
    if (!type || !machine_id) {
      return res.status(400).json({ error: 'Missing type or machine_id' });
    }

    const allowedActions = ['reinstall_office', 'restart', 'clear_temp', 'update_os', 'scan_virus', 'screenshot'];
    if (!allowedActions.includes(type)) {
      return res.status(400).json({ error: 'Invalid job type' });
    }

    const agent = agents.get(machine_id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const job: Job = {
      id: `job_${uuidv4()}`,
      type,
      machine_id,
      status: 'pending',
      logs: '',
      created_at: Date.now(),
    };

    jobs.set(job.id, job);

    // Push job to agent if online
    if (agent.status === 'online' && agent.ws?.readyState === WebSocket.OPEN) {
      agent.ws.send(JSON.stringify({
        type: 'job',
        job_id: job.id,
        action: job.type,
      }));
      job.status = 'running'; // Optimistic update
    }

    broadcastToUI('job_update', job);
    res.json(job);
  });

  app.get('/api/machines/:machine_id/screenshots', (req, res) => {
    const machine_id = req.params.machine_id;
    const result = Array.from(screenshots.values())
      .filter(ss => ss.machine_id === machine_id)
      .map(ss => ({
        id: ss.id,
        job_id: ss.job_id,
        timestamp: ss.taken_at,
        url: ss.image_url,
      }));

    res.json({ machine_id, screenshots: result });
  });

  app.get('/api/screenshots/:screenshot_id', (req, res) => {
    const screenshot = screenshots.get(req.params.screenshot_id);
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }
    res.json(screenshot);
  });

  app.get('/api/screenshots/:screenshot_id/image', (req, res) => {
    const screenshot = screenshots.get(req.params.screenshot_id);
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    const filePath = path.join(SCREENSHOTS_DIR, `${screenshot.id}.png`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Screenshot image not found on disk' });
    }

    res.contentType('image/png');
    res.sendFile(filePath);
  });

  app.post('/api/ai/command', async (req, res) => {
    const { text, machine_id } = req.body;
    if (!text || !machine_id) {
      return res.status(400).json({ error: 'Missing text or machine_id' });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Parse the following IT request into a specific action command.
        Allowed actions: 'reinstall_office', 'restart', 'clear_temp', 'update_os', 'scan_virus'.
        If the request doesn't match any allowed action, return 'unknown'.
        
        Request: "${text}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: {
                type: Type.STRING,
                description: "The parsed action command."
              }
            },
            required: ["action"]
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      const action = result.action;

      const allowedActions = ['reinstall_office', 'restart', 'clear_temp', 'update_os', 'scan_virus'];
      if (!action || action === 'unknown' || !allowedActions.includes(action)) {
        return res.status(400).json({ error: 'Could not determine a valid action from text' });
      }

      // Create job
      const agent = agents.get(machine_id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const job: Job = {
        id: `job_${uuidv4()}`,
        type: action,
        machine_id,
        status: 'pending',
        logs: 'AI generated job.\n',
        created_at: Date.now(),
      };

      jobs.set(job.id, job);

      if (agent.status === 'online' && agent.ws?.readyState === WebSocket.OPEN) {
        agent.ws.send(JSON.stringify({
          type: 'new_job',
          job: { id: job.id, type: job.type }
        }));
        job.status = 'running';
      }

      broadcastToUI('job_update', job);
      res.json({ action, job });

    } catch (error) {
      console.error('AI Error:', error);
      res.status(500).json({ error: 'Failed to process AI command' });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // --- WebSocket Server ---
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    
    if (url.pathname === '/ws/ui') {
      uiClients.add(ws);
      ws.on('close', () => uiClients.delete(ws));
      return;
    }

    if (url.pathname === '/ws/agent') {
      const token = url.searchParams.get('token');
      const expectedToken = process.env.AGENT_TOKEN?.trim();

      // Simple token check for security.
      // - If AGENT_TOKEN is set, require it.
      // - If AGENT_TOKEN is not set, allow any non-empty token (for local/dev use).
      if (!token || (expectedToken && token !== expectedToken)) {
        console.warn(`Agent connection rejected. token=${token}, expected=${expectedToken ? '[PROTECTED]' : '<none>'}`);
        ws.close(1008, 'Unauthorized');
        return;
      }

      let currentMachineId: string | null = null;

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
            throw new Error(`Invalid WS payload: ${message.toString()}`);
          }

          if (data.type === 'register') {
            let machine_id: string | undefined;
            let hostname: string | undefined;
            let os: string | undefined;

            if (data.payload && typeof data.payload === 'object') {
              ({ machine_id, hostname, os } = data.payload as any);
            } else {
              machine_id = data.machine_id;
              hostname = data.hostname;
              os = data.os;
            }

            if (!machine_id || !hostname || !os) {
              throw new Error('register payload missing required fields (expected machine_id, hostname, os)');
            }
            currentMachineId = machine_id;

            agents.set(machine_id, {
              machine_id,
              hostname,
              os,
              status: 'online',
              last_seen: Date.now(),
              ws,
            });

            broadcastToUI('agent_update', { machine_id, hostname, os, status: 'online', last_seen: Date.now() });
            console.log(`Agent registered: ${machine_id}`);
          } else if (data.type === 'job_update') {
            let job_id: string | undefined;
            let status: string | undefined;
            let log: string | undefined;

            if (data.payload && typeof data.payload === 'object') {
              ({ job_id, status, log } = data.payload as any);
            } else {
              job_id = data.job_id;
              status = data.status;
              log = data.log;
            }

            if (!job_id || !status) {
              throw new Error('job_update payload missing required fields (expected job_id, status)');
            }
            const job = jobs.get(job_id);
            if (job) {
              job.status = status;
              if (log) job.logs += log + '\n';
              broadcastToUI('job_update', job);
            }
          } else if (data.type === 'screenshot_result') {
            let job_id: string | undefined;
            let machine_id: string | undefined;
            let image: string | undefined;
            let timestamp: string | undefined;

            if (data.payload && typeof data.payload === 'object') {
              ({ job_id, machine_id, image, timestamp } = data.payload as any);
            } else {
              job_id = data.job_id;
              machine_id = data.machine_id;
              image = data.image;
              timestamp = data.timestamp;
            }

            if (!job_id || !machine_id || !image || !timestamp) {
              throw new Error('screenshot_result payload missing required fields (expected job_id, machine_id, image, timestamp)');
            }

            const parsed = Date.parse(timestamp);
            if (Number.isNaN(parsed)) {
              throw new Error('screenshot_result timestamp is invalid ISO8601 string');
            }

            const screenshotId = `ss_${uuidv4()}`;
            const fileName = `${screenshotId}.png`;
            const filePath = path.join(SCREENSHOTS_DIR, fileName);
            const imageBuffer = Buffer.from(image, 'base64');
            fs.writeFileSync(filePath, imageBuffer);

            const imageUrl = `/api/screenshots/${screenshotId}/image`;
            const screenshot: Screenshot = {
              id: screenshotId,
              job_id,
              machine_id,
              image_url: imageUrl,
              taken_at: new Date(parsed).toISOString(),
              created_at: Date.now(),
            };

            screenshots.set(screenshotId, screenshot);

            const linkedJob = jobs.get(job_id);
            if (linkedJob) {
              linkedJob.status = 'completed';
              linkedJob.logs += `Screenshot received: ${screenshotId}\n`;
              broadcastToUI('job_update', linkedJob);
            }

            broadcastToUI('screenshot_new', {
              type: 'screenshot_new',
              machine_id,
              screenshot_id: screenshotId,
              url: imageUrl,
              timestamp: screenshot.taken_at,
            });
          } else if (data.type === 'ping') {
             if (currentMachineId) {
                const agent = agents.get(currentMachineId);
                if (agent) {
                   agent.last_seen = Date.now();
                   agent.status = 'online';
                   broadcastToUI('agent_update', { machine_id: agent.machine_id, status: 'online', last_seen: agent.last_seen });
                }
             }
          }
        } catch (err) {
          console.error('WS Message Error:', err);
        }
      });

      ws.on('close', () => {
        if (currentMachineId) {
          const agent = agents.get(currentMachineId);
          if (agent) {
            agent.status = 'offline';
            agent.ws = undefined;
            broadcastToUI('agent_update', { machine_id: agent.machine_id, status: 'offline', last_seen: agent.last_seen });
            console.log(`Agent offline: ${currentMachineId}`);
          }
        }
      });
    }
  });

  // Agent offline checker
  setInterval(() => {
    const now = Date.now();
    for (const [id, agent] of agents.entries()) {
      if (agent.status === 'online' && now - agent.last_seen > 30000) { // 30s timeout
        agent.status = 'offline';
        agent.ws = undefined;
        broadcastToUI('agent_update', { machine_id: id, status: 'offline', last_seen: agent.last_seen });
      }
    }
  }, 10000);
}

startServer();
