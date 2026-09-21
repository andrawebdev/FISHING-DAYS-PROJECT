import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FishingState, SupportedLanguage } from '../types';
import { LOCALIZATION } from '../data/localization';
import { TensionGauge } from './TensionGauge';
import { Anchor, AlertCircle, Compass, XCircle } from 'lucide-react';

interface FishingHUDProps {
  fishingState: FishingState;
  castPower: number;
  lineTension: number;
  fishDistance: number;
  isReeling: boolean;
  canFish: boolean;
  language: SupportedLanguage;
  isPaused: boolean;
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
  isReeling,
  canFish,
  language,
  isPaused,
  onStartCastCharge,
  onReleaseCastCharge,
  onHookFish,
  onStartReel,
  onStopReel,
  onResetToIdle,
}) => {
  const t = LOCALIZATION[language] || LOCALIZATION.en;
  const [isChargingCast, setIsChargingCast] = useState(false);
  const isChargingRef = useRef(false);

  // Sync ref
  useEffect(() => {
    isChargingRef.current = isChargingCast;
  }, [isChargingCast]);

  // If state moves away from PREPARING/IDLE, clear charging state safely
  useEffect(() => {
    if (fishingState !== 'IDLE' && fishingState !== 'PREPARING') {
      setIsChargingCast(false);
      isChargingRef.current = false;
    }
  }, [fishingState]);

  // Robust Cast Start
  const handleStartCast = useCallback(() => {
    if (isPaused || fishingState !== 'IDLE' || !canFish) return;
    setIsChargingCast(true);
    isChargingRef.current = true;
    onStartCastCharge();
  }, [isPaused, fishingState, canFish, onStartCastCharge]);

  // Robust Cast Release
  const handleReleaseCast = useCallback(() => {
    if (!isChargingRef.current) return;
    setIsChargingCast(false);
    isChargingRef.current = false;
    onReleaseCastCharge();
  }, [onReleaseCastCharge]);

  // Keyboard controls with repeat lock and event prevention
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return;
      if (e.repeat) return; // Prevent key repeat spam

      if (e.code === 'Space') {
        e.preventDefault();
        if (fishingState === 'IDLE') {
          handleStartCast();
        } else if (fishingState === 'BITE') {
          onHookFish();
        } else if (fishingState === 'FISH_STRUGGLING' || fishingState === 'REELING') {
          onStartReel();
        }
      } else if (e.code === 'Escape') {
        if (fishingState !== 'IDLE') {
          e.preventDefault();
          onResetToIdle();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (isChargingRef.current) {
          handleReleaseCast();
        } else if (fishingState === 'REELING' || fishingState === 'FISH_STRUGGLING') {
          onStopReel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isPaused,
    fishingState,
    handleStartCast,
    handleReleaseCast,
    onHookFish,
    onStartReel,
    onStopReel,
    onResetToIdle,
  ]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 sm:bottom-6 flex flex-col items-center justify-end px-3 sm:px-4 z-20">
      <AnimatePresence mode="wait">
        {/* 1. IDLE / PREPARING: CAST BUTTON & POWER METER */}
        {(fishingState === 'IDLE' || fishingState === 'PREPARING') && (
          <motion.div
            key="idle-hud"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="pointer-events-auto flex flex-col items-center gap-2.5 max-w-xs sm:max-w-md w-full"
          >
            {/* Cast Power Meter while charging */}
            {isChargingCast && (
              <div className="w-56 sm:w-64 bg-slate-900/90 border border-slate-700/80 p-2 rounded-xl backdrop-blur-md shadow-xl flex flex-col gap-1 text-center">
                <div className="flex justify-between text-xs text-cyan-300 font-semibold">
                  <span>Cast Power</span>
                  <span>{Math.round(castPower * 100)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-75"
                    style={{ width: `${castPower * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* If player is too far from water/dock */}
            {!canFish ? (
              <div className="px-4 py-2 bg-slate-900/90 border border-amber-500/50 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-2 text-amber-200 text-xs sm:text-sm font-medium">
                <Compass className="w-4 h-4 text-amber-400 animate-spin" />
                <span>Move closer to the dock or lake water to cast.</span>
              </div>
            ) : (
              <button
                id="btn-cast-rod"
                onPointerDown={handleStartCast}
                onPointerUp={handleReleaseCast}
                onPointerCancel={handleReleaseCast}
                className="w-full sm:w-auto px-7 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 active:scale-95 text-white font-bold text-base sm:text-lg rounded-2xl shadow-xl shadow-cyan-950/50 border border-cyan-400/40 flex items-center justify-center gap-2.5 transition-transform cursor-pointer touch-none"
              >
                <Compass className="w-5 h-5 animate-pulse text-cyan-200" />
                <span>{isChargingCast ? t.casting : t.holdToAim}</span>
                <span className="hidden sm:inline-block text-[11px] bg-black/30 px-2 py-0.5 rounded-md text-cyan-200 font-mono">
                  [SPACE]
                </span>
              </button>
            )}
          </motion.div>
        )}

        {/* 2. BOBBER ACTIVE / FISH APPROACHING */}
        {(fishingState === 'BOBBER_ACTIVE' || fishingState === 'FISH_APPROACHING') && (
          <motion.div
            key="bobber-hud"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3"
          >
            <div className="relative flex items-center justify-center w-7 h-7">
              <span className="absolute w-full h-full rounded-full bg-cyan-400/30 animate-ping" />
              <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-semibold text-slate-100">
                {fishingState === 'FISH_APPROACHING' ? t.fishApproaching : t.watchingBobber}
              </span>
              <span className="text-[10px] text-cyan-300/80">Keep eyes on the water ripples...</span>
            </div>

            {/* Quick Cancel Button */}
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

        {/* 3. BITE! STRIKE ALERT */}
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
              className="px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 active:scale-95 text-white font-extrabold text-lg sm:text-xl rounded-2xl shadow-2xl shadow-red-900/80 border-2 border-amber-300 flex items-center gap-2.5 cursor-pointer animate-bounce touch-none"
            >
              <AlertCircle className="w-6 h-6 text-yellow-200 animate-spin" />
              <span>{t.biteAlert}</span>
              <span className="hidden sm:inline-block text-xs bg-black/40 px-2 py-0.5 rounded text-amber-200 font-mono">
                [SPACE]
              </span>
            </button>
          </motion.div>
        )}

        {/* 4. HOOKED / STRUGGLING / REELING */}
        {(fishingState === 'HOOKED' || fishingState === 'FISH_STRUGGLING' || fishingState === 'REELING') && (
          <motion.div
            key="reeling-hud"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pointer-events-auto flex flex-col items-center gap-2.5 w-full max-w-sm sm:max-w-md"
          >
            {/* Tension physics gauge */}
            <TensionGauge tension={lineTension} isReeling={isReeling} fishDistance={fishDistance} />

            <div className="flex items-center gap-2 w-full">
              {/* Reel Control Button */}
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

        {/* 5. FAILED RECOVERY */}
        {fishingState === 'FAILED' && (
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
              className="px-5 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 cursor-pointer"
            >
              Reset Rod
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
