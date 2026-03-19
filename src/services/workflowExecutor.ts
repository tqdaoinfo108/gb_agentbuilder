import { Workflow } from './workflowService';
import { Node, Edge } from '@xyflow/react';

export interface ExecutionContext {
  variables: Record<string, any>;
  currentNodeId: string;
  workflow: Workflow;
  status: 'running' | 'waiting_for_input' | 'completed' | 'error';
  outputMessage?: string;
}

export class WorkflowExecutor {
  private context: ExecutionContext;

  constructor(workflow: Workflow, initialVariables: Record<string, any> = {}) {
    // Find trigger node
    const triggerNode = workflow.nodes.find(n => n.type === 'trigger');
    
    this.context = {
      variables: initialVariables,
      currentNodeId: triggerNode ? triggerNode.id : '',
      workflow,
      status: triggerNode ? 'running' : 'error',
    };
  }

  public getContext() {
    return this.context;
  }

  public async executeNext(input?: string): Promise<ExecutionContext> {
    if (this.context.status === 'completed' || this.context.status === 'error') {
      return this.context;
    }

    let node = this.context.workflow.nodes.find(n => n.id === this.context.currentNodeId);
    if (!node) {
      this.context.status = 'error';
      return this.context;
    }

    // If we have input, provide it to the trigger
    if (input && node.type === 'trigger') {
      this.context.variables['input'] = input;
      this.context.status = 'running';
      this.moveToNextNode();
      node = this.context.workflow.nodes.find(n => n.id === this.context.currentNodeId);
    }

    // Loop until we need input, complete, or error
    while (node && this.context.status === 'running') {
      try {
        switch (node.type) {
          case 'trigger':
            await this.handleTrigger(node);
            break;
          case 'agent':
            await this.handleAgent(node);
            break;
          case 'condition':
            await this.handleCondition(node);
            break;
          case 'output':
            await this.handleOutput(node);
            break;
        }
      } catch (error) {
        console.error('Workflow execution error:', error);
        this.context.status = 'error';
        this.context.outputMessage = `Lỗi thực thi: ${error instanceof Error ? error.message : 'Unknown error'}`;
        break;
      }

      if (this.context.status === 'running') {
        node = this.context.workflow.nodes.find(n => n.id === this.context.currentNodeId);
      }
    }

    return this.context;
  }

  private moveToNextNode(sourceHandle?: string) {
    const edges = this.context.workflow.edges.filter(e => 
      e.source === this.context.currentNodeId && 
      (!sourceHandle || e.sourceHandle === sourceHandle)
    );

    if (edges.length === 0) {
      this.context.status = 'completed';
    } else {
      // For simplicity, just take the first matching edge
      this.context.currentNodeId = edges[0].target;
    }
  }

  private async handleTrigger(node: Node) {
    if (!this.context.variables['input']) {
      this.context.status = 'waiting_for_input';
      this.context.outputMessage = `Vui lòng cung cấp thông tin: ${node.data.label}`;
      return;
    }
    this.moveToNextNode();
  }

  private async handleAgent(node: Node) {
    const subType = node.data.subType as string;
    
    if (subType === 'HTTP Request') {
      let url = node.data.endpointUrl as string;
      const method = (node.data.httpMethod as string) || 'GET';
      const headersStr = node.data.headers as string;
      const bodyStr = node.data.body as string;
      
      // Replace variables in URL
      for (const [key, value] of Object.entries(this.context.variables)) {
        url = url.replace(new RegExp(`{{${key}}}`, 'g'), encodeURIComponent(String(value)));
      }

      let headers: Record<string, string> | undefined = undefined;
      if (headersStr) {
        try {
          headers = JSON.parse(headersStr);
        } catch(e) {
          console.warn("Invalid JSON in headers", e);
        }
      }

      let body: string | undefined = undefined;
      if (bodyStr && method !== 'GET' && method !== 'HEAD') {
        let parsedBody = bodyStr;
        for (const [key, value] of Object.entries(this.context.variables)) {
          parsedBody = parsedBody.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        }
        body = parsedBody;
      }

      try {
        const response = await fetch(url, { method, headers, body });
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const data = await response.json();
        
        // Merge response data into variables
        this.context.variables = { ...this.context.variables, ...this.flattenObject(data) };
      } catch (error) {
        throw new Error(`Lỗi gọi API: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (subType === 'Mẫu Prompt' || subType === 'AI Prompt') {
      let prompt = node.data.aiPrompt as string;
      const systemPrompt = node.data.systemPrompt as string;
      
      // Replace variables in prompt
      for (const [key, value] of Object.entries(this.context.variables)) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }

      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const config: any = {};
        if (systemPrompt) {
          config.systemInstruction = systemPrompt;
        }

        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config,
        });

        // Store the result in variables (e.g., ai_response)
        this.context.variables['ai_response'] = response.text;
        
        // Also store it with the node ID for specific reference
        this.context.variables[`${node.id}_response`] = response.text;
      } catch (error) {
        throw new Error(`Lỗi gọi AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Mock other agents
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.moveToNextNode();
  }

  private async handleCondition(node: Node) {
    const cond1 = node.data.cond1 as string;
    const cond2 = node.data.cond2 as string;
    
    // Simple evaluation logic for demo purposes
    // We expect conditions like "temp_C > 30"
    let matchedBranch = 'branch3'; // Default
    
    if (this.evaluateCondition(cond1)) {
      matchedBranch = 'branch1';
    } else if (this.evaluateCondition(cond2)) {
      matchedBranch = 'branch2';
    }

    this.moveToNextNode(matchedBranch);
  }

  private evaluateCondition(conditionStr: string): boolean {
    if (!conditionStr) return false;
    
    // Extract variable name, operator, and value
    // e.g., "temp_C > 30 (Nóng)" -> "temp_C > 30"
    const cleanCond = conditionStr.split('(')[0].trim();
    
    // Try matching string comparison first (e.g., country_code == 'VN')
    const strMatch = cleanCond.match(/([a-zA-Z0-9_]+)\s*(==|!=)\s*['"]([^'"]+)['"]/);
    if (strMatch) {
      const [, varName, operator, valueStr] = strMatch;
      const varValue = String(this.context.variables[varName]);
      if (operator === '==') return varValue === valueStr;
      if (operator === '!=') return varValue !== valueStr;
      return false;
    }

    // Try matching numeric comparison
    const numMatch = cleanCond.match(/([a-zA-Z0-9_]+)\s*(>|<|==|>=|<=|!=)\s*([0-9.-]+)/);
    if (!numMatch) return false;
    
    const [, varName, operator, valueStr] = numMatch;
    const varValue = Number(this.context.variables[varName]);
    const compareValue = Number(valueStr);
    
    if (isNaN(varValue) || isNaN(compareValue)) return false;
    
    switch (operator) {
      case '>': return varValue > compareValue;
      case '<': return varValue < compareValue;
      case '>=': return varValue >= compareValue;
      case '<=': return varValue <= compareValue;
      case '==': return varValue === compareValue;
      case '!=': return varValue !== compareValue;
      default: return false;
    }
  }

  private async handleOutput(node: Node) {
    let message = (node.data.outputMessage as string) || (node.data.label as string);
    
    // Replace variables in message
    for (const [key, value] of Object.entries(this.context.variables)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    this.context.outputMessage = message;
    this.context.status = 'completed';
  }

  // Helper to flatten nested JSON objects for easier variable access
  private flattenObject(ob: any, prefix = ''): Record<string, any> {
    const toReturn: Record<string, any> = {};
    for (const i in ob) {
      if (!ob.hasOwnProperty(i)) continue;
      
      const newKey = prefix ? `${prefix}_${i}` : i;
      
      if ((typeof ob[i]) === 'object' && ob[i] !== null) {
        if (Array.isArray(ob[i])) {
           for (let j = 0; j < ob[i].length; j++) {
             if (typeof ob[i][j] === 'object' && ob[i][j] !== null) {
               const flatObject = this.flattenObject(ob[i][j], `${newKey}_${j}`);
               for (const x in flatObject) {
                 if (!flatObject.hasOwnProperty(x)) continue;
                 toReturn[x] = flatObject[x];
               }
             } else {
               toReturn[`${newKey}_${j}`] = ob[i][j];
             }
           }
        } else {
          const flatObject = this.flattenObject(ob[i], newKey);
          for (const x in flatObject) {
            if (!flatObject.hasOwnProperty(x)) continue;
            toReturn[x] = flatObject[x];
          }
        }
      } else {
        toReturn[newKey] = ob[i];
      }
    }
    return toReturn;
  }
}
