import { useState, useEffect } from 'react';
import { Target, Plus, AlertCircle, Calendar as CalendarIcon, Check, CheckCircle2, Circle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Trash2, Edit2, PlayCircle, ExternalLink, X } from 'lucide-react';
import Button from '../ui/Button';
import type { DexSubject, DexExam, SyllabusChapter } from '../dexai/types';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExamsDashboard() {
   const [subjects, setSubjects] = useState<DexSubject[]>([]);
   const [exams, setExams] = useState<DexExam[]>([]);
   const [isAdding, setIsAdding] = useState(false);
   const [showPast, setShowPast] = useState(false);

   // Add Exam Form State
   const [examSubjectId, setExamSubjectId] = useState('');
   const [examTitle, setExamTitle] = useState('');
   const [examDate, setExamDate] = useState('');
   const [examVenue, setExamVenue] = useState('');
   const [examWeight, setExamWeight] = useState(100);
   const [examPriority, setExamPriority] = useState<DexExam['priority']>('Medium');
   const [syllabusInput, setSyllabusInput] = useState('');
   const [syllabusList, setSyllabusList] = useState<SyllabusChapter[]>([]);

   // UI State
   const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
   const [calendarBaseDate, setCalendarBaseDate] = useState(() => new Date());

   useEffect(() => {
      const s = localStorage.getItem('dexai_subjects');
      if (s) {
         const parsed = JSON.parse(s);
         setSubjects(parsed);
         if (parsed.length > 0) setExamSubjectId(parsed[0].id);
      }
      const e = localStorage.getItem('dexai_exams');
      if (e) setExams(JSON.parse(e));
   }, []);

   const saveExams = (newExams: DexExam[]) => {
      setExams(newExams);
      localStorage.setItem('dexai_exams', JSON.stringify(newExams));
   };

   const handleAddSyllabus = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && syllabusInput.trim()) {
         e.preventDefault();
         setSyllabusList([...syllabusList, { id: crypto.randomUUID(), name: syllabusInput.trim(), prepared: false }]);
         setSyllabusInput('');
      }
   };

   const handleRemoveSyllabus = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      setSyllabusList(syllabusList.filter(s => s.id !== id));
   };

   const toggleSyllabusPrepared = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      setSyllabusList(syllabusList.map(s => s.id === id ? { ...s, prepared: !s.prepared } : s));
   };

   const handleSaveExam = () => {
      if (!examSubjectId || !examTitle.trim() || !examDate) return;
      const newExam: DexExam = {
         id: crypto.randomUUID(),
         subjectId: examSubjectId,
         title: examTitle.trim(),
         date: new Date(examDate).toISOString(),
         venue: examVenue.trim(),
         weight: examWeight,
         priority: examPriority,
         syllabus: syllabusList,
         isCompleted: new Date(examDate) < new Date()
      };
      saveExams([...exams, newExam]);

      // Reset
      setExamTitle(''); setExamDate(''); setExamVenue(''); setExamWeight(100); setSyllabusList([]); setSyllabusInput('');
      setIsAdding(false);
   };

   const deleteExam = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      saveExams(exams.filter(ex => ex.id !== id));
   };

   const toggleExamSyllabusItem = (examId: string, chapterId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const ex = exams.find(e => e.id === examId);
      if (!ex) return;
      const updatedSyllabus = ex.syllabus.map(s => s.id === chapterId ? { ...s, prepared: !s.prepared } : s);
      saveExams(exams.map(ex => ex.id === examId ? { ...ex, syllabus: updatedSyllabus } : ex));
   };

   // Calendar Utils
   const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
   const getFirstDayOfMonth = (date: Date) => {
      const d = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
      return d === 0 ? 6 : d - 1; // 0=Mon, 6=Sun
   };
   const calendarDays = Array.from({ length: getDaysInMonth(calendarBaseDate) }, (_, i) => i + 1);
   const calendarPrefix = Array.from({ length: getFirstDayOfMonth(calendarBaseDate) }, (_, i) => i);

   // Derived Metrics
   const activeExams = exams.filter(e => !e.isCompleted).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
   const pastExams = exams.filter(e => e.isCompleted).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

   const getDaysRemaining = (isoDate: string) => {
      const diff = new Date(isoDate).getTime() - new Date().getTime();
      return Math.ceil(diff / (1000 * 3600 * 24));
   };

   const prepareProgress = (ex: DexExam) => {
      if (ex.syllabus.length === 0) return 100;
      const p = ex.syllabus.filter(s => s.prepared).length;
      return Math.round((p / ex.syllabus.length) * 100);
   };

   const totalSyllabusCount = activeExams.reduce((acc, e) => acc + e.syllabus.length, 0);
   const totalPreparedCount = activeExams.reduce((acc, e) => acc + e.syllabus.filter(s => s.prepared).length, 0);
   const overallPreparedness = totalSyllabusCount === 0 ? 0 : Math.round((totalPreparedCount / totalSyllabusCount) * 100);

   const nextExam = activeExams[0];

   const getTimeLeftString = (target: Date) => {
      const diff = target.getTime() - new Date().getTime();
      if (diff < 0) return "00:00:00:00";
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      return `${d.toString().padStart(2, '0')}:${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
   };

   const [tick, setTick] = useState(0);
   useEffect(() => {
      const t = setInterval(() => setTick(v => v + 1), 1000);
      return () => clearInterval(t);
   }, []);

   return (
      <div className="flex flex-col lg:flex-row gap-6 h-full max-w-7xl mx-auto w-full relative animate-in fade-in">
         {/* Left Main Content */}
         <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
               <h2 className="text-xl font-bold text-text-primary">Exams Dashboard</h2>
               <div className="flex gap-2">
                  {pastExams.length > 0 && (
                     <Button variant="ghost" onClick={() => setShowPast(!showPast)} className="text-xs">
                        {showPast ? 'Hide Past' : 'Past Exams'}
                     </Button>
                  )}
                  <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "ghost" : "primary"}>
                     {isAdding ? 'Cancel' : '+ Add Exam'}
                  </Button>
               </div>
            </div>

            {/* Add Exam Form */}
            <AnimatePresence>
               {isAdding && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-6 shrink-0">
                     <div className="bg-white p-6 rounded-xl shadow-card border border-border-default">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                           <div>
                              <label className="text-xs font-semibold text-text-secondary mb-1 block">Subject</label>
                              <select value={examSubjectId} onChange={e => setExamSubjectId(e.target.value)} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none">
                                 {subjects.length === 0 && <option value="">Add a subject first</option>}
                                 {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="text-xs font-semibold text-text-secondary mb-1 block">Exam Title</label>
                              <input value={examTitle} onChange={e => setExamTitle(e.target.value)} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none" placeholder="Midterm, Final..." />
                           </div>
                           <div>
                              <label className="text-xs font-semibold text-text-secondary mb-1 block">Date & Time</label>
                              <input type="datetime-local" value={examDate} onChange={e => setExamDate(e.target.value)} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none" />
                           </div>
                           <div>
                              <label className="text-xs font-semibold text-text-secondary mb-1 block">Venue / Mode</label>
                              <input value={examVenue} onChange={e => setExamVenue(e.target.value)} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none" placeholder="Room 402, Online..." />
                           </div>
                           <div>
                              <label className="text-xs font-semibold text-text-secondary mb-1 block">Weight / Total Marks (%)</label>
                              <input type="number" min="0" value={examWeight} onChange={e => setExamWeight(Number(e.target.value))} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none" />
                           </div>
                           <div>
                              <label className="text-xs font-semibold text-text-secondary mb-1 block">Priority</label>
                              <div className="flex gap-2">
                                 {(['Low', 'Medium', 'High', 'Critical'] as const).map(p => (
                                    <button key={p} onClick={() => setExamPriority(p)} className={clsx("flex-1 py-2 text-xs font-bold rounded-lg border transition-colors", examPriority === p ? "bg-accent-blue/10 border-accent-blue text-accent-blue" : "border-border-default text-text-secondary")}>
                                       {p}
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>

                        {/* Syllabus Box */}
                        <div className="mb-6 bg-bg-surface p-4 rounded-xl border border-border-default">
                           <label className="text-xs font-semibold text-text-primary mb-1 block">Syllabus Coverage</label>
                           <p className="text-xs text-text-secondary mb-2">Type topic name and press Enter.</p>
                           <input value={syllabusInput} onChange={e => setSyllabusInput(e.target.value)} onKeyDown={handleAddSyllabus} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none mb-3 bg-white" placeholder="Chapter 1: Matrices..." />
                           <div className="flex flex-wrap gap-2">
                              {syllabusList.map((syl) => (
                                 <div key={syl.id} className="flex items-center gap-2 bg-white border border-border-default rounded-full pl-2 pr-1 py-1 text-xs shadow-sm">
                                    <button onClick={(e) => toggleSyllabusPrepared(syl.id, e)} className={clsx("w-4 h-4 rounded flex items-center justify-center shrink-0 border", syl.prepared ? "bg-accent-green border-accent-green text-white" : "border-text-tertiary")}>
                                       {syl.prepared && <Check size={10} />}
                                    </button>
                                    <span className={clsx("font-medium", syl.prepared && "line-through text-text-tertiary")}>{syl.name}</span>
                                    <button onClick={(e) => handleRemoveSyllabus(syl.id, e)} className="w-5 h-5 rounded-full hover:bg-bg-surface flex items-center justify-center text-text-secondary ml-1"><X size={12} /></button>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <Button onClick={handleSaveExam} disabled={!examSubjectId || !examTitle || !examDate}>Save Exam</Button>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

            {/* Main View Area */}
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6 w-full">

               {showPast && pastExams.length > 0 && (
                  <div className="bg-white rounded-xl shadow-card border border-border-subtle p-4 w-full">
                     <h3 className="text-sm font-bold text-text-primary mb-3">Past Exams</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {pastExams.map(ex => {
                           const sub = subjects.find(s => s.id === ex.subjectId);
                           return (
                              <div key={ex.id} className="border border-border-default rounded-lg p-3 relative opacity-70 hover:opacity-100 transition-opacity">
                                 <div className="font-bold text-sm text-text-primary mb-1">{ex.title}</div>
                                 <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: sub?.color || '#000' }}>
                                    <div className="w-2 h-2 rounded-full" style={{ background: sub?.color }} /> {sub?.name}
                                 </div>
                                 <div className="absolute top-2 right-2 text-xs font-bold text-text-secondary">{new Date(ex.date).toLocaleDateString()}</div>
                              </div>
                           )
                        })}
                     </div>
                  </div>
               )}

               {!showPast && activeExams.length === 0 && (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-border-default rounded-xl p-12 text-center text-text-secondary bg-white">
                     <Target size={40} className="text-text-tertiary mb-3 opacity-50" />
                     <p className="font-medium text-text-primary mb-1">No upcoming exams</p>
                     <p className="text-sm max-w-sm">Add your upcoming midterms and finals to track syllabus completion and countdowns.</p>
                  </div>
               )}

               {/* Exam Strip */}
               {activeExams.length > 0 && !showPast && (
                  <div className="flex flex-col gap-3 w-full shrink-0">
                     {activeExams.map(ex => {
                        const sub = subjects.find(s => s.id === ex.subjectId);
                        const daysLeft = getDaysRemaining(ex.date);
                        const isExpanded = expandedExamId === ex.id;
                        const progress = prepareProgress(ex);

                        let badgeClass = "bg-green-100 border-green-200 text-green-700";
                        if (daysLeft <= 3) badgeClass = "bg-red-100 border-red-200 text-red-700";
                        else if (daysLeft <= 7) badgeClass = "bg-orange-100 border-orange-200 text-orange-700";

                        return (
                           <motion.div layout key={ex.id} className="bg-white rounded-xl shadow-card border border-border-subtle overflow-hidden flex flex-col hover:shadow-elevated transition-shadow">
                              <div className="flex relative cursor-pointer" onClick={() => setExpandedExamId(isExpanded ? null : ex.id)}>
                                 {/* Color Bar */}
                                 <div className="w-1.5 shrink-0" style={{ background: sub?.color || '#ccc' }} />

                                 <div className="flex-1 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                       <div className="flex items-center gap-2 mb-1.5">
                                          <span className="text-xs font-bold tracking-widest uppercase opacity-80" style={{ color: sub?.color }}>{sub?.name}</span>
                                          <div className={clsx("px-2 py-0.5 rounded-full border text-2xs font-bold whitespace-nowrap", badgeClass)}>
                                             {daysLeft === 0 ? 'TODAY' : daysLeft < 0 ? 'OVERDUE' : `${daysLeft} Days Left`}
                                          </div>
                                          <div className="px-2 py-0.5 rounded-full bg-bg-surface border border-border-default text-2xs font-bold text-text-secondary whitespace-nowrap">
                                             {ex.priority}
                                          </div>
                                       </div>
                                       <h3 className="text-lg font-bold text-text-primary truncate">{ex.title}</h3>
                                       <div className="text-sm text-text-secondary mt-1 flex items-center gap-3">
                                          <span className="flex items-center gap-1"><CalendarIcon size={14} /> {new Date(ex.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                          {ex.venue && <span>• {ex.venue}</span>}
                                       </div>
                                    </div>

                                    <div className="flex items-center gap-4 border-l border-border-default pl-4 shrink-0">
                                       <div className="flex flex-col items-end">
                                          <div className="text-xs font-bold text-text-secondary mb-1">Prepared</div>
                                          <div className="flex items-center gap-2">
                                             <div className="w-20 h-2 bg-border-default rounded-full overflow-hidden">
                                                <div className="h-full bg-accent-blue" style={{ width: `${progress}%` }} />
                                             </div>
                                             <span className="text-sm font-bold text-text-primary w-10 text-right">{progress}%</span>
                                          </div>
                                       </div>
                                       <div className="text-text-tertiary">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                                    </div>
                                 </div>
                              </div>

                              {/* Expanded Checklist */}
                              <AnimatePresence>
                                 {isExpanded && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-bg-surface border-t border-border-default">
                                       <div className="p-4 pl-6">
                                          <div className="flex items-center justify-between mb-4">
                                             <h4 className="text-sm font-bold text-text-primary">Syllabus Completion</h4>
                                             <button onClick={(e) => deleteExam(ex.id, e)} className="text-xs text-accent-red font-semibold flex items-center gap-1 hover:underline"><Trash2 size={12} /> Delete Exam</button>
                                          </div>
                                          {ex.syllabus.length === 0 ? (
                                             <div className="text-sm text-text-tertiary">No syllabus added for this exam.</div>
                                          ) : (
                                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {ex.syllabus.map(syl => (
                                                   <div key={syl.id} onClick={(e) => toggleExamSyllabusItem(ex.id, syl.id, e)} className={clsx("flex items-center gap-3 p-3 rounded-xl border bg-white cursor-pointer transition-all hover:border-accent-blue hover:shadow-sm", syl.prepared ? "border-accent-green/30" : "border-border-default")}>
                                                      <button className={clsx("w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors", syl.prepared ? "bg-accent-green border-accent-green text-white" : "border-text-tertiary text-transparent")}>
                                                         <Check size={12} />
                                                      </button>
                                                      <span className={clsx("text-sm font-medium leading-tight", syl.prepared ? "line-through text-text-tertiary" : "text-text-primary")}>
                                                         {syl.name}
                                                      </span>
                                                   </div>
                                                ))}
                                             </div>
                                          )}
                                       </div>
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                           </motion.div>
                        )
                     })}
                  </div>
               )}

               {/* Calendar View */}
               <div className="bg-white rounded-xl shadow-card border border-border-default p-4 flex flex-col shrink-0 mt-4 overflow-x-auto w-full">
                  <div className="flex items-center justify-between mb-4 min-w-[500px]">
                     <h3 className="text-sm font-bold text-text-primary">Monthly Calendar</h3>
                     <div className="flex gap-2 items-center">
                        <button onClick={() => setCalendarBaseDate(new Date(calendarBaseDate.getFullYear(), calendarBaseDate.getMonth() - 1, 1))} className="p-1 hover:bg-bg-surface"><ChevronLeft size={16} /></button>
                        <span className="text-sm font-bold min-w-24 text-center">{calendarBaseDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => setCalendarBaseDate(new Date(calendarBaseDate.getFullYear(), calendarBaseDate.getMonth() + 1, 1))} className="p-1 hover:bg-bg-surface"><ChevronRight size={16} /></button>
                     </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 min-w-[500px]">
                     {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                        <div key={d} className="text-center text-2xs font-bold text-text-secondary uppercase mb-2 tracking-widest">{d}</div>
                     ))}
                     {calendarPrefix.map(i => <div key={`pre-${i}`} className="h-16 rounded-lg bg-bg-surface/30 opacity-50 border border-border-default/50" />)}
                     {calendarDays.map(d => {
                        const cellDate = new Date(calendarBaseDate.getFullYear(), calendarBaseDate.getMonth(), d);
                        // Check if exam on this date
                        const dayExams = activeExams.filter(ex => new Date(ex.date).toDateString() === cellDate.toDateString());
                        const isCurrDay = cellDate.toDateString() === new Date().toDateString();

                        return (
                           <div key={d} className={clsx("h-16 rounded-lg border flex flex-col p-1.5 transition-colors relative group", isCurrDay ? "bg-accent-blue/5 border-accent-blue/30" : "bg-white border-border-default hover:bg-bg-surface")}>
                              <span className={clsx("text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ml-auto", isCurrDay ? "bg-accent-blue text-white" : "text-text-primary")}>{d}</span>
                              <div className="flex content-start flex-wrap gap-1 mt-auto">
                                 {dayExams.map(ex => {
                                    const esub = subjects.find(s => s.id === ex.subjectId);
                                    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ex.title)}&dates=${ex.date.replace(/[-:]/g, '').split('.')[0]}Z/${ex.date.replace(/[-:]/g, '').split('.')[0]}Z`;
                                    return (
                                       <div key={ex.id} className="relative w-2 lg:w-full lg:h-4 lg:rounded lg:px-1 lg:flex items-center group/dot" style={{ backgroundColor: esub?.color || '#000' }}>
                                          <div className="w-2 h-2 rounded-full lg:hidden bg-white/20" />
                                          <span className="hidden lg:block text-[9px] font-bold text-white truncate mix-blend-plus-darker">{ex.title}</span>

                                          {/* Tooltip */}
                                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-48 bg-white border border-border-default rounded-lg shadow-elevated p-2 opacity-0 group-hover/dot:opacity-100 invisible group-hover/dot:visible z-30 transition-all text-left pointer-events-none group-hover/dot:pointer-events-auto">
                                             <div className="text-xs font-bold text-text-primary mb-0.5 truncate">{ex.title}</div>
                                             <div className="text-xs text-text-secondary">{new Date(ex.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                             <a href={gCalUrl} target="_blank" onClick={(e) => e.stopPropagation()} className="cursor-pointer text-accent-blue text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-1 hover:underline"><ExternalLink size={10} /> Add to Google Cal</a>
                                          </div>
                                       </div>
                                    )
                                 })}
                              </div>
                           </div>
                        )
                     })}
                  </div>
               </div>

            </div>
         </div>

         {/* Right Sidebar */}
         <div className="w-full lg:w-72 shrink-0 flex flex-col gap-6">
            {/* Next Exam Countdown */}
            <div className="bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] rounded-xl shadow-elevated p-6 text-white text-center relative overflow-hidden ring-1 ring-black/10">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
               <Target size={24} className="text-white/40 absolute top-4 left-4" />
               <div className="text-xs font-bold uppercase tracking-widest text-white/60 mb-8 w-full">Next Exam</div>

               {nextExam ? (
                  <>
                     <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]" style={{ background: subjects.find(s => s.id === nextExam.subjectId)?.color || '#fff' }} />
                        <h3 className="text-base font-bold truncate max-w-[200px]">{nextExam.title}</h3>
                     </div>

                     <div className="text-[28px] tracking-tight font-mono font-bold leading-none mb-1 tabular-nums whitespace-nowrap overflow-hidden text-clip w-full">
                        {/* The timer text needs to be exact and cleanly rendered */}
                        {getTimeLeftString(new Date(nextExam.date))}
                     </div>
                     <div className="flex justify-center gap-[19px] text-[8px] uppercase tracking-[0.2em] text-white/50 w-[190px] mx-auto ml-[10px]">
                        {/* Visual alignment helper based on monospace fonts */}
                        <span>Day</span><span>Hr</span><span>Min</span><span>Sec</span>
                     </div>
                  </>
               ) : (
                  <div className="opacity-50 py-4">
                     No upcoming exams
                  </div>
               )}
            </div>

            {/* Preparation Donut */}
            <div className="bg-white rounded-xl shadow-card border border-border-default p-5">
               <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Preparation Score</h3>
               <div className="relative w-32 h-32 mx-auto">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                     <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-bg-surface" strokeWidth="12" />
                     <circle
                        cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-accent-blue drop-shadow-sm transition-all duration-1000 ease-out" strokeWidth="12"
                        strokeDasharray={`${overallPreparedness * 2.51} 251.2`}
                        strokeLinecap="round"
                     />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col">
                     <span className="text-3xl font-bold text-text-primary tracking-tight leading-none">{overallPreparedness}<span className="text-lg">%</span></span>
                  </div>
               </div>
               <p className="text-xs text-text-secondary text-center mt-4">
                  <strong className="text-text-primary">{totalPreparedCount}</strong> of <strong className="text-text-primary">{totalSyllabusCount}</strong> active chapters prepared.
               </p>
            </div>

            {/* Heatmap Widget */}
            <div className="bg-white rounded-xl shadow-card border border-border-default p-5">
               <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 flex items-center justify-between">
                  Workload Heat <AlertCircle size={14} className="text-text-tertiary" />
               </h3>
               <div className="flex items-end justify-between gap-1 h-16">
                  {/* 7 columns mock relative intensity */}
                  {[0.1, 0.4, 0.8, 1.0, 0.6, 0.2, 0.9].map((w, i) => {
                     let c = 'bg-border-subtle';
                     if (w > 0.3) c = 'bg-accent-blue/30';
                     if (w > 0.6) c = 'bg-accent-blue/70';
                     if (w > 0.8) c = 'bg-accent-red shadow-[0_0_8px_rgba(255,59,48,0.3)]';
                     return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                           <div className={clsx("w-full rounded-sm transition-all duration-500", c)} style={{ height: `${w * 100}%` }} />
                           <span className="text-[9px] font-bold text-text-tertiary">
                              {new Date(Date.now() + i * 86400000).toLocaleDateString([], { weekday: 'narrow' }).charAt(0)}
                           </span>
                        </div>
                     )
                  })}
               </div>
            </div>
         </div>
      </div>
   );
}
