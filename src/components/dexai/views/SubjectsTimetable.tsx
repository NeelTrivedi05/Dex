import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, X, Download, RotateCcw, 
  Book, FlaskConical, Calculator, Globe, Code, Paintbrush, 
  Music, Scale, Scroll, Dna, Rocket, DivideSquare, ChevronLeft, ChevronRight, Check
} from 'lucide-react';
import Button from '../../ui/Button';
import type { DexSubject, TimetableSlot } from '../types';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#64748B'];
const ICON_MAP: Record<string, React.ReactNode> = {
  book: <Book size={16} />, flask: <FlaskConical size={16} />, calc: <Calculator size={16} />, globe: <Globe size={16} />,
  code: <Code size={16} />, brush: <Paintbrush size={16} />, music: <Music size={16} />, law: <Scale size={16} />,
  hist: <Scroll size={16} />, bio: <Dna size={16} />, phys: <Rocket size={16} />, math: <DivideSquare size={16} />
};

export default function SubjectsTimetable() {
  const [subjects, setSubjects] = useState<DexSubject[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);

  // Subject Form State
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectColor, setSubjectColor] = useState(PRESET_COLORS[0]);
  const [subjectIcon, setSubjectIcon] = useState('book');
  const [subjectTeacher, setSubjectTeacher] = useState('');
  const [subjectDesc, setSubjectDesc] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  // Timetable State
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [popoverState, setPopoverState] = useState<{ day: number, slot: string, el: HTMLElement | null } | null>(null);
  
  // Slot Form State inside popover
  const [slotSubjectId, setSlotSubjectId] = useState('');
  const [slotClassType, setSlotClassType] = useState<TimetableSlot['classType']>('Lecture');
  const [slotDuration, setSlotDuration] = useState(1);
  const [slotRoom, setSlotRoom] = useState('');

  useEffect(() => {
    const s = localStorage.getItem('dexai_subjects');
    if (s) setSubjects(JSON.parse(s));
    const t = localStorage.getItem('dexai_timetable');
    if (t) setSlots(JSON.parse(t));
  }, []);

  const saveSubjects = (newSubjects: DexSubject[]) => {
    setSubjects(newSubjects);
    localStorage.setItem('dexai_subjects', JSON.stringify(newSubjects));
  };
  const saveSlots = (newSlots: TimetableSlot[]) => {
    setSlots(newSlots);
    localStorage.setItem('dexai_timetable', JSON.stringify(newSlots));
  };

  const handleAddSubject = () => {
    if (!subjectName.trim()) return;
    const newSubject: DexSubject = {
      id: crypto.randomUUID(),
      name: subjectName,
      code: subjectCode,
      color: subjectColor,
      icon: subjectIcon,
      teacher: subjectTeacher,
      description: subjectDesc
    };
    saveSubjects([...subjects, newSubject]);
    setSubjectName(''); setSubjectCode(''); setSubjectTeacher(''); setSubjectDesc('');
    setIsAddingSubject(false);
  };

  const deleteSubject = (id: string) => saveSubjects(subjects.filter(s => s.id !== id));

  // Timetable Utils
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = Array.from({ length: 34 }, (_, i) => { // 6am to 11pm roughly
    const h = Math.floor(i / 2) + 6;
    const m = i % 2 === 0 ? '00' : '30';
    return `${h.toString().padStart(2, '0')}:${m}`;
  });

  const getDayDate = (dayOffset: number) => {
    const today = new Date();
    // JS getDay(): 0 = Sun, 1 = Mon ...
    const currentDayOfWeek = today.getDay(); 
    const diffToMon = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + diffToMon + dayOffset + (currentWeekOffset * 7));
    return targetDate;
  };

  const isToday = (dayOffset: number) => {
    const target = getDayDate(dayOffset);
    const today = new Date();
    return target.toDateString() === today.toDateString();
  };

  const handleCellClick = (dayIdx: number, timeKey: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (subjects.length === 0) return alert('Please add a subject first');
    setSlotSubjectId(subjects[0].id);
    setPopoverState({ day: dayIdx, slot: timeKey, el: e.currentTarget as HTMLElement });
  };

  const saveSlot = () => {
    if (!popoverState) return;
    const newSlot: TimetableSlot = {
      id: crypto.randomUUID(),
      dayOfWeek: popoverState.day,
      timeSlot: popoverState.slot,
      subjectId: slotSubjectId,
      classType: slotClassType,
      durationHours: slotDuration,
      room: slotRoom
    };
    // remove intersecting exact start blocks
    const filtered = slots.filter(s => !(s.dayOfWeek === popoverState.day && s.timeSlot === popoverState.slot));
    saveSlots([...filtered, newSlot]);
    setPopoverState(null);
  };

  const deleteSlot = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveSlots(slots.filter(s => s.id !== slotId));
    setPopoverState(null);
  };

  const exportICS = () => {
    if (slots.length === 0) return;
    let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DexAI//Timetable//EN\n";
    
    // For each slot, create recurring weekly event assuming reference start at current week Monday
    const refMonday = getDayDate(0);
    
    slots.forEach(slot => {
      const subject = subjects.find(su => su.id === slot.subjectId);
      if (!subject) return;

      const [hh, mm] = slot.timeSlot.split(':').map(Number);
      const startDate = new Date(refMonday);
      startDate.setDate(startDate.getDate() + slot.dayOfWeek);
      startDate.setHours(hh, mm, 0);
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + (slot.durationHours * 60));

      const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      ics += "BEGIN:VEVENT\n";
      ics += `SUMMARY:${subject.name} - ${slot.classType}\n`;
      if (slot.room) ics += `LOCATION:${slot.room}\n`;
      ics += `DTSTART:${formatICSDate(startDate)}\n`;
      ics += `DTEND:${formatICSDate(endDate)}\n`;
      ics += `RRULE:FREQ=WEEKLY\n`;
      ics += "END:VEVENT\n";
    });

    ics += "END:VCALENDAR";

    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DexAI_Timetable.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8 h-full max-w-6xl mx-auto pb-12 w-full animate-in fade-in">
      
      {/* Subjects Section */}
      <section>
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary">My Subjects</h2>
            <Button onClick={() => setIsAddingSubject(!isAddingSubject)} variant={isAddingSubject ? "ghost" : "primary"}>
              {isAddingSubject ? 'Cancel' : '+ Add Subject'}
            </Button>
         </div>

         {isAddingSubject && (
            <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1,y:0}} className="bg-white p-6 rounded-xl shadow-card border border-border-default mb-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1 block">Subject Name</label>
                    <input value={subjectName} onChange={e=>setSubjectName(e.target.value)} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none" placeholder="e.g. Linear Algebra" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1 block">Subject Code (Optional)</label>
                    <input value={subjectCode} onChange={e=>setSubjectCode(e.target.value)} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none" placeholder="e.g. MATH 201" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1 block">Teacher / Professor</label>
                    <input value={subjectTeacher} onChange={e=>setSubjectTeacher(e.target.value)} className="w-full h-10 px-3 border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-text-secondary mb-1 block">Color Tag</label>
                    <div className="flex gap-2">
                       {PRESET_COLORS.map(c => (
                         <div key={c} onClick={() => setSubjectColor(c)} className={clsx("w-8 h-8 rounded-full cursor-pointer flex items-center justify-center border-2 transition-all", subjectColor === c ? "border-text-primary scale-110" : "border-transparent")} style={{ backgroundColor: c }}>
                            {subjectColor === c && <Check size={14} color="white" />}
                         </div>
                       ))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-semibold text-text-secondary mb-1 block">Icon Picker</label>
                    <div className="flex flex-wrap gap-2">
                       {Object.keys(ICON_MAP).map(k => (
                         <div key={k} onClick={()=>setSubjectIcon(k)} className={clsx("w-10 h-10 rounded-lg border flex items-center justify-center cursor-pointer transition-colors", subjectIcon === k ? "border-accent-blue bg-blue-50 text-accent-blue" : "border-border-default text-text-secondary hover:bg-bg-surface")}>
                            {ICON_MAP[k]}
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
               <Button onClick={handleAddSubject} disabled={!subjectName.trim()}>Save Subject</Button>
            </motion.div>
         )}

         {/* Subject Chips */}
         <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            {subjects.length === 0 && !isAddingSubject && <div className="text-sm text-text-tertiary italic">No subjects added yet.</div>}
            {subjects.map(sub => (
              <div key={sub.id} className="flex shrink-0 items-center gap-3 bg-white border border-border-default rounded-full px-4 py-2 shadow-sm group">
                 <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: sub.color }}>
                    {ICON_MAP[sub.icon] && <div className="scale-50 text-white">{ICON_MAP[sub.icon]}</div>}
                 </div>
                 <span className="text-sm font-semibold text-text-primary">{sub.code ? `${sub.code} - ` : ''}{sub.name}</span>
                 <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => deleteSubject(sub.id)} className="text-text-tertiary hover:text-accent-red"><X size={14} /></button>
                 </div>
              </div>
            ))}
         </div>
      </section>

      {/* Timetable Section */}
      <section className="flex-1 flex flex-col mt-4">
         <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-4">
              Weekly Timetable
              <div className="flex gap-1 items-center bg-white border border-border-default rounded-lg p-0.5">
                 <button onClick={() => setCurrentWeekOffset(prev => prev - 1)} className="p-1.5 hover:bg-bg-surface rounded-md text-text-secondary"><ChevronLeft size={16}/></button>
                 <span className="text-xs font-semibold px-2 min-w-32 text-center text-text-primary">
                   {getDayDate(0).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {getDayDate(6).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                 </span>
                 <button onClick={() => setCurrentWeekOffset(prev => prev + 1)} className="p-1.5 hover:bg-bg-surface rounded-md text-text-secondary"><ChevronRight size={16}/></button>
              </div>
            </h2>
            <div className="flex gap-2">
               <Button variant="ghost" className="h-9 px-3 text-xs flex gap-2"><RotateCcw size={14}/> Reset Week</Button>
               <Button onClick={exportICS} className="h-9 px-3 text-xs flex gap-2"><Download size={14}/> Export .ics</Button>
            </div>
         </div>

         <div className="bg-white border border-border-default rounded-xl shadow-card flex flex-col flex-1 overflow-hidden relative min-h-[600px] w-full">
            {/* Header Row */}
            <div className="flex border-b border-border-default bg-bg-surface sticky top-0 z-20">
               <div className="w-16 shrink-0 border-r border-border-default flex items-center justify-center">
                  <ClockIcon />
               </div>
               {days.map((day, idx) => (
                  <div key={idx} className={clsx("flex-1 py-3 px-2 text-center border-r border-border-default last:border-r-0 relative min-w-[100px]", isToday(idx) && "bg-accent-blue/5 border-b-2 border-b-accent-blue")}>
                     <div className={clsx("text-xs font-bold uppercase tracking-wide", isToday(idx) ? "text-accent-blue" : "text-text-secondary")}>{day.substring(0,3)}</div>
                     <div className={clsx("text-lg font-bold mt-0.5", isToday(idx) ? "text-accent-blue" : "text-text-primary")}>{getDayDate(idx).getDate()}</div>
                  </div>
               ))}
            </div>

            {/* Grid Body */}
            <div className="flex-1 overflow-y-auto overflow-x-auto relative w-full">
               <div className="flex min-w-[700px]">
                  {/* Time column */}
                  <div className="w-16 shrink-0 border-r border-border-default bg-bg-elevated">
                     {times.map(t => (
                        <div key={t} className="h-12 border-b border-border-subtle/50 text-2xs font-semibold text-text-tertiary flex items-start justify-center pt-1.5">
                           {t.endsWith('00') ? t : ''}
                        </div>
                     ))}
                  </div>

                  {/* Day Columns */}
                  {days.map((_, dayIdx) => (
                     <div key={dayIdx} className={clsx("flex-1 relative border-r border-border-default last:border-r-0 min-w-[100px]", isToday(dayIdx) && "bg-accent-blue/[0.02]")}>
                       {times.map((t, idx) => {
                          const existingSlot = slots.find(s => s.dayOfWeek === dayIdx && s.timeSlot === t);
                          const subject = existingSlot ? subjects.find(sub => sub.id === existingSlot.subjectId) : null;
                          
                          return (
                            <div key={t} onClick={(e) => handleCellClick(dayIdx, t, e)} className="h-12 border-b border-border-subtle/50 group hover:bg-bg-surface/50 cursor-pointer relative p-0.5" >
                               {existingSlot && subject && (
                                  <div 
                                    className="absolute inset-x-1 top-1 rounded-md p-1 shadow-sm overflow-hidden z-10 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-default group/slot"
                                    style={{ 
                                      backgroundColor: subject.color + '20', 
                                      borderLeft: `4px solid ${subject.color}`,
                                      height: `calc(${existingSlot.durationHours * 48}px - 6px)` 
                                    }}
                                  >
                                     <div className="text-[10px] font-bold truncate text-text-primary leading-tight mix-blend-plus-darker">
                                       {subject.code || subject.name}
                                     </div>
                                     <div className="text-[9px] text-text-secondary truncate mt-0.5">
                                       {existingSlot.classType} {existingSlot.room ? `• ${existingSlot.room}` : ''}
                                     </div>
                                     <button onClick={(e) => deleteSlot(existingSlot.id, e)} className="absolute top-1 right-1 opacity-0 group-hover/slot:opacity-100 bg-white/80 rounded block p-0.5 hover:text-accent-red">
                                       <X size={10}/>
                                     </button>
                                  </div>
                               )}
                            </div>
                          );
                       })}
                     </div>
                  ))}
               </div>
            </div>

            {/* Popover */}
            {popoverState && (
               <div className="absolute z-50 bg-white border border-border-default rounded-xl shadow-elevated p-4 w-64 translate-x-4 -translate-y-1/2" 
                    style={{
                      left: popoverState.el.offsetLeft + popoverState.el.offsetWidth,
                      top: popoverState.el.offsetTop - popoverState.el.parentElement!.parentElement!.scrollTop
                    }}
               >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold">Assign Slot</h3>
                    <button onClick={()=>setPopoverState(null)} className="text-text-tertiary hover:text-text-primary"><X size={14}/></button>
                  </div>
                  <div className="space-y-3">
                     <div>
                       <label className="text-xs font-semibold text-text-secondary mb-1 block">Subject</label>
                       <select value={slotSubjectId} onChange={e=>setSlotSubjectId(e.target.value)} className="w-full text-sm border border-border-default rounded-lg p-2 focus:outline-none focus:border-accent-blue">
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                     </div>
                     <div className="flex gap-2">
                       <div className="flex-1">
                         <label className="text-xs font-semibold text-text-secondary mb-1 block">Type</label>
                         <select value={slotClassType} onChange={e=>setClassType(e.target.value as any)} className="w-full text-sm border border-border-default rounded-lg p-2 focus:outline-none focus:border-accent-blue">
                            <option>Lecture</option>
                            <option>Lab</option>
                            <option>Tutorial</option>
                            <option>Self-Study</option>
                         </select>
                       </div>
                       <div className="w-16">
                         <label className="text-xs font-semibold text-text-secondary mb-1 block">Hrs</label>
                         <input type="number" min="0.5" step="0.5" value={slotDuration} onChange={e=>setSlotDuration(Number(e.target.value))} className="w-full text-sm border border-border-default rounded-lg p-2 focus:outline-none focus:border-accent-blue" />
                       </div>
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-text-secondary mb-1 block">Room (Optional)</label>
                       <input value={slotRoom} onChange={e=>setSlotRoom(e.target.value)} className="w-full text-sm border border-border-default rounded-lg p-2 focus:outline-none focus:border-accent-blue" />
                     </div>
                     <Button onClick={saveSlot} className="w-full mt-2 text-xs">Save Slot</Button>
                  </div>
               </div>
            )}
         </div>
      </section>

      {/* Analytics Mini-cards */}
      {subjects.length > 0 && (
         <section>
            <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-widest text-text-secondary">Study Workload (Scheduled)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {subjects.map(s => {
                  const subSlots = slots.filter(sl => sl.subjectId === s.id);
                  const totalHrs = subSlots.reduce((a,b) => a + b.durationHours, 0);
                  
                  return (
                    <div key={s.id} className="bg-white border border-border-default rounded-xl p-4 flex items-center justify-between shadow-sm">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <div className="w-2.5 h-2.5 rounded-full" style={{background:s.color}} />
                           <span className="text-xs font-semibold text-text-secondary truncate max-w-[100px]">{s.name}</span>
                         </div>
                         <div className="text-2xl font-bold text-text-primary">{totalHrs}<span className="text-sm text-text-tertiary ml-1 font-medium">hrs/wk</span></div>
                       </div>
                       <div className="h-10 w-12 flex items-end gap-1 opacity-50 relative bottom-[-6px]">
                         {/* Mock mini bar chart showing consistent trend */}
                         {[0.5, 0.8, 0.6, 1].map((val, i) => (
                           <div key={i} className="flex-1 bg-border-default rounded-sm" style={{height: `${val * 100}%`, backgroundColor: i===3 ? s.color : undefined}} />
                         ))}
                       </div>
                    </div>
                  )
               })}
            </div>
         </section>
      )}

    </div>
  );

  function setClassType(val: any) { setSlotClassType(val); }
}

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
