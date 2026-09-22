import React from 'react';
import { motion } from 'motion/react';

interface TensionGaugeProps {
  tension: number; // 0 to 1
  isReeling: boolean;
  fishDistance: number;
}

export const TensionGauge: React.FC<TensionGaugeProps> = ({ tension, isReeling, fishDistance }) => {
  const isDanger = tension >= 0.78;
  const isOptimal = tension >= 0.25 && tension < 0.78;
  const isSlack = tension < 0.25;

  let statusText = 'OPTIMAL TENSION';
  if (isDanger) {
    statusText = 'HIGH TENSION — RELEASE REEL!';
  } else if (isSlack) {
    statusText = 'SLACK LINE — RISK OF ESCAPE';
  }

  // Generate ASCII block visual representation (16 blocks total)
  const totalBlocks = 16;
  const filledBlocks = Math.round(tension * totalBlocks);
  const blockString = '█'.repeat(filledBlocks) + '░'.repeat(Math.max(0, totalBlocks - filledBlocks));

  return (
    <div className="w-full max-w-sm sm:max-w-md bg-black text-white border-2 sm:border-4 border-white p-3 sm:p-4 shadow-[4px_4px_0px_0px_#ffffff] flex flex-col gap-2 font-mono select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between text-xs font-black tracking-wider">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 border border-white ${isDanger ? 'bg-white animate-ping' : 'bg-white'}`} />
          <span className="uppercase">FIGHTING FISH</span>
        </div>
        <div className="font-mono text-xs sm:text-sm font-black">
          DIST: <span className="bg-white text-black px-1.5 py-0.5">{fishDistance.toFixed(1)}M</span>
        </div>
      </div>

      {/* Tension Meter Bar - Monochrome High Contrast */}
      <div className="relative w-full h-5 bg-[#222222] border-2 border-white overflow-hidden">
        {/* Sweet spot zone marker */}
        <div className="absolute top-0 bottom-0 left-[25%] right-[25%] bg-[#444444] border-x border-dashed border-white pointer-events-none" />

        {/* Dynamic Tension Fill */}
        <motion.div
          className={`h-full transition-all ${isDanger ? 'bg-white invert animate-pulse' : 'bg-white'}`}
          style={{ width: `${Math.min(100, Math.max(3, tension * 100))}%` }}
        />
      </div>

      {/* ASCII Gauge Display & Status */}
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
        <span className="text-[10px] hidden sm:inline tracking-tighter opacity-80">{blockString}</span>
        <span className={`text-[11px] font-black px-1 ${isDanger ? 'bg-white text-black' : 'text-white'}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
};
