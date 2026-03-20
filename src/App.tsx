import React, { useEffect, useState, useRef } from 'react';
import { Agent, Job } from './types';
import { formatDistanceToNow } from 'date-fns';
import { Terminal, Server, Play, RefreshCw, Trash2, Bot, AlertCircle, CheckCircle2, Clock, Loader2, Copy, Camera, Download, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewScreenshotId, setPreviewScreenshotId] = useState('');
  const [previewMachineId, setPreviewMachineId] = useState('');
  const [previewTimestamp, setPreviewTimestamp] = useState('');
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewUrl('');
    setPreviewScreenshotId('');
    setPreviewMachineId('');
    setPreviewTimestamp('');
  };

  const savePreview = async () => {
    if (!previewUrl) return;

    try {
      setIsSavingPreview(true);
      const response = await fetch(previewUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch screenshot image');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const safeMachineId = previewMachineId || 'machine';
      const safeScreenshotId = previewScreenshotId || Date.now().toString();
      anchor.href = blobUrl;
      anchor.download = `screenshot-${safeMachineId}-${safeScreenshotId}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to save screenshot preview', err);
      alert('Save screenshot failed');
    } finally {
      setIsSavingPreview(false);
    }
  };

  const copyAgentUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/ws/agent?token=secret-agent-token-123`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetch('/api/agents').then(res => res.json()).then(setAgents);
    fetch('/api/jobs').then(res => res.json()).then(setJobs);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/ui`;
    
    const connectWs = () => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);
          
          if (type === 'agent_update') {
            setAgents(prev => {
              const exists = prev.find(a => a.machine_id === payload.machine_id);
              if (exists) {
                return prev.map(a => a.machine_id === payload.machine_id ? { ...a, ...payload } : a);
              }
              return [...prev, payload];
            });
          } else if (type === 'job_update') {
            setJobs(prev => {
              const exists = prev.find(j => j.id === payload.id);
              if (exists) {
                return prev.map(j => j.id === payload.id ? { ...j, ...payload } : j);
              }
              return [payload, ...prev];
            });
          } else if (type === 'screenshot_new') {
            if (!payload?.url) {
              return;
            }

            setPreviewScreenshotId(payload.screenshot_id || '');
            setPreviewMachineId(payload.machine_id || '');
            setPreviewTimestamp(payload.timestamp || '');
            setPreviewUrl(`${payload.url}?t=${Date.now()}`);
            setIsPreviewOpen(true);
          }
        } catch (err) {
          console.error('Failed to parse WS message', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 3000);
      };

      ws.onerror = () => setWsConnected(false);
    };

    connectWs();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleAction = async (machine_id: string, type: string) => {
    try {
      await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine_id, type }),
      });
    } catch (err) {
      console.error('Failed to create job', err);
    }
  };

  const handleAiCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || !selectedMachine) return;

    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiInput, machine_id: selectedMachine }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(`AI Error: ${data.error}`);
      } else {
        setAiInput('');
      }
    } catch (err) {
      console.error('AI command failed', err);
      alert('Failed to process AI command');
    } finally {
      setIsAiLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">IT Agent Manager</h1>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200">
                  <span className="relative flex h-2 w-2">
                    {wsConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={cn("relative inline-flex rounded-full h-2 w-2", wsConnected ? "bg-emerald-500" : "bg-rose-500")}></span>
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    {wsConnected ? 'Live' : 'Reconnecting...'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-slate-500">Real-time infrastructure control</p>
            </div>
          </div>
          
          <button
            onClick={copyAgentUrl}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            title="Copy WebSocket URL for Agents"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Agent WS URL'}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Agents & AI */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* AI Command Panel */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-600" />
                <h2 className="font-medium">AI Command Assistant</h2>
              </div>
              <div className="p-4">
                <form onSubmit={handleAiCommand} className="flex gap-3">
                  <select 
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={selectedMachine}
                    onChange={(e) => setSelectedMachine(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select Machine</option>
                    {agents.map(a => (
                      <option key={a.machine_id} value={a.machine_id}>{a.hostname} ({a.machine_id})</option>
                    ))}
                  </select>
                  <input 
                    type="text" 
                    placeholder="e.g., 'Office bị lỗi, fix giúp'" 
                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    required
                  />
                  <button 
                    type="submit" 
                    disabled={isAiLoading || !selectedMachine || !aiInput.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  >
                    {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Execute
                  </button>
                </form>
              </div>
            </section>

            {/* Agents List */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-slate-600" />
                  <h2 className="font-medium">Connected Agents</h2>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                  {agents.length} Total
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50/50 uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-medium">Machine</th>
                      <th className="px-4 py-3 font-medium">OS</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Last Seen</th>
                      <th className="px-4 py-3 font-medium text-right">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          No agents connected. Start an agent to see it here.
                        </td>
                      </tr>
                    ) : agents.map(agent => (
                      <tr key={agent.machine_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{agent.hostname}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{agent.machine_id}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{agent.os}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
                            agent.status === 'online' ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", agent.status === 'online' ? "bg-emerald-500" : "bg-slate-400")} />
                            {agent.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {agent.last_seen ? formatDistanceToNow(agent.last_seen, { addSuffix: true }) : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleAction(agent.machine_id, 'reinstall_office')} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Reinstall Office">
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleAction(agent.machine_id, 'clear_temp')} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" title="Clear Temp">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleAction(agent.machine_id, 'screenshot')} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-md transition-colors" title="Capture Screenshot">
                              <Camera className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleAction(agent.machine_id, 'restart')} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" title="Restart">
                              <Play className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right Column: Jobs */}
          <div className="space-y-6">
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                <h2 className="font-medium flex items-center gap-2">
                  <ActivityIcon className="w-5 h-5 text-slate-600" />
                  Recent Jobs
                </h2>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                {jobs.length === 0 ? (
                  <div className="text-center text-slate-500 py-8 text-sm">
                    No jobs created yet.
                  </div>
                ) : jobs.map(job => (
                  <div key={job.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(job.status)}
                        <span className="font-medium text-sm text-slate-900">{job.type}</span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider",
                        job.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                        job.status === 'failed' ? "bg-red-100 text-red-700" :
                        job.status === 'running' ? "bg-blue-100 text-blue-700" :
                        "bg-slate-200 text-slate-700"
                      )}>
                        {job.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {agents.find(a => a.machine_id === job.machine_id)?.hostname || job.machine_id}
                      </span>
                      <span>{formatDistanceToNow(job.created_at, { addSuffix: true })}</span>
                    </div>

                    {job.logs && (
                      <div className="mt-2 p-2 bg-slate-900 rounded-md overflow-x-auto">
                        <pre className="text-[10px] text-slate-300 font-mono whitespace-pre-wrap">
                          {job.logs}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>
      </div>

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Screenshot Preview</h3>
                <p className="text-xs text-slate-500">
                  {previewMachineId || 'Unknown machine'}
                  {previewTimestamp ? ` - ${new Date(previewTimestamp).toLocaleString()}` : ''}
                </p>
              </div>
              <button
                onClick={closePreview}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 max-h-[70vh] overflow-auto">
              {previewUrl ? (
                <img src={previewUrl} alt="Latest screenshot preview" className="w-full h-auto object-contain" />
              ) : (
                <div className="p-8 text-center text-slate-300 text-sm">No screenshot data</div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 bg-slate-50">
              <button
                onClick={closePreview}
                className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={savePreview}
                disabled={!previewUrl || isSavingPreview}
                className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSavingPreview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

