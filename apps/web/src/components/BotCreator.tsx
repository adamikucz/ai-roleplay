"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Sparkles, X, Loader2, Eye, EyeOff } from "lucide-react";
import { useChatStore } from "@/store/chat.store";
import { createCharacterFromDescription } from "@/lib/api";

const ARCHETYPES = [
  { id: 'romantic', label: '💕 Romantyczny', hint: 'Czuły, emocjonalny, buduje głęboką więź' },
  { id: 'friend', label: '🤝 Przyjacielski', hint: 'Wesoły, wspierający, lubiany towarzysz' },
  { id: 'mentor', label: '🧙 Mentorski', hint: 'Mądry, cierpliwy, inspirujący przewodnik' },
  { id: 'adventure', label: '⚔️ Przygodowy', hint: 'Odważny, spontaniczny, szukający przygód' },
  { id: 'mysterious', label: '🌙 Tajemniczy', hint: 'Enigmatyczny, intrygujący, pełen sekretów' },
  { id: 'playful', label: '😄 Figlarny', hint: 'Zabawny, energiczny, lubi żarty' },
];

export function BotCreator({ onCreated }: { onCreated: (character: any) => void }) {
  const st = useChatStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [archetype, setArchetype] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<any>(null);

  async function handleCreate() {
    if (!name.trim() || !description.trim()) return;
    setLoading(true);
    setError('');
    setPreview(null);

    const archetypeHint = archetype ? `\nArchetyp: ${ARCHETYPES.find(a => a.id === archetype)?.hint ?? ''}` : '';
    const fullDescription = description + archetypeHint;

    try {
      const result = await createCharacterFromDescription({
        name: name.trim(),
        description: fullDescription,
        visibility,
        language: st.language
      });
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się stworzyć postaci');
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (preview) {
      onCreated(preview);
      st.setBotCreatorOpen(false);
    }
  }

  if (!st.botCreatorOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) st.setBotCreatorOpen(false); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto glass-panel p-6 scrollbar-soft"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 shadow-lg">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Stwórz postać</h2>
                <p className="text-xs text-white/40">Opisz swoją postać naturalnym językiem</p>
              </div>
            </div>
            <button
              onClick={() => st.setBotCreatorOpen(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {!preview ? (
            <>
              {/* Name */}
              <label className="mb-1.5 block text-xs font-medium text-white/50">Imię postaci</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="np. Amelka, Kira, Marcus..."
                className="input-glass mb-4"
                maxLength={80}
              />

              {/* Description */}
              <label className="mb-1.5 block text-xs font-medium text-white/50">Opis postaci</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={"Opisz swoją postać naturalnie, np:\n\"To jest Amelka, ma 17 lat, uwielbia jazdę konną i jest nieco nieśmiała. Lubi rozmawiać o zwierzętach i przyrodzie. Mieszka na wsi pod Krakowem.\""}
                className="input-glass mb-4 min-h-[120px] resize-y"
                rows={5}
                maxLength={8000}
              />

              {/* Archetypes */}
              <label className="mb-2 block text-xs font-medium text-white/50">Archetyp (opcjonalnie)</label>
              <div className="mb-4 grid grid-cols-2 gap-2">
                {ARCHETYPES.map(arc => (
                  <button
                    key={arc.id}
                    onClick={() => setArchetype(archetype === arc.id ? null : arc.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      archetype === arc.id
                        ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:bg-white/[0.05] hover:text-white/70'
                    }`}
                  >
                    <div className="font-medium">{arc.label}</div>
                    <div className="mt-0.5 text-[0.65rem] opacity-60">{arc.hint}</div>
                  </button>
                ))}
              </div>

              {/* Visibility */}
              <div className="mb-5 flex items-center gap-3">
                <button
                  onClick={() => setVisibility(visibility === 'private' ? 'public' : 'private')}
                  className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-white/50 transition hover:bg-white/[0.05]"
                >
                  {visibility === 'private' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {visibility === 'private' ? 'Prywatna' : 'Publiczna'}
                </button>
                <span className="text-[0.65rem] text-white/30">
                  {visibility === 'private' ? 'Tylko Ty widzisz tę postać' : 'Każdy może z nią rozmawiać'}
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleCreate}
                disabled={loading || !name.trim() || !description.trim()}
                className="btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    AI generuje postać...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Stwórz postać
                  </>
                )}
              </button>
            </>
          ) : (
            /* Preview */
            <>
              <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <div className="text-sm font-medium text-emerald-300">✨ Postać wygenerowana!</div>
                <p className="mt-1 text-xs text-emerald-200/60">Sprawdź poniżej, czy wszystko się zgadza.</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="mb-1 text-xs font-medium text-white/40">Tagline</div>
                  <p className="text-sm text-white/80">{preview.tagline}</p>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-white/40">Osobowość</div>
                  <p className="text-sm text-white/70 leading-relaxed">{preview.persona}</p>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-white/40">Scenariusz</div>
                  <p className="text-sm text-white/70 leading-relaxed">{preview.scenario}</p>
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-white/40">Powitanie</div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-white/80 italic leading-relaxed">
                    {preview.greeting}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPreview(null)} className="btn-ghost flex-1 !border-white/[0.06]">
                  ← Popraw opis
                </button>
                <button onClick={handleConfirm} className="btn-primary flex-1">
                  <Sparkles className="h-4 w-4" />
                  Rozpocznij chat
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
