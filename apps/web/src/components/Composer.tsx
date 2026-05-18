"use client";
import { FormEvent, useRef, useEffect, useState } from "react";
import { SendHorizonal } from "lucide-react";

export function Composer({ disabled, onSend }: { disabled: boolean; onSend: (content: string) => void }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const content = value.trim();
    if (!content || disabled) return;
    setValue('');
    onSend(content);
  }

  return (
    <form onSubmit={submit} className="border-t border-white/[0.06] bg-black/20 p-3 backdrop-blur-xl md:p-4">
      <div className="flex items-end gap-3 rounded-[1.5rem] border border-white/[0.07] bg-white/[0.04] p-2 transition-colors focus-within:border-violet-500/30 focus-within:bg-white/[0.06]">
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          rows={1}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          placeholder="Napisz coś..."
          className="max-h-40 min-h-[2.75rem] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-white/30 disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/20 transition hover:from-violet-400 hover:to-violet-500 hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
          aria-label="Wyślij"
        >
          <SendHorizonal className="h-4.5 w-4.5 text-white" />
        </button>
      </div>

      {/* Streaming status */}
      {disabled && (
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-white/30">
          <span className="inline-flex gap-0.5">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
          <span>AI pisze odpowiedź...</span>
        </div>
      )}
    </form>
  );
}
