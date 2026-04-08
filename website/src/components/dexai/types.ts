export interface DexSubject {
  id: string;
  name: string;
  code?: string;
  color: string;
  icon: string;
  teacher?: string;
  description?: string;
}

export interface TimetableSlot {
  id: string;
  dayOfWeek: number; // 0 = Mon, 6 = Sun
  timeSlot: string; // HH:MM
  subjectId: string;
  classType: 'Lecture' | 'Lab' | 'Tutorial' | 'Self-Study';
  durationHours: number;
  room?: string;
}

export interface SyllabusChapter {
  id: string;
  name: string;
  prepared: boolean;
}

export interface DexExam {
  id: string;
  subjectId: string;
  title: string;
  date: string; // ISO date
  venue?: string;
  weight: number;
  syllabus: SyllabusChapter[];
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  pastExamScore?: number;
  isCompleted?: boolean;
}

export interface StudySessionLog {
  id: string;
  date: string; // ISO
  subjectId?: string;
  chapter?: string;
  durationMinutes: number;
  timerMode: 'Pomodoro' | 'Deep Work' | 'Custom';
  mood?: string;
  completedAt: string; // ISO timestamp
}

export interface GeneratedStudySession {
  subject: string;
  chapter: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: 'Study' | 'Revision' | 'Practice' | 'Break';
  notes: string;
}

export interface StudyPlanDay {
  date: string;
  day: string;
  sessions: GeneratedStudySession[];
  totalStudyMinutes: number;
  motivationalTip: string;
}

export interface StudyPlan {
  plan: StudyPlanDay[];
  summary: {
    totalDays: number;
    totalStudyHours: number;
    subjectBreakdown: Record<string, number>;
    readinessScore: number;
    riskAssessment: string;
    topRecommendations: string[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
