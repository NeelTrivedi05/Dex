import Button from '../ui/Button';
import { Plus } from 'lucide-react';
import type { TaskPriority, TaskUrgency } from './types';

interface TaskFormPanelProps {
  subjects: string[];
  title: string;
  subject: string;
  priority: TaskPriority;
  urgency: TaskUrgency;
  gradeWeight: number;
  dueDate: string;
  description: string;
  setTitle: (value: string) => void;
  setSubject: (value: string) => void;
  setPriority: (value: TaskPriority) => void;
  setUrgency: (value: TaskUrgency) => void;
  setDueDate: (value: string) => void;
  setDescription: (value: string) => void;
  onGradeWeightChange: (rawValue: string) => void;
  onAddTask: () => void;
}

export default function TaskFormPanel({
  subjects,
  title,
  subject,
  priority,
  urgency,
  gradeWeight,
  dueDate,
  description,
  setTitle,
  setSubject,
  setPriority,
  setUrgency,
  setDueDate,
  setDescription,
  onGradeWeightChange,
  onAddTask,
}: TaskFormPanelProps) {
  return (
    <div className="w-full lg:w-[380px] bg-white rounded-2xl shadow-card p-8 flex flex-col shrink-0">
      <h2 className="text-xl font-semibold text-[#00BCD4] mb-6">Add New Task</h2>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">Task Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need to do?"
            className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-xl text-sm focus:border-[#00BCD4] outline-none"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Subject/Category</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-xl text-sm focus:border-[#00BCD4] outline-none"
            >
              {subjects.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </div>
          <div className="w-[110px] shrink-0">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-xl text-sm focus:border-[#00BCD4] outline-none"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-xl text-sm focus:border-[#00BCD4] outline-none"
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Urgency</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as TaskUrgency)}
              className="w-full max-w-full truncate px-4 py-2.5 bg-bg-surface border border-border-default rounded-xl text-sm focus:border-[#00BCD4] outline-none"
            >
              <option value="Important + Urgent">Important + Urgent</option>
              <option value="Important + Not Urgent">Important + Not Urgent</option>
              <option value="Not Important + Urgent">Not Important + Urgent</option>
              <option value="Not Important + Not Urgent">Not Important + Not Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">Grade Weight (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value={gradeWeight}
            onChange={(e) => onGradeWeightChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-bg-surface border border-border-default rounded-xl text-sm focus:border-[#00BCD4] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details about this study task..."
            className="w-full px-4 py-3 bg-bg-surface border border-border-default rounded-xl text-sm focus:border-[#00BCD4] outline-none resize-none h-[80px]"
          ></textarea>
        </div>

        <Button
          onClick={onAddTask}
          className="w-full mt-2 bg-[#00BCD4] hover:bg-[#00a3bb] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={18} /> Add Task
        </Button>
      </div>
    </div>
  );
}
