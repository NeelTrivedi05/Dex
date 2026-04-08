import { motion } from 'framer-motion';
import { MessageSquare, Eye } from 'lucide-react';
import Badge from '../ui/Badge';
import type { FeedbackThread } from '../../store/feedbackStore';

interface ThreadCardProps {
  thread: FeedbackThread;
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function ThreadCard({ thread }: ThreadCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -1 }}
      className="bg-white rounded-lg shadow-card border border-border-subtle px-6 py-5 mb-4 hover:border-accent-blue hover:shadow-elevated transition-all duration-200 cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-2">
         <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <Badge label="" status={thread.status} />
            <span className="text-xs text-text-secondary font-mono tracking-wide">ID: {thread.refId}</span>
         </div>
         <span className="text-xs text-text-tertiary font-medium">{thread.timeAgo}</span>
      </div>

      <h3 className="text-xl font-semibold text-text-primary mt-2 mb-1 group-hover:text-accent-blue transition-colors">
        {thread.title}
      </h3>
      <p className="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed pr-8">
        {thread.preview}
      </p>

      <div className="flex items-center justify-between border-t border-border-subtle pt-4">
         <div className="flex items-center">
            <div className="flex">
               {thread.avatars.map((av, i) => (
                 <div
                   key={i}
                   className="w-7 h-7 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center text-xs font-semibold border-2 border-white -ml-2 first:ml-0 relative z-10"
                   style={{ zIndex: 10 - i }}
                 >
                   {av}
                 </div>
               ))}
               {thread.extraAvatars && (
                 <div className="w-7 h-7 rounded-full bg-bg-surface flex items-center justify-center text-xs font-bold text-text-secondary border-2 border-white -ml-2 relative z-0">
                   +{thread.extraAvatars}
                 </div>
               )}
            </div>
         </div>

         <div className="flex items-center gap-4 text-xs font-semibold text-text-secondary">
            <div className="flex items-center gap-1.5 hover:text-text-primary transition-colors">
               <MessageSquare size={14} className="text-text-tertiary" />
               {thread.commentCount}
            </div>
            <div className="flex items-center gap-1.5 hover:text-text-primary transition-colors">
               <Eye size={14} className="text-text-tertiary" />
               {thread.viewCount}
            </div>
         </div>
      </div>
    </motion.div>
  );
}
