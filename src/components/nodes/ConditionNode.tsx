import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';

function ConditionNode({ data, selected }: any) {
  // Support legacy condition format or new cases format
  const cases = data.cases || [
    { id: 'true', label: 'TRUE', condition: data.condition || 'IF ... THEN' },
    { id: 'false', label: 'FALSE', condition: 'Mặc định' }
  ];

  const SIZE = 200;
  const CENTER = SIZE / 2;
  const OFFSET = 72; // Distance from center to corners

  return (
    <div className="relative flex items-center justify-center group select-none" style={{ width: SIZE, height: SIZE }}>
      {/* Diamond Background */}
      <div 
        className={`absolute w-[124px] h-[124px] bg-amber-50 border-2 rounded-xl transform rotate-45 transition-all shadow-sm pointer-events-none ${
          selected ? 'border-amber-500 shadow-md scale-105' : 'border-amber-300 group-hover:border-amber-400'
        }`}
      />
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-4 w-full h-full pointer-events-none">
        <div className="bg-amber-100 p-2 rounded-full text-amber-600 mb-1 shadow-sm">
          <GitBranch size={20} />
        </div>
        <div className="font-bold text-amber-900 text-[13px] mb-1 leading-tight px-4 line-clamp-2">
          {data.label || 'Điều kiện'}
        </div>
        <div className="text-[11px] text-amber-700 font-mono bg-amber-100/50 px-2 py-0.5 rounded">
          {cases.length} nhánh
        </div>
      </div>
      
      {/* Target Handle (Input) - Left Corner */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="target"
        className="nodrag nopan"
        style={{ 
          left: CENTER - OFFSET, 
          top: CENTER, 
          width: 28, 
          height: 28, 
          background: '#f59e0b', 
          border: '4px solid white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          zIndex: 1000,
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          pointerEvents: 'all'
        }}
      />
      
      {/* Source Handles (Outputs) */}
      {cases.map((c: any, index: number) => {
        let x = CENTER;
        let y = CENTER;
        let handlePos = Position.Right;
        let labelStyle: React.CSSProperties = {};

        // Unique ID for each handle
        const handleId = c.id || `source-${index}`;

        if (index === 0) { // Top Corner
          y = CENTER - OFFSET;
          handlePos = Position.Top;
          labelStyle = { bottom: '100%', left: '50%', transform: 'translate(-50%, -18px)' };
        } else if (index === 1) { // Right Corner
          x = CENTER + OFFSET;
          handlePos = Position.Right;
          labelStyle = { left: '100%', top: '50%', transform: 'translate(18px, -50%)' };
        } else if (index === 2) { // Bottom Corner
          y = CENTER + OFFSET;
          // Using Position.Right even for bottom to avoid some React Flow quirks with custom nodes
          // but keeping the visual position at the bottom.
          handlePos = Position.Right; 
          labelStyle = { top: '100%', left: '50%', transform: 'translate(-50%, 18px)' };
        } else { // Extra cases
          x = CENTER + OFFSET;
          y = CENTER + (index - 1) * 35;
          handlePos = Position.Right;
          labelStyle = { left: '100%', top: '50%', transform: 'translate(18px, -50%)' };
        }

        return (
          <React.Fragment key={handleId}>
            <Handle 
              type="source" 
              position={handlePos} 
              id={handleId}
              className="nodrag nopan"
              style={{ 
                left: x, 
                top: y, 
                width: 28, 
                height: 28, 
                background: '#1e1b4b', 
                border: '4px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                zIndex: 1000,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                pointerEvents: 'all'
              }}
            />
            <div 
              className="absolute text-[11px] font-bold text-emerald-700 bg-white/95 px-2.5 py-1 rounded shadow-sm whitespace-nowrap z-[2000] border border-emerald-100 max-w-[140px] truncate pointer-events-none"
              style={labelStyle}
              title={c.condition}
            >
              {c.label}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default memo(ConditionNode);
