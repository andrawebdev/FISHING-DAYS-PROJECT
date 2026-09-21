import React from 'react';
import {
  WeatherType,
  TimeOfDay,
  SupportedLanguage,
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
  Pause,
  Play,
} from 'lucide-react';

interface EnvironmentControlBarProps {
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  coins: number;
  soundEnabled: boolean;
  language: SupportedLanguage;
  isPaused: boolean;
  onTogglePause: () => void;
  onCycleWeather: () => void;
  onCycleTimeOfDay: () => void;
  onToggleSound: () => void;
  onOpenCollection: () => void;
}

export const EnvironmentControlBar: React.FC<EnvironmentControlBarProps> = ({
  weather,
  timeOfDay,
  coins,
  soundEnabled,
  language,
  isPaused,
  onTogglePause,
  onCycleWeather,
  onCycleTimeOfDay,
  onToggleSound,
  onOpenCollection,
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

  return (
    <header className="fixed top-0 inset-x-0 z-30 p-2 sm:p-3 flex items-center justify-between pointer-events-none">
      {/* Left: Brand & Atmosphere controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {/* App Logo & Title */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-xl shadow-md shrink-0">
          <img
            src="/logo.svg"
            alt="Fishing Days Logo"
            className="w-6 h-6 object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="hidden sm:flex flex-col">
            <h1 className="font-bold text-xs text-slate-100 leading-tight">
              Fishing Days
            </h1>
            <span className="text-[9px] text-cyan-400 font-medium leading-tight">
              3D Cozy Indie
            </span>
          </div>
        </div>

        {/* Pause / Resume Button */}
        <button
          id="btn-toggle-pause"
          onClick={onTogglePause}
          title={isPaused ? 'Resume Game' : 'Pause Game'}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            isPaused
              ? 'bg-amber-500/25 border-amber-400 text-amber-200'
              : 'bg-slate-900/85 hover:bg-slate-800 border-slate-700/80 text-slate-300'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-amber-300 fill-amber-300" /> : <Pause className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isPaused ? 'Paused' : 'Pause'}</span>
        </button>

        {/* Weather Cycle */}
        <button
          id="btn-toggle-weather"
          onClick={onCycleWeather}
          title="Click to change weather"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md rounded-xl text-xs text-slate-200 transition cursor-pointer shrink-0"
        >
          {getWeatherIcon(weather)}
          <span className="hidden md:inline capitalize font-medium">{weather.toLowerCase().replace('_', ' ')}</span>
        </button>

        {/* Time of Day Cycle */}
        <button
          id="btn-toggle-time"
          onClick={onCycleTimeOfDay}
          title="Click to change time of day"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md rounded-xl text-xs text-slate-200 transition cursor-pointer shrink-0"
        >
          {getTimeIcon(timeOfDay)}
          <span className="hidden md:inline capitalize font-medium">{timeOfDay.toLowerCase()}</span>
        </button>

        {/* Sound Toggle */}
        <button
          id="btn-toggle-sound"
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          className="p-2 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md rounded-xl text-slate-300 transition cursor-pointer shrink-0"
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>
      </div>

      {/* Right: Coins and Functional Catch Catalog */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
        {/* Money / Coins Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 border border-amber-500/40 backdrop-blur-md rounded-xl text-amber-300 font-mono font-bold text-xs shadow-md">
          <Coins className="w-3.5 h-3.5" />
          <span>${coins}</span>
        </div>

        {/* Fish Collection / Catches Catalog */}
        <button
          id="btn-open-collection"
          onClick={onOpenCollection}
          title={t.collection}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md rounded-xl text-slate-200 text-xs font-semibold transition cursor-pointer shadow-sm"
        >
          <BookOpen className="w-3.5 h-3.5 text-teal-400" />
          <span>{t.collection}</span>
        </button>
      </div>
    </header>
  );
};
