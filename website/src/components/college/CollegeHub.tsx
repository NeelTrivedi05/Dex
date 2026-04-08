import { useUIStore } from '../../store/uiStore';
import CalendarView from './CalendarView';
import TimetableView from './TimetableView';
import CoursesView from './CoursesView';
import ExamsDashboard from './ExamsDashboard';

export default function CollegeHub() {
  const activeCollegeSubView = useUIStore((s) => s.activeCollegeSubView);

  return (
    <div className="h-full w-full bg-bg-surface overflow-auto">
      {activeCollegeSubView === 'calendar' && <CalendarView />}
      {activeCollegeSubView === 'timetable' && <TimetableView />}
      {activeCollegeSubView === 'courses' && <CoursesView />}
      {activeCollegeSubView === 'exams' && <ExamsDashboard />}
    </div>
  );
}
