import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Sliders,
  Shield,
  Gauge,
  Compass,
  Check,
  RotateCcw,
  Palette,
  Crosshair,
} from 'lucide-react';
import {
  RodItem,
  ReelItem,
  LineItem,
  LureItem,
  GearCustomization,
  RodPattern,
  HandleGrip,
  ReelMetalTint,
  LineTint,
  BobberStyle,
} from '../types';
import {
  RODS,
  REELS,
  LINES,
  LURES,
  DEFAULT_GEAR_CUSTOMIZATION,
} from '../data/gearDatabase';
import { soundEngine } from '../services/soundEngine';

interface GearCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  equippedRod: RodItem;
  equippedReel: ReelItem;
  equippedLine: LineItem;
  equippedLure: LureItem;
  customization: GearCustomization;
  onUpdateCustomization: (custom: GearCustomization) => void;
  onEquipRod: (rod: RodItem) => void;
  onEquipReel: (reel: ReelItem) => void;
  onEquipLine: (line: LineItem) => void;
  onEquipLure: (lure: LureItem) => void;
}

type TabType = 'CUSTOMIZE_VISUALS' | 'RODS' | 'REELS' | 'LINES' | 'LURES';

const ROD_PATTERNS: { id: RodPattern; name: string; desc: string }[] = [
  { id: 'SOLID', name: 'Classic Matte', desc: 'Smooth, single-tone finish' },
  { id: 'CARBON_WEAVE', name: 'Carbon Fiber', desc: 'Cross-stitched high-tech weave' },
  { id: 'BAMBOO_RINGS', name: 'Natural Node Rings', desc: 'Handcrafted bamboo segments' },
  { id: 'CHERRY_BLOSSOM', name: 'Floral Petals', desc: 'Subtle spring petal motifs' },
  { id: 'TIGER_STRIPES', name: 'Predator Camo', desc: 'Sharp aquatic tiger striping' },
  { id: 'CELESTIAL_RUNES', name: 'Starlight Runes', desc: 'Pulsing celestial etchings' },
];

const HANDLE_GRIPS: { id: HandleGrip; name: string; color: string; desc: string }[] = [
  { id: 'NATURAL_CORK', name: 'Portuguese Cork', color: '#d4a373', desc: 'Soft organic feel with ergonomic grip' },
  { id: 'DARK_EVA', name: 'High-Density EVA', color: '#1e293b', desc: 'Weatherproof non-slip textured foam' },
  { id: 'POLISHED_ROSEWOOD', name: 'Lacquered Rosewood', color: '#581c87', desc: 'Heirloom craftsmanship & warm resonance' },
  { id: 'PEARL_INLAY', name: 'Mother of Pearl', color: '#f1f5f9', desc: 'Iridescent shell inlay from deep trenches' },
];

const REEL_TINTS: { id: ReelMetalTint; name: string; hex: string }[] = [
  { id: 'SILVER', name: 'Brushed Chrome', hex: '#94a3b8' },
  { id: 'GOLD', name: 'Champagne Gold', hex: '#eab308' },
  { id: 'GUNMETAL', name: 'Stealth Gunmetal', hex: '#334155' },
  { id: 'ROSE_GOLD', name: 'Rose Copper', hex: '#fb7185' },
  { id: 'NEON_IRIDESCENT', name: 'Prism Oil-Slick', hex: '#06b6d4' },
];

const LINE_TINTS: { id: LineTint; name: string; hex: string; desc: string }[] = [
  { id: 'CLEAR', name: 'Stealth Ghost Clear', hex: '#ffffff', desc: 'Low visibility in crystal lakes' },
  { id: 'NEON_YELLOW', name: 'High-Vis Solar Yellow', hex: '#facc15', desc: 'Easy tracking against dark waters' },
  { id: 'AQUA_BLUE', name: 'Glacial Ice Cyan', hex: '#38bdf8', desc: 'Blends into deep blue thermoclines' },
  { id: 'CORAL_RED', name: 'Coral Flare Red', hex: '#f87171', desc: 'High contrast in overcast & murky water' },
  { id: 'GLOW_EMERALD', name: 'Biolum Emerald', hex: '#4ade80', desc: 'Glows in twilight and midnight sessions' },
];

const BOBBER_STYLES: { id: BobberStyle; name: string; icon: string; desc: string }[] = [
  { id: 'CLASSIC_SPHERE', name: 'Traditional Float', icon: '🔴', desc: 'Dual-tone red/white high-buoyancy cork' },
  { id: 'GOLDEN_ACORN', name: 'Carved Golden Acorn', icon: '🌰', desc: 'Ornate timber float with brass ring' },
  { id: 'WATERMELON_FLOAT', name: 'Sweet Watermelon', icon: '🍉', desc: 'Playful summer fruit design' },
  { id: 'CRYSTAL_ORB', name: 'Prismatic Crystal', icon: '🔮', desc: 'Refracts ripples into sparkling caustics' },
  { id: 'DUCKLING', name: 'Little Rubber Duck', icon: '🐥', desc: 'Quirky floating lucky companion' },
  { id: 'NEON_BEACON', name: 'Cyber Night Beacon', icon: '🚨', desc: 'High-lumens LED tip for night strikes' },
];

const PRESET_STYLES = [
  {
    name: 'Golden Sovereign',
    custom: {
      rodColor: '#f59e0b',
      rodPattern: 'CELESTIAL_RUNES' as RodPattern,
      handleGrip: 'POLISHED_ROSEWOOD' as HandleGrip,
      guideRingColor: '#eab308',
      reelMetalTint: 'GOLD' as ReelMetalTint,
      lineTint: 'NEON_YELLOW' as LineTint,
      bobberStyle: 'GOLDEN_ACORN' as BobberStyle,
    },
  },
  {
    name: 'Cyber Lake',
    custom: {
      rodColor: '#06b6d4',
      rodPattern: 'CARBON_WEAVE' as RodPattern,
      handleGrip: 'DARK_EVA' as HandleGrip,
      guideRingColor: '#38bdf8',
      reelMetalTint: 'NEON_IRIDESCENT' as ReelMetalTint,
      lineTint: 'AQUA_BLUE' as LineTint,
      bobberStyle: 'NEON_BEACON' as BobberStyle,
    },
  },
  {
    name: 'Serene Bamboo',
    custom: {
      rodColor: '#854d0e',
      rodPattern: 'BAMBOO_RINGS' as RodPattern,
      handleGrip: 'NATURAL_CORK' as HandleGrip,
      guideRingColor: '#d97706',
      reelMetalTint: 'SILVER' as ReelMetalTint,
      lineTint: 'CLEAR' as LineTint,
      bobberStyle: 'CLASSIC_SPHERE' as BobberStyle,
    },
  },
  {
    name: 'Abyssal Void',
    custom: {
      rodColor: '#6366f1',
      rodPattern: 'TIGER_STRIPES' as RodPattern,
      handleGrip: 'PEARL_INLAY' as HandleGrip,
      guideRingColor: '#a855f7',
      reelMetalTint: 'GUNMETAL' as ReelMetalTint,
      lineTint: 'GLOW_EMERALD' as LineTint,
      bobberStyle: 'CRYSTAL_ORB' as BobberStyle,
    },
  },
];

export const GearCustomizationModal: React.FC<GearCustomizationModalProps> = ({
  isOpen,
  onClose,
  equippedRod,
  equippedReel,
  equippedLine,
  equippedLure,
  customization,
  onUpdateCustomization,
  onEquipRod,
  onEquipReel,
  onEquipLine,
  onEquipLure,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('CUSTOMIZE_VISUALS');

  if (!isOpen) return null;

  const handleCustomChange = (patch: Partial<GearCustomization>) => {
    soundEngine.playEquipGear();
    onUpdateCustomization({ ...customization, ...patch });
  };

  // Stat calculations
  const totalCastDistance = 14 * (1 + (equippedRod.castDistanceBonus || 0) / 100);
  const totalTensionTolerance = 100 + (equippedRod.tensionToleranceBonus || 0);
  const totalReelSpeed = 100 + (equippedReel.reelSpeedBonus || 0);
  const totalBiteRateBonus = (equippedRod.biteRateBonus || 0) + (equippedLure.biteRateBonus || 0);
  const totalRarityBoost = equippedLure.rarityBoostPercent || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[760px] bg-slate-900/95 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sliders className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Gear Customizer & Workbench
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  Custom Studio
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Personalize your rod blank, reel finish, line visibility, and fine-tune performance stats
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-slate-900 border-b border-slate-800 overflow-x-auto">
          {[
            { id: 'CUSTOMIZE_VISUALS', label: '🎨 Visual Styling', icon: Palette },
            { id: 'RODS', label: '🎣 Rods', icon: Sliders },
            { id: 'REELS', label: '⚙️ Reels', icon: Gauge },
            { id: 'LINES', label: '🧵 Lines', icon: Shield },
            { id: 'LURES', label: '🎯 Specialized Lures', icon: Crosshair },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left / Center Interactive Preview & Dynamic Stats */}
          <div className="w-full md:w-80 border-r border-slate-800 bg-slate-950/40 p-5 flex flex-col justify-between overflow-y-auto">
            
            {/* Visual Assembly Preview Display */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Custom Setup Preview
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Real-time Rig</span>
              </div>

              <div className="relative h-44 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 p-4 flex flex-col items-center justify-center overflow-hidden">
                {/* SVG Visual Rod / Reel Representation */}
                <svg viewBox="0 0 260 120" className="w-full h-full drop-shadow-lg">
                  {/* Rod blank line with custom color and pattern */}
                  <line
                    x1="20"
                    y1="100"
                    x2="230"
                    y2="20"
                    stroke={customization.rodColor}
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  {/* Pattern highlight overlay */}
                  {customization.rodPattern === 'BAMBOO_RINGS' && (
                    <>
                      <line x1="60" y1="86" x2="62" y2="84" stroke="#451a03" strokeWidth="9" />
                      <line x1="120" y1="65" x2="122" y2="63" stroke="#451a03" strokeWidth="8" />
                      <line x1="180" y1="42" x2="182" y2="40" stroke="#451a03" strokeWidth="7" />
                    </>
                  )}
                  {customization.rodPattern === 'CARBON_WEAVE' && (
                    <line
                      x1="25"
                      y1="98"
                      x2="225"
                      y2="22"
                      stroke="#000000"
                      strokeWidth="3"
                      strokeDasharray="4 4"
                    />
                  )}
                  {customization.rodPattern === 'CELESTIAL_RUNES' && (
                    <line
                      x1="25"
                      y1="98"
                      x2="225"
                      y2="22"
                      stroke="#ffffff"
                      strokeWidth="2"
                      strokeDasharray="2 8"
                    />
                  )}

                  {/* Cork or Custom Grip handle */}
                  <rect
                    x="20"
                    y="90"
                    width="45"
                    height="14"
                    rx="4"
                    transform="rotate(-23 20 90)"
                    fill={
                      customization.handleGrip === 'NATURAL_CORK'
                        ? '#d4a373'
                        : customization.handleGrip === 'DARK_EVA'
                        ? '#1e293b'
                        : customization.handleGrip === 'POLISHED_ROSEWOOD'
                        ? '#450a0a'
                        : '#e2e8f0'
                    }
                    stroke="#00000040"
                    strokeWidth="1.5"
                  />

                  {/* Guide Rings */}
                  {[
                    { x: 95, y: 72 },
                    { x: 145, y: 53 },
                    { x: 195, y: 34 },
                    { x: 232, y: 19 },
                  ].map((guide, idx) => (
                    <circle
                      key={idx}
                      cx={guide.x}
                      cy={guide.y}
                      r="4"
                      fill="none"
                      stroke={customization.guideRingColor}
                      strokeWidth="2"
                    />
                  ))}

                  {/* Reel Spool & Mount */}
                  <rect
                    x="50"
                    y="95"
                    width="22"
                    height="18"
                    rx="3"
                    fill={
                      customization.reelMetalTint === 'GOLD'
                        ? '#eab308'
                        : customization.reelMetalTint === 'GUNMETAL'
                        ? '#334155'
                        : customization.reelMetalTint === 'ROSE_GOLD'
                        ? '#fb7185'
                        : customization.reelMetalTint === 'NEON_IRIDESCENT'
                        ? '#06b6d4'
                        : '#cbd5e1'
                    }
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                  {/* Reel handle handle knob */}
                  <circle cx="68" cy="108" r="4" fill="#f59e0b" />

                  {/* Line trailing out from tip with custom tint */}
                  <path
                    d="M 232 19 Q 245 45 250 85"
                    fill="none"
                    stroke={
                      customization.lineTint === 'NEON_YELLOW'
                        ? '#facc15'
                        : customization.lineTint === 'AQUA_BLUE'
                        ? '#38bdf8'
                        : customization.lineTint === 'CORAL_RED'
                        ? '#f87171'
                        : customization.lineTint === 'GLOW_EMERALD'
                        ? '#4ade80'
                        : '#e2e8f0'
                    }
                    strokeWidth="1.8"
                    strokeDasharray={customization.lineTint === 'CLEAR' ? '3 2' : 'none'}
                  />

                  {/* Bobber indicator icon */}
                  <text x="238" y="105" fontSize="16">
                    {BOBBER_STYLES.find((b) => b.id === customization.bobberStyle)?.icon || '🔴'}
                  </text>
                </svg>

                <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800">
                  <span className="font-semibold text-slate-300">{equippedRod.name}</span>
                  <span className="text-amber-400 font-mono">Tier {equippedRod.tier}</span>
                </div>
              </div>

              {/* Presets Bar */}
              <div className="mt-3">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Styling Presets:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {PRESET_STYLES.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        soundEngine.playEquipGear();
                        onUpdateCustomization(preset.custom);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700/60 text-[11px] text-slate-300 hover:text-amber-300 transition-colors text-left truncate flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />
                      <span className="truncate">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Rig Stats Card */}
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                Aggregated Rig Stats
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Max Cast Distance</span>
                  <span className="font-mono font-bold text-amber-400">
                    {totalCastDistance.toFixed(1)} m{' '}
                    <span className="text-[10px] text-emerald-400 font-normal">
                      (+{equippedRod.castDistanceBonus}%)
                    </span>
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Line Strength</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {equippedLine.strengthKg} kg{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Snap: {equippedLine.snapResistance})
                    </span>
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Reel Retrieve Speed</span>
                  <span className="font-mono font-bold text-emerald-400">
                    +{equippedReel.reelSpeedBonus}%{' '}
                    <span className="text-[10px] text-slate-400 font-normal">
                      (Drag: {equippedReel.dragStability})
                    </span>
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Bite Rate Advantage</span>
                  <span className="font-mono font-bold text-yellow-300">
                    +{totalBiteRateBonus}% faster
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400">Lure Rarity Boost</span>
                  <span className="font-mono font-bold text-purple-400">
                    +{totalRarityBoost}% Rare/Legendary
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Detailed Tab Controls */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-900/30">
            {/* TAB 1: VISUAL STYLING */}
            {activeTab === 'CUSTOMIZE_VISUALS' && (
              <div className="space-y-6">
                
                {/* 1. Rod Blank Color */}
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Rod Blank Color
                  </h3>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {[
                      { name: 'Bamboo Amber', hex: '#a16207' },
                      { name: 'Sky Cyan', hex: '#38bdf8' },
                      { name: 'Emerald Moss', hex: '#10b981' },
                      { name: 'Amethyst Purple', hex: '#a855f7' },
                      { name: 'Solar Gold', hex: '#f59e0b' },
                      { name: 'Abyssal Obsidian', hex: '#6366f1' },
                      { name: 'Rose Lotus', hex: '#ec4899' },
                      { name: 'Stealth Matte', hex: '#334155' },
                    ].map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => handleCustomChange({ rodColor: col.hex })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-xs font-medium ${
                          customization.rodColor === col.hex
                            ? 'border-amber-400 bg-amber-500/20 text-white ring-2 ring-amber-400/40'
                            : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/40 shadow-sm"
                          style={{ backgroundColor: col.hex }}
                        />
                        {col.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Rod Weave Pattern */}
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Rod Finish & Weave Pattern
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {ROD_PATTERNS.map((pattern) => (
                      <button
                        key={pattern.id}
                        onClick={() => handleCustomChange({ rodPattern: pattern.id })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          customization.rodPattern === pattern.id
                            ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/50'
                            : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{pattern.name}</span>
                          {customization.rodPattern === pattern.id && (
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{pattern.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Handle Grip Material */}
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Handle Grip Material
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {HANDLE_GRIPS.map((grip) => (
                      <button
                        key={grip.id}
                        onClick={() => handleCustomChange({ handleGrip: grip.id })}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                          customization.handleGrip === grip.id
                            ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/50'
                            : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800/80'
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg border border-black/30 shadow-sm flex-shrink-0"
                          style={{ backgroundColor: grip.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate">{grip.name}</span>
                            {customization.handleGrip === grip.id && (
                              <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{grip.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Reel Metal Finish & Line Tint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Reel Metal Tint */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Reel Spool Finish
                    </h3>
                    <div className="space-y-2">
                      {REEL_TINTS.map((tint) => (
                        <button
                          key={tint.id}
                          onClick={() => handleCustomChange({ reelMetalTint: tint.id })}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            customization.reelMetalTint === tint.id
                              ? 'border-cyan-400 bg-cyan-500/15'
                              : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-4 h-4 rounded-full border border-black/30 shadow-sm"
                              style={{ backgroundColor: tint.hex }}
                            />
                            <span className="text-xs font-semibold text-slate-200">{tint.name}</span>
                          </div>
                          {customization.reelMetalTint === tint.id && (
                            <Check className="w-3.5 h-3.5 text-cyan-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Tint */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Fishing Line Visibility
                    </h3>
                    <div className="space-y-2">
                      {LINE_TINTS.map((line) => (
                        <button
                          key={line.id}
                          onClick={() => handleCustomChange({ lineTint: line.id })}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            customization.lineTint === line.id
                              ? 'border-emerald-400 bg-emerald-500/15'
                              : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-4 h-4 rounded-full border border-black/30 shadow-sm"
                              style={{ backgroundColor: line.hex }}
                            />
                            <div>
                              <span className="text-xs font-semibold text-slate-200 block">
                                {line.name}
                              </span>
                              <span className="text-[10px] text-slate-400">{line.desc}</span>
                            </div>
                          </div>
                          {customization.lineTint === line.id && (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 5. Bobber Float Style */}
                <div>
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    Bobber & Float Style
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {BOBBER_STYLES.map((bobber) => (
                      <button
                        key={bobber.id}
                        onClick={() => handleCustomChange({ bobberStyle: bobber.id })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          customization.bobberStyle === bobber.id
                            ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/50'
                            : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">{bobber.icon}</span>
                          {customization.bobberStyle === bobber.id && (
                            <Check className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-white block mt-1">{bobber.name}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{bobber.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset button */}
                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      soundEngine.playEquipGear();
                      onUpdateCustomization(DEFAULT_GEAR_CUSTOMIZATION);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to Classic Factory Specs
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: RODS CATALOG */}
            {activeTab === 'RODS' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-200">Unlocked Rods Collection</h3>
                  <span className="text-xs text-slate-400 font-mono">{RODS.length} Total Models</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {RODS.map((rod) => {
                    const isEquipped = equippedRod.id === rod.id;
                    return (
                      <div
                        key={rod.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isEquipped
                            ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/40'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full"
                              style={{ backgroundColor: rod.color }}
                            />
                            <h4 className="text-sm font-bold text-white">{rod.name}</h4>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400">
                            Tier {rod.tier}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{rod.description}</p>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                          <div className="text-slate-300">
                            Range: <span className="text-amber-400">+{rod.castDistanceBonus}%</span>
                          </div>
                          <div className="text-slate-300">
                            Tension: <span className="text-emerald-400">+{rod.tensionToleranceBonus}%</span>
                          </div>
                          {rod.biteRateBonus ? (
                            <div className="text-slate-300">
                              Bite Speed: <span className="text-cyan-400">+{rod.biteRateBonus}%</span>
                            </div>
                          ) : null}
                          {rod.sweetSpotBonus ? (
                            <div className="text-slate-300">
                              Sweet Spot: <span className="text-purple-400">+{rod.sweetSpotBonus}%</span>
                            </div>
                          ) : null}
                        </div>

                        <button
                          onClick={() => {
                            soundEngine.playEquipGear();
                            onEquipRod(rod);
                          }}
                          disabled={isEquipped}
                          className={`mt-3 w-full py-2 rounded-lg text-xs font-bold transition-all ${
                            isEquipped
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-default'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                          }`}
                        >
                          {isEquipped ? '✓ Equipped on Rig' : 'Equip Rod'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: REELS CATALOG */}
            {activeTab === 'REELS' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-200">Reel Spool Assemblies</h3>
                  <span className="text-xs text-slate-400 font-mono">{REELS.length} Models</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {REELS.map((reel) => {
                    const isEquipped = equippedReel.id === reel.id;
                    return (
                      <div
                        key={reel.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isEquipped
                            ? 'bg-cyan-500/10 border-cyan-500/60 ring-1 ring-cyan-500/40'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{reel.name}</h4>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                            Tier {reel.tier}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">{reel.description}</p>
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                          <div className="text-slate-300">
                            Reel Speed: <span className="text-cyan-400">+{reel.reelSpeedBonus}%</span>
                          </div>
                          <div className="text-slate-300">
                            Drag Stability: <span className="text-emerald-400">{reel.dragStability}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            soundEngine.playEquipGear();
                            onEquipReel(reel);
                          }}
                          disabled={isEquipped}
                          className={`mt-3 w-full py-2 rounded-lg text-xs font-bold transition-all ${
                            isEquipped
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 cursor-default'
                              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md'
                          }`}
                        >
                          {isEquipped ? '✓ Equipped on Rig' : 'Equip Reel'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: LINES CATALOG */}
            {activeTab === 'LINES' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-200">High-Tensile Fishing Lines</h3>
                  <span className="text-xs text-slate-400 font-mono">{LINES.length} Lines</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LINES.map((line) => {
                    const isEquipped = equippedLine.id === line.id;
                    return (
                      <div
                        key={line.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isEquipped
                            ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/40'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-white">{line.name}</h4>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                            Tier {line.tier}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">{line.description}</p>
                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                          <div className="text-slate-300">
                            Strength: <span className="text-emerald-400">{line.strengthKg} kg</span>
                          </div>
                          <div className="text-slate-300">
                            Snap Defense: <span className="text-amber-400">{line.snapResistance}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            soundEngine.playEquipGear();
                            onEquipLine(line);
                          }}
                          disabled={isEquipped}
                          className={`mt-3 w-full py-2 rounded-lg text-xs font-bold transition-all ${
                            isEquipped
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                          }`}
                        >
                          {isEquipped ? '✓ Spooled on Reel' : 'Spool Line'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: LURES CATALOG */}
            {activeTab === 'LURES' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Specialized Surface & Diving Lures</h3>
                    <p className="text-xs text-slate-400">
                      Lures trigger predator strikes, expand bite detection radius, and increase rare species encounters
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">{LURES.length} Lures</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LURES.map((lure) => {
                    const isEquipped = equippedLure.id === lure.id;
                    return (
                      <div
                        key={lure.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isEquipped
                            ? 'bg-purple-500/10 border-purple-500/60 ring-1 ring-purple-500/40'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{lure.icon || '🪝'}</span>
                            <h4 className="text-sm font-bold text-white">{lure.name}</h4>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-400">
                            Tier {lure.tier || 1}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 mt-1.5">{lure.description}</p>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                          <div className="text-slate-300">
                            Rarity Boost: <span className="text-purple-400">+{lure.rarityBoostPercent || 0}%</span>
                          </div>
                          <div className="text-slate-300">
                            Bite Rate: <span className="text-yellow-400">+{lure.biteRateBonus || 0}%</span>
                          </div>
                          <div className="text-slate-300">
                            Grace Time: <span className="text-emerald-400">+{lure.reactionGraceBonus || 0}s</span>
                          </div>
                          <div className="text-slate-300">
                            Attract Radius: <span className="text-cyan-400">+{lure.attractionRadiusBonus || 0}%</span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            soundEngine.playEquipGear();
                            onEquipLure(lure);
                          }}
                          disabled={isEquipped}
                          className={`mt-3 w-full py-2 rounded-lg text-xs font-bold transition-all ${
                            isEquipped
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 cursor-default'
                              : 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-md font-bold'
                          }`}
                        >
                          {isEquipped ? '✓ Tied to Terminal Tackle' : 'Tie Lure to Line'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
