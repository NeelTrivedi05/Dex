export interface SavedNote {
  id: string;
  name: string;
  type: string; // 'file', 'url', 'text'
  content: string; // URL, purely text string, or file blob reference (we'll just use string text representations for now)
  timestamp: string;
  size: number; // or word count
}

export interface QuizHistoryEntry {
  id: string;
  date: string;
  score: number;
  topic: string;
  totalQ: number;
}
