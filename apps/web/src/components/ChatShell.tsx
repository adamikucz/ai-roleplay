"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { AuthGate } from "./AuthGate";
import { characters, createSession } from "@/lib/api";
import { streamChat } from "@/lib/streamChat";
import { useChatStore } from "@/store/chat.store";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";
import { RelationshipPanel } from "./RelationshipPanel";
import { SceneAtmosphere } from "./SceneAtmosphere";

function InnerChat() {
  const st = useChatStore(); const [booting,setBooting]=useState(true);
  const active = useMemo(()=>st.characters.find(c=>c.id===st.characterId) ?? null,[st.characters,st.characterId]);
  useEffect(()=>{ let dead=false; async function boot(){ const data=await characters(); if(dead)return; st.setCharacters(data.characters); const first=data.characters[0]; if(first){ st.setCharacter(first.id); const s=await createSession(first.id); if(dead)return; st.setSession(s.id); st.addMessage({id:crypto.randomUUID(),role:'assistant',content:first.greeting,createdAt:Date.now()}); } setBooting(false); } boot().catch(()=>setBooting(false)); if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{}); return()=>{dead=true}; },[]);
  async function send(content:string){ if(!st.sessionId||!st.characterId||st.isStreaming)return; st.addMessage({id:crypto.randomUUID(),role:'user',content,createdAt:Date.now()}); st.startAssistantStream(); await streamChat({sessionId:st.sessionId,characterId:st.characterId,content,onEvent:e=>{ if(e.type==='status')st.setStatus(e.stage); if(e.type==='token')st.appendToken(e.token); if(e.type==='meta')st.setMeta(e.relationship,e.scene); if(e.type==='done')st.finishStream(); if(e.type==='error'){st.appendToken(`\n\n[${e.message}]`); st.finishStream();}}}).catch(err=>{st.appendToken(`\n\n[Connection error: ${err instanceof Error?err.message:'unknown'}]`); st.finishStream();}); }
  if(booting) return <main className="grid h-screen place-items-center"><div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[.06] px-8 py-6 shadow-glow backdrop-blur-2xl"><Sparkles className="h-5 w-5 animate-pulse"/>Wczytywanie świata...</div></main>;
  return <main className="relative h-screen overflow-hidden"><SceneAtmosphere scene={st.scene}/><div className="relative z-10 grid h-screen grid-cols-1 gap-4 p-3 md:grid-cols-[1fr_360px] md:p-5"><section className="flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 shadow-glow backdrop-blur-2xl"><header className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><h1 className="text-lg font-semibold">{active?.name ?? 'Aether'}</h1><p className="text-sm text-white/55">{active?.tagline ?? 'Persistent cinematic AI'}</p></div><div className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1 text-xs text-white/60">{st.isStreaming ? st.status : 'online'}</div></header><div className="scrollbar-soft flex-1 space-y-5 overflow-y-auto px-4 py-6 md:px-8"><AnimatePresence initial={false}>{st.messages.map(m=><MessageBubble key={m.id} message={m}/>)}</AnimatePresence></div><Composer disabled={st.isStreaming} onSend={send}/></section><aside className="hidden min-h-0 md:block"><RelationshipPanel relationship={st.relationship} scene={st.scene}/></aside></div></main>;
}
export function ChatShell(){ return <AuthGate><InnerChat/></AuthGate>; }
