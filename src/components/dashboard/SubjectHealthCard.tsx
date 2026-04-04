import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import {
  calculateSubjectHealthSnapshot,
  readCoursesForHealth,
  type SubjectHealthSnapshot,
} from '../../lib/subjectHealth';

const EMPTY_SNAPSHOT: SubjectHealthSnapshot = {
  rows: [],
  overallGpa: 0,
  riskSubjects: [],
  trend: { direction: 'flat', delta: 0 },
};

const statusClassMap: Record<'Healthy' | 'Average' | 'At Risk', string> = {
  Healthy: 'bg-green-100 text-green-700',
  Average: 'bg-amber-100 text-amber-700',
  'At Risk': 'bg-red-100 text-red-700',
};

export default function SubjectHealthCard() {
  const [snapshot, setSnapshot] = useState<SubjectHealthSnapshot>(EMPTY_SNAPSHOT);
  const refreshTimeoutRef = useRef<number | null>(null);

  const refreshSnapshot = () => {
    const courses = readCoursesForHealth();
    setSnapshot(calculateSubjectHealthSnapshot(courses));
  };

  const scheduleRefresh = () => {
    if (refreshTimeoutRef.current !== null) {
      window.clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshTimeoutRef.current = null;
      refreshSnapshot();
    }, 120);
  };

  useEffect(() => {
    refreshSnapshot();

    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === 'college_courses_state') {
        scheduleRefresh();
      }
    };

    window.addEventListener('college_courses_update', scheduleRefresh);
    window.addEventListener('subject_health_update', scheduleRefresh);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('college_courses_update', scheduleRefresh);
      window.removeEventListener('subject_health_update', scheduleRefresh);
      window.removeEventListener('storage', handleStorage);
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const trendMeta = useMemo(() => {
    if (snapshot.trend.direction === 'up') {
      return {
        icon: <TrendingUp size={14} className="text-green-600" />,
        label: `+${snapshot.trend.delta.toFixed(1)} vs last week`,
        textClass: 'text-green-600',
      };
    }

    if (snapshot.trend.direction === 'down') {
      return {
        icon: <TrendingDown size={14} className="text-red-600" />,
        label: `${snapshot.trend.delta.toFixed(1)} vs last week`,
        textClass: 'text-red-600',
      };
    }

    return {
      icon: <Minus size={14} className="text-text-tertiary" />,
      label: 'No change vs last week',
      textClass: 'text-text-tertiary',
    };
  }, [snapshot.trend.delta, snapshot.trend.direction]);

  const primaryRisk = snapshot.riskSubjects[0];

  return (
    <section className="mt-8 bg-white rounded-xl shadow-card border border-border-default p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-text-primary leading-tight">Subject Health</h2>
          <p className="text-sm text-text-secondary">Syllabus progress driven GPA projection</p>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold text-text-secondary">GPA Projection</div>
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-2xl font-bold text-text-primary">{snapshot.overallGpa.toFixed(1)}</span>
            {trendMeta.icon}
          </div>
          <div className={clsx('text-xs font-semibold', trendMeta.textClass)}>{trendMeta.label}</div>
        </div>
      </div>

      {primaryRisk && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            {primaryRisk.subjectCode} is at risk - only {primaryRisk.completedChapters}/{primaryRisk.totalChapters} chapters completed
          </span>
        </div>
      )}

      {snapshot.rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border-default px-4 py-6 text-sm text-text-secondary text-center">
          No syllabus data yet. Add chapters in College / Courses / Syllabus.
        </div>
      ) : (
        <div className="space-y-3">
          {snapshot.rows.map((row) => (
            <div
              key={row.subjectId}
              className="grid grid-cols-1 lg:grid-cols-[130px_1fr_90px_120px] gap-3 lg:gap-4 items-center rounded-lg border border-border-default px-3 py-3"
            >
              <div>
                <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold', row.colorClass)}>
                  {row.subjectCode}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-1.5 rounded-full bg-[#E5E7EB] w-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${row.score}%`,
                      backgroundColor: row.progressColor,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-text-secondary min-w-[42px] text-right">{row.score}%</span>
              </div>

              <div className="text-sm font-bold text-text-primary">{row.grade}</div>

              <div>
                <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', statusClassMap[row.status])}>
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
