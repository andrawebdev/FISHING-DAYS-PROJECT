import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RodItem, ReelItem, LineItem, BaitItem, SupportedLanguage } from '../types';
import { RODS, REELS, LINES, BAITS } from '../data/gearDatabase';
import { LOCALIZATION } from '../data/localization';
import { soundEngine } from '../services/soundEngine';
import { X, ShoppingBag, Coins, Check, Zap, Shield } from 'lucide-react';

interface TackleShopModalProps {
  coins: number;
  equippedRodId: string;
  equippedReelId: string;
  equippedLineId: string;
  equippedBaitId: string;
  unlockedGearIds: string[];
  baitInventory: Record<string, number>;
  language: SupportedLanguage;
  onBuyOrEquipRod: (rod: RodItem) => void;
  onBuyOrEquipReel: (reel: ReelItem) => void;
  onBuyOrEquipLine: (line: LineItem) => void;
  onBuyBait: (bait: BaitItem) => void;
  onEquipBait: (baitId: string) => void;
  onClose: () => void;
}

export const TackleShopModal: React.FC<TackleShopModalProps> = ({
  coins,
  equippedRodId,
  equippedReelId,
  equippedLineId,
  equippedBaitId,
  unlockedGearIds,
  baitInventory,
  language,
  onBuyOrEquipRod,
  onBuyOrEquipReel,
  onBuyOrEquipLine,
  onBuyBait,
  onEquipBait,
  onClose,
}) => {
  const t = LOCALIZATION[language] || LOCALIZATION.en;
  const [tab, setTab] = useState<'RODS' | 'REELS' | 'LINES' | 'BAITS'>('RODS');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="relative w-full max-w-3xl h-[86vh] bg-black text-white border-4 border-white p-4 sm:p-6 shadow-[8px_8px_0px_0px_#ffffff] flex flex-col font-mono select-none overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-white pb-3 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-xl font-black uppercase tracking-widest">
              TACKLE SHOP
            </h2>
            <div className="bg-white text-black px-2 py-0.5 text-xs font-black">
              FUNDS: ${coins}
            </div>
          </div>

          <button
            id="btn-close-shop"
            onClick={onClose}
            className="p-1 border-2 border-white hover:bg-white hover:text-black transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {(['RODS', 'REELS', 'LINES', 'BAITS'] as const).map((category) => {
            const isActive = tab === category;
            return (
              <button
                key={category}
                onClick={() => setTab(category)}
                className={`py-2 text-xs font-black uppercase tracking-wider border-2 transition cursor-pointer text-center ${
                  isActive
                    ? 'bg-white text-black border-white'
                    : 'bg-black text-white border-white/60 hover:border-white'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Catalog List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {/* RODS */}
          {tab === 'RODS' &&
            RODS.map((rod) => {
              const isUnlocked = unlockedGearIds.includes(rod.id);
              const isEquipped = equippedRodId === rod.id;
              const canAfford = coins >= rod.price;

              return (
                <div
                  key={rod.id}
                  className={`p-3.5 border-2 flex items-center justify-between gap-3 ${
                    isEquipped
                      ? 'border-white bg-[#222222] shadow-[3px_3px_0px_0px_#ffffff]'
                      : 'border-white/50 bg-black'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                        {rod.name}
                      </span>
                      {isEquipped && (
                        <span className="text-[10px] bg-white text-black px-1.5 py-0.2 font-black uppercase">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-75 mt-0.5">{rod.description}</p>
                    <div className="flex gap-3 text-[10px] uppercase font-bold opacity-90 mt-1">
                      <span>CAST: +{rod.castDistanceBonus}%</span>
                      <span>TENSION TOLERANCE: +{rod.tensionToleranceBonus}%</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isEquipped ? (
                      <span className="text-xs font-black uppercase px-3 py-1.5 border border-white text-white">
                        ACTIVE
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onBuyOrEquipRod(rod)}
                        className="px-4 py-1.5 bg-white text-black text-xs font-black uppercase border border-white hover:bg-black hover:text-white transition cursor-pointer"
                      >
                        EQUIP
                      </button>
                    ) : (
                      <button
                        onClick={() => onBuyOrEquipRod(rod)}
                        disabled={!canAfford}
                        className={`px-4 py-1.5 text-xs font-black uppercase border transition cursor-pointer ${
                          canAfford
                            ? 'bg-white text-black border-white hover:bg-black hover:text-white'
                            : 'bg-black text-[#666666] border-[#444444] cursor-not-allowed'
                        }`}
                      >
                        BUY ${rod.price}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* REELS */}
          {tab === 'REELS' &&
            REELS.map((reel) => {
              const isUnlocked = unlockedGearIds.includes(reel.id);
              const isEquipped = equippedReelId === reel.id;
              const canAfford = coins >= reel.price;

              return (
                <div
                  key={reel.id}
                  className={`p-3.5 border-2 flex items-center justify-between gap-3 ${
                    isEquipped
                      ? 'border-white bg-[#222222] shadow-[3px_3px_0px_0px_#ffffff]'
                      : 'border-white/50 bg-black'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                        {reel.name}
                      </span>
                      {isEquipped && (
                        <span className="text-[10px] bg-white text-black px-1.5 py-0.2 font-black uppercase">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-75 mt-0.5">{reel.description}</p>
                    <div className="flex gap-3 text-[10px] uppercase font-bold opacity-90 mt-1">
                      <span>SPEED: +{reel.reelSpeedBonus}%</span>
                      <span>DRAG STABILITY: +{reel.dragStability}%</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isEquipped ? (
                      <span className="text-xs font-black uppercase px-3 py-1.5 border border-white text-white">
                        ACTIVE
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onBuyOrEquipReel(reel)}
                        className="px-4 py-1.5 bg-white text-black text-xs font-black uppercase border border-white hover:bg-black hover:text-white transition cursor-pointer"
                      >
                        EQUIP
                      </button>
                    ) : (
                      <button
                        onClick={() => onBuyOrEquipReel(reel)}
                        disabled={!canAfford}
                        className={`px-4 py-1.5 text-xs font-black uppercase border transition cursor-pointer ${
                          canAfford
                            ? 'bg-white text-black border-white hover:bg-black hover:text-white'
                            : 'bg-black text-[#666666] border-[#444444] cursor-not-allowed'
                        }`}
                      >
                        BUY ${reel.price}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* LINES */}
          {tab === 'LINES' &&
            LINES.map((line) => {
              const isUnlocked = unlockedGearIds.includes(line.id);
              const isEquipped = equippedLineId === line.id;
              const canAfford = coins >= line.price;

              return (
                <div
                  key={line.id}
                  className={`p-3.5 border-2 flex items-center justify-between gap-3 ${
                    isEquipped
                      ? 'border-white bg-[#222222] shadow-[3px_3px_0px_0px_#ffffff]'
                      : 'border-white/50 bg-black'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                        {line.name}
                      </span>
                      {isEquipped && (
                        <span className="text-[10px] bg-white text-black px-1.5 py-0.2 font-black uppercase">
                          EQUIPPED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-75 mt-0.5">{line.description}</p>
                    <div className="flex gap-3 text-[10px] uppercase font-bold opacity-90 mt-1">
                      <span>STRENGTH: {line.strengthKg} KG</span>
                      <span>SNAP RESIST: +{line.snapResistance}%</span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isEquipped ? (
                      <span className="text-xs font-black uppercase px-3 py-1.5 border border-white text-white">
                        ACTIVE
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onBuyOrEquipLine(line)}
                        className="px-4 py-1.5 bg-white text-black text-xs font-black uppercase border border-white hover:bg-black hover:text-white transition cursor-pointer"
                      >
                        EQUIP
                      </button>
                    ) : (
                      <button
                        onClick={() => onBuyOrEquipLine(line)}
                        disabled={!canAfford}
                        className={`px-4 py-1.5 text-xs font-black uppercase border transition cursor-pointer ${
                          canAfford
                            ? 'bg-white text-black border-white hover:bg-black hover:text-white'
                            : 'bg-black text-[#666666] border-[#444444] cursor-not-allowed'
                        }`}
                      >
                        BUY ${line.price}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {/* BAITS */}
          {tab === 'BAITS' &&
            BAITS.map((bait) => {
              const currentStock = baitInventory[bait.id] || 0;
              const isEquipped = equippedBaitId === bait.id;
              const canAfford = coins >= bait.price;

              return (
                <div
                  key={bait.id}
                  className={`p-3.5 border-2 flex items-center justify-between gap-3 ${
                    isEquipped
                      ? 'border-white bg-[#222222] shadow-[3px_3px_0px_0px_#ffffff]'
                      : 'border-white/50 bg-black'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black uppercase tracking-wider">
                        {bait.name}
                      </span>
                      {isEquipped && (
                        <span className="text-[10px] bg-white text-black px-1.5 py-0.2 font-black uppercase">
                          HOOKED BAIT
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-75 mt-0.5">{bait.description}</p>
                    <div className="flex gap-3 text-[10px] uppercase font-bold opacity-90 mt-1">
                      <span>INVENTORY: {currentStock}x</span>
                      <span>RARITY BOOST: +{bait.rarityBoostPercent}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {currentStock > 0 && !isEquipped && (
                      <button
                        onClick={() => onEquipBait(bait.id)}
                        className="px-3 py-1.5 bg-black text-white text-xs font-black uppercase border border-white hover:bg-white hover:text-black transition cursor-pointer"
                      >
                        ATTACH
                      </button>
                    )}
                    <button
                      onClick={() => onBuyBait(bait)}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 text-xs font-black uppercase border transition cursor-pointer ${
                        canAfford
                          ? 'bg-white text-black border-white hover:bg-black hover:text-white'
                          : 'bg-black text-[#666666] border-[#444444] cursor-not-allowed'
                      }`}
                    >
                      +5x (${bait.price})
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>
    </div>
  );
};
