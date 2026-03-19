import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Panel,
  ReactFlowInstance,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  ArrowLeft, Save, Plus, Trash2, Play, Zap, Bot, Send, GitBranch, Settings2, MousePointer2, 
  Webhook, Calendar, Code, RefreshCw, Globe, Bell, Mail, Database, RotateCcw, Layout, MessageSquare,
  Mic, Smartphone, MessageCircle, FileText, Table, DatabaseZap, Network, FileJson, CheckCircle, Scissors, Tags, ScanText, AlignLeft, BrainCircuit, Repeat, Layers, ShieldAlert, FileCode2
} from 'lucide-react';
import { workflowService, Workflow } from '../services/workflowService';
import TriggerNode from '../components/nodes/TriggerNode';
import AgentNode from '../components/nodes/AgentNode';
import ConditionNode from '../components/nodes/ConditionNode';
import OutputNode from '../components/nodes/OutputNode';
import NodeConfigPanel from '../components/NodeConfigPanel';

const nodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  condition: ConditionNode,
  output: OutputNode,
};

interface WorkflowBuilderProps {
  workflowId: string | null;
  onBack: () => void;
}

const colorMap: Record<string, { bg: string, text: string }> = {
  green: { bg: 'bg-emerald-50', text: 'text-emerald-500' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-500' },
  yellow: { bg: 'bg-amber-50', text: 'text-amber-500' },
  red: { bg: 'bg-rose-50', text: 'text-rose-500' },
  slate: { bg: 'bg-slate-50', text: 'text-slate-500' },
};

const SidebarItem = ({ type, subType, label, description, icon: Icon, color }: { type: string, subType?: string, label: string, description: string, icon: any, color: string }) => {
  const colors = colorMap[color] || colorMap.slate;

  const onDragStart = (event: React.DragEvent, nodeType: string, nodeLabel: string, nodeDescription: string, nodeSubType?: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', nodeLabel);
    event.dataTransfer.setData('application/reactflow-description', nodeDescription);
    if (nodeSubType) {
      event.dataTransfer.setData('application/reactflow-subtype', nodeSubType);
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-slate-200 hover:bg-slate-50 cursor-grab active:cursor-grabbing transition-all group"
      onDragStart={(event) => onDragStart(event, type, label, description, subType)}
      draggable
    >
      <div className={`p-2 rounded-xl ${colors.bg} ${colors.text} shadow-sm group-hover:scale-110 transition-transform`}>
        <Icon size={18} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-slate-800 tracking-tight">{label}</span>
        <span className="text-[10px] text-slate-400 font-medium leading-tight">{description}</span>
      </div>
    </div>
  );
};

const SidebarCategory = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="space-y-2">
    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3">{title}</h3>
    <div className="space-y-1">
      {children}
    </div>
  </div>
);

const WorkflowBuilderContent = ({ workflowId, onBack }: WorkflowBuilderProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (workflowId) {
      const existing = workflowService.getWorkflowById(workflowId);
      if (existing) {
        setWorkflow(existing);
        setNodes(existing.nodes || []);
        setEdges(existing.edges || []);
      }
    }
  }, [workflowId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds)),
    [setEdges]
  );

  const onSave = useCallback(() => {
    if (!workflowId) return;
    
    setIsSaving(true);
    const updatedWorkflow = workflowService.saveWorkflow({
      id: workflowId,
      name: workflow?.name || 'Untitled Workflow',
      description: workflow?.description || '',
      nodes,
      edges,
    });
    setWorkflow(updatedWorkflow);
    setTimeout(() => setIsSaving(false), 800);
  }, [workflow, workflowId, nodes, edges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onUpdateNode = useCallback((id: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onClosePanel = useCallback(() => {
    setNodes((nds) => nds.map((node) => ({ ...node, selected: false })));
  }, [setNodes]);

  const onDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  }, [setNodes, setEdges]);

  const selectedNode = nodes.find((n) => n.selected);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/reactflow-label');
      const description = event.dataTransfer.getData('application/reactflow-description');
      const subType = event.dataTransfer.getData('application/reactflow-subtype');

      if (typeof type === 'undefined' || !type || !reactFlowInstance || !reactFlowWrapper.current) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: Math.random().toString(36).substring(2, 9),
        type,
        position,
        data: { 
          label: label || `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          description: description || '',
          subType: subType || '',
          ...(type === 'condition' ? {
            sampleResponse: { status: "success", value: 100 },
            cond1: "value > 50",
            cond2: "value < 10",
            cond3: "Mặc định (Else)"
          } : {}),
          ...(type === 'agent' && subType === 'Mẫu Prompt' ? {
            systemPrompt: "Bạn là một trợ lý ảo hữu ích, luôn trả lời bằng tiếng Việt.",
            aiPrompt: "Dựa vào thông tin sau: {{input}}, hãy trả lời câu hỏi của người dùng.",
            model: "gemini-3-flash-preview"
          } : {})
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={14} strokeWidth={3} />
            Quay lại Portal
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <Layout size={18} strokeWidth={2.5} />
            </div>
            <div>
              <input 
                value={workflow?.name || ''}
                onChange={(e) => setWorkflow(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="text-sm font-black text-slate-800 bg-transparent border-none focus:ring-0 p-0 placeholder:text-slate-300"
                placeholder="Agent Builder"
              />
              <p className="text-[10px] font-bold text-slate-400 tracking-tight">
                Kéo thả các node để tạo luồng
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all text-[11px] font-bold border border-slate-100">
            <RotateCcw size={14} strokeWidth={2.5} />
            Làm mới
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl transition-all text-[11px] font-bold border border-indigo-100">
            <Play size={14} strokeWidth={2.5} />
            Chạy Form
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-all text-[11px] font-bold shadow-lg shadow-emerald-100">
            <MessageSquare size={14} strokeWidth={2.5} />
            Chạy Chatbot
          </button>
          <button 
            onClick={onSave}
            disabled={isSaving}
            className={`
              p-2 rounded-xl transition-all
              ${isSaving ? 'bg-emerald-500 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}
            `}
            title="Save Workflow"
          >
            <Save size={18} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-100 py-6 flex flex-col gap-8 overflow-y-auto z-10 scrollbar-hide">
          <SidebarCategory title="BẮT ĐẦU (START)">
            <SidebarItem type="trigger" label="Form Submit" description="Nhập liệu qua UI" icon={Layout} color="green" />
            <SidebarItem type="trigger" label="Email" description="Nhận email mới" icon={Mail} color="green" />
            <SidebarItem type="trigger" label="Chat Widget" description="Từ Web/App Chat" icon={MessageCircle} color="green" />
            <SidebarItem type="trigger" label="Mobile App" description="Input từ Mobile" icon={Smartphone} color="green" />
            <SidebarItem type="trigger" label="Voice" description="Speech-to-text" icon={Mic} color="green" />
            <SidebarItem type="trigger" label="Webhook" description="Stripe, Shopify, CRM..." icon={Webhook} color="green" />
            <SidebarItem type="trigger" label="Schedule" description="Cron job định kỳ" icon={Calendar} color="green" />
            <SidebarItem type="trigger" label="Event-driven" description="Kafka, Queue" icon={Network} color="green" />
            <SidebarItem type="trigger" label="Upload File" description="PDF, CSV" icon={FileText} color="green" />
            <SidebarItem type="trigger" label="Google Sheets" description="Dữ liệu từ Excel" icon={Table} color="green" />
            <SidebarItem type="trigger" label="Database Trigger" description="Row insert/update" icon={DatabaseZap} color="green" />
          </SidebarCategory>

          <SidebarCategory title="XỬ LÝ (PROCESS)">
            <SidebarItem type="agent" subType="Mẫu Prompt" label="Mẫu Prompt" description="Gọi LLM xử lý" icon={Bot} color="blue" />
            <SidebarItem type="agent" subType="HTTP Request" label="HTTP Request" description="Gọi API bên ngoài" icon={Globe} color="blue" />
            <SidebarItem type="agent" subType="Database Query" label="Database Query" description="Truy vấn CSDL" icon={Database} color="blue" />
            <SidebarItem type="agent" label="Mapping Field" description="JSON → schema" icon={FileJson} color="blue" />
            <SidebarItem type="agent" label="Validate Input" description="Schema validation" icon={CheckCircle} color="blue" />
            <SidebarItem type="agent" label="Clean Data" description="Normalize text, timezone" icon={Scissors} color="blue" />
            <SidebarItem type="agent" label="Classification" description="Intent detection" icon={Tags} color="blue" />
            <SidebarItem type="agent" label="Extraction" description="NER: tên, địa điểm..." icon={ScanText} color="blue" />
            <SidebarItem type="agent" label="Summarization" description="Tóm tắt nội dung" icon={AlignLeft} color="blue" />
            <SidebarItem type="agent" label="Decision Agent" description="Multi-step reasoning" icon={BrainCircuit} color="blue" />
            <SidebarItem type="condition" label="Condition" description="Logic If/Else" icon={GitBranch} color="yellow" />
            <SidebarItem type="condition" label="Switch" description="Multi-branch logic" icon={GitBranch} color="yellow" />
            <SidebarItem type="agent" label="Loop" description="Iterate list" icon={Repeat} color="yellow" />
            <SidebarItem type="agent" label="Parallel Execution" description="Chạy song song" icon={Layers} color="yellow" />
            <SidebarItem type="agent" label="Retry / Fallback" description="Xử lý lỗi" icon={ShieldAlert} color="yellow" />
          </SidebarCategory>

          <SidebarCategory title="KẾT THÚC (END)">
            <SidebarItem type="output" label="Text Output" description="Trả về văn bản" icon={FileText} color="red" />
            <SidebarItem type="output" label="HTML Output" description="Trả về giao diện" icon={FileCode2} color="red" />
            <SidebarItem type="output" label="JSON Output" description="Trả về dữ liệu chuẩn" icon={FileJson} color="red" />
            <SidebarItem type="output" label="Thông báo" description="Slack, Teams, SMS" icon={Bell} color="red" />
            <SidebarItem type="output" label="Email" description="Gmail, Outlook, SendGrid" icon={Mail} color="red" />
            <SidebarItem type="output" label="CRM Update" description="Salesforce, Hubspot..." icon={Database} color="red" />
          </SidebarCategory>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 relative bg-[#fcfcfd]" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => setReactFlowInstance(instance)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            connectionRadius={40}
            connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 3 }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#cbd5e1', strokeWidth: 2 },
            }}
          >
            <Background color="#f1f5f9" gap={24} variant={BackgroundVariant.Dots} />
            <Controls position="bottom-left" className="!bg-white !border-slate-100 !shadow-xl !rounded-2xl overflow-hidden" />
          </ReactFlow>
        </main>

        {/* Config Panel */}
        {selectedNode && (
          <NodeConfigPanel 
            node={selectedNode} 
            onUpdateNode={onUpdateNode} 
            onDeleteNode={onDeleteNode}
            onClose={onClosePanel} 
          />
        )}
      </div>
    </div>
  );
};

const WorkflowBuilder = (props: WorkflowBuilderProps) => (
  <ReactFlowProvider>
    <WorkflowBuilderContent {...props} />
  </ReactFlowProvider>
);

export default WorkflowBuilder;
