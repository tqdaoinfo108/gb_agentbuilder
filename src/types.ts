export interface Agent {
  machine_id: string;
  hostname: string;
  os: string;
  status: 'online' | 'offline';
  last_seen: number;
}

export interface Job {
  id: string;
  type: string;
  machine_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  logs: string;
  created_at: number;
}
