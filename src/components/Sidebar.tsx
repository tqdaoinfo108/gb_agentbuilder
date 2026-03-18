import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Bot, SplitSquareHorizontal, Send, Mail, Webhook, Database, Globe, MessageSquare, FormInput, GitBranch, ArrowLeft, Settings, Wrench } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string, fields?: any[], extraData?: any) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    
    const nodeData = {
      label,
      ...extraData
    };
    
    if (fields) {
      nodeData.fields = fields;
    }
    
    event.dataTransfer.setData('application/reactflow-data', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm z-10">
      <div className="p-5 border-b border-slate-100">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors mb-4"
        >
          <ArrowLeft size={14} /> Quay lại Portal
        </button>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center text-white">
            <Bot size={14} />
          </div>
          Agent Builder
        </h1>
        <p className="text-xs text-slate-500 mt-1">Kéo thả các node để tạo luồng</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* START NODES */}
        <div>
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Bắt đầu (Start)</h2>
          <div className="space-y-2">
            <div 
              className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl cursor-grab hover:shadow-md transition-all hover:-translate-y-0.5"
              onDragStart={(e) => onDragStart(e, 'trigger', 'Form Submit', [
                { id: 'f1', name: 'customer_name', label: 'Tên khách hàng', type: 'text' },
                { id: 'f2', name: 'issue', label: 'Mô tả vấn đề', type: 'textarea' }
              ], { description: 'Kích hoạt khi người dùng gửi form' })}
              draggable
            >
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <FormInput size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-900">Form Submit</div>
                <div className="text-[10px] text-emerald-600">Nhập liệu qua UI</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl cursor-grab hover:shadow-md transition-all hover:-translate-y-0.5"
              onDragStart={(e) => onDragStart(e, 'trigger', 'Webhook', [
                { id: 'w1', name: 'payload', label: 'Dữ liệu Webhook', type: 'textarea' }
              ], { description: 'Kích hoạt bằng HTTP POST từ bên ngoài' })}
              draggable
            >
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <Webhook size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-900">Webhook</div>
                <div className="text-[10px] text-emerald-600">Stripe, Shopify, CRM...</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl cursor-grab hover:shadow-md transition-all hover:-translate-y-0.5"
              onDragStart={(e) => onDragStart(e, 'trigger', 'Schedule', [], { description: 'Kích hoạt theo thời gian định kỳ' })}
              draggable
            >
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <Play size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-900">Schedule</div>
                <div className="text-[10px] text-emerald-600">Cron job định kỳ</div>
              </div>
            </div>
          </div>
        </div>

        {/* PROCESS NODES */}
        <div>
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Xử lý (Process)</h2>
          <div className="space-y-2">
            <div 
              className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl cursor-grab hover:shadow-md transition-all hover:-translate-y-0.5"
              onDragStart={(e) => onDragStart(e, 'agent', 'Agent', undefined, { 
                analysisMethod: 'prompt',
                prompt: 'Bạn là một trợ lý thông minh. Hãy phân tích dữ liệu đầu vào {{input}} và thực hiện yêu cầu sau: ...',
                description: 'Xử lý dữ liệu bằng mô hình ngôn ngữ'
              })}
              draggable
            >
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <Bot size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-indigo-900">Agent</div>
                <div className="text-[10px] text-indigo-600">Xử lý logic tự động</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl cursor-grab hover:shadow-md transition-all hover:-translate-y-0.5"
              onDragStart={(e) => onDragStart(e, 'tool', 'Công cụ (Tool)', undefined, { 
                toolType: 'api',
                description: 'Định nghĩa công cụ cho Agent sử dụng',
                parameters: [
                  { name: 'query', type: 'string', description: 'Từ khóa tìm kiếm' }
                ]
              })}
              draggable
            >
              <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <Wrench size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-900">Tool Definition</div>
                <div className="text-[10px] text-emerald-600">Định nghĩa công cụ cho Agent</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl cursor-grab hover:shadow-md transition-all hover:-translate-y-0.5"
              onDragStart={(e) => onDragStart(e, 'agent', 'Transform Data', undefined, { 
                analysisMethod: 'transform',
                prompt: 'Chuyển đổi dữ liệu sang định dạng chuẩn...'
              })}
              draggable
            >
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <Settings size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-indigo-900">Transform</div>
                <div className="text-[10px] text-indigo-600">Mapping & Clean data</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl cursor-grab hover:shadow-md transition-all hover:-translate-y-0.5"
              onDragStart={(e) => onDragStart(e, 'agent', 'HTTP Request', undefined, { 
                analysisMethod: 'api',
                apiMethod: 'GET',
                apiUrl: 'https://api.system.com/check'
              })}
              draggable
            >
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                <Globe size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-indigo-900">HTTP Request</div>
                <div className="text-[10px] text-indigo-600">Gọi API bên ngoài</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-grab hover:shadow-md transition-all hover:-translate-y-0.5"
              onDragStart={(e) => onDragStart(e, 'condition', 'Điều kiện', undefined, { 
                condition: 'Kết quả == "OK"'
              })}
              draggable
            >
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                <GitBranch size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-amber-900">Điều kiện</div>
                <div className="text-[10px] text-amber-600">Logic If/Else/Switch</div>
              </div>
            </div>
          </div>
        </div>

        {/* END NODES */}
        <div>
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Kết thúc (End)</h2>
          <div className="space-y-2">
            <div 
              className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl cursor-grab hover:shadow-md transition-all hover:-translate-y-0.5"
              onDragStart={(e) => onDragStart(e, 'output', 'Gửi Thông báo', undefined, { 
                result: 'Đã gửi thông báo thành công'
              })}
              draggable
            >
              <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                <MessageSquare size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-rose-900">Thông báo</div>
                <div className="text-[10px] text-rose-600">Slack, Teams, SMS</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl cursor-grab hover:shadow-md transition-all hover:-translate-y-0.5"
              onDragStart={(e) => onDragStart(e, 'output', 'Email Outbound', undefined, { 
                result: 'Đã gửi email cho khách hàng'
              })}
              draggable
            >
              <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                <Mail size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-rose-900">Email</div>
                <div className="text-[10px] text-rose-600">Gmail, Outlook, SendGrid</div>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl cursor-grab hover:shadow-md transition-all hover:-translate-y-0.5"
              onDragStart={(e) => onDragStart(e, 'output', 'Update CRM', undefined, { 
                result: 'Đã cập nhật dữ liệu CRM'
              })}
              draggable
            >
              <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                <Database size={18} />
              </div>
              <div>
                <div className="text-sm font-bold text-rose-900">CRM Update</div>
                <div className="text-[10px] text-rose-600">Salesforce, Hubspot...</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </aside>
  );
}
