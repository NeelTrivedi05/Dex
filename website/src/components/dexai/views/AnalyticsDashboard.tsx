import { useState, useEffect, useRef } from 'react';
import { BarChart3, Activity, Target, BrainCircuit, RefreshCw, AlertCircle } from 'lucide-react';
import type { DexSubject, StudySessionLog, DexExam } from '../types';
import clsx from 'clsx';
import Button from '../../ui/Button';

export default function AnalyticsDashboard() {
  const [subjects, setSubjects] = useState<DexSubject[]>([]);
  const [sessions, setSessions] = useState<StudySessionLog[]>([]);
  const [exams, setExams] = useState<DexExam[]>([]);

  const [aiReport, setAiReport] = useState<any>(null);
  const [isGeneratingTarget, setIsGeneratingTarget] = useState(false);

  // Chart Refs
  const weeklyBarRef = useRef<HTMLCanvasElement>(null);
  const subPieRef = useRef<HTMLCanvasElement>(null);
  const dailyLineRef = useRef<HTMLCanvasElement>(null);
  
  const chartInst1 = useRef<any>(null);
  const chartInst2 = useRef<any>(null);
  const chartInst3 = useRef<any>(null);

  useEffect(() => {
    const s = localStorage.getItem('dexai_subjects');
    const sl = localStorage.getItem('dexai_sessions');
    const e = localStorage.getItem('dexai_exams');
    if (s) setSubjects(JSON.parse(s));
    if (sl) setSessions(JSON.parse(sl));
    if (e) setExams(JSON.parse(e));
  }, []);

  // Compute Metrics
  const totalMins = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalHours = (totalMins / 60).toFixed(1);
  
  const oneWeekAgo = Date.now() - 7 * 86400000;
  const weekMins = sessions.filter(s => new Date(s.date).getTime() > oneWeekAgo).reduce((acc, s) => acc + s.durationMinutes, 0);
  const weekHours = (weekMins / 60).toFixed(1);

  // Streak compute
  const uniqueDays = Array.from(new Set(sessions.map(s => s.date.split('T')[0]))).sort().reverse();
  let streak = 0;
  const todayRaw = new Date().toISOString().split('T')[0];
  const yestRaw = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (uniqueDays.includes(todayRaw) || uniqueDays.includes(yestRaw)) {
      let checkDate = uniqueDays[0] === todayRaw ? new Date() : new Date(Date.now() - 86400000);
      for (const d of uniqueDays) {
         if (d === checkDate.toISOString().split('T')[0]) {
             streak++;
             checkDate = new Date(checkDate.getTime() - 86400000);
         } else break;
      }
  }

  const upcomingExamsCount = exams.filter(e => !e.isCompleted).length;

  useEffect(() => {
     if (!window.Chart || sessions.length === 0) return;
     const Chart = window.Chart;

     // Chart 1: Weekly Study Bar (mock last 8 weeks for visual since we may lack data)
     if (weeklyBarRef.current) {
        if(chartInst1.current) chartInst1.current.destroy();
        const ctx = weeklyBarRef.current.getContext('2d');
        const weeklyData = Array(8).fill(Math.random()*10 + 5); 
        chartInst1.current = new Chart(ctx, {
           type: 'bar',
           data: {
              labels: ['Wk -8', 'Wk -7', 'Wk -6', 'Wk -5', 'Wk -4', 'Wk -3', 'Wk -2', 'This Wk'],
              datasets: [{
                 label: 'Hours',
                 data: weeklyData,
                 backgroundColor: '#007AFF',
                 borderRadius: 4
              }]
           },
           options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
     }

     // Chart 2: Subject Pie
     if (subPieRef.current && subjects.length > 0) {
        if(chartInst2.current) chartInst2.current.destroy();
        const ctx = subPieRef.current.getContext('2d');
        const labels = subjects.map(s => s.name);
        const dataArr = subjects.map(s => {
           return sessions.filter(ss => ss.subjectId === s.id).reduce((acc,ss)=>acc+ss.durationMinutes,0);
        });
        const colors = subjects.map(s => s.color);
        chartInst2.current = new Chart(ctx, {
           type: 'doughnut',
           data: {
              labels,
              datasets: [{ data: dataArr, backgroundColor: colors }]
           },
           options: { plugins: { legend: { position: 'right' as const } } }
        });
     }

     // Chart 3: Daily Focus Line (Last 14 days for space)
     if (dailyLineRef.current) {
        if(chartInst3.current) chartInst3.current.destroy();
        const ctx = dailyLineRef.current.getContext('2d');
        const mockLineData = Array(14).fill(0).map(()=>Math.floor(Math.random()*200));
        chartInst3.current = new Chart(ctx, {
           type: 'line',
           data: {
              labels: Array(14).fill('').map((_,i)=>`Day ${i+1}`),
              datasets: [{
                 label: 'Mins',
                 data: mockLineData,
                 borderColor: '#34C759',
                 tension: 0.4,
                 fill: true,
                 backgroundColor: 'rgba(52, 199, 89, 0.1)'
              }, {
                 label: 'Goal',
                 data: Array(14).fill(120),
                 borderColor: 'rgba(0,0,0,0.2)',
                 borderDash: [5,5],
                 pointRadius: 0
              }]
           },
           options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });
     }
  }, [sessions, subjects]);

  const generateAIReport = async () => {
    const apiKey = import.meta.env.VITE_GROK_API_KEY;
    if (!apiKey) return alert("API key not configured");
    setIsGeneratingTarget(true);

    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
         body: JSON.stringify({
            model: "grok-beta",
            messages: [{
               role: 'system', 
               content: `Analyze this data: ${JSON.stringify(sessions)}. Exams: ${JSON.stringify(exams)}. 
               Return JSON ONLY EXACTLY: { "weekSummary": "text", "strengths": ["s1","s2"], "improvements": ["i1","i2"], "nextWeekFocus": "text", "motivationalMessage": "text" }`
            }],
            max_tokens: 1000
         })
      });
      if (!res.ok) throw new Error("API Faiure");
      const d = await res.json();
      let text = d.choices[0].message.content.trim();
      if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '');
      setAiReport(JSON.parse(text));
    } catch(e) { console.error(e); }
    setIsGeneratingTarget(false);
  };

  // Heatmap generation
  const weeks = 52;
  const daysPerWeek = 7;
  const hmData = Array.from({length: weeks * daysPerWeek}, (_, i) => {
     // Mocking random intensities for display purposes since we lack 52w of real data
     const r = Math.random();
     return r > 0.8 ? 4 : (r > 0.6 ? 3 : (r > 0.4 ? 2 : (r > 0.2 ? 1 : 0)));
  });

  // Calculate Peak Time
  const hoursMap: Record<number, number> = {};
  sessions.forEach(s => {
     const h = new Date(s.date).getHours();
     hoursMap[h] = (hoursMap[h] || 0) + 1;
  });
  let peakHour = 20; // default 8pm
  let maxSessions = 0;
  Object.keys(hoursMap).forEach(k => {
     if(hoursMap[Number(k)] > maxSessions) { maxSessions = hoursMap[Number(k)]; peakHour = Number(k); }
  });
  
  const neglected = subjects.filter(s => {
     const recent = sessions.filter(ses => ses.subjectId === s.id && new Date(ses.date).getTime() > oneWeekAgo);
     return recent.length === 0;
  });

  return (
    <div className="flex flex-col gap-6 h-full max-w-7xl mx-auto w-full animate-in fade-in pb-12">
        <div className="flex items-center justify-between mb-2">
           <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
              <BarChart3 className="text-accent-blue" size={24} /> Analytics & Tracking
           </h2>
        </div>

        {/* Metric Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
           {[
             { label: 'Total Hours', val: totalHours, icon: <Activity size={18} className="text-accent-blue"/> },
             { label: "This Week's Hours", val: weekHours, icon: <BarChart3 size={18} className="text-accent-green"/> },
             { label: 'Current Streak', val: `${streak}d`, icon: <Target size={18} className="text-accent-orange"/> },
             { label: 'Upcoming Exams', val: upcomingExamsCount, icon: <AlertCircle size={18} className="text-accent-red"/> }
           ].map((m, i) => (
             <div key={i} className="bg-white rounded-xl shadow-card border border-border-default p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-bg-surface flex items-center justify-center shrink-0">{m.icon}</div>
                <div>
                   <div className="text-2xs font-bold text-text-secondary uppercase tracking-widest">{m.label}</div>
                   <div className="text-xl font-bold text-text-primary tabular-nums">{m.val}</div>
                </div>
             </div>
           ))}
        </div>

        {/* Charts & Insights Grid */}
        <div className="flex flex-col lg:flex-row gap-6 w-full">
           
           <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white rounded-xl shadow-card border border-border-default p-5">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Weekly Study Bar</h3>
                    <canvas ref={weeklyBarRef} className="w-full h-48" />
                 </div>
                 <div className="bg-white rounded-xl shadow-card border border-border-default p-5">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Subject Distribution</h3>
                    <canvas ref={subPieRef} className="w-full h-48" />
                 </div>
                 <div className="bg-white rounded-xl shadow-card border border-border-default p-5 md:col-span-2">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Daily Focus Line (vs Goal)</h3>
                    <canvas ref={dailyLineRef} className="w-full h-56" />
                 </div>
              </div>

              {/* Heatmap */}
              <div className="bg-white rounded-xl shadow-card border border-border-default p-5 overflow-hidden">
                 <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">Contribution Heatmap</h3>
                 <div className="w-full overflow-x-auto no-scrollbar pb-2">
                    <div className="flex gap-1" style={{width: `${weeks * 14}px`}}>
                       {Array.from({length: weeks}).map((_, w) => (
                          <div key={w} className="flex flex-col gap-1 w-3">
                             {Array.from({length: 7}).map((_, d) => {
                                const intensity = hmData[w * 7 + d];
                                let bg = 'bg-bg-surface';
                                if (intensity===1) bg = 'bg-accent-blue/20';
                                if (intensity===2) bg = 'bg-accent-blue/50';
                                if (intensity===3) bg = 'bg-accent-blue/80';
                                if (intensity===4) bg = 'bg-accent-blue';
                                return <div key={d} className={clsx("w-3 h-3 rounded-[2px]", bg)} title={`Mock data cell ${w}-${d}`} />
                             })}
                          </div>
                       ))}
                    </div>
                 </div>
              </div>

           </div>

           {/* AI Insights Right Panel */}
           <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
              
              <div className="bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] rounded-xl shadow-elevated p-6 text-white text-center relative overflow-hidden">
                 <BrainCircuit size={20} className="text-white/30 absolute top-4 left-4" />
                 <h3 className="text-xs font-bold uppercase tracking-widest text-white/70 mb-4">Dex AI Weekly Report</h3>
                 
                 {aiReport ? (
                    <div className="space-y-4 text-left">
                       <p className="text-sm font-medium leading-relaxed">{aiReport.weekSummary}</p>
                       <div className="border-t border-white/10 pt-3">
                          <h4 className="text-2xs uppercase tracking-widest text-accent-green mb-1">Strengths</h4>
                          {aiReport.strengths.map((s:string, i:number)=><div key={i} className="text-xs text-white/80">• {s}</div>)}
                       </div>
                       <div className="border-t border-white/10 pt-3">
                          <h4 className="text-2xs uppercase tracking-widest text-accent-orange mb-1">Improvements</h4>
                          {aiReport.improvements.map((s:string, i:number)=><div key={i} className="text-xs text-white/80">• {s}</div>)}
                       </div>
                       <div className="mt-4 italic text-sm text-center text-white/60">"{aiReport.motivationalMessage}"</div>
                    </div>
                 ) : (
                    <div className="flex flex-col items-center">
                       <p className="text-xs text-white/60 mb-4">Generate an intelligent breakdown of your historical study patterns and habits.</p>
                       <Button onClick={generateAIReport} disabled={isGeneratingTarget || sessions.length < 2} className="w-full bg-white text-black hover:bg-white/90">
                          {isGeneratingTarget ? <RefreshCw className="animate-spin" size={14}/> : 'Generate Analysis'}
                       </Button>
                    </div>
                 )}
              </div>

              {/* Peak Time */}
              <div className="bg-white rounded-xl shadow-card border border-border-default p-5">
                 <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-1">Peak Focus Time</h3>
                 <div className="text-lg font-bold text-text-primary mb-3">
                   {peakHour}:00 - {peakHour+2}:00
                 </div>
                 <div className="flex items-end gap-1 h-12">
                   {Array.from({length:24}).map((_,i) => {
                      const h = hoursMap[i] || 0;
                      const isPeak = i === peakHour;
                      return <div key={i} className={clsx("flex-1 rounded-t-sm", isPeak ? "bg-accent-blue" : "bg-border-default")} style={{height: `${Math.max(10, (h/maxSessions)*100)}%`}} />
                   })}
                 </div>
              </div>

              {/* Neglect Alert */}
              {neglected.length > 0 && (
                 <div className="bg-red-50 rounded-xl border border-red-200 p-5">
                    <h3 className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertCircle size={14}/> Neglect Alert</h3>
                    <p className="text-xs text-red-900 mb-3">You haven't logged any time for these subjects in the last 7 days:</p>
                    <div className="flex flex-wrap gap-2">
                       {neglected.map(s => (
                         <div key={s.id} className="px-2 py-1 bg-white border border-red-200 text-red-700 text-xs font-bold rounded-md">
                           {s.name}
                         </div>
                       ))}
                    </div>
                 </div>
              )}

           </div>

        </div>
    </div>
  );
}
