import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CatchRecord, FishSpecies, SupportedLanguage } from '../types';
import { LOCALIZATION } from '../data/localization';
import { ThreeFishViewer } from './ThreeFishViewer';
import { Trophy, Check, ArrowRight, X, Share2 } from 'lucide-react';

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
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');

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

  const handleShare = async () => {
    if (!species || !catchRecord) return;

    const recordTag = isNewRecord ? '🏆 [NEW RECORD!] ' : '';
    const formattedSummary = `🎣 ${recordTag}Fishing Days Catch: ${species.name}\n` +
      `⭐ Rarity: ${catchRecord.rarity}\n` +
      `⚖️ Weight: ${catchRecord.weight.toFixed(2)} KG\n` +
      `📏 Length: ${catchRecord.length.toFixed(1)} CM\n` +
      `💰 Value: $${catchRecord.value}\n` +
      `Play Fishing Days 3D now!`;

    const shareData = {
      title: `Fishing Days - Caught a ${catchRecord.rarity} ${species.name}!`,
      text: formattedSummary,
      url: window.location.href,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        setShareStatus('shared');
        setTimeout(() => setShareStatus('idle'), 2500);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return;
        }
      }
    }

    // Fallback to Clipboard API
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(`${formattedSummary}\n${window.location.href}`);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2500);
      } catch (clipboardErr) {
        console.warn('Clipboard share copy failed:', clipboardErr);
      }
    }
  };

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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`px-2.5 py-0.5 text-[11px] uppercase ${style.badge} ${style.tagStyle}`}
            >
              {species.rarity}
            </span>
            <button
              onClick={handleShare}
              className="p-1 border border-current hover:bg-black hover:text-white transition-colors cursor-pointer"
              title="Share to Social"
              aria-label="Share Catch"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onKeep}
              className="p-1 border border-current hover:bg-black hover:text-white transition-colors cursor-pointer"
              title="Close and keep"
              aria-label="Close modal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
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

        {/* Action Buttons: Share to Social & Keep/Sell */}
        <div className="w-full flex flex-col gap-2.5 mt-1">
          {/* Share to Social button */}
          <button
            id="btn-share-social"
            type="button"
            onClick={handleShare}
            className={`w-full py-2.5 sm:py-3 px-4 font-black text-xs sm:text-sm uppercase tracking-wider border-2 transition cursor-pointer flex items-center justify-center gap-2 select-none shadow-[3px_3px_0px_0px_#000000] active:translate-x-[1px] active:translate-y-[1px] ${
              shareStatus === 'copied' || shareStatus === 'shared'
                ? 'bg-emerald-600 text-white border-white'
                : isDarkPanel
                ? 'bg-white text-black border-white hover:bg-neutral-200'
                : 'bg-black text-white border-black hover:bg-neutral-800'
            }`}
          >
            {shareStatus === 'copied' ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>{t.copiedToClipboard || 'COPIED TO CLIPBOARD!'}</span>
              </>
            ) : shareStatus === 'shared' ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>{t.sharedSuccess || 'SHARED!'}</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>{t.shareToSocial || 'SHARE TO SOCIAL'}</span>
              </>
            )}
          </button>

          {/* Dual Action: Keep or Sell */}
          <div className="w-full grid grid-cols-2 gap-2 sm:gap-3">
            <button
              id="btn-keep-fish"
              onClick={onKeep}
              className={`py-2.5 sm:py-3 px-3 sm:px-4 font-black text-xs sm:text-sm uppercase tracking-wider border-2 transition cursor-pointer flex items-center justify-center gap-2 ${
                isDarkPanel
                  ? 'bg-black text-white border-white hover:bg-white hover:text-black'
                  : 'bg-white text-black border-black hover:bg-black hover:text-white'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{t.keepFish || 'KEEP IN WELL'}</span>
            </button>

            <button
              id="btn-sell-fish"
              onClick={onSell}
              className={`py-2.5 sm:py-3 px-3 sm:px-4 font-black text-xs sm:text-sm uppercase tracking-wider border-2 transition cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 shadow-[2px_2px_0px_0px_#000000] ${
                isDarkPanel
                  ? 'bg-[#222222] text-white border-white hover:bg-white hover:text-black shadow-[2px_2px_0px_0px_#ffffff]'
                  : 'bg-black text-white border-black hover:bg-white hover:text-black'
              }`}
            >
              <span>{t.sellFish || 'SELL'} (+${catchRecord.value})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
