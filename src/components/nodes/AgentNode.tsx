import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Bot, Globe, Database } from 'lucide-react';
import BaseNode from './BaseNode';

const AgentNode = (props: NodeProps) => {
  const { data } = props;
  
  let icon = Bot;
  if (data.subType === 'HTTP Request') icon = Globe;
  if (data.subType === 'Database Query') icon = Database;

  return (
    <BaseNode 
      {...props} 
      icon={icon} 
      title={(data.label as string) || "Phân tích Vấn đề"} 
      status="XỬ LÝ"
      color="blue"
    >
      <div className="space-y-3">
        <div className="text-[11px] text-slate-400 font-medium">{(data.description as string) || "Xử lý logic tự động"}</div>
        
        {(!data.subType || data.subType === 'Mẫu Prompt') && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chỉ thị hệ thống:</label>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 italic font-medium leading-relaxed">
              "{data.systemPrompt ? String(data.systemPrompt) : 'Đóng vai trợ lý hỗ trợ khách hàng. Phân tích lỗi người dùng gặp phải và đưa ra hướng dẫn từng bước để họ tự khắc phục.'}"
            </div>
          </div>
        )}

        {data.subType === 'HTTP Request' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Endpoint URL:</label>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 font-mono break-all">
              <span className="font-bold mr-2 text-blue-700">{data.httpMethod ? String(data.httpMethod) : 'GET'}</span>
              {data.endpointUrl ? String(data.endpointUrl) : 'https://api.example.com/data'}
            </div>
            {data.headers && (
              <div className="mt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Headers:</label>
                <div className="bg-slate-800 rounded-xl p-2 text-[10px] text-emerald-400 font-mono truncate">
                  {String(data.headers)}
                </div>
              </div>
            )}
            {data.body && (
              <div className="mt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Body:</label>
                <div className="bg-slate-800 rounded-xl p-2 text-[10px] text-emerald-400 font-mono truncate">
                  {String(data.body)}
                </div>
              </div>
            )}
          </div>
        )}

        {data.subType === 'Database Query' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Query:</label>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-xs text-blue-900 font-mono whitespace-pre-wrap">
              {data.dbQuery ? String(data.dbQuery) : 'SELECT * FROM users;'}
            </div>
          </div>
        )}
      </div>
    </BaseNode>
  );
};

export default memo(AgentNode);
