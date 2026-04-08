import { useState } from 'react';
import { LockKeyhole, Mail, UserRound } from 'lucide-react';
import Button from '../ui/Button';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { MOCK_LOGIN_CREDENTIALS } from '../../lib/authStorage';

type AuthMode = 'login' | 'signup';

type Notice = {
  tone: 'success' | 'error';
  text: string;
};

export default function AuthHub() {
  const setView = useUIStore((s) => s.setView);
  const currentUser = useAuthStore((s) => s.currentUser);
  const login = useAuthStore((s) => s.login);
  const signup = useAuthStore((s) => s.signup);
  const logout = useAuthStore((s) => s.logout);

  const [mode, setMode] = useState<AuthMode>('login');
  const [notice, setNotice] = useState<Notice | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setNotice(null);
  };

  const handleLoginSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = login(loginEmail, loginPassword);
    setNotice({ tone: result.success ? 'success' : 'error', text: result.message });

    if (result.success) {
      setLoginPassword('');
      setView('dashboard');
    }
  };

  const handleSignupSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = signup(signupName, signupEmail, signupPassword);
    setNotice({ tone: result.success ? 'success' : 'error', text: result.message });

    if (result.success) {
      setSignupPassword('');
      setView('dashboard');
    }
  };

  return (
    <div className="min-h-full p-6 md:p-10">
      <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="rounded-2xl bg-gradient-to-br from-[#10203A] via-[#122F59] to-[#2C4B74] p-7 text-white shadow-elevated">
          <p className="text-2xs font-semibold uppercase tracking-[0.25em] text-white/60">Dex Access</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight">
            Login or create an account to manage your personalized dashboard.
          </h1>
          <p className="mt-4 text-sm text-white/80 leading-relaxed">
            This flow uses a local mock database. A pre-created account is available so you can test instantly.
          </p>

          <div className="mt-6 rounded-xl bg-white/10 border border-white/15 p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/70">Mock account</div>
            <div className="mt-2 text-sm font-medium text-white/95">Email: {MOCK_LOGIN_CREDENTIALS.email}</div>
            <div className="mt-1 text-sm font-medium text-white/95">Password: {MOCK_LOGIN_CREDENTIALS.password}</div>
          </div>

          <button
            onClick={() => setView('dashboard')}
            className="mt-6 text-sm font-semibold text-white/90 hover:text-white"
          >
            Back to workspace
          </button>
        </section>

        <section className="rounded-2xl bg-white shadow-card border border-border-subtle p-6 md:p-7">
          {currentUser ? (
            <div className="space-y-5">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-widest text-text-tertiary">Active session</p>
                <h2 className="mt-2 text-2xl font-bold text-text-primary">You are logged in</h2>
                <p className="mt-2 text-sm text-text-secondary">Signed in as {currentUser.email}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => setView('dashboard')}>Continue to Dashboard</Button>
                <Button variant="ghost" onClick={logout}>Logout</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="inline-flex rounded-xl bg-bg-surface p-1 mb-5">
                <button
                  onClick={() => switchMode('login')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    mode === 'login'
                      ? 'bg-white text-text-primary shadow-card'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => switchMode('signup')}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    mode === 'signup'
                      ? 'bg-white text-text-primary shadow-card'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {notice && (
                <div
                  className={`mb-4 rounded-lg px-3 py-2 text-sm font-medium ${
                    notice.tone === 'success'
                      ? 'bg-accent-green/15 text-accent-green'
                      : 'bg-accent-red/15 text-accent-red'
                  }`}
                >
                  {notice.text}
                </div>
              )}

              {mode === 'login' ? (
                <form className="space-y-3" onSubmit={handleLoginSubmit}>
                  <label className="block">
                    <span className="text-xs font-semibold text-text-secondary">Email</span>
                    <div className="mt-1 relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input
                        value={loginEmail}
                        onChange={(event) => setLoginEmail(event.target.value)}
                        type="email"
                        placeholder="you@example.com"
                        className="w-full h-10 rounded-lg border border-border-default pl-9 pr-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent-blue/20"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-text-secondary">Password</span>
                    <div className="mt-1 relative">
                      <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input
                        value={loginPassword}
                        onChange={(event) => setLoginPassword(event.target.value)}
                        type="password"
                        placeholder="Enter your password"
                        className="w-full h-10 rounded-lg border border-border-default pl-9 pr-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent-blue/20"
                      />
                    </div>
                  </label>

                  <Button type="submit" className="w-full mt-2">Login</Button>

                  <p className="text-xs text-text-secondary">
                    No account yet?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="font-semibold text-accent-blue hover:underline"
                    >
                      Create one
                    </button>
                  </p>
                </form>
              ) : (
                <form className="space-y-3" onSubmit={handleSignupSubmit}>
                  <label className="block">
                    <span className="text-xs font-semibold text-text-secondary">Full Name</span>
                    <div className="mt-1 relative">
                      <UserRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input
                        value={signupName}
                        onChange={(event) => setSignupName(event.target.value)}
                        type="text"
                        placeholder="Your name"
                        className="w-full h-10 rounded-lg border border-border-default pl-9 pr-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent-blue/20"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-text-secondary">Email</span>
                    <div className="mt-1 relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input
                        value={signupEmail}
                        onChange={(event) => setSignupEmail(event.target.value)}
                        type="email"
                        placeholder="you@example.com"
                        className="w-full h-10 rounded-lg border border-border-default pl-9 pr-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent-blue/20"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-text-secondary">Password</span>
                    <div className="mt-1 relative">
                      <LockKeyhole size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                      <input
                        value={signupPassword}
                        onChange={(event) => setSignupPassword(event.target.value)}
                        type="password"
                        placeholder="Choose a password"
                        className="w-full h-10 rounded-lg border border-border-default pl-9 pr-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent-blue/20"
                      />
                    </div>
                  </label>

                  <Button type="submit" className="w-full mt-2">Create Account</Button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
