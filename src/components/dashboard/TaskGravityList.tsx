import { motion } from 'framer-motion';
import { useTaskStore } from '../../store/taskStore';
import TaskItem from './TaskItem';

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export default function TaskGravityList() {
  const tasks = useTaskStore((s) => s.getSortedByGravity());

  return (
    <section>
      <header className="flex items-end justify-between mb-4 mt-2">
        <div>
          <h2 className="text-2xl font-bold text-text-primary leading-tight">Task Gravity</h2>
          <p className="text-sm text-text-secondary mt-0.5">Urgency x Grade Weight</p>
        </div>
      </header>

      <motion.div
        variants={listVariants}
        initial="hidden"
        animate="visible"
      >
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </motion.div>
    </section>
  );
}
