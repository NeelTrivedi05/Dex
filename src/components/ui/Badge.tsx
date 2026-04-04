import clsx from 'clsx';

type SubjectColor = 'purple' | 'blue' | 'green' | 'gray' | 'orange';
type StatusColor = 'in_review' | 'discussion' | 'completed';

interface BadgeProps {
  label: string;
  subjectColor?: SubjectColor;
  status?: StatusColor;
  className?: string;
}

const subjectColorMap: Record<SubjectColor, string> = {
  purple: 'bg-purple-50 text-purple-700',
  blue: 'bg-blue-50 text-blue-700',
  green: 'bg-green-50 text-green-700',
  gray: 'bg-gray-100 text-gray-600',
  orange: 'bg-orange-50 text-orange-700',
};

const statusColorMap: Record<StatusColor, string> = {
  in_review: 'bg-amber-50 text-amber-700 border border-amber-200',
  discussion: 'bg-blue-50 text-blue-700 border border-blue-200',
  completed: 'bg-green-50 text-green-700 border border-green-200',
};

const statusLabelMap: Record<StatusColor, string> = {
  in_review: 'IN REVIEW',
  discussion: 'DISCUSSION',
  completed: 'COMPLETED',
};

export default function Badge({ label, subjectColor, status, className }: BadgeProps) {
  const colorClass = status
    ? statusColorMap[status]
    : subjectColor
    ? subjectColorMap[subjectColor]
    : 'bg-gray-100 text-gray-600';

  const displayLabel = status ? statusLabelMap[status] : label;

  return (
    <span
      className={clsx(
        'inline-flex items-center text-2xs font-semibold tracking-widest uppercase px-2.5 py-1 rounded-md whitespace-nowrap',
        colorClass,
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
