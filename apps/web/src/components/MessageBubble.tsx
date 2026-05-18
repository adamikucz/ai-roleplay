"use client";
import { motion } from "framer-motion";
import type { UiMessage } from "@/store/chat.store";

function getInitials(name: string) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({
  message,
  characterName,
  avatarUrl
}: {
  message: UiMessage;
  characterName?: string;
  avatarUrl?: string | null;
}) {
  const isUser = message.role === 'user';
  const initials = characterName ? getInitials(characterName) : 'AI';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="avatar avatar-bot mt-1 flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={characterName ?? 'Bot'} />
          ) : (
            initials
          )}
        </div>
      )}
      {isUser && (
        <div className="avatar avatar-user mt-1 flex-shrink-0">
          <span className="text-xs">Ty</span>
        </div>
      )}

      {/* Content */}
      <div className={`max-w-[82%] md:max-w-[72%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={[
            "whitespace-pre-wrap rounded-[1.5rem] px-5 py-3.5 text-[0.9375rem] leading-7",
            isUser
              ? "bg-gradient-to-br from-violet-500/90 to-violet-600/90 text-white shadow-lg shadow-violet-500/10 rounded-tr-lg"
              : "border border-white/[0.07] bg-white/[0.05] text-white/90 backdrop-blur-xl rounded-tl-lg " + (message.streaming ? 'pulse-glow' : '')
          ].join(' ')}
        >
          {message.content}
          {message.streaming && !message.content && (
            <span className="inline-flex gap-0.5 py-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </span>
          )}
          {message.streaming && message.content && (
            <span className="ml-1 inline-block h-4 w-[3px] animate-pulse rounded-full bg-white/60 align-middle" />
          )}
        </div>

        {/* Timestamp */}
        <span className={`mt-1.5 text-[0.625rem] text-white/20 ${isUser ? 'text-right pr-1' : 'pl-1'}`}>
          {formatTime(message.createdAt)}
        </span>
      </div>
    </motion.article>
  );
}
