import React from 'react';
import { Node } from '@xyflow/react';
import { X, Trash2 } from 'lucide-react';

interface NodeConfigPanelProps {
  node: Node;
  onUpdateNode: (id: string, data: any) => void;
  onDeleteNode: (id: string) => void;
  onClose: () => void;
}

export default function NodeConfigPanel({ node, onUpdateNode, onDeleteNode, onClose }: NodeConfigPanelProps) {
  const handleChange = (key: string, value: any) => {
    onUpdateNode(node.id, { ...node.data, [key]: value });
  };

  const subType = node.data.subType as string;

  return (
    <aside className="w-80 bg-white border-l border-slate-100 flex flex-col h-full z-20 shadow-xl">
      <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Cấu hình Node</h3>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{node.type}</p>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              onDeleteNode(node.id);
              onClose();
            }}
            className="p-2 hover:bg-rose-50 rounded-lg text-rose-400 hover:text-rose-600 transition-colors"
            title="Xóa Node"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            title="Đóng"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Common Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tên Node</label>
            <input 
              type="text"
              value={node.data.label as string || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mô tả</label>
            <textarea 
              value={node.data.description as string || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-20"
            />
          </div>
        </div>

        {/* Specific Fields based on type */}
        {node.type === 'condition' && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800">Cấu hình rẽ nhánh</h4>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nhánh 1</label>
              <input 
                type="text"
                value={node.data.cond1 as string || ''}
                onChange={(e) => handleChange('cond1', e.target.value)}
                placeholder="VD: temp > 30"
                className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nhánh 2</label>
              <input 
                type="text"
                value={node.data.cond2 as string || ''}
                onChange={(e) => handleChange('cond2', e.target.value)}
                placeholder="VD: temp < 15"
                className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nhánh 3 (Mặc định)</label>
              <input 
                type="text"
                value={node.data.cond3 as string || ''}
                onChange={(e) => handleChange('cond3', e.target.value)}
                placeholder="VD: Mặc định (Else)"
                className="w-full px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Response Mẫu (JSON)</label>
              <textarea 
                value={node.data.sampleResponse ? JSON.stringify(node.data.sampleResponse, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleChange('sampleResponse', parsed);
                  } catch (err) {
                    // Ignore invalid JSON while typing
                  }
                }}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-32"
                placeholder='{\n  "key": "value"\n}'
              />
            </div>
          </div>
        )}

        {node.type === 'agent' && subType === 'HTTP Request' && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800">Cấu hình REST API</h4>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Method</label>
              <select 
                value={node.data.httpMethod as string || 'GET'}
                onChange={(e) => handleChange('httpMethod', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Endpoint URL</label>
              <input 
                type="text"
                value={node.data.endpointUrl as string || ''}
                onChange={(e) => handleChange('endpointUrl', e.target.value)}
                placeholder="https://api.example.com/v1/users"
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Headers (JSON)</label>
              <textarea 
                value={node.data.headers as string || '{\n  "Content-Type": "application/json"\n}'}
                onChange={(e) => handleChange('headers', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-24"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Body (JSON)</label>
              <textarea 
                value={node.data.body as string || ''}
                onChange={(e) => handleChange('body', e.target.value)}
                placeholder='{\n  "key": "value"\n}'
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-24"
              />
            </div>
          </div>
        )}

        {node.type === 'agent' && subType === 'Database Query' && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800">Cấu hình Database</h4>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Loại Database</label>
              <select 
                value={node.data.dbType as string || 'PostgreSQL'}
                onChange={(e) => handleChange('dbType', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="PostgreSQL">PostgreSQL</option>
                <option value="MySQL">MySQL</option>
                <option value="MongoDB">MongoDB</option>
                <option value="SQL Server">SQL Server</option>
                <option value="Redis">Redis</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Connection String</label>
              <input 
                type="password"
                value={node.data.connectionString as string || ''}
                onChange={(e) => handleChange('connectionString', e.target.value)}
                placeholder="postgres://user:pass@host:5432/db"
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Query / Command</label>
              <textarea 
                value={node.data.query as string || ''}
                onChange={(e) => handleChange('query', e.target.value)}
                placeholder="SELECT * FROM users WHERE status = 'active';"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none h-32"
              />
            </div>
          </div>
        )}

        {node.type === 'agent' && (!subType || subType === 'Mẫu Prompt') && (
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800">Cấu hình Mẫu Prompt</h4>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Model</label>
              <select 
                value={node.data.model as string || 'gpt-4o'}
                onChange={(e) => handleChange('model', e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Chỉ thị hệ thống</label>
              <textarea 
                value={node.data.systemPrompt as string || ''}
                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                placeholder="Bạn là một trợ lý ảo hữu ích..."
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none h-24"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Mẫu Prompt</label>
              <textarea 
                value={node.data.aiPrompt as string || ''}
                onChange={(e) => handleChange('aiPrompt', e.target.value)}
                placeholder="Viết prompt của bạn ở đây. Dùng {{biến}} để chèn dữ liệu."
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none h-32"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
