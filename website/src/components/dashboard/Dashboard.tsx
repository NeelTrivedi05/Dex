import { Search, Bell, Settings, LogIn, LogOut } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { getUserInitials } from '../../lib/userDisplay';
import MetricsRow from './MetricsRow';
import TaskGravityList from './TaskGravityList';
import SubjectHealthCard from './SubjectHealthCard';

export default function Dashboard() {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const setView = useUIStore((s) => s.setView);
  const notifications = useUIStore((s) => s.notifications);
  const notificationsOpen = useUIStore((s) => s.notificationsOpen);
  const unreadNotifications = useUIStore((s) => s.unreadNotifications);
  const toggleNotificationsPanel = useUIStore((s) => s.toggleNotificationsPanel);
  const closeNotificationsPanel = useUIStore((s) => s.closeNotificationsPanel);
  const markAllNotificationsRead = useUIStore((s) => s.markAllNotificationsRead);
  const uiMode = useUIStore((s) => s.uiMode);
  const toggleUIMode = useUIStore((s) => s.toggleUIMode);
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const userInitials = currentUser ? getUserInitials(currentUser.name) : 'U';

  return (
    <div className="p-8 pb-12 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-text-primary">Dex</div>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            readOnly
            onClick={toggleCommandPalette}
            placeholder="Search knowledge base... ⌘K"
            className="w-80 h-10 pl-9 pr-4 rounded-xl bg-white shadow-card text-sm text-text-primary placeholder-text-tertiary border-none outline-none cursor-pointer focus:ring-2 focus:ring-accent-blue/20 transition-shadow"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleUIMode}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity text-white hover:opacity-90 ${
              uiMode === 'exam' ? 'bg-[#D94A38]' : 'bg-accent-blue'
            }`}
          >
            {uiMode === 'exam' ? 'Exit Exam Mode' : 'Enter Exam Mode'}
          </button>
          {!currentUser ? (
            <button
              onClick={() => setView('auth')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-border-default text-text-primary hover:bg-white transition-colors"
            >
              <LogIn size={13} />
              Login
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border border-border-default bg-white shadow-card">
              <div className="w-6 h-6 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center text-[10px] font-bold shrink-0">
                {userInitials}
              </div>
              <div className="text-xs font-semibold text-text-primary max-w-[120px] truncate" title={currentUser.name}>
                {currentUser.name}
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-text-secondary hover:text-text-primary hover:bg-bg-surface transition-colors"
                aria-label="Logout"
              >
                <LogOut size={12} />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          )}
          <div className="relative">
            <button
              onClick={toggleNotificationsPanel}
              className="text-text-tertiary hover:text-text-primary transition-colors relative"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent-red rounded-full border border-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-8 w-80 max-w-[80vw] bg-white border border-border-default rounded-xl shadow-modal z-30">
                <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
                  <div className="text-sm font-semibold text-text-primary">Notifications</div>
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs font-semibold text-accent-blue hover:opacity-80"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-5 text-sm text-text-secondary">No notifications yet.</div>
                  ) : (
                    notifications.slice(0, 8).map((entry) => (
                      <div key={entry.id} className="px-4 py-3 border-b border-border-subtle last:border-b-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-text-primary leading-snug">{entry.title}</p>
                          {!entry.read && <span className="w-2 h-2 rounded-full bg-accent-red mt-1 shrink-0" />}
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{entry.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={closeNotificationsPanel}
                  className="w-full text-xs font-semibold text-text-secondary hover:text-text-primary px-4 py-2 border-t border-border-subtle"
                >
                  Close
                </button>
              </div>
            )}
          </div>
           <button onClick={() => setView('settings')} className="text-text-tertiary hover:text-text-primary transition-colors">
             <Settings size={18} />
          </button>
        </div>
      </div>

      <MetricsRow />
      <TaskGravityList />
      <SubjectHealthCard />

      {/* Bottom Grid */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {/* Quick Insight */}
        <div 
          className="rounded-lg p-5 flex flex-col justify-between"
          style={{ backgroundImage: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)' }}
        >
           <div>
             <div className="text-2xs font-semibold text-white/50 uppercase tracking-widest mb-3">Quick Insight</div>
             <p className="text-xl font-bold text-white leading-tight pr-8">
               Your peak focus hours have shifted to 7:00 AM - 10:00 AM this week.
             </p>
           </div>
           <div className="mt-8">
             <button className="text-sm font-semibold text-accent-blue hover:text-white transition-colors flex items-center gap-1">
               Optimize Schedule <span>→</span>
             </button>
           </div>
        </div>

        {/* Research Trends */}
        <div className="bg-white rounded-lg shadow-card p-5">
           <div className="text-2xs font-semibold text-text-tertiary uppercase tracking-widest mb-4">Research Trends</div>
           <div className="space-y-4">
             {[
               { label: 'Neuro-ethics', val: '▲ 24%', color: 'text-accent-green' },
               { label: 'AI-assisted pedagogy', val: '▲ 18%', color: 'text-accent-green' },
               { label: 'Quantum Cognition', val: '▼ 2%', color: 'text-text-tertiary' },
             ].map((t) => (
                <div key={t.label} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-text-primary">{t.label}</span>
                  <span className={`text-sm font-semibold ${t.color}`}>{t.val}</span>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
