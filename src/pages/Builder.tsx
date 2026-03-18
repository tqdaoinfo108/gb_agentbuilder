import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  reconnectEdge,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { Play, RotateCcw, Share2, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

import Sidebar from '../components/Sidebar';
import PropertiesPanel from '../components/PropertiesPanel';
import TriggerNode from '../components/nodes/TriggerNode';
import AgentNode from '../components/nodes/AgentNode';
import ConditionNode from '../components/nodes/ConditionNode';
import OutputNode from '../components/nodes/OutputNode';
import ToolNode from '../components/nodes/ToolNode';
import { initialNodes, initialEdges } from '../constants';

const nodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  condition: ConditionNode,
  output: OutputNode,
  tool: ToolNode,
};

let id = 0;
const getId = () => `node_${id++}_${Date.now()}`;

import { workflowService } from '../services/workflowService';

function Flow() {
  const navigate = useNavigate();
  const location = useLocation();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const edgeReconnectSuccessful = useRef(true);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    if (id) {
      const workflow = workflowService.getById(id);
      if (workflow) {
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
        setEditingId(id);
      }
    }
  }, [location.search, setNodes, setEdges]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true;
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges],
  );

  const onReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
      edgeReconnectSuccessful.current = true;
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      const nodeDataStr = event.dataTransfer.getData('application/reactflow-data');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let nodeData: any = { label: `${type} node`, description: '' };
      if (nodeDataStr) {
        try {
          nodeData = JSON.parse(nodeDataStr);
        } catch (e) {
          console.error('Error parsing node data', e);
        }
      }

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: nodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, data: { ...node.data, ...newData } };
          if (selectedNode?.id === nodeId) {
            setSelectedNode(updatedNode);
          }
          return updatedNode;
        }
        return node;
      })
    );
  }, [setNodes, selectedNode]);

  const deleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    setSelectedNode(null);
  }, [setNodes, setEdges]);

  const handleReset = useCallback(() => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ workflow hiện tại?')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
    }
  }, [setNodes, setEdges]);

  const handlePublish = useCallback((mode: 'run' | 'chat') => {
    const triggerNode = nodes.find(n => n.type === 'trigger');
    if (!triggerNode) {
      showToast("Workflow cần ít nhất 1 node BẮT ĐẦU (Start) để có thể publish!", "error");
      return;
    }
    const outputNode = nodes.find(n => n.type === 'output');
    if (!outputNode) {
      showToast("Workflow cần ít nhất 1 node KẾT THÚC (End) để có thể publish!", "error");
      return;
    }

    const newId = editingId || uuidv4();
    workflowService.save({
      id: newId,
      nodes,
      edges,
      name: (triggerNode.data?.label as string) || 'Published Workflow',
      updatedAt: new Date().toISOString()
    });
    
    showToast(editingId ? `Đã cập nhật thành công!` : `Đã publish thành công! Đang chuyển hướng...`, "success");
    
    setTimeout(() => {
      if (mode === 'chat') {
        navigate(`/?id=${newId}`);
      } else {
        navigate(`/run/${newId}`);
      }
    }, 1000);
  }, [nodes, edges, navigate, editingId]);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans relative">
      {toast && (
        <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-4 flex items-center gap-2 font-medium text-sm ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
      <Sidebar />
      <div className="flex-1 flex flex-col h-full relative" ref={reactFlowWrapper}>
        <div className="absolute top-4 right-4 z-10 flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium text-sm"
          >
            <RotateCcw size={16} />
            Làm mới
          </button>
          <button
            onClick={() => handlePublish('run')}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium text-sm"
          >
            <Play size={16} />
            Chạy Form
          </button>
          <button
            onClick={() => handlePublish('chat')}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-md font-medium text-sm"
          >
            <MessageSquare size={16} />
            Chạy Chatbot
          </button>
        </div>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onReconnectStart={onReconnectStart}
          onReconnectEnd={onReconnectEnd}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-50"
          deleteKeyCode={['Backspace', 'Delete']}
          connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 3 }}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{ 
            animated: true, 
            style: { strokeWidth: 2 } 
          }}
        >
          <Background color="#cbd5e1" gap={16} size={1} />
          <Controls className="bg-white border-slate-200 shadow-sm rounded-lg overflow-hidden" />
          <MiniMap 
            className="bg-white border-slate-200 shadow-sm rounded-lg" 
            nodeColor={(node) => {
              switch (node.type) {
                case 'trigger': return '#10b981'; // emerald
                case 'agent': return '#6366f1'; // indigo
                case 'condition': return '#fbbf24'; // amber
                case 'output': return '#f43f5e'; // rose
                case 'tool': return '#10b981'; // emerald
                default: return '#cbd5e1';
              }
            }}
          />
        </ReactFlow>
      </div>
      
      {selectedNode && (
        <PropertiesPanel 
          node={selectedNode} 
          updateNodeData={updateNodeData} 
          onClose={() => setSelectedNode(null)}
          onDelete={() => deleteNode(selectedNode.id)}
        />
      )}
    </div>
  );
}

export default function Builder() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
