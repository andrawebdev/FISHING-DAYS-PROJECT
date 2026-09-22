import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CatchRecord, FishSpecies, SupportedLanguage } from '../types';
import { LOCALIZATION } from '../data/localization';
import { ThreeFishViewer } from './ThreeFishViewer';
import { Trophy, Check, ArrowRight } from 'lucide-react';

interface CatchModalProps {
  catchRecord: CatchRecord | null;
  species: FishSpecies | null;
  isNewRecord: boolean;
  language: SupportedLanguage;
  onSell: () => void;
  onKeep: () => void;
}

/**
 * Monochrome Rarity Visual Styling for Black & White Maximalism
 */
const MONO_RARITY_STYLES: Record<
  string,
  {
    badge: string;
    border: string;
    tagStyle: string;
    bgPanel: string;
  }
> = {
  COMMON: {
    badge: 'bg-black text-white border-2 border-black',
    border: 'border-2 border-black',
    tagStyle: 'font-bold tracking-widest',
    bgPanel: 'bg-white text-black',
  },
  UNCOMMON: {
    badge: 'bg-[#222222] text-white border-2 border-white',
    border: 'border-2 border-white',
    tagStyle: 'font-extrabold tracking-widest',
    bgPanel: 'bg-[#111111] text-white',
  },
  RARE: {
    badge: 'bg-white text-black border-2 border-black',
    border: 'border-4 border-black',
    tagStyle: 'font-black tracking-widest underline decoration-2',
    bgPanel: 'bg-white text-black shadow-[6px_6px_0px_0px_#000000]',
  },
  EPIC: {
    badge: 'bg-black text-white border-4 border-white',
    border: 'border-4 border-white',
    tagStyle: 'font-black tracking-[0.2em] uppercase',
    bgPanel: 'bg-black text-white shadow-[8px_8px_0px_0px_#ffffff]',
  },
  LEGENDARY: {
    badge: 'bg-white text-black border-4 border-black',
    border: 'border-4 border-black',
    tagStyle: 'font-black tracking-[0.25em] uppercase outline outline-2 outline-white',
    bgPanel: 'bg-white text-black shadow-[10px_10px_0px_0px_#000000]',
  },
  MYTHIC: {
    badge: 'bg-black text-white border-4 border-white',
    border: 'border-4 border-white',
    tagStyle: 'font-black tracking-[0.3em] uppercase invert',
    bgPanel: 'bg-black text-white shadow-[12px_12px_0px_0px_#888888]',
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
        // Monochrome / high contrast confetti
        confetti({
          particleCount: catchRecord.rarity === 'MYTHIC' ? 100 : 50,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ffffff', '#000000', '#aaaaaa', '#ffffff'],
        });
      }
    }
  }, [catchRecord, isNewRecord]);

  if (!catchRecord || !species) return null;

  const style = MONO_RARITY_STYLES[catchRecord.rarity] || MONO_RARITY_STYLES.COMMON;
  const isDarkPanel = catchRecord.rarity === 'UNCOMMON' || catchRecord.rarity === 'EPIC' || catchRecord.rarity === 'MYTHIC';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`relative w-full max-w-lg ${style.bgPanel} ${style.border} p-5 sm:p-7 flex flex-col items-center text-center`}
      >
        {/* Top Header Row */}
        <div className="w-full flex items-center justify-between border-b-2 border-current pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono font-black tracking-widest">
              CAUGHT!
            </span>
            {isNewRecord && (
              <span className="flex items-center gap-1 text-[10px] uppercase font-black px-1.5 py-0.5 bg-black text-white border border-white">
                <Trophy className="w-3 h-3" />
                NEW RECORD
              </span>
            )}
          </div>
          <span
            className={`px-2.5 py-0.5 text-[11px] uppercase ${style.badge} ${style.tagStyle}`}
          >
            {species.rarity}
          </span>
        </div>

        {/* Big Bold Headline */}
        <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">
          {species.name}
        </h2>

        {/* 3D Fish Viewport (Interactive Three.js Canvas!) */}
        <div className="relative w-full h-44 sm:h-52 my-1 border-2 border-current bg-[#111111] overflow-hidden flex items-center justify-center">
          <ThreeFishViewer species={species} size={240} />
          {/* Subtle tactile hint */}
          <div className="absolute bottom-1 right-2 text-[9px] font-mono uppercase tracking-wider text-[#888888] select-none pointer-events-none">
            DRAG TO ROTATE 3D
          </div>
        </div>

        {/* Biological Metrics in Strong Maximalist Monospaced Grid */}
        <div className="w-full grid grid-cols-3 border-2 border-current my-3 text-left">
          <div className="p-2 border-r-2 border-current">
            <span className="block text-[10px] uppercase font-mono font-bold opacity-75">
              WEIGHT
            </span>
            <span className="text-base sm:text-lg font-black font-mono">
              {catchRecord.weight.toFixed(2)} KG
            </span>
          </div>

          <div className="p-2 border-r-2 border-current">
            <span className="block text-[10px] uppercase font-mono font-bold opacity-75">
              LENGTH
            </span>
            <span className="text-base sm:text-lg font-black font-mono">
              {catchRecord.length.toFixed(1)} CM
            </span>
          </div>

          <div className="p-2">
            <span className="block text-[10px] uppercase font-mono font-bold opacity-75">
              VALUE
            </span>
            <span className="text-base sm:text-lg font-black font-mono">
              ${catchRecord.value}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs font-mono opacity-85 mb-4 line-clamp-2 italic px-2">
          "{species.description}"
        </p>

        {/* Action Buttons: Keep or Sell (High Contrast Chunky) */}
        <div className="w-full grid grid-cols-2 gap-3 mt-1">
          <button
            id="btn-keep-fish"
            onClick={onKeep}
            className={`py-3 px-4 font-black text-xs sm:text-sm uppercase tracking-wider border-2 transition cursor-pointer flex items-center justify-center gap-2 ${
              isDarkPanel
                ? 'bg-black text-white border-white hover:bg-white hover:text-black'
                : 'bg-white text-black border-black hover:bg-black hover:text-white'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>KEEP IN WELL</span>
          </button>

          <button
            id="btn-sell-fish"
            onClick={onSell}
            className={`py-3 px-4 font-black text-xs sm:text-sm uppercase tracking-wider border-2 transition cursor-pointer flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#000000] ${
              isDarkPanel
                ? 'bg-white text-black border-white hover:bg-black hover:text-white shadow-[3px_3px_0px_0px_#ffffff]'
                : 'bg-black text-white border-black hover:bg-white hover:text-black'
            }`}
          >
            <span>SELL (+${catchRecord.value})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
