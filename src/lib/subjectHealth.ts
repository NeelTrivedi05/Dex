export interface CourseSyllabusChapter {
  id: string;
  name: string;
  completed: boolean;
}

export interface CourseForHealth {
  id: string;
  code: string;
  name: string;
  colorClass: string;
  chapters: CourseSyllabusChapter[];
}

export interface SubjectHealthRow {
  subjectId: string;
  subjectCode: string;
  colorClass: string;
  completedChapters: number;
  totalChapters: number;
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'At Risk';
  gpaPoints: number;
  status: 'Healthy' | 'Average' | 'At Risk';
  progressColor: string;
}

export interface SubjectHealthSnapshot {
  rows: SubjectHealthRow[];
  overallGpa: number;
  riskSubjects: SubjectHealthRow[];
  trend: {
    direction: 'up' | 'down' | 'flat';
    delta: number;
  };
}

interface GpaHistoryEntry {
  at: string;
  gpa: number;
}

interface CourseSyncShape {
  id: string;
  code: string;
  colorClass: string;
}

const COURSES_STATE_KEY = 'college_courses_state';
const GPA_HISTORY_KEY = 'subject_health_gpa_history';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const toGrade = (score: number): SubjectHealthRow['grade'] => {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'At Risk';
};

const toGpaPoints = (score: number): number => {
  if (score >= 90) return 4.0;
  if (score >= 75) return 3.0;
  if (score >= 60) return 2.0;
  if (score >= 40) return 1.0;
  return 0.0;
};

const toStatus = (score: number): SubjectHealthRow['status'] => {
  if (score >= 80) return 'Healthy';
  if (score >= 50) return 'Average';
  return 'At Risk';
};

const toProgressColor = (score: number): string => {
  if (score >= 80) return '#4caf50';
  if (score >= 50) return '#ff9800';
  return '#f44336';
};

const parseSubjectColor = (colorClass: string): string => {
  const match = colorClass.match(/bg-\[(#[0-9A-Fa-f]{6})\]/);
  if (match?.[1]) return match[1];
  return '#94A3B8';
};

const sanitizeCourse = (value: unknown): CourseForHealth | null => {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;

  const id = typeof source.id === 'string' && source.id.trim() ? source.id : `course-${Math.random().toString(36).slice(2, 10)}`;
  const code = typeof source.code === 'string' && source.code.trim() ? source.code.trim() : 'GEN';
  const name = typeof source.name === 'string' && source.name.trim() ? source.name.trim() : 'General';
  const colorClass = typeof source.colorClass === 'string' && source.colorClass.trim()
    ? source.colorClass.trim()
    : 'bg-gray-100 text-gray-700';

  const rawChapters = Array.isArray(source.chapters) ? source.chapters : [];
  const chapters: CourseSyllabusChapter[] = rawChapters
    .filter((chapter) => chapter && typeof chapter === 'object')
    .map((chapter, idx) => {
      const c = chapter as Record<string, unknown>;
      return {
        id: typeof c.id === 'string' && c.id.trim() ? c.id : `${id}-ch-${idx + 1}`,
        name: typeof c.name === 'string' && c.name.trim() ? c.name.trim() : `Chapter ${idx + 1}`,
        completed: Boolean(c.completed),
      };
    });

  return {
    id,
    code,
    name,
    colorClass,
    chapters,
  };
};

const readGpaHistory = (): GpaHistoryEntry[] => {
  try {
    const raw = localStorage.getItem(GPA_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((entry) => entry && typeof entry === 'object')
      .map((entry) => {
        const item = entry as Record<string, unknown>;
        return {
          at: typeof item.at === 'string' ? item.at : '',
          gpa: typeof item.gpa === 'number' ? item.gpa : Number(item.gpa),
        };
      })
      .filter((entry) => entry.at && Number.isFinite(entry.gpa));
  } catch {
    return [];
  }
};

const writeGpaHistory = (history: GpaHistoryEntry[]) => {
  localStorage.setItem(GPA_HISTORY_KEY, JSON.stringify(history.slice(-180)));
};

const deriveTrend = (currentGpa: number, history: GpaHistoryEntry[]): SubjectHealthSnapshot['trend'] => {
  if (history.length === 0) {
    return { direction: 'flat', delta: 0 };
  }

  const now = Date.now();
  const target = now - WEEK_MS;
  const candidates = history
    .map((entry) => ({ ...entry, atMs: new Date(entry.at).getTime() }))
    .filter((entry) => Number.isFinite(entry.atMs))
    .sort((a, b) => a.atMs - b.atMs);

  const baseline = [...candidates].reverse().find((entry) => entry.atMs <= target);
  if (!baseline) {
    return { direction: 'flat', delta: 0 };
  }

  const delta = Math.round((currentGpa - baseline.gpa) * 10) / 10;

  if (delta > 0.05) return { direction: 'up', delta };
  if (delta < -0.05) return { direction: 'down', delta };
  return { direction: 'flat', delta: 0 };
};

export const calculateSubjectHealthSnapshot = (courses: CourseForHealth[]): SubjectHealthSnapshot => {
  const rows = courses.map((course) => {
    const totalChapters = course.chapters.length;
    const completedChapters = course.chapters.filter((chapter) => chapter.completed).length;
    const score = totalChapters === 0 ? 0 : clamp(Math.round((completedChapters / totalChapters) * 100), 0, 100);

    return {
      subjectId: course.id,
      subjectCode: course.code,
      colorClass: course.colorClass,
      completedChapters,
      totalChapters,
      score,
      grade: toGrade(score),
      gpaPoints: toGpaPoints(score),
      status: toStatus(score),
      progressColor: toProgressColor(score),
    };
  });

  const overallGpa = rows.length === 0
    ? 0
    : Math.round((rows.reduce((sum, row) => sum + row.gpaPoints, 0) / rows.length) * 10) / 10;

  const history = readGpaHistory();
  const trend = deriveTrend(overallGpa, history);

  return {
    rows,
    overallGpa,
    riskSubjects: rows.filter((row) => row.score < 50),
    trend,
  };
};

export const readCoursesForHealth = (): CourseForHealth[] => {
  try {
    const raw = localStorage.getItem(COURSES_STATE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(sanitizeCourse)
      .filter((course): course is CourseForHealth => course !== null);
  } catch {
    return [];
  }
};

export const syncSubjectHealthHistory = (snapshot: SubjectHealthSnapshot): void => {
  const history = readGpaHistory();
  const nowIso = new Date().toISOString();
  const latest = history[history.length - 1];

  if (!latest || Math.abs(latest.gpa - snapshot.overallGpa) > 0.01) {
    writeGpaHistory([...history, { at: nowIso, gpa: snapshot.overallGpa }]);
  }
};

export const persistCoursesState = <T extends CourseSyncShape>(courses: T[]): SubjectHealthSnapshot => {
  localStorage.setItem(COURSES_STATE_KEY, JSON.stringify(courses));

  const dexSubjects = courses.map((course) => ({
    id: course.id,
    name: course.code,
    color: parseSubjectColor(course.colorClass),
  }));

  localStorage.setItem('dexai_subjects', JSON.stringify(dexSubjects));

  const healthCourses = courses
    .map((course) => sanitizeCourse(course))
    .filter((course): course is CourseForHealth => course !== null);

  const snapshot = calculateSubjectHealthSnapshot(healthCourses);
  syncSubjectHealthHistory(snapshot);

  window.dispatchEvent(new Event('dex_subjects_update'));
  window.dispatchEvent(new Event('college_courses_update'));
  window.dispatchEvent(new Event('subject_health_update'));

  return snapshot;
};
