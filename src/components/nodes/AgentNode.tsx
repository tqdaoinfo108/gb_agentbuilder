import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Globe, Database } from 'lucide-react';

function AgentNode({ data, selected }: any) {
  const isApi = data.analysisMethod === 'api';
  const isDb = data.analysisMethod === 'database';
  
  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 w-[280px] transition-all ${selected ? 'border-indigo-500 shadow-md' : 'border-indigo-200'}`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="target"
        className="w-4 h-4 bg-indigo-500 border-2 border-white z-50 cursor-pointer"
        style={{ left: -8 }}
      />
      
      <div className="bg-indigo-50 rounded-t-xl px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
            {isApi ? <Globe size={16} /> : isDb ? <Database size={16} /> : <Bot size={16} />}
          </div>
          <div className="font-bold text-indigo-900 text-sm">{data.label || 'Agent'}</div>
        </div>
        <div className="text-[9px] font-bold px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded-full uppercase tracking-wider">
          Xử lý
        </div>
      </div>
      
      <div className="p-4">
        {isApi ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">HTTP Request:</div>
            <div className="bg-slate-900 rounded-lg p-2 flex items-center gap-2 overflow-hidden">
              <span className="text-[10px] font-bold text-pink-400">{data.apiMethod || 'GET'}</span>
              <span className="text-[10px] font-mono text-slate-300 truncate">{data.apiUrl || 'https://api...'}</span>
            </div>
          </div>
        ) : isDb ? (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">Database Query:</div>
            <div className="bg-slate-900 rounded-lg p-2 overflow-hidden">
              <div className="text-[10px] font-mono text-blue-400 truncate">{data.dbQuery || 'SELECT * FROM...'}</div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-700">System Prompt:</div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-600 italic line-clamp-3">
              "{data.prompt || 'Chưa cấu hình prompt'}"
            </div>
          </div>
        )}
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        id="source"
        className="w-4 h-4 bg-indigo-500 border-2 border-white z-50 cursor-pointer"
        style={{ right: -8 }}
      />
    </div>
  );
}

export default memo(AgentNode);
