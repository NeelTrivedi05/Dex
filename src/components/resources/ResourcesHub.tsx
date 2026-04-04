import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Search, Trash2, Link2 } from 'lucide-react';
import clsx from 'clsx';
import { DEXAI_KEYS, readDexaiJson, writeDexaiJson } from '../../lib/dexaiStorage';
import { useUIStore } from '../../store/uiStore';

interface StudyResource {
  id: string;
  title: string;
  subject: string;
  type: 'Video' | 'Article' | 'Book' | 'Notes' | 'Past Paper' | 'Tool';
  url: string;
  description: string;
  createdAt: string;
}

const DEFAULT_SUBJECTS = [
  'General',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History',
  'Economics',
];

const RESOURCE_TYPES: StudyResource['type'][] = ['Video', 'Article', 'Book', 'Notes', 'Past Paper', 'Tool'];

const createResourceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `resource-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeResource = (input: Partial<StudyResource>): StudyResource => ({
  id: input.id || createResourceId(),
  title: input.title || 'Untitled Resource',
  subject: input.subject || 'General',
  type: input.type || 'Article',
  url: input.url || '',
  description: input.description || '',
  createdAt: input.createdAt || new Date().toISOString(),
});

export default function ResourcesHub() {
  const theme = useUIStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [resources, setResources] = useState<StudyResource[]>([]);
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS);
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All Subjects');

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('General');
  const [type, setType] = useState<StudyResource['type']>('Article');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const storedResources = readDexaiJson<Partial<StudyResource>[]>(DEXAI_KEYS.RESOURCES, []);
    if (storedResources.length > 0) {
      setResources(storedResources.map(normalizeResource));
    }

    const storedSubjects = readDexaiJson<Array<{ name?: string }>>(DEXAI_KEYS.SUBJECTS, []);
    if (storedSubjects.length > 0) {
      const merged = [...DEFAULT_SUBJECTS, ...storedSubjects.map((s) => s.name || '').filter(Boolean)];
      setSubjects(Array.from(new Set(merged)));
    }
  }, []);

  const persistResources = (next: StudyResource[]) => {
    setResources(next);
    writeDexaiJson(DEXAI_KEYS.RESOURCES, next);
    window.dispatchEvent(new Event('dex_resources_update'));
  };

  const handleAddResource = () => {
    if (!title.trim()) return;

    const next: StudyResource = {
      id: createResourceId(),
      title: title.trim(),
      subject,
      type,
      url: url.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };

    persistResources([next, ...resources]);
    setTitle('');
    setSubject('General');
    setType('Article');
    setUrl('');
    setDescription('');
  };

  const handleDelete = (id: string) => {
    persistResources(resources.filter((entry) => entry.id !== id));
  };

  const filteredResources = useMemo(() => {
    return resources.filter((entry) => {
      const subjectMatch = subjectFilter === 'All Subjects' || entry.subject === subjectFilter;
      const term = query.trim().toLowerCase();
      if (!term) return subjectMatch;

      return (
        subjectMatch &&
        (entry.title.toLowerCase().includes(term) ||
          entry.description.toLowerCase().includes(term) ||
          entry.subject.toLowerCase().includes(term) ||
          entry.type.toLowerCase().includes(term))
      );
    });
  }, [query, resources, subjectFilter]);

  const groupedResources = useMemo(() => {
    const groups = new Map<string, StudyResource[]>();
    filteredResources.forEach((entry) => {
      const existing = groups.get(entry.subject) || [];
      existing.push(entry);
      groups.set(entry.subject, existing);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredResources]);

  return (
    <div className={clsx('w-full h-full overflow-y-auto p-8', isDark ? 'bg-black' : 'bg-gradient-to-br from-[#F5FBFF] to-[#EEF7F3]')}>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-[#00BCD4]">Resource Shelf</h1>
          <p className="text-sm text-text-secondary">Keep every subject resource in one organized place.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
          <section className={clsx('rounded-2xl border p-5', isDark ? 'bg-black/40 border-white/10' : 'bg-white border-border-default shadow-card')}>
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between mb-4">
              <div className="relative w-full lg:max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search resources"
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-border-default bg-bg-surface text-sm outline-none focus:border-[#00BCD4]"
                />
              </div>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="h-10 rounded-xl border border-border-default bg-bg-surface px-3 text-sm outline-none focus:border-[#00BCD4]"
              >
                <option value="All Subjects">All Subjects</option>
                {subjects.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>

            {groupedResources.length === 0 ? (
              <div className={clsx('rounded-xl border border-dashed p-10 text-center', isDark ? 'border-white/15 text-gray-400' : 'border-border-default text-text-tertiary')}>
                <BookOpen size={24} className="mx-auto mb-3" />
                <p className="text-sm font-medium">No resources found.</p>
                <p className="text-xs mt-1">Add your first resource using the panel on the right.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {groupedResources.map(([subjectName, items]) => (
                  <div key={subjectName} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-text-primary">{subjectName}</h3>
                      <span className="text-xs text-text-tertiary">{items.length} item{items.length === 1 ? '' : 's'}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((entry) => (
                        <article
                          key={entry.id}
                          className={clsx(
                            'rounded-xl border p-3 flex flex-col gap-2',
                            isDark ? 'bg-white/5 border-white/10' : 'bg-[#FAFDFF] border-border-default'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold text-text-primary leading-snug">{entry.title}</h4>
                              <p className="text-xs text-text-tertiary mt-1">{entry.type}</p>
                            </div>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1 rounded-md text-text-tertiary hover:text-accent-red hover:bg-red-50"
                              aria-label="Delete resource"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {entry.description && <p className="text-xs text-text-secondary leading-relaxed">{entry.description}</p>}

                          {entry.url && (
                            <a
                              href={entry.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-blue hover:opacity-80"
                            >
                              <Link2 size={12} /> Open Resource
                            </a>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className={clsx('rounded-2xl border p-5 h-fit', isDark ? 'bg-black/40 border-white/10' : 'bg-white border-border-default shadow-card')}>
            <h2 className="text-lg font-semibold text-[#00BCD4] mb-4">Add Resource</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Resource name"
                  className="w-full h-10 px-3 rounded-xl border border-border-default bg-bg-surface text-sm outline-none focus:border-[#00BCD4]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-border-default bg-bg-surface text-sm outline-none focus:border-[#00BCD4]"
                  >
                    {subjects.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as StudyResource['type'])}
                    className="w-full h-10 px-3 rounded-xl border border-border-default bg-bg-surface text-sm outline-none focus:border-[#00BCD4]"
                  >
                    {RESOURCE_TYPES.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">URL (Optional)</label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                  className="w-full h-10 px-3 rounded-xl border border-border-default bg-bg-surface text-sm outline-none focus:border-[#00BCD4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Notes (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Why this resource matters"
                  className="w-full h-24 px-3 py-2 rounded-xl border border-border-default bg-bg-surface text-sm outline-none resize-none focus:border-[#00BCD4]"
                />
              </div>

              <button
                onClick={handleAddResource}
                className="w-full h-10 rounded-xl bg-[#00BCD4] text-white text-sm font-semibold hover:bg-[#00a6bc] transition-colors inline-flex items-center justify-center gap-2"
              >
                <Plus size={15} /> Add Resource
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
