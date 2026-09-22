import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyMission } from '../types';
import { X, CheckCircle, Gift, Award, ArrowRight } from 'lucide-react';

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: DailyMission[];
  onClaim: (missionId: string) => void;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  isOpen,
  onClose,
  missions,
  onClaim,
}) => {
  if (!isOpen) return null;

  const completedCount = missions.filter((m) => m.completed).length;
  const claimedCount = missions.filter((m) => m.claimed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="relative w-full max-w-lg bg-black text-white border-4 border-white p-5 sm:p-6 shadow-[8px_8px_0px_0px_#ffffff] font-mono select-none max-h-[85vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-white pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-white" />
            <h2 className="text-base sm:text-lg font-black tracking-widest uppercase">
              DAILY MISSIONS
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold border border-white px-2 py-0.5 bg-white text-black">
              {completedCount}/{missions.length} COMPLETED
            </span>
            <button
              id="btn-close-daily-missions"
              onClick={onClose}
              className="p-1 border-2 border-white hover:bg-white hover:text-black transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtitle instructions */}
        <div className="text-xs uppercase opacity-75 mb-3 tracking-wider">
          Complete daily tasks during your fishing sessions to earn bonus coin rewards.
        </div>

        {/* Mission List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {missions.map((mission) => {
            const isCompleted = mission.completed;
            const isClaimed = mission.claimed;
            const progressPct = Math.min(100, Math.round((mission.currentCount / mission.targetCount) * 100));

            return (
              <div
                key={mission.id}
                className={`p-3.5 border-2 transition-all ${
                  isClaimed
                    ? 'border-[#444444] bg-[#111111] opacity-60'
                    : isCompleted
                    ? 'border-white bg-[#222222] shadow-[4px_4px_0px_0px_#ffffff]'
                    : 'border-white/70 bg-black'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                      {mission.title}
                    </h3>
                    <p className="text-[11px] opacity-80 mt-0.5">{mission.description}</p>
                  </div>
                  <span className="text-xs font-black shrink-0 px-2 py-0.5 bg-white text-black">
                    +${mission.rewardCoins}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-[#111111] border border-white overflow-hidden my-2">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 text-[11px]">
                  <span className="opacity-80">
                    PROGRESS: {mission.currentCount} / {mission.targetCount}
                  </span>

                  {isClaimed ? (
                    <span className="text-[10px] font-black uppercase text-[#888888] flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> REWARD CLAIMED
                    </span>
                  ) : isCompleted ? (
                    <button
                      id={`btn-claim-mission-${mission.id}`}
                      onClick={() => onClaim(mission.id)}
                      className="px-3 py-1 bg-white text-black font-black uppercase tracking-wider text-xs border border-white hover:bg-black hover:text-white transition cursor-pointer flex items-center gap-1 animate-pulse"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>CLAIM ${mission.rewardCoins}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] uppercase font-bold opacity-60">
                      IN PROGRESS
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Close Action */}
        <div className="mt-4 pt-3 border-t-2 border-white flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black font-black text-xs uppercase tracking-widest border-2 border-white hover:bg-black hover:text-white transition cursor-pointer"
          >
            RETURN TO LAKE
          </button>
        </div>
      </motion.div>
    </div>
  );
};
