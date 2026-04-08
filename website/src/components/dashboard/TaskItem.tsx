import { motion } from 'framer-motion';
import type { Task } from '../../store/taskStore';
import clsx from 'clsx';
import { gravityColorClass, resolveTaskGravity } from '../../lib/gravity';

interface TaskItemProps {
  task: (Task & { gravity?: number }) | {
    title: string;
    gravity?: number;
    urgency?: string;
    deadline?: string;
    dueDate?: string;
  };
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const } },
};

export default function TaskItem({ task }: TaskItemProps) {
  const gravityValue = resolveTaskGravity(task);
  const priorityColor = gravityColorClass(gravityValue);

  const urgencyScore = Math.round(gravityValue).toString();
  const deadlineLabel =
    ('deadline' in task && task.deadline) ||
    ('dueDate' in task && task.dueDate) ||
    'No deadline';

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -1 }}
      className="flex items-center gap-4 bg-white rounded-lg shadow-card px-4 py-3.5 mb-2 transition duration-200"
    >
      {/* Left Priority Bar */}
      <div className={clsx('w-1 h-10 rounded-full shrink-0', priorityColor)} />

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-text-primary truncate">
          {task.title}
        </h4>
      </div>

      <div className="ml-auto flex items-center gap-4 shrink-0">
        <span
          className={clsx(
            'text-xs font-bold px-2.5 py-1 rounded-md',
            gravityValue >= 70
              ? 'bg-accent-red/10 text-accent-red'
              : gravityValue >= 40
                ? 'bg-yellow-500/15 text-yellow-700'
                : 'bg-accent-green/10 text-accent-green'
          )}
        >
          {urgencyScore}
        </span>
        <span className="text-xs font-semibold text-text-secondary">{deadlineLabel}</span>
      </div>
    </motion.div>
  );
}
