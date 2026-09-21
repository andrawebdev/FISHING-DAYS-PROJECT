import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CatchRecord, SupportedLanguage } from '../types';
import { LeaderboardService } from '../services/leaderboardService';
import { LOCALIZATION } from '../data/localization';
import { X, Trophy, Medal, Award, MapPin, Calendar, Clock } from 'lucide-react';

interface LeaderboardModalProps {
  language: SupportedLanguage;
  playerName: string;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  language,
  playerName,
  onClose,
}) => {
  const t = LOCALIZATION[language] || LOCALIZATION.en;
  const records = LeaderboardService.getLeaderboard();
  const [filterRarity, setFilterRarity] = useState<string>('ALL');

  const filtered = records.filter((r) =>
    filterRarity === 'ALL' ? true : r.rarity === filterRarity
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="relative w-full max-w-4xl h-[85vh] bg-slate-900/95 border border-slate-700/80 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col text-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-100">{t.leaderboard}</h2>
              <span className="text-xs text-slate-400">
                Official Hall of Fame for heaviest catches worldwide
              </span>
            </div>
          </div>

          <button
            id="btn-close-leaderboard"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
          {['ALL', 'MYTHIC', 'LEGENDARY', 'EPIC', 'RARE'].map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterRarity(tier)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filterRarity === tier
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>

        {/* Table of Records */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2">
          {filtered.map((record, index) => {
            const isUserRecord = record.caughtBy === playerName;
            const rank = index + 1;

            let rankBadge = (
              <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold font-mono text-xs flex items-center justify-center">
                #{rank}
              </span>
            );

            if (rank === 1) {
              rankBadge = (
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shadow-lg shadow-amber-400/40">
                  <Medal className="w-4 h-4" />
                </div>
              );
            } else if (rank === 2) {
              rankBadge = (
                <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                  <Medal className="w-4 h-4" />
                </div>
              );
            } else if (rank === 3) {
              rankBadge = (
                <div className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs flex items-center justify-center shadow-md">
                  <Award className="w-4 h-4" />
                </div>
              );
            }

            return (
              <div
                key={record.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                  isUserRecord
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-md'
                    : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {rankBadge}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-100">
                        {record.speciesName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono">
                        {record.rarity}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-amber-300 font-semibold">
                        by {record.caughtBy} {isUserRecord ? '(You)' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {record.location}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Weight & Length Metric */}
                <div className="text-right flex flex-col items-end">
                  <span className="text-base font-black font-mono text-cyan-300">
                    {record.weight.toFixed(1)} kg
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {record.length.toFixed(0)} cm • {record.caughtAt.split(' ')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
