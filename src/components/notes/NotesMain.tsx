import { useState, useEffect, useRef } from 'react';
import { UploadCloud, Link as LinkIcon, Type, FileText, X, MoreVertical, Trash2, Zap, Layers, HelpCircle } from 'lucide-react';
import Button from '../ui/Button';
import type { SavedNote } from './types';
import type { NotesSubView } from './NotesHub';
import { motion } from 'framer-motion';

interface NotesMainProps {
  onOpenTool: (tool: NotesSubView, note: SavedNote) => void;
}

type TabType = 'files' | 'url' | 'text';

export default function NotesMain({ onOpenTool }: NotesMainProps) {
  const [activeTab, setActiveTab] = useState<TabType>('files');
  const [notes, setNotes] = useState<SavedNote[]>([]);
  
  // Upload States
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('edumind_notes');
    if (stored) {
      try {
        setNotes(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse notes');
      }
    }
  }, []);

  const saveNotesToStorage = (updatedNotes: SavedNote[]) => {
    localStorage.setItem('edumind_notes', JSON.stringify(updatedNotes));
    setNotes(updatedNotes);
  };

  const handleSave = async () => {
    if (activeTab === 'files' && !selectedFile) return;
    if (activeTab === 'url' && !urlInput.trim()) return;
    if (activeTab === 'text' && !textInput.trim()) return;

    let content = '';
    let name = '';
    let size = 0;

    if (activeTab === 'text') {
      content = textInput;
      name = 'Text Note - ' + new Date().toLocaleDateString();
      size = textInput.length; 
    } else if (activeTab === 'url') {
      content = urlInput;
      name = urlInput;
      size = urlInput.length;
    } else if (activeTab === 'files' && selectedFile) {
      name = selectedFile.name;
      size = selectedFile.size;
      // In a real app we'd parse PDF/DOCX on a backend. For this demo, we read it as text.
      try {
        content = await selectedFile.text();
      } catch (e) {
        content = 'File content placeholder';
      }
    }

    const newNote: SavedNote = {
      id: crypto.randomUUID(),
      name,
      type: activeTab,
      content,
      timestamp: new Date().toISOString(),
      size
    };

    saveNotesToStorage([newNote, ...notes]);
    
    // Reset
    setTextInput('');
    setUrlInput('');
    setSelectedFile(null);
  };

  const deleteNote = (id: string) => {
    saveNotesToStorage(notes.filter(n => n.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col gap-10">
      
      {/* Upload Section */}
      <section className="bg-white rounded-xl shadow-card border border-border-subtle overflow-hidden">
        <div className="flex border-b border-border-subtle bg-bg-surface">
          <button 
            onClick={() => setActiveTab('files')}
            className={`flex-1 flex justify-center items-center gap-2 py-3 text-sm font-semibold transition-colors ${activeTab === 'files' ? 'bg-white text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <UploadCloud size={16} /> Upload Files
          </button>
          <button 
            onClick={() => setActiveTab('url')}
            className={`flex-1 flex justify-center items-center gap-2 py-3 text-sm font-semibold transition-colors ${activeTab === 'url' ? 'bg-white text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <LinkIcon size={16} /> Add URL
          </button>
          <button 
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex justify-center items-center gap-2 py-3 text-sm font-semibold transition-colors ${activeTab === 'text' ? 'bg-white text-accent-blue border-b-2 border-accent-blue' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Type size={16} /> Write Text
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'files' && (
            <div className="border-2 border-dashed border-border-default rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.jpg,.png,.docx"
                onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
              />
              {!selectedFile ? (
                 <>
                  <UploadCloud size={40} className="text-text-tertiary mb-3" />
                  <p className="text-sm text-text-primary font-medium mb-1">Drag and drop files here</p>
                  <p className="text-xs text-text-secondary mb-4">Accepts: PDF, JPG, PNG, DOCX</p>
                  <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
                 </>
              ) : (
                <div className="flex items-center gap-3 bg-bg-surface p-3 rounded-lg border border-border-default w-full max-w-sm">
                  <FileText size={20} className="text-accent-blue pl-1 shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-text-primary truncate">{selectedFile.name}</div>
                    <div className="text-xs text-text-secondary">{formatSize(selectedFile.size)}</div>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-white rounded-md text-text-secondary"><X size={16}/></button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
             <div className="flex flex-col gap-3">
               <label className="text-sm font-medium text-text-primary">Source URL</label>
               <div className="flex gap-3">
                 <input 
                   type="url" 
                   value={urlInput}
                   onChange={e => setUrlInput(e.target.value)}
                   placeholder="https://example.com/article" 
                   className="flex-1 h-10 px-3 rounded-lg border border-border-default text-sm focus:outline-none focus:border-accent-blue"
                 />
                 <Button variant="ghost" className="h-10 px-6">Fetch</Button>
               </div>
             </div>
          )}

          {activeTab === 'text' && (
            <div className="flex flex-col gap-2">
              <textarea 
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="Paste or type your notes here..."
                className="w-full min-h-[160px] p-4 rounded-lg border border-border-default text-sm resize-y focus:outline-none focus:border-accent-blue text-text-primary"
              />
              <div className="text-xs text-text-tertiary text-right font-medium">
                {textInput.split(/\\s+/).filter(w => w.length > 0).length} words
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-border-subtle pt-6">
            <Button 
               onClick={handleSave} 
               className="w-full h-11 text-base shadow-sm"
               id="save-note-btn"
            >
              Save Note
            </Button>
          </div>
        </div>
      </section>

      {/* Saved Notes List */}
      <section>
        <h2 className="text-lg font-bold text-text-primary mb-4">Saved Notes</h2>
        
        {notes.length === 0 ? (
           <div className="py-12 flex flex-col items-center justify-center text-center border border-border-default border-dashed rounded-xl bg-white/50">
             <div className="w-16 h-16 bg-bg-surface rounded-full flex items-center justify-center mb-4">
               <FileText size={24} className="text-text-tertiary" />
             </div>
             <p className="text-sm font-medium text-text-primary mb-1">No notes saved yet.</p>
             <p className="text-xs text-text-secondary">Upload one above to get started.</p>
           </div>
        ) : (
           <div className="grid grid-cols-1 gap-3">
             {notes.map(note => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={note.id} 
                  className="bg-white rounded-lg shadow-card border border-border-subtle p-4 flex items-center gap-4 group hover:shadow-elevated transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText size={20} className="text-accent-blue" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-text-primary truncate mb-0.5">{note.name}</h4>
                    <div className="text-xs text-text-secondary flex gap-2">
                       <span>{new Date(note.timestamp).toLocaleDateString()}</span>
                       <span>•</span>
                       <span>{note.type === 'text' ? `${note.size} words` : formatSize(note.size)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => onOpenTool('summarizer', note)} className="h-8 py-0 px-3 text-xs hidden sm:flex">
                      <Zap size={12} /> Summarize
                    </Button>
                    <Button variant="ghost" onClick={() => onOpenTool('flashcards', note)} className="h-8 py-0 px-3 text-xs hidden sm:flex">
                      <Layers size={12} /> Flashcards
                    </Button>
                    <Button variant="ghost" onClick={() => onOpenTool('quiz', note)} className="h-8 py-0 px-3 text-xs hidden sm:flex">
                      <HelpCircle size={12} /> Quiz
                    </Button>

                    <div className="relative group/dropdown ml-1">
                       <button className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:bg-bg-surface hover:text-text-primary">
                         <MoreVertical size={16} />
                       </button>
                       <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-border-default rounded-lg shadow-elevated opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all z-20 overflow-hidden">
                          <button onClick={() => onOpenTool('summarizer', note)} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-bg-surface sm:hidden">Summarize</button>
                          <button onClick={() => onOpenTool('flashcards', note)} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-bg-surface sm:hidden">Flashcards</button>
                          <button onClick={() => onOpenTool('quiz', note)} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-bg-surface sm:hidden">Quiz</button>
                          <button onClick={() => deleteNote(note.id)} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-accent-red hover:bg-red-50 flex items-center gap-2">
                            <Trash2 size={12}/> Delete
                          </button>
                       </div>
                    </div>
                  </div>
                </motion.div>
             ))}
           </div>
        )}
      </section>

    </div>
  );
}
