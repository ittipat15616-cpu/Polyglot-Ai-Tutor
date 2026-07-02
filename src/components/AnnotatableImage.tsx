import React, { useRef, useEffect, useState } from 'react';
import { AnnotationState } from './AnnotationToolbar';

interface AnnotatableImageProps {
  src: string;
  alt: string;
  className?: string;
  annotationState: AnnotationState;
  clearTrigger: number; // Increment to clear
  isActive: boolean; // Is annotation enabled
}

interface Point { x: number; y: number }
interface Stroke {
  tool: 'pen' | 'highlighter' | 'eraser';
  points: Point[];
  color: string;
  size: number;
}
interface TextNote {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
}

export default function AnnotatableImage({
  src, alt, className, annotationState, clearTrigger, isActive
}: AnnotatableImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [texts, setTexts] = useState<TextNote[]>([]);
  const [activeTextInput, setActiveTextInput] = useState<{ x: number, y: number, text: string, id: string } | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`annotations_${src}`);
      if (saved) {
        const data = JSON.parse(saved);
        setStrokes(data.strokes || []);
        setTexts(data.texts || []);
      }
    } catch (e) { console.error('Failed to load annotations', e); }
  }, [src]);

  // Save to localStorage
  useEffect(() => {
    if (strokes.length === 0 && texts.length === 0) {
      localStorage.removeItem(`annotations_${src}`);
    } else {
      localStorage.setItem(`annotations_${src}`, JSON.stringify({ strokes, texts }));
    }
  }, [strokes, texts, src]);

  // Handle Clear
  useEffect(() => {
    if (clearTrigger > 0) {
      setStrokes([]);
      setTexts([]);
    }
  }, [clearTrigger]);

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

    allStrokes.forEach(stroke => {
      if (stroke.points.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      if (stroke.tool === 'highlighter') {
        ctx.strokeStyle = stroke.color + '80'; // 50% opacity
        ctx.lineWidth = stroke.size * 3;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'round';
        // Set composite operation for highlighter to multiply or just source-over with opacity
        ctx.globalCompositeOperation = 'multiply';
      } else if (stroke.tool === 'eraser') {
        ctx.strokeStyle = 'rgba(255,255,255,1)';
        ctx.lineWidth = stroke.size * 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.stroke();
    });
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';

    // Draw texts
    texts.forEach(t => {
      ctx.font = `bold ${t.size * 6}px sans-serif`;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    });
  };

  useEffect(() => {
    redraw();
  }, [strokes, currentStroke, texts]);

  const getPos = (e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isActive) return;
    
    const pos = getPos(e);

    if (annotationState.activeTool === 'text') {
      setActiveTextInput({
        id: Date.now().toString(),
        x: pos.x,
        y: pos.y,
        text: ''
      });
      return;
    }

    if (activeTextInput) {
      finishText();
    }

    setIsDrawing(true);
    setCurrentStroke({
      tool: annotationState.activeTool as any,
      color: annotationState.color,
      size: annotationState.size,
      points: [pos]
    });
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || !currentStroke || !isActive) return;
    
    // Prevent scrolling when drawing on touch devices
    if (e.cancelable && e.type.startsWith('touch')) {
        // We handle preventDefault on window level for passive false, but in react it's hard.
        // Instead we can use CSS touch-action: none when isActive
    }

    const pos = getPos(e);
    setCurrentStroke({
      ...currentStroke,
      points: [...currentStroke.points, pos]
    });
  };

  const endDraw = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    setStrokes([...strokes, currentStroke]);
    setCurrentStroke(null);
  };

  const finishText = () => {
    if (activeTextInput && activeTextInput.text.trim()) {
      setTexts([...texts, {
        ...activeTextInput,
        color: annotationState.color,
        size: annotationState.size
      }]);
    }
    setActiveTextInput(null);
  };

  const handleImageLoad = () => {
    const img = imageRef.current;
    const cvs = canvasRef.current;
    if (img && cvs) {
      cvs.width = img.naturalWidth || img.clientWidth;
      cvs.height = img.naturalHeight || img.clientHeight;
      redraw();
    }
  };

  return (
    <div ref={containerRef} className="relative select-none" style={{ touchAction: annotationState.activeTool !== 'none' && isActive ? 'none' : 'auto' }}>
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={className}
        onLoad={handleImageLoad}
        draggable={false}
      />
      
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-crosshair"
        style={{ pointerEvents: annotationState.activeTool !== 'none' && isActive ? 'auto' : 'none' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />

      {activeTextInput && isActive && (
        <div 
          className="absolute z-20"
          style={{ 
            // Position relative to the scaled container
            left: `${(activeTextInput.x / (canvasRef.current?.width || 1)) * 100}%`, 
            top: `${(activeTextInput.y / (canvasRef.current?.height || 1)) * 100}%`,
            transform: 'translateY(-100%)'
          }}
        >
          <input
            autoFocus
            type="text"
            className="bg-transparent border border-dashed border-gray-400 outline-none px-1 min-w-[100px]"
            style={{ 
                color: annotationState.color, 
                fontSize: `${annotationState.size * 2}px`, // roughly scaled for CSS
                fontWeight: 'bold' 
            }}
            value={activeTextInput.text}
            onChange={(e) => setActiveTextInput({ ...activeTextInput, text: e.target.value })}
            onBlur={finishText}
            onKeyDown={(e) => { if (e.key === 'Enter') finishText(); }}
          />
        </div>
      )}
    </div>
  );
}
