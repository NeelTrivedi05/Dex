export function calculateGravity(
  gradeWeight: number,
  urgency: number,
  _hoursRemaining?: number
): number {
  const normalizedWeight = Math.max(0, Math.min(100, gradeWeight));
  const normalizedUrgency = Math.max(0, Math.min(100, urgency));
  return Math.round((normalizedUrgency * normalizedWeight) / 100);
}

const URGENCY_SCORE_MAP: Record<string, number> = {
  'Important + Urgent': 90,
  'Important + Not Urgent': 65,
  'Not Important + Urgent': 55,
  'Not Important + Not Urgent': 25,
};

export function urgencyToScore(urgency?: string | number): number {
  if (typeof urgency === 'number' && Number.isFinite(urgency)) {
    return Math.max(0, Math.min(100, urgency));
  }
  if (!urgency) return 50;
  return URGENCY_SCORE_MAP[urgency] ?? 50;
}

export function resolveTaskGravity(task: {
  gravity?: number;
  urgency?: string | number;
  gradeWeight?: number;
  weight?: number;
}): number {
  if (typeof task.gravity === 'number' && Number.isFinite(task.gravity)) {
    return Math.max(0, Math.min(100, task.gravity));
  }

  const urgencyScore = urgencyToScore(task.urgency);

  const gradeWeight =
    typeof task.gradeWeight === 'number' && Number.isFinite(task.gradeWeight)
      ? Math.max(0, Math.min(100, task.gradeWeight))
      : typeof task.weight === 'number' && Number.isFinite(task.weight)
        ? Math.max(0, Math.min(100, task.weight))
        : null;

  if (gradeWeight === null) return urgencyScore;
  return calculateGravity(gradeWeight, urgencyScore);
}

export function gravityColorClass(gravity: number): string {
  if (gravity >= 70) return 'bg-accent-red';
  if (gravity >= 40) return 'bg-yellow-500';
  return 'bg-accent-green';
}

export function urgencyColorClass(urgency?: string | number): string {
  const score = urgencyToScore(urgency);
  if (score >= 80) return 'bg-accent-red';
  if (score >= 45) return 'bg-yellow-500';
  return 'bg-accent-green';
}
