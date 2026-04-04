import React, { useState, useRef } from 'react';
import { Type, UploadCloud, Link as LinkIcon, Sparkles, Copy, Download, Save, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';
import type { SavedNote } from './types';
import clsx from 'clsx';

interface AISummarizerProps {
  initialNote?: SavedNote | null;
}

export default function AISummarizer({ initialNote }: AISummarizerProps) {
  const [inputMode, setInputMode] = useState<'text' | 'file' | 'url'>('text');
  const [text, setText] = useState(initialNote?.content || '');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const isGenerateDisabled = inputMode === 'text' ? wordCount < 50 : inputMode === 'url' ? !url.trim() : !file;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const processFile = (f: File) => {
    setFile(f);
    if (f.name.endsWith('.txt')) {
       const reader = new FileReader();
       reader.onload = (ev) => {
         if (ev.target?.result) setText(ev.target.result as string);
       };
       reader.readAsText(f);
    }
  };

  const handleUrlFetch = async () => {
     if (!url) return;
     try {
       const res = await fetch(url);
       const t = await res.text();
       setText(t);
       showToast("URL content fetched locally");
       setInputMode('text');
     } catch(e) {
       showToast("Failed to fetch. CORS or network error.");
     }
  };

  const generateSummary = async () => {
     setIsGenerating(true);
     setSummary(null);
     
     const promptText = inputMode === 'text' ? text : (file ? `File content placeholder for ${file.name}` : `URL content for ${url}`);
     
     const apiKey = import.meta.env.VITE_GROQ_API_KEY;
     if (!apiKey) {
        setIsGenerating(false);
        showToast("Summary failed — check your API key in Settings.");
        return;
     }

     try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
           body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                 { role: 'system', content: "You are an elite academic summarizer. Given the student's notes, produce a structured summary with exactly three sections:\n1. OVERVIEW: A 3-4 sentence paragraph capturing the core idea.\n2. KEY CONCEPTS: 5-7 bullet points, each one concept with a 1-line explanation.\n3. FURTHER STUDY: 2-3 suggested follow-up topics the student should explore.\nUse clear, concise academic language. Do not add introductory phrases." },
                 { role: 'user', content: `Summarize the following notes:\n\n${promptText}` }
              ],
              max_tokens: 1500
           })
        });

        if (!res.ok) throw new Error("API Fails");
        const data = await res.json();
        setSummary(data.choices[0].message.content);
     } catch (e) {
        showToast("Summary failed — check your API key in Settings.");
     } finally {
        setIsGenerating(false);
     }
  };

  const copyToClipboard = () => {
    if (summary) {
       navigator.clipboard.writeText(summary);
       showToast("Copied to clipboard!");
    }
  };

  const downloadTxt = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: 'text/plain' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = u; a.download = 'summary.txt';
    a.click(); URL.revokeObjectURL(u);
  };

  const saveToNotes = () => {
    if (!summary) return;
    const notesStr = localStorage.getItem('edumind_notes');
    const notes = notesStr ? JSON.parse(notesStr) : [];
    notes.push({
       id: crypto.randomUUID(),
       title: 'AI Summary: ' + new Date().toLocaleDateString(),
       content: summary,
       dateLastModified: new Date().toISOString()
    });
    localStorage.setItem('edumind_notes', JSON.stringify(notes));
    showToast("Saved to Notes Hub!");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full animate-in fade-in h-[calc(100vh-280px)] min-h-[500px]">
       
       {/* LEFT PANEL */}
       <div className="w-full lg:w-[55%] flex flex-col gap-4">
          <h3 className="text-sm font-bold text-text-primary mb-2">Input Your Notes</h3>
          
          <div className="flex bg-white rounded-xl shadow-card border border-border-default p-1 w-full max-w-[280px]">
             {[ 
               { id: 'text', label: 'Text', icon: <Type size={14}/> }, 
               { id: 'file', label: 'File', icon: <UploadCloud size={14}/> }, 
               { id: 'url', label: 'URL', icon: <LinkIcon size={14}/> }
             ].map(m => (
                <button key={m.id} onClick={()=>setInputMode(m.id as any)} className={clsx("flex-1 py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg transition-colors", inputMode === m.id ? "bg-accent-blue text-white" : "text-text-secondary hover:bg-bg-surface")}>
                   {m.icon} {m.label}
                </button>
             ))}
          </div>

          <div className="flex-1 bg-white rounded-xl shadow-card border border-border-default overflow-hidden flex flex-col relative">
             {inputMode === 'text' && (
                <>
                   <textarea
                     value={text}
                     onChange={e => setText(e.target.value)}
                     placeholder="Paste or type your notes here… (minimum 50 words for best results)"
                     className="w-full h-full p-5 text-sm text-text-primary resize-none focus:outline-none focus:bg-blue-50/20 transition-colors bg-transparent border-0"
                   />
                   <div className="absolute bottom-4 left-5 text-xs font-semibold text-text-tertiary">{wordCount} words</div>
                </>
             )}

             {inputMode === 'file' && (
                <div 
                  onDragOver={e => e.preventDefault()} 
                  onDrop={handleFileDrop}
                  className="w-full h-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-border-default m-4 rounded-xl self-center aspect-video max-h-[80%] hover:bg-bg-surface transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                   <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".pdf,.docx,.txt,.png,.jpg" />
                   <UploadCloud size={48} className="text-border-default mb-4" />
                   {file ? (
                      <div className="text-center">
                         <div className="text-sm font-bold text-text-primary">{file.name}</div>
                         <div className="text-xs text-text-secondary mt-1 flex gap-2 items-center justify-center">
                           <span className="px-2 py-0.5 bg-accent-blue/10 text-accent-blue rounded-md">{(file.size/1024).toFixed(1)} KB</span>
                           <Button variant="ghost" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="h-6 px-2 text-xs">Remove</Button>
                         </div>
                         {!file.name.endsWith('.txt') && <div className="text-2xs text-text-tertiary mt-4 italic">File ready — AI will process content</div>}
                      </div>
                   ) : (
                      <>
                        <div className="text-sm font-bold text-text-primary">Drag & drop your file here</div>
                        <div className="text-xs text-text-secondary mt-1">Accepts PDF, DOCX, TXT, images</div>
                      </>
                   )}
                </div>
             )}

             {inputMode === 'url' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8">
                   <div className="w-full max-w-sm flex gap-2">
                       <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." className="flex-1 h-10 px-3 bg-bg-surface border border-border-default rounded-lg text-sm focus:border-accent-blue focus:outline-none" />
                       <Button onClick={handleUrlFetch} disabled={!url.trim()} className="h-10">Fetch</Button>
                   </div>
                   <p className="text-xs text-text-secondary mt-4 max-w-sm text-center">Note: Many sites block direct fetching. If it fails, copy-paste into Text mode instead.</p>
                </div>
             )}
          </div>

          <Button onClick={generateSummary} disabled={isGenerateDisabled || isGenerating} className="w-full h-12 flex justify-center items-center gap-2 text-base font-bold">
             {isGenerating ? <RefreshCw className="animate-spin" size={18}/> : <Sparkles size={18}/>}
             {isGenerating ? 'Structuring Intelligence...' : 'Generate Summary'}
          </Button>
       </div>

       {/* RIGHT PANEL */}
       <div className="w-full lg:w-[45%] flex flex-col gap-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-text-primary">AI Summary</h3>
            {summary && (
              <div className="flex items-center gap-2">
                 <button onClick={copyToClipboard} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-text-secondary transition-colors" title="Copy"><Copy size={14}/></button>
                 <button onClick={downloadTxt} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-text-secondary transition-colors" title="Download .txt"><Download size={14}/></button>
                 <button onClick={saveToNotes} className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-text-secondary transition-colors" title="Save to Notes"><Save size={14}/></button>
              </div>
            )}
          </div>

          <div className="flex-1 bg-white rounded-xl shadow-card border border-border-default overflow-y-auto p-6 relative">
             {!isGenerating && !summary && (
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50 text-center">
                   <Sparkles size={40} className="text-border-default mb-4"/>
                   <p className="text-sm font-medium text-text-primary">Your summary will appear here</p>
                </div>
             )}

             {isGenerating && (
                <div className="space-y-4 animate-pulse pt-4">
                   <div className="h-4 bg-bg-surface rounded-full w-3/4"></div>
                   <div className="h-4 bg-bg-surface rounded-full w-full"></div>
                   <div className="h-4 bg-bg-surface rounded-full w-5/6"></div>
                   <div className="h-4 bg-bg-surface rounded-full w-2/3 mt-8"></div>
                </div>
             )}

             {summary && !isGenerating && (
                <div className="prose prose-sm max-w-none text-text-primary markdown-body break-words prose-headings:text-accent-blue prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-xs prose-headings:mt-6 prose-headings:mb-3 first:prose-headings:mt-0 whitespace-pre-wrap">
                   {/* Format bold tags roughly for display */}
                   <div dangerouslySetInnerHTML={{ __html: summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                </div>
             )}
          </div>
       </div>

       {toast && (
        <div className="fixed bottom-4 right-4 bg-text-primary text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-elevated z-50 animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
       )}

    </div>
  );
}
