import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Zap } from 'lucide-react';
import BaseNode from './BaseNode';

const TriggerNode = (props: NodeProps) => {
  const { data } = props;
  return (
    <BaseNode 
      {...props} 
      data={{...data, hideTarget: true}}
      icon={Zap} 
      title={(data.label as string) || "Hỗ trợ Khách hàng"} 
      status="BẮT ĐẦU"
      color="green"
    >
      <div className="space-y-3">
        <div className="text-[11px] text-slate-400 font-medium">{(data.description as string) || "Tiếp nhận vấn đề từ người dùng cuối"}</div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dữ liệu đầu vào:</label>
          <div className="relative">
            <textarea 
              className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
              placeholder="Mô tả vấn đề hoặc mã lỗi bạn đang gặp phải"
              readOnly
            />
            <div className="absolute bottom-2 right-2 text-[9px] font-bold text-slate-300 uppercase">textarea</div>
          </div>
        </div>
      </div>
    </BaseNode>
  );
};

export default memo(TriggerNode);
