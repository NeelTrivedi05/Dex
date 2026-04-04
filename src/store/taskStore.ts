import { create } from 'zustand';
import { calculateGravity } from '../lib/gravity';
import { DEXAI_KEYS, readDexaiJson } from '../lib/dexaiStorage';

export interface Task {
  id: string;
  title: string;
  subject: string;
  subjectColor: 'purple' | 'blue' | 'green' | 'gray' | 'orange';
  deadline: string;
  hoursRemaining: number;
  gradeWeight: number;
  weight: number;
  urgency: number;
  status: 'pending' | 'in_progress' | 'overdue' | 'completed';
  gravity: number;
  recurring?: boolean;
}

export interface StoredTask {
  id?: string;
  title?: string;
  subject?: string;
  dueDate?: string;
  priority?: string;
  urgency?: string;
  gradeWeight?: number;
  description?: string;
  createdAt?: string;
  status?: 'Not Started' | 'In Progress' | 'Completed';
}

const ALLOWED_PRIORITIES = new Set(['Low', 'Medium', 'High']);
const ALLOWED_URGENCIES = new Set([
  'Important + Urgent',
  'Important + Not Urgent',
  'Not Important + Urgent',
  'Not Important + Not Urgent',
]);
const ALLOWED_STATUSES = new Set(['Not Started', 'In Progress', 'Completed']);

const sanitizeTaskString = (value: unknown, fallback: string, maxLength: number): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (trimmed.length === 0) return fallback;
  return trimmed.slice(0, maxLength);
};

const isValidDateValue = (value: string): boolean => {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp);
};

const normalizeImportedTask = (value: unknown): StoredTask | null => {
  if (!value || typeof value !== 'object') return null;
  const task = value as Record<string, unknown>;

  const id = sanitizeTaskString(task.id, `task-${Math.random().toString(36).slice(2, 10)}`, 64);
  const title = sanitizeTaskString(task.title, 'Untitled Task', 160);
  const subject = sanitizeTaskString(task.subject, 'General', 80);
  const priority = ALLOWED_PRIORITIES.has(task.priority as string) ? (task.priority as StoredTask['priority']) : 'Medium';
  const urgency = ALLOWED_URGENCIES.has(task.urgency as string)
    ? (task.urgency as StoredTask['urgency'])
    : 'Important + Not Urgent';
  const status = ALLOWED_STATUSES.has(task.status as string)
    ? (task.status as StoredTask['status'])
    : 'Not Started';
  const dueDateRaw = sanitizeTaskString(task.dueDate, new Date().toISOString().slice(0, 10), 32);
  const dueDate = isValidDateValue(dueDateRaw) ? dueDateRaw : new Date().toISOString().slice(0, 10);
  const rawGradeWeight =
    typeof task.gradeWeight === 'number'
      ? task.gradeWeight
      : typeof task.weight === 'number'
        ? task.weight
        : Number(task.gradeWeight ?? task.weight);
  const gradeWeight = Number.isFinite(rawGradeWeight)
    ? Math.max(0, Math.min(100, rawGradeWeight))
    : undefined;
  const description = sanitizeTaskString(task.description, '', 1200);
  const createdAtRaw = sanitizeTaskString(task.createdAt, new Date().toISOString(), 64);
  const createdAt = isValidDateValue(createdAtRaw) ? createdAtRaw : new Date().toISOString();

  return {
    id,
    title,
    subject,
    priority,
    urgency,
    gradeWeight,
    status,
    dueDate,
    description,
    createdAt,
  };
};

interface DashboardMetrics {
  total: number;
  completed: number;
  dueToday: number;
  overdue: number;
  weeklyPulse: number;
  focusTask: string;
}

const urgencyToScore = (urgency?: string): number => {
  if (urgency === 'Important + Urgent') return 90;
  if (urgency === 'Important + Not Urgent') return 65;
  if (urgency === 'Not Important + Urgent') return 55;
  if (urgency === 'Not Important + Not Urgent') return 25;
  return 50;
};

const priorityToWeight = (priority?: string): number => {
  if (priority === 'High') return 85;
  if (priority === 'Medium') return 65;
  return 40;
};

const subjectColorByName = (subject?: string): Task['subjectColor'] => {
  if (!subject) return 'gray';
  const s = subject.toLowerCase();
  if (s.includes('math') || s.includes('physics')) return 'blue';
  if (s.includes('bio') || s.includes('chem')) return 'green';
  if (s.includes('history') || s.includes('english')) return 'orange';
  if (s.includes('computer')) return 'purple';
  return 'gray';
};

const dueDateToComparableMs = (dueDate?: string): number => {
  if (!dueDate) return Number.NaN;
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const normalized = dateOnlyPattern.test(dueDate) ? `${dueDate}T23:59:59.999` : dueDate;
  return new Date(normalized).getTime();
};

const isSameLocalDay = (timestamp: number, reference: Date): boolean => {
  if (!Number.isFinite(timestamp)) return false;
  const date = new Date(timestamp);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
};

const hoursRemainingFromDueDate = (dueDate?: string): number => {
  if (!dueDate) return 24;
  const due = dueDateToComparableMs(dueDate);
  if (Number.isNaN(due)) return 24;
  return Math.max(0, Math.round((due - Date.now()) / (1000 * 60 * 60)));
};

const deadlineLabelFromHours = (hoursRemaining: number): string => {
  if (hoursRemaining <= 0) return 'Due now';
  if (hoursRemaining < 24) return `${hoursRemaining}h remaining`;
  if (hoursRemaining < 48) return 'Tomorrow';
  return `${Math.ceil(hoursRemaining / 24)}d remaining`;
};

const toDashboardStatus = (status: StoredTask['status'], hoursRemaining: number): Task['status'] => {
  if (status === 'Completed') return 'completed';
  if (status === 'In Progress') return 'in_progress';
  if (hoursRemaining <= 0) return 'overdue';
  return 'pending';
};

const mapStoredTaskToDashboardTask = (task: StoredTask): Task => {
  const hoursRemaining = hoursRemainingFromDueDate(task?.dueDate);
  const status = toDashboardStatus(task?.status, hoursRemaining);
  const gradeWeight =
    typeof task?.gradeWeight === 'number' && Number.isFinite(task.gradeWeight)
      ? Math.max(0, Math.min(100, task.gradeWeight))
      : priorityToWeight(task?.priority);
  const urgency = urgencyToScore(task?.urgency);
  const gravity = status === 'completed' ? 0 : calculateGravity(gradeWeight, urgency);

  return {
    id: task?.id || `dashboard-${Math.random().toString(36).slice(2, 10)}`,
    title: task?.title || 'Untitled Task',
    subject: String(task?.subject || 'GENERAL').toUpperCase(),
    subjectColor: subjectColorByName(task?.subject),
    deadline: status === 'completed' ? 'Completed' : deadlineLabelFromHours(hoursRemaining),
    hoursRemaining,
    gradeWeight,
    weight: gradeWeight,
    urgency,
    status,
    gravity,
  };
};

const buildDashboardMetrics = (storedTasks: StoredTask[], mappedTasks: Task[]): DashboardMetrics => {
  const now = new Date();
  const total = storedTasks.length;
  const completed = mappedTasks.filter((task) => task.status === 'completed').length;
  const dueToday = storedTasks.filter((task) => {
    if (task.status === 'Completed') return false;
    const dueAt = dueDateToComparableMs(task.dueDate);
    return isSameLocalDay(dueAt, now);
  }).length;
  const overdue = mappedTasks.filter((task) => task.status === 'overdue').length;
  const weeklyPulse = total === 0 ? 0 : Math.round((completed / total) * 100);
  const focusTask = mappedTasks.find((task) => task.status !== 'completed')?.title || 'No Active Task';

  return {
    total,
    completed,
    dueToday,
    overdue,
    weeklyPulse,
    focusTask,
  };
};

interface TaskState {
  tasks: Task[];
  metrics: DashboardMetrics;
  hasInitializedSync: boolean;
  syncFromStorage: () => void;
  initializeTaskSync: () => () => void;
  exportTasksPayload: () => string;
  importTasksFromJson: (jsonPayload: string) => boolean;
  clearCompletedTasks: () => boolean;
  getSortedByGravity: () => Task[];
  getDashboardMetrics: () => DashboardMetrics;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  metrics: {
    total: 0,
    completed: 0,
    dueToday: 0,
    overdue: 0,
    weeklyPulse: 0,
    focusTask: 'No Active Task',
  },
  hasInitializedSync: false,
  syncFromStorage: () => {
    const rawTasks = readDexaiJson<StoredTask[]>(DEXAI_KEYS.TASKS, []);
    const mapped = rawTasks.map(mapStoredTaskToDashboardTask);
    const metrics = buildDashboardMetrics(rawTasks, mapped);
    const sortedActive = mapped
      .filter((task) => task.status !== 'completed')
      .sort((a, b) => b.gravity - a.gravity);

    set({ tasks: sortedActive, metrics });
  },
  initializeTaskSync: () => {
    if (get().hasInitializedSync) return () => undefined;

    get().syncFromStorage();
    const handleTaskUpdate = () => get().syncFromStorage();
    window.addEventListener('dex_tasks_update', handleTaskUpdate);
    window.addEventListener('storage', handleTaskUpdate);

    set({ hasInitializedSync: true });

    return () => {
      window.removeEventListener('dex_tasks_update', handleTaskUpdate);
      window.removeEventListener('storage', handleTaskUpdate);
      set({ hasInitializedSync: false });
    };
  },
  exportTasksPayload: () => localStorage.getItem(DEXAI_KEYS.TASKS) || '[]',
  importTasksFromJson: (jsonPayload: string) => {
    try {
      const parsed = JSON.parse(jsonPayload);
      if (!Array.isArray(parsed)) return false;

      const normalized = parsed
        .map(normalizeImportedTask)
        .filter((task): task is StoredTask => task !== null);

      if (normalized.length === 0 && parsed.length > 0) return false;

      localStorage.setItem(DEXAI_KEYS.TASKS, JSON.stringify(normalized));
      window.dispatchEvent(new Event('dex_tasks_update'));
      get().syncFromStorage();
      return true;
    } catch {
      return false;
    }
  },
  clearCompletedTasks: () => {
    try {
      const parsed = readDexaiJson<StoredTask[]>(DEXAI_KEYS.TASKS, []);
      const activeTasks = parsed.filter((task) => task.status !== 'Completed');
      localStorage.setItem(DEXAI_KEYS.TASKS, JSON.stringify(activeTasks));
      window.dispatchEvent(new Event('dex_tasks_update'));
      get().syncFromStorage();
      return true;
    } catch {
      return false;
    }
  },
  getSortedByGravity: () => get().tasks,
  getDashboardMetrics: () => get().metrics,
}));
