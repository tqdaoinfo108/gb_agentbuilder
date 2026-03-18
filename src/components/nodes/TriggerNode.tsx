import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play } from 'lucide-react';

function TriggerNode({ data, selected }: any) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 w-[280px] transition-all ${selected ? 'border-emerald-500 shadow-md' : 'border-emerald-200'}`}>
      <div className="bg-emerald-50 rounded-t-xl px-4 py-3 border-b border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-1.5 rounded-lg text-emerald-600">
            <Play size={16} />
          </div>
          <div className="font-bold text-emerald-900 text-sm">{data.label}</div>
        </div>
        <div className="text-[9px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded-full uppercase tracking-wider">
          Bắt đầu
        </div>
      </div>
      
      <div className="p-4">
        {data.description && (
          <div className="text-xs text-slate-500 mb-3 italic">
            {data.description}
          </div>
        )}
        
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-700">Dữ liệu đầu vào:</div>
          {data.fields && data.fields.length > 0 ? (
            data.fields.map((field: any) => (
              <div key={field.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">{field.label}</span>
                <span className="text-[10px] text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100">{field.type}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400 italic">Chưa cấu hình trường dữ liệu</div>
          )}
        </div>
      </div>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        id="source"
        className="w-4 h-4 bg-emerald-500 border-2 border-white z-50 cursor-pointer"
        style={{ right: -8 }}
      />
    </div>
  );
}

export default memo(TriggerNode);
