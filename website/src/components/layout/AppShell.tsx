import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useUIStore } from '../../store/uiStore';
import { useTaskStore } from '../../store/taskStore';
import { DEXAI_KEYS, readDexaiJson } from '../../lib/dexaiStorage';
import Sidebar from './Sidebar';
import CommandPalette from '../ui/CommandPalette';
import Dashboard from '../dashboard/Dashboard';
import CollaborativeHub from '../collab/CollaborativeHub';
import FeedbackHub from '../feedback/FeedbackHub';
import NotesHub from '../notes/NotesHub';
import LiveNotes from '../notes/LiveNotes';
import DexAIHub from '../dexai/DexAIHub';
import FocusTimerApp from '../focus/FocusTimerApp';
import CollegeHub from '../college/CollegeHub';
import TasksManager from '../tasks/TasksManager';
import SettingsHub from '../settings/SettingsHub';
import ResourcesHub from '../resources/ResourcesHub';
import AuthHub from '../auth/AuthHub';

const viewVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

const transition = { duration: 0.18, ease: [0.4, 0, 0.2, 1] as const };

export default function AppShell() {
  const activeView = useUIStore((s) => s.activeView);
  const theme = useUIStore((s) => s.theme);
  const initializeTaskSync = useTaskStore((s) => s.initializeTaskSync);
  const syncDeadlineNotifications = useUIStore((s) => s.syncDeadlineNotifications);

  useEffect(() => {
    const cleanup = initializeTaskSync();
    return cleanup;
  }, [initializeTaskSync]);

  useEffect(() => {
    const syncFromStorage = () => {
      const tasks = readDexaiJson<Array<{ id?: string; title?: string; dueDate?: string; status?: string }>>(
        DEXAI_KEYS.TASKS,
        []
      );
      syncDeadlineNotifications(tasks);
    };

    syncFromStorage();
    const unsubscribeTaskStore = useTaskStore.subscribe(() => {
      syncFromStorage();
    });

    return () => {
      unsubscribeTaskStore();
    };
  }, [syncDeadlineNotifications]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    document.body.style.background = theme === 'dark' ? '#000000' : '#F5F5F7';
  }, [theme]);

  return (
    <div
      className={`h-screen w-screen overflow-hidden grid ${theme === 'dark' ? 'bg-black' : 'bg-bg-surface'}`}
      style={{ gridTemplateColumns: '220px 1fr' }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className={`overflow-y-auto relative ${theme === 'dark' ? 'bg-black' : 'bg-bg-surface'}`}>
        <AnimatePresence mode="wait">
          {activeView === 'auth' && (
            <motion.div
              key="auth"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full h-full"
            >
              <AuthHub />
            </motion.div>
          )}
          {activeView === 'dashboard' && (
            <motion.div
              key="dashboard"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full"
            >
              <Dashboard />
            </motion.div>
          )}
          {activeView === 'research' && (
            <motion.div
              key="research"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full h-full"
            >
              <CollaborativeHub />
            </motion.div>
          )}
          {activeView === 'feedback' && (
            <motion.div
              key="feedback"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full"
            >
              <FeedbackHub />
            </motion.div>
          )}
          {activeView === 'notes' && (
            <motion.div
              key="notes"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full h-full"
            >
              <NotesHub />
            </motion.div>
          )}
          {activeView === 'live-notes' && (
            <motion.div
              key="live-notes"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full h-full"
            >
              <LiveNotes />
            </motion.div>
          )}
          {activeView === 'resources' && (
            <motion.div
              key="resources"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full h-full"
            >
              <ResourcesHub />
            </motion.div>
          )}
          {activeView === 'dexai' && (
            <motion.div
              key="dexai"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full h-full"
            >
              <DexAIHub />
            </motion.div>
          )}
          {activeView === 'focus' && (
            <motion.div
              key="focus"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full h-full"
            >
              <FocusTimerApp />
            </motion.div>
          )}
          {activeView === 'college' && (
            <motion.div
              key="college"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full h-full"
            >
              <CollegeHub />
            </motion.div>
          )}
          {activeView === 'tasks' && (
            <motion.div
              key="tasks"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full h-full"
            >
              <TasksManager />
            </motion.div>
          )}
          {activeView === 'settings' && (
            <motion.div
              key="settings"
              variants={viewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="min-h-full h-full"
            >
              <SettingsHub />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
