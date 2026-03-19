import { Node, Edge } from '@xyflow/react';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'chat_workflows';

export const workflowService = {
  getWorkflows: (): Workflow[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getWorkflowById: (id: string): Workflow | undefined => {
    return workflowService.getWorkflows().find(w => w.id === id);
  },

  saveWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Workflow => {
    const workflows = workflowService.getWorkflows();
    
    if (workflow.id) {
      const index = workflows.findIndex(w => w.id === workflow.id);
      if (index !== -1) {
        const updatedWorkflow: Workflow = {
          ...workflows[index],
          ...workflow,
          id: workflow.id,
          updatedAt: new Date().toISOString(),
        };
        workflows[index] = updatedWorkflow;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
        return updatedWorkflow;
      }
    }

    const newWorkflow: Workflow = {
      ...workflow,
      id: Math.random().toString(36).substring(2, 9),
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    workflows.push(newWorkflow);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    return newWorkflow;
  },

  deleteWorkflow: (id: string) => {
    const workflows = workflowService.getWorkflows().filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  },

  seedDemo: () => {
    const currentWorkflows = workflowService.getWorkflows();
    let updatedWorkflows = [...currentWorkflows];

    if (!updatedWorkflows.find(w => w.id === 'demo-weather')) {
      updatedWorkflows.push({
        id: 'demo-weather',
        name: "Dự báo thời tiết",
        description: "Lấy thông tin thời tiết và rẽ nhánh theo nhiệt độ.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [
          { 
            id: '1', type: 'trigger', position: { x: 50, y: 150 }, 
            data: { label: 'Nhập tên thành phố', description: 'Form đầu vào' } 
          },
          { 
            id: '2', type: 'agent', position: { x: 350, y: 150 }, 
            data: { 
              label: 'Lấy tọa độ', 
              description: 'Geocoding API',
              subType: 'HTTP Request',
              httpMethod: 'GET',
              endpointUrl: 'https://geocoding-api.open-meteo.com/v1/search?name={{input}}&count=1&language=en&format=json'
            } 
          },
          { 
            id: '2b', type: 'agent', position: { x: 650, y: 150 }, 
            data: { 
              label: 'Lấy thời tiết', 
              description: 'Open-Meteo API',
              subType: 'HTTP Request',
              httpMethod: 'GET',
              endpointUrl: 'https://api.open-meteo.com/v1/forecast?latitude={{results_0_latitude}}&longitude={{results_0_longitude}}&current_weather=true'
            } 
          },
          { 
            id: '3', type: 'condition', position: { x: 950, y: 100 }, 
            data: { 
              label: 'Kiểm tra nhiệt độ', 
              description: 'Rẽ nhánh dựa trên response',
              sampleResponse: { current_weather: { temperature: 32 } },
              cond1: "current_weather_temperature > 30 (Nóng)",
              cond2: "current_weather_temperature < 15 (Lạnh)",
              cond3: "Mặc định (Mát mẻ)"
            } 
          },
          { 
            id: '4', type: 'output', position: { x: 1350, y: 0 }, 
            data: { label: 'Cảnh báo nắng nóng', description: 'Gửi tin nhắn Text', outputMessage: 'Trời đang rất nóng ({{current_weather_temperature}}°C) tại {{input}}. Hãy nhớ uống nhiều nước và bôi kem chống nắng nhé!' } 
          },
          { 
            id: '5', type: 'output', position: { x: 1350, y: 150 }, 
            data: { label: 'Cảnh báo lạnh', description: 'Gửi tin nhắn Text', outputMessage: 'Trời đang khá lạnh ({{current_weather_temperature}}°C) tại {{input}}. Hãy mặc áo ấm khi ra ngoài nhé!' } 
          },
          { 
            id: '6', type: 'output', position: { x: 1350, y: 300 }, 
            data: { label: 'Thời tiết đẹp', description: 'Gửi tin nhắn Text', outputMessage: 'Thời tiết đang rất đẹp ({{current_weather_temperature}}°C) tại {{input}}. Chúc bạn một ngày tốt lành!' } 
          },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
          { id: 'e2-2b', source: '2', target: '2b', type: 'smoothstep', animated: true },
          { id: 'e2b-3', source: '2b', target: '3', type: 'smoothstep', animated: true },
          { id: 'e3-4', source: '3', sourceHandle: 'branch1', target: '4', type: 'smoothstep', animated: true },
          { id: 'e3-5', source: '3', sourceHandle: 'branch2', target: '5', type: 'smoothstep', animated: true },
          { id: 'e3-6', source: '3', sourceHandle: 'branch3', target: '6', type: 'smoothstep', animated: true },
        ]
      });
    }

    if (!updatedWorkflows.find(w => w.id === 'demo-location')) {
      updatedWorkflows.push({
        id: 'demo-location',
        name: "Phân loại khách hàng theo quốc gia",
        description: "Kiểm tra IP/Địa chỉ và chuyển hướng hỗ trợ.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [
          { 
            id: '1', type: 'trigger', position: { x: 50, y: 150 }, 
            data: { label: 'Bắt đầu', description: 'Tự động lấy khi truy cập' } 
          },
          { 
            id: '2', type: 'agent', position: { x: 400, y: 150 }, 
            data: { 
              label: 'Gọi API GeoIP', 
              description: 'Lấy thông tin quốc gia từ IP',
              subType: 'HTTP Request',
              httpMethod: 'GET',
              endpointUrl: 'https://ipapi.co/json/'
            } 
          },
          { 
            id: '3', type: 'condition', position: { x: 750, y: 100 }, 
            data: { 
              label: 'Phân loại quốc gia', 
              description: 'Kiểm tra mã quốc gia',
              sampleResponse: { ip: "1.1.1.1", country_code: "VN", city: "Hanoi" },
              cond1: "country_code == 'VN'",
              cond2: "country_code == 'US'",
              cond3: "Khác (Global)"
            } 
          },
          { 
            id: '4', type: 'output', position: { x: 1150, y: 0 }, 
            data: { label: 'Hỗ trợ Tiếng Việt', description: 'Chuyển CSKH VN', outputMessage: 'Xin chào! Bạn đang truy cập từ {{city}}, {{country_name}} (IP: {{ip}}). Chúng tôi sẽ kết nối bạn với nhân viên hỗ trợ Tiếng Việt.' } 
          },
          { 
            id: '5', type: 'output', position: { x: 1150, y: 150 }, 
            data: { label: 'Hỗ trợ Tiếng Anh (US)', description: 'Chuyển CSKH US', outputMessage: 'Hello! You are visiting from {{city}}, {{country_name}} (IP: {{ip}}). We will connect you to our US support team.' } 
          },
          { 
            id: '6', type: 'output', position: { x: 1150, y: 300 }, 
            data: { label: 'Hỗ trợ Global', description: 'Chuyển CSKH Global', outputMessage: 'Hello! You are visiting from {{city}}, {{country_name}} (IP: {{ip}}). We will connect you to our Global support team.' } 
          },
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
          { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true },
          { id: 'e3-4', source: '3', sourceHandle: 'branch1', target: '4', type: 'smoothstep', animated: true },
          { id: 'e3-5', source: '3', sourceHandle: 'branch2', target: '5', type: 'smoothstep', animated: true },
          { id: 'e3-6', source: '3', sourceHandle: 'branch3', target: '6', type: 'smoothstep', animated: true },
        ]
      });
    }

    if (!updatedWorkflows.find(w => w.id === 'demo-ai-assistant')) {
      updatedWorkflows.push({
        id: 'demo-ai-assistant',
        name: "Trợ lý AI thông minh",
        description: "Sử dụng Gemini AI để trả lời câu hỏi của người dùng.",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nodes: [
          { 
            id: '1', type: 'trigger', position: { x: 50, y: 150 }, 
            data: { label: 'Nhập câu hỏi', description: 'Form đầu vào' } 
          },
          { 
            id: '2', type: 'agent', position: { x: 400, y: 150 }, 
            data: { 
              label: 'Gemini AI', 
              description: 'Xử lý ngôn ngữ tự nhiên',
              subType: 'Mẫu Prompt',
              systemPrompt: 'Bạn là một trợ lý ảo thông minh, thân thiện và luôn trả lời bằng tiếng Việt. Hãy trả lời ngắn gọn, súc tích.',
              aiPrompt: 'Người dùng hỏi: "{{input}}"\n\nHãy trả lời câu hỏi trên.',
              model: 'gemini-3-flash-preview'
            } 
          },
          { 
            id: '3', type: 'output', position: { x: 800, y: 150 }, 
            data: { label: 'Trả lời người dùng', description: 'Gửi tin nhắn Text', outputMessage: '{{ai_response}}' } 
          }
        ],
        edges: [
          { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', animated: true },
          { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', animated: true }
        ]
      });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWorkflows));
  }
};
