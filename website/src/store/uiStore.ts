import { create } from 'zustand';

export type View = 'dashboard' | 'notes' | 'live-notes' | 'resources' | 'dexai' | 'research' | 'feedback' | 'focus' | 'college' | 'tasks' | 'settings' | 'auth';
export type NotesSubView = 'main' | 'summarizer' | 'flashcards' | 'quiz';
export type CollegeSubView = 'calendar' | 'timetable' | 'courses' | 'exams';
export type ThemeMode = 'light' | 'dark';
export type UIMode = 'normal' | 'exam';

interface DeadlineNotification {
  id: string;
  taskId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface DeadlineTaskLike {
  id?: string;
  title?: string;
  dueDate?: string;
  status?: string;
}

const NOTIFICATIONS_KEY = 'dex_notifications';
const UI_MODE_KEY = 'dex_ui_mode';

const VIEW_ACCESS_POLICY: Record<View, { normal: boolean; exam: boolean }> = {
  dashboard: { normal: true, exam: false },
  notes: { normal: true, exam: true },
  'live-notes': { normal: false, exam: true },
  resources: { normal: false, exam: true },
  dexai: { normal: true, exam: false },
  research: { normal: true, exam: false },
  feedback: { normal: true, exam: false },
  focus: { normal: true, exam: false },
  college: { normal: true, exam: false },
  tasks: { normal: true, exam: false },
  settings: { normal: true, exam: false },
  auth: { normal: true, exam: true },
};

const isViewAllowedInMode = (view: View, mode: UIMode): boolean => VIEW_ACCESS_POLICY[view][mode];

const fallbackViewForMode = (mode: UIMode): View => (mode === 'exam' ? 'notes' : 'dashboard');
const initialMode: UIMode = localStorage.getItem(UI_MODE_KEY) === 'exam' ? 'exam' : 'normal';

const readNotifications = (): DeadlineNotification[] => {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry.id === 'string');
  } catch {
    return [];
  }
};

const writeNotifications = (notifications: DeadlineNotification[]) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications.slice(0, 40)));
};

const dueDateToMs = (value?: string): number => {
  if (!value) return Number.NaN;
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  const normalized = dateOnlyPattern.test(value) ? `${value}T23:59:59.999` : value;
  return new Date(normalized).getTime();
};

const hoursUntil = (dueDate?: string): number => {
  const due = dueDateToMs(dueDate);
  if (Number.isNaN(due)) return Number.NaN;
  return Math.round((due - Date.now()) / (1000 * 60 * 60));
};

interface UIState {
  activeView: View;
  activeNotesSubView: NotesSubView;
  activeCollegeSubView: CollegeSubView;
  uiMode: UIMode;
  commandPaletteOpen: boolean;
  remindersEnabled: boolean;
  reminderTime: string;
  theme: ThemeMode;
  notifications: DeadlineNotification[];
  notificationsOpen: boolean;
  unreadNotifications: number;
  setView: (v: View) => void;
  setNotesSubView: (v: NotesSubView) => void;
  setCollegeSubView: (v: CollegeSubView) => void;
  setUIMode: (mode: UIMode) => void;
  toggleUIMode: () => void;
  setRemindersEnabled: (enabled: boolean) => void;
  setReminderTime: (time: string) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  saveReminderSettings: () => void;
  previewReminderNotification: () => Promise<{ success: boolean; message: string }>;
  toggleNotificationsPanel: () => void;
  closeNotificationsPanel: () => void;
  markAllNotificationsRead: () => void;
  syncDeadlineNotifications: (tasks: DeadlineTaskLike[]) => void;
  toggleCommandPalette: () => void;
  closeCommandPalette: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeView: fallbackViewForMode(initialMode),
  activeNotesSubView: 'main',
  activeCollegeSubView: 'calendar',
  uiMode: initialMode,
  commandPaletteOpen: false,
  remindersEnabled: localStorage.getItem('dex_settings_reminders_enabled') === 'true',
  reminderTime: localStorage.getItem('dex_settings_reminder_time') || '20:00',
  theme: localStorage.getItem('dex_theme') === 'dark' ? 'dark' : 'light',
  notifications: readNotifications(),
  notificationsOpen: false,
  unreadNotifications: readNotifications().filter((entry) => !entry.read).length,
  setView: (v) =>
    set((state) => {
      if (!isViewAllowedInMode(v, state.uiMode)) {
        return { activeView: fallbackViewForMode(state.uiMode) };
      }
      return { activeView: v };
    }),
  setNotesSubView: (v) => set({ activeNotesSubView: v }),
  setCollegeSubView: (v) => set({ activeCollegeSubView: v }),
  setUIMode: (mode) =>
    set((state) => {
      localStorage.setItem(UI_MODE_KEY, mode);
      if (!isViewAllowedInMode(state.activeView, mode)) {
        return { uiMode: mode, activeView: fallbackViewForMode(mode) };
      }
      return { uiMode: mode };
    }),
  toggleUIMode: () =>
    set((state) => {
      const nextMode: UIMode = state.uiMode === 'normal' ? 'exam' : 'normal';
      localStorage.setItem(UI_MODE_KEY, nextMode);
      if (!isViewAllowedInMode(state.activeView, nextMode)) {
        return { uiMode: nextMode, activeView: fallbackViewForMode(nextMode) };
      }
      return { uiMode: nextMode };
    }),
  setRemindersEnabled: (enabled) => set({ remindersEnabled: enabled }),
  setReminderTime: (time) => set({ reminderTime: time }),
  setTheme: (theme) =>
    set(() => {
      localStorage.setItem('dex_theme', theme);
      window.dispatchEvent(new Event('dex_theme_update'));
      return { theme };
    }),
  toggleTheme: () =>
    set((state) => {
      const nextTheme: ThemeMode = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('dex_theme', nextTheme);
      window.dispatchEvent(new Event('dex_theme_update'));
      return { theme: nextTheme };
    }),
  saveReminderSettings: () =>
    set((state) => {
      localStorage.setItem('dex_settings_reminders_enabled', String(state.remindersEnabled));
      localStorage.setItem('dex_settings_reminder_time', state.reminderTime);
      window.dispatchEvent(new Event('dex_settings_update'));
      return state;
    }),
  previewReminderNotification: async () => {
    if (!('Notification' in window)) {
      return { success: false, message: 'Notifications are not supported in this browser.' };
    }

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    if (Notification.permission !== 'granted') {
      return { success: false, message: 'Notification permission is blocked. Enable it in browser settings.' };
    }

    new Notification('Dex Reminder', {
      body: 'Review your tasks and close one high-priority item now.',
    });

    return { success: true, message: 'Reminder preview sent.' };
  },
  toggleNotificationsPanel: () => set((s) => ({ notificationsOpen: !s.notificationsOpen })),
  closeNotificationsPanel: () => set({ notificationsOpen: false }),
  markAllNotificationsRead: () =>
    set((state) => {
      const next = state.notifications.map((entry) => ({ ...entry, read: true }));
      writeNotifications(next);
      return { notifications: next, unreadNotifications: 0 };
    }),
  syncDeadlineNotifications: (tasks) => {
    const state = get();
    const nearDeadlineTasks = tasks.filter((task) => {
      if (!task?.id || task.status === 'Completed') return false;
      const hours = hoursUntil(task.dueDate);
      return Number.isFinite(hours) && hours <= 24;
    });

    if (nearDeadlineTasks.length === 0) {
      return;
    }

    const existingById = new Set(state.notifications.map((entry) => entry.id));
    const additions: DeadlineNotification[] = [];

    for (const task of nearDeadlineTasks) {
      const notificationId = `deadline-${task.id}`;
      if (existingById.has(notificationId)) continue;

      const hours = hoursUntil(task.dueDate);
      const message = hours <= 0
        ? 'Task is overdue. Please review it now.'
        : `Task deadline is near (${hours}h remaining).`;

      additions.push({
        id: notificationId,
        taskId: task.id as string,
        title: task.title || 'Untitled Task',
        message,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }

    if (additions.length === 0) {
      return;
    }

    const next = [...additions, ...state.notifications].slice(0, 40);
    writeNotifications(next);
    set({
      notifications: next,
      unreadNotifications: next.filter((entry) => !entry.read).length,
    });

    if ('Notification' in window && Notification.permission === 'granted') {
      additions.forEach((entry) => {
        new Notification('Dex Deadline Alert', {
          body: `${entry.title}: ${entry.message}`,
        });
      });
    }
  },
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
}));
