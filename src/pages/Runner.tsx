import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, CheckCircle2, AlertCircle, Loader2, FileText, ArrowLeft, Terminal, Database, Globe, Bot, Send } from 'lucide-react';
import { Node, Edge } from '@xyflow/react';

export default function Runner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [workflow, setWorkflow] = useState<{ nodes: Node[]; edges: Edge[]; name: string } | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<{ time: string; message: string; type: 'info' | 'success' | 'error' | 'process' }[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('workflows');
    if (stored && id) {
      const workflows = JSON.parse(stored);
      if (workflows[id]) {
        setWorkflow(workflows[id]);
        
        // Init form data
        const startNode = workflows[id].nodes.find((n: Node) => n.type === 'trigger');
        const initialData: Record<string, string> = {};
        if (startNode?.data?.fields) {
          (startNode.data.fields as any[]).forEach(f => {
            initialData[f.name] = '';
          });
        }
        setFormData(initialData);
      }
    }
  }, [id]);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'process' = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workflow) return;
    
    setStatus('running');
    setLogs([]);
    addLog('Khởi tạo luồng thực thi...', 'info');
    
    try {
      const { nodes, edges } = workflow;
      const startNode = nodes.find(n => n.type === 'trigger');
      if (!startNode) throw new Error('Workflow không có node Bắt đầu (Start)');

      await delay(800);
      addLog(`[START] Nhận dữ liệu từ Trigger: ${startNode.data.label}`, 'success');
      addLog(`Payload: ${JSON.stringify(formData)}`, 'info');

      // Simulate traversal
      let currentNode = startNode;
      let currentEdges = edges.filter(e => e.source === currentNode.id);

      while (currentEdges.length > 0) {
        // Simple simulation: just take the first path or simulate condition
        const edge = currentEdges[0];
        const nextNode = nodes.find(n => n.id === edge.target);
        
        if (!nextNode) break;
        await delay(1200);

        if (nextNode.type === 'agent') {
          const method = nextNode.data.analysisMethod || 'prompt';
          if (method === 'api') {
            addLog(`[PROCESS] Đang gọi API (cURL): ${nextNode.data.apiMethod || 'GET'} ${nextNode.data.apiUrl || 'Endpoint'}`, 'process');
            await delay(1500);
            addLog(`[API RESPONSE] 200 OK - Fetched system status`, 'success');
          } else if (method === 'database') {
            addLog(`[PROCESS] Đang truy vấn Database: ${nextNode.data.dbConnection || 'DB'}`, 'process');
            await delay(1500);
            addLog(`[DB RESULT] Tìm thấy 1 bản ghi khớp với thông tin.`, 'success');
          } else {
            addLog(`[PROCESS] Agent đang phân tích dữ liệu...`, 'process');
            await delay(1500);
            addLog(`[RESULT] Phân tích hoàn tất. Độ tin cậy: 95%`, 'success');
          }
        } else if (nextNode.type === 'condition') {
          addLog(`[LOGIC] Kiểm tra điều kiện rẽ nhánh...`, 'process');
          await delay(1000);
          addLog(`[LOGIC] Điều kiện thỏa mãn -> Đi theo nhánh TRUE`, 'info');
          // Force next edge to be the true branch if exists
          const trueEdge = edges.find(e => e.source === nextNode.id && e.sourceHandle === 'true');
          if (trueEdge) {
            currentEdges = [trueEdge];
            currentNode = nextNode;
            continue;
          }
        } else if (nextNode.type === 'output') {
          addLog(`[END] Thực thi hành động kết thúc: ${nextNode.data.label}`, 'success');
          await delay(800);
          addLog(`[SUCCESS] Workflow hoàn thành!`, 'success');
          setStatus('success');
          return;
        }

        currentNode = nextNode;
        currentEdges = edges.filter(e => e.source === currentNode.id);
      }

      if (status !== 'success') {
        addLog(`[END] Workflow kết thúc (Không có Output Node nào được gọi)`, 'info');
        setStatus('success');
      }

    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`, 'error');
      setStatus('error');
    }
  };

  if (!workflow) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <AlertCircle size={48} className="text-slate-400 mb-4" />
        <h1 className="text-xl font-bold text-slate-700 mb-2">Không tìm thấy Workflow</h1>
        <p className="text-slate-500 mb-6">Workflow ID "{id}" không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Quay lại Builder
        </button>
      </div>
    );
  }

  const startNode = workflow.nodes.find(n => n.type === 'trigger');
  const fields = (startNode?.data?.fields as any[]) || [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Play size={18} className="text-indigo-600" />
              Chạy Workflow
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-slate-600">Live</span>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Input Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText size={18} className="text-slate-500" />
              {startNode?.data?.label as string || 'Form Nhập Liệu'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {startNode?.data?.description as string || 'Vui lòng điền các thông tin bên dưới để bắt đầu luồng.'}
            </p>
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto">
            <form id="workflow-form" onSubmit={handleSubmit} className="space-y-5">
              {fields.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-sm text-slate-500 italic">Workflow này không yêu cầu tham số đầu vào.</p>
                </div>
              ) : (
                fields.map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        required
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                        rows={4}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                        placeholder={`Nhập ${field.label.toLowerCase()}...`}
                      />
                    ) : (
                      <input
                        required
                        type="text"
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                        placeholder={`Nhập ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))
              )}
            </form>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50">
            <button
              form="workflow-form"
              type="submit"
              disabled={status === 'running'}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === 'running' ? (
                <><Loader2 size={18} className="animate-spin" /> Đang thực thi...</>
              ) : (
                <><Send size={18} /> Gửi dữ liệu & Chạy Workflow</>
              )}
            </button>
          </div>
        </div>

        {/* Right Panel: Execution Terminal */}
        <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden flex flex-col h-[calc(100vh-120px)]">
          <div className="px-6 py-3 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <h2 className="font-bold text-slate-300 flex items-center gap-2 text-sm">
              <Terminal size={16} className="text-emerald-500" />
              Execution Terminal
            </h2>
            {status === 'running' && <Loader2 size={14} className="text-emerald-500 animate-spin" />}
          </div>
          
          <div className="p-6 flex-1 overflow-y-auto font-mono text-xs space-y-3">
            {logs.length === 0 ? (
              <div className="text-slate-600 italic flex flex-col items-center justify-center h-full gap-3">
                <Bot size={32} className="opacity-20" />
                Chưa có dữ liệu thực thi. Hãy điền form và nhấn Chạy.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span className={`
                    ${log.type === 'info' ? 'text-slate-300' : ''}
                    ${log.type === 'success' ? 'text-emerald-400 font-semibold' : ''}
                    ${log.type === 'error' ? 'text-red-400 font-semibold' : ''}
                    ${log.type === 'process' ? 'text-indigo-300' : ''}
                  `}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
            {status === 'running' && (
              <div className="flex gap-3">
                <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-slate-400 animate-pulse">_</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
