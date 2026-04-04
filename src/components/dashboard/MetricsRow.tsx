import MetricCard from '../ui/MetricCard';
import { useTaskStore } from '../../store/taskStore';

export default function MetricsRow() {
  const metrics = useTaskStore((s) => s.metrics);

  return (
    <div className="grid grid-cols-4 gap-4 mb-8">
      {/* Due Today */}
      <MetricCard>
        <div className="text-2xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">Due Today</div>
        <div className="flex items-baseline gap-2 mb-4 mt-auto">
          <span className="text-display font-bold text-text-primary leading-none">{metrics.dueToday}</span>
          <span className="text-sm font-medium text-text-secondary">/ {metrics.total} tasks</span>
        </div>
        <div className="w-full bg-border-default/40 h-1 rounded-full overflow-hidden">
          <div
            className="bg-accent-blue h-full rounded-full"
            style={{
              width: `${
                metrics.total === 0 ? 0 : Math.min(100, Math.round((metrics.dueToday / metrics.total) * 100))
              }%`,
            }}
          />
        </div>
      </MetricCard>

      {/* Overdue */}
      <MetricCard>
        <div className="text-2xs font-semibold text-accent-red uppercase tracking-widest mb-3">Overdue</div>
        <div className="flex items-baseline gap-2 mb-4 mt-auto">
          <span className="text-display font-bold text-accent-red leading-none">{String(metrics.overdue).padStart(2, '0')}</span>
          <span className="text-sm font-medium text-text-secondary">Critical Action</span>
        </div>
        <div className="text-xs font-medium text-accent-orange flex items-center gap-1.5">
          <span>⚠</span> Needs immediate review
        </div>
      </MetricCard>

      {/* Weekly Pulse */}
      <MetricCard>
        <div className="text-2xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">Weekly Pulse</div>
        <div className="flex items-baseline gap-2 mb-4 mt-auto">
          <span className="text-display font-bold text-accent-green leading-none">{metrics.weeklyPulse}%</span>
          <span className="text-sm font-medium text-text-secondary">Completion</span>
        </div>
        <div className="text-xs font-medium text-text-secondary">
          <span className="text-accent-green mr-1">↑</span> +5% from last week
        </div>
      </MetricCard>

      {/* Current Focus */}
      <MetricCard>
        <div className="text-2xs font-semibold text-text-tertiary uppercase tracking-widest mb-2">Current Focus</div>
        <div className="text-lg font-bold text-text-primary mb-1 leading-tight truncate">{metrics.focusTask}</div>
        <div className="text-sm text-text-secondary mb-4 truncate">Task list in sync</div>
        <div className="text-xs font-mono font-medium text-accent-blue flex items-center gap-1.5 mt-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
          Timer 01:24:00
        </div>
      </MetricCard>
    </div>
  );
}
