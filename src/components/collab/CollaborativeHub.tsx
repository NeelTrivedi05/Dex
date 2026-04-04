import { useMemo, useState } from 'react';
import { MessageSquare, Users, Send } from 'lucide-react';
import Button from '../ui/Button';

interface Reply {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

interface Post {
  id: string;
  author: string;
  message: string;
  createdAt: string;
  replies: Reply[];
}

const POSTS_KEY = 'dex_collab_posts';

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `collab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const readPosts = (): Post[] => {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writePosts = (posts: Post[]) => {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
};

export default function CollaborativeHub() {
  const [posts, setPosts] = useState<Post[]>(() => readPosts());
  const [newMessage, setNewMessage] = useState('');
  const [replyByPost, setReplyByPost] = useState<Record<string, string>>({});

  const activeMembers = useMemo(() => ['Alex', 'Evelyn', 'Sam', 'Riya', 'Marcus'], []);

  const addPost = () => {
    const value = newMessage.trim();
    if (!value) return;

    const next: Post[] = [
      {
        id: createId(),
        author: 'You',
        message: value,
        createdAt: new Date().toISOString(),
        replies: [],
      },
      ...posts,
    ];

    setPosts(next);
    writePosts(next);
    setNewMessage('');
  };

  const addReply = (postId: string) => {
    const value = (replyByPost[postId] || '').trim();
    if (!value) return;

    const next = posts.map((post) => {
      if (post.id !== postId) return post;
      return {
        ...post,
        replies: [
          ...post.replies,
          {
            id: createId(),
            author: 'You',
            message: value,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });

    setPosts(next);
    writePosts(next);
    setReplyByPost((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="h-full overflow-y-auto bg-bg-surface p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-card p-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Collaborative Hub</h1>
            <p className="text-sm text-text-secondary mt-1">Share updates, discuss tasks, and coordinate with collaborators.</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-accent-green bg-green-50 px-3 py-1.5 rounded-full">
            <Users size={14} />
            {activeMembers.length} Active
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
          <section className="bg-white rounded-2xl shadow-card p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <MessageSquare size={16} /> Team Feed
            </div>

            <div className="flex gap-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Share an update with your team..."
                className="flex-1 min-h-20 resize-none px-4 py-3 bg-bg-surface border border-border-default rounded-xl text-sm outline-none focus:border-accent-blue"
              />
              <Button onClick={addPost} className="self-end">
                <Send size={14} className="mr-2" />
                Post
              </Button>
            </div>

            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="text-sm text-text-secondary py-6 text-center">No collaboration posts yet. Start the conversation.</div>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="border border-border-subtle rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-text-primary">{post.author}</div>
                      <div className="text-xs text-text-tertiary">{new Date(post.createdAt).toLocaleString()}</div>
                    </div>
                    <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{post.message}</p>

                    <div className="mt-3 space-y-2">
                      {post.replies.map((reply) => (
                        <div key={reply.id} className="bg-bg-surface rounded-lg p-3">
                          <div className="text-xs font-semibold text-text-primary">{reply.author}</div>
                          <p className="text-sm text-text-secondary mt-1">{reply.message}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        value={replyByPost[post.id] || ''}
                        onChange={(e) => setReplyByPost((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Reply to this post..."
                        className="flex-1 h-10 px-3 bg-bg-surface border border-border-default rounded-lg text-sm outline-none focus:border-accent-blue"
                      />
                      <Button variant="ghost" onClick={() => addReply(post.id)}>
                        Reply
                      </Button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>

          <aside className="bg-white rounded-2xl shadow-card p-6 h-fit">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Active Collaborators</h2>
            <div className="space-y-2">
              {activeMembers.map((member, index) => (
                <div key={member} className="flex items-center justify-between px-3 py-2 rounded-lg bg-bg-surface">
                  <span className="text-sm text-text-primary">{member}</span>
                  <span className={`w-2 h-2 rounded-full ${index % 2 === 0 ? 'bg-accent-green' : 'bg-accent-blue'}`} />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
