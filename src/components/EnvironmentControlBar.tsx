import React from 'react';
import {
  WeatherType,
  TimeOfDay,
  SupportedLanguage,
  RodItem,
  BaitItem,
  ViewMode,
} from '../types';
import { LOCALIZATION } from '../data/localization';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudFog,
  Sunrise,
  Sunset,
  Moon,
  Volume2,
  VolumeX,
  Coins,
  BookOpen,
  ShoppingBag,
  Trophy,
  Users,
  Palette,
  Home,
  Waves,
  Camera,
  Pause,
  Play,
} from 'lucide-react';

interface EnvironmentControlBarProps {
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  coins: number;
  equippedRod: RodItem;
  equippedBait: BaitItem;
  soundEnabled: boolean;
  language: SupportedLanguage;
  viewMode: ViewMode;
  isPaused: boolean;
  onTogglePause: () => void;
  onCycleWeather: () => void;
  onCycleTimeOfDay: () => void;
  onToggleSound: () => void;
  onOpenCollection: () => void;
  onOpenShop: () => void;
  onOpenLeaderboard: () => void;
  onOpenMultiplayer: () => void;
  onOpenCustomization: () => void;
  onOpenCabin: () => void;
  onOpenEcosystem: () => void;
  onCycleViewMode: () => void;
}

export const EnvironmentControlBar: React.FC<EnvironmentControlBarProps> = ({
  weather,
  timeOfDay,
  coins,
  soundEnabled,
  language,
  viewMode,
  isPaused,
  onTogglePause,
  onCycleWeather,
  onCycleTimeOfDay,
  onToggleSound,
  onOpenCollection,
  onOpenShop,
  onOpenLeaderboard,
  onOpenMultiplayer,
  onOpenCustomization,
  onOpenCabin,
  onOpenEcosystem,
  onCycleViewMode,
}) => {
  const t = LOCALIZATION[language] || LOCALIZATION.en;

  const getWeatherIcon = (w: WeatherType) => {
    switch (w) {
      case 'SUNNY':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'CLOUDY':
        return <Cloud className="w-3.5 h-3.5 text-slate-300" />;
      case 'RAIN':
        return <CloudRain className="w-3.5 h-3.5 text-cyan-300" />;
      case 'HEAVY_RAIN':
        return <CloudLightning className="w-3.5 h-3.5 text-blue-400" />;
      case 'FOG':
        return <CloudFog className="w-3.5 h-3.5 text-indigo-200" />;
    }
  };

  const getTimeIcon = (time: TimeOfDay) => {
    switch (time) {
      case 'MORNING':
        return <Sunrise className="w-3.5 h-3.5 text-pink-300" />;
      case 'DAY':
        return <Sun className="w-3.5 h-3.5 text-amber-400" />;
      case 'AFTERNOON':
        return <Sun className="w-3.5 h-3.5 text-orange-400" />;
      case 'SUNSET':
        return <Sunset className="w-3.5 h-3.5 text-purple-400" />;
      case 'NIGHT':
        return <Moon className="w-3.5 h-3.5 text-cyan-200" />;
    }
  };

  const getViewModeLabel = (vm: ViewMode) => {
    switch (vm) {
      case 'FISHING_DOCK':
        return 'Dock Cam';
      case 'PLAYER_CABIN':
        return 'Cabin Base';
      case 'UNDERWATER_SONAR':
        return 'Sonar Depth';
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-30 p-1.5 sm:p-2.5 flex items-center justify-between pointer-events-none">
      {/* Left: Brand & Environment controls */}
      <div className="flex items-center gap-1 sm:gap-2 pointer-events-auto overflow-x-auto no-scrollbar">
        {/* App Logo & Title */}
        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-xl shadow-lg shrink-0">
          <img
            src="/logo.svg"
            alt="Fishing Days Logo"
            className="w-6 h-6 object-contain drop-shadow-md"
            referrerPolicy="no-referrer"
          />
          <div className="hidden md:flex flex-col">
            <h1 className="font-extrabold text-xs text-slate-100 leading-tight">
              Fishing Days
            </h1>
            <span className="text-[9px] text-cyan-400 font-semibold leading-tight">
              3D Cozy Indie
            </span>
          </div>
        </div>

        {/* Pause / Resume Button */}
        <button
          id="btn-toggle-pause"
          onClick={onTogglePause}
          title={isPaused ? 'Resume Game' : 'Pause Game'}
          className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-semibold backdrop-blur-md border transition cursor-pointer flex items-center gap-1 shrink-0 ${
            isPaused
              ? 'bg-amber-500/30 border-amber-400 text-amber-200'
              : 'bg-slate-900/85 hover:bg-slate-800 border-slate-700 text-slate-300'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> : <Pause className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isPaused ? 'Paused' : 'Pause'}</span>
        </button>

        {/* Dynamic Weather Toggle */}
        <button
          id="btn-toggle-weather"
          onClick={onCycleWeather}
          title="Click to cycle Weather"
          className="flex items-center gap-1 px-2 py-1 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md rounded-xl text-xs text-slate-200 transition cursor-pointer shrink-0"
        >
          {getWeatherIcon(weather)}
          <span className="hidden lg:inline capitalize font-medium">{weather.toLowerCase().replace('_', ' ')}</span>
        </button>

        {/* Dynamic Time of Day Toggle */}
        <button
          id="btn-toggle-time"
          onClick={onCycleTimeOfDay}
          title="Click to cycle Time of Day"
          className="flex items-center gap-1 px-2 py-1 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md rounded-xl text-xs text-slate-200 transition cursor-pointer shrink-0"
        >
          {getTimeIcon(timeOfDay)}
          <span className="hidden lg:inline capitalize font-medium">{timeOfDay.toLowerCase()}</span>
        </button>

        {/* Camera View Mode Quick Cycle */}
        <button
          id="btn-cycle-viewmode"
          onClick={onCycleViewMode}
          title="Switch 3D Camera Perspective (Dock, Cabin, Sonar)"
          className="flex items-center gap-1 px-2 py-1 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md rounded-xl text-xs text-cyan-300 font-medium transition cursor-pointer shrink-0"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{getViewModeLabel(viewMode)}</span>
        </button>

        {/* Sound Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Relaxing Soundscape' : 'Enable Relaxing Soundscape'}
          className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md rounded-xl text-slate-300 transition cursor-pointer shrink-0"
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>
      </div>

      {/* Right: Stats & Feature Navigation Hub */}
      <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
        {/* Coins Counter */}
        <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-slate-900/90 border border-amber-500/40 backdrop-blur-md rounded-xl text-amber-300 font-mono font-bold text-xs shadow-md">
          <Coins className="w-3 h-3" />
          <span>${coins}</span>
        </div>

        {/* Gear Customization */}
        <button
          id="btn-open-customization"
          onClick={onOpenCustomization}
          title="Custom Gear & Visual Styling"
          className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-purple-500/40 backdrop-blur-md rounded-xl text-purple-300 hover:text-purple-200 transition cursor-pointer flex items-center gap-1 shadow-sm"
        >
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden xl:inline text-xs font-semibold">Gear</span>
        </button>

        {/* Player Cabin & Base */}
        <button
          id="btn-open-cabin"
          onClick={onOpenCabin}
          title="Angler's Cabin Base, Trophies & Crafting"
          className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-amber-600/40 backdrop-blur-md rounded-xl text-amber-300 hover:text-amber-200 transition cursor-pointer flex items-center gap-1 shadow-sm"
        >
          <Home className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden xl:inline text-xs font-semibold">Cabin</span>
        </button>

        {/* Dynamic Underwater Ecosystem HUD */}
        <button
          id="btn-open-ecosystem"
          onClick={onOpenEcosystem}
          title="Underwater Ecosystem & Sonar Telemetry"
          className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-cyan-500/40 backdrop-blur-md rounded-xl text-cyan-300 hover:text-cyan-200 transition cursor-pointer flex items-center gap-1 shadow-sm"
        >
          <Waves className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline text-xs font-semibold">Sonar</span>
        </button>

        {/* Fish Collection Book */}
        <button
          id="btn-open-collection"
          onClick={onOpenCollection}
          title={t.collection}
          className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md rounded-xl text-slate-200 transition cursor-pointer flex items-center gap-1"
        >
          <BookOpen className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden 2xl:inline text-xs font-semibold">{t.collection}</span>
        </button>

        {/* Tackle Shop */}
        <button
          id="btn-open-shop"
          onClick={onOpenShop}
          title={t.gearShop}
          className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md rounded-xl text-slate-200 transition cursor-pointer flex items-center gap-1"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden 2xl:inline text-xs font-semibold">{t.gearShop}</span>
        </button>

        {/* Global Leaderboard */}
        <button
          id="btn-open-leaderboard"
          onClick={onOpenLeaderboard}
          title={t.leaderboard}
          className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md rounded-xl text-slate-200 transition cursor-pointer flex items-center gap-1"
        >
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span className="hidden 2xl:inline text-xs font-semibold">{t.leaderboard}</span>
        </button>

        {/* Multiplayer Social Hub */}
        <button
          id="btn-open-multiplayer"
          onClick={onOpenMultiplayer}
          title={t.multiplayer}
          className="relative p-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/60 backdrop-blur-md rounded-xl text-white transition cursor-pointer flex items-center gap-1 shadow-lg shadow-cyan-950/40"
        >
          <Users className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs font-bold">{t.multiplayer}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
        </button>
      </div>
    </header>
  );
};
