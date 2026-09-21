import React from 'react';
import { motion } from 'motion/react';

interface TensionGaugeProps {
  tension: number; // 0 to 1
  isReeling: boolean;
  fishDistance: number;
}

export const TensionGauge: React.FC<TensionGaugeProps> = ({ tension, isReeling, fishDistance }) => {
  // Danger zone starts at 0.78, slack is below 0.2
  const isDanger = tension >= 0.78;
  const isOptimal = tension >= 0.25 && tension < 0.78;
  const isSlack = tension < 0.25;

  let statusText = 'Optimal Tension';
  let statusColor = 'text-emerald-400';
  let barColor = 'bg-emerald-500';

  if (isDanger) {
    statusText = 'HIGH TENSION - RELEASE REEL!';
    statusColor = 'text-rose-400 font-bold animate-pulse';
    barColor = 'bg-rose-500';
  } else if (isSlack) {
    statusText = 'Slack Line - Fish May Slip!';
    statusColor = 'text-amber-400';
    barColor = 'bg-amber-400';
  }

  return (
    <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span>FIGHTING FISH</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-cyan-300 text-sm">
          <span>Distance:</span>
          <span className="font-bold">{fishDistance.toFixed(1)}m</span>
        </div>
      </div>

      {/* Tension Gauge Bar */}
      <div className="relative w-full h-5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        {/* Background zones indicator */}
        <div className="absolute inset-0 flex">
          <div className="w-1/4 h-full bg-amber-500/20 border-r border-slate-700/50" title="Slack" />
          <div className="w-2/4 h-full bg-emerald-500/20 border-r border-slate-700/50" title="Sweet Spot" />
          <div className="w-1/4 h-full bg-rose-500/30" title="Danger Zone" />
        </div>

        {/* Dynamic Tension Fill */}
        <motion.div
          className={`h-full rounded-full transition-colors duration-150 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(2, tension * 100))}%` }}
        />

        {/* Target Sweet Spot Marker */}
        <div className="absolute top-0 bottom-0 left-1/4 right-1/4 border-x-2 border-emerald-400/60 pointer-events-none" />
      </div>

      {/* Status Indicators & Labels */}
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>Slack</span>
        <span className={statusColor}>{statusText}</span>
        <span className="text-rose-400 font-semibold">Snap Risk</span>
      </div>
    </div>
  );
};
