import React, { useState } from 'react';
import { motion } from 'motion/react';
import { RodItem, ReelItem, LineItem, BaitItem, SupportedLanguage } from '../types';
import { RODS, REELS, LINES, BAITS } from '../data/gearDatabase';
import { LOCALIZATION } from '../data/localization';
import { soundEngine } from '../services/soundEngine';
import { X, ShoppingBag, Coins, Check, ShieldCheck, Zap } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="relative w-full max-w-3xl h-[85vh] bg-slate-900/95 border border-slate-700/80 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col text-slate-100 overflow-hidden"
      >
        {/* Header with coins balance */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-100">{t.gearShop}</h2>
              <span className="text-xs text-slate-400">Upgrade gear to improve catch rates</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-slate-950 border border-amber-500/40 rounded-xl flex items-center gap-2 text-amber-300 font-mono font-bold text-sm shadow-inner">
              <Coins className="w-4 h-4" />
              <span>{coins}</span>
            </div>
            <button
              id="btn-close-shop"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-3 mb-4">
          {(['RODS', 'REELS', 'LINES', 'BAITS'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setTab(category)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                tab === category
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gear Items Grid */}
        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
          {tab === 'RODS' &&
            RODS.map((rod) => {
              const isUnlocked = unlockedGearIds.includes(rod.id) || rod.price === 0;
              const isEquipped = equippedRodId === rod.id;
              const canAfford = coins >= rod.price;

              return (
                <div
                  key={rod.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                    isEquipped
                      ? 'bg-slate-800/90 border-cyan-400 shadow-md'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl border flex items-center justify-center text-xl"
                      style={{
                        backgroundColor: rod.color + '22',
                        borderColor: rod.color + '66',
                      }}
                    >
                      🎣
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-100">{rod.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono">
                          Tier {rod.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{rod.description}</p>
                      <div className="flex gap-3 text-[11px] font-semibold text-emerald-400 mt-1">
                        <span>+{rod.castDistanceBonus}% Cast Range</span>
                        <span>+{rod.tensionToleranceBonus}% Tension Grace</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isEquipped ? (
                      <span className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Equipped
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onBuyOrEquipRod(rod)}
                        className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition cursor-pointer"
                      >
                        Equip
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (canAfford) {
                            soundEngine.playCoinDing();
                            onBuyOrEquipRod(rod);
                          }
                        }}
                        disabled={!canAfford}
                        className={`px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Buy ${rod.price}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {tab === 'REELS' &&
            REELS.map((reel) => {
              const isUnlocked = unlockedGearIds.includes(reel.id) || reel.price === 0;
              const isEquipped = equippedReelId === reel.id;
              const canAfford = coins >= reel.price;

              return (
                <div
                  key={reel.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                    isEquipped
                      ? 'bg-slate-800/90 border-cyan-400 shadow-md'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                      ⚙️
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-100">{reel.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono">
                          Tier {reel.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{reel.description}</p>
                      <div className="flex gap-3 text-[11px] font-semibold text-emerald-400 mt-1">
                        <span>+{reel.reelSpeedBonus}% Reeling Velocity</span>
                        <span>+{reel.dragStability}% Drag Balance</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isEquipped ? (
                      <span className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Equipped
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onBuyOrEquipReel(reel)}
                        className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition cursor-pointer"
                      >
                        Equip
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (canAfford) {
                            soundEngine.playCoinDing();
                            onBuyOrEquipReel(reel);
                          }
                        }}
                        disabled={!canAfford}
                        className={`px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Buy ${reel.price}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {tab === 'LINES' &&
            LINES.map((line) => {
              const isUnlocked = unlockedGearIds.includes(line.id) || line.price === 0;
              const isEquipped = equippedLineId === line.id;
              const canAfford = coins >= line.price;

              return (
                <div
                  key={line.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                    isEquipped
                      ? 'bg-slate-800/90 border-cyan-400 shadow-md'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
                      🧵
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-100">{line.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 font-mono">
                          Tier {line.tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{line.description}</p>
                      <div className="flex gap-3 text-[11px] font-semibold text-emerald-400 mt-1">
                        <span>Max Pull: {line.strengthKg} kg</span>
                        <span>+{line.snapResistance}% Break Resistance</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isEquipped ? (
                      <span className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Equipped
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() => onBuyOrEquipLine(line)}
                        className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition cursor-pointer"
                      >
                        Equip
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (canAfford) {
                            soundEngine.playCoinDing();
                            onBuyOrEquipLine(line);
                          }
                        }}
                        disabled={!canAfford}
                        className={`px-5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-md'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>Buy ${line.price}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

          {tab === 'BAITS' &&
            BAITS.map((bait) => {
              const currentStock = baitInventory[bait.id] || 0;
              const isEquipped = equippedBaitId === bait.id;
              const canAfford = coins >= bait.price;

              return (
                <div
                  key={bait.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                    isEquipped
                      ? 'bg-slate-800/90 border-cyan-400 shadow-md'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl">
                      {bait.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-100">{bait.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-mono">
                          Target: {bait.rarityTier}+
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{bait.description}</p>
                      <div className="flex gap-3 text-[11px] font-semibold text-cyan-400 mt-1">
                        <span>Stock: {currentStock} in tackle box</span>
                        <span>+{bait.rarityBoostPercent}% Rare Attraction</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentStock > 0 && !isEquipped && (
                      <button
                        onClick={() => onEquipBait(bait.id)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-600 transition cursor-pointer"
                      >
                        Equip
                      </button>
                    )}

                    {isEquipped && (
                      <span className="px-3.5 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-bold flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Hooked
                      </span>
                    )}

                    <button
                      onClick={() => {
                        if (canAfford) {
                          soundEngine.playCoinDing();
                          onBuyBait(bait);
                        }
                      }}
                      disabled={!canAfford}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-md'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>+{bait.count} for ${bait.price}</span>
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
