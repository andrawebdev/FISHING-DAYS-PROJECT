import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FishingState, SupportedLanguage } from '../types';
import { LOCALIZATION } from '../data/localization';
import { TensionGauge } from './TensionGauge';
import { Compass, AlertCircle, Anchor, XCircle, RotateCcw } from 'lucide-react';

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

  // Pointer event handlers to prevent mobile double-tap / ghost firing
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
    <div className="fixed inset-x-0 bottom-6 sm:bottom-8 z-20 flex flex-col items-center justify-end pointer-events-none px-4">
      {/* 1. POSITIONING HINT WHEN OFF DOCK */}
      {!canFish && fishingState === 'IDLE' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 px-4 py-2 bg-slate-900/90 border border-amber-500/50 backdrop-blur-md rounded-2xl shadow-xl text-amber-200 text-xs sm:text-sm font-medium flex items-center gap-2 pointer-events-auto"
        >
          <Compass className="w-4 h-4 text-amber-400 animate-spin" />
          <span>Walk forward onto the dock edge to cast your line</span>
        </motion.div>
      )}

      {/* 2. CASTING POWER METER */}
      {isChargingCast && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="mb-3 bg-slate-900/90 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col items-center gap-2 pointer-events-auto w-64 sm:w-80"
        >
          <div className="flex justify-between w-full text-xs font-bold text-slate-300">
            <span>{t.castingPower}</span>
            <span className="text-cyan-400 font-mono">{Math.round(castPower * 100)}%</span>
          </div>

          <div className="relative w-full h-4 sm:h-5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 rounded-full"
              style={{ width: `${Math.round(castPower * 100)}%` }}
            />
            {/* Target sweet spot marker */}
            <div className="absolute top-0 bottom-0 left-[65%] right-[15%] border-x border-dashed border-yellow-300/80 bg-yellow-400/10 pointer-events-none" />
          </div>

          <span className="text-[11px] text-cyan-200/90 font-medium">Release to cast into the water</span>
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
            className="pointer-events-auto"
          >
            <button
              id="btn-cast-rod"
              onPointerDown={handleStartCast}
              onPointerUp={handleReleaseCast}
              onPointerCancel={handleReleaseCast}
              className="px-8 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 active:scale-95 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl shadow-cyan-950/50 border border-cyan-400/40 flex items-center justify-center gap-2.5 transition-transform cursor-pointer touch-none select-none"
            >
              <Compass className="w-5 h-5 animate-pulse text-cyan-200" />
              <span>{isChargingCast ? t.casting : t.holdToAim}</span>
              <span className="hidden sm:inline-block text-[11px] bg-black/30 px-2 py-0.5 rounded-md text-cyan-200 font-mono">
                [SPACE]
              </span>
            </button>
          </motion.div>
        )}

        {/* STATE: WAITING */}
        {fishingState === 'WAITING' && (
          <motion.div
            key="waiting-hud"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3.5"
          >
            <div className="relative flex items-center justify-center w-7 h-7">
              <span className="absolute w-full h-full rounded-full bg-cyan-400/30 animate-ping" />
              <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-slate-100">
                {t.watchingBobber}
              </span>
              <span className="text-[11px] text-cyan-300/80">Watching water ripples...</span>
            </div>

            {/* Cancel Cast Button */}
            <button
              id="btn-cancel-fishing"
              onClick={onResetToIdle}
              title="Cancel Cast"
              className="ml-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* STATE: BITE */}
        {fishingState === 'BITE' && (
          <motion.div
            key="bite-hud"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [1, 1.06, 1], opacity: 1 }}
            transition={{ repeat: Infinity, duration: 0.4 }}
            className="pointer-events-auto flex flex-col items-center gap-2"
          >
            <button
              id="btn-hook-fish"
              onClick={onHookFish}
              className="px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 active:scale-95 text-white font-extrabold text-lg sm:text-xl rounded-2xl shadow-2xl shadow-red-900/80 border-2 border-amber-300 flex items-center gap-2.5 cursor-pointer animate-bounce touch-none select-none"
            >
              <AlertCircle className="w-6 h-6 text-yellow-200 animate-spin" />
              <span>{t.biteAlert}</span>
              <span className="hidden sm:inline-block text-xs bg-black/40 px-2 py-0.5 rounded text-amber-200 font-mono">
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
            {/* Tension gauge physics */}
            <TensionGauge tension={lineTension} isReeling={isReeling} fishDistance={fishDistance} />

            <div className="flex items-center gap-2 w-full">
              {/* Reel Button */}
              <button
                id="btn-reel-action"
                onPointerDown={onStartReel}
                onPointerUp={onStopReel}
                onPointerCancel={onStopReel}
                className={`flex-1 py-3 sm:py-3.5 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl border flex items-center justify-center gap-2.5 transition-all cursor-pointer select-none touch-none ${
                  isReeling
                    ? 'bg-amber-600 border-amber-300 scale-[0.98] shadow-amber-900/50'
                    : 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 hover:brightness-110'
                }`}
              >
                <Anchor className={`w-5 h-5 ${isReeling ? 'animate-spin' : ''}`} />
                <span>{isReeling ? 'REELING IN...' : t.reelingAction}</span>
                <span className="hidden sm:inline-block text-xs bg-black/30 px-2 py-0.5 rounded text-cyan-200 font-mono">
                  [HOLD SPACE]
                </span>
              </button>

              {/* Emergency Cut Line */}
              <button
                id="btn-cut-line"
                onClick={onResetToIdle}
                title="Cut Line"
                className="p-3 sm:p-3.5 bg-slate-900/90 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-400 rounded-2xl transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* STATE: CAUGHT (Catch modal handles details, HUD shows quick reset if needed) */}
        {fishingState === 'CAUGHT' && (
          <motion.div
            key="caught-hud"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto bg-slate-900/90 border border-emerald-500/60 p-3 sm:p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-2 text-center"
          >
            <div className="text-emerald-400 font-bold text-sm">Fish Caught!</div>
            <button
              id="btn-caught-continue"
              onClick={onResetToIdle}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Cast Again
            </button>
          </motion.div>
        )}

        {/* STATE: CANCELLED or FAILED */}
        {fishingState === 'CANCELLED' && (
          <motion.div
            key="failed-hud"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-auto bg-slate-900/90 border border-rose-500/60 p-3 sm:p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-2 text-center"
          >
            <div className="text-rose-400 font-bold text-xs sm:text-sm">
              {lineTension >= 0.98 ? t.lineSnapped : t.escaped}
            </div>
            <button
              id="btn-retry-fish"
              onClick={onResetToIdle}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Rod</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
