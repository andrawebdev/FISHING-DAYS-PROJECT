import React, { useState } from 'react';
import {
  X,
  Home,
  Award,
  Hammer,
  Package,
  Sparkles,
  Flame,
  Check,
  Plus,
  Coins,
  Warehouse,
  Eye,
} from 'lucide-react';
import {
  MountedTrophy,
  CatchRecord,
  CabinTheme,
  DockLighting,
  CraftingRecipe,
  PlaqueStyle,
  FishRarity,
} from '../types';
import {
  CABIN_THEMES,
  DOCK_LIGHTING_OPTIONS,
  CRAFTING_RECIPES,
} from '../data/gearDatabase';
import { soundEngine } from '../services/soundEngine';

interface PlayerCabinModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  onUpdateCoins: (newCoins: number) => void;
  catchHistory: CatchRecord[];
  mountedTrophies: MountedTrophy[];
  onUpdateTrophies: (trophies: MountedTrophy[]) => void;
  cabinTheme: CabinTheme;
  onUpdateCabinTheme: (theme: CabinTheme) => void;
  dockLighting: DockLighting;
  onUpdateDockLighting: (lighting: DockLighting) => void;
  craftingMaterials: Record<string, number>;
  onUpdateCraftingMaterials: (materials: Record<string, number>) => void;
  onCraftSuccess: (recipe: CraftingRecipe) => void;
  onSwitchToCabinView: () => void;
}

type CabinTab = 'TROPHY_WALL' | 'WORKSHOP_CRAFTING' | 'CABIN_THEMES' | 'STORAGE_CHEST';

const PLAQUE_COLORS: Record<PlaqueStyle, { border: string; bg: string; text: string; label: string }> = {
  BRONZE: { border: 'border-amber-700', bg: 'bg-amber-950/40', text: 'text-amber-500', label: 'Bronze Plaque' },
  SILVER: { border: 'border-slate-400', bg: 'bg-slate-800/60', text: 'text-slate-300', label: 'Silver Plaque' },
  GOLD: { border: 'border-yellow-400', bg: 'bg-yellow-950/40', text: 'text-yellow-400', label: 'Gold Plaque' },
  OBSIDIAN: { border: 'border-purple-500', bg: 'bg-purple-950/50', text: 'text-purple-300', label: 'Obsidian Plaque' },
};

const RARITY_COLORS: Record<FishRarity, string> = {
  COMMON: 'text-slate-300',
  UNCOMMON: 'text-emerald-400',
  RARE: 'text-cyan-400',
  EPIC: 'text-purple-400',
  LEGENDARY: 'text-amber-400 font-bold',
  MYTHIC: 'text-pink-400 font-bold animate-pulse',
};

export const PlayerCabinModal: React.FC<PlayerCabinModalProps> = ({
  isOpen,
  onClose,
  coins,
  onUpdateCoins,
  catchHistory,
  mountedTrophies,
  onUpdateTrophies,
  cabinTheme,
  onUpdateCabinTheme,
  dockLighting,
  onUpdateDockLighting,
  craftingMaterials,
  onUpdateCraftingMaterials,
  onCraftSuccess,
  onSwitchToCabinView,
}) => {
  const [activeTab, setActiveTab] = useState<CabinTab>('TROPHY_WALL');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [craftMessage, setCraftMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Mount trophy to wall slot
  const handleMountFish = (catchItem: CatchRecord, slotIndex: number, plaque: PlaqueStyle) => {
    soundEngine.playEquipGear();
    const newTrophies = mountedTrophies.filter((t) => t.slot !== slotIndex);
    newTrophies.push({
      slot: slotIndex,
      speciesId: catchItem.speciesId,
      speciesName: catchItem.speciesName,
      weight: catchItem.weight,
      length: catchItem.length,
      rarity: catchItem.rarity,
      caughtAt: catchItem.caughtAt,
      plaqueStyle: plaque,
    });
    onUpdateTrophies(newTrophies);
    setSelectedSlot(null);
  };

  const handleRemoveTrophy = (slotIndex: number) => {
    soundEngine.playEquipGear();
    onUpdateTrophies(mountedTrophies.filter((t) => t.slot !== slotIndex));
  };

  // Craft item handler
  const handleCraft = (recipe: CraftingRecipe) => {
    // Validate coins
    if (coins < recipe.coinsCost) {
      setCraftMessage(`❌ Not enough coins! Need ${recipe.coinsCost} coins.`);
      setTimeout(() => setCraftMessage(null), 2500);
      return;
    }

    // Validate materials
    for (const req of recipe.requiredMaterials) {
      const currentCount = craftingMaterials[req.materialId] || 0;
      if (currentCount < req.amount) {
        setCraftMessage(`❌ Missing materials for ${recipe.name}!`);
        setTimeout(() => setCraftMessage(null), 2500);
        return;
      }
    }

    // Deduct coins & materials
    onUpdateCoins(coins - recipe.coinsCost);
    const updatedMats = { ...craftingMaterials };
    for (const req of recipe.requiredMaterials) {
      updatedMats[req.materialId] -= req.amount;
    }
    onUpdateCraftingMaterials(updatedMats);

    // Play sound and trigger success
    soundEngine.playWorkbenchCraft();
    onCraftSuccess(recipe);
    setCraftMessage(`✨ Successfully crafted ${recipe.name}!`);
    setTimeout(() => setCraftMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[760px] bg-slate-900/95 border border-amber-600/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-600/20">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Angler's Cabin & Lake Base
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  Player Haven
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Display trophy catches, craft advanced lures, customize cabin architecture, and manage your hoard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSwitchToCabinView();
                onClose();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Pan 3D Cam to Cabin
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'TROPHY_WALL', label: '🏆 Trophy Wall', icon: Award },
              { id: 'WORKSHOP_CRAFTING', label: '🔨 Crafting Station', icon: Hammer },
              { id: 'CABIN_THEMES', label: '🏡 Base Architecture', icon: Home },
              { id: 'STORAGE_CHEST', label: '📦 Storage & Scavenge', icon: Package },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as CabinTab)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/25 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-amber-400">
            <Coins className="w-3.5 h-3.5" />
            <span>{coins} coins</span>
          </div>
        </div>

        {/* Notification Toast */}
        {craftMessage && (
          <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2 text-xs text-center animate-in slide-in-from-top duration-200">
            {craftMessage}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-900/30">
          
          {/* TAB 1: TROPHY WALL */}
          {activeTab === 'TROPHY_WALL' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Mounted Grand Catch Showcase</h3>
                  <p className="text-xs text-slate-400">
                    Mount your personal records on polished wood and obsidian plaques along your cabin wall
                  </p>
                </div>
                <span className="text-xs font-mono text-amber-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                  {mountedTrophies.length} / 4 Slots Filled
                </span>
              </div>

              {/* 4 Plaque Slots Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((slotIdx) => {
                  const trophy = mountedTrophies.find((t) => t.slot === slotIdx);
                  const plaqueStyle = trophy ? PLAQUE_COLORS[trophy.plaqueStyle] : null;

                  return (
                    <div
                      key={slotIdx}
                      className={`relative min-h-[220px] rounded-2xl border-2 flex flex-col justify-between p-4 transition-all ${
                        trophy && plaqueStyle
                          ? `${plaqueStyle.border} ${plaqueStyle.bg} shadow-lg shadow-black/40`
                          : 'border-dashed border-slate-800 bg-slate-950/30 hover:border-amber-500/50'
                      }`}
                    >
                      {trophy ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 text-slate-300">
                              Mount #{slotIdx}
                            </span>
                            <span className={`text-[10px] font-mono uppercase font-bold ${plaqueStyle?.text}`}>
                              {plaqueStyle?.label}
                            </span>
                          </div>

                          <div className="text-center my-3">
                            <span className="text-4xl filter drop-shadow-md block mb-1">🐟</span>
                            <h4 className="text-sm font-bold text-white tracking-tight">
                              {trophy.speciesName}
                            </h4>
                            <span className={`text-[11px] font-semibold uppercase tracking-wider ${RARITY_COLORS[trophy.rarity]}`}>
                              {trophy.rarity}
                            </span>
                          </div>

                          <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 text-[11px] font-mono space-y-1">
                            <div className="flex justify-between text-slate-400">
                              <span>Weight:</span>
                              <span className="text-amber-300 font-bold">{trophy.weight.toFixed(2)} kg</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Length:</span>
                              <span className="text-cyan-300 font-bold">{trophy.length.toFixed(1)} cm</span>
                            </div>
                            <div className="text-[10px] text-slate-500 truncate pt-1 border-t border-white/5">
                              {trophy.caughtAt}
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveTrophy(slotIdx)}
                            className="mt-3 w-full py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-[11px] font-medium transition-colors"
                          >
                            Dismount Trophy
                          </button>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-3">
                          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
                            <Award className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-semibold text-slate-400">Empty Plaque Slot #{slotIdx}</span>
                          <p className="text-[11px] text-slate-500 mt-0.5">Select a prized catch to display</p>
                          <button
                            onClick={() => setSelectedSlot(slotIdx)}
                            className="mt-3 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Mount Trophy
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Catch Selection Modal Drawer */}
              {selectedSlot !== null && (
                <div className="p-4 rounded-xl border border-amber-500/40 bg-slate-950/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Select Fish from History to Mount on Slot #{selectedSlot}
                    </h4>
                    <button
                      onClick={() => setSelectedSlot(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>

                  {catchHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-3 text-center">
                      No fish caught yet! Head out to the dock and catch your first prize!
                    </p>
                  ) : (
                    <div className="max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {catchHistory.map((fish) => (
                        <div
                          key={fish.id}
                          className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-amber-500/50 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-white truncate block">
                              {fish.speciesName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {fish.weight.toFixed(1)} kg | {fish.length.toFixed(0)} cm
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {(['GOLD', 'OBSIDIAN', 'SILVER'] as PlaqueStyle[]).map((plaque) => (
                              <button
                                key={plaque}
                                onClick={() => handleMountFish(fish, selectedSlot, plaque)}
                                className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${PLAQUE_COLORS[plaque].border} ${PLAQUE_COLORS[plaque].bg} ${PLAQUE_COLORS[plaque].text}`}
                              >
                                {plaque[0]}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WORKSHOP & CRAFTING */}
          {activeTab === 'WORKSHOP_CRAFTING' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Artisan Lure & Bait Crafting Bench</h3>
                <p className="text-xs text-slate-400">
                  Refine lake drift materials, scales, and essences into mastercrafted fishing gear
                </p>
              </div>

              {/* Available Materials Stockpile */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-3">
                  Crafting Material Stockpile
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {[
                    { id: 'fish_scales', name: 'Fish Scales', icon: '✨', count: craftingMaterials.fish_scales || 0 },
                    { id: 'lake_driftwood', name: 'Lake Driftwood', icon: '🪵', count: craftingMaterials.lake_driftwood || 0 },
                    { id: 'polished_pebble', name: 'River Pebble', icon: '🪨', count: craftingMaterials.polished_pebble || 0 },
                    { id: 'feather_down', name: 'Feather Down', icon: '🪶', count: craftingMaterials.feather_down || 0 },
                    { id: 'firefly_essence', name: 'Firefly Essence', icon: '🌟', count: craftingMaterials.firefly_essence || 0 },
                    { id: 'pearl_shards', name: 'Pearl Shards', icon: '🦪', count: craftingMaterials.pearl_shards || 0 },
                  ].map((mat) => (
                    <div
                      key={mat.id}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2.5"
                    >
                      <span className="text-xl">{mat.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{mat.name}</span>
                        <span className="text-[11px] font-mono text-amber-400">{mat.count} in chest</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Crafting Recipes Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Available Recipes
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CRAFTING_RECIPES.map((recipe) => {
                    const hasCoins = coins >= recipe.coinsCost;
                    const canAffordMats = recipe.requiredMaterials.every(
                      (req) => (craftingMaterials[req.materialId] || 0) >= req.amount
                    );
                    const canCraft = hasCoins && canAffordMats;

                    return (
                      <div
                        key={recipe.id}
                        className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{recipe.icon}</span>
                              <h5 className="text-sm font-bold text-white">{recipe.name}</h5>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300">
                              {recipe.category}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 mt-1.5">{recipe.description}</p>

                          {/* Requirements */}
                          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-xs">
                            <div className="flex items-center justify-between font-mono">
                              <span className="text-slate-400">Workshop Fee:</span>
                              <span className={hasCoins ? 'text-amber-400' : 'text-red-400'}>
                                {recipe.coinsCost} coins
                              </span>
                            </div>

                            {recipe.requiredMaterials.map((req) => {
                              const have = craftingMaterials[req.materialId] || 0;
                              const ok = have >= req.amount;
                              const label = req.materialId.replace('_', ' ');
                              return (
                                <div
                                  key={req.materialId}
                                  className="flex items-center justify-between font-mono text-[11px]"
                                >
                                  <span className="text-slate-400 capitalize">{label}:</span>
                                  <span className={ok ? 'text-emerald-400' : 'text-red-400 font-bold'}>
                                    {have} / {req.amount}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <button
                          onClick={() => handleCraft(recipe)}
                          disabled={!canCraft}
                          className={`mt-4 w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                            canCraft
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                          }`}
                        >
                          <Hammer className="w-3.5 h-3.5" />
                          Craft {recipe.resultCount > 1 ? `x${recipe.resultCount}` : ''}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CABIN THEMES & DOCK LIGHTING */}
          {activeTab === 'CABIN_THEMES' && (
            <div className="space-y-6">
              {/* Cabin Wood Theme */}
              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-1">Cabin Timber Architecture</h3>
                <p className="text-xs text-slate-400 mb-3">
                  Re-clothe your lakeside shelter with historic lumber harvested from pristine valleys
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CABIN_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        soundEngine.playEquipGear();
                        onUpdateCabinTheme(theme.id);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                        cabinTheme === theme.id
                          ? 'border-amber-500 bg-amber-500/15 ring-1 ring-amber-500/40'
                          : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/60'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-xl border border-black/30 shadow-md flex-shrink-0"
                        style={{ backgroundColor: theme.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{theme.name}</h4>
                          {cabinTheme === theme.id && (
                            <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{theme.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dock Lighting */}
              <div>
                <h3 className="text-sm font-bold text-slate-200 mb-1">Dock & Shoreline Illumination</h3>
                <p className="text-xs text-slate-400 mb-3">
                  Set the atmospheric night lighting along the pier and boardwalk
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DOCK_LIGHTING_OPTIONS.map((light) => (
                    <button
                      key={light.id}
                      onClick={() => {
                        soundEngine.playEquipGear();
                        onUpdateDockLighting(light.id);
                      }}
                      className={`p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 ${
                        dockLighting === light.id
                          ? 'border-yellow-400 bg-yellow-500/15 ring-1 ring-yellow-400/40'
                          : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/60'
                      }`}
                    >
                      <span className="text-2xl">{light.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white">{light.name}</h4>
                          {dockLighting === light.id && (
                            <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{light.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STORAGE & SCAVENGE */}
          {activeTab === 'STORAGE_CHEST' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-200">Angler's Heavy Oak Storage Chest</h3>
                <p className="text-xs text-slate-400">
                  Keep caught catches chilled and manage your foraging haul
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Total Catches Stored</span>
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {catchHistory.length}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Trophies Mounted</span>
                  <span className="text-2xl font-bold font-mono text-cyan-400">
                    {mountedTrophies.length} / 4
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Liquid Bank Wealth</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400">
                    {coins} 🪙
                  </span>
                </div>
              </div>

              {/* Scavenge Shoreline Action */}
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Forage Shoreline & Shallow Reedbeds
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Scavenge along the private dock banks for rare driftwood, feathers, river pebbles, and firefly essence.
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Random material award
                    const mats = ['fish_scales', 'lake_driftwood', 'polished_pebble', 'feather_down', 'firefly_essence', 'pearl_shards'];
                    const picked = mats[Math.floor(Math.random() * mats.length)];
                    const count = Math.floor(Math.random() * 2) + 1;
                    const updated = { ...craftingMaterials, [picked]: (craftingMaterials[picked] || 0) + count };
                    onUpdateCraftingMaterials(updated);
                    soundEngine.playCoinDing();
                    setCraftMessage(`🧺 Foraged +${count} ${picked.replace('_', ' ')} from the shoreline!`);
                    setTimeout(() => setCraftMessage(null), 2500);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 whitespace-nowrap transition-all"
                >
                  Forage Shoreline (+Materials)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
