import { create } from "zustand";
import type { RelationshipState, SceneState } from "@aether/shared";
export type UiUser = { id:string; email:string; displayName:string };
export type UiCharacter = { id:string; name:string; tagline:string|null; greeting:string; avatarUrl:string|null };
export type UiMessage = { id:string; role:'user'|'assistant'; content:string; streaming?:boolean; createdAt:number };
type State = {
  user: UiUser|null; characters:UiCharacter[]; characterId:string|null; sessionId:string|null; messages:UiMessage[];
  relationship:RelationshipState|null; scene:SceneState|null; isStreaming:boolean; status:string;
  setUser:(u:UiUser|null)=>void; setCharacters:(c:UiCharacter[])=>void; setCharacter:(id:string)=>void; setSession:(id:string)=>void;
  addMessage:(m:UiMessage)=>void; startAssistantStream:()=>void; appendToken:(t:string)=>void; finishStream:()=>void; setMeta:(r:RelationshipState,s:SceneState)=>void; setStatus:(s:string)=>void; reset:()=>void;
};
export const useChatStore = create<State>((set)=>({
  user:null, characters:[], characterId:null, sessionId:null, messages:[], relationship:null, scene:null, isStreaming:false, status:'idle',
  setUser:user=>set({user}), setCharacters:characters=>set({characters}), setCharacter:characterId=>set({characterId}), setSession:sessionId=>set({sessionId}),
  addMessage:m=>set(st=>({messages:[...st.messages,m]})),
  startAssistantStream:()=>set(st=>({isStreaming:true,messages:[...st.messages,{id:crypto.randomUUID(),role:'assistant',content:'',streaming:true,createdAt:Date.now()}]})),
  appendToken:t=>set(st=>({messages:st.messages.map((m,i)=>i===st.messages.length-1&&m.streaming?{...m,content:m.content+t}:m)})),
  finishStream:()=>set(st=>({isStreaming:false,status:'idle',messages:st.messages.map(m=>m.streaming?{...m,streaming:false}:m)})),
  setMeta:(relationship,scene)=>set({relationship,scene}), setStatus:status=>set({status}),
  reset:()=>set({sessionId:null,messages:[],relationship:null,scene:null,isStreaming:false,status:'idle'})
}));
