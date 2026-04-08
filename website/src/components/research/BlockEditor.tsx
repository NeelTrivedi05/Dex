import { BookOpen, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

type Block = 
  | { type: 'section-header'; label: string }
  | { type: 'paragraph'; text: string }
  | { type: 'insight-header'; label: string }
  | { type: 'insight-card'; title: string; body: string }
  | { type: 'hypothesis'; label: string; quote: string };

const CONTENT_BLOCKS: Block[] = [
  { type: 'section-header', label: 'ABSTRACT' },
  { type: 'paragraph', text: 'Cognitive Load Theory (CLT) explores the amount of information the working memory can hold at one time. In this session, we map the correlation between instructional design and neural efficiency.' },
  { type: 'insight-header', label: 'KEY INSIGHTS' },
  { type: 'insight-card', title: 'Intrinsic vs. Extrinsic Load', body: 'Intrinsic load is inherent to the complexity of the material itself. Extrinsic load is created by the way information is presented.' },
  { type: 'insight-card', title: 'Germane Load Maximization', body: 'Efforts should focus on fostering germane load — the work put into creating a permanent store of knowledge.' },
  { type: 'hypothesis', label: 'Hypothesis 01', quote: '"Reducing visual split-attention effects significantly lowers EEG-measured theta wave activity in the prefrontal cortex during complex task acquisition."' },
];

export default function BlockEditor() {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <div className="overflow-y-auto px-8 py-6 h-full bg-white relative">
      {CONTENT_BLOCKS.map((block, i) => (
        <div 
          key={i} 
          className="relative group"
          onMouseEnter={() => setHoverIndex(i)}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Top Insert Target */}
          {i === 0 && (
            <div className="h-6 -mt-3 mb-1 w-full border-2 border-dashed border-accent-blue/30 rounded flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-accent-blue text-xs font-semibold">+ Insert Block</span>
            </div>
          )}

          <div className="py-2">
            {block.type === 'section-header' && (
              <div className="flex items-center gap-2 mb-2 font-semibold">
                 <BookOpen size={14} className="text-accent-blue" />
                 <span className="text-accent-blue text-2xs tracking-widest uppercase">{block.label}</span>
              </div>
            )}
            
            {block.type === 'paragraph' && (
              <p className="text-sm text-text-primary leading-relaxed pb-4">
                {block.text}
              </p>
            )}

            {block.type === 'insight-header' && (
              <div className="flex items-center gap-2 mt-6 mb-4 font-semibold">
                 <LayoutGrid size={14} className="text-accent-purple" />
                 <span className="text-accent-purple text-2xs tracking-widest uppercase">{block.label}</span>
              </div>
            )}

            {block.type === 'insight-card' && (
              <div className="bg-white border text-left border-border-default shadow-card border-l-2 !border-l-accent-blue p-3 rounded-md mb-3">
                 <h4 className="text-sm font-semibold text-text-primary mb-1">{block.title}</h4>
                 <p className="text-xs text-text-secondary leading-relaxed">{block.body}</p>
              </div>
            )}

            {block.type === 'hypothesis' && (
              <div className="border-l-4 border-accent-blue bg-blue-50/40 p-4 rounded-r-md mt-6 mb-4">
                 <div className="text-xs font-bold text-accent-blue mb-2 tracking-wide">{block.label}</div>
                 <p className="text-sm text-text-primary italic leading-relaxed font-medium text-text-secondary">
                   {block.quote}
                 </p>
              </div>
            )}
          </div>

          {/* Bottom Insert Target */}
          <div className={clsx(
            "absolute -bottom-3 left-0 right-0 h-6 border-2 border-dashed border-accent-blue/40 rounded flex items-center justify-center transition-opacity cursor-pointer z-10 bg-white/80",
            hoverIndex === i ? "opacity-100" : "opacity-0 hover:opacity-100"
          )}>
            <span className="text-accent-blue text-xs font-semibold">+ Insert Block</span>
          </div>
        </div>
      ))}
      <div className="h-32" /> {/* Spacer */}
    </div>
  );
}
