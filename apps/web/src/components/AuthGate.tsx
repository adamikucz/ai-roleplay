"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { login, register, me } from "@/lib/api";
import { useChatStore } from "@/store/chat.store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useChatStore(s => s.user);
  const setUser = useChatStore(s => s.setUser);
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    me().then(r => setUser(r.user)).catch(() => {}).finally(() => setChecking(false));
  }, [setUser]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const r = mode === 'login'
        ? await login({ email, password })
        : await register({ email, password, displayName });
      setUser(r.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd uwierzytelniania');
    }
  }

  if (checking) {
    return (
      <div className="grid h-screen place-items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 glass-panel px-8 py-6"
        >
          <Sparkles className="h-5 w-5 animate-pulse text-violet-400" />
          <span className="text-white/60">Łączenie z Aether...</span>
        </motion.div>
      </div>
    );
  }

  if (user) return <>{children}</>;

  return (
    <main className="grid h-screen place-items-center p-5">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md glass-panel p-7"
      >
        {/* Logo */}
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 shadow-lg shadow-violet-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Aether Roleplay</h1>
            <p className="text-xs text-white/40">Immersyjne rozmowy z AI</p>
          </div>
        </div>

        <p className="mb-5 text-sm text-white/45 leading-relaxed">
          Zaloguj się lub utwórz konto, aby zachować pamięć, relacje i historię rozmów.
        </p>

        {/* Mode toggle */}
        <div className="tab-toggle mb-5">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={mode === 'login' ? 'active' : ''}
          >
            Logowanie
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={mode === 'register' ? 'active' : ''}
          >
            Rejestracja
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          {mode === 'register' && (
            <input
              className="input-glass"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Nazwa wyświetlana"
              autoComplete="name"
            />
          )}
          <input
            className="input-glass"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            autoComplete="email"
          />
          <input
            className="input-glass"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Hasło"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
        </div>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200"
          >
            {error}
          </motion.p>
        )}

        {/* Submit */}
        <button type="submit" className="btn-primary mt-5 w-full">
          {mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
        </button>
      </motion.form>
    </main>
  );
}
