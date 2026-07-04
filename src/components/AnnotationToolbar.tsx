import React, { useState } from 'react';
import { PenTool, Type, Eraser, Trash2, Highlighter, Minus, MousePointer2, Bold, Italic, Underline, Smile, X } from 'lucide-react';

export type ToolType = 'none' | 'pen' | 'text' | 'eraser' | 'highlighter' | 'sticker';
export type ToolColor = string;
export type ToolSize = number;

export interface AnnotationState {
  activeTool: ToolType;
  color: ToolColor;
  size: ToolSize;
  fontSize?: number;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  stickerSize?: number;
  composedSticker?: string;
}

interface AnnotationToolbarProps {
  state: AnnotationState;
  onChange: (newState: AnnotationState) => void;
  onClear: () => void;
}

const COLOR_PALETTE: Record<string, { dark: string; light: string; label: string }> = {
  black: { dark: '#000000', light: '#808080', label: 'ดำ' }, // Grey highlighter
  red: { dark: '#FF0000', light: '#E60000', label: 'แดง (อาทิตย์)' }, // Neon red (1 shade darker)
  yellow: { dark: '#FFD700', light: '#FFFF00', label: 'เหลือง (จันทร์)' }, // Fluorescent yellow
  pink: { dark: '#FF1493', light: '#FF00FF', label: 'ชมพู (อังคาร)' }, // Magenta/Neon pink
  green: { dark: '#008000', light: '#00FF00', label: 'เขียว (พุธ)' }, // Lime/Neon green
  orange: { dark: '#FFA500', light: '#FF8000', label: 'ส้ม (พฤหัสบดี)' }, // Neon orange (1 shade darker)
  blue: { dark: '#0000FF', light: '#00FFFF', label: 'ฟ้า (ศุกร์)' }, // Cyan/Aqua
  purple: { dark: '#800080', light: '#B026FF', label: 'ม่วง (เสาร์)' }, // Neon purple
};

// Removed SIZES array
const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Comic Sans MS', value: "'Comic Sans MS', cursive" }
];

const EMOJI_CATEGORIES = [
  { name: 'Faces', emojis: ['😀', '😂', '🥰', '😎', '🤔', '😭', '😡', '😴', '🤯', '🥳'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👏', '🙌', '✌️', '🙏', '💪', '🤝', '👋', '🤟'] },
  { name: 'Symbols', emojis: ['❤️', '✨', '🔥', '⭐', '💯', '✅', '❌', '❗', '❓', '💬'] },
  { name: 'Objects', emojis: ['🎉', '🎁', '🏆', '🥇', '📚', '✏️', '💡', '📌', '🎨', '🎵'] }
];

export default function AnnotationToolbar({ state, onChange, onClear }: AnnotationToolbarProps) {
  const [isDraggingSticker, setIsDraggingSticker] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

  const updateState = (updates: Partial<AnnotationState>) => {
    let newColor = updates.color || state.color;
    
    // Auto-switch shade if tool changes between pen and highlighter
    if (updates.activeTool && (updates.activeTool === 'pen' || updates.activeTool === 'highlighter' || updates.activeTool === 'text')) {
      const baseKey = Object.keys(COLOR_PALETTE).find(k => 
         COLOR_PALETTE[k].dark === state.color || COLOR_PALETTE[k].light === state.color
      );
      if (baseKey) {
         if (updates.activeTool === 'highlighter' && baseKey === 'black') {
            newColor = COLOR_PALETTE['yellow'].light; // Fallback to yellow
         } else {
            newColor = updates.activeTool === 'highlighter' 
               ? COLOR_PALETTE[baseKey].light 
               : COLOR_PALETTE[baseKey].dark;
         }
      }
    }

    onChange({ ...state, ...updates, color: newColor });
  };

  const defaultFontSize = state.fontSize || 24;
  const defaultFontFamily = state.fontFamily || FONT_FAMILIES[0].value;

  return (
    <div className="flex gap-2 mx-auto w-fit z-40 transition-all pointer-events-auto items-start relative">
      <div className="flex flex-col gap-2 items-center">
        <div className="flex flex-wrap items-center justify-center gap-2 p-2 bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl w-fit">
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
              onClick={() => updateState({ activeTool: 'highlighter', size: 16 })}
              className={`p-2 rounded-lg transition-all ${state.activeTool === 'highlighter' ? 'bg-yellow-100 text-yellow-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              title="ไฮไลท์"
            >
              <Highlighter size={20} />
            </button>
            <button
              onClick={() => updateState({ activeTool: 'text', fontSize: defaultFontSize, fontFamily: defaultFontFamily })}
              className={`p-2 rounded-lg transition-all ${state.activeTool === 'text' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              title="พิมพ์ข้อความ"
            >
              <Type size={20} />
            </button>
            <button
              onClick={() => updateState({ activeTool: 'sticker', stickerSize: state.stickerSize || 48, composedSticker: state.composedSticker || '' })}
              className={`p-2 rounded-lg transition-all ${state.activeTool === 'sticker' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
              title="สติกเกอร์"
            >
              <Smile size={20} />
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

          {/* Colors */}
          {state.activeTool !== 'eraser' && state.activeTool !== 'none' && (
            <>
              <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />
              <div className="flex items-center gap-1.5 px-1">
                {Object.values(COLOR_PALETTE).map((c) => {
                  const isHighlighter = state.activeTool === 'highlighter';
                  if (isHighlighter && c.label === 'ดำ') return null;
                  const targetColor = isHighlighter ? c.light : c.dark;
                  const isActive = state.color === targetColor;
                  return (
                    <button
                      key={c.label}
                      onClick={() => updateState({ color: targetColor })}
                      style={{ backgroundColor: targetColor }}
                      className={`w-6 h-6 rounded-full shadow-sm transition-transform ${isActive ? 'scale-125 ring-2 ring-offset-1 ring-indigo-500' : 'hover:scale-110'}`}
                      title={c.label}
                    />
                  );
                })}
              </div>
            </>
          )}

          {/* Thickness Input */}
          {state.activeTool !== 'text' && state.activeTool !== 'none' && state.activeTool !== 'sticker' && (
            <>
              <div className="w-px h-8 bg-gray-200 mx-1 hidden sm:block" />
              <div className="flex items-center gap-1 border border-gray-300 rounded-lg bg-white overflow-hidden px-1">
                <input 
                  type="number" 
                  value={state.size || 2} 
                  onChange={(e) => updateState({ size: Math.max(1, parseInt(e.target.value) || 2) })}
                  className="w-12 py-1 text-center text-sm outline-none bg-transparent"
                  min="1" max="100"
                />
                <span className="text-xs text-gray-500 pr-1">px</span>
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
        
        {/* Text Properties Sub-toolbar */}
        {state.activeTool === 'text' && (
          <div className="flex flex-wrap items-center justify-center gap-3 p-2 bg-white/90 backdrop-blur-md border border-gray-200 shadow-md rounded-xl w-fit animate-in slide-in-from-top-2">
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg bg-white overflow-hidden px-1">
                <input 
                  type="number" 
                  value={state.fontSize || 24} 
                  onChange={(e) => updateState({ fontSize: parseInt(e.target.value) || 24 })}
                  className="w-12 py-1 text-center text-sm outline-none bg-transparent"
                  min="10" max="100"
                />
                <span className="text-xs text-gray-500 pr-1">px</span>
            </div>

            <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-lg">
                <button
                  onClick={() => updateState({ isBold: !state.isBold })}
                  className={`p-1.5 rounded-md transition-colors ${state.isBold ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-200'}`}
                  title="ตัวหนา"
                >
                  <Bold size={16} />
                </button>
                <button
                  onClick={() => updateState({ isItalic: !state.isItalic })}
                  className={`p-1.5 rounded-md transition-colors ${state.isItalic ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-200'}`}
                  title="ตัวเอียง"
                >
                  <Italic size={16} />
                </button>
                <button
                  onClick={() => updateState({ isUnderline: !state.isUnderline })}
                  className={`p-1.5 rounded-md transition-colors ${state.isUnderline ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-200'}`}
                  title="ขีดเส้นใต้"
                >
                  <Underline size={16} />
                </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticker Sub-toolbar */}
      {state.activeTool === 'sticker' && (
        <div className="flex flex-col gap-3 p-3 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl w-[320px] animate-in slide-in-from-top-2">
          
          {/* Composer Area */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-gray-500 text-center">แตะตรงจุดที่ต้องการบนกระดาษเพื่อปั๊มสติกเกอร์ <br/>(หรือลากช่องนี้ไปวางสำหรับคอมพิวเตอร์)</span>
            <div className="flex items-center gap-2">
              <div 
                className={`flex-1 min-h-[48px] border-2 border-dashed rounded-xl p-2 flex items-center justify-center text-3xl cursor-grab active:cursor-grabbing transition-colors relative z-50 ${isDraggingSticker ? 'bg-indigo-50 border-indigo-400 shadow-xl scale-110 opacity-80' : 'bg-gray-50 border-gray-300 hover:bg-gray-100'}`}
                style={isDraggingSticker ? { position: 'fixed', left: dragPos.x, top: dragPos.y, transform: 'translate(-50%, -50%)', width: '80px', pointerEvents: 'none' } : {}}
                draggable
                onDragStart={(e) => {
                  if (!state.composedSticker) {
                     e.preventDefault();
                     return;
                  }
                  e.dataTransfer.setData('text/plain', JSON.stringify({ 
                    type: 'sticker', 
                    text: state.composedSticker, 
                    size: state.stickerSize || 48 
                  }));
                }}
                onTouchStart={(e) => {
                  if (!state.composedSticker) return;
                  setIsDraggingSticker(true);
                  setDragPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                }}
                onTouchMove={(e) => {
                  if (!isDraggingSticker) return;
                  setDragPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
                }}
                onTouchEnd={(e) => {
                  if (!isDraggingSticker) return;
                  setIsDraggingSticker(false);
                  const target = document.elementFromPoint(dragPos.x, dragPos.y);
                  if (target && target.tagName === 'CANVAS') {
                    const event = new CustomEvent('customStickerDrop', {
                       detail: {
                          x: dragPos.x,
                          y: dragPos.y,
                          sticker: state.composedSticker,
                          size: state.stickerSize || 48
                       }
                    });
                    target.dispatchEvent(event);
                  }
                }}
              >
                {state.composedSticker || <span className="text-sm text-gray-400">เลือกสติกเกอร์ด้านล่าง...</span>}
              </div>
              {isDraggingSticker && (
                 <div className="flex-1 min-h-[48px] bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-xl"></div>
              )}
              <button 
                onClick={() => updateState({ composedSticker: '' })}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="ล้าง"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* Size Control */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">ขนาดสติกเกอร์</span>
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg bg-gray-50 overflow-hidden px-1">
               <input 
                  type="number" 
                  value={state.stickerSize || 48} 
                  onChange={(e) => updateState({ stickerSize: parseInt(e.target.value) || 48 })}
                  className="w-14 py-1 text-center text-sm outline-none bg-transparent"
                  min="20" max="200"
               />
               <span className="text-xs text-gray-500 pr-1">px</span>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* Emoji Tray */}
          <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
            {EMOJI_CATEGORIES.map(cat => (
              <div key={cat.name} className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{cat.name}</span>
                <div className="flex flex-wrap gap-1">
                  {cat.emojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => updateState({ composedSticker: (state.composedSticker || '') + emoji })}
                      className="text-2xl w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}
