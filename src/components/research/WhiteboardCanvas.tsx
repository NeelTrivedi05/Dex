import { useEffect, useRef, useState } from 'react';
import { Pencil, Hand, Square, Circle, Eraser, MoreHorizontal, ZoomOut, ZoomIn, Layers, Zap } from 'lucide-react';
import Button from '../ui/Button';
import clsx from 'clsx';

type Tool = 'pencil' | 'hand' | 'square' | 'circle' | 'eraser';
type Color = '#1D1D1F' | '#007AFF' | '#FF3B30';

export default function WhiteboardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [activeColor, setActiveColor] = useState<Color>('#1D1D1F');
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set actual size in memory (scaled to account for extra pixel density)
    const setSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);
    return () => window.removeEventListener('resize', setSize);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'pencil' && activeTool !== 'eraser') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = activeTool === 'eraser' ? 20 : 2;
    ctx.strokeStyle = activeTool === 'eraser' ? '#F8F8FA' : activeColor;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const tools: { id: Tool; icon: React.ReactNode }[] = [
    { id: 'hand', icon: <Hand size={16} /> },
    { id: 'pencil', icon: <Pencil size={16} /> },
    { id: 'square', icon: <Square size={16} /> },
    { id: 'circle', icon: <Circle size={16} /> },
    { id: 'eraser', icon: <Eraser size={16} /> },
  ];

  const colors: Color[] = ['#1D1D1F', '#007AFF', '#FF3B30'];

  return (
    <div className="h-full bg-[#F8F8FA] relative flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-[60px] border-b border-border-subtle bg-white/50 backdrop-blur-md px-4 flex items-center justify-between shrink-0 absolute top-0 left-0 right-0 z-20">
         <div className="flex bg-white shadow-card rounded-md p-1 border border-border-subtle">
           {tools.map(t => (
             <button 
               key={t.id}
               onClick={() => setActiveTool(t.id)}
               className={clsx(
                 "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
                 activeTool === t.id ? "bg-accent-blue text-white" : "text-text-secondary hover:bg-bg-surface hover:text-text-primary"
               )}
             >
               {t.icon}
             </button>
           ))}
         </div>

         <div className="flex items-center gap-2">
           <Button variant="ghost" className="h-8 py-0 text-xs">Export Canvas</Button>
           <button className="w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:bg-bg-surface">
             <MoreHorizontal size={18} />
           </button>
         </div>
      </div>

      {/* Canvas Area */}
      <div 
        className="flex-1 relative w-full h-full cursor-crosshair"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0'
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* Floating Annotation Card */}
      <div className="bg-white rounded-lg shadow-elevated p-3 w-52 absolute top-24 right-8 z-20 pointer-events-none">
        <div className="text-accent-orange text-2xs tracking-widest uppercase font-bold mb-2">Annotation</div>
        <p className="text-xs text-text-primary leading-relaxed">
          Check correlation between node alpha and the core synthesis area by Friday.
        </p>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-elevated rounded-full px-4 py-2 border border-border-subtle flex items-center gap-4 z-20">
         <div className="flex gap-2 mr-2">
           {colors.map(c => (
             <button 
               key={c}
               onClick={() => setActiveColor(c)}
               className="w-4 h-4 rounded-full relative"
               style={{ backgroundColor: c }}
             >
               {activeColor === c && (
                 <span className="absolute -inset-1 border border-border-default rounded-full pointer-events-none" />
               )}
             </button>
           ))}
         </div>
         <div className="w-px h-4 bg-border-default" />
         <div className="flex items-center gap-3 text-text-secondary">
           <button className="hover:text-text-primary"><ZoomOut size={16} /></button>
           <span className="text-xs font-semibold w-8 text-center text-text-primary">84%</span>
           <button className="hover:text-text-primary"><ZoomIn size={16} /></button>
         </div>
         <div className="w-px h-4 bg-border-default" />
         <button className="text-text-secondary hover:text-text-primary">
           <Layers size={16} />
         </button>
      </div>

      {/* Bottom Right FAB */}
      <button className="absolute bottom-6 right-6 w-13 h-13 rounded-full bg-accent-blue shadow-elevated flex items-center justify-center text-white hover:scale-105 transition-transform z-20">
        <Zap size={20} className="fill-white" />
      </button>

    </div>
  );
}
