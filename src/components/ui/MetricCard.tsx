import type { ReactNode } from 'react';
import clsx from 'clsx';

interface MetricCardProps {
  children: ReactNode;
  className?: string;
}

export default function MetricCard({ children, className }: MetricCardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-card p-5 flex flex-col',
        className
      )}
    >
      {children}
    </div>
  );
}
