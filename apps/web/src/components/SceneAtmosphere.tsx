"use client";
import type { SceneState } from "@aether/shared";
import { motion } from "framer-motion";

export function SceneAtmosphere({ scene }: { scene: SceneState | null }) {
  const tension = scene?.mood.includes('tense') || scene?.mood.includes('charged');
  const warm = scene?.mood.includes('warm') || scene?.mood.includes('safe') || scene?.mood.includes('comfort');
  const intimate = scene?.mood.includes('intimate');

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Primary orb — violet */}
      <motion.div
        animate={{
          opacity: tension ? 0.35 : warm ? 0.18 : 0.25,
          scale: tension ? 1.12 : 1,
          x: tension ? -20 : 0,
          y: tension ? -10 : 0
        }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        className="absolute -left-[5%] -top-[15%] h-[500px] w-[500px] rounded-full blur-[120px]"
        style={{
          background: tension
            ? 'radial-gradient(circle, rgba(239,68,68,0.35), rgba(124,92,255,0.15))'
            : warm
              ? 'radial-gradient(circle, rgba(251,191,36,0.25), rgba(124,92,255,0.10))'
              : 'radial-gradient(circle, rgba(124,92,255,0.30), rgba(56,189,248,0.08))'
        }}
      />

      {/* Secondary orb — cyan/pink */}
      <motion.div
        animate={{
          opacity: warm ? 0.28 : intimate ? 0.32 : 0.15,
          x: warm ? 30 : 0,
          y: intimate ? -20 : 0
        }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
        className="absolute -bottom-[15%] -right-[5%] h-[520px] w-[520px] rounded-full blur-[140px]"
        style={{
          background: warm
            ? 'radial-gradient(circle, rgba(52,211,153,0.20), rgba(56,189,248,0.10))'
            : intimate
              ? 'radial-gradient(circle, rgba(232,121,249,0.25), rgba(124,92,255,0.10))'
              : 'radial-gradient(circle, rgba(56,189,248,0.18), rgba(124,92,255,0.05))'
        }}
      />

      {/* Floating accent orb */}
      <motion.div
        animate={{
          opacity: tension ? 0.12 : 0.06,
          y: [0, -20, 0],
          x: [0, 15, 0]
        }}
        transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
        className="absolute left-1/2 top-1/3 h-[300px] w-[300px] rounded-full blur-[100px]"
        style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.15), transparent)' }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5))]" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />
    </div>
  );
}
