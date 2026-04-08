import { useUIStore } from '../../store/uiStore';
import { Zap } from 'lucide-react';
import Button from '../ui/Button';

export default function ContextPanel() {
  const activeView = useUIStore((s) => s.activeView);

  return (
    <aside className="h-full bg-white border-l border-border-subtle overflow-y-auto px-5 py-6">
      {activeView === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* FOCUS NOW */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-accent-blue" />
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest leading-none">Focus Now</h3>
            </div>
            <div className="bg-bg-surface rounded-lg p-4">
              <p className="text-sm text-text-secondary italic mb-4 leading-relaxed">
                "Synthesize the literature review. You have the most cognitive energy right now."
              </p>
              <div className="flex gap-2">
                <Button className="flex-1">Start Session</Button>
                <Button variant="ghost" className="flex-1">Snooze</Button>
              </div>
            </div>
          </section>

          {/* RECENT FEEDBACK */}
          <section>
            <h3 className="text-2xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">Recent Feedback</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-border-default/40 flex items-center justify-center shrink-0 overflow-hidden">
                  <span className="text-xs font-semibold text-text-secondary">EV</span>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-sm font-semibold text-text-primary">Dr. Elena Volkov</span>
                    <span className="text-2xs text-text-tertiary">2h ago</span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                    The methodology section needs more rigor on participant selection bias.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex flex-col items-center justify-center shrink-0 overflow-hidden text-accent-blue">
                  <span className="text-xs font-bold leading-none">D</span>
                  <span className="text-[8px] leading-none">ex</span>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-sm font-semibold text-text-primary">Dex AI Curator</span>
                    <span className="text-2xs text-text-tertiary">Yesterday</span>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                    Identified 3 conflicting citations in your Research folder.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* UPCOMING DEADLINES */}
          <section>
            <h3 className="text-2xs font-semibold text-text-tertiary uppercase tracking-widest mb-3">Upcoming Deadlines</h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-accent-red mt-1.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-text-primary leading-tight">Draft Submission</div>
                  <div className="text-xs text-text-tertiary mt-0.5">Oct 14 • Academic Journal</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-accent-blue mt-1.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-text-primary leading-tight">Group Symposium</div>
                  <div className="text-xs text-text-tertiary mt-0.5">Oct 18 • Virtual</div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-2 h-2 rounded-full bg-text-tertiary mt-1.5 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-text-primary leading-tight">Resource Archiving</div>
                  <div className="text-xs text-text-tertiary mt-0.5">Oct 22 • Quarterly Task</div>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Hint */}
          <div className="mt-auto pt-8 flex justify-center">
            <span className="text-2xs text-text-tertiary inline-flex items-center gap-1.5">
              Shortcut: Press <kbd className="bg-bg-surface px-1 py-0.5 rounded border border-border-default font-mono">G</kbd> then <kbd className="bg-bg-surface px-1 py-0.5 rounded border border-border-default font-mono">T</kbd> to jump to
            </span>
          </div>
        </div>
      )}

      {activeView === 'research' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-white rounded-lg shadow-card border border-border-default/50 p-4 relative overflow-hidden">
             <div className="text-sm font-semibold mb-1">Concept Map</div>
             <div className="text-2xs text-text-tertiary mb-3">Last updated 4 min ago</div>
             
             <div 
               className="h-32 rounded-md mb-2 overflow-hidden bg-cover bg-center"
               style={{ backgroundImage: 'linear-gradient(135deg, #111827 0%, #1e1b4b 100%)', position: 'relative' }}
             >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent-blue/40 via-transparent to-transparent opacity-60"></div>
                {/* Simulated network nodes */}
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                <div className="absolute top-1/2 left-2/3 w-3 h-3 bg-accent-blue rounded-full shadow-[0_0_12px_rgba(0,122,255,0.8)]"></div>
                <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-accent-red rounded-full shadow-[0_0_6px_rgba(255,59,48,0.8)]"></div>
                {/* Connections */}
                <svg className="absolute inset-0 w-full h-full stroke-white/20 stroke-[1.5]">
                   <line x1="25%" y1="25%" x2="66%" y2="50%" />
                   <line x1="66%" y1="50%" x2="75%" y2="75%" />
                </svg>
             </div>
          </div>
        </div>
      )}

      {activeView === 'feedback' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
           {/* Pro-tip */}
           <div className="bg-gradient-to-br from-[#0062CC] to-[#004FA3] rounded-lg p-4 text-white shadow-elevated">
              <div className="text-xs font-bold tracking-widest uppercase mb-2 flex items-center gap-1.5">
                <span className="text-base">💡</span> Curator Pro-Tip
              </div>
              <div className="text-sm font-semibold mb-1 leading-snug">Leverage Cross-Links</div>
              <p className="text-xs text-white/80 leading-relaxed">
                Use <span className="bg-white/20 px-1 py-0.5 rounded text-white font-mono shrink-0">@mention</span> to link directly to research blocks within a thread to keep context tight.
              </p>
           </div>

           {/* Top Contributors */}
           <section>
              <h3 className="text-2xs font-semibold text-text-tertiary uppercase tracking-widest mb-4">Top Contributors</h3>
              <div className="space-y-4">
                 {[
                   { name: 'Dr. Elena Volkov', role: 'Neuroscience Dept', score: '342', init: 'EV', bg: 'bg-purple-100/50 text-purple-700' },
                   { name: 'Marcus Tarn', role: 'Research Assistant', score: '128', init: 'MT', bg: 'bg-blue-100/50 text-blue-700' },
                   { name: 'Sarah Jenkins', role: 'Peer Reviewer', score: '94', init: 'SJ', bg: 'bg-green-100/50 text-green-700' },
                 ].map((c) => (
                   <div key={c.name} className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm shrink-0 ${c.bg}`}>
                        {c.init}
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-sm font-semibold text-text-primary truncate">{c.name}</div>
                         <div className="text-xs text-text-tertiary truncate">{c.role}</div>
                      </div>
                      <div className="text-sm font-bold text-accent-blue">{c.score}</div>
                   </div>
                 ))}
                 <div className="pt-2">
                   <a href="#" className="text-xs font-semibold text-accent-blue hover:underline">VIEW ALL MEMBERS</a>
                 </div>
              </div>
           </section>

           {/* Hub Vitality */}
           <section>
              <h3 className="text-2xs font-semibold text-text-tertiary uppercase tracking-widest mb-4">Hub Vitality</h3>
              <div className="flex gap-3">
                 <div className="flex-1 bg-bg-surface rounded-lg p-3 border border-border-default/40">
                    <div className="text-2xl font-bold text-text-primary mb-1">124</div>
                    <div className="text-2xs text-text-secondary uppercase tracking-widest font-medium">Active Threads</div>
                 </div>
                 <div className="flex-1 bg-bg-surface rounded-lg p-3 border border-border-default/40">
                    <div className="text-2xl font-bold text-text-primary mb-1">42m</div>
                    <div className="text-2xs text-text-secondary uppercase tracking-widest font-medium">Avg Response</div>
                 </div>
              </div>
           </section>
        </div>
      )}
    </aside>
  );
}
