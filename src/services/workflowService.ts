
export interface Workflow {
  id: string;
  name: string;
  slug?: string;
  nodes: any[];
  edges: any[];
  updatedAt: string;
}

class WorkflowService {
  private STORAGE_KEY = 'workflows';

  getAll(): Record<string, Workflow> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Failed to parse workflows from localStorage', e);
      return {};
    }
  }

  getById(id: string): Workflow | null {
    const workflows = this.getAll();
    return workflows[id] || null;
  }

  save(workflow: Workflow): void {
    const workflows = this.getAll();
    workflows[workflow.id] = {
      ...workflow,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workflows));
  }

  delete(id: string): void {
    const workflows = this.getAll();
    delete workflows[id];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workflows));
  }

  seedDemo() {
    const workflows = this.getAll();
    if (!workflows['weather-demo']) {
      workflows['weather-demo'] = {
        id: 'weather-demo',
        slug: 'weather-demo',
        name: 'Tra cứu Thời tiết (Production Ready Demo)',
        updatedAt: new Date().toISOString(),
        nodes: [
          { id: 't1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Tra cứu', fields: [{ id: 'city', name: 'city', label: 'Thành phố', type: 'text' }] } },
          { id: 'v1', type: 'agent', position: { x: 250, y: -100 }, data: { label: 'Validate Input', analysisMethod: 'prompt', prompt: 'Kiểm tra xem tên thành phố có hợp lệ không. Nếu không hợp lệ trả về JSON { "valid": false, "error": "..." }. Nếu hợp lệ trả về { "valid": true }.' } },
          { id: 'a1', type: 'agent', position: { x: 500, y: 0 }, data: { label: 'API Thời tiết (OpenWeather)', analysisMethod: 'api', prompt: 'Hãy giả lập một kết quả trả về từ OpenWeatherMap API cho thành phố này. Trả về JSON có cấu trúc: { "main": { "temp": number, "humidity": number }, "weather": [{ "description": string }] }. Lưu ý: Nhiệt độ trả về là độ C.' } },
          { id: 'c1', type: 'condition', position: { x: 750, y: 0 }, data: { label: 'Kiểm tra nhiệt độ', cases: [
            { id: 'hot', label: 'Trời nóng', condition: 'Nhiệt độ > 25°C' },
            { id: 'cool', label: 'Trời mát/lạnh', condition: 'Nhiệt độ <= 25°C' }
          ] } },
          { id: 'o1', type: 'output', position: { x: 1000, y: -100 }, data: { label: 'Trời nóng', result: 'Cảnh báo: Thời tiết khá nóng.' } },
          { id: 'o2', type: 'output', position: { x: 1000, y: 100 }, data: { label: 'Trời mát/lạnh', result: 'Thời tiết dễ chịu hoặc se lạnh.' } }
        ],
        edges: [
          { id: 'e1', source: 't1', target: 'v1' },
          { id: 'e2', source: 'v1', target: 'a1' },
          { id: 'e3', source: 'a1', target: 'c1' },
          { id: 'e4', source: 'c1', target: 'o1', label: 'Trời nóng' },
          { id: 'e5', source: 'c1', target: 'o2', label: 'Trời mát/lạnh' }
        ]
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(workflows));
    }
  }
}

export const workflowService = new WorkflowService();
