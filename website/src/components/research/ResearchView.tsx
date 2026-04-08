import BlockEditor from './BlockEditor';
import WhiteboardCanvas from './WhiteboardCanvas';
import Button from '../ui/Button';

export default function ResearchView() {
  return (
    <div className="h-full flex flex-col overflow-hidden bg-bg-surface">
      {/* Header Bar */}
      <div className="border-b border-border-subtle px-6 py-4 flex items-center justify-between bg-white shrink-0 z-10 relative">
        <div className="flex items-center gap-4">
           <h1 className="text-xl font-bold text-text-primary">The Neural Correlates of Cognitive Load</h1>
           <div className="flex items-center gap-1.5 bg-green-50 rounded-full px-3 py-1">
             <div className="w-1.5 h-1.5 bg-accent-green rounded-full animate-pulse" />
             <span className="text-xs font-semibold text-accent-green tracking-wide uppercase">Live Syncing</span>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center">
             <div className="flex">
               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 border-2 border-white relative z-30">AC</div>
               <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700 border-2 border-white -ml-2 relative z-20">EV</div>
               <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-700 border-2 border-white -ml-2 relative z-10">SJ</div>
             </div>
             <div className="w-8 h-8 rounded-full bg-bg-surface flex items-center justify-center text-xs font-bold text-text-secondary border border-border-default -ml-2 relative z-0">
               +4
             </div>
           </div>
           <div className="w-px h-6 bg-border-default" />
           <Button variant="ghost" className="h-8 py-0">Export</Button>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Block Editor */}
        <div className="w-[55%] border-r border-border-subtle bg-white h-full shrink-0">
           <BlockEditor />
        </div>

        {/* Right Side - Whiteboard */}
        <div className="w-[45%] h-full shrink-0">
           <WhiteboardCanvas />
        </div>
      </div>
    </div>
  );
}
