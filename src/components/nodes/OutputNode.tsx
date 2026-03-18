import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Send, Type, Link as LinkIcon, Image, Code } from 'lucide-react';

function OutputNode({ data, selected }: any) {
  const type = data.responseType || 'text';
  
  const getTypeIcon = () => {
    switch (type) {
      case 'link': return <LinkIcon size={14} className="text-rose-500" />;
      case 'image': return <Image size={14} className="text-rose-500" />;
      case 'json': return <Code size={14} className="text-rose-500" />;
      default: return <Type size={14} className="text-rose-500" />;
    }
  };

  const getTypeName = () => {
    switch (type) {
      case 'link': return 'Đường dẫn';
      case 'image': return 'Hình ảnh';
      case 'json': return 'Dữ liệu JSON';
      default: return 'Văn bản';
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 w-[280px] transition-all ${selected ? 'border-rose-500 shadow-md' : 'border-rose-200'}`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="target"
        className="w-4 h-4 bg-rose-500 border-2 border-white z-50 cursor-pointer"
        style={{ left: -8 }}
      />
      
      <div className="bg-rose-50 rounded-t-xl px-4 py-3 border-b border-rose-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-rose-100 p-1.5 rounded-lg text-rose-600">
            <Send size={16} />
          </div>
          <div className="font-bold text-rose-900 text-sm">{data.label || 'Kết thúc'}</div>
        </div>
        <div className="text-[9px] font-bold px-2 py-0.5 bg-rose-200 text-rose-800 rounded-full uppercase tracking-wider">
          Kết thúc
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-slate-700">Đầu ra:</div>
          <div className="flex items-center gap-1 bg-rose-50 px-2 py-1 rounded border border-rose-100">
            {getTypeIcon()}
            <span className="text-[10px] font-medium text-rose-700">{getTypeName()}</span>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 max-h-24 overflow-hidden text-ellipsis">
          {data.result || 'Chưa cấu hình nội dung'}
        </div>
      </div>
    </div>
  );
}

export default memo(OutputNode);
