import { Edge, Node } from '@xyflow/react';

export const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 50, y: 200 },
    data: { 
      label: 'Hỗ trợ Khách hàng', 
      description: 'Tiếp nhận vấn đề từ người dùng cuối',
      fields: [
        { id: 'f1', name: 'issue', label: 'Mô tả vấn đề hoặc mã lỗi bạn đang gặp phải', type: 'textarea' }
      ]
    },
  },
  {
    id: 'agent-1',
    type: 'agent',
    position: { x: 400, y: 200 },
    data: { 
      label: 'Phân tích Vấn đề', 
      analysisMethod: 'prompt',
      prompt: 'Đóng vai trợ lý hỗ trợ khách hàng. Phân tích lỗi người dùng gặp phải và đưa ra hướng dẫn từng bước để họ tự khắc phục.',
      isThinking: false,
      aiOutput: null
    },
  },
  {
    id: 'condition-1',
    type: 'condition',
    position: { x: 750, y: 200 },
    data: { 
      label: 'Có thể tự khắc phục?',
      condition: 'Mức độ lỗi == "Nhẹ"'
    },
  },
  {
    id: 'output-1',
    type: 'output',
    position: { x: 1100, y: 100 },
    data: { 
      label: 'Hướng dẫn xử lý', 
      result: 'Dựa trên vấn đề của bạn, vui lòng thử các bước sau:\n1. Tải lại trang web (F5).\n2. Xóa bộ nhớ đệm (Cache) của trình duyệt.\n3. Đăng nhập lại tài khoản.\n\nNếu vẫn không được, hãy báo lại cho chúng tôi!' 
    },
  },
  {
    id: 'output-2',
    type: 'output',
    position: { x: 1100, y: 300 },
    data: { 
      label: 'Chuyển CSKH', 
      result: 'Rất xin lỗi vì sự bất tiện này. Vấn đề của bạn cần được kiểm tra chuyên sâu hơn bởi kỹ thuật viên. Hệ thống đã tự động ghi nhận và nhân viên hỗ trợ sẽ liên hệ với bạn qua email trong ít phút tới.' 
    },
  }
];

export const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'trigger-1', target: 'agent-1' },
  { id: 'e2-3', source: 'agent-1', target: 'condition-1' },
  { id: 'e3-4', source: 'condition-1', target: 'output-1', sourceHandle: 'true', label: 'Có' },
  { id: 'e3-5', source: 'condition-1', target: 'output-2', sourceHandle: 'false', label: 'Không' },
];
