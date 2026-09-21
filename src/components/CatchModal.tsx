import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { CatchRecord, FishSpecies, SupportedLanguage } from '../types';
import { LOCALIZATION } from '../data/localization';
import { Trophy, Coins, Sparkles, Check } from 'lucide-react';

interface CatchModalProps {
  catchRecord: CatchRecord | null;
  species: FishSpecies | null;
  isNewRecord: boolean;
  language: SupportedLanguage;
  onSell: () => void;
  onKeep: () => void;
}

const RARITY_STYLES: Record<string, { badge: string; border: string; glow: string; text: string }> = {
  COMMON: {
    badge: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50',
    border: 'border-emerald-500/60',
    glow: 'from-emerald-600/20 to-teal-900/40',
    text: 'text-emerald-300',
  },
  UNCOMMON: {
    badge: 'bg-cyan-600/30 text-cyan-300 border-cyan-500/50',
    border: 'border-cyan-500/60',
    glow: 'from-cyan-600/20 to-blue-900/40',
    text: 'text-cyan-300',
  },
  RARE: {
    badge: 'bg-blue-600/30 text-blue-300 border-blue-500/50',
    border: 'border-blue-500/60',
    glow: 'from-blue-600/25 to-indigo-900/40',
    text: 'text-blue-300',
  },
  EPIC: {
    badge: 'bg-purple-600/30 text-purple-300 border-purple-500/50',
    border: 'border-purple-500/70',
    glow: 'from-purple-600/30 to-fuchsia-950/50',
    text: 'text-purple-300',
  },
  LEGENDARY: {
    badge: 'bg-amber-500/30 text-amber-300 border-amber-400/60 animate-pulse',
    border: 'border-amber-400',
    glow: 'from-amber-600/35 via-orange-600/20 to-yellow-950/60',
    text: 'text-amber-300 font-bold',
  },
  MYTHIC: {
    badge: 'bg-gradient-to-r from-purple-500/40 via-cyan-400/40 to-pink-500/40 text-cyan-200 border-cyan-300 animate-pulse',
    border: 'border-cyan-300 shadow-cyan-500/50 shadow-2xl',
    glow: 'from-purple-900/40 via-cyan-900/30 to-slate-950',
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-pink-300 to-amber-200 font-extrabold',
  },
};

export const CatchModal: React.FC<CatchModalProps> = ({
  catchRecord,
  species,
  isNewRecord,
  language,
  onSell,
  onKeep,
}) => {
  const t = LOCALIZATION[language] || LOCALIZATION.en;

  useEffect(() => {
    if (catchRecord) {
      if (
        catchRecord.rarity === 'RARE' ||
        catchRecord.rarity === 'EPIC' ||
        catchRecord.rarity === 'LEGENDARY' ||
        catchRecord.rarity === 'MYTHIC' ||
        isNewRecord
      ) {
        confetti({
          particleCount: catchRecord.rarity === 'MYTHIC' ? 120 : 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#2dd4bf', '#facc15', '#ec4899', '#c084fc'],
        });
      }
    }
  }, [catchRecord, isNewRecord]);

  if (!catchRecord || !species) return null;

  const style = RARITY_STYLES[catchRecord.rarity] || RARITY_STYLES.COMMON;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`relative w-full max-w-lg bg-gradient-to-b ${style.glow} bg-slate-900/95 border ${style.border} rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center overflow-hidden`}
      >
        {/* Subtle decorative sparkles in background */}
        <div className="absolute top-4 right-4 text-cyan-300/30">
          <Sparkles className="w-12 h-12 animate-pulse" />
        </div>

        {/* New Record Banner */}
        {isNewRecord && (
          <div className="mb-3 px-4 py-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <Trophy className="w-4 h-4" />
            <span>{t.newRecord}</span>
          </div>
        )}

        {/* Catch Headline */}
        <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
          {t.caught}
        </span>
        <h2 className={`text-2xl md:text-3xl font-extrabold mb-2 ${style.text}`}>
          {species.name}
        </h2>

        {/* Rarity Pill */}
        <span
          className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border mb-4 ${style.badge}`}
        >
          {species.rarity}
        </span>

        {/* Stylized Fish Preview Graphic */}
        <div className="relative w-48 h-32 my-2 flex items-center justify-center">
          {/* Subtle water ripple aura */}
          <div
            className="absolute w-40 h-40 rounded-full blur-2xl opacity-40 animate-pulse"
            style={{ backgroundColor: species.color }}
          />

          <svg viewBox="0 0 200 100" className="w-full h-full drop-shadow-xl">
            {/* Tail */}
            <path
              d="M 40 50 L 15 25 Q 25 50 15 75 Z"
              fill={species.secondaryColor}
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Dorsal Fin */}
            <path
              d="M 90 26 Q 120 10 145 28 Z"
              fill={species.dorsalColor}
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Body */}
            <path
              d="M 35 50 Q 80 20 155 45 Q 170 50 155 55 Q 80 80 35 50 Z"
              fill={species.color}
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            {/* Belly highlight */}
            <path
              d="M 50 54 Q 90 70 145 52"
              stroke={species.secondaryColor}
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Pectoral Fin */}
            <path
              d="M 110 52 Q 130 65 120 54 Z"
              fill={species.secondaryColor}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
            {/* Eye */}
            <circle cx="152" cy="46" r="4" fill="#0f172a" />
            <circle cx="153" cy="45" r="1.5" fill="#ffffff" />
          </svg>
        </div>

        {/* Biological Stats Card */}
        <div className="w-full grid grid-cols-3 gap-2 my-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-slate-200">
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">{t.weight}</span>
            <span className="text-base font-bold text-cyan-300 font-mono">
              {catchRecord.weight.toFixed(2)} kg
            </span>
          </div>
          <div className="flex flex-col border-x border-slate-800">
            <span className="text-[11px] text-slate-400">{t.length}</span>
            <span className="text-base font-bold text-teal-300 font-mono">
              {catchRecord.length.toFixed(1)} cm
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] text-slate-400">{t.value}</span>
            <span className="text-base font-bold text-amber-300 font-mono flex items-center justify-center gap-1">
              <Coins className="w-3.5 h-3.5" />
              {catchRecord.value}
            </span>
          </div>
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-300/90 italic mb-6 max-w-md line-clamp-2">
          "{species.description}"
        </p>

        {/* Actions: Sell or Keep */}
        <div className="w-full flex gap-3">
          <button
            id="btn-keep-fish"
            onClick={onKeep}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold text-sm rounded-xl border border-slate-600 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{t.keepFish}</span>
          </button>

          <button
            id="btn-sell-fish"
            onClick={onSell}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 active:scale-95 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Coins className="w-4 h-4" />
            <span>
              {t.sellFish} (+{catchRecord.value})
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
