import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Wrench } from 'lucide-react';

const ToolNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`px-4 py-3 shadow-lg rounded-xl bg-white border-2 transition-all min-w-[180px] ${selected ? 'border-emerald-500 ring-4 ring-emerald-500/10 scale-105' : 'border-emerald-200'}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
          <Wrench size={20} />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tool</div>
          <div className="text-sm font-bold text-slate-800 truncate">{data.label || 'Search Tool'}</div>
        </div>
      </div>
      
      {data.description && (
        <div className="mt-2 text-[10px] text-slate-500 line-clamp-2 border-t border-slate-100 pt-2">
          {data.description}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="w-4 h-4 bg-emerald-500 border-2 border-white z-50 cursor-pointer"
        style={{ left: -8 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="w-4 h-4 bg-emerald-500 border-2 border-white z-50 cursor-pointer"
        style={{ right: -8 }}
      />
    </div>
  );
};

export default memo(ToolNode);
