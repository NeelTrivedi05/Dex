import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Settings, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';

export default function CalendarView() {
  const [embedUrl, setEmbedUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
     const stored = localStorage.getItem('college_calendar_url');
     if (stored) {
        setEmbedUrl(stored);
        setInputUrl(stored);
     }
  }, []);

  const handleSave = () => {
     setEmbedUrl(inputUrl);
     localStorage.setItem('college_calendar_url', inputUrl);
     setIsEditing(false);
  };

  return (
    <div className="p-8 w-full h-full flex flex-col max-w-7xl mx-auto animate-in fade-in">
       <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue font-bold">
                <CalendarIcon size={20} />
             </div>
             <h1 className="text-3xl font-bold text-text-primary">Google Calendar</h1>
          </div>
          
          <Button variant="ghost" onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2">
             <Settings size={16} /> {isEditing ? 'Cancel' : 'Configure Embed'}
          </Button>
       </div>

       {isEditing && (
          <div className="bg-white rounded-xl shadow-card border border-border-default p-6 mb-6 flex flex-col gap-4">
             <h2 className="text-sm font-bold text-text-primary uppercase tracking-widest flex items-center gap-2 mb-2">
                 <LinkIcon size={16}/> Calendar Public URL
             </h2>
             <p className="text-sm text-text-secondary">Paste your Google Calendar embed link. Ensure your calendar is set to public or you are logged into your browser session.</p>
             <div className="flex gap-3">
                <input 
                  value={inputUrl} onChange={e=>setInputUrl(e.target.value)} 
                  placeholder="https://calendar.google.com/calendar/embed?src=..."
                  className="flex-1 h-10 border border-border-default rounded-lg px-4 text-sm focus:border-accent-blue outline-none"
                />
                <Button onClick={handleSave} className="flex items-center gap-2"><CheckCircle2 size={16}/> Save URL</Button>
             </div>
          </div>
       )}

       {embedUrl ? (
          <div className="flex-1 w-full bg-white rounded-xl shadow-card border border-border-default overflow-hidden">
             <iframe 
               src={embedUrl} 
               style={{borderWidth:0}} 
               width="100%" 
               height="100%" 
               frameBorder="0" 
               scrolling="no"
               title="Google Calendar"
               className="bg-white"
             />
          </div>
       ) : (
          <div className="flex-1 w-full bg-white rounded-xl shadow-card border border-border-default border-dashed flex flex-col items-center justify-center text-center p-12">
             <div className="w-16 h-16 rounded-full bg-accent-blue/5 text-accent-blue flex items-center justify-center mb-4">
                 <CalendarIcon size={32} />
             </div>
             <h2 className="text-xl font-bold text-text-primary mb-2">No Calendar Embedded</h2>
             <p className="text-text-secondary max-w-sm mb-6">Link your Google Calendar to view all your upcoming lectures, meetings, and deadlines directly from your College Hub.</p>
             <Button onClick={() => setIsEditing(true)}>Configure Calendar Embed</Button>
          </div>
       )}
    </div>
  );
}
