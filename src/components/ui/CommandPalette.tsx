import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, LayoutDashboard, Users, MessageSquare, CheckSquare, Settings, PlusCircle, Download, StickyNote, FolderOpen, FilePenLine } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import clsx from 'clsx';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  section: string;
}

export default function CommandPalette() {
  const { commandPaletteOpen, closeCommandPalette, setView, toggleCommandPalette, setNotesSubView, uiMode, toggleUIMode } = useUIStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const allItems: CommandItem[] = [
    { id: 'nav-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} />, action: () => { setView('dashboard'); closeCommandPalette(); }, section: 'NAVIGATION' },
    { id: 'nav-notes', label: 'Notes', icon: <StickyNote size={15} />, action: () => { setView('notes'); setNotesSubView('main'); closeCommandPalette(); }, section: 'NAVIGATION' },
    { id: 'nav-live-notes', label: 'Live Notes', icon: <FilePenLine size={15} />, action: () => { setView('live-notes'); closeCommandPalette(); }, section: 'NAVIGATION' },
    { id: 'nav-resources', label: 'Resource Shelf', icon: <FolderOpen size={15} />, action: () => { setView('resources'); closeCommandPalette(); }, section: 'NAVIGATION' },
    { id: 'nav-research', label: 'Collaborative Hub', icon: <Users size={15} />, action: () => { setView('research'); closeCommandPalette(); }, section: 'NAVIGATION' },
    { id: 'nav-feedback', label: 'Feedback Hub', icon: <MessageSquare size={15} />, action: () => { setView('feedback'); closeCommandPalette(); }, section: 'NAVIGATION' },
    { id: 'nav-tasks', label: 'Tasks', icon: <CheckSquare size={15} />, action: () => { setView('tasks'); closeCommandPalette(); }, section: 'NAVIGATION' },
    { id: 'recent-1', label: 'Team discussion thread', icon: <Users size={15} />, action: () => { setView('research'); closeCommandPalette(); }, section: 'RECENT' },
    { id: 'recent-2', label: 'Shared project updates', icon: <Users size={15} />, action: () => { setView('research'); closeCommandPalette(); }, section: 'RECENT' },
    { id: 'action-new', label: 'Create New Entry', icon: <PlusCircle size={15} />, action: () => closeCommandPalette(), section: 'ACTIONS' },
    { id: 'action-export', label: 'Export Canvas', icon: <Download size={15} />, action: () => closeCommandPalette(), section: 'ACTIONS' },
    { id: 'action-settings', label: 'Open Settings', icon: <Settings size={15} />, action: () => { setView('settings'); closeCommandPalette(); }, section: 'ACTIONS' },
    { id: 'action-toggle-mode', label: uiMode === 'exam' ? 'Exit Exam Mode' : 'Enter Exam Mode', icon: <Settings size={15} />, action: () => { toggleUIMode(); closeCommandPalette(); }, section: 'ACTIONS' },
  ];

  const allowedInExam = new Set(['nav-notes', 'nav-live-notes', 'nav-resources', 'action-toggle-mode']);
  const hiddenInNormal = new Set(['nav-live-notes', 'nav-resources']);
  const visibleItems = uiMode === 'exam'
    ? allItems.filter((item) => allowedInExam.has(item.id))
    : allItems.filter((item) => !hiddenInNormal.has(item.id));

  const filtered = query
    ? visibleItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : visibleItems;

  const sections = Array.from(new Set(filtered.map((i) => i.section)));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (!commandPaletteOpen) return;
      if (e.key === 'Escape') closeCommandPalette();
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        filtered[selectedIndex]?.action();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, filtered, selectedIndex, toggleCommandPalette, closeCommandPalette]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) closeCommandPalette();
  };

  let itemIndex = 0;

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          ref={overlayRef}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex"
        >
          <div className="absolute top-1/5 left-1/2 -translate-x-1/2 w-full max-w-lg px-4" style={{ top: '20%' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="bg-white rounded-xl shadow-modal overflow-hidden"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle">
                <Search size={16} className="text-text-tertiary shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search commands, views, actions..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-tertiary outline-none border-none"
                />
                <span className="text-2xs text-text-tertiary bg-bg-surface px-1.5 py-0.5 rounded font-mono">⌘K</span>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-text-tertiary">No results found</div>
                ) : (
                  sections.map((section) => {
                    const sectionItems = filtered.filter((i) => i.section === section);
                    return (
                      <div key={section}>
                        <div className="px-4 py-1.5 text-2xs font-semibold tracking-widest uppercase text-text-tertiary">
                          {section}
                        </div>
                        {sectionItems.map((item) => {
                          const currentIndex = itemIndex++;
                          const isSelected = currentIndex === selectedIndex;
                          return (
                            <button
                              key={item.id}
                              onClick={item.action}
                              onMouseEnter={() => setSelectedIndex(currentIndex)}
                              className={clsx(
                                'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors duration-100 cursor-pointer',
                                isSelected
                                  ? 'bg-accent-blue text-white'
                                  : 'text-text-primary hover:bg-bg-surface'
                              )}
                            >
                              <span className={clsx('shrink-0', isSelected ? 'text-white' : 'text-text-secondary')}>
                                {item.icon}
                              </span>
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border-subtle px-4 py-2 flex items-center gap-4 text-2xs text-text-tertiary">
                <span><kbd className="font-mono">↑↓</kbd> navigate</span>
                <span><kbd className="font-mono">↵</kbd> select</span>
                <span><kbd className="font-mono">Esc</kbd> close</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
