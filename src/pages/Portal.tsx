import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, Settings } from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
import { workflowService, Workflow } from '../services/workflowService';

export default function Portal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [workflows, setWorkflows] = useState<Record<string, Workflow>>({});
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Seed demo data if needed
    workflowService.seedDemo();
    
    const allWorkflows = workflowService.getAll();
    setWorkflows(allWorkflows);
    
    const searchParams = new URLSearchParams(location.search);
    const idFromUrl = searchParams.get('id');
    
    if (idFromUrl && allWorkflows[idFromUrl]) {
      setSelectedWorkflowId(idFromUrl);
    } else {
      const entries = Object.keys(allWorkflows);
      if (entries.length > 0 && !selectedWorkflowId) {
        setSelectedWorkflowId(entries[0]);
      }
    }
    setIsLoaded(true);
  }, [location.search]);

  const handleClearCache = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ dữ liệu workflow và reset về mặc định?')) {
      localStorage.removeItem('workflows');
      window.location.reload();
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden">
      {/* Top Navigation for Dev (Optional, can be hidden in production embed) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex justify-end gap-2 shrink-0">
        <button 
          onClick={handleClearCache}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-md transition-colors"
        >
          Xóa Cache
        </button>
        <button 
          onClick={() => navigate('/builder')}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors"
        >
          <Settings size={14} />
          Quản lý Workflow (Dev)
        </button>
      </div>

      {/* Main Content - Full Screen Chat Area */}
      <main className="flex-1 flex flex-col h-full p-0 sm:p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {Object.keys(workflows).length > 0 ? (
          <div className="flex-1 h-full shadow-xl rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border border-slate-200 bg-white">
            <ChatInterface 
              workflows={workflows} 
              defaultWorkflowId={selectedWorkflowId} 
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8 m-4 sm:m-0">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <Bot size={40} className="text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Chưa có Trợ lý nào</h2>
            <p className="text-slate-500 max-w-md mb-8">
              Hệ thống chưa có workflow nào được xuất bản. Vui lòng tạo một trợ lý để bắt đầu.
            </p>
            <button 
              onClick={() => navigate('/builder')}
              className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Tạo trợ lý đầu tiên
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
