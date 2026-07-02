import React from 'react';
import { PenTool, Type, Eraser, Trash2, Highlighter, Minus, MousePointer2 } from 'lucide-react';

export type ToolType = 'none' | 'pen' | 'text' | 'eraser' | 'highlighter';
export type ToolColor = '#000000' | '#ef4444' | '#3b82f6' | '#22c55e' | '#eab308';
export type ToolSize = 2 | 4 | 8 | 16;

export interface AnnotationState {
  activeTool: ToolType;
  color: ToolColor;
  size: ToolSize;
}

interface AnnotationToolbarProps {
  state: AnnotationState;
  onChange: (newState: AnnotationState) => void;
  onClear: () => void;
}

const COLORS: { value: ToolColor; label: string; class: string }[] = [
  { value: '#000000', label: 'ดำ', class: 'bg-black' },
  { value: '#ef4444', label: 'แดง', class: 'bg-red-500' },
  { value: '#3b82f6', label: 'น้ำเงิน', class: 'bg-blue-500' },
  { value: '#22c55e', label: 'เขียว', class: 'bg-green-500' },
];

const SIZES: { value: ToolSize; iconSize: number }[] = [
  { value: 2, iconSize: 14 },
  { value: 4, iconSize: 18 },
  { value: 8, iconSize: 22 },
];

export default function AnnotationToolbar({ state, onChange, onClear }: AnnotationToolbarProps) {
  const updateState = (updates: Partial<AnnotationState>) => {
    onChange({ ...state, ...updates });
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl mx-auto w-fit z-40 transition-all pointer-events-auto">
      {/* Tools */}
      <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl">
        <button
          onClick={() => updateState({ activeTool: 'none' })}
          className={`p-2 rounded-lg transition-all ${state.activeTool === 'none' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          title="เลื่อนดู (ไม่วาด)"
        >
          <MousePointer2 size={20} />
        </button>
        <button
          onClick={() => updateState({ activeTool: 'pen' })}
          className={`p-2 rounded-lg transition-all ${state.activeTool === 'pen' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          title="ปากกา"
        >
          <PenTool size={20} />
        </button>
        <button
          onClick={() => updateState({ activeTool: 'highlighter', color: '#eab308', size: 16 })}
          className={`p-2 rounded-lg transition-all ${state.activeTool === 'highlighter' ? 'bg-yellow-100 text-yellow-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          title="ไฮไลท์"
        >
          <Highlighter size={20} />
        </button>
        <button
          onClick={() => updateState({ activeTool: 'text' })}
          className={`p-2 rounded-lg transition-all ${state.activeTool === 'text' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          title="พิมพ์ข้อความ"
        >
          <Type size={20} />
        </button>
        <button
          onClick={() => updateState({ activeTool: 'eraser' })}
          className={`p-2 rounded-lg transition-all ${state.activeTool === 'eraser' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
          title="ยางลบ"
        >
          <Eraser size={20} />
        </button>
      </div>

      <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />

      {/* Colors (only show if not erasing) */}
      {state.activeTool !== 'eraser' && state.activeTool !== 'highlighter' && (
        <div className="flex items-center gap-2 px-1">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => updateState({ color: c.value })}
              className={`w-7 h-7 rounded-full shadow-sm transition-transform ${c.class} ${state.color === c.value ? 'scale-125 ring-2 ring-offset-2 ring-indigo-500' : 'hover:scale-110'}`}
              title={c.label}
            />
          ))}
        </div>
      )}

      {/* Thickness */}
      {state.activeTool !== 'text' && state.activeTool !== 'highlighter' && (
        <>
          <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />
          <div className="flex items-center gap-1">
            {SIZES.map((s) => (
              <button
                key={s.value}
                onClick={() => updateState({ size: s.value })}
                className={`p-1.5 rounded-lg transition-colors flex items-center justify-center w-8 h-8 ${state.size === s.value ? 'bg-gray-200 text-gray-900' : 'text-gray-400 hover:text-gray-700'}`}
                title={`ขนาด ${s.value}`}
              >
                <Minus style={{ width: s.iconSize, height: s.iconSize, strokeWidth: 3 }} />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />

      {/* Actions */}
      <button
        onClick={onClear}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
        title="ล้างทั้งหมดหน้านี้"
      >
        <Trash2 size={20} />
        <span className="text-sm font-medium hidden sm:inline">ลบทั้งหน้า</span>
      </button>
    </div>
  );
}
