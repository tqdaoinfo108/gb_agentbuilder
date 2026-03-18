import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { Settings, X, Database, Globe, Bot, Plus, Trash2, GripVertical, ChevronDown, Play, Code, FileJson, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface PropertiesPanelProps {
  node: Node | null;
  updateNodeData: (id: string, data: any) => void;
  onClose: () => void;
  onDelete?: () => void;
}

export default function PropertiesPanel({ node, updateNodeData, onClose, onDelete }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'config' | 'advanced'>('config');
  const [testResult, setTestResult] = useState<{ selectedId: string; reason: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!node) return null;

  const handleChange = (field: string, value: any) => {
    updateNodeData(node.id, { [field]: value });
  };

  const renderTriggerConfig = () => {
    const fields = (node.data.fields as any[]) || [];
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin cơ bản</label>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Tên Form / Nguồn cấp</label>
            <input
              type="text"
              value={(node.data.label as string) || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Mô tả hiển thị cho User</label>
            <textarea
              value={(node.data.description as string) || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow resize-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trường dữ liệu (Fields)</label>
            <button 
              onClick={() => {
                const newFields = [...fields, { 
                  id: `f-${Date.now()}`, 
                  name: `field_${Date.now().toString().slice(-4)}`, 
                  label: 'Trường mới', 
                  type: 'text' 
                }];
                handleChange('fields', newFields);
              }}
              className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-md"
            >
              <Plus size={14} /> Thêm
            </button>
          </div>
          
          {fields.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
              Chưa có trường dữ liệu nào
            </div>
          ) : (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm relative group">
                  <button 
                    onClick={() => {
                      const newFields = fields.filter((_, i) => i !== index);
                      handleChange('fields', newFields);
                    }}
                    className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                  <div className="flex gap-2 items-start">
                    <GripVertical size={16} className="text-slate-300 mt-2 cursor-grab shrink-0" />
                    <div className="flex-1 space-y-2">
                      <input 
                        className="w-full text-sm px-2 py-1.5 border-b border-slate-200 focus:border-emerald-500 focus:outline-none bg-transparent font-medium text-slate-700 placeholder:font-normal" 
                        value={field.label} 
                        placeholder="Tên hiển thị (VD: Họ và tên)"
                        onChange={(e) => {
                          const newFields = [...fields];
                          newFields[index].label = e.target.value;
                          handleChange('fields', newFields);
                        }}
                      />
                      <div className="flex gap-2">
                        <div className="w-1/2 relative">
                          <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-mono">ID:</span>
                          <input 
                            className="w-full text-xs pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 font-mono text-slate-600" 
                            value={field.name} 
                            onChange={(e) => {
                              const newFields = [...fields];
                              newFields[index].name = e.target.value;
                              handleChange('fields', newFields);
                            }}
                          />
                        </div>
                        <div className="w-1/2 relative">
                          <select 
                            className="w-full text-xs pl-2 pr-6 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 appearance-none"
                            value={field.type}
                            onChange={(e) => {
                              const newFields = [...fields];
                              newFields[index].type = e.target.value;
                              handleChange('fields', newFields);
                            }}
                          >
                            <option value="text">Văn bản ngắn</option>
                            <option value="textarea">Đoạn văn dài</option>
                            <option value="email">Email</option>
                          </select>
                          <ChevronDown size={12} className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAgentConfig = () => {
    const method = (node.data.analysisMethod as string) || 'prompt';
    
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Tên Agent</label>
          <input
            type="text"
            value={(node.data.label as string) || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phương thức xử lý</label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => handleChange('analysisMethod', 'prompt')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-medium transition-all ${method === 'prompt' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Bot size={16} className="mb-1" />
              Prompt
            </button>
            <button
              onClick={() => handleChange('analysisMethod', 'api')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-medium transition-all ${method === 'api' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Globe size={16} className="mb-1" />
              Gọi API
            </button>
            <button
              onClick={() => handleChange('analysisMethod', 'database')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-md text-xs font-medium transition-all ${method === 'database' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Database size={16} className="mb-1" />
              Database
            </button>
          </div>
        </div>

        {/* Dynamic Fields based on Method */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
          {method === 'prompt' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">System Prompt (Chỉ thị cho Agent)</label>
                <p className="text-[10px] text-slate-500 mb-2">Sử dụng {'{{variable}}'} để chèn dữ liệu từ bước trước.</p>
                <textarea
                  value={(node.data.prompt as string) || ''}
                  onChange={(e) => handleChange('prompt', e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow resize-none leading-relaxed"
                  placeholder="Đóng vai một chuyên gia hỗ trợ khách hàng..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô hình ngôn ngữ</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Gemini 1.5 Pro</option>
                  <option>Gemini 1.5 Flash</option>
                  <option>GPT-4o</option>
                </select>
              </div>
            </>
          )}

          {method === 'api' && (
            <>
              <div className="flex gap-2">
                <div className="w-1/3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Method</label>
                  <select
                    value={(node.data.apiMethod as string) || 'GET'}
                    onChange={(e) => handleChange('apiMethod', e.target.value)}
                    className="w-full px-2 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                  </select>
                </div>
                <div className="w-2/3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Endpoint URL</label>
                  <input
                    type="text"
                    value={(node.data.apiUrl as string) || ''}
                    onChange={(e) => handleChange('apiUrl', e.target.value)}
                    placeholder="https://api.domain.com/v1/..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headers (JSON)</label>
                <textarea
                  value={(node.data.apiHeaders as string) || '{\n  "Authorization": "Bearer TOKEN"\n}'}
                  onChange={(e) => handleChange('apiHeaders', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 text-emerald-400 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Body Payload (JSON)</label>
                <textarea
                  value={(node.data.apiBody as string) || '{\n  "email": "{{input.email}}"\n}'}
                  onChange={(e) => handleChange('apiBody', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-900 text-emerald-400 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </>
          )}

          {method === 'database' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Connection String</label>
                <input
                  type="password"
                  value={(node.data.dbConnection as string) || ''}
                  onChange={(e) => handleChange('dbConnection', e.target.value)}
                  placeholder="postgresql://user:pass@host:5432/db"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SQL Query</label>
                <textarea
                  value={(node.data.dbQuery as string) || 'SELECT * FROM users\nWHERE email = \'{{input.email}}\''}
                  onChange={(e) => handleChange('dbQuery', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 bg-slate-900 text-blue-400 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderConditionConfig = () => {
    const cases = (node.data.cases as any[]) || [
      { id: 'true', label: 'TRUE', condition: (node.data.condition as string) || 'IF ... THEN' },
      { id: 'false', label: 'FALSE', condition: 'Mặc định' }
    ];
    const sampleInput = (node.data.sampleInput as string) || '{\n  "status": "success",\n  "data": {\n    "id": 123,\n    "type": "order"\n  }\n}';

    const handleTestLogic = async () => {
      if (!process.env.GEMINI_API_KEY) {
        alert("Thiếu Gemini API Key để thực hiện test logic.");
        return;
      }
      
      setIsTesting(true);
      setTestResult(null);
      
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
BẠN LÀ CHUYÊN GIA KIỂM THỬ LOGIC WORKFLOW.
Dữ liệu đầu vào (Sample Data):
${sampleInput}

Các nhánh điều kiện hiện có:
${cases.map((c, i) => `- Nhánh "${c.label}" (Điều kiện: ${c.condition}) -> ID: ${c.id}`).join('\n')}

NHIỆM VỤ:
Hãy phân tích dữ liệu đầu vào và chọn nhánh phù hợp nhất.
TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON:
{
  "selectedId": "ID của nhánh được chọn",
  "reason": "Giải thích ngắn gọn tại sao chọn nhánh này dựa trên dữ liệu"
}
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const result = JSON.parse(response.text || '{}');
        setTestResult(result);
      } catch (error) {
        console.error("Test logic error:", error);
        setTestResult({ selectedId: 'error', reason: 'Lỗi khi gọi hệ thống để kiểm tra logic.' });
      } finally {
        setIsTesting(false);
      }
    };

    const handleSuggestCases = async () => {
      if (!process.env.GEMINI_API_KEY) {
        alert("Thiếu Gemini API Key để thực hiện gợi ý.");
        return;
      }
      
      setIsTesting(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `
BẠN LÀ CHUYÊN GIA THIẾT KẾ WORKFLOW.
Dữ liệu mẫu (Sample Data):
${sampleInput}

NHIỆM VỤ:
Dựa trên dữ liệu mẫu này, hãy gợi ý các nhánh điều kiện (Cases) logic nhất để phân loại hoặc xử lý dữ liệu này.
TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON MẢNG CÁC CASES:
{
  "suggestedCases": [
    { "label": "Tên nhánh (ngắn gọn)", "condition": "Mô tả điều kiện logic" },
    ...
  ]
}
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });

        const result = JSON.parse(response.text || '{}');
        if (result.suggestedCases) {
          const newCases = result.suggestedCases.map((c: any, i: number) => ({
            id: `suggested-${Date.now()}-${i}`,
            label: c.label,
            condition: c.condition
          }));
          // Add a default case if not present
          newCases.push({ id: `default-${Date.now()}`, label: 'Mặc định', condition: 'Các trường hợp còn lại' });
          handleChange('cases', newCases);
        }
      } catch (error) {
        console.error("Suggest cases error:", error);
      } finally {
        setIsTesting(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin cơ bản</label>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Tên Logic</label>
            <input
              type="text"
              value={(node.data.label as string) || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dữ liệu mẫu (Sample Input)</label>
            <div className="flex gap-1">
               <button onClick={() => handleChange('sampleInput', '{\n  "status": "success",\n  "value": 100\n}')} className="p-1 hover:bg-slate-100 rounded" title="JSON Sample"><FileJson size={14} className="text-slate-400" /></button>
               <button onClick={() => handleChange('sampleInput', '<root>\n  <status>success</status>\n</root>')} className="p-1 hover:bg-slate-100 rounded" title="XML Sample"><Code size={14} className="text-slate-400" /></button>
               <button onClick={() => handleChange('sampleInput', 'Dữ liệu văn bản thuần túy')} className="p-1 hover:bg-slate-100 rounded" title="Text Sample"><FileText size={14} className="text-slate-400" /></button>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Dữ liệu này giúp hệ thống hiểu cấu trúc và gợi ý các nhánh logic phù hợp.</p>
          <textarea
            value={sampleInput}
            onChange={(e) => handleChange('sampleInput', e.target.value)}
            rows={5}
            className="w-full px-3 py-2 bg-slate-900 text-amber-400 border border-slate-700 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            placeholder="Dán dữ liệu mẫu vào đây..."
          />
          <button
            onClick={handleSuggestCases}
            disabled={isTesting || !sampleInput}
            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
          >
            <Sparkles size={14} /> Gợi ý các nhánh tự động
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Các nhánh điều kiện (Cases)</label>
            <button 
              onClick={() => {
                const newCases = [...cases, { 
                  id: `case-${Date.now()}`, 
                  label: `CASE ${cases.length + 1}`, 
                  condition: '' 
                }];
                handleChange('cases', newCases);
              }}
              className="text-xs flex items-center gap-1 text-amber-600 hover:text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded-md"
            >
              <Plus size={14} /> Thêm nhánh
            </button>
          </div>
          
          <div className="space-y-2">
            {cases.map((c, index) => (
              <div key={c.id} className={`bg-white border rounded-lg p-3 relative group transition-all ${testResult?.selectedId === c.id ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-200'}`}>
                {cases.length > 2 && (
                  <button 
                    onClick={() => {
                      const newCases = cases.filter((_, i) => i !== index);
                      handleChange('cases', newCases);
                    }}
                    className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                <div className="flex gap-2 mb-2">
                  <div className="w-1/3">
                    <label className="block text-[10px] text-slate-500 mb-1 font-bold">Tên nhánh</label>
                    <input
                      type="text"
                      value={c.label}
                      onChange={(e) => {
                        const newCases = [...cases];
                        newCases[index].label = e.target.value;
                        handleChange('cases', newCases);
                      }}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-amber-700 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="w-2/3">
                    <label className="block text-[10px] text-slate-500 mb-1 font-bold">Biểu thức điều kiện (Logic)</label>
                    <input
                      type="text"
                      value={c.condition}
                      onChange={(e) => {
                        const newCases = [...cases];
                        newCases[index].condition = e.target.value;
                        handleChange('cases', newCases);
                      }}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-slate-700 focus:outline-none focus:border-amber-500"
                      placeholder={index === cases.length - 1 ? "Mặc định (để trống)" : "VD: status == 'success'"}
                    />
                  </div>
                </div>
                {testResult?.selectedId === c.id && (
                  <div className="mt-2 flex items-start gap-2 text-[10px] text-emerald-700 bg-white/50 p-2 rounded border border-emerald-100">
                    <CheckCircle2 size={12} className="shrink-0 mt-0.5" />
                    <span>{testResult.reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleTestLogic}
            disabled={isTesting}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all shadow-sm ${
              isTesting 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]'
            }`}
          >
            {isTesting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang kiểm tra...
              </>
            ) : (
              <>
                <Play size={16} />
                Thử nghiệm Logic (Test)
              </>
            )}
          </button>
          {testResult && testResult.selectedId === 'error' && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-red-600 bg-red-50 p-2 rounded border border-red-100">
              <AlertCircle size={12} />
              <span>{testResult.reason}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOutputConfig = () => {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Tên Hành động</label>
          <input
            type="text"
            value={(node.data.label as string) || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-shadow"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cấu hình đầu ra</label>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại phản hồi</label>
              <select
                value={(node.data.responseType as string) || 'text'}
                onChange={(e) => handleChange('responseType', e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="text">Văn bản thuần (Text)</option>
                <option value="link">Đường dẫn (Link)</option>
                <option value="image">Hình ảnh (Image URL)</option>
                <option value="json">Dữ liệu JSON (Card/Widget)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung phản hồi</label>
              <p className="text-[10px] text-slate-500 mb-2">Đây là nội dung sẽ được gửi lại cho người dùng. Có thể dùng {'{{variable}}'} để chèn dữ liệu.</p>
              <textarea
                value={(node.data.result as string) || ''}
                onChange={(e) => handleChange('result', e.target.value)}
                rows={8}
                className={`w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-shadow resize-none leading-relaxed ${node.data.responseType === 'json' ? 'font-mono text-xs bg-slate-900 text-emerald-400' : ''}`}
                placeholder={
                  node.data.responseType === 'json' ? '{\n  "status": "success",\n  "data": {...}\n}' :
                  node.data.responseType === 'link' ? 'https://example.com' :
                  node.data.responseType === 'image' ? 'https://example.com/image.png' :
                  'Nhập nội dung phản hồi...'
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderToolConfig = () => {
    const parameters = (node.data.parameters as any[]) || [];
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Tên Công cụ</label>
          <input
            type="text"
            value={(node.data.label as string) || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
          />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả công cụ</label>
          <textarea
            value={(node.data.description as string) || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow resize-none"
            placeholder="Dùng để làm gì..."
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tham số (Parameters)</label>
            <button 
              onClick={() => {
                const newParams = [...parameters, { 
                  name: `param_${Date.now().toString().slice(-4)}`, 
                  type: 'string', 
                  description: '' 
                }];
                handleChange('parameters', newParams);
              }}
              className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-md"
            >
              <Plus size={14} /> Thêm
            </button>
          </div>
          
          <div className="space-y-2">
            {parameters.map((param, index) => (
              <div key={index} className="bg-white border border-slate-200 rounded-lg p-3 relative group">
                <button 
                  onClick={() => {
                    const newParams = parameters.filter((_, i) => i !== index);
                    handleChange('parameters', newParams);
                  }}
                  className="absolute -top-2 -right-2 bg-white border border-slate-200 text-slate-400 hover:text-red-500 p-1 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={12} />
                </button>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input 
                    className="text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-emerald-500 font-mono" 
                    value={param.name} 
                    placeholder="Tên tham số"
                    onChange={(e) => {
                      const newParams = [...parameters];
                      newParams[index].name = e.target.value;
                      handleChange('parameters', newParams);
                    }}
                  />
                  <select 
                    className="text-xs px-2 py-1.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:border-emerald-500"
                    value={param.type}
                    onChange={(e) => {
                      const newParams = [...parameters];
                      newParams[index].type = e.target.value;
                      handleChange('parameters', newParams);
                    }}
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                  </select>
                </div>
                <input 
                  className="w-full text-[10px] px-2 py-1 bg-transparent border-b border-slate-100 focus:border-emerald-500 focus:outline-none" 
                  value={param.description} 
                  placeholder="Mô tả tham số..."
                  onChange={(e) => {
                    const newParams = [...parameters];
                    newParams[index].description = e.target.value;
                    handleChange('parameters', newParams);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (node.type) {
      case 'trigger': return renderTriggerConfig();
      case 'agent': return renderAgentConfig();
      case 'condition': return renderConditionConfig();
      case 'output': return renderOutputConfig();
      case 'tool': return renderToolConfig();
      default: return <div className="text-sm text-slate-500">Không có cấu hình cho node này.</div>;
    }
  };

  const getThemeColor = () => {
    switch (node.type) {
      case 'trigger': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'agent': return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case 'condition': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'output': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'tool': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  return (
    <aside className="w-[380px] bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl z-20 absolute right-0 top-0 animate-in slide-in-from-right-8">
      {/* Header */}
      <div className={`p-4 border-b flex justify-between items-center ${getThemeColor()}`}>
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white rounded-md shadow-sm">
            <Settings size={16} className="opacity-70" />
          </div>
          <div>
            <h2 className="font-bold text-sm">Cấu hình Node</h2>
            <p className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">{node.type}</p>
          </div>
        </div>
        <button onClick={onClose} className="hover:bg-black/5 p-1.5 rounded-md transition-colors">
          <X size={18} />
        </button>
      </div>
      
      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {renderContent()}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
        {onDelete && (
          <button 
            onClick={onDelete} 
            className="px-3 py-2 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Trash2 size={16} />
            Xóa Node
          </button>
        )}
        <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900 transition-colors shadow-sm ml-auto">
          Hoàn tất
        </button>
      </div>
    </aside>
  );
}
