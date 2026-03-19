import React, { useState, useEffect } from 'react';
import WebSocketChat from './components/WebSocketChat';
import WorkflowList from './pages/WorkflowList';
import WorkflowBuilder from './pages/WorkflowBuilder';
import { workflowService } from './services/workflowService';

export default function App() {
  const [view, setView] = useState<'chat' | 'workflows' | 'builder'>('chat');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize demo data if missing
    const existingWorkflows = workflowService.getWorkflows();
    if (existingWorkflows.length === 0 || !existingWorkflows.find(w => w.id === 'demo-ai-assistant')) {
      workflowService.seedDemo();
    }
  }, []);

  const handleEditWorkflow = (id: string | null) => {
    setSelectedWorkflowId(id);
    setView('builder');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {view === 'chat' && (
        <WebSocketChat onNavigateToWorkflows={() => setView('workflows')} />
      )}
      {view === 'workflows' && (
        <WorkflowList 
          onBack={() => setView('chat')} 
          onEditWorkflow={handleEditWorkflow}
        />
      )}
      {view === 'builder' && (
        <WorkflowBuilder 
          workflowId={selectedWorkflowId} 
          onBack={() => setView('workflows')} 
        />
      )}
    </div>
  );
}
