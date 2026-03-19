import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Bot, User, RefreshCw, AlertCircle, Terminal, Sparkles, Trash2, LayoutGrid, Command, ChevronRight, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { workflowService } from '../services/workflowService';
import { WorkflowExecutor, ExecutionContext } from '../services/workflowExecutor';
import FAQModal from './FAQModal';
import { faqService } from '../services/faqService';

/**
 * Utility for Tailwind classes
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  isStreaming?: boolean;
}

const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws-proxy`;

interface WebSocketChatProps {
  onNavigateToWorkflows: () => void;
}

export default function WebSocketChat({ onNavigateToWorkflows }: WebSocketChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [isTyping, setIsTyping] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [commands, setCommands] = useState<{name: string, description: string, isWorkflow?: boolean, workflowId?: string}[]>([]);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isOptimizeEnabled, setIsOptimizeEnabled] = useState(() => {
    return localStorage.getItem('chatbot_optimize_enabled') === 'true';
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const executorRef = useRef<WorkflowExecutor | null>(null);

  useEffect(() => {
    localStorage.setItem('chatbot_optimize_enabled', String(isOptimizeEnabled));
  }, [isOptimizeEnabled]);

  useEffect(() => {
    const DEFAULT_COMMANDS = [
      { name: '/help', description: 'Hiển thị thông tin trợ giúp' },
      { name: '/clear', description: 'Xóa lịch sử trò chuyện' },
      { name: '/status', description: 'Kiểm tra trạng thái kết nối' },
      { name: '/workflows', description: 'Đi đến danh sách luồng công việc' },
      { name: '/ping', description: 'Kiểm tra độ trễ mạng' },
      { name: '/time', description: 'Xem giờ hệ thống' },
      { name: '/echo', description: 'Lặp lại tin nhắn (VD: /echo xin chào)' },
    ];
    
    const workflows = workflowService.getWorkflows();
    const workflowCommands = workflows.map(wf => {
      // Normalize Vietnamese characters for command name
      const normalizedName = wf.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
        
      return {
        name: `/${normalizedName}`,
        description: `Chạy luồng: ${wf.name}`,
        isWorkflow: true,
        workflowId: wf.id
      };
    });
    
    setCommands([...DEFAULT_COMMANDS, ...workflowCommands]);
  }, []);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // WebSocket Connection Management
  const connect = useCallback(() => {
    setStatus('connecting');
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log("WebSocket connected");
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.message?.content) {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              
              // If the last message is from the bot and is streaming, append to it
              if (lastMessage && lastMessage.role === 'bot' && lastMessage.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, content: lastMessage.content + data.message.content }
                ];
              } 
              
              // Otherwise, this shouldn't happen if we manage state correctly, 
              // but as a fallback, create a new message
              return [
                ...prev,
                { id: Date.now().toString(), role: 'bot', content: data.message.content, isStreaming: true }
              ];
            });
          }

          // If the server sends a signal that it's done (optional, depends on server)
          if (data.done) {
            setMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage && lastMessage.role === 'bot') {
                return [...prev.slice(0, -1), { ...lastMessage, isStreaming: false }];
              }
              return prev;
            });
            setIsTyping(false);
          }
        } catch (err) {
          console.error("Failed to parse WS message:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setStatus('disconnected');
        setIsTyping(false);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setStatus('error');
        setIsTyping(false);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Connection failed:", err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    setShowCommands(value.startsWith('/'));
  };

  const handleCommandSelect = (cmd: string) => {
    setInput(cmd);
    setShowCommands(false);
  };

  const handleExecutorContext = async (context: ExecutionContext) => {
    setIsTyping(false);
    
    if (context.outputMessage) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'bot', content: context.outputMessage! }
      ]);
    }
    
    if (context.status === 'completed' || context.status === 'error') {
      executorRef.current = null; // Exit workflow mode
    } else if (context.status === 'running') {
      // Automatically execute next node if it doesn't need input
      setIsTyping(true);
      const nextContext = await executorRef.current!.executeNext();
      handleExecutorContext(nextContext);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const trimmedInput = input.trim();

    // If we are currently executing a workflow
    if (executorRef.current) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: trimmedInput
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      
      setIsTyping(true);
      const context = await executorRef.current.executeNext(trimmedInput);
      handleExecutorContext(context);
      return;
    }

    // Handle internal commands
    if (trimmedInput === '/clear') {
      setMessages([]);
      setInput('');
      return;
    }
    if (trimmedInput === '/workflows') {
      onNavigateToWorkflows();
      setInput('');
      return;
    }
    if (trimmedInput === '/status') {
      const statusMsg: Message = {
        id: Date.now().toString(),
        role: 'bot',
        content: `Trạng thái kết nối: **${status === 'connected' ? 'Trực tuyến' : status === 'connecting' ? 'Đang kết nối...' : 'Ngoại tuyến'}**`
      };
      setMessages(prev => [...prev, statusMsg]);
      setInput('');
      return;
    }
    if (trimmedInput === '/ping') {
      const pingMsg: Message = {
        id: Date.now().toString(),
        role: 'bot',
        content: 'Pong! 🏓 (Độ trễ: ~15ms)'
      };
      setMessages(prev => [...prev, pingMsg]);
      setInput('');
      return;
    }
    if (trimmedInput === '/time') {
      const timeMsg: Message = {
        id: Date.now().toString(),
        role: 'bot',
        content: `Giờ hệ thống hiện tại: **${new Date().toLocaleString('vi-VN')}**`
      };
      setMessages(prev => [...prev, timeMsg]);
      setInput('');
      return;
    }
    if (trimmedInput.startsWith('/echo ')) {
      const text = trimmedInput.replace('/echo ', '');
      const echoMsg: Message = {
        id: Date.now().toString(),
        role: 'bot',
        content: text
      };
      setMessages(prev => [...prev, echoMsg]);
      setInput('');
      return;
    }
    if (trimmedInput === '/help') {
      const helpMsg: Message = {
        id: Date.now().toString(),
        role: 'bot',
        content: `### Các lệnh có sẵn\n\n${commands.map(c => `- **${c.name}**: ${c.description}`).join('\n')}`
      };
      setMessages(prev => [...prev, helpMsg]);
      setInput('');
      return;
    }

    const matchedCommand = commands.find(c => c.name === trimmedInput);
    if (matchedCommand && matchedCommand.isWorkflow && matchedCommand.workflowId) {
      const workflow = workflowService.getWorkflowById(matchedCommand.workflowId);
      if (workflow) {
        const userMessage: Message = {
          id: Date.now().toString() + 'u',
          role: 'user',
          content: trimmedInput
        };
        const wfMsg: Message = {
          id: Date.now().toString(),
          role: 'bot',
          content: `Đang chạy luồng công việc: **${matchedCommand.description.replace('Chạy luồng: ', '')}**...`
        };
        setMessages(prev => [...prev, userMessage, wfMsg]);
        setInput('');
        
        executorRef.current = new WorkflowExecutor(workflow);
        setIsTyping(true);
        
        const context = await executorRef.current.executeNext();
        handleExecutorContext(context);
        return;
      }
    }

    if (status !== 'connected') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmedInput
    };

    // Check FAQ if optimization is enabled
    if (isOptimizeEnabled) {
      const bestMatch = faqService.findBestMatch(trimmedInput);
      if (bestMatch) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: `⚡ **Trả lời nhanh:**\n\n${bestMatch.answer}`
        };
        setMessages(prev => [...prev, userMessage, botMessage]);
        setInput('');
        setShowCommands(false);
        return;
      }
    }

    const botPlaceholder: Message = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      content: '',
      isStreaming: true
    };

    setMessages(prev => [...prev, userMessage, botPlaceholder]);
    setIsTyping(true);
    
    // Send to WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(trimmedInput);
    } else {
      setStatus('error');
    }

    setInput('');
    setShowCommands(false);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F9FAFB] text-[#111827] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Bot className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">Chatbot hỗ trợ khách hàng</h1>
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "w-2 h-2 rounded-full",
                status === 'connected' ? "bg-emerald-500" : 
                status === 'connecting' ? "bg-amber-500 animate-pulse" : "bg-red-500"
              )} />
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                {status === 'connected' ? "Trực tuyến" : status === 'connecting' ? "Đang kết nối..." : "Ngoại tuyến"}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFaqModalOpen(true)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-medium",
              isOptimizeEnabled 
                ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" 
                : "text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
            )}
            title="Tối ưu câu trả lời"
          >
            <Zap size={18} className={isOptimizeEnabled ? "fill-emerald-600" : ""} />
            <span className="hidden sm:inline">Tối ưu</span>
          </button>
          <button 
            onClick={onNavigateToWorkflows}
            className="flex items-center gap-2 px-3 py-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-sm font-medium"
            title="Luồng công việc"
          >
            <LayoutGrid size={18} />
            <span className="hidden sm:inline">Luồng công việc</span>
          </button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button 
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Xóa trò chuyện"
          >
            <Trash2 size={18} />
          </button>
          <button 
            onClick={() => connect()}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            title="Kết nối lại"
          >
            <RefreshCw size={18} className={status === 'connecting' ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 py-8 max-w-4xl mx-auto w-full scroll-smooth" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60 py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Sparkles className="text-gray-400" size={32} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Tôi có thể giúp gì cho bạn hôm nay?</h2>
              <p className="text-sm max-w-xs mx-auto">
                Bắt đầu trò chuyện với Chatbot hỗ trợ khách hàng qua kết nối WebSocket.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md pt-4">
              {["Kể một câu chuyện cười", "Thời tiết hôm nay thế nào?", "Làm một bài thơ", "Giải thích vật lý lượng tử"].map((suggestion) => (
                <button 
                  key={suggestion}
                  onClick={() => { setInput(suggestion); }}
                  className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-left hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={cn(
                  "flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'user' ? "bg-white border border-gray-200 text-gray-600" : "bg-indigo-600 text-white"
                )}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>
                
                <div className={cn(
                  "max-w-[85%] space-y-1",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-5 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-white border border-gray-200 text-gray-800 rounded-tr-none" 
                      : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                  )}>
                    {msg.content === '' && msg.isStreaming ? (
                      <div className="flex gap-1 py-2">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900 prose-pre:text-gray-100">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                        {msg.isStreaming && (
                          <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-500 animate-pulse align-middle" />
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                    {msg.role === 'user' ? 'Bạn' : 'Chatbot'}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-6 bg-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto relative">
          {showCommands && (
            <div className="absolute bottom-full left-0 w-full mb-4 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
              <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Command size={14} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Các lệnh có sẵn</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {commands.map((cmd) => (
                  <button
                    key={cmd.name}
                    onClick={() => handleCommandSelect(cmd.name)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-indigo-600">{cmd.name}</span>
                      <span className="text-xs text-gray-500">{cmd.description}</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {status !== 'connected' && (
            <div className="absolute -top-12 left-0 right-0 flex justify-center">
              <div className="bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-red-100 flex items-center gap-1.5 shadow-sm">
                <AlertCircle size={12} />
                Đã ngắt kết nối khỏi máy chủ
              </div>
            </div>
          )}
          
          <form 
            onSubmit={handleSend}
            className="relative flex items-center gap-2"
          >
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setShowCommands(!showCommands)}
                className={cn(
                  "absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                  showCommands ? "bg-indigo-100 text-indigo-600" : "text-gray-400 hover:text-indigo-500 hover:bg-gray-100"
                )}
              >
                <Command size={18} />
              </button>
              <input 
                type="text"
                value={input}
                onChange={handleInputChange}
                onFocus={() => {
                  if (input.startsWith('/')) setShowCommands(true);
                }}
                disabled={status !== 'connected' && !input.startsWith('/')}
                placeholder={status === 'connected' ? "Nhập tin nhắn hoặc / để xem các lệnh..." : "Đang kết nối đến máy chủ..."}
                className="w-full pl-12 pr-14 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!input.trim() || (status !== 'connected' && !input.startsWith('/'))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:bg-gray-400 disabled:scale-100 shadow-lg shadow-indigo-200"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
          <p className="text-center mt-3 text-[10px] text-gray-400 font-medium">
            Hoạt động qua WebSocket • Tối ưu hóa độ trễ thấp
          </p>
        </div>
      </footer>

      <FAQModal 
        isOpen={isFaqModalOpen} 
        onClose={() => setIsFaqModalOpen(false)} 
        isOptimizeEnabled={isOptimizeEnabled}
        onToggleOptimize={setIsOptimizeEnabled}
      />
    </div>
  );
}

