import { useState, useEffect, useRef } from 'react';
import { BrainCircuit, Send, Trash2, ArrowRight } from 'lucide-react';
import type { ChatMessage, DexSubject, DexExam, StudySessionLog, StudyPlan } from '../types';
import clsx from 'clsx';
import Button from '../../ui/Button';

const PROMPT_POOL = [
  "How prepared am I for my next exam?",
  "Quiz me on a random subject",
  "Give me today's study tip",
  "What should I study next?",
  "Motivate me",
  "Analyze my current study plan",
  "Help me understand a difficult topic"
];

function getRandomChips() {
  const shuffled = [...PROMPT_POOL].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

const showNotification = (title: string, body: string) => {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
};

export default function DexAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputStr, setInputStr] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chips, setChips] = useState<string[]>([]);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Contexts
  const [subjects, setSubjects] = useState<DexSubject[]>([]);
  const [exams, setExams] = useState<DexExam[]>([]);
  const [tdySessions, setTdySessions] = useState<StudySessionLog[]>([]);
  const [plan, setPlan] = useState<StudyPlan | null>(null);

  useEffect(() => {
    setChips(getRandomChips());
    const h = localStorage.getItem('dexai_chat_history');
    if (h) setMessages(JSON.parse(h));

    // Load contexts
    const s = localStorage.getItem('dexai_subjects');
    if (s) setSubjects(JSON.parse(s));
    const e = localStorage.getItem('dexai_exams');
    if (e) setExams(JSON.parse(e));
    const pl = localStorage.getItem('dexai_study_plan');
    if (pl) setPlan(JSON.parse(pl));
    const sl = localStorage.getItem('dexai_sessions');
    if (sl) {
       const sessionArr = JSON.parse(sl);
       const tdy = new Date().toISOString().split('T')[0];
       setTdySessions(sessionArr.filter(((se:any) => se.date.startsWith(tdy))));
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('dexai_chat_history', JSON.stringify(messages.slice(-50)));
    }
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearChat = () => {
    if (confirm("Clear all chat history?")) {
      setMessages([]);
      localStorage.removeItem('dexai_chat_history');
    }
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || inputStr).trim();
    if (!textToSend) return;

    const apiKey = import.meta.env.VITE_GROK_API_KEY;
    if (!apiKey) return alert("Grok API key missing in environment.");

    const newUserMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: textToSend, timestamp: new Date().toISOString() };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInputStr('');
    setIsTyping(true);

    const sysPrompt = `You are Dex, a highly intelligent academic assistant integrated into a student dashboard. 
You have access to the following context about this student: 
Subjects: ${JSON.stringify(subjects)}. 
Upcoming Exams: ${JSON.stringify(exams.filter(e=>!e.isCompleted))}. 
Today's study sessions: ${JSON.stringify(tdySessions)}. 
Current study plan: ${JSON.stringify(plan ? plan.summary : null)}. 
Use this context to give personalized, specific, actionable advice. Be concise, warm, and motivating. 
You can schedule reminders. If you explicitly want to trigger a local browser notification / reminder, include EXACTLY this JSON block format anywhere in your response, keeping it to one action per message:
\`\`\`action
{ "action": "reminder", "message": "Short text", "minutesFromNow": number }
\`\`\`
The app will intercept that block and run it. Do not use that block for general conversation.`;

    const apiMessages = [
      { role: 'system', content: sysPrompt },
      ...updatedMessages.slice(-20).map(m => ({ role: m.role, content: m.content }))
    ];

    try {
      const res = await fetch('https://api.x.ai/v1/chat/completions', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
         body: JSON.stringify({ model: 'grok-beta', messages: apiMessages, max_tokens: 1000 })
      });
      if (!res.ok) throw new Error("API Faiure");
      
      const d = await res.json();
      let rawText = d.choices[0].message.content.trim();

      // Check for action block
      const actionMatch = rawText.match(/```action\s*([\s\S]*?)\s*```/);
      let renderText = rawText;
      
      if (actionMatch && actionMatch[1]) {
         try {
           const actionData = JSON.parse(actionMatch[1]);
           if (actionData.action === 'reminder' && actionData.minutesFromNow) {
               const delay = actionData.minutesFromNow * 60 * 1000;
               setTimeout(() => {
                  showNotification("Dex AI Reminder", actionData.message);
               }, delay);
           }
         } catch(e) { console.error("Action parse err", e); }
         renderText = rawText.replace(/```action\s*([\s\S]*?)\s*```/g, '').trim();
      }

      const newAiMsg: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: renderText, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, newAiMsg]);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: "I'm having trouble connecting right now. Let me recalibrate.", timestamp: new Date().toISOString() }]);
    }
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full bg-white rounded-xl shadow-card border border-border-default overflow-hidden animate-in fade-in">
       
       {/* Header */}
       <div className="p-4 border-b border-border-default bg-bg-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white"><BrainCircuit size={16}/></div>
             <div>
               <h2 className="text-sm font-bold text-text-primary">Dex AI Assistant</h2>
               <div className="text-2xs font-bold text-text-secondary w-full">Grok Engine</div>
             </div>
          </div>
          <Button variant="ghost" onClick={clearChat} className="h-8 px-3 text-xs text-text-tertiary flex gap-2 hover:text-accent-red">
            <Trash2 size={14}/> Clear Session
          </Button>
       </div>

       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#FAFAFA]">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full opacity-50 text-center max-w-sm mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-border-default flex items-center justify-center"><BrainCircuit size={32} /></div>
                <p className="text-sm font-medium text-text-primary">"Hello. I'm Dex, your personal academic AI. I can analyze your schedule, create quizzes, or just help you stay focused. What do you need today?"</p>
             </div>
          )}

          {messages.map(m => {
             const isUser = m.role === 'user';
             return (
               <div key={m.id} className={clsx("flex gap-3", isUser ? "justify-end" : "justify-start")}>
                  {!isUser && <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-bold text-xs shrink-0 self-end mb-1 shadow-sm">D</div>}
                  <div className={clsx("px-4 py-3 text-sm max-w-[85%] sm:max-w-[75%]", isUser ? "bg-accent-blue text-white rounded-2xl rounded-br-sm shadow-sm" : "bg-white border border-border-default text-text-primary rounded-2xl rounded-bl-sm shadow-sm leading-relaxed whitespace-pre-wrap font-medium")}>
                     {m.content}
                  </div>
               </div>
             )
          })}
          
          {isTyping && (
             <div className="flex gap-3 justify-start">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-white font-bold text-xs shrink-0 self-end mb-1 shadow-sm">D</div>
                 <div className="px-5 py-4 bg-white border border-border-default rounded-2xl rounded-bl-sm flex items-center gap-1.5 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-border-default animate-bounce" style={{animationDelay:'0ms'}}/>
                    <div className="w-1.5 h-1.5 rounded-full bg-border-default animate-bounce" style={{animationDelay:'150ms'}}/>
                    <div className="w-1.5 h-1.5 rounded-full bg-border-default animate-bounce" style={{animationDelay:'300ms'}}/>
                 </div>
             </div>
          )}
          <div ref={bottomRef} className="h-1"/>
       </div>

       {/* Input Area */}
       <div className="p-4 border-t border-border-default bg-white shrink-0 shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
          <div className="flex flex-wrap gap-2 mb-3">
             {chips.map(c => (
               <button key={c} onClick={() => handleSend(c)} className="px-3 py-1.5 bg-bg-surface border border-border-default rounded-full text-xs font-semibold text-text-secondary hover:bg-accent-blue/10 hover:text-accent-blue hover:border-accent-blue transition-colors flex items-center gap-1 group">
                 {c} <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 -ml-2 group-hover:ml-0 transition-all"/>
               </button>
             ))}
          </div>
          <div className="flex gap-2">
             <textarea 
               value={inputStr} 
               onChange={e => setInputStr(e.target.value)} 
               onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
               className="flex-1 min-h-[48px] max-h-[140px] px-4 py-3 bg-bg-surface border border-border-default rounded-xl text-sm focus:outline-none focus:border-accent-blue resize-none transition-colors" 
               placeholder="Chat with your academic assistant..."
               rows={inputStr.split('\n').length > 3 ? 3 : 1}
             />
             <Button onClick={()=>handleSend()} disabled={!inputStr.trim() || isTyping} className="w-12 h-12 rounded-xl shrink-0 p-0 flex items-center justify-center bg-accent-blue text-white shadow-md hover:shadow-lg disabled:opacity-50">
                <Send size={18} />
             </Button>
          </div>
       </div>

    </div>
  );
}
