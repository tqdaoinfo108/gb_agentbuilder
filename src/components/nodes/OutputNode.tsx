import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Send } from 'lucide-react';
import BaseNode from './BaseNode';

const OutputNode = (props: NodeProps) => {
  const { data } = props;
  return (
    <BaseNode 
      {...props} 
      data={{...data, hideSource: true}}
      icon={Send} 
      title={(data.label as string) || "Hướng dẫn xử lý"} 
      status="KẾT THÚC"
      color="red"
    >
      <div className="space-y-3">
        <div className="text-[11px] text-slate-400 font-medium">{(data.description as string) || "Thông báo kết quả"}</div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đầu ra:</label>
          <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs text-rose-900 leading-relaxed">
            Dựa trên vấn đề của bạn, vui lòng thử các bước sau: 1. Tải lại trang web (F5). 2. Xóa bộ nhớ đệm (Cache) của trình duyệt. 3...
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(OutputNode);
