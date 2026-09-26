import React from 'react';
import {
  WeatherType,
  TimeOfDay,
  SupportedLanguage,
  DailyMission,
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
  Palette,
  Home,
  Pause,
  Play,
  Award,
  HelpCircle,
} from 'lucide-react';

interface EnvironmentControlBarProps {
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  coins: number;
  soundEnabled: boolean;
  language: SupportedLanguage;
  isPaused: boolean;
  dailyMissions?: DailyMission[];
  onOpenDailyMissions?: () => void;
  onTogglePause: () => void;
  onCycleWeather: () => void;
  onCycleTimeOfDay: () => void;
  onToggleSound: () => void;
  onOpenCollection: () => void;
  onOpenShop?: () => void;
  onOpenCustomization?: () => void;
  onOpenCabin?: () => void;
  onOpenGuide?: () => void;
}

export const EnvironmentControlBar: React.FC<EnvironmentControlBarProps> = ({
  weather,
  timeOfDay,
  coins,
  soundEnabled,
  language,
  isPaused,
  dailyMissions = [],
  onOpenDailyMissions,
  onTogglePause,
  onCycleWeather,
  onCycleTimeOfDay,
  onToggleSound,
  onOpenCollection,
  onOpenShop,
  onOpenCustomization,
  onOpenCabin,
  onOpenGuide,
}) => {
  const t = LOCALIZATION[language] || LOCALIZATION.en;

  const completedMissionsCount = dailyMissions.filter((m) => m.completed && !m.claimed).length;

  const getWeatherIcon = (w: WeatherType) => {
    switch (w) {
      case 'SUNNY':
        return <Sun className="w-3.5 h-3.5" />;
      case 'CLOUDY':
        return <Cloud className="w-3.5 h-3.5" />;
      case 'RAIN':
        return <CloudRain className="w-3.5 h-3.5" />;
      case 'HEAVY_RAIN':
        return <CloudLightning className="w-3.5 h-3.5" />;
      case 'FOG':
        return <CloudFog className="w-3.5 h-3.5" />;
    }
  };

  const getTimeIcon = (time: TimeOfDay) => {
    switch (time) {
      case 'MORNING':
        return <Sunrise className="w-3.5 h-3.5" />;
      case 'DAY':
        return <Sun className="w-3.5 h-3.5" />;
      case 'AFTERNOON':
        return <Sun className="w-3.5 h-3.5" />;
      case 'SUNSET':
        return <Sunset className="w-3.5 h-3.5" />;
      case 'NIGHT':
        return <Moon className="w-3.5 h-3.5" />;
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-30 p-2 sm:p-3 flex items-start justify-between pointer-events-none font-mono select-none">
      {/* TOP LEFT: FISHING DAYS Small Identity & Atmospheric telemetry */}
      <div className="flex flex-col gap-1 pointer-events-auto">
        <div className="bg-black text-white border-2 border-white px-3 py-1.5 shadow-[3px_3px_0px_0px_#ffffff] flex items-center gap-2.5">
          <img
            src="/logo.svg"
            alt="Logo"
            className="w-5 h-5 object-contain invert"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="font-black text-xs tracking-widest uppercase">
              FISHING DAYS
            </span>
          </div>
        </div>

        {/* Environmental Time & Weather telemetry */}
        <div className="flex items-center gap-1.5 text-[11px]">
          {/* Weather Toggle */}
          <button
            id="btn-toggle-weather"
            onClick={onCycleWeather}
            title="Click to toggle weather"
            className="flex items-center gap-1.5 px-2 py-1 bg-black text-white border border-white hover:bg-white hover:text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
          >
            {getWeatherIcon(weather)}
            <span className="uppercase text-[10px] font-bold">{weather.replace('_', ' ')}</span>
          </button>

          {/* Time of Day Toggle */}
          <button
            id="btn-toggle-time"
            onClick={onCycleTimeOfDay}
            title="Click to toggle time of day"
            className="flex items-center gap-1.5 px-2 py-1 bg-black text-white border border-white hover:bg-white hover:text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
          >
            {getTimeIcon(timeOfDay)}
            <span className="uppercase text-[10px] font-bold">{timeOfDay}</span>
          </button>

          {/* Pause / Resume */}
          <button
            id="btn-toggle-pause"
            onClick={onTogglePause}
            title={isPaused ? 'Resume' : 'Pause'}
            className="p-1 bg-black text-white border border-white hover:bg-white hover:text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute' : 'Unmute'}
            className="p-1 bg-black text-white border border-white hover:bg-white hover:text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 opacity-50" />}
          </button>
        </div>
      </div>

      {/* TOP RIGHT: Money, Daily Missions, Encyclopedia, Shop, Cabin */}
      <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
        {/* Money / Coins (Bold Maximalist Counter) */}
        <div className="flex items-center gap-2 px-3 py-1 bg-black text-white border-2 border-white shadow-[3px_3px_0px_0px_#ffffff]">
          <span className="text-[10px] tracking-widest opacity-80 uppercase">BALANCE:</span>
          <span className="text-sm sm:text-base font-black tracking-tight">${coins}</span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {/* Daily Missions Button with Alert indicator if claimable */}
          {onOpenDailyMissions && (
            <button
              id="btn-open-daily-missions"
              onClick={onOpenDailyMissions}
              className={`flex items-center gap-1.5 px-2.5 py-1 border transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff] ${
                completedMissionsCount > 0
                  ? 'bg-white text-black border-white animate-bounce'
                  : 'bg-black text-white border-white hover:bg-white hover:text-black'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline uppercase text-[10px]">MISSIONS</span>
              {completedMissionsCount > 0 && (
                <span className="px-1 py-0.2 bg-black text-white text-[9px] font-black">
                  !
                </span>
              )}
            </button>
          )}

          {/* Fish Encyclopedia */}
          <button
            id="btn-open-collection"
            onClick={onOpenCollection}
            title={t.collection}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-black text-white border border-white hover:bg-white hover:text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline uppercase text-[10px]">ENCYCLOPEDIA</span>
          </button>

          {/* Tackle Shop */}
          {onOpenShop && (
            <button
              id="btn-open-tackle-shop"
              onClick={onOpenShop}
              title="Tackle Shop"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-black text-white border border-white hover:bg-white hover:text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline uppercase text-[10px]">SHOP</span>
            </button>
          )}

          {/* Cabin */}
          {onOpenCabin && (
            <button
              id="btn-open-player-cabin"
              onClick={onOpenCabin}
              title="Player Cabin"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-black text-white border border-white hover:bg-white hover:text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline uppercase text-[10px]">CABIN</span>
            </button>
          )}

          {/* Gear Customization */}
          {onOpenCustomization && (
            <button
              id="btn-open-gear-customization"
              onClick={onOpenCustomization}
              title="Gear Customization"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-black text-white border border-white hover:bg-white hover:text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
            >
              <Palette className="w-3.5 h-3.5" />
              <span className="hidden lg:inline uppercase text-[10px]">GEAR</span>
            </button>
          )}

          {/* Guide / Field Manual */}
          {onOpenGuide && (
            <button
              id="btn-open-fishing-guide"
              onClick={onOpenGuide}
              title="Angler Field Guide"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-black text-white border border-white hover:bg-white hover:text-black transition-colors cursor-pointer shadow-[2px_2px_0px_0px_#ffffff]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline uppercase text-[10px]">GUIDE</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
