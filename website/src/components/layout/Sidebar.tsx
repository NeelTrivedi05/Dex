import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  MessageSquare,
  Settings,
  StickyNote,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronDown,
  Clock,
  GraduationCap,
  Calendar,
  TableProperties,
  Library,
  Target,
  FolderOpen,
  FilePenLine,
} from 'lucide-react';
import { useUIStore, type View } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { getUserInitials } from '../../lib/userDisplay';
import clsx from 'clsx';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  view?: View;
  examOnly?: boolean;
  static?: boolean;
  subItems?: { id: string; label: string; icon: React.ReactNode; subView: string }[];
}

const primaryNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, view: 'dashboard' },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} />, view: 'tasks' },
  {
    id: 'notes', label: 'Notes', icon: <StickyNote size={16} />, view: 'notes',
    subItems: [
      { id: 'summarizer', label: 'AI Summarizer', icon: <Sparkles size={14} />, subView: 'summarizer' },
      { id: 'flashcards', label: 'Flashcard Generator', icon: <Layers size={14} />, subView: 'flashcards' },
      { id: 'quiz', label: 'Quiz Maker', icon: <CheckCircle2 size={14} />, subView: 'quiz' }
    ]
  },
  { id: 'live-notes', label: 'Live Notes', icon: <FilePenLine size={16} />, view: 'live-notes', examOnly: true },
  { id: 'resources', label: 'Resource Shelf', icon: <FolderOpen size={16} />, view: 'resources', examOnly: true },
  { id: 'focus', label: 'Focus Timer', icon: <Clock size={16} />, view: 'focus' },
  { id: 'dexai', label: 'Dex AI', icon: <Sparkles size={16} />, view: 'dexai' },
  {
    id: 'college', label: 'College', icon: <GraduationCap size={16} />, view: 'college',
    subItems: [
      { id: 'calendar', label: 'Google Calendar', icon: <Calendar size={14} />, subView: 'calendar' },
      { id: 'timetable', label: 'Timetable', icon: <TableProperties size={14} />, subView: 'timetable' },
      { id: 'courses', label: 'Courses', icon: <Library size={14} />, subView: 'courses' },
      { id: 'exams', label: 'Exams', icon: <Target size={14} />, subView: 'exams' }
    ]
  },
  { id: 'research', label: 'Collaborative Hub', icon: <Users size={16} />, view: 'research' },
  { id: 'feedback', label: 'Feedback Hub', icon: <MessageSquare size={16} />, view: 'feedback' },
];

const secondaryNav: NavItem[] = [
  { id: 'settings', label: 'Settings', icon: <Settings size={16} />, view: 'settings' },
];

export default function Sidebar() {
  const [notesOpen, setNotesOpen] = useState(() => localStorage.getItem('sidebar_notes_open') === 'true');
  const [collegeOpen, setCollegeOpen] = useState(() => localStorage.getItem('sidebar_college_open') === 'true');

  const {
    activeView,
    setView,
    activeNotesSubView,
    setNotesSubView,
    activeCollegeSubView,
    setCollegeSubView,
    theme,
    uiMode,
    toggleUIMode,
  } = useUIStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const isDark = theme === 'dark';
  const displayName = currentUser?.name || 'Guest User';
  const profileInitials = getUserInitials(displayName);

  // Streak & Progress calculation
  const [streak, setStreak] = useState(0);
  const [goalProgress, setGoalProgress] = useState(0);

  useEffect(() => {
    const calcStats = () => {
      const sessStr = localStorage.getItem('dexai_sessions');
      if (!sessStr) return;
      const sessions = JSON.parse(sessStr);

      const today = new Date().toISOString().split('T')[0];
      const todayMinutes = sessions
        .filter((s: any) => s.date === today)
        .reduce((sum: number, s: any) => sum + (s.durationMinutes || 0), 0);

      const tgStr = localStorage.getItem('focus_timer_settings');
      let goal = 120; // default 120min
      if (tgStr) {
        const s = JSON.parse(tgStr);
        if (s.dailyGoalMinutes) goal = s.dailyGoalMinutes;
      }
      setGoalProgress(Math.min(100, (todayMinutes / goal) * 100));

      const uniqueDates = Array.from(new Set(sessions.map((s: any) => s.date))).sort().reverse();
      let cx = 0;
      let checkDate = new Date();
      for (const dateStr of uniqueDates) {
        const d = checkDate.toISOString().split('T')[0];
        if (dateStr === d) { cx++; checkDate.setDate(checkDate.getDate() - 1); }
        else break;
      }
      setStreak(cx);
    };
    calcStats();
    // Update when localstorage changes (we trigger a custom event from timer)
    const handleStorage = () => calcStats();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('dexai_sessions_update', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('dexai_sessions_update', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (activeView === 'notes' && activeNotesSubView !== 'main') {
      setNotesOpen(true); localStorage.setItem('sidebar_notes_open', 'true');
    }
    if (activeView === 'college' && activeCollegeSubView !== 'calendar') {
      setCollegeOpen(true); localStorage.setItem('sidebar_college_open', 'true');
    }
  }, [activeView, activeNotesSubView, activeCollegeSubView]);

  useEffect(() => {
    if (uiMode === 'exam') {
      setNotesOpen(true);
      localStorage.setItem('sidebar_notes_open', 'true');
    }
  }, [uiMode]);

  const handleNotesToggle = (forceOpen?: boolean) => {
    const newState = forceOpen !== undefined ? forceOpen : !notesOpen;
    setNotesOpen(newState); localStorage.setItem('sidebar_notes_open', String(newState));
  };

  const handleCollegeToggle = (forceOpen?: boolean) => {
    const newState = forceOpen !== undefined ? forceOpen : !collegeOpen;
    setCollegeOpen(newState); localStorage.setItem('sidebar_college_open', String(newState));
  };

  const NavItemEl = ({ item }: { item: NavItem }) => {
    const isActive = item.view && activeView === item.view;
    const isNotes = item.id === 'notes';
    const isCollege = item.id === 'college';
    const isAccordion = isNotes || isCollege;
    const isOpen = isNotes ? notesOpen : isCollege ? collegeOpen : false;

    return (
      <div className="flex flex-col">
        <motion.div
          whileTap={item.view ? { scale: 0.98 } : {}}
          onClick={() => {
            if (isNotes) {
              setView('notes'); setNotesSubView('main'); handleNotesToggle(true);
            } else if (isCollege) {
              setView('college'); setCollegeSubView('calendar'); handleCollegeToggle(true);
            } else if (item.view) {
              setView(item.view);
            }
          }}
          className={clsx(
            'px-3 py-2 rounded-md flex items-center justify-between cursor-pointer transition-all duration-150',
            'text-sm',
            isActive
              ? (isDark ? 'bg-[#1E1E1D] text-[#F5F2EA] font-semibold' : 'bg-bg-surface text-text-primary font-medium')
              : (isDark ? 'text-[#D9D2C3] hover:bg-white/5' : 'text-text-secondary hover:bg-bg-surface/60')
          )}
        >
          <div className="flex items-center gap-3 relative">
            {item.id === 'focus' ? (
              <div className="relative flex items-center justify-center w-6 h-6 -ml-1">
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="11" fill="none" className="stroke-border-subtle" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="11" fill="none" className={clsx("stroke-accent-blue transition-all duration-1000", goalProgress >= 100 && "stroke-accent-green")} strokeWidth="1.5" strokeDasharray="69.1" strokeDashoffset={69.1 - (69.1 * goalProgress) / 100} strokeLinecap="round" />
                </svg>
                <span className={clsx('shrink-0 z-10', isActive ? 'text-accent-blue' : '')}>
                  {item.icon}
                </span>
                {streak >= 2 && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white border-2 border-white z-20">
                    {streak}
                  </div>
                )}
              </div>
            ) : (
              <span className={clsx('shrink-0', isActive ? (isDark ? 'text-[#F5F2EA]' : 'text-accent-blue') : (isDark ? 'text-[#B8B09E]' : ''))}>
                {item.icon}
              </span>
            )}
            {item.label}
          </div>
          {isAccordion && (
            <div
              onClick={(e) => { e.stopPropagation(); isNotes ? handleNotesToggle() : handleCollegeToggle(); }}
              className={clsx('p-1 rounded-sm flex items-center justify-center transition-transform', isDark ? 'hover:bg-white/10' : 'hover:bg-black/5')}
              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
            >
              <ChevronDown size={14} className={clsx(isDark ? 'text-[#8E887A]' : 'text-text-tertiary')} />
            </div>
          )}
        </motion.div>

        {isAccordion && item.subItems && (
          <div
            className="overflow-hidden transition-all duration-250 ease-in-out"
            style={{ maxHeight: isOpen ? '200px' : '0' }}
          >
            <div className="pt-1 pb-1 space-y-0.5">
              {item.subItems.map(subItem => {
                const isSubActive = activeView === item.view && (isNotes ? activeNotesSubView === subItem.subView : activeCollegeSubView === subItem.subView);
                return (
                  <motion.div
                    key={subItem.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setView(item.view!);
                      if (isNotes) setNotesSubView(subItem.subView as any);
                      if (isCollege) setCollegeSubView(subItem.subView as any);
                    }}
                    className={clsx(
                      'pl-[2.5rem] pr-3 py-1.5 rounded-r-md flex items-center gap-2.5 cursor-pointer transition-all duration-150 text-[0.875rem] border-l-[2px]',
                      isSubActive
                        ? (isDark ? 'border-transparent bg-[#1E1E1D] text-[#F5F2EA] font-semibold' : 'border-accent-blue bg-bg-surface text-text-primary font-medium')
                        : (isDark ? 'border-transparent text-[#C8C0AF] hover:bg-white/5' : 'border-transparent text-text-secondary hover:bg-bg-surface/60')
                    )}
                  >
                    <span className={clsx('shrink-0 opacity-70', isSubActive ? 'text-accent-blue opacity-100' : '')}>
                      {subItem.icon}
                    </span>
                    {subItem.label}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const visiblePrimaryNav = uiMode === 'exam'
    ? primaryNav.filter((item) => item.id === 'notes' || item.examOnly)
    : primaryNav.filter((item) => !item.examOnly);

  return (
    <aside className={clsx('h-full border-r flex flex-col overflow-hidden', isDark ? 'bg-[#0A0A0A] border-white/10' : 'bg-white border-border-subtle')}>
      {/* Brand header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={clsx('text-base font-bold leading-tight', isDark ? 'text-white' : 'text-text-primary')}>Dex</div>
          </div>
        </div>

        <button
          onClick={toggleUIMode}
          className={clsx(
            'mt-4 w-full h-9 rounded-lg text-xs font-semibold transition-colors',
            uiMode === 'exam'
              ? 'bg-[#D94A38] text-white hover:bg-[#C43F2F]'
              : 'bg-[#00BCD4] text-white hover:bg-[#00a6bc]'
          )}
        >
          {uiMode === 'exam' ? 'Exit Exam Mode' : 'Enter Exam Mode'}
        </button>
      </div>

      {/* Primary nav */}
      <div className="px-3 space-y-0.5">
        {visiblePrimaryNav.map((item) => (
          <NavItemEl key={item.id} item={item} />
        ))}
      </div>

      {uiMode !== 'exam' && (
        <>
          {/* Separator */}
          <div className="mx-3 my-3 border-t border-border-subtle" />

          {/* Secondary nav label */}
          <div className="px-6 mb-2">
            <span className={clsx('font-semibold', isDark ? 'text-xs text-[#8E887A]' : 'text-2xs text-text-tertiary tracking-widest uppercase font-medium')}>
              {isDark ? 'Workspace' : 'Navigation'}
            </span>
          </div>

          <div className="px-3 space-y-0.5">
            {secondaryNav.map((item) => (
              <NavItemEl key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* User row */}
      <div className="px-3 pb-4 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center text-xs font-semibold shrink-0">
          {profileInitials}
        </div>
        <div className="min-w-0">
          <div className={clsx('text-sm font-medium leading-tight truncate', isDark ? 'text-white' : 'text-text-primary')}>
            {displayName}
          </div>
          <div className={clsx('text-xs leading-tight truncate', isDark ? 'text-gray-500' : 'text-text-tertiary')}>
            {currentUser?.email || 'Not Logged In'}
          </div>
        </div>
      </div>
    </aside>
  );
}
