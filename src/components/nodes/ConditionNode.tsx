import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import BaseNode from './BaseNode';

const ConditionNode = (props: NodeProps) => {
  const { data } = props;
  
  return (
    <BaseNode 
      {...props} 
      data={{...data, hideSource: true}}
      icon={GitBranch} 
      title={(data.label as string) || "Điều kiện rẽ nhánh"} 
      status="LOGIC"
      color="yellow"
    >
      <div className="space-y-3">
        <div className="text-[11px] text-slate-400 font-medium">
          {(data.description as string) || "So sánh dựa trên response trả về"}
        </div>
        
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Response mẫu:</label>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-[10px] text-slate-600 font-mono overflow-x-auto">
            {data.sampleResponse ? (
              <pre>{JSON.stringify(data.sampleResponse, null, 2)}</pre>
            ) : (
              <pre>{`{\n  "status": "success",\n  "temp": 32\n}`}</pre>
            )}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Các nhánh điều kiện:</label>
          
          <div className="relative flex items-center justify-between bg-amber-50/50 border border-amber-100 rounded-lg p-2">
            <span className="text-xs font-medium text-amber-900">1. {(data.cond1 as string) || "temp > 30"}</span>
            <Handle type="source" position={Position.Right} id="branch1" className="!w-4 !h-4 !bg-amber-500 !border-[3px] !border-white !-right-[24px] hover:!w-5 hover:!h-5 hover:!-right-[26px] transition-all z-10" />
          </div>
          
          <div className="relative flex items-center justify-between bg-amber-50/50 border border-amber-100 rounded-lg p-2">
            <span className="text-xs font-medium text-amber-900">2. {(data.cond2 as string) || "temp < 15"}</span>
            <Handle type="source" position={Position.Right} id="branch2" className="!w-4 !h-4 !bg-amber-500 !border-[3px] !border-white !-right-[24px] hover:!w-5 hover:!h-5 hover:!-right-[26px] transition-all z-10" />
          </div>

          <div className="relative flex items-center justify-between bg-amber-50/50 border border-amber-100 rounded-lg p-2">
            <span className="text-xs font-medium text-amber-900">3. {(data.cond3 as string) || "Mặc định (Else)"}</span>
            <Handle type="source" position={Position.Right} id="branch3" className="!w-4 !h-4 !bg-amber-500 !border-[3px] !border-white !-right-[24px] hover:!w-5 hover:!h-5 hover:!-right-[26px] transition-all z-10" />
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(ConditionNode);
