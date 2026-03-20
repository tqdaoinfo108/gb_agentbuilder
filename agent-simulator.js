import WebSocket from 'ws';

const WS_URL = 'ws://localhost:3000/ws/agent?token=secret-agent-token-123';
const MACHINE_ID = 'PC-01';

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('Connected to server');
  
  // Register
  ws.send(JSON.stringify({
    type: 'register',
    payload: {
      machine_id: MACHINE_ID,
      hostname: 'Desktop-Admin',
      os: 'Windows 11 Pro'
    }
  }));

  // Ping every 10s
  setInterval(() => {
    ws.send(JSON.stringify({ type: 'ping' }));
  }, 10000);
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received:', message);

  if (message.type === 'new_job') {
    const { id, type } = message.job;
    console.log(`Executing job ${id}: ${type}`);

    // Simulate work
    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'job_update',
        payload: {
          job_id: id,
          status: 'running',
          log: `Starting ${type}...\n`
        }
      }));
    }, 1000);

    setTimeout(() => {
      ws.send(JSON.stringify({
        type: 'job_update',
        payload: {
          job_id: id,
          status: 'completed',
          log: `Successfully completed ${type}.\n`
        }
      }));
    }, 5000);
  }
});

ws.on('close', () => {
  console.log('Disconnected from server');
});

ws.on('error', (err) => {
  console.error('WS Error:', err);
});
