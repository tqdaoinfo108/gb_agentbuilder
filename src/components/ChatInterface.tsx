import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, User, Send, Loader2, RefreshCcw, FileText, Command, Sparkles, Link as LinkIcon, BrainCircuit, X, Plus, Trash2 } from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import Fuse from 'fuse.js';
import { GoogleGenAI } from '@google/genai';

type Message = {
  id: string;
  role: 'bot' | 'user' | 'system';
  content: string;
  responseType?: 'text' | 'link' | 'image' | 'json';
};

interface ChatInterfaceProps {
  workflows: Record<string, any>;
  defaultWorkflowId: string | null;
}

const slugify = (str: string) => {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
};

const parseCommand = (input: string) => {
  const trimmed = input.trim();
  const cmdMatch = trimmed.match(/^\/([^\s]+)/);
  if (!cmdMatch) return null;
  
  const slug = cmdMatch[1].toLowerCase();
  const argsString = trimmed.substring(cmdMatch[0].length).trim();
  
  // Simple arg parsing: space separated
  const args = argsString ? argsString.split(/\s+/) : [];
  
  return { slug, args };
};

const generatePrompt = (companyName: string, trainingData: any[], memory: any[] = []) => {
  const context = trainingData
    .map((item) => `Hỏi/Từ khóa: ${item.keywords}\nĐáp: ${item.answer}`)
    .join("\n\n");

  const memoryContext = memory.length > 0 
    ? memory.map((m, i) => `Lịch sử ${i+1}: ${JSON.stringify(m)}`).join('\n')
    : 'Trống';

  return `Bạn là một trợ lý cao cấp trong hệ thống workflow automation của công ty ${companyName}.
Nhiệm vụ của bạn là xử lý dữ liệu đầu vào cùng với ngữ cảnh, dữ liệu từ các bước trước và bộ nhớ để thực hiện yêu cầu.

QUY TRÌNH KỸ THUẬT NỘI BỘ BẠN PHẢI TUÂN THỦ:
(1) Phân tích và chuẩn hóa dữ liệu đầu vào, kiểm tra tính hợp lệ và xác định các field quan trọng.
(2) Kiểm tra cache trong context hoặc memory, nếu dữ liệu đã tồn tại và còn hợp lệ thì sử dụng ngay và đánh dấu source là "cache".
(3) Nếu cần gọi API hoặc tool, lựa chọn hành động phù hợp nhất và chuẩn bị tham số đúng format.
(4) Xử lý logic quyết định dựa trên dữ liệu (bao gồm condition, phân loại, hoặc suy luận có kiểm soát), đảm bảo không suy đoán ngoài dữ liệu được cung cấp.
(5) Xử lý lỗi kỹ thuật như thiếu field, sai kiểu dữ liệu bằng cách retry tối đa 2 lần, nếu vẫn lỗi thì fallback sang phương án khác hoặc trả về lỗi có kiểm soát.
(6) Tối ưu kết quả cho môi trường web demo: ngắn gọn, rõ ràng, không dư thừa, dễ hiển thị UI.
(7) Chuẩn hóa output theo schema JSON hợp lệ.

NGỮ CẢNH KIẾN THỨC:
${context || '(Chưa có dữ liệu training nào)'}

BỘ NHỚ (MEMORY):
${memoryContext}

QUY TẮC BẮT BUỘC:
- Không tạo dữ liệu giả.
- Không vượt quyền hành động.
- Chỉ sử dụng dữ liệu có sẵn, nếu không đủ dữ liệu thì trả về lỗi thay vì đoán.
- Luôn trả về kết quả cuối cùng dưới dạng JSON với các trường:
  {
    "status": "success" | "error",
    "action": string | null,
    "data": any,
    "error": string | null,
    "metadata": {
      "source": "cache" | "api" | "generated",
      "confidence": number (0-1),
      "steps": string[]
    }
  }`;
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export default function ChatInterface({ workflows, defaultWorkflowId }: ChatInterfaceProps) {
  const navigate = useNavigate();
  // activeWfId = null means "General Chat Mode"
  const [activeWfId, setActiveWfId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [memory, setMemory] = useState<any[]>([]);
  
  // Training State
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [trainingData, setTrainingData] = useState<{id: string, keywords: string, answer: string}[]>(() => {
    const saved = localStorage.getItem('ai_training_data');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', keywords: 'xin chào, hi, hello, chào bạn', answer: 'Chào bạn! Tôi là trợ lý cục bộ. Tôi có thể giúp gì cho bạn?' },
      { id: '2', keywords: 'bạn là ai, who are you, tên gì', answer: 'Tôi là một mô hình ngôn ngữ cục bộ chạy trực tiếp trên trình duyệt của bạn. Bạn có thể "huấn luyện" tôi bằng cách thêm các câu hỏi và câu trả lời mới!' },
      { id: '3', keywords: 'tạm biệt, bye, hẹn gặp lại', answer: 'Tạm biệt! Hẹn gặp lại bạn sau.' },
    ];
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  useEffect(() => {
    localStorage.setItem('ai_training_data', JSON.stringify(trainingData));
  }, [trainingData]);

  const handleAddTraining = () => {
    if (!newKeyword.trim() || !newAnswer.trim()) return;
    setTrainingData(prev => [...prev, {
      id: Date.now().toString(),
      keywords: newKeyword,
      answer: newAnswer
    }]);
    setNewKeyword('');
    setNewAnswer('');
  };

  const handleDeleteTraining = (id: string) => {
    setTrainingData(prev => prev.filter(item => item.id !== id));
  };

  // State for collecting form data in workflow mode
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isWorkflowFinished, setIsWorkflowFinished] = useState(false);

  // Command Menu State
  const [showCommandMenu, setShowCommandMenu] = useState(false);
  const [commandFilter, setCommandFilter] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const availableCommands = Object.entries(workflows).map(([id, wf]) => {
    const trigger = wf.nodes.find((n: Node) => n.type === 'trigger');
    const title = trigger?.data?.label || wf.name || 'workflow';
    const description = trigger?.data?.description || '';
    const slug = wf.slug || slugify(title);
    const fields = (trigger?.data?.fields as any[]) || [];
    return { id, title, description, slug, fields, wf };
  });

  const runWorkflowSimulation = async (wf: any, finalData: Record<string, string>) => {
    setIsProcessing(true);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    let workflowContext: Record<string, any> = { "Thông tin ban đầu": finalData };
    
    try {
      const { nodes, edges } = wf;
      const startNode = nodes.find((n: Node) => n.type === 'trigger');
      if (!startNode) throw new Error('Workflow không hợp lệ');

      // Collect available tools from the workflow
      const availableTools = nodes
        .filter((n: Node) => n.type === 'tool')
        .map((n: Node) => ({
          name: n.data.label,
          description: n.data.description,
          parameters: n.data.parameters
        }));

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `[LOG] Khởi tạo quy trình: ${wf.name || 'Workflow'}` }]);

      let currentNode = startNode;
      let finished = false;
      let stepCount = 0;
      const MAX_STEPS = 20;

      while (!finished && stepCount < MAX_STEPS) {
        stepCount++;
        const outgoingEdges = edges.filter((e: Edge) => e.source === currentNode.id);
        if (outgoingEdges.length === 0) break;

        let nextEdge = outgoingEdges[0];

        if (currentNode.type === 'condition') {
          const conditionLabel = currentNode.data.label || 'Kiểm tra điều kiện';
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `[LOG] Đang kiểm tra logic: ${conditionLabel}...` }]);
          await delay(800);

          const cases = (currentNode.data.cases as any[]) || [];
          const branches = outgoingEdges.map((e: any) => {
            const matchedCase = cases.find(c => c.label === e.label);
            return {
              id: e.id,
              label: e.label || 'Mặc định',
              condition: matchedCase?.condition || e.label || 'Mặc định',
              target: e.target
            };
          });

          const decisionPrompt = `
BẠN LÀ BỘ NÃO ĐIỀU PHỐI WORKFLOW (DECISION AGENT).
DỮ LIỆU HIỆN TẠI (Context):
${JSON.stringify(workflowContext, null, 2)}

MEMORY (Lịch sử):
${JSON.stringify(memory, null, 2)}

YÊU CẦU:
Dựa trên dữ liệu hiện tại (có thể là JSON, XML, Boolean, hoặc Văn bản thuần túy), hãy chọn nhánh đi tiếp phù hợp nhất.

CÁC NHÁNH ĐIỀU KIỆN:
${branches.map((b, i) => `- Nhánh "${b.label}" (Điều kiện: ${b.condition}) -> ID: ${b.id}`).join('\n')}

QUY TẮC QUYẾT ĐỊNH:
1. Phân tích cấu trúc dữ liệu (nếu là JSON/XML, hãy truy cập các field tương ứng).
2. So khớp logic của điều kiện với giá trị thực tế trong dữ liệu.
3. Nếu không có nhánh nào khớp rõ ràng, hãy chọn nhánh "Mặc định" hoặc nhánh có logic gần nhất.
4. CHỈ TRẢ VỀ DUY NHẤT ID CỦA NHÁNH ĐƯỢC CHỌN.
          `;

          const decisionResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: decisionPrompt,
          });
          
          const selectedId = decisionResponse.text?.trim().replace(/['"\[\]]/g, '') || '';
          const foundEdge = branches.find(b => selectedId.includes(b.id) || (b.label && selectedId.toLowerCase().includes(b.label.toLowerCase())));
          
          if (foundEdge) {
            nextEdge = foundEdge;
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `[LOG] Hệ thống quyết định: "${foundEdge.label}"` }]);
          } else {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `[LOG] Không khớp điều kiện, đi theo nhánh mặc định.` }]);
          }
        }

        const nextNode = nodes.find((n: Node) => n.id === nextEdge.target);
        if (!nextNode) break;
        
        await delay(1000);

        if (nextNode.type === 'agent') {
          const method = nextNode.data.analysisMethod || 'prompt';
          const label = nextNode.data.label || 'Agent';
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `[LOG] Đang xử lý: ${label} (${method.toUpperCase()})...` }]);

          const agentPrompt = `
BẠN LÀ MỘT AGENT TRONG HỆ THỐNG WORKFLOW AUTOMATION.
Nhiệm vụ của bạn là xử lý node: "${label}"

DỮ LIỆU ĐẦU VÀO:
- Input: ${JSON.stringify(finalData, null, 2)}
- Context hiện tại: ${JSON.stringify(workflowContext, null, 2)}
- Memory (Lịch sử): ${JSON.stringify(memory, null, 2)}
- Yêu cầu cụ thể: "${nextNode.data.prompt || 'Xử lý dữ liệu.'}"
- Công cụ khả dụng (available_tools): ${JSON.stringify(availableTools, null, 2)}

QUY TRÌNH KỸ THUẬT NỘI BỘ (7 BƯỚC):
1. Phân tích và chuẩn hóa dữ liệu đầu vào.
2. Kiểm tra cache trong context/memory.
3. Lựa chọn hành động/công cụ phù hợp nhất.
4. Xử lý logic quyết định.
5. Xử lý lỗi và ngoại lệ.
6. Tối ưu hóa kết quả đầu ra.
7. Đảm bảo output đúng JSON schema.

QUY TẮC BẮT BUỘC:
- KHÔNG tạo dữ liệu giả.
- KHÔNG vượt quá quyền hạn.
- TRẢ VỀ LỖI nếu thiếu dữ liệu.

ĐỊNH DẠNG TRẢ VỀ (JSON):
{
  "status": "success" | "error",
  "action": "string (tên hành động đã thực hiện)",
  "data": any (kết quả xử lý),
  "error": "string (nếu có)",
  "metadata": { 
    "source": "cache" | "api" | "generated", 
    "confidence": number,
    "steps_executed": string[]
  }
}
          `;

          let retryCount = 0;
          let success = false;

          while (retryCount < 2 && !success) {
            try {
              const agentResponse = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: agentPrompt,
              });
              
              const resultText = agentResponse.text?.trim() || '{}';
              const cleanJson = resultText.replace(/```json|```/g, '').trim();
              
              const resultData = JSON.parse(cleanJson);
              
              if (resultData.status === 'error') {
                throw new Error(resultData.error || 'Lỗi không xác định từ Agent');
              }

              workflowContext[label] = resultData.data || resultData;
              
              // Update memory
              setMemory(prev => [...prev.slice(-4), { step: label, output: resultData.data }]);
              
              setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `[LOG] ${label} hoàn tất (${resultData.metadata?.source || 'api'}).` }]);
              success = true;
            } catch (err) {
              retryCount++;
              if (retryCount < 2) {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `[LOG] ${label} thất bại, đang thử lại lần ${retryCount}...` }]);
                await delay(1500);
              } else {
                setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `[ERR] Lỗi tại bước ${label}: ${err instanceof Error ? err.message : 'Unknown error'}` }]);
                finished = true;
                break;
              }
            }
          }
          if (!success) break;

        } else if (nextNode.type === 'tool') {
          // Tool nodes are definitions, we just log and move on
          setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `[LOG] Đã đăng ký công cụ: ${nextNode.data.label}` }]);
          currentNode = nextNode;
          continue;
        } else if (nextNode.type === 'output') {
          await delay(1000);
          setMessages(prev => prev.filter(m => !m.content.startsWith('[LOG]')));
          
          const finalPrompt = `
Dựa trên kết quả workflow: ${JSON.stringify(workflowContext, null, 2)}
Hãy tạo câu trả lời cuối cùng thân thiện.
Nội dung gốc: "${nextNode.data.result || 'Xong'}"
          `;

          let finalContent = nextNode.data.result || 'Đã hoàn thành.';
          try {
            const finalResponse = await ai.models.generateContent({
              model: "gemini-3-flash-preview",
              contents: finalPrompt,
            });
            finalContent = finalResponse.text || finalContent;
          } catch (err) {}

          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'bot', 
            content: finalContent,
            responseType: nextNode.data.responseType || 'text'
          }]);
          finished = true;
          break;
        }
        
        currentNode = nextNode;
      }
      
      if (stepCount >= MAX_STEPS) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: '[ERR] Workflow quá dài hoặc bị lặp vô tận.' }]);
      }

    } catch (error) {
      console.error("Workflow Execution Error:", error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: '[ERR] Đã xảy ra lỗi hệ thống khi chạy workflow.' }]);
    } finally {
      setIsProcessing(false);
      setIsWorkflowFinished(true);
    }
  };

  const executeCommand = (cmdDef: any, userText: string, initialArgs: string[] = []) => {
    setActiveWfId(cmdDef.id);
    setIsWorkflowFinished(false);
    
    // Pre-fill formData with initialArgs
    const initialFormData: Record<string, string> = {};
    cmdDef.fields.forEach((field: any, index: number) => {
      if (initialArgs[index]) {
        initialFormData[field.name] = initialArgs[index];
      }
    });
    
    setFormData(initialFormData);
    const nextIndex = Object.keys(initialFormData).length;
    setCurrentFieldIndex(nextIndex);

    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), role: 'user', content: userText }
    ]);

    if (nextIndex >= cmdDef.fields.length) {
      // All fields provided inline
      runWorkflowSimulation(cmdDef.wf, initialFormData);
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'bot',
          content: `Đã kích hoạt quy trình: **${cmdDef.title}**\n\nĐể bắt đầu, vui lòng cung cấp thông tin:\n👉 **${cmdDef.fields[nextIndex].label}**`
        }]);
      }, 400);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userText = inputValue.trim();
    setInputValue('');
    setShowCommandMenu(false);

    // 1. Check for command
    if (userText.startsWith('/')) {
      const parsed = parseCommand(userText);
      if (parsed) {
        const { slug, args } = parsed;
        const cmdDef = availableCommands.find(c => c.slug === slug);
        if (cmdDef) {
          executeCommand(cmdDef, userText, args);
          return;
        } else {
          // Command not found
          setMessages(prev => [
            ...prev,
            { id: Date.now().toString(), role: 'user', content: userText },
            { id: (Date.now() + 1).toString(), role: 'bot', content: `Lệnh /${slug} không tồn tại. Gõ / để xem danh sách lệnh.` }
          ]);
          return;
        }
      }
    }

    // 2. If workflow was finished, reset to General mode for new messages
    if (isWorkflowFinished) {
      setActiveWfId(null);
      setIsWorkflowFinished(false);
    }

    // Add user message to chat
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userText }]);

    // 3. Workflow Mode (Collecting fields)
    const activeCmd = availableCommands.find(c => c.id === activeWfId);
    if (activeWfId && activeCmd && !isWorkflowFinished) {
      const wf = activeCmd.wf;
      const fields = activeCmd.fields || [];

      if (fields.length === 0) {
        runWorkflowSimulation(wf, {});
        return;
      }

      if (currentFieldIndex < fields.length) {
        const currentField = fields[currentFieldIndex];
        const newFormData = { ...formData, [currentField.name]: userText };
        setFormData(newFormData);

        const nextIndex = currentFieldIndex + 1;
        setCurrentFieldIndex(nextIndex);

        if (nextIndex < fields.length) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'bot',
              content: `Đã ghi nhận. Tiếp theo, vui lòng cung cấp:\n👉 **${fields[nextIndex].label}**`
            }]);
          }, 500);
        } else {
          runWorkflowSimulation(wf, newFormData);
        }
      }
      return;
    }

    // 4. General Chat Mode (No active workflow)
    setIsProcessing(true);
      
      try {
        const fuse = new Fuse(trainingData, {
          keys: ['keywords', 'answer'],
          threshold: 0.6,
          includeScore: true
        });

        const results = fuse.search(userText);
        
        // Lấy top 5 kết quả phù hợp nhất làm context
        const relevantData = results.slice(0, 5).map(r => r.item);
        const contextData = relevantData.length > 0 ? relevantData : trainingData.slice(0, 10);

        const systemPrompt = generatePrompt("Demo Company", contextData, memory);

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: userText,
          config: {
            systemInstruction: systemPrompt
          }
        });
        
        const aiResponse = response.text || 'Xin lỗi, tôi không thể trả lời lúc này.';
        
        // Update memory
        setMemory(prev => [...prev.slice(-4), { user: userText, bot: aiResponse }]);

        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'bot',
          content: aiResponse,
        }]);
      } catch (error) {
        console.error("RAG Error:", error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'bot',
          content: 'Đã có lỗi xảy ra khi xử lý câu hỏi. Vui lòng thử lại.',
        }]);
      }
      
      setIsProcessing(false);
  };

  const handleReset = () => {
    setActiveWfId(null);
    setCurrentFieldIndex(0);
    setFormData({});
    setIsWorkflowFinished(false);
    setShowCommandMenu(false);
    
    setMessages([
      { 
        id: Date.now().toString(), 
        role: 'bot', 
        content: `Xin chào! Tôi là **Trợ lý Hỗ trợ Khách hàng**. 👋\n\nTôi có thể giúp bạn giải đáp thắc mắc hoặc thực hiện các yêu cầu dịch vụ.\n\n💬 Hãy đặt câu hỏi trực tiếp cho tôi.\n⚡ Hoặc gõ \`/\` để xem danh sách các quy trình hỗ trợ nhanh.` 
      }
    ]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (val.startsWith('/')) {
      const cmd = val.split(' ')[0].substring(1).toLowerCase();
      setCommandFilter(cmd);
      setShowCommandMenu(true);
    } else {
      setShowCommandMenu(false);
    }
  };

    const activeCmd = availableCommands.find(c => c.id === activeWfId);
    const currentFields = activeCmd?.fields || [];
    const currentField = currentFields[currentFieldIndex];

    return (
    <div className="flex flex-col h-full bg-slate-50 font-sans rounded-none sm:rounded-2xl overflow-hidden border-0 sm:border border-slate-200 shadow-sm relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 z-10 gap-3">
        <div className="flex flex-col">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            {activeWfId ? <Bot size={20} className="text-indigo-600" /> : <Sparkles size={20} className="text-indigo-600" />}
            <span className="truncate max-w-[200px] sm:max-w-none">
              {activeWfId && activeCmd ? `Trợ lý - ${activeCmd.title}` : 'Trợ lý Hỗ trợ Khách hàng'}
            </span>
          </h2>
          <p className="text-[10px] sm:text-xs text-emerald-600 mt-0.5 flex items-center gap-1.5 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Trực tuyến (RAG)
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {activeWfId && (
            <>
              <button 
                onClick={() => navigate(`/builder?id=${activeWfId}`)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                title="Chỉnh sửa Workflow"
              >
                <BrainCircuit size={14} />
                <span>Sửa</span>
              </button>
              <button 
                onClick={() => navigate(`/run/${activeWfId}`)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                title="Chạy dạng Form"
              >
                <FileText size={14} />
                <span>Form</span>
              </button>
            </>
          )}
          <button 
            onClick={() => handleReset()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
            title="Làm mới cuộc trò chuyện"
          >
            <RefreshCcw size={14} />
            <span>Mới</span>
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" onClick={() => setShowCommandMenu(false)}>
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg) => {
            if (msg.role === 'system') {
              return (
                <div key={msg.id} className="flex justify-center w-full my-2 animate-in fade-in">
                  <span className="text-xs text-slate-400 italic flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
                    <Loader2 size={12} className="animate-spin" />
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
                {/* Avatar */}
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600'
                }`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                
                {/* Message Bubble */}
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                }`}>
                  {msg.responseType === 'image' ? (
                    <div className="space-y-2">
                      <img src={msg.content} alt="Response" className="max-w-full rounded-lg" referrerPolicy="no-referrer" />
                    </div>
                  ) : msg.responseType === 'link' ? (
                    <a href={msg.content} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all font-medium flex items-center gap-1">
                      <LinkIcon size={14} /> {msg.content}
                    </a>
                  ) : msg.responseType === 'json' ? (
                    <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                      {msg.content}
                    </pre>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed text-[15px] break-words">
                      {/* Simple markdown bold parsing for bot messages */}
                      {msg.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
                        }
                        return <span key={i}>{part}</span>;
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {isProcessing && !messages.some(m => m.role === 'system') && (
            <div className="flex gap-4 animate-in fade-in">
              <div className="shrink-0 w-8 h-8 rounded-full bg-white border border-slate-200 text-indigo-600 flex items-center justify-center shadow-sm">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="relative flex items-center w-full">
            {showCommandMenu && availableCommands.length > 0 && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <Command size={14} /> Chọn chức năng hỗ trợ
                </div>
                <div className="max-h-60 overflow-y-auto p-1.5">
                  {availableCommands
                    .filter(c => c.slug.includes(commandFilter))
                    .map(cmd => (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => {
                        setShowCommandMenu(false);
                        setInputValue('');
                        executeCommand(cmd, `/${cmd.slug}`);
                      }}
                      className="w-full text-left px-3 py-3 hover:bg-slate-100 rounded-lg flex flex-col gap-1 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-600 text-sm">/{cmd.slug}</span>
                        <span className="text-sm text-slate-700 font-medium">{cmd.title}</span>
                      </div>
                      {cmd.description && (
                        <div className="text-xs text-slate-500 truncate">{cmd.description}</div>
                      )}
                    </button>
                  ))}
                  {availableCommands.filter(c => c.slug.includes(commandFilter)).length === 0 && (
                    <div className="px-3 py-4 text-sm text-slate-500 text-center">Không tìm thấy chức năng phù hợp</div>
                  )}
                </div>
              </div>
            )}
            
            <div className="relative flex items-center w-full bg-slate-50 border border-slate-300 rounded-full focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all shadow-sm overflow-hidden">
              {activeWfId && activeCmd && !isWorkflowFinished && (
                <div className="ml-3 flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-600 shrink-0 shadow-sm animate-in zoom-in-95">
                  <span className="opacity-50">/</span>{activeCmd.slug}
                  <span className="w-px h-3 bg-indigo-200 mx-0.5"></span>
                  <span className="text-slate-500 font-semibold">{currentField?.label || 'Tham số'}</span>
                </div>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                disabled={isProcessing}
                placeholder={activeWfId ? "" : "Nhập câu hỏi hoặc gõ / để chọn chức năng..."}
                className="flex-1 pl-3 pr-12 py-3.5 bg-transparent border-none focus:outline-none text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isProcessing}
                className="absolute right-2 p-2.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
          <div className="text-center mt-3">
            <span className="text-[11px] text-slate-400">Trợ lý (RAG). Gõ <strong className="text-slate-500">/</strong> để sử dụng các quy trình chuẩn xác.</span>
          </div>
        </div>
      </footer>

      {/* Training Modal */}
      {showTrainingModal && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                <BrainCircuit className="text-indigo-600" />
                Huấn luyện Trợ lý Cục bộ
              </h3>
              <button onClick={() => setShowTrainingModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Add New */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                  <Plus size={16} /> Thêm kiến thức mới
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-indigo-700 mb-1">Câu hỏi / Từ khóa (cách nhau bằng dấu phẩy)</label>
                    <input 
                      type="text" 
                      value={newKeyword}
                      onChange={e => setNewKeyword(e.target.value)}
                      placeholder="VD: giá bao nhiêu, báo giá, chi phí"
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-indigo-700 mb-1">Câu trả lời của Trợ lý</label>
                    <textarea 
                      value={newAnswer}
                      onChange={e => setNewAnswer(e.target.value)}
                      placeholder="VD: Dạ, sản phẩm này có giá là..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddTraining}
                      disabled={!newKeyword.trim() || !newAnswer.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      Lưu kiến thức
                    </button>
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Dữ liệu đã huấn luyện ({trainingData.length})</h4>
                {trainingData.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Chưa có dữ liệu huấn luyện nào.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trainingData.map(item => (
                      <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 relative group shadow-sm hover:shadow-md transition-shadow">
                        <button 
                          onClick={() => handleDeleteTraining(item.id)}
                          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                          title="Xóa"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="pr-8 space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Từ khóa / Câu hỏi</span>
                            <p className="text-sm font-medium text-slate-800">{item.keywords}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Câu trả lời</span>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
