import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FishingState, SupportedLanguage } from '../types';
import { LOCALIZATION } from '../data/localization';
import { Check, X, ChevronDown, ChevronUp, Sparkles, HelpCircle } from 'lucide-react';

interface FishingOnboardingOverlayProps {
  fishingState: FishingState;
  castPower: number;
  lineTension: number;
  language: SupportedLanguage;
  isOpen: boolean;
  onDismiss: () => void;
}

export const FishingOnboardingOverlay: React.FC<FishingOnboardingOverlayProps> = ({
  fishingState,
  castPower,
  lineTension,
  language,
  isOpen,
  onDismiss,
}) => {
  const t = LOCALIZATION[language] || LOCALIZATION.en;
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  // Determine current active step (1: Cast, 2: Hook, 3: Reel) based on fishingState
  const getActiveStep = (state: FishingState): number => {
    switch (state) {
      case 'IDLE':
      case 'CASTING':
        return 1;
      case 'WAITING':
      case 'BITE':
        return 2;
      case 'HOOKED':
      case 'REELING':
        return 3;
      case 'CAUGHT':
        return 4; // Completed
      case 'CANCELLED':
      default:
        return 1;
    }
  };

  const currentStep = getActiveStep(fishingState);
  const displayStep = selectedStep !== null ? selectedStep : Math.min(currentStep, 3);

  // Auto-dismiss or celebrate when first fish is caught
  useEffect(() => {
    if (fishingState === 'CAUGHT') {
      const timer = window.setTimeout(() => {
        onDismiss();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [fishingState, onDismiss]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-12 sm:top-14 inset-x-0 z-40 flex flex-col items-center pointer-events-none px-3 select-none">
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -15, scale: 0.96 }}
        className="pointer-events-auto w-full max-w-xl bg-black/95 text-white border-2 sm:border-4 border-white font-mono shadow-[6px_6px_0px_0px_#ffffff] p-3 sm:p-4 backdrop-blur-md"
      >
        {/* HEADER BAR */}
        <div className="flex items-center justify-between border-b-2 border-white/30 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-white text-black px-1.5 py-0.5 text-[10px] font-black tracking-widest uppercase">
              FIELD GUIDE
            </span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              FIRST FISHING SESSION
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="px-2 py-1 bg-black border border-white hover:bg-white hover:text-black transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              title={isMinimized ? 'Expand Guide' : 'Minimize Guide'}
            >
              {isMinimized ? (
                <>
                  <span>EXPAND</span>
                  <ChevronDown className="w-3 h-3" />
                </>
              ) : (
                <>
                  <span>MIN</span>
                  <ChevronUp className="w-3 h-3" />
                </>
              )}
            </button>
            <button
              onClick={onDismiss}
              className="p-1 border border-white bg-black hover:bg-white hover:text-black transition-colors cursor-pointer"
              title="Close Guide"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* STEP-BY-STEP VISUAL PROGRESS INDICATOR */}
        <div className="grid grid-cols-3 gap-2 relative mb-3">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-white/20 -translate-y-1/2 z-0 hidden sm:block" />

          {/* STEP 1: CAST */}
          <button
            onClick={() => setSelectedStep(1)}
            className={`relative z-10 p-2 text-left border-2 transition-all cursor-pointer flex flex-col gap-1 ${
              currentStep === 1
                ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_#ffffff]'
                : currentStep > 1
                ? 'bg-black text-white/80 border-white/60 hover:border-white'
                : 'bg-black text-white/50 border-white/30 hover:border-white/60'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black tracking-wider">01. CAST</span>
              {currentStep > 1 ? (
                <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-black">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              ) : currentStep === 1 ? (
                <span className="w-2 h-2 rounded-full bg-black animate-ping" />
              ) : null}
            </div>
            <div className="text-[9px] uppercase font-bold tracking-tight truncate">
              {currentStep === 1 ? 'HOLD & RELEASE' : 'LAUNCH BOBBER'}
            </div>
          </button>

          {/* STEP 2: HOOK */}
          <button
            onClick={() => setSelectedStep(2)}
            className={`relative z-10 p-2 text-left border-2 transition-all cursor-pointer flex flex-col gap-1 ${
              currentStep === 2
                ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_#ffffff]'
                : currentStep > 2
                ? 'bg-black text-white/80 border-white/60 hover:border-white'
                : 'bg-black text-white/50 border-white/30 hover:border-white/60'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black tracking-wider">02. HOOK</span>
              {currentStep > 2 ? (
                <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-black">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              ) : currentStep === 2 ? (
                <span className="w-2 h-2 rounded-full bg-black animate-ping" />
              ) : null}
            </div>
            <div className="text-[9px] uppercase font-bold tracking-tight truncate">
              {fishingState === 'BITE' ? 'STRIKE NOW!' : 'WAIT FOR BITE'}
            </div>
          </button>

          {/* STEP 3: REEL */}
          <button
            onClick={() => setSelectedStep(3)}
            className={`relative z-10 p-2 text-left border-2 transition-all cursor-pointer flex flex-col gap-1 ${
              currentStep === 3
                ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_#ffffff]'
                : currentStep > 3
                ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_#ffffff]'
                : 'bg-black text-white/50 border-white/30 hover:border-white/60'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-black tracking-wider">03. REEL</span>
              {currentStep >= 4 ? (
                <span className="w-4 h-4 rounded-full bg-white text-black flex items-center justify-center text-[9px] font-black">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              ) : currentStep === 3 ? (
                <span className="w-2 h-2 rounded-full bg-black animate-ping" />
              ) : null}
            </div>
            <div className="text-[9px] uppercase font-bold tracking-tight truncate">
              {currentStep === 3 ? 'MANAGE TENSION' : 'BRING IT IN'}
            </div>
          </button>
        </div>

        {/* EXPANDED CONTENT VIEW */}
        <AnimatePresence mode="wait">
          {!isMinimized && (
            <motion.div
              key={`step-detail-${displayStep}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="bg-[#111111] border border-white/40 p-2.5 sm:p-3 flex flex-col sm:flex-row gap-3 items-center"
            >
              {/* VISUAL DIAGRAM SVG */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-black border-2 border-white flex items-center justify-center relative p-1 overflow-hidden">
                {displayStep === 1 && (
                  /* Step 1 SVG Diagram: Rod & Arc Launch */
                  <svg viewBox="0 0 100 100" className="w-full h-full text-white">
                    {/* Water Level */}
                    <line x1="10" y1="80" x2="90" y2="80" stroke="white" strokeWidth="2" strokeDasharray="3 3" />
                    {/* Dock */}
                    <rect x="5" y="75" width="25" height="15" fill="none" stroke="white" strokeWidth="2" />
                    {/* Rod */}
                    <line x1="25" y1="70" x2="50" y2="35" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    {/* Cast Flight Arc */}
                    <path
                      d="M 50 35 Q 75 15 80 80"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeDasharray="4 2"
                    />
                    {/* Bobber Landing */}
                    <circle cx="80" cy="80" r="4" fill="white" />
                    {/* Power indicator arrow */}
                    <path d="M 45 25 L 55 15 L 65 25" fill="none" stroke="white" strokeWidth="2" />
                  </svg>
                )}

                {displayStep === 2 && (
                  /* Step 2 SVG Diagram: Bobber Float & Bite Splash */
                  <svg viewBox="0 0 100 100" className="w-full h-full text-white">
                    {/* Water ripples */}
                    <ellipse cx="50" cy="65" rx="35" ry="10" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 2" />
                    <ellipse cx="50" cy="65" rx="20" ry="6" fill="none" stroke="white" strokeWidth="2" />
                    {/* Bobber */}
                    <circle cx="50" cy="58" r="8" fill="white" stroke="black" strokeWidth="2" />
                    <line x1="50" y1="42" x2="50" y2="58" stroke="white" strokeWidth="2.5" />
                    {/* Splashes */}
                    <path d="M 38 48 Q 40 40 35 35" fill="none" stroke="white" strokeWidth="2" />
                    <path d="M 62 48 Q 60 40 65 35" fill="none" stroke="white" strokeWidth="2" />
                    <circle cx="34" cy="32" r="1.5" fill="white" />
                    <circle cx="66" cy="32" r="1.5" fill="white" />
                    {/* Hook strike prompt */}
                    <text x="50" y="26" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace">
                      ! ! !
                    </text>
                  </svg>
                )}

                {displayStep === 3 && (
                  /* Step 3 SVG Diagram: Reel Tension Meter */
                  <svg viewBox="0 0 100 100" className="w-full h-full text-white">
                    {/* Tension Meter Arc */}
                    <path
                      d="M 20 70 A 35 35 0 0 1 80 70"
                      fill="none"
                      stroke="#444444"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    {/* Sweet spot zone */}
                    <path
                      d="M 40 37 A 35 35 0 0 1 68 45"
                      fill="none"
                      stroke="white"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    {/* Needle */}
                    <line x1="50" y1="70" x2="55" y2="35" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="50" cy="70" r="5" fill="white" />
                    {/* Label */}
                    <text x="50" y="85" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="monospace">
                      SWEET SPOT
                    </text>
                  </svg>
                )}

                {/* Step badge in corner */}
                <span className="absolute bottom-1 right-1 text-[8px] font-black bg-white text-black px-1">
                  0{displayStep}
                </span>
              </div>

              {/* INSTRUCTION TEXT & CONTROLS */}
              <div className="flex-1 flex flex-col justify-center gap-1.5 text-left w-full">
                {displayStep === 1 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-white tracking-wider">
                        STEP 1: CAST THE LINE
                      </span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 border border-white/40">
                        SPACE / CAST BUTTON
                      </span>
                    </div>
                    <p className="text-[11px] text-[#cccccc] leading-relaxed uppercase">
                      Hold the <span className="text-white font-bold">[SPACE]</span> key or the <span className="text-white font-bold">CAST</span> button to charge power. Release when the gauge fills to launch the bobber into the lake.
                    </p>
                    {fishingState === 'CASTING' && (
                      <div className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 border border-white/30 flex items-center justify-between">
                        <span>POWER: {Math.round(castPower * 100)}%</span>
                        <span className="animate-pulse">RELEASE TO LAUNCH!</span>
                      </div>
                    )}
                  </>
                )}

                {displayStep === 2 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-white tracking-wider">
                        STEP 2: WAIT & HOOK
                      </span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 border border-white/40">
                        TAP ON SPLASH
                      </span>
                    </div>
                    <p className="text-[11px] text-[#cccccc] leading-relaxed uppercase">
                      Watch the bobber on the water. When a fish bites, you will see a splash and <span className="text-white font-bold">[FISH ON!]</span> will flash. Press immediately to set the hook!
                    </p>
                    {fishingState === 'BITE' ? (
                      <div className="text-[10px] font-black bg-white text-black px-2 py-1 animate-bounce flex items-center justify-between">
                        <span>FISH ON!</span>
                        <span>PRESS [SPACE] NOW!</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#999999] italic">
                        [Float is floating. Stay calm and wait for the bite...]
                      </div>
                    )}
                  </>
                )}

                {displayStep === 3 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-white tracking-wider">
                        STEP 3: REEL & BALANCE TENSION
                      </span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 border border-white/40">
                        HOLD & RELEASE
                      </span>
                    </div>
                    <p className="text-[11px] text-[#cccccc] leading-relaxed uppercase">
                      Hold <span className="text-white font-bold">[SPACE]</span> or <span className="text-white font-bold">HOLD TO REEL</span> to pull the fish in. If tension spikes near the red danger zone, let go briefly so the line doesn't snap!
                    </p>
                    {(fishingState === 'HOOKED' || fishingState === 'REELING') && (
                      <div className="text-[10px] font-bold text-white bg-white/10 px-2 py-1 border border-white/30 flex items-center justify-between">
                        <span>TENSION: {Math.round(lineTension * 100)}%</span>
                        <span className={lineTension > 0.8 ? 'text-red-400 font-black animate-pulse' : 'text-white'}>
                          {lineTension > 0.8 ? 'WARNING: RELEASE REEL!' : lineTension > 0.4 ? 'PERFECT TENSION' : 'HOLD REEL TO PULL'}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTTOM ACTION BAR */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/20 text-[10px]">
          <span className="text-white/60 uppercase">
            {currentStep === 4 ? 'FIRST CATCH COMPLETE!' : 'TUTORIAL AUTO-COMPLETES ON CATCH'}
          </span>
          <button
            id="btn-dismiss-onboarding"
            onClick={onDismiss}
            className="px-3 py-1 bg-white text-black font-black uppercase tracking-widest border border-white hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
          >
            GOT IT
          </button>
        </div>
      </motion.div>
    </div>
  );
};
