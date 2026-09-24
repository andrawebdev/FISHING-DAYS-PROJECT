import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherType, TimeOfDay } from '../types';
import { Play, RotateCcw, BookOpen, Sliders, Info, AlertTriangle, X } from 'lucide-react';

interface MainMenuProps {
  hasExistingSave: boolean;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  onContinue: () => void;
  onNewGame: () => void;
  onOpenEncyclopedia: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  hasExistingSave,
  weather,
  timeOfDay,
  onContinue,
  onNewGame,
  onOpenEncyclopedia,
  onOpenSettings,
}) => {
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  const handleNewGameClick = () => {
    if (hasExistingSave) {
      setShowNewGameConfirm(true);
    } else {
      onNewGame();
    }
  };

  const handleConfirmNewGame = () => {
    setShowNewGameConfirm(false);
    onNewGame();
  };

  return (
    <div
      id="main-menu"
      className="fixed inset-0 z-40 flex flex-col justify-between p-6 sm:p-10 pointer-events-none select-none font-mono text-white"
    >
      {/* LEFT SIDE: Brand Title & Navigation Buttons */}
      <div className="flex flex-col items-start gap-6 max-w-sm pointer-events-auto">
        {/* Title & Tagline */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="flex flex-col gap-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white text-black text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] shadow-[3px_3px_0px_0px_#000000]">
            <span>INDIE 3D EXPERIENCE</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)]">
            FISHING<br />DAYS
          </h1>

          <div className="w-20 h-1.5 bg-white shadow-[2px_2px_0px_0px_#000000]" />

          <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] mt-1">
            3D COZY INDIE<br />FISHING & EXPLORATION
          </p>
        </motion.div>

        {/* Action Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
          className="flex flex-col gap-2.5 w-60 sm:w-68"
        >
          {/* CONTINUE BUTTON */}
          <button
            id="btn-menu-continue"
            disabled={!hasExistingSave}
            onClick={onContinue}
            className={`w-full py-3 sm:py-3.5 px-4 font-black text-sm uppercase tracking-widest border-2 sm:border-3 transition-all duration-150 flex items-center justify-between shadow-[4px_4px_0px_0px_#ffffff] cursor-pointer ${
              hasExistingSave
                ? 'bg-white text-black border-white hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-black/60 text-[#777777] border-[#444444] shadow-none cursor-not-allowed opacity-50'
            }`}
          >
            <span>CONTINUE</span>
            <Play className="w-4 h-4 fill-current" />
          </button>

          {/* NEW GAME BUTTON */}
          <button
            id="btn-menu-new-game"
            onClick={handleNewGameClick}
            className="w-full py-2.5 sm:py-3 px-4 font-black text-xs sm:text-sm uppercase tracking-widest border-2 border-white bg-black text-white hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center justify-between shadow-[4px_4px_0px_0px_#ffffff] cursor-pointer"
          >
            <span>NEW GAME</span>
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* FISH ENCYCLOPEDIA */}
          <button
            id="btn-menu-encyclopedia"
            onClick={onOpenEncyclopedia}
            className="w-full py-2.5 sm:py-3 px-4 font-black text-xs sm:text-sm uppercase tracking-widest border-2 border-white bg-black text-white hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center justify-between shadow-[4px_4px_0px_0px_#ffffff] cursor-pointer"
          >
            <span>FISH ENCYCLOPEDIA</span>
            <BookOpen className="w-4 h-4" />
          </button>

          {/* SETTINGS / CUSTOMIZATION */}
          <button
            id="btn-menu-settings"
            onClick={onOpenSettings}
            className="w-full py-2 sm:py-2.5 px-4 font-black text-xs uppercase tracking-widest border-2 border-white bg-black text-white hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center justify-between shadow-[3px_3px_0px_0px_#ffffff] cursor-pointer"
          >
            <span>SETTINGS & GEAR</span>
            <Sliders className="w-3.5 h-3.5" />
          </button>

          {/* CREDITS */}
          <button
            id="btn-menu-credits"
            onClick={() => setShowCredits(true)}
            className="w-full py-2 px-4 font-black text-xs uppercase tracking-widest border border-white/80 bg-black/80 text-white hover:bg-white hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 flex items-center justify-between shadow-[2px_2px_0px_0px_#ffffff] cursor-pointer"
          >
            <span>CREDITS</span>
            <Info className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>

      {/* RIGHT / LOWER AREA: Environmental telemetry badge */}
      <div className="self-end pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="bg-black/90 text-white border-2 border-white px-3 sm:px-4 py-2 flex items-center gap-3 shadow-[4px_4px_0px_0px_#ffffff]"
        >
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#888888]">
            LOCATION
          </span>
          <div className="h-3 w-px bg-white/40" />
          <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider">
            <span>{weather.replace('_', ' ')}</span>
            <span className="text-[#888888]">•</span>
            <span>{timeOfDay}</span>
            <span className="text-[#888888]">•</span>
            <span>LAKE DISTRICT</span>
          </div>
        </motion.div>
      </div>

      {/* CONFIRM NEW GAME MODAL */}
      <AnimatePresence>
        {showNewGameConfirm && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 pointer-events-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-sm border-4 border-white bg-black p-6 shadow-[8px_8px_0px_0px_#ffffff] flex flex-col gap-4 text-white"
            >
              <div className="flex items-center gap-2 bg-white text-black px-3 py-1 text-xs font-black uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>CONFIRM NEW GAME</span>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-black uppercase tracking-wider">
                  START NEW GAME?
                </h3>
                <p className="text-xs text-[#aaaaaa] leading-relaxed">
                  CURRENT SAVE WILL BE REPLACED. YOUR FISH RECORDS, COINS, AND UNLOCKED GEAR WILL BE RESET.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  id="btn-cancel-new-game"
                  onClick={() => setShowNewGameConfirm(false)}
                  className="px-4 py-2 border-2 border-white bg-black text-white text-xs font-black uppercase tracking-wider hover:bg-white hover:text-black cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
                >
                  CANCEL
                </button>
                <button
                  id="btn-confirm-new-game"
                  onClick={handleConfirmNewGame}
                  className="px-4 py-2 border-2 border-white bg-white text-black text-xs font-black uppercase tracking-wider hover:bg-[#dddddd] cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
                >
                  NEW GAME
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREDITS MODAL */}
      <AnimatePresence>
        {showCredits && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 pointer-events-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="w-full max-w-md border-4 border-white bg-black p-6 shadow-[8px_8px_0px_0px_#ffffff] flex flex-col gap-5 text-white"
            >
              <div className="flex items-center justify-between border-b-2 border-white pb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span className="text-sm font-black uppercase tracking-widest">CREDITS</span>
                </div>
                <button
                  onClick={() => setShowCredits(false)}
                  className="p-1 border border-white hover:bg-white hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3 text-xs leading-relaxed">
                <div>
                  <h4 className="font-black text-white uppercase tracking-wider text-sm">FISHING DAYS</h4>
                  <p className="text-[#888888]">3D Cozy Indie Fishing & Exploration</p>
                </div>
                <div className="h-px bg-[#333333]" />
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#888888] uppercase block text-[10px]">CREATIVE & CODE</span>
                    <span className="font-bold">FISHING DAYS TEAM</span>
                  </div>
                  <div>
                    <span className="text-[#888888] uppercase block text-[10px]">ENGINE & 3D</span>
                    <span className="font-bold">THREE.JS / WEBGL</span>
                  </div>
                  <div>
                    <span className="text-[#888888] uppercase block text-[10px]">UI ARCHITECTURE</span>
                    <span className="font-bold">REACT + TAILWIND</span>
                  </div>
                  <div>
                    <span className="text-[#888888] uppercase block text-[10px]">AUDIO SYNTHESIS</span>
                    <span className="font-bold">WEB AUDIO API</span>
                  </div>
                </div>
                <div className="h-px bg-[#333333]" />
                <p className="text-[10px] text-[#666666] uppercase">
                  A MONOCHROME MAXIMALIST EXPERIMENT IN TRANQUIL DIGITAL ANGLING.
                </p>
              </div>

              <button
                onClick={() => setShowCredits(false)}
                className="w-full py-2.5 border-2 border-white bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-[#dddddd] cursor-pointer shadow-[3px_3px_0px_0px_#ffffff]"
              >
                CLOSE
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
