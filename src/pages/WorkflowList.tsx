import React, { useState, useEffect } from 'react';
import { workflowService, Workflow } from '../services/workflowService';
import { Plus, Trash2, ArrowLeft, Bot, Calendar, ChevronRight } from 'lucide-react';

interface WorkflowListProps {
  onBack: () => void;
  onEditWorkflow: (id: string | null) => void;
}

export default function WorkflowList({ onBack, onEditWorkflow }: WorkflowListProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    setWorkflows(workflowService.getWorkflows());
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    
    const newWorkflow = workflowService.saveWorkflow({
      name: newName.trim(),
      description: newDesc.trim(),
      nodes: [],
      edges: []
    });
    
    onEditWorkflow(newWorkflow.id);
  };

  const handleDelete = (id: string) => {
    workflowService.deleteWorkflow(id);
    setWorkflows(workflowService.getWorkflows());
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold tracking-tight">Workflows</h1>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm font-medium text-sm"
        >
          <Plus size={18} />
          Create New
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6">
        {isAdding && (
          <div className="mb-8 bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-base font-bold mb-4">New Workflow</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Name</label>
                <input 
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Customer Support Bot"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-1">Description</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What does this workflow do?"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Save Workflow
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {workflows.length === 0 ? (
          <div className="py-20 text-center opacity-60">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold">No workflows yet</h3>
            <p className="text-sm">Create your first workflow to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {workflows.map((w) => (
              <div 
                key={w.id}
                onClick={() => onEditWorkflow(w.id)}
                className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{w.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{w.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Calendar size={12} />
                        {new Date(w.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(w.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight className="text-gray-300" size={20} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
