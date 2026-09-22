import React, { useState } from 'react';
import { motion } from 'motion/react';
import { FishSpecies, FishRarity, CatchRecord, SupportedLanguage } from '../types';
import { FISH_DATABASE } from '../data/fishDatabase';
import { LOCALIZATION } from '../data/localization';
import { ThreeFishViewer } from './ThreeFishViewer';
import { X, Trophy, Sparkles, HelpCircle, Sun, CloudRain, Clock } from 'lucide-react';

interface FishCollectionModalProps {
  unlockedCatches: Record<string, CatchRecord>;
  language: SupportedLanguage;
  onClose: () => void;
}

const RARITIES: (FishRarity | 'ALL')[] = [
  'ALL',
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="relative w-full max-w-4xl h-[86vh] bg-black text-white border-4 border-white p-4 sm:p-6 shadow-[8px_8px_0px_0px_#ffffff] flex flex-col font-mono select-none overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-white pb-3 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-xl font-black uppercase tracking-widest">
              FISH ENCYCLOPEDIA
            </h2>
            <span className="text-[11px] font-bold bg-white text-black px-2 py-0.5">
              {totalCaughtCount} / {FISH_DATABASE.length} DISCOVERED
            </span>
          </div>

          <button
            id="btn-close-collection"
            onClick={onClose}
            className="p-1 border-2 border-white hover:bg-white hover:text-black transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
          {RARITIES.map((r) => {
            const isSelected = selectedRarity === r;
            return (
              <button
                key={r}
                onClick={() => setSelectedRarity(r)}
                className={`px-3 py-1 text-xs font-black uppercase tracking-wider border-2 transition cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-white text-black border-white'
                    : 'bg-black text-white border-white/60 hover:border-white'
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        {/* Main Content Layout: Grid List on Left, Selected Fish Inspector on Right */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
          {/* Fish Grid (Scrollable) */}
          <div className="overflow-y-auto space-y-2 pr-1">
            {filteredList.map((fish) => {
              const record = unlockedCatches[fish.id];
              const isCaught = !!record;
              const isSelected = selectedFish?.id === fish.id;

              return (
                <div
                  key={fish.id}
                  onClick={() => setSelectedFish(fish)}
                  className={`p-3 border-2 transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-white bg-[#222222] shadow-[3px_3px_0px_0px_#ffffff]'
                      : 'border-white/40 bg-black hover:border-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 border-2 border-white flex items-center justify-center text-xs font-black ${
                        isCaught ? 'bg-white text-black' : 'bg-[#111111] text-[#666666]'
                      }`}
                    >
                      {isCaught ? '✓' : '?'}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-black uppercase tracking-wider">
                        {isCaught ? fish.name : 'UNKNOWN SPECIMEN'}
                      </div>
                      <div className="text-[10px] uppercase font-bold opacity-75">
                        {fish.rarity} · ${fish.baseValue}
                      </div>
                    </div>
                  </div>

                  {record && (
                    <div className="text-right text-[11px] font-mono">
                      <span className="opacity-75">RECORD</span>
                      <div className="font-black">{record.weight.toFixed(2)} KG</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Fish Detail / 3D Inspection Card */}
          <div className="border-2 border-white bg-[#111111] p-4 flex flex-col justify-between overflow-y-auto">
            {selectedFish ? (
              <>
                <div>
                  <div className="flex items-center justify-between border-b border-white/50 pb-2 mb-2">
                    <span className="text-[11px] font-black uppercase bg-white text-black px-2 py-0.5">
                      {selectedFish.rarity}
                    </span>
                    <span className="text-xs font-mono font-bold">
                      BASE VALUE: ${selectedFish.baseValue}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide">
                    {unlockedCatches[selectedFish.id] ? selectedFish.name : '??? (UNDISCOVERED)'}
                  </h3>

                  {/* 3D Model Viewport */}
                  <div className="w-full h-40 border-2 border-white bg-black my-3 overflow-hidden flex items-center justify-center relative">
                    <ThreeFishViewer species={selectedFish} size={200} />
                    <div className="absolute bottom-1 right-2 text-[9px] text-[#888888] uppercase">
                      INTERACTIVE 3D
                    </div>
                  </div>

                  <p className="text-xs opacity-85 italic mb-3">
                    "{selectedFish.description}"
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/40 pt-2">
                    <div>
                      <span className="text-[10px] opacity-75 uppercase block">BEST TIME:</span>
                      <span className="font-bold">{selectedFish.preferredTime.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] opacity-75 uppercase block">BEST WEATHER:</span>
                      <span className="font-bold">{selectedFish.preferredWeather.join(', ')}</span>
                    </div>
                    <div>
                      <span className="text-[10px] opacity-75 uppercase block">TYPICAL WEIGHT:</span>
                      <span className="font-bold">
                        {selectedFish.minWeight} - {selectedFish.maxWeight} KG
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] opacity-75 uppercase block">DIFFICULTY:</span>
                      <span className="font-bold">LEVEL {selectedFish.difficulty}</span>
                    </div>
                  </div>
                </div>

                {/* Personal Record Footer */}
                <div className="border-t-2 border-white pt-2 mt-3 text-xs">
                  {unlockedCatches[selectedFish.id] ? (
                    <div className="flex items-center justify-between">
                      <span className="opacity-80">PERSONAL RECORD:</span>
                      <span className="font-black bg-white text-black px-2 py-0.5">
                        {unlockedCatches[selectedFish.id].weight.toFixed(2)} KG ·{' '}
                        {unlockedCatches[selectedFish.id].length.toFixed(1)} CM
                      </span>
                    </div>
                  ) : (
                    <div className="opacity-60 text-center uppercase text-[11px]">
                      NOT YET CAUGHT IN THE WILD
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center opacity-60 text-sm">
                SELECT A FISH TO INSPECT
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
