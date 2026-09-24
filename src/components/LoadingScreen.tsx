import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export interface LoadingScreenProps {
  progress: number;
  statusText: string;
  error?: string | null;
  isComplete: boolean;
  onRetry?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  statusText,
  error,
  isComplete,
  onRetry,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          id="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 bg-[#000000] text-white flex flex-col items-center justify-center p-6 select-none font-mono"
        >
          {/* Maximalist Graphic Frame */}
          <div className="w-full max-w-md border-4 border-white p-6 sm:p-8 bg-[#000000] shadow-[8px_8px_0px_0px_#ffffff] flex flex-col items-center gap-6">
            {/* Title Header */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <span className="text-[10px] sm:text-xs tracking-[0.3em] font-black uppercase text-[#888888]">
                3D COZY INDIE
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-widest uppercase text-white">
                FISHING DAYS
              </h1>
              <span className="text-[10px] sm:text-xs tracking-[0.25em] font-bold uppercase text-[#aaaaaa]">
                FISHING & EXPLORATION
              </span>
              <div className="w-20 h-1 bg-white mt-1" />
            </div>

            {/* Error or Progress State */}
            {error ? (
              <div className="w-full flex flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-2 text-white bg-[#222222] border-2 border-white px-3 py-1.5 text-xs font-black uppercase">
                  <AlertTriangle className="w-4 h-4 text-white" />
                  <span>SOMETHING WENT WRONG</span>
                </div>
                <p className="text-xs text-[#888888] leading-relaxed max-w-xs">{error}</p>
                {onRetry && (
                  <button
                    id="btn-loading-retry"
                    onClick={onRetry}
                    className="mt-2 px-6 py-2.5 bg-white text-black font-black text-xs uppercase tracking-widest border-2 border-white hover:bg-black hover:text-white transition-colors cursor-pointer flex items-center gap-2 shadow-[4px_4px_0px_0px_#ffffff]"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>RETRY</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full flex flex-col gap-3">
                {/* Status text & percentage */}
                <div className="flex justify-between items-baseline text-xs font-black tracking-wider uppercase">
                  <span className="truncate max-w-[240px] text-white">
                    {clampedProgress >= 100 ? 'READY' : statusText || 'LOADING...'}
                  </span>
                  <span className="text-sm bg-white text-black px-2 py-0.5 ml-2 font-mono">
                    {clampedProgress}%
                  </span>
                </div>

                {/* Segmented High-Contrast Progress Bar */}
                <div className="w-full h-5 border-2 border-white bg-black p-0.5 flex">
                  <div
                    className="h-full bg-white transition-all duration-150 ease-out"
                    style={{ width: `${clampedProgress}%` }}
                  />
                </div>

                {/* Progress details indicator */}
                <div className="flex justify-between items-center text-[10px] text-[#888888] tracking-widest uppercase mt-1">
                  <span>STAGE {clampedProgress < 25 ? '1/4' : clampedProgress < 60 ? '2/4' : clampedProgress < 90 ? '3/4' : '4/4'}</span>
                  <span>{clampedProgress >= 100 ? 'READY' : 'LOADING WORLD'}</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
