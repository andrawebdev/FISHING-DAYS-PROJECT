import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FishSpecies, FishRarity, CatchRecord, SupportedLanguage } from '../types';
import { FISH_DATABASE } from '../data/fishDatabase';
import { LOCALIZATION } from '../data/localization';
import { X, Trophy, Sparkles, HelpCircle, Sun, CloudRain, Clock } from 'lucide-react';

interface FishCollectionModalProps {
  unlockedCatches: Record<string, CatchRecord>;
  language: SupportedLanguage;
  onClose: () => void;
}

export const FishCollectionModal: React.FC<FishCollectionModalProps> = ({
  unlockedCatches,
  language,
  onClose,
}) => {
  const t = LOCALIZATION[language] || LOCALIZATION.en;
  const [selectedRarity, setSelectedRarity] = useState<FishRarity | 'ALL'>('ALL');
  const [selectedFish, setSelectedFish] = useState<FishSpecies | null>(FISH_DATABASE[0]);

  const filteredList = FISH_DATABASE.filter((fish) =>
    selectedRarity === 'ALL' ? true : fish.rarity === selectedRarity
  );

  const totalCaughtCount = Object.keys(unlockedCatches).length;

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
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-100">{t.collection}</h2>
              <span className="text-xs text-cyan-400 font-semibold">
                Discovered: {totalCaughtCount} / {FISH_DATABASE.length} species
              </span>
            </div>
          </div>
          <button
            id="btn-close-collection"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
          {(['ALL', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'] as const).map(
            (tier) => (
              <button
                key={tier}
                onClick={() => setSelectedRarity(tier)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedRarity === tier
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tier}
              </button>
            )
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-hidden">
          {/* Fish List (Left / Center) */}
          <div className="md:col-span-7 overflow-y-auto pr-1 flex flex-col gap-2">
            {filteredList.map((fish) => {
              const record = unlockedCatches[fish.id];
              const isCaught = !!record;
              const isSelected = selectedFish?.id === fish.id;

              return (
                <div
                  key={fish.id}
                  onClick={() => setSelectedFish(fish)}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400 shadow-lg'
                      : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                        isCaught
                          ? 'border-cyan-500/40'
                          : 'border-slate-800 bg-slate-900 text-slate-600'
                      }`}
                      style={{
                        backgroundColor: isCaught ? fish.color + '22' : undefined,
                      }}
                    >
                      {isCaught ? (
                        <span className="text-xl">🐟</span>
                      ) : (
                        <HelpCircle className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-bold ${
                          isCaught ? 'text-slate-100' : 'text-slate-500'
                        }`}
                      >
                        {isCaught ? fish.name : 'Unknown Specimen ???'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {fish.rarity} • {fish.habitat}
                      </span>
                    </div>
                  </div>

                  {isCaught ? (
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {record.weight.toFixed(1)} kg
                      </span>
                      <span className="block text-[10px] text-slate-400">Max Caught</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-600 italic">Undiscovered</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Detailed Info Card (Right) */}
          <div className="md:col-span-5 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto">
            {selectedFish ? (
              (() => {
                const record = unlockedCatches[selectedFish.id];
                const isCaught = !!record;

                return (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300">
                        {selectedFish.rarity}
                      </span>
                      {isCaught && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <Trophy className="w-3.5 h-3.5" /> Caught in Livewell
                        </span>
                      )}
                    </div>

                    {/* Silhouette or Discovered art */}
                    <div className="w-full h-36 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-center relative overflow-hidden">
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: `radial-gradient(circle, ${selectedFish.color} 0%, transparent 70%)`,
                        }}
                      />
                      {isCaught ? (
                        <div className="text-5xl drop-shadow-lg">🐟</div>
                      ) : (
                        <div className="text-4xl text-slate-700 opacity-60">❓</div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-100">
                        {isCaught ? selectedFish.name : 'Mysterious Silhouette'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {isCaught
                          ? selectedFish.description
                          : 'Explore the waters with improved bait, and watch for ripple silhouettes at different times of day.'}
                      </p>
                    </div>

                    {/* Habitat & Clues */}
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Habitat:</span>
                        <span className="font-semibold text-slate-200">{selectedFish.habitat}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Expected Size:</span>
                        <span className="font-mono text-cyan-300">
                          {selectedFish.minWeight}kg - {selectedFish.maxWeight}kg
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Base Value:</span>
                        <span className="font-mono text-amber-300">
                          ${selectedFish.baseValue} coins
                        </span>
                      </div>
                    </div>

                    {/* Weather & Time Preferences */}
                    <div className="flex flex-col gap-1.5 text-xs">
                      <span className="text-slate-400 font-semibold">Active Conditions:</span>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>{selectedFish.preferredWeather.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{selectedFish.preferredTime.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Select a species to view biology
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
