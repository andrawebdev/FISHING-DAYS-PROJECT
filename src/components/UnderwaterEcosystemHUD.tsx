import React, { useState, useEffect } from 'react';
import {
  Waves,
  Eye,
  EyeOff,
  Compass,
  Zap,
  Info,
  Thermometer,
  CloudRain,
  Sun,
  Moon,
  Wind,
  X,
} from 'lucide-react';
import { WeatherType, TimeOfDay, ViewMode } from '../types';

interface UnderwaterEcosystemHUDProps {
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  viewMode: ViewMode;
  onToggleSonarView: () => void;
  isOpen: boolean;
  onClose: () => void;
}

interface EcosystemLogEvent {
  id: string;
  time: string;
  icon: string;
  text: string;
  type: 'PREDATOR_CHASE' | 'SCHOOL_MOVE' | 'WEED_FORAGE' | 'LURE_INTEREST' | 'DEPTH_MIGRATE';
}

export const UnderwaterEcosystemHUD: React.FC<UnderwaterEcosystemHUDProps> = ({
  weather,
  timeOfDay,
  viewMode,
  onToggleSonarView,
  isOpen,
  onClose,
}) => {
  const [logs, setLogs] = useState<EcosystemLogEvent[]>([]);

  // Periodically generate dynamic ecosystem event simulations
  useEffect(() => {
    const initialEvents: EcosystemLogEvent[] = [
      {
        id: '1',
        time: 'Just now',
        icon: '🐟',
        text: 'School of 12 Minnows browsing in shallow curly pondweed beds',
        type: 'SCHOOL_MOVE',
      },
      {
        id: '2',
        time: '15s ago',
        icon: '⚡',
        text: 'Northern Pike positioned motionless along drop-off shelf',
        type: 'PREDATOR_CHASE',
      },
      {
        id: '3',
        time: '30s ago',
        icon: '🌿',
        text: 'River Trout sheltering under dock shadow from surface glare',
        type: 'WEED_FORAGE',
      },
    ];
    setLogs(initialEvents);

    const interval = setInterval(() => {
      const possibleEvents = [
        { icon: '🐟', text: 'Minnow school scatters as Large Bass makes a rush strike!', type: 'PREDATOR_CHASE' },
        { icon: '🌊', text: 'Kelp fronds swaying rhythmically with lake undercurrents', type: 'WEED_FORAGE' },
        { icon: '🎯', text: 'Curious Trout drawn toward lure vibrations in the water column', type: 'LURE_INTEREST' },
        { icon: '🌙', text: 'Deep benthic fish ascending 2m as surface light softens', type: 'DEPTH_MIGRATE' },
        { icon: '🪱', text: 'Channel Catfish foraging along silt bed near sunken roots', type: 'WEED_FORAGE' },
        { icon: '⚡', text: 'Apex Pike lunges from weed ambush; baitfish dart to open water', type: 'PREDATOR_CHASE' },
      ];

      const chosen = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
      const newEv: EcosystemLogEvent = {
        id: Date.now().toString(),
        time: 'Just now',
        icon: chosen.icon,
        text: chosen.text,
        type: chosen.type as any,
      };

      setLogs((prev) => [newEv, ...prev.slice(0, 7)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  // Environmental impact calculations
  const getWeatherEffect = (w: WeatherType) => {
    switch (w) {
      case 'SUNNY':
        return {
          title: 'High Solar Penetration',
          desc: 'Fish dive deep (4-8m) to escape surface glare. Dense weed beds provide sanctuary.',
          feedingActivity: 'Moderate',
          depthBias: 'Deep (-4m to -7m)',
        };
      case 'CLOUDY':
        return {
          title: 'Soft Diffuse Illumination',
          desc: 'Predators roam freely across open flats; baitfish school tightly near current edges.',
          feedingActivity: 'High (+35%)',
          depthBias: 'Mid-Water (-2m to -4m)',
        };
      case 'RAIN':
      case 'HEAVY_RAIN':
        return {
          title: 'Oxygenation & Surface Commotion',
          desc: 'Falling raindrops stir insects; topwater feeding frenzy and aggressive lure strikes.',
          feedingActivity: 'Very High (+60%)',
          depthBias: 'Surface & Mid (-0.5m to -3m)',
        };
      case 'FOG':
        return {
          title: 'Low Refractive Fog Veil',
          desc: 'Mystic and rare bioluminescent lake species ascend toward shallower shelves.',
          feedingActivity: 'Surreal (+45% Rare Encounter)',
          depthBias: 'Shallow Slopes (-1.5m to -3.5m)',
        };
    }
  };

  const getTimeEffect = (t: TimeOfDay) => {
    switch (t) {
      case 'MORNING':
      case 'SUNSET':
        return {
          label: 'Golden Feeding Hours',
          desc: 'Predator-prey hunting chases reach peak intensity. Highest bite probability!',
          bonus: '+50% Strike Aggression',
        };
      case 'DAY':
        return {
          label: 'Midday Stagnation',
          desc: 'Fish rest in deep cold thermoclines or dense weed canopies.',
          bonus: 'Normal Baseline',
        };
      case 'AFTERNOON':
        return {
          label: 'Warming Shallows',
          desc: 'Sun warms the shallows; active cruising along rocky ledges.',
          bonus: '+20% Sight Feeding',
        };
      case 'NIGHT':
        return {
          label: 'Nocturnal Abyss Migration',
          desc: 'Diurnal species enter torpor. Bioluminescent and giant trench dwellers emerge.',
          bonus: '+80% Deep Leviathans',
        };
    }
  };

  const weatherEffect = getWeatherEffect(weather);
  const timeEffect = getTimeEffect(timeOfDay);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[88vh] max-h-[700px] bg-slate-900/95 border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Waves className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Dynamic Underwater Ecosystem & Sonar
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  Living Biosphere
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simulated predator-prey food web, depth migrations, and reactive aquatic vegetation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onToggleSonarView();
                onClose();
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                viewMode === 'UNDERWATER_SONAR'
                  ? 'bg-cyan-500 text-slate-950 shadow-cyan-500/25'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              {viewMode === 'UNDERWATER_SONAR' ? 'Exit Subaquatic Cam' : 'Plunge Sonar Cam'}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sonar Status Banner */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/90 border-b border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-4 text-slate-400">
            <span>
              Biome: <strong className="text-cyan-400">Subalpine Glacial Lake</strong>
            </span>
            <span>
              Surface Temp: <strong className="text-emerald-400">16.4°C</strong>
            </span>
            <span>
              Clarity: <strong className="text-blue-400">High (92%)</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Telemetry Active</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-900/40">
          
          {/* Active Biosphere Populations */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Simulated Food Web & Trophic Layers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  layer: 'Primary Foragers',
                  name: 'Minnows & Bluegill',
                  count: '30 - 45 fish',
                  role: 'Prey (Baitfish Schools)',
                  desc: 'Tight schooling boids navigation, feeding on plankton and surface insect falls.',
                  icon: '🐟',
                  color: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300',
                },
                {
                  layer: 'Mid-Tier Hunters',
                  name: 'Largemouth Bass & Perch',
                  count: '8 - 14 fish',
                  role: 'Weedline Predators',
                  desc: 'Stalk edges of submerged vegetation; burst sprint ambush strikes on schools.',
                  icon: '⚡',
                  color: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300',
                },
                {
                  layer: 'Apex Stalker',
                  name: 'Northern Pike & Trout',
                  count: '3 - 6 fish',
                  role: 'Apex Solitary Hunter',
                  desc: 'Prowls deep drop-offs and sunken timber. Attracted to noisy surface lures.',
                  icon: '🦈',
                  color: 'border-amber-500/30 bg-amber-950/20 text-amber-300',
                },
                {
                  layer: 'Deep Benthic / Ancient',
                  name: 'Sturgeon & Moonfin',
                  count: '1 - 3 fish',
                  role: 'Benthic / Trench Guardians',
                  desc: 'Cruise bottom silt beds; nocturnal bioluminescent migrations.',
                  icon: '✨',
                  color: 'border-purple-500/30 bg-purple-950/20 text-purple-300',
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${item.color}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10">
                        {item.count}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white tracking-tight">{item.name}</h4>
                    <span className="text-[10px] font-mono block text-slate-400 mt-0.5">{item.role}</span>
                    <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Environmental Influences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Weather Influence */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Weather Dynamics: {weather}
                </h4>
              </div>
              <div className="text-xs text-slate-300 font-semibold">{weatherEffect.title}</div>
              <p className="text-xs text-slate-400">{weatherEffect.desc}</p>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono flex justify-between">
                <span className="text-slate-400">Surface Feeding:</span>
                <span className="text-emerald-400 font-bold">{weatherEffect.feedingActivity}</span>
              </div>
              <div className="text-[11px] font-mono flex justify-between">
                <span className="text-slate-400">Fish Depth Layer:</span>
                <span className="text-cyan-400">{weatherEffect.depthBias}</span>
              </div>
            </div>

            {/* Time of Day Influence */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Diurnal Cycle: {timeOfDay}
                </h4>
              </div>
              <div className="text-xs text-slate-300 font-semibold">{timeEffect.label}</div>
              <p className="text-xs text-slate-400">{timeEffect.desc}</p>
              <div className="pt-2 border-t border-slate-800 text-[11px] font-mono flex justify-between">
                <span className="text-slate-400">Predator Aggression:</span>
                <span className="text-amber-400 font-bold">{timeEffect.bonus}</span>
              </div>
              <div className="text-[11px] font-mono flex justify-between">
                <span className="text-slate-400">Current Light Level:</span>
                <span className="text-slate-300 capitalize">{timeOfDay.toLowerCase()} spectrum</span>
              </div>
            </div>
          </div>

          {/* Live Predator-Prey Interaction Events */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                Live Subsurface Telemetry Stream
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Real-time Autonomous Events</span>
            </h3>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs transition-colors hover:bg-slate-900"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base flex-shrink-0">{log.icon}</span>
                    <span className="text-slate-300 truncate">{log.text}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap ml-3">
                    {log.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Subaquatic Cam Direct Switch */}
          <div className="p-4 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-slate-950 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">Direct Sonar Camera Perspective</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Dive beneath the water surface to see schools of fish swim through waving kelp beds and interact with your lure!
              </p>
            </div>
            <button
              onClick={() => {
                onToggleSonarView();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 whitespace-nowrap transition-all"
            >
              {viewMode === 'UNDERWATER_SONAR' ? 'Return to Pier' : 'Enter Subaquatic Cam'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
