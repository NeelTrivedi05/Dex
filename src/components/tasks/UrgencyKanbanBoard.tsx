import { type DragEvent } from 'react';
import { Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { urgencyColorClass } from '../../lib/gravity';
import { KANBAN_HEADER_TONES, type Task, type TaskStatus, type TaskUrgency } from './types';

interface UrgencyKanbanBoardProps {
  tasksByLane: Array<{ lane: TaskUrgency; items: Task[] }>;
  todayStr: string;
  isDark: boolean;
  activeDropLane: TaskUrgency | null;
  onLaneDragOver: (lane: TaskUrgency, event: DragEvent<HTMLDivElement>) => void;
  onLaneDragLeave: (lane: TaskUrgency) => void;
  onLaneDrop: (lane: TaskUrgency, event: DragEvent<HTMLDivElement>) => void;
  onCardDragStart: (taskId: string, event: DragEvent<HTMLDivElement>) => void;
  onCardDragEnd: () => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function UrgencyKanbanBoard({
  tasksByLane,
  todayStr,
  isDark,
  activeDropLane,
  onLaneDragOver,
  onLaneDragLeave,
  onLaneDrop,
  onCardDragStart,
  onCardDragEnd,
  onStatusChange,
  onDeleteTask,
}: UrgencyKanbanBoardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-8 flex flex-col">
      <h2 className="text-xl font-semibold text-[#00BCD4] mb-6">Kanban Board</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {tasksByLane.map(({ lane, items }) => (
          <div
            key={lane}
            onDragOver={(event) => onLaneDragOver(lane, event)}
            onDragLeave={() => onLaneDragLeave(lane)}
            onDrop={(event) => onLaneDrop(lane, event)}
            className={clsx(
              'rounded-xl border overflow-hidden transition-colors',
              activeDropLane === lane
                ? isDark
                  ? 'border-[#00BCD4]/50 bg-[#00BCD4]/10'
                  : 'border-[#00BCD4] bg-[#EAFBFD]'
                : isDark
                  ? 'border-white/10 bg-black/30'
                  : 'border-border-default bg-[#F7F9FB]'
            )}
          >
            <div className={clsx('px-3 py-2 text-xs font-bold', KANBAN_HEADER_TONES[lane])}>{lane}</div>
            <div className="p-3 min-h-[300px] space-y-3">
              {items.length === 0 ? (
                <div
                  className={clsx(
                    'text-xs text-center py-4 rounded-lg border border-dashed',
                    isDark ? 'text-gray-500 border-white/10' : 'text-text-tertiary border-border-default'
                  )}
                >
                  No tasks
                </div>
              ) : (
                items.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(event) => onCardDragStart(task.id, event)}
                    onDragEnd={onCardDragEnd}
                    className={clsx(
                      'rounded-lg border p-3 transition-colors cursor-grab active:cursor-grabbing',
                      task.status === 'Completed'
                        ? isDark
                          ? 'bg-white/5 border-transparent opacity-60'
                          : 'bg-[#F0F8FA]/60 border-transparent opacity-60'
                        : isDark
                          ? 'bg-black/30 border-white/10'
                          : 'bg-white border-border-default'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <select
                        value={task.status}
                        onChange={(event) => onStatusChange(task.id, event.target.value as TaskStatus)}
                        className={clsx(
                          'px-2 py-1 rounded-md text-[10px] font-bold font-sans outline-none appearance-none cursor-pointer border',
                          task.status === 'Completed'
                            ? 'bg-[#00BCD4]/10 text-[#00BCD4] border-[#00BCD4]/20'
                            : task.status === 'In Progress'
                              ? 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                              : 'bg-bg-surface text-text-secondary border-border-default'
                        )}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className={clsx(
                          'p-1 text-text-tertiary hover:text-accent-red transition-colors rounded',
                          isDark ? 'hover:bg-red-900/20' : 'hover:bg-red-50'
                        )}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div
                      className={clsx(
                        'mt-2 font-semibold text-sm',
                        task.status === 'Completed' ? 'line-through text-text-tertiary' : 'text-text-primary'
                      )}
                    >
                      {task.title}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-text-secondary">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#00BCD4]"></div> {task.subject}
                      </span>
                      <span>Due: {task.dueDate === todayStr ? 'Today' : new Date(task.dueDate).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1">
                        <span className={clsx('w-2 h-2 rounded-full', urgencyColorClass(task.urgency))}></span>
                        {task.urgency}
                      </span>
                      <span>Weight: {task.gradeWeight}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
