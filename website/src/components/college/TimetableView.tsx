import { useState, useRef, useEffect } from 'react';
import { TableProperties, Upload, X, Loader2, Sparkles, RefreshCcw } from 'lucide-react';
import Button from '../ui/Button';
import clsx from 'clsx';

interface TimetableBlock {
  subject: string;
  timeRange: string;
  room: string;
  isRecess?: boolean;
}

interface TimetableData {
  Monday: TimetableBlock[];
  Tuesday: TimetableBlock[];
  Wednesday: TimetableBlock[];
  Thursday: TimetableBlock[];
  Friday: TimetableBlock[];
  Saturday: TimetableBlock[];
  Sunday: TimetableBlock[];
}

const defaultColors = ['bg-red-100 text-red-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800', 'bg-purple-100 text-purple-800', 'bg-orange-100 text-orange-800', 'bg-yellow-100 text-yellow-800', 'bg-cyan-100 text-cyan-800'];

const DEFAULT_TIMETABLE: TimetableData = {
  Monday: [
     { subject: 'Library', timeRange: '08:00-10:00', room: 'Library' },
     { subject: 'INM / GEL', timeRange: '10:00-11:00', room: 'CR 105 / Lab 1' },
     { subject: 'OSY', timeRange: '11:00-12:00', room: 'CR 201' },
     { subject: 'RECESS', timeRange: '12:00-01:00', room: '', isRecess: true },
     { subject: 'PRP', timeRange: '01:00-03:00', room: 'CR 105' },
     { subject: 'RECESS', timeRange: '03:00-04:00', room: '', isRecess: true }
  ],
  Tuesday: [
     { subject: 'IOT / NWA', timeRange: '08:00-10:00', room: 'LAB 5 / LAB 4' },
     { subject: 'OSY / PRP', timeRange: '10:00-12:00', room: 'LAB 5 / LAB 4' },
     { subject: 'RECESS', timeRange: '12:00-01:00', room: '', isRecess: true },
     { subject: 'NWA', timeRange: '01:00-02:00', room: 'CR 105' },
     { subject: 'IOT', timeRange: '02:00-04:00', room: 'CR 105' }
  ],
  Wednesday: [
     { subject: 'OSY / NWA', timeRange: '08:00-10:00', room: 'LAB 5 / LAB 4' },
     { subject: 'IOT / PRP', timeRange: '10:00-12:00', room: 'LAB 5 / LAB 4' },
     { subject: 'RECESS', timeRange: '12:00-01:00', room: '', isRecess: true },
     { subject: 'OSY', timeRange: '01:00-02:00', room: 'CR 105' },
     { subject: 'CSY', timeRange: '02:00-04:00', room: 'Lab 3' }
  ],
  Thursday: [
     { subject: 'OSY', timeRange: '08:00-10:00', room: 'CR 105' },
     { subject: 'IOT', timeRange: '10:00-11:00', room: 'CR 105' },
     { subject: 'RECESS', timeRange: '11:00-12:00', room: '', isRecess: true },
     { subject: 'IOT', timeRange: '12:00-01:00', room: 'CR 105' },
     { subject: 'CSY', timeRange: '01:00-02:00', room: 'CR 105' },
     { subject: 'ADB', timeRange: '02:00-03:00', room: 'Lab 4' },
     { subject: 'RECESS', timeRange: '03:00-04:00', room: '', isRecess: true }
  ],
  Friday: [
     { subject: 'RECESS', timeRange: '08:00-09:00', room: '', isRecess: true },
     { subject: 'GEL', timeRange: '09:00-10:00', room: 'DH 304' },
     { subject: 'RECESS', timeRange: '11:00-12:00', room: '', isRecess: true },
     { subject: 'PRP / NWA', timeRange: '12:00-02:00', room: 'LAB 5 / LAB 4' },
     { subject: 'PRP / NWA', timeRange: '02:00-04:00', room: 'LAB 5 / LAB 4' }
  ],
  Saturday: [
     { subject: 'CSY / ADB', timeRange: '08:00-10:00', room: 'Lab 4 / Lab 3' },
     { subject: 'CSV', timeRange: '10:00-11:00', room: 'CR 105' },
     { subject: 'ADB', timeRange: '11:00-12:00', room: 'Lab 5' },
     { subject: 'RECESS', timeRange: '12:00-01:00', room: '', isRecess: true },
     { subject: 'NWA', timeRange: '01:00-02:00', room: 'CR 105' },
     { subject: 'PSP', timeRange: '02:00-04:00', room: 'Lab 5, Lab 4' }
  ],
  Sunday: []
};

export default function TimetableView() {
  const [data, setData] = useState<TimetableData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
     const stored = localStorage.getItem('college_timetable');
     if (stored) setData(JSON.parse(stored));
     else setData(DEFAULT_TIMETABLE);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;

     setIsUploading(true);
     
     try {
       // Convert file to base64
       const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
       });
       
       const base64Data = base64.split(',')[1];
       const apiKey = import.meta.env.VITE_GROQ_API_KEY;

       if (!apiKey) throw new Error("Missing VITE_GROQ_API_KEY in .env");

       const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
           body: JSON.stringify({
              model: "llama-3.2-90b-vision-preview",
              messages: [
                 {
                    role: 'user',
                    content: [
                       { type: "text", text: "Parse this timetable image into a strict JSON payload representing the schedule. The output must be EXACTLY valid JSON, with keys 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'. Each key points to an array of objects representing class blocks. The objects must have ONLY these string properties: 'subject' (short code like OSY, CSY), 'timeRange' (e.g. '08:00-10:00'), 'room' (e.g. 'CR 105', 'Lab 4'), 'isRecess' (boolean, true if it evaluates to explicitly RECESS/lunch). DO NOT reply with any markdown or anything outside the JSON object. Omit empty days as empty arrays." },
                       { type: "image_url", image_url: { url: `data:${file.type};base64,${base64Data}` } }
                    ]
                 }
              ],
              temperature: 0.2
           })
       });

       if (!res.ok) throw new Error("Vision generation failed");
       const jsonResponse = await res.json();
       
       let raw = jsonResponse.choices[0]?.message?.content?.trim();
       if (raw.startsWith('```json')) raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
       if (raw.startsWith('```')) raw = raw.replace(/```/g, '').trim();

       const decoded = JSON.parse(raw);
       
       // Force shape defaults
       const finalData: TimetableData = {
          Monday: decoded.Monday || [],
          Tuesday: decoded.Tuesday || [],
          Wednesday: decoded.Wednesday || [],
          Thursday: decoded.Thursday || [],
          Friday: decoded.Friday || [],
          Saturday: decoded.Saturday || [],
          Sunday: decoded.Sunday || []
       };

       setData(finalData);
       localStorage.setItem('college_timetable', JSON.stringify(finalData));
       showToast("Timetable mapped successfully!");

     } catch(err: any) {
        showToast("Error parsing timetable image.");
     } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
     }
  };

  const getSubjectColorStyle = (subject: string) => {
     if (subject.toUpperCase().includes('RECESS')) return 'transparent'; // Special case
     let hash = 0;
     for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
     const index = Math.abs(hash) % defaultColors.length;
     return defaultColors[index];
  };

  const renderCol = (dayData: TimetableBlock[]) => {
     if (!dayData || dayData.length === 0) return (
         <div className="flex-1 flex items-center justify-center pt-[100px]">
           <span className="text-xs italic text-text-tertiary">No Lecture</span>
         </div>
     );

     return (
        <div className="flex flex-col gap-3">
           {dayData.map((block, i) => {
              if (block.isRecess || block.subject.toUpperCase() === 'RECESS') {
                 return (
                    <div key={i} className="py-2 text-center text-[10px] font-bold text-text-tertiary uppercase tracking-widest my-1 border-b border-border-default">
                       RECESS
                    </div>
                 );
              }
              return (
                 <div key={i} className={clsx("p-3 rounded-xl flex flex-col gap-1 border border-black/5 shadow-sm", getSubjectColorStyle(block.subject))}>
                    <div className="font-bold text-sm leading-none">{block.subject}</div>
                    <div className="text-[11px] opacity-80 font-medium font-mono tracking-tight">{block.timeRange}</div>
                    <div className="text-[12px] opacity-90 mt-1">{block.room}</div>
                 </div>
              )
           })}
        </div>
     );
  };

  return (
    <div className="p-8 w-full h-full flex flex-col max-w-[1400px] mx-auto animate-in fade-in">
       
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue font-bold">
                <TableProperties size={20} />
             </div>
             <h1 className="text-3xl font-bold text-text-primary">Timetable</h1>
          </div>
          
          <div className="flex items-center gap-4">
             <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
             
             {data && (
                <Button variant="ghost" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2">
                   <RefreshCcw size={16}/> Override Grid
                </Button>
             )}
             {!data && (
                <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="flex items-center gap-2 shadow-sm">
                   {isUploading ? <Loader2 size={16} className="animate-spin"/> : <Upload size={16}/>} 
                   {isUploading ? 'Analyzing Image...' : 'Upload Schedule Image'}
                </Button>
             )}
          </div>
       </div>

       {/* TIMETABLE GRID */}
       {data ? (
          <div className="flex-1 w-full bg-white rounded-2xl shadow-card border border-border-default overflow-hidden flex flex-col pt-6 pb-8 px-6">
             <div className="grid grid-cols-7 gap-6 text-center mb-6 border-b border-border-default pb-4 shrink-0">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                   <div key={day} className="text-sm font-semibold text-text-secondary">{day}</div>
                ))}
             </div>
             
             <div className="grid grid-cols-7 gap-6 flex-1 overflow-y-auto">
                {renderCol(data.Monday)}
                {renderCol(data.Tuesday)}
                {renderCol(data.Wednesday)}
                {renderCol(data.Thursday)}
                {renderCol(data.Friday)}
                {renderCol(data.Saturday)}
                {renderCol(data.Sunday)}
             </div>
          </div>
       ) : (
          <div className="flex-1 w-full bg-white rounded-xl shadow-card border border-border-default border-dashed flex flex-col items-center justify-center text-center p-12 relative overflow-hidden">
             
             {isUploading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-10 flex flex-col items-center justify-center transition-all animate-in fade-in">
                   <div className="relative">
                      <div className="w-16 h-16 border-4 border-accent-blue/20 rounded-full"></div>
                      <div className="w-16 h-16 border-4 border-accent-blue rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                      <Sparkles size={20} className="text-accent-blue absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                   </div>
                   <h3 className="text-lg font-bold text-text-primary mt-6">Groq Vision Extraction</h3>
                   <p className="text-sm text-text-secondary mt-1">Our AI is mapping nodes in your graphic directly into strict JSON...</p>
                </div>
             )}

             <div className="w-16 h-16 rounded-full bg-accent-blue/5 text-accent-blue flex items-center justify-center mb-4">
                 <TableProperties size={32} />
             </div>
             <h2 className="text-xl font-bold text-text-primary mb-2">Automate Your Roster</h2>
             <p className="text-text-secondary max-w-sm mb-6">Take a photo of a whiteboard spreadsheet or upload a messy `.png` schedule export. We'll utilize multi-modal AI to recreate it natively.</p>
             <Button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2" variant="primary">
                 <Upload size={16}/> Upload Timetable Image
             </Button>
          </div>
       )}

       {toast && (
          <div className="fixed bottom-4 right-4 bg-text-primary text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-elevated z-50 animate-in fade-in slide-in-from-bottom-2">
            {toast}
          </div>
       )}

    </div>
  );
}
