import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { LucideIcon } from 'lucide-react';

interface BaseNodeProps extends NodeProps {
  icon: LucideIcon;
  title: string;
  status?: string;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'slate';
  children?: React.ReactNode;
}

const colorMap = {
  green: { 
    border: 'border-emerald-200', 
    headerBg: 'bg-emerald-50', 
    iconBg: 'bg-white', 
    iconText: 'text-emerald-500', 
    statusBg: 'bg-emerald-100', 
    statusText: 'text-emerald-700',
    selectedBorder: 'border-emerald-500'
  },
  blue: { 
    border: 'border-blue-200', 
    headerBg: 'bg-blue-50', 
    iconBg: 'bg-white', 
    iconText: 'text-blue-500', 
    statusBg: 'bg-blue-100', 
    statusText: 'text-blue-700',
    selectedBorder: 'border-blue-500'
  },
  yellow: { 
    border: 'border-amber-200', 
    headerBg: 'bg-amber-50', 
    iconBg: 'bg-white', 
    iconText: 'text-amber-500', 
    statusBg: 'bg-amber-100', 
    statusText: 'text-amber-700',
    selectedBorder: 'border-amber-500'
  },
  red: { 
    border: 'border-rose-200', 
    headerBg: 'bg-rose-50', 
    iconBg: 'bg-white', 
    iconText: 'text-rose-500', 
    statusBg: 'bg-rose-100', 
    statusText: 'text-rose-700',
    selectedBorder: 'border-rose-500'
  },
  slate: { 
    border: 'border-slate-200', 
    headerBg: 'bg-slate-50', 
    iconBg: 'bg-white', 
    iconText: 'text-slate-500', 
    statusBg: 'bg-slate-100', 
    statusText: 'text-slate-700',
    selectedBorder: 'border-slate-500'
  },
};

const BaseNode = ({ data, icon: Icon, title, status, color, selected, children }: BaseNodeProps) => {
  const colors = colorMap[color] || colorMap.slate;

  return (
    <div className={`
      min-w-[280px] bg-white rounded-2xl border-2 transition-all duration-200
      ${selected ? `${colors.selectedBorder} shadow-xl scale-[1.02]` : `${colors.border} shadow-sm`}
    `}>
      {/* Handles */}
      {!data.hideTarget && (
        <Handle 
          type="target" 
          position={Position.Left} 
          className="!w-5 !h-5 !bg-indigo-500 !border-[3px] !border-white !-left-2.5 hover:!w-6 hover:!h-6 hover:!-left-3 transition-all z-10" 
        />
      )}
      
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${colors.headerBg} border-b ${colors.border} rounded-t-xl`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${colors.iconBg} ${colors.iconText} shadow-sm`}>
            <Icon size={18} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-slate-800 tracking-tight">{title}</span>
        </div>
        {status && (
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${colors.statusBg} ${colors.statusText}`}>
            {status}
          </span>
        )}
      </div>
      
      {/* Body */}
      <div className="p-4 bg-white rounded-b-xl">
        {children || (
          <div className="text-xs text-slate-500 leading-relaxed">
            {data.label as string}
          </div>
        )}
      </div>

      {!data.hideSource && (
        <Handle 
          type="source" 
          position={Position.Right} 
          className="!w-5 !h-5 !bg-indigo-500 !border-[3px] !border-white !-right-2.5 hover:!w-6 hover:!h-6 hover:!-right-3 transition-all z-10" 
        />
      )}
    </div>
  );
};

export default memo(BaseNode);
