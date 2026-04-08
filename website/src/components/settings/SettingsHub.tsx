import { Moon, Sun, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';
import { useUIStore } from '../../store/uiStore';

export default function SettingsHub() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const runForceReset = () => {
    const approved = window.confirm('This will reset all app data and preferences. Continue?');
    if (!approved) return;

    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="w-full h-full overflow-y-auto p-8 bg-bg-surface">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-2">Control system-wide behavior and appearance.</p>
        </header>

        <section className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">Appearance</h2>
          <p className="text-sm text-text-secondary">Switch between dark and light modes instantly.</p>

          <div className="inline-flex bg-bg-surface border border-border-default rounded-xl p-1">
            <button
              onClick={() => setTheme('light')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                theme === 'light' ? 'bg-white text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Sun size={16} />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${
                theme === 'dark' ? 'bg-black text-white shadow-sm' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Moon size={16} />
              Dark
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-text-primary">System</h2>
          <p className="text-sm text-text-secondary">Force reset removes all local data, tasks, sessions, notifications, and preferences.</p>
          <Button
            variant="ghost"
            onClick={runForceReset}
            className="text-accent-red hover:text-accent-red border border-red-200 hover:bg-red-50"
          >
            <RotateCcw size={16} className="mr-2" />
            Force Reset
          </Button>
        </section>
      </div>
    </div>
  );
}
