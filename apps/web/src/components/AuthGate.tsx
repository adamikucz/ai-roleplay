"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { login, register, me } from "@/lib/api";
import { useChatStore } from "@/store/chat.store";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const user = useChatStore(s=>s.user); const setUser = useChatStore(s=>s.setUser);
  const [mode,setMode] = useState<'login'|'register'>('register'); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [displayName,setDisplayName]=useState('Demo User'); const [error,setError]=useState(''); const [checking,setChecking]=useState(true);
  useEffect(()=>{ me().then(r=>setUser(r.user)).catch(()=>{}).finally(()=>setChecking(false)); },[setUser]);
  async function submit(e: React.FormEvent) { e.preventDefault(); setError(''); try { const r = mode==='login' ? await login({email,password}) : await register({email,password,displayName}); setUser(r.user); } catch(err){ setError(err instanceof Error ? err.message : 'Authentication failed'); } }
  if (checking) return <div className="grid h-screen place-items-center text-white/70">Budowanie połączenia...</div>;
  if (user) return <>{children}</>;
  return <main className="grid h-screen place-items-center p-5"><motion.form onSubmit={submit} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md rounded-[2rem] border border-white/10 bg-black/30 p-6 shadow-glow backdrop-blur-2xl">
    <h1 className="text-2xl font-semibold">Aether Roleplay</h1><p className="mt-2 text-sm text-white/55">Zaloguj się lub utwórz konto, aby zachować pamięć i relacje.</p>
    <div className="mt-6 flex rounded-2xl bg-white/5 p-1 text-sm"><button type="button" onClick={()=>setMode('login')} className={`flex-1 rounded-xl py-2 ${mode==='login'?'bg-white/15':'text-white/55'}`}>Login</button><button type="button" onClick={()=>setMode('register')} className={`flex-1 rounded-xl py-2 ${mode==='register'?'bg-white/15':'text-white/55'}`}>Register</button></div>
    {mode==='register' && <input className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Display name"/>}
    <input className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email"/>
    <input className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password"/>
    {error && <p className="mt-3 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p>}
    <button className="mt-5 w-full rounded-2xl bg-violet-500 py-3 font-medium hover:bg-violet-400">Continue</button>
  </motion.form></main>;
}
