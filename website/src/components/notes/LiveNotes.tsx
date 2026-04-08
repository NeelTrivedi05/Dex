import { useEffect, useMemo, useState } from 'react';
import { FilePenLine, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { useUIStore } from '../../store/uiStore';

const LIVE_NOTES_KEY = 'dex_live_notes';

interface LiveNotePayload {
  content: string;
  updatedAt: string;
}

const readLiveNotes = (): LiveNotePayload => {
  try {
    const raw = localStorage.getItem(LIVE_NOTES_KEY);
    if (!raw) return { content: '', updatedAt: '' };
    const parsed = JSON.parse(raw) as Partial<LiveNotePayload>;
    return {
      content: typeof parsed.content === 'string' ? parsed.content : '',
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return { content: '', updatedAt: '' };
  }
};

export default function LiveNotes() {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [content, setContent] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  useEffect(() => {
    const saved = readLiveNotes();
    setContent(saved.content);
    setUpdatedAt(saved.updatedAt);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const payload: LiveNotePayload = {
        content,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(LIVE_NOTES_KEY, JSON.stringify(payload));
      setUpdatedAt(payload.updatedAt);
    }, 250);

    return () => window.clearTimeout(handle);
  }, [content]);

  const wordCount = useMemo(() => {
    const trimmed = content.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [content]);

  const clearNotes = () => {
    setContent('');
    setUpdatedAt('');
    localStorage.removeItem(LIVE_NOTES_KEY);
  };

  return (
    <div className={clsx('w-full h-full overflow-y-auto p-8', isDark ? 'bg-black' : 'bg-gradient-to-br from-[#F7FCFF] to-[#EDF8F2]')}>
      <div className="max-w-5xl mx-auto flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-[#00BCD4]">Live Notes</h1>
          <p className="text-sm text-text-secondary">Write your own notes quickly during exam mode.</p>
        </div>

        <div className={clsx('rounded-2xl border p-4 flex items-center justify-between', isDark ? 'bg-black/40 border-white/10' : 'bg-white border-border-default shadow-card')}>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <FilePenLine size={16} />
            <span>{wordCount} words</span>
            {updatedAt && <span>• Saved {new Date(updatedAt).toLocaleTimeString()}</span>}
          </div>
          <button
            onClick={clearNotes}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border-default text-text-secondary hover:text-accent-red hover:border-red-200"
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>

        <div className={clsx('rounded-2xl border p-4', isDark ? 'bg-black/40 border-white/10' : 'bg-white border-border-default shadow-card')}>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Start writing your live notes..."
            className={clsx(
              'w-full min-h-[520px] resize-y rounded-xl border px-4 py-3 text-sm leading-6 outline-none',
              isDark
                ? 'bg-black/30 border-white/15 text-white placeholder:text-gray-500 focus:border-[#00BCD4]'
                : 'bg-[#FAFDFF] border-border-default text-text-primary placeholder:text-text-tertiary focus:border-[#00BCD4]'
            )}
          />
        </div>
      </div>
    </div>
  );
}
