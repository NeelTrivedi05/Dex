import { motion } from 'framer-motion';
import { Search, Bell, Settings, RefreshCw } from 'lucide-react';
import { useFeedbackStore } from '../../store/feedbackStore';
import { useUIStore } from '../../store/uiStore';
import ThreadCard from './ThreadCard';

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export default function FeedbackHub() {
  const threads = useFeedbackStore((s) => s.threads);
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);

  return (
    <div className="h-full flex flex-col bg-bg-surface overflow-auto">
      {/* Top Bar */}
      <div className="bg-white border-b border-border-subtle px-8 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-accent-blue rounded flex items-center justify-center">
            <span className="text-white font-bold text-xs leading-none">D</span>
          </div>
          <div className="text-sm font-bold text-text-primary">
            Dex <span className="text-text-tertiary">/</span> <span className="text-accent-blue text-xs uppercase tracking-widest">Hub</span>
          </div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            readOnly
            onClick={toggleCommandPalette}
            placeholder="Search threads... ⌘K"
            className="w-80 h-10 pl-9 pr-4 rounded-xl bg-bg-surface text-sm text-text-primary placeholder-text-tertiary border-none outline-none cursor-pointer focus:ring-2 focus:ring-accent-blue/20 transition-shadow"
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="text-text-tertiary hover:text-text-primary transition-colors">
             <RefreshCw size={18} />
          </button>
          <button className="text-text-tertiary hover:text-text-primary transition-colors">
             <Bell size={18} />
          </button>
          <button className="text-text-tertiary hover:text-text-primary transition-colors">
             <Settings size={18} />
          </button>
          <button className="w-8 h-8 rounded-full bg-accent-blue/10 overflow-hidden ml-1">
             <img src="https://i.pravatar.cc/100?img=11" alt="Avatar" className="w-full h-full object-cover" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-8 pt-8 pb-12 max-w-4xl mx-auto w-full flex-1">
        <h1 className="text-display font-bold text-text-primary tracking-tight">Feedback Hub</h1>
        <p className="text-base text-text-secondary mt-2 mb-8 max-w-2xl leading-relaxed">
          Manage scholarly discussions, peer reviews, and collaborative synthesis across active research projects.
        </p>

        <motion.div
           variants={listVariants}
           initial="hidden"
           animate="visible"
        >
           {threads.map((thread) => (
             <ThreadCard key={thread.id} thread={thread} />
           ))}
        </motion.div>
      </div>
    </div>
  );
}
