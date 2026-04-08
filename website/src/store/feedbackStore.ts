import { create } from 'zustand';

export interface FeedbackThread {
  id: string;
  status: 'in_review' | 'discussion' | 'completed';
  refId: string;
  timeAgo: string;
  title: string;
  preview: string;
  commentCount: number;
  viewCount: number;
  avatars: string[];
  extraAvatars?: number;
}

const SEED_THREADS: FeedbackThread[] = [
  {
    id: '1',
    status: 'in_review',
    refId: 'CUR-204',
    timeAgo: '2h ago',
    title: 'Neural Network Architectures for Semantic Analysis',
    preview:
      'Discussing the implementation of transformer layers in the context of long-form academic citations and cross-reference mapping...',
    commentCount: 14,
    viewCount: 284,
    avatars: ['EV', 'MT'],
    extraAvatars: 3,
  },
  {
    id: '2',
    status: 'discussion',
    refId: 'CUR-201',
    timeAgo: '5h ago',
    title: 'Ontological Mapping in Digital Archives',
    preview:
      'Exploring the challenges of non-linear metadata structures in historical text digitization projects across European institutions.',
    commentCount: 8,
    viewCount: 142,
    avatars: ['SJ', 'AR'],
  },
  {
    id: '3',
    status: 'completed',
    refId: 'CUR-198',
    timeAgo: 'Yesterday',
    title: 'Quantum Computing Ethics Framework',
    preview:
      'Finalized consensus on the ethical implications of post-quantum cryptography in sovereign research environments.',
    commentCount: 32,
    viewCount: 512,
    avatars: ['DR'],
  },
];

interface FeedbackState {
  threads: FeedbackThread[];
}

export const useFeedbackStore = create<FeedbackState>(() => ({
  threads: SEED_THREADS,
}));
