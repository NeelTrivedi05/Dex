import { useState, useEffect, type DragEvent } from 'react';
import { CheckSquare, CheckCircle2, Clock, Flame } from 'lucide-react';
import clsx from 'clsx';
import { DEXAI_KEYS, readDexaiJson, writeDexaiJson } from '../../lib/dexaiStorage';
import { useUIStore } from '../../store/uiStore';
import TaskFormPanel from './TaskFormPanel';
import UrgencyKanbanBoard from './UrgencyKanbanBoard';
import { type Task, type TaskPriority, type TaskStatus, type TaskUrgency, URGENCY_LANES } from './types';

const DEFAULT_SUBJECTS = [
  'General',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History',
  'Economics',
];

const normalizeUrgency = (task: Partial<Task>): TaskUrgency => {
  if (task.urgency) return task.urgency;
  if (task.priority === 'High') return 'Important + Urgent';
  if (task.priority === 'Medium') return 'Important + Not Urgent';
  return 'Not Important + Not Urgent';
};

const priorityToDefaultGradeWeight = (priority?: TaskPriority): number => {
  if (priority === 'High') return 85;
  if (priority === 'Medium') return 65;
  return 40;
};

const normalizeGradeWeight = (gradeWeight: unknown, fallback: number): number => {
  const numeric = typeof gradeWeight === 'number' ? gradeWeight : Number(gradeWeight);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, numeric));
};

const normalizeStoredTask = (task: Partial<Task>): Task => {
  const priority = task.priority || 'Medium';
  const fallbackWeight = priorityToDefaultGradeWeight(priority);

  return {
    id: task.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    title: task.title || 'Untitled Task',
    subject: task.subject || 'General',
    priority,
    urgency: normalizeUrgency(task),
    gradeWeight: normalizeGradeWeight(task.gradeWeight, fallbackWeight),
    dueDate: task.dueDate || new Date().toISOString().split('T')[0],
    description: task.description || '',
    status: task.status || 'Not Started',
    createdAt: task.createdAt || new Date().toISOString(),
  };
};

const createTaskId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export default function TasksManager() {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [urgency, setUrgency] = useState<TaskUrgency>('Important + Urgent');
  const [gradeWeight, setGradeWeight] = useState<number>(65);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropLane, setActiveDropLane] = useState<TaskUrgency | null>(null);

  useEffect(() => {
    const storedTasks = readDexaiJson<Partial<Task>[]>(DEXAI_KEYS.TASKS, []);
    if (storedTasks.length > 0) {
      setTasks(storedTasks.map(normalizeStoredTask));
    }

    const storedSubjects = readDexaiJson<Array<{ name?: string }>>(DEXAI_KEYS.SUBJECTS, []);
    if (storedSubjects.length > 0) {
      const merged = [...DEFAULT_SUBJECTS, ...storedSubjects.map((s) => s.name || '').filter(Boolean)];
      setSubjects(Array.from(new Set(merged)));
    }

    const settingsUrgency = localStorage.getItem('dex_settings_default_urgency') as TaskUrgency | null;
    const settingsShowCompleted = localStorage.getItem('dex_settings_show_completed_tasks');
    if (settingsUrgency) setUrgency(settingsUrgency);
    if (settingsShowCompleted !== null) setShowCompletedTasks(settingsShowCompleted === 'true');

    const handleSettingsUpdate = () => {
      const nextUrgency = localStorage.getItem('dex_settings_default_urgency') as TaskUrgency | null;
      const nextShowCompleted = localStorage.getItem('dex_settings_show_completed_tasks');
      if (nextUrgency) setUrgency(nextUrgency);
      if (nextShowCompleted !== null) setShowCompletedTasks(nextShowCompleted === 'true');
    };

    window.addEventListener('dex_settings_update', handleSettingsUpdate);
    return () => window.removeEventListener('dex_settings_update', handleSettingsUpdate);
  }, []);

  const saveTasks = (nextTasks: Task[]) => {
    setTasks(nextTasks);
    writeDexaiJson(DEXAI_KEYS.TASKS, nextTasks);
    window.dispatchEvent(new Event('dex_tasks_update'));
  };

  const handleAddTask = () => {
    if (!title.trim()) return;

    const newTask: Task = {
      id: createTaskId(),
      title,
      subject,
      priority,
      urgency,
      gradeWeight: normalizeGradeWeight(gradeWeight, priorityToDefaultGradeWeight(priority)),
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      description,
      status: 'Not Started',
      createdAt: new Date().toISOString(),
    };

    saveTasks([...tasks, newTask]);
    setTitle('');
    setDescription('');
    setUrgency((localStorage.getItem('dex_settings_default_urgency') as TaskUrgency) || 'Important + Urgent');
    setGradeWeight(priorityToDefaultGradeWeight(priority));
  };

  const updateStatus = (id: string, newStatus: TaskStatus) => {
    saveTasks(tasks.map((task) => (task.id === id ? { ...task, status: newStatus } : task)));
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter((task) => task.id !== id));
  };

  const moveTaskToLane = (taskId: string, lane: TaskUrgency) => {
    saveTasks(tasks.map((task) => (task.id === taskId ? { ...task, urgency: lane } : task)));
  };

  const handleLaneDragOver = (lane: TaskUrgency, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (activeDropLane !== lane) setActiveDropLane(lane);
  };

  const handleLaneDragLeave = (lane: TaskUrgency) => {
    if (activeDropLane === lane) setActiveDropLane(null);
  };

  const handleLaneDrop = (lane: TaskUrgency, event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedId = event.dataTransfer.getData('text/plain') || draggedTaskId;
    setActiveDropLane(null);
    if (!droppedId) return;

    const task = tasks.find((entry) => entry.id === droppedId);
    if (!task || task.urgency === lane) {
      setDraggedTaskId(null);
      return;
    }

    moveTaskToLane(droppedId, lane);
    setDraggedTaskId(null);
  };

  const handleCardDragStart = (taskId: string, event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleCardDragEnd = () => {
    setDraggedTaskId(null);
    setActiveDropLane(null);
  };

  const totalTasks = tasks.length;
  const completed = tasks.filter((task) => task.status === 'Completed').length;
  const pending = tasks.filter((task) => task.status !== 'Completed').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const dueToday = tasks.filter((task) => task.dueDate === todayStr && task.status !== 'Completed').length;
  const inProgress = tasks.filter((task) => task.status === 'In Progress').length;
  const notStarted = tasks.filter((task) => task.status === 'Not Started').length;
  const progressPct = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

  const statusGraph = [
    { label: 'Completed', value: completed, tone: '#00BCD4' },
    { label: 'In Progress', value: inProgress, tone: '#3B82F6' },
    { label: 'Not Started', value: notStarted, tone: '#94A3B8' },
  ];
  const graphMax = Math.max(1, ...statusGraph.map((item) => item.value));

  const visibleTasks = tasks
    .filter((task) => showCompletedTasks || task.status !== 'Completed')
    .slice()
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const tasksByLane = URGENCY_LANES.map((lane) => ({
    lane,
    items: visibleTasks.filter((task) => task.urgency === lane),
  }));

  return (
    <div className={clsx('w-full h-full overflow-y-auto p-10 animate-in fade-in', isDark ? 'bg-black' : 'bg-gradient-to-br from-[#F0F8FF] to-[#E6F4F1]')}>
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        <div className="text-center flex flex-col items-center">
          <h1 className="text-[2.5rem] font-bold text-[#00BCD4] font-sans">Study Task Manager</h1>
          <p className="text-text-secondary mt-2">Organize your study schedule and track your progress</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-card p-6 flex items-center justify-between">
            <div className="w-14 h-14 rounded-full bg-[#00BCD4] text-white flex items-center justify-center">
              <CheckSquare size={24} />
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-text-secondary mb-1">Total Tasks</div>
              <div className="text-4xl font-bold text-[#00BCD4] leading-none">{totalTasks}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 flex items-center justify-between">
            <div className="w-14 h-14 rounded-full bg-[#00BCD4] text-white flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-text-secondary mb-1">Completed</div>
              <div className="text-4xl font-bold text-[#00BCD4] leading-none">{completed}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 flex items-center justify-between">
            <div className="w-14 h-14 rounded-full bg-[#00BCD4] text-white flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-text-secondary mb-1">Pending</div>
              <div className="text-4xl font-bold text-[#00BCD4] leading-none">{pending}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6 flex items-center justify-between">
            <div className="w-14 h-14 rounded-full bg-[#00BCD4] text-white flex items-center justify-center">
              <Flame size={24} />
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-text-secondary mb-1">Due Today</div>
              <div className="text-4xl font-bold text-[#00BCD4] leading-none">{dueToday}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-card p-8 flex flex-col h-fit">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#00BCD4]">Overall Progress</h2>
                <div className="text-xl font-bold text-[#00BCD4]">{progressPct}%</div>
              </div>

              <div className="w-full h-4 bg-bg-surface rounded-full overflow-hidden mb-8 shadow-inner">
                <div className="h-full bg-[#00BCD4] rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }}></div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className={clsx('flex-1 rounded-xl p-4 flex items-center justify-between text-sm', isDark ? 'bg-white/5' : 'bg-[#F0F8FA]')}>
                  <span className="text-text-secondary font-medium">Completed</span>
                  <span className="text-[#00BCD4] font-bold">{completed}</span>
                </div>
                <div className={clsx('flex-1 rounded-xl p-4 flex items-center justify-between text-sm', isDark ? 'bg-white/5' : 'bg-[#F0F8FA]')}>
                  <span className="text-text-secondary font-medium">In Progress</span>
                  <span className="text-[#00BCD4] font-bold">{inProgress}</span>
                </div>
                <div className={clsx('flex-1 rounded-xl p-4 flex items-center justify-between text-sm', isDark ? 'bg-white/5' : 'bg-[#F0F8FA]')}>
                  <span className="text-text-secondary font-medium">Not Started</span>
                  <span className="text-[#00BCD4] font-bold">{notStarted}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-8 flex-1 min-h-[280px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-[#00BCD4]">Task Status Graph</h2>
                <span className="text-xs font-semibold text-text-secondary">Live Distribution</span>
              </div>

              <div className={clsx('rounded-xl border p-5 h-[230px]', isDark ? 'border-white/10 bg-white/[0.02]' : 'border-border-subtle bg-bg-surface/40')}>
                <div className="h-full flex items-end gap-6">
                  {statusGraph.map((item) => {
                    const height = Math.max(10, Math.round((item.value / graphMax) * 180));
                    return (
                      <div key={item.label} className="flex-1 h-full flex flex-col justify-end items-center gap-3">
                        <div className="text-xs font-semibold text-text-secondary">{item.value}</div>
                        <div className="w-full max-w-[120px] rounded-t-xl transition-all duration-300" style={{ height: `${height}px`, backgroundColor: item.tone }} />
                        <div className="text-xs font-semibold text-text-secondary text-center">{item.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <TaskFormPanel
            subjects={subjects}
            title={title}
            subject={subject}
            priority={priority}
            urgency={urgency}
            gradeWeight={gradeWeight}
            dueDate={dueDate}
            description={description}
            setTitle={setTitle}
            setSubject={setSubject}
            setPriority={setPriority}
            setUrgency={setUrgency}
            setDueDate={setDueDate}
            setDescription={setDescription}
            onGradeWeightChange={(rawValue) => setGradeWeight(normalizeGradeWeight(rawValue, 65))}
            onAddTask={handleAddTask}
          />
        </div>

        {tasks.length > 0 && (
          <UrgencyKanbanBoard
            tasksByLane={tasksByLane}
            todayStr={todayStr}
            isDark={isDark}
            activeDropLane={activeDropLane}
            onLaneDragOver={handleLaneDragOver}
            onLaneDragLeave={handleLaneDragLeave}
            onLaneDrop={handleLaneDrop}
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={handleCardDragEnd}
            onStatusChange={updateStatus}
            onDeleteTask={deleteTask}
          />
        )}
      </div>
    </div>
  );
}
