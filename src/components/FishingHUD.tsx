import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FishingState, SupportedLanguage } from '../types';
import { LOCALIZATION } from '../data/localization';
import { TensionGauge } from './TensionGauge';
import { X, RotateCcw, AlertTriangle } from 'lucide-react';

interface FishingHUDProps {
  fishingState: FishingState;
  castPower: number;
  lineTension: number;
  fishDistance: number;
  canFish: boolean;
  language: SupportedLanguage;
  isReeling: boolean;
  onStartCastCharge: () => void;
  onReleaseCastCharge: () => void;
  onHookFish: () => void;
  onStartReel: () => void;
  onStopReel: () => void;
  onResetToIdle: () => void;
}

export const FishingHUD: React.FC<FishingHUDProps> = ({
  fishingState,
  castPower,
  lineTension,
  fishDistance,
  canFish,
  language,
  isReeling,
  onStartCastCharge,
  onReleaseCastCharge,
  onHookFish,
  onStartReel,
  onStopReel,
  onResetToIdle,
}) => {
  const t = LOCALIZATION[language] || LOCALIZATION.en;

  // Pointer event handlers to prevent double-tap or ghost firing
  const handleStartCast = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartCastCharge();
  };

  const handleReleaseCast = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReleaseCastCharge();
  };

  const isChargingCast = fishingState === 'CASTING';

  return (
    <div className="fixed inset-x-0 bottom-4 sm:bottom-6 z-20 flex flex-col items-center justify-end pointer-events-none px-4 select-none">
      {/* 1. POSITIONING HINT WHEN OFF DOCK */}
      {!canFish && fishingState === 'IDLE' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 px-3 py-1.5 bg-black text-white border-2 border-white font-mono text-xs uppercase tracking-widest pointer-events-auto shadow-[3px_3px_0px_0px_#ffffff]"
        >
          [!] APPROACH DOCK EDGE TO CAST
        </motion.div>
      )}

      {/* 2. CASTING POWER METER (Black & White Maximalism) */}
      {isChargingCast && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="mb-3 bg-black text-white border-2 sm:border-4 border-white p-3 font-mono shadow-[4px_4px_0px_0px_#ffffff] flex flex-col items-center gap-1.5 pointer-events-auto w-64 sm:w-80"
        >
          <div className="flex justify-between w-full text-xs font-black tracking-widest uppercase">
            <span>CAST POWER</span>
            <span className="bg-white text-black px-1.5 py-0.5">{Math.round(castPower * 100)}%</span>
          </div>

          <div className="relative w-full h-4 sm:h-5 bg-[#222222] border-2 border-white overflow-hidden">
            <motion.div
              className="h-full bg-white"
              style={{ width: `${Math.round(castPower * 100)}%` }}
            />
            {/* Target sweet spot zone */}
            <div className="absolute top-0 bottom-0 left-[65%] right-[15%] border-x-2 border-dashed border-black bg-white/30 pointer-events-none" />
          </div>

          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
            RELEASE TO LAUNCH INTO LAKE
          </span>
        </motion.div>
      )}

      {/* 3. CONTEXTUAL FISHING CONTROLS */}
      <AnimatePresence mode="wait">
        {/* STATE: IDLE or CASTING */}
        {(fishingState === 'IDLE' || fishingState === 'CASTING') && canFish && (
          <motion.div
            key="cast-button-container"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="pointer-events-auto flex items-center gap-2"
          >
            <button
              id="btn-cast-rod"
              onPointerDown={handleStartCast}
              onPointerUp={handleReleaseCast}
              onPointerCancel={handleReleaseCast}
              className={`px-8 sm:px-10 py-3.5 sm:py-4 font-black text-sm sm:text-base tracking-widest uppercase border-2 sm:border-4 transition-transform cursor-pointer touch-none select-none shadow-[4px_4px_0px_0px_#000000] active:translate-x-1 active:translate-y-1 ${
                isChargingCast
                  ? 'bg-black text-white border-white shadow-[4px_4px_0px_0px_#ffffff]'
                  : 'bg-white text-black border-black hover:bg-black hover:text-white'
              }`}
            >
              <span>{isChargingCast ? 'CASTING...' : 'HOLD TO CAST'}</span>
              <span className="hidden sm:inline-block ml-2 text-[11px] font-mono border border-current px-1.5 py-0.5">
                [SPACE]
              </span>
            </button>
          </motion.div>
        )}

        {/* STATE: WAITING (Compact editorial banner) */}
        {fishingState === 'WAITING' && (
          <motion.div
            key="waiting-hud"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pointer-events-auto bg-black text-white border-2 sm:border-4 border-white px-5 py-3 shadow-[4px_4px_0px_0px_#ffffff] flex items-center gap-4 font-mono select-none"
          >
            <div className="flex flex-col text-left">
              <span className="text-xs sm:text-sm font-black tracking-widest uppercase">
                WATCH THE FLOAT
              </span>
              <span className="text-[11px] opacity-75 uppercase">
                WAIT FOR THE BITE...
              </span>
            </div>

            {/* Cancel Cast Button */}
            <button
              id="btn-cancel-fishing"
              onClick={onResetToIdle}
              title="Cancel Cast"
              className="p-1.5 border-2 border-white bg-black hover:bg-white hover:text-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* STATE: BITE (FISH ON! REEL!) */}
        {fishingState === 'BITE' && (
          <motion.div
            key="bite-hud"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [1, 1.05, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 0.35 }}
            className="pointer-events-auto flex flex-col items-center gap-2"
          >
            <button
              id="btn-hook-fish"
              onClick={onHookFish}
              className="px-8 sm:px-12 py-3.5 sm:py-4 bg-white text-black font-black text-base sm:text-xl uppercase tracking-widest border-4 border-black shadow-[6px_6px_0px_0px_#000000] flex items-center gap-3 cursor-pointer touch-none select-none hover:bg-black hover:text-white"
            >
              <AlertTriangle className="w-6 h-6 animate-pulse" />
              <span>FISH ON! HOOK!</span>
              <span className="hidden sm:inline-block text-xs font-mono border-2 border-current px-2 py-0.5">
                [SPACE]
              </span>
            </button>
          </motion.div>
        )}

        {/* STATE: HOOKED or REELING */}
        {(fishingState === 'HOOKED' || fishingState === 'REELING') && (
          <motion.div
            key="reeling-hud"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-auto flex flex-col items-center gap-2.5 w-full max-w-sm sm:max-w-md"
          >
            {/* Tension gauge */}
            <TensionGauge tension={lineTension} isReeling={isReeling} fishDistance={fishDistance} />

            <div className="flex items-center gap-2 w-full font-mono">
              {/* Reel Action Button */}
              <button
                id="btn-reel-action"
                onPointerDown={onStartReel}
                onPointerUp={onStopReel}
                onPointerCancel={onStopReel}
                className={`flex-1 py-3 sm:py-3.5 font-black text-sm sm:text-base uppercase tracking-widest border-2 sm:border-4 transition-all cursor-pointer select-none touch-none ${
                  isReeling
                    ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_#ffffff]'
                    : 'bg-black text-white border-white hover:bg-[#222222] shadow-[4px_4px_0px_0px_#ffffff]'
                }`}
              >
                <span>{isReeling ? 'REELING IN...' : 'HOLD TO REEL'}</span>
                <span className="hidden sm:inline-block ml-2 text-xs border border-current px-1 py-0.5">
                  [SPACE]
                </span>
              </button>

              {/* Emergency Cut Line */}
              <button
                id="btn-cut-line"
                onClick={onResetToIdle}
                title="Cut Line"
                className="p-3 sm:p-3.5 bg-black text-white border-2 sm:border-4 border-white hover:bg-white hover:text-black transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STATE: CANCELLED or FAILED */}
        {fishingState === 'CANCELLED' && (
          <motion.div
            key="failed-hud"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto bg-black text-white border-2 sm:border-4 border-white p-3 sm:p-4 shadow-[4px_4px_0px_0px_#ffffff] flex flex-col items-center gap-2 text-center font-mono select-none"
          >
            <div className="text-xs sm:text-sm font-black uppercase tracking-wider">
              {lineTension >= 0.98 ? 'LINE SNAPPED UNDER TENSION!' : 'FISH ESCAPED!'}
            </div>
            <button
              id="btn-retry-fish"
              onClick={onResetToIdle}
              className="px-5 py-2 bg-white text-black font-black text-xs uppercase tracking-wider border-2 border-black hover:bg-black hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET ROD</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
