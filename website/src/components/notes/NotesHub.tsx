import { useState } from 'react';
import NotesMain from './NotesMain';
import AISummarizer from './AISummarizer';
import FlashcardGenerator from './FlashcardGenerator';
import QuizMaker from './QuizMaker';
import type { SavedNote } from './types';
import { useUIStore, type NotesSubView } from '../../store/uiStore';

export default function NotesHub() {
  const activeSubView = useUIStore(s => s.activeNotesSubView);
  const setNotesSubView = useUIStore(s => s.setNotesSubView);
  const [selectedNote, setSelectedNote] = useState<SavedNote | null>(null);

  // Helper to open a tool dynamically pre-filled with a note
  const openToolWithNote = (tool: NotesSubView, note: SavedNote) => {
    setSelectedNote(note);
    setNotesSubView(tool);
  };

  return (
    <div className="h-full flex flex-col overflow-auto bg-bg-surface w-full">
      <div className="px-8 pt-8 max-w-5xl mx-auto w-full flex-1 mb-12 animate-in fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display font-bold text-text-primary tracking-tight">
              {activeSubView === 'main' ? 'Notes Hub' : 
               activeSubView === 'summarizer' ? 'AI Summarizer' :
               activeSubView === 'flashcards' ? 'Flashcard Generator' : 'Quiz Maker'
              }
            </h1>
            <p className="text-base text-text-secondary mt-2 max-w-2xl leading-relaxed">
              {activeSubView === 'main' && 'Upload, manage, and supercharge your academic notes using AI tools.'}
              {activeSubView === 'summarizer' && 'Extract key concepts, structured overviews, and study paths instantly.'}
              {activeSubView === 'flashcards' && 'Generate active recall flashcard decks from any of your notes.'}
              {activeSubView === 'quiz' && 'Test your knowledge with multiple choice and true/false assessments.'}
            </p>
          </div>
        </div>

        {/* Main Content Area Routing */}
        {activeSubView === 'main' && (
          <NotesMain onOpenTool={openToolWithNote} />
        )}
        {activeSubView === 'summarizer' && (
          <AISummarizer initialNote={selectedNote} />
        )}
        {activeSubView === 'flashcards' && (
          <FlashcardGenerator initialNote={selectedNote} />
        )}
        {activeSubView === 'quiz' && (
          <QuizMaker initialNote={selectedNote} />
        )}

      </div>
    </div>
  );
}
