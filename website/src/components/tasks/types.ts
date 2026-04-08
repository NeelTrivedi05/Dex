export type TaskPriority = 'Low' | 'Medium' | 'High';

export type TaskUrgency =
  | 'Important + Urgent'
  | 'Important + Not Urgent'
  | 'Not Important + Urgent'
  | 'Not Important + Not Urgent';

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  title: string;
  subject: string;
  priority: TaskPriority;
  urgency: TaskUrgency;
  gradeWeight: number;
  dueDate: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
}

export const URGENCY_LANES: TaskUrgency[] = [
  'Important + Urgent',
  'Important + Not Urgent',
  'Not Important + Urgent',
  'Not Important + Not Urgent',
];

export const KANBAN_HEADER_TONES: Record<TaskUrgency, string> = {
  'Important + Urgent': 'bg-red-100 text-red-700',
  'Important + Not Urgent': 'bg-yellow-100 text-yellow-700',
  'Not Important + Urgent': 'bg-yellow-100 text-yellow-700',
  'Not Important + Not Urgent': 'bg-green-100 text-green-700',
};
