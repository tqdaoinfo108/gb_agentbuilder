import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, Edit2, Check, Save } from 'lucide-react';
import { faqService, FAQ } from '../services/faqService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOptimizeEnabled: boolean;
  onToggleOptimize: (enabled: boolean) => void;
}

export default function FAQModal({ isOpen, onClose, isOptimizeEnabled, onToggleOptimize }: FAQModalProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFaqs(faqService.getFAQs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      faqService.deleteFAQ(id);
      setFaqs(faqService.getFAQs());
    }
  };

  const handleEditStart = (faq: FAQ) => {
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  };

  const handleEditSave = () => {
    if (!editQuestion.trim() || !editAnswer.trim()) return;
    
    const updatedFaqs = faqs.map(f => 
      f.id === editingId ? { ...f, question: editQuestion, answer: editAnswer } : f
    );
    faqService.saveFAQs(updatedFaqs);
    setFaqs(updatedFaqs);
    setEditingId(null);
  };

  const handleAddSave = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    
    faqService.addFAQ(newQuestion, newAnswer);
    setFaqs(faqService.getFAQs());
    setIsAdding(false);
    setNewQuestion('');
    setNewAnswer('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Tối ưu câu trả lời (FAQ)</h2>
            <p className="text-sm text-gray-500 mt-0.5">Quản lý thư viện câu hỏi thường gặp để trả lời nhanh</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium text-gray-700">Kích hoạt:</span>
              <div className={cn(
                "w-11 h-6 rounded-full transition-colors relative",
                isOptimizeEnabled ? "bg-emerald-500" : "bg-gray-300"
              )}>
                <input 
                  type="checkbox" 
                  className="sr-only"
                  checked={isOptimizeEnabled}
                  onChange={(e) => onToggleOptimize(e.target.checked)}
                />
                <div className={cn(
                  "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm",
                  isOptimizeEnabled ? "translate-x-5" : "translate-x-0"
                )} />
              </div>
            </label>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Tìm kiếm câu hỏi hoặc câu trả lời..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus size={18} />
            Thêm mới
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
          <div className="space-y-4">
            
            {/* Add New Form */}
            {isAdding && (
              <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm shadow-indigo-100/50">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Câu hỏi</label>
                    <input 
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Nhập câu hỏi..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Câu trả lời tối ưu</label>
                    <textarea 
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Nhập câu trả lời..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px] resize-y"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      onClick={() => setIsAdding(false)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Hủy
                    </button>
                    <button 
                      onClick={handleAddSave}
                      disabled={!newQuestion.trim() || !newAnswer.trim()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FAQ List */}
            {filteredFaqs.length === 0 && !isAdding ? (
              <div className="text-center py-12 text-gray-500">
                <p>Không tìm thấy dữ liệu phù hợp.</p>
              </div>
            ) : (
              filteredFaqs.map(faq => (
                <div key={faq.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-indigo-200 transition-colors group">
                  {editingId === faq.id ? (
                    <div className="space-y-3">
                      <input 
                        type="text"
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <textarea 
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px] resize-y"
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          Hủy
                        </button>
                        <button 
                          onClick={handleEditSave}
                          disabled={!editQuestion.trim() || !editAnswer.trim()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          <Check size={16} />
                          Lưu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="text-sm font-bold text-gray-900">{faq.question}</h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditStart(faq)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(faq.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
