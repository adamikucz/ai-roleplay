"use client";
import type { RelationshipState, SceneState } from "@aether/shared";
import { motion } from "framer-motion";
import {
  Heart, Shield, Armchair, Eye, Flame, Zap,
  Activity, Sparkles, AlertTriangle, ShieldCheck, Search
} from "lucide-react";

const METRICS: {
  key: keyof RelationshipState;
  label: string;
  icon: typeof Heart;
  color: string;
  gradient: string;
}[] = [
  { key: 'trust', label: 'Zaufanie', icon: Shield, color: '#34d399', gradient: 'from-emerald-400 to-emerald-600' },
  { key: 'attachment', label: 'Przywiązanie', icon: Heart, color: '#f472b6', gradient: 'from-pink-400 to-pink-600' },
  { key: 'comfort', label: 'Komfort', icon: Armchair, color: '#60a5fa', gradient: 'from-blue-400 to-blue-600' },
  { key: 'vulnerability', label: 'Wrażliwość', icon: Eye, color: '#c084fc', gradient: 'from-purple-400 to-purple-600' },
  { key: 'jealousy', label: 'Zazdrość', icon: Flame, color: '#fb923c', gradient: 'from-orange-400 to-orange-600' },
  { key: 'emotionalEnergy', label: 'Energia', icon: Zap, color: '#fbbf24', gradient: 'from-amber-400 to-amber-600' },
  { key: 'conversationalRhythm', label: 'Rytm', icon: Activity, color: '#2dd4bf', gradient: 'from-teal-400 to-teal-600' },
  { key: 'intimacy', label: 'Intymność', icon: Sparkles, color: '#e879f9', gradient: 'from-fuchsia-400 to-fuchsia-600' },
  { key: 'tension', label: 'Napięcie', icon: AlertTriangle, color: '#f87171', gradient: 'from-red-400 to-red-600' },
  { key: 'protectiveness', label: 'Ochronność', icon: ShieldCheck, color: '#38bdf8', gradient: 'from-sky-400 to-sky-600' },
  { key: 'curiosity', label: 'Ciekawość', icon: Search, color: '#a78bfa', gradient: 'from-violet-400 to-violet-500' },
];

export function RelationshipPanel({
  relationship,
  scene
}: {
  relationship: RelationshipState | null;
  scene: SceneState | null;
}) {
  return (
    <div className="flex h-full flex-col gap-4 glass-panel p-5 overflow-y-auto scrollbar-soft">
      {/* Header */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">
          Stan psychologiczny
        </h2>
        <p className="mt-1.5 text-[0.7rem] leading-relaxed text-white/40">
          Zmienne relacji wpływają na zachowanie, ton i inicjatywę postaci.
        </p>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {relationship ? (
          METRICS.map(({ key, label, icon: Icon, color, gradient }) => {
            const value = relationship[key];
            return (
              <div key={key} className="group">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3 w-3" style={{ color }} />
                    <span className="text-xs text-white/55 group-hover:text-white/75 transition-colors">{label}</span>
                  </div>
                  <span className="text-xs font-medium tabular-nums" style={{ color }}>
                    {value}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                    style={{ boxShadow: `0 0 12px ${color}33` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center text-sm text-white/35">
            Brak danych o relacji.
            <br />
            <span className="text-xs text-white/20">Rozpocznij rozmowę, aby zobaczyć zmiany.</span>
          </div>
        )}
      </div>

      {/* Scene */}
      <div className="mt-auto rounded-[1.25rem] border border-white/[0.06] bg-white/[0.03] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/35 mb-3">Scena</h3>
        {scene ? (
          <div className="space-y-2.5 text-[0.8rem] leading-relaxed">
            <div className="flex gap-2">
              <span className="text-white/25 flex-shrink-0 w-20">Miejsce:</span>
              <span className="text-white/60">{scene.location}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-white/25 flex-shrink-0 w-20">Nastrój:</span>
              <span className="text-white/60">{scene.mood}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-white/25 flex-shrink-0 w-20">Atmosfera:</span>
              <span className="text-white/60">{scene.visualAtmosphere}</span>
            </div>
            {scene.activeConflict && (
              <div className="flex gap-2">
                <span className="text-white/25 flex-shrink-0 w-20">Konflikt:</span>
                <span className="text-rose-300/60">{scene.activeConflict}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[0.75rem] text-white/30">
            Stan sceny pojawi się po pierwszej turze.
          </p>
        )}
      </div>
    </div>
  );
}
