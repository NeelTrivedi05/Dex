import { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Settings2, Download, RefreshCw, Send, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import Button from '../../ui/Button';
import type { DexExam, DexSubject, StudyPlan, TimetableSlot } from '../types';
import clsx from 'clsx';
import { motion } from 'framer-motion';

export default function AIPlanner() {
  const [subjects, setSubjects] = useState<DexSubject[]>([]);
  const [exams, setExams] = useState<DexExam[]>([]);
  
  // Generator State
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [prefTime, setPrefTime] = useState('Afternoon');
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [studyStyle, setStudyStyle] = useState('Balanced');
  const [breakFreq, setBreakFreq] = useState('Pomodoro');
  const [constraints, setConstraints] = useState('');
  
  // App State
  const [isGenerating, setIsGenerating] = useState(false);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [adjustPrompt, setAdjustPrompt] = useState('');

  // Refs for Charts
  const chartRef1 = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef1 = useRef<any>(null);

  useEffect(() => {
    const s = localStorage.getItem('dexai_subjects');
    const e = localStorage.getItem('dexai_exams');
    const p = localStorage.getItem('dexai_study_plan');
    if (s) setSubjects(JSON.parse(s));
    if (e) {
       const px = JSON.parse(e);
       setExams(px);
       // Select all active by default
       setSelectedExams(px.filter((x: DexExam) => !x.isCompleted).map((x: DexExam) => x.id));
    }
    if (p) setPlan(JSON.parse(p));
  }, []);

  useEffect(() => {
     if (plan && (window as any).Chart && chartRef1.current) {
        if (chartInstanceRef1.current) {
           chartInstanceRef1.current.destroy();
        }
        const ctx = chartRef1.current.getContext('2d');
        if (ctx) {
           const labels = Object.keys(plan.summary.subjectBreakdown);
           const data = Object.values(plan.summary.subjectBreakdown);
           chartInstanceRef1.current = new (window as any).Chart(ctx, {
              type: 'radar',
              data: {
                 labels,
                 datasets: [{
                    label: 'Allocated Hours',
                    data,
                    backgroundColor: 'rgba(0,122,255,0.2)',
                    borderColor: 'rgba(0,122,255,1)',
                    pointBackgroundColor: 'rgba(0,122,255,1)',
                 }]
              },
              options: {
                 scales: { r: { beginAtZero: true, ticks: { backdropColor: 'transparent' } } },
                 plugins: { legend: { display: false } }
              }
           });
        }
     }
  }, [plan]);

  const showToast = (m: string) => { setToastMsg(m); setTimeout(()=>setToastMsg(null), 4000); };

  const generatePlan = async (isAdjust = false) => {
    const apiKey = import.meta.env.VITE_GROK_API_KEY;
    if (!apiKey) return showToast("API key not configured — go to Dex AI Settings");

    const targetExams = exams.filter(e => selectedExams.includes(e.id));
    if (targetExams.length === 0) return showToast("Please select at least one exam.");

    setIsGenerating(true);
    let sysPrompt = `
      You are Dex, an elite academic study planner AI.
      Exams: ${JSON.stringify(targetExams)}
      Subjects: ${JSON.stringify(subjects)}
      Hours/day: ${hoursPerDay}
      Preferred time: ${prefTime}
      Weekends: ${includeWeekends}
      Study style: ${studyStyle}
      Break frequency: ${breakFreq}
      Constraints: '${constraints}'
      
      Generate a day-by-day study plan as a JSON object ONLY. No markdown wrapper like \`\`\`json. Return pure JSON.
      Structure EXACTLY:
      {
        "plan": [
          {
            "date": "2024-05-01",
            "day": "Monday",
            "sessions": [
              { "subject": "string", "chapter": "string", "startTime": "09:00", "endTime": "10:30", "durationMinutes": 90, "type": "Study", "notes": "string" }
            ],
            "totalStudyMinutes": 90,
            "motivationalTip": "string"
          }
        ],
        "summary": { "totalDays": 1, "totalStudyHours": 1.5, "subjectBreakdown": { "Math": 1.5 }, "readinessScore": 85, "riskAssessment": "string", "topRecommendations": ["rec1", "rec2", "rec3"] }
      }
    `;

    const messages = [{ role: 'system', content: sysPrompt }];
    if (isAdjust && plan && adjustPrompt) {
       messages.push({ role: 'assistant', content: JSON.stringify(plan) });
       messages.push({ role: 'user', content: adjustPrompt });
    }

    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
         },
         body: JSON.stringify({
            model: "grok-beta",
            messages,
            max_tokens: 4000,
            temperature: 0.3
         })
      });

      if (!res.ok) throw new Error("API Request Failed");
      const data = await res.json();
      let text = data.choices[0].message.content.trim();
      if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '');
      
      const parsedPlan = JSON.parse(text);
      if (!parsedPlan.plan || !parsedPlan.summary) throw new Error("Malformed JSON structure");
      
      setPlan(parsedPlan);
      localStorage.setItem('dexai_study_plan', JSON.stringify(parsedPlan));
      if (isAdjust) setAdjustPrompt('');
      
    } catch (e: any) {
      console.error(e);
      showToast("AI response malformed or failed — retrying or check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
     window.print();
  };

  const activeExamsList = exams.filter(e => !e.isCompleted);

  return (
    <div className="flex flex-col gap-8 h-full max-w-7xl mx-auto w-full animate-in fade-in pb-12">
      {/* Top Banner Context */}
      <div className="flex items-center justify-between mb-2">
         <h2 className="text-xl font-bold text-text-primary flex items-center gap-3">
            <BrainCircuit className="text-accent-blue" size={24} /> AI Study Planner
         </h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start printable-flex">
         
         {/* Generator Panel */}
         <div className="w-full lg:w-[60%] flex flex-col gap-6 no-print">
            <div className="bg-white rounded-xl shadow-card border border-border-default p-6">
               <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2"><Settings2 size={16}/> Configuration</h3>
               
               <div className="space-y-6">
                  {/* Exams Selection */}
                  <div>
                    <label className="text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2 block">Target Exams</label>
                    <div className="flex flex-wrap gap-2">
                       {activeExamsList.length === 0 && <span className="text-xs text-text-tertiary">No upcoming exams available. Add them in the Exams tab.</span>}
                       {activeExamsList.map(ex => {
                          const isSel = selectedExams.includes(ex.id);
                          return (
                            <button key={ex.id} onClick={() => {
                               if (isSel) setSelectedExams(selectedExams.filter(i=>i!==ex.id));
                               else setSelectedExams([...selectedExams, ex.id]);
                            }} className={clsx("px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all", isSel ? "bg-accent-blue/10 border-accent-blue text-accent-blue" : "bg-bg-surface border-border-default text-text-secondary hover:border-accent-blue")}>
                               {ex.title}
                            </button>
                          )
                       })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="text-xs font-semibold text-text-secondary mb-1 block">Study Hours / Day ({hoursPerDay}h)</label>
                       <input type="range" min="1" max="12" step="1" value={hoursPerDay} onChange={e=>setHoursPerDay(Number(e.target.value))} className="w-full" />
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-text-secondary mb-1 block">Preferred Time</label>
                       <select value={prefTime} onChange={e=>setPrefTime(e.target.value)} className="w-full text-sm border border-border-default rounded-lg p-2 focus:outline-none focus:border-accent-blue bg-white">
                         <option>Morning</option><option>Afternoon</option><option>Evening</option><option>Night</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-text-secondary mb-1 block">Study Style</label>
                       <select value={studyStyle} onChange={e=>setStudyStyle(e.target.value)} className="w-full text-sm border border-border-default rounded-lg p-2 focus:outline-none focus:border-accent-blue bg-white">
                         <option>Focused</option><option>Balanced</option><option>Intensive</option>
                       </select>
                     </div>
                     <div>
                       <label className="text-xs font-semibold text-text-secondary mb-1 block">Break Frequency</label>
                       <select value={breakFreq} onChange={e=>setBreakFreq(e.target.value)} className="w-full text-sm border border-border-default rounded-lg p-2 focus:outline-none focus:border-accent-blue bg-white">
                         <option>Pomodoro (25/5)</option><option>Long (50/10)</option><option>Japanese (52/17)</option>
                       </select>
                     </div>
                     <div className="md:col-span-2 flex items-center justify-between p-3 rounded-lg border border-border-default bg-bg-surface">
                       <span className="text-sm font-semibold text-text-primary">Include Weekends</span>
                       <button onClick={()=>setIncludeWeekends(!includeWeekends)} className={clsx("w-10 h-6 rounded-full transition-colors relative", includeWeekends ? "bg-accent-green" : "bg-border-default")}>
                          <div className={clsx("absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform", includeWeekends ? "translate-x-4" : "")} />
                       </button>
                     </div>
                  </div>

                  <div>
                     <label className="text-xs font-semibold text-text-secondary mb-1 block">Special Constraints</label>
                     <textarea value={constraints} onChange={e=>setConstraints(e.target.value)} placeholder="e.g. No study on Saturday mornings..." className="w-full h-20 p-2 text-sm border border-border-default rounded-lg focus:outline-none focus:border-accent-blue resize-none bg-white"/>
                  </div>
               </div>

               <Button onClick={() => generatePlan(false)} disabled={isGenerating || selectedExams.length===0} className="w-full mt-6 flex justify-center items-center gap-2">
                 {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                 {isGenerating ? 'Generating Cognitive Plan...' : 'Generate Plan with Grok AI'}
               </Button>
            </div>

            {/* AI Insights Sidebar */}
            {plan && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl shadow-card border border-border-default p-4">
                     <h4 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Subject Balance</h4>
                     <canvas ref={chartRef1} className="w-full h-48" />
                  </div>
                  <div className="bg-white rounded-xl shadow-card border border-border-default p-4 flex flex-col justify-center gap-4">
                     <div className="text-center p-3 rounded-lg border border-border-subtle bg-bg-surface flex flex-col items-center">
                        <AlertTriangle size={24} className={plan.summary.readinessScore < 50 ? "text-accent-red" : "text-text-secondary"} />
                        <div className="text-xs font-bold mt-2 text-text-secondary uppercase">Risk Assessment</div>
                        <div className="text-sm font-medium mt-1">{plan.summary.riskAssessment}</div>
                     </div>
                     <div className="border border-border-subtle rounded-lg p-3 text-2xs space-y-2">
                        <div className="font-bold text-text-primary uppercase tracking-widest text-[#000]">Top Recommendations</div>
                        {plan.summary.topRecommendations.map((r,i) => <div key={i} className="flex gap-2"><span>•</span><span>{r}</span></div>)}
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Generated Plan View */}
         <div className="w-full lg:w-[40%] printable-full">
            {plan ? (
               <div className="flex flex-col h-[800px] bg-white rounded-xl shadow-card border border-border-default overflow-hidden">
                  <div className="p-4 border-b border-border-default bg-bg-surface flex justify-between items-center no-print">
                     <span className="font-bold text-text-primary">Generated Plan</span>
                     <div className="flex gap-2">
                        <Button variant="ghost" onClick={handlePrint} className="h-8 w-8 p-0 flex items-center justify-center"><Download size={14} /></Button>
                     </div>
                  </div>

                  <div className="bg-gradient-to-r from-accent-blue to-accent-purple p-6 text-white shrink-0">
                     <div className="flex justify-between items-end mb-4">
                        <div>
                          <div className="text-4xl font-bold">{plan.summary.readinessScore}%</div>
                          <div className="text-xs uppercase tracking-widest opacity-80 font-bold">Proj. Readiness</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{plan.summary.totalStudyHours}h</div>
                          <div className="text-xs uppercase tracking-widest opacity-80 font-bold">Total Over {plan.summary.totalDays} Days</div>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-6">
                     {plan.plan.map((day, idx) => (
                        <div key={idx} className="relative">
                           <div className="sticky top-0 bg-white/90 backdrop-blur pb-2 mb-2 z-10 border-b border-border-subtle">
                             <h4 className="text-sm font-bold text-text-primary">{day.day}, {new Date(day.date).toLocaleDateString([],{month:'short', day:'numeric'})}</h4>
                             <p className="text-xs text-text-secondary">{day.totalStudyMinutes / 60} hrs total</p>
                           </div>

                           <div className="pl-2 border-l-2 border-border-default space-y-4">
                              {day.sessions.map((ses, sidx) => {
                                 const isBreak = ses.type === 'Break';
                                 return (
                                   <div key={sidx} className={clsx("relative p-3 rounded-lg border", isBreak ? "bg-bg-surface border-border-subtle opacity-75" : "bg-white border-border-default shadow-sm")}>
                                      <div className="-left-4 absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 border-white" style={{background: isBreak ? '#999' : '#007AFF'}} />
                                      <div className="flex justify-between items-start mb-1">
                                        <div className="text-xs font-bold" style={{color: isBreak ? '#666' : '#007AFF'}}>{ses.subject || 'Break'}</div>
                                        <div className="text-2xs font-mono font-bold text-text-secondary flex items-center gap-1"><Clock size={10}/> {ses.startTime} - {ses.endTime}</div>
                                      </div>
                                      {!isBreak && <div className="text-sm font-medium text-text-primary mb-1">{ses.chapter}</div>}
                                      <div className="text-xs text-text-secondary">{ses.notes}</div>
                                   </div>
                                 )
                              })}
                           </div>

                           <div className="mt-3 text-xs italic text-text-tertiary text-center">&ldquo;{day.motivationalTip}&rdquo;</div>
                        </div>
                     ))}
                  </div>

                  {/* Adjust Plan Input */}
                  <div className="p-3 border-t border-border-default bg-bg-surface shrink-0 no-print">
                     <div className="flex gap-2">
                        <input value={adjustPrompt} onChange={e=>setAdjustPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generatePlan(true)} placeholder="Tweak this plan..." className="flex-1 h-10 px-3 text-sm rounded-lg border border-border-default focus:outline-none focus:border-accent-blue w-full" />
                        <Button onClick={()=>generatePlan(true)} disabled={!adjustPrompt || isGenerating} className="h-10 w-10 p-0 flex items-center justify-center shrink-0"><Send size={16}/></Button>
                     </div>
                  </div>
               </div>
            ) : (
               <div className="h-full border-2 border-dashed border-border-default rounded-xl flex flex-col items-center justify-center text-text-secondary p-8 text-center bg-white/50">
                  <BrainCircuit size={48} className="text-border-default mb-4" />
                  <p className="font-semibold text-text-primary">No Plan Generated</p>
                  <p className="text-sm mt-2 max-w-sm">Configure your parameters on the left and let Grok generate an optimal mathematical study schedule.</p>
               </div>
            )}
         </div>
      </div>

      {toastMsg && (
        <div className="fixed bottom-4 right-4 bg-text-primary text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-elevated z-50 animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      {/* Print styles injected locally for this feature to hide sidebar and configs */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .printable-full { width: 100% !important; margin: 0; padding: 0; box-shadow: none; border: none; }
          .printable-flex { display: block !important; }
          body, html { background: white !important; }
        }
      `}</style>
    </div>
  );
}
