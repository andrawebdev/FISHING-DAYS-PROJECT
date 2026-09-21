import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FishingState,
  FishSpecies,
  CatchRecord,
  WeatherType,
  TimeOfDay,
  SupportedLanguage,
  RodItem,
  ReelItem,
  LineItem,
  BaitItem,
  LureItem,
  GearCustomization,
  CabinTheme,
  DockLighting,
  MountedTrophy,
} from './types';
import { FISH_DATABASE } from './data/fishDatabase';
import { RODS, REELS, LINES, BAITS, LURES } from './data/gearDatabase';
import { soundEngine } from './services/soundEngine';
import { ThreeCanvas } from './components/ThreeCanvas';
import { FishingHUD } from './components/FishingHUD';
import { MobileJoystick } from './components/MobileJoystick';
import { CatchModal } from './components/CatchModal';
import { FishCollectionModal } from './components/FishCollectionModal';
import { EnvironmentControlBar } from './components/EnvironmentControlBar';

export default function App() {
  // --- PLAYER PROGRESSION & INVENTORY STATE ---
  const [coins, setCoins] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_coins');
      return saved ? Math.max(0, parseInt(saved, 10)) : 150;
    } catch {
      return 150;
    }
  });

  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_lang') as SupportedLanguage;
      return saved || 'en';
    } catch {
      return 'en';
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Equipped Gear
  const [equippedRodId] = useState<string>('bamboo_starter');
  const [equippedReelId] = useState<string>('basic_reel');
  const [equippedLineId] = useState<string>('mono_starter');
  const [equippedBaitId] = useState<string>('bread_crumbs');

  // Gear Customization State
  const [customization] = useState<GearCustomization>(() => ({
    rodColor: '#a16207',
    rodPattern: 'SOLID',
    handleGrip: 'NATURAL_CORK',
    guideRingColor: '#eab308',
    reelMetalTint: 'SILVER',
    lineTint: 'CLEAR',
    bobberStyle: 'CLASSIC_SPHERE',
  }));

  // Player Cabin & Base State
  const [cabinTheme] = useState<CabinTheme>('RUSTIC_CEDAR');
  const [dockLighting] = useState<DockLighting>('EDISON_BULBS');
  const [mountedTrophies] = useState<MountedTrophy[]>([]);

  // Catch history
  const [catchHistory, setCatchHistory] = useState<CatchRecord[]>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_catch_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fish Collection Catalog
  const [unlockedCatches, setUnlockedCatches] = useState<Record<string, CatchRecord>>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_collection');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // --- ENVIRONMENT & ATMOSPHERE ---
  const [weather, setWeather] = useState<WeatherType>('SUNNY');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('DAY');

  // --- STRICT FISHING STATE MACHINE: IDLE → CASTING → WAITING → BITE → HOOKED → REELING → CAUGHT → IDLE ---
  const [fishingState, setFishingState] = useState<FishingState>('IDLE');
  const [canFish, setCanFish] = useState<boolean>(true);
  const [castPower, setCastPower] = useState<number>(0);
  const [lineTension, setLineTension] = useState<number>(0.3);
  const [fishDistance, setFishDistance] = useState<number>(14);
  const [isReeling, setIsReeling] = useState<boolean>(false);
  const [joystickInput, setJoystickInput] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Active Fish on Line
  const [activeFish, setActiveFish] = useState<FishSpecies | null>(null);
  const [lastCatchRecord, setLastCatchRecord] = useState<CatchRecord | null>(null);
  const [isNewRecordCatch, setIsNewRecordCatch] = useState<boolean>(false);

  // UI Modals
  const [showCatchModal, setShowCatchModal] = useState<boolean>(false);
  const [showCollectionModal, setShowCollectionModal] = useState<boolean>(false);

  // Strict Timer References to prevent memory leaks and orphaned intervals
  const castChargeTimerRef = useRef<number | null>(null);
  const biteTimeoutRef = useRef<number | null>(null);
  const biteWindowTimerRef = useRef<number | null>(null);
  const approachTimerRef = useRef<number | null>(null);
  const gameLoopTimerRef = useRef<number | null>(null);
  const castLandingTimerRef = useRef<number | null>(null);
  const hookTransitionTimerRef = useRef<number | null>(null);

  // Double-action guards
  const isHookingRef = useRef<boolean>(false);
  const isCastingRef = useRef<boolean>(false);

  const equippedRod = RODS.find((r) => r.id === equippedRodId) || RODS[0];
  const equippedReel = REELS.find((r) => r.id === equippedReelId) || REELS[0];
  const equippedLine = LINES.find((l) => l.id === equippedLineId) || LINES[0];
  const equippedBait = BAITS.find((b) => b.id === equippedBaitId) || BAITS[0];

  // Local persistence sync
  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_coins', coins.toString());
    } catch {}
  }, [coins]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_lang', language);
    } catch {}
  }, [language]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_collection', JSON.stringify(unlockedCatches));
    } catch {}
  }, [unlockedCatches]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_catch_history', JSON.stringify(catchHistory));
    } catch {}
  }, [catchHistory]);

  // Weather & Atmosphere Sounds
  useEffect(() => {
    if (soundEnabled && !isPaused) {
      soundEngine.setMute(false);
      soundEngine.updateAtmosphere(weather, timeOfDay);
    } else {
      soundEngine.setMute(true);
    }
  }, [weather, timeOfDay, soundEnabled, isPaused]);

  // Clean timer disposal function
  const clearAllFishingTimers = useCallback(() => {
    if (castChargeTimerRef.current) {
      clearInterval(castChargeTimerRef.current);
      castChargeTimerRef.current = null;
    }
    if (biteTimeoutRef.current) {
      clearTimeout(biteTimeoutRef.current);
      biteTimeoutRef.current = null;
    }
    if (biteWindowTimerRef.current) {
      clearTimeout(biteWindowTimerRef.current);
      biteWindowTimerRef.current = null;
    }
    if (approachTimerRef.current) {
      clearTimeout(approachTimerRef.current);
      approachTimerRef.current = null;
    }
    if (gameLoopTimerRef.current) {
      clearInterval(gameLoopTimerRef.current);
      gameLoopTimerRef.current = null;
    }
    if (castLandingTimerRef.current) {
      clearTimeout(castLandingTimerRef.current);
      castLandingTimerRef.current = null;
    }
    if (hookTransitionTimerRef.current) {
      clearTimeout(hookTransitionTimerRef.current);
      hookTransitionTimerRef.current = null;
    }
    isHookingRef.current = false;
    isCastingRef.current = false;
  }, []);

  // Cleanup on unmount or pause
  useEffect(() => {
    return () => {
      clearAllFishingTimers();
      soundEngine.stopTensionSound();
      soundEngine.stopReelingSound();
    };
  }, [clearAllFishingTimers]);

  // Fish spawning & weight scoring logic
  const selectEligibleFish = useCallback((): FishSpecies => {
    const scored = FISH_DATABASE.map((fish) => {
      let weight = 1.0;

      if (fish.preferredWeather.includes(weather)) weight *= 1.8;
      if (fish.preferredTime.includes(timeOfDay)) weight *= 1.6;
      if (fish.preferredBait.includes(equippedBait.id)) weight *= 2.2;

      const baitBoost = equippedBait.rarityBoostPercent || 0;
      switch (fish.rarity) {
        case 'COMMON':
          weight *= 4.0;
          break;
        case 'UNCOMMON':
          weight *= 2.5 + baitBoost * 0.02;
          break;
        case 'RARE':
          weight *= 1.4 + baitBoost * 0.03;
          break;
        case 'EPIC':
          weight *= 0.6 + baitBoost * 0.04;
          break;
        case 'LEGENDARY':
          weight *= 0.25 + baitBoost * 0.05;
          break;
        case 'MYTHIC':
          weight *= 0.08 + baitBoost * 0.06;
          break;
      }

      return { fish, weight };
    });

    const totalWeight = scored.reduce((acc, cur) => acc + cur.weight, 0);
    let randomRoll = Math.random() * totalWeight;

    for (const item of scored) {
      if (randomRoll <= item.weight) {
        return item.fish;
      }
      randomRoll -= item.weight;
    }

    return FISH_DATABASE[0];
  }, [weather, timeOfDay, equippedBait]);

  // --- BITE & APPROACH TIMERS ---
  const triggerFishBite = useCallback(() => {
    setFishingState('BITE');
    soundEngine.playBiteAlert();

    const reactionWindow = 2000;

    biteWindowTimerRef.current = window.setTimeout(() => {
      soundEngine.playHookEscape();
      setFishingState('CANCELLED');
    }, reactionWindow);
  }, []);

  const scheduleFishApproach = useCallback(() => {
    if (approachTimerRef.current) clearTimeout(approachTimerRef.current);
    if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);

    const baseDelay = Math.random() * 3200 + 2200;
    const speedMultiplier = 1 / (1 + (equippedBait.biteRateBonus || 0) / 100);
    const approachDelay = baseDelay * speedMultiplier;

    approachTimerRef.current = window.setTimeout(() => {
      soundEngine.playFishApproaching();
      const candidateFish = selectEligibleFish();
      setActiveFish(candidateFish);

      const biteDelay = Math.random() * 1800 + 1000;
      biteTimeoutRef.current = window.setTimeout(() => {
        triggerFishBite();
      }, biteDelay);
    }, approachDelay);
  }, [equippedBait, selectEligibleFish, triggerFishBite]);

  // --- CAST CHARGING ---
  const handleStartCastCharge = useCallback(() => {
    if (fishingState !== 'IDLE' || !canFish || isPaused || isCastingRef.current) return;
    clearAllFishingTimers();
    soundEngine.resume();
    setFishingState('CASTING');
    setCastPower(0.2);

    let power = 0.2;
    let direction = 1;
    castChargeTimerRef.current = window.setInterval(() => {
      power += direction * 0.05;
      if (power >= 1.0) {
        power = 1.0;
        direction = -1;
      } else if (power <= 0.2) {
        power = 0.2;
        direction = 1;
      }
      setCastPower(power);
    }, 40);
  }, [fishingState, canFish, isPaused, clearAllFishingTimers]);

  const handleReleaseCastCharge = useCallback(() => {
    if (castChargeTimerRef.current) {
      clearInterval(castChargeTimerRef.current);
      castChargeTimerRef.current = null;
    }

    if (fishingState !== 'CASTING' || !canFish || isCastingRef.current) return;
    isCastingRef.current = true;

    soundEngine.playCastWhoosh();

    const maxCast = 8 + castPower * 14 * (1 + equippedRod.castDistanceBonus / 100);
    setFishDistance(maxCast);

    // Bobber lands in water after 650ms
    castLandingTimerRef.current = window.setTimeout(() => {
      isCastingRef.current = false;
      soundEngine.playBobberSplash();
      setFishingState('WAITING');
      setLineTension(0.35);

      scheduleFishApproach();
    }, 650);
  }, [fishingState, canFish, castPower, equippedRod, scheduleFishApproach]);

  // --- HOOKING & FIGHT REELING ---
  const handleHookFish = useCallback(() => {
    if (fishingState !== 'BITE' || isHookingRef.current) return;
    isHookingRef.current = true;

    if (biteWindowTimerRef.current) {
      clearTimeout(biteWindowTimerRef.current);
      biteWindowTimerRef.current = null;
    }

    soundEngine.playHookSuccess();
    setFishingState('HOOKED');
    setLineTension(0.45);

    hookTransitionTimerRef.current = window.setTimeout(() => {
      isHookingRef.current = false;
      // Ready to reel
    }, 300);
  }, [fishingState]);

  const handleStartReel = useCallback(() => {
    if (isPaused) return;
    if (fishingState !== 'HOOKED' && fishingState !== 'REELING') return;
    setIsReeling(true);
    setFishingState('REELING');
    soundEngine.startReelingSound();
  }, [isPaused, fishingState]);

  const handleStopReel = useCallback(() => {
    setIsReeling(false);
    soundEngine.stopReelingSound();
    if (fishingState === 'REELING') {
      setFishingState('HOOKED');
    }
  }, [fishingState]);

  // --- CATCH SUCCESS PRESENTATION ---
  const triggerCatchSuccess = useCallback(() => {
    clearAllFishingTimers();
    soundEngine.stopTensionSound();
    soundEngine.stopReelingSound();

    const fish = activeFish || FISH_DATABASE[0];
    const isSpecial = fish.rarity === 'LEGENDARY' || fish.rarity === 'MYTHIC';
    soundEngine.playCatchSuccess(isSpecial);

    const weightRange = fish.maxWeight - fish.minWeight;
    const lengthRange = fish.maxLength - fish.minLength;
    const caughtWeight = Number((fish.minWeight + Math.random() * weightRange).toFixed(2));
    const caughtLength = Number((fish.minLength + Math.random() * lengthRange).toFixed(1));

    const valueMultiplier = caughtWeight / fish.minWeight;
    const actualValue = Math.round(fish.baseValue * valueMultiplier);

    const record: CatchRecord = {
      id: 'catch_' + Date.now(),
      speciesId: fish.id,
      speciesName: fish.name,
      rarity: fish.rarity,
      weight: caughtWeight,
      length: caughtLength,
      value: actualValue,
      caughtAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      caughtBy: 'Angler',
      weather,
      timeOfDay,
      location: 'Village Dock Waters',
    };

    // Store in history
    setCatchHistory((prev) => [record, ...prev.slice(0, 49)]);

    // Check personal record
    const existing = unlockedCatches[fish.id];
    const isNewBest = !existing || caughtWeight > existing.weight;
    setIsNewRecordCatch(isNewBest);

    setLastCatchRecord(record);
    setFishingState('CAUGHT');
    setShowCatchModal(true);
  }, [activeFish, weather, timeOfDay, unlockedCatches, clearAllFishingTimers]);

  // --- ACTIVE FIGHT GAME LOOP: Smooth line tension calculation ---
  useEffect(() => {
    if (isPaused || (fishingState !== 'HOOKED' && fishingState !== 'REELING')) {
      if (gameLoopTimerRef.current) {
        clearInterval(gameLoopTimerRef.current);
        gameLoopTimerRef.current = null;
      }
      return;
    }

    const interval = window.setInterval(() => {
      setLineTension((prevTension) => {
        let nextTension = prevTension;
        const fishDifficulty = activeFish?.difficulty || 3;
        const rodTolerance = 1 + equippedRod.tensionToleranceBonus / 100;
        const reelDrag = 1 + equippedReel.dragStability / 100;

        if (isReeling) {
          // Reeling increases tension smoothly based on fish resistance
          const tensionRate = (0.016 * (fishDifficulty * 0.6)) / (rodTolerance * reelDrag);
          nextTension += tensionRate;
        } else {
          // Tension steadily relaxes when not reeling
          nextTension -= 0.018;
        }

        // Controlled subtle fish struggle variance (no erratic spikes)
        if (Math.random() < 0.08) {
          nextTension += (Math.random() * 0.05 * fishDifficulty) / rodTolerance;
        }

        soundEngine.updateTensionSound(nextTension);

        // Snap condition: High tension sustained >= 0.98
        if (nextTension >= 0.98) {
          soundEngine.playLineSnap();
          setFishingState('CANCELLED');
          setIsReeling(false);
          soundEngine.stopReelingSound();
          return 1.0;
        }

        // Slack slip condition: Tension collapses below 0.02
        if (nextTension <= 0.02) {
          soundEngine.stopTensionSound();
          soundEngine.stopReelingSound();
          setFishingState('CANCELLED');
          setIsReeling(false);
          return 0.0;
        }

        return Math.min(1.0, Math.max(0.01, nextTension));
      });

      setFishDistance((prevDist) => {
        if (!isReeling) {
          // Fish swims slightly away when free
          return Math.min(22, prevDist + 0.04);
        }

        // Reel speed pulls fish inward
        const reelSpeed = 0.22 * (1 + equippedReel.reelSpeedBonus / 100);
        const nextDist = prevDist - reelSpeed;

        if (nextDist <= 1.0) {
          triggerCatchSuccess();
          return 0;
        }

        return nextDist;
      });
    }, 50);

    gameLoopTimerRef.current = interval;
    return () => {
      clearInterval(interval);
      gameLoopTimerRef.current = null;
    };
  }, [fishingState, isReeling, isPaused, activeFish, equippedRod, equippedReel, triggerCatchSuccess]);

  const handleSellCatch = useCallback(() => {
    if (lastCatchRecord) {
      setCoins((prev) => prev + lastCatchRecord.value);
      soundEngine.playCoinDing();

      setUnlockedCatches((prev) => {
        const cur = prev[lastCatchRecord.speciesId];
        if (!cur || lastCatchRecord.weight > cur.weight) {
          return { ...prev, [lastCatchRecord.speciesId]: lastCatchRecord };
        }
        return prev;
      });
    }
    setShowCatchModal(false);
    clearAllFishingTimers();
    setFishingState('IDLE');
  }, [lastCatchRecord, clearAllFishingTimers]);

  const handleKeepCatch = useCallback(() => {
    if (lastCatchRecord) {
      setUnlockedCatches((prev) => {
        const cur = prev[lastCatchRecord.speciesId];
        if (!cur || lastCatchRecord.weight > cur.weight) {
          return { ...prev, [lastCatchRecord.speciesId]: lastCatchRecord };
        }
        return prev;
      });
    }
    setShowCatchModal(false);
    clearAllFishingTimers();
    setFishingState('IDLE');
  }, [lastCatchRecord, clearAllFishingTimers]);

  const handleResetToIdle = useCallback(() => {
    clearAllFishingTimers();
    soundEngine.stopTensionSound();
    soundEngine.stopReelingSound();
    setIsReeling(false);
    setFishingState('IDLE');
  }, [clearAllFishingTimers]);

  // Weather & Time toggles
  const cycleWeather = () => {
    const weathers: WeatherType[] = ['SUNNY', 'CLOUDY', 'RAIN', 'HEAVY_RAIN', 'FOG'];
    const idx = weathers.indexOf(weather);
    setWeather(weathers[(idx + 1) % weathers.length]);
  };

  const cycleTimeOfDay = () => {
    const times: TimeOfDay[] = ['MORNING', 'DAY', 'AFTERNOON', 'SUNSET', 'NIGHT'];
    const idx = times.indexOf(timeOfDay);
    setTimeOfDay(times[(idx + 1) % times.length]);
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => !prev);
  };

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pause toggle: Key P
      if (e.code === 'KeyP') {
        setIsPaused((prev) => !prev);
        return;
      }

      if (isPaused) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (fishingState === 'IDLE' && canFish) {
          handleStartCastCharge();
        } else if (fishingState === 'BITE') {
          handleHookFish();
        } else if (fishingState === 'HOOKED' || fishingState === 'REELING') {
          handleStartReel();
        }
      }

      if (e.code === 'Escape') {
        if (showCatchModal) setShowCatchModal(false);
        if (showCollectionModal) setShowCollectionModal(false);
        if (fishingState !== 'IDLE') handleResetToIdle();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (fishingState === 'CASTING') {
          handleReleaseCastCharge();
        } else if (fishingState === 'REELING') {
          handleStopReel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isPaused,
    fishingState,
    canFish,
    showCatchModal,
    showCollectionModal,
    handleStartCastCharge,
    handleReleaseCastCharge,
    handleHookFish,
    handleStartReel,
    handleStopReel,
    handleResetToIdle,
  ]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* 1. TOP ENVIRONMENT & UTILITY BAR */}
      <EnvironmentControlBar
        weather={weather}
        timeOfDay={timeOfDay}
        coins={coins}
        soundEnabled={soundEnabled}
        language={language}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((p) => !p)}
        onCycleWeather={cycleWeather}
        onCycleTimeOfDay={cycleTimeOfDay}
        onToggleSound={toggleSound}
        onOpenCollection={() => setShowCollectionModal(true)}
      />

      {/* 2. 3D WEBGL ENGINE */}
      <ThreeCanvas
        fishingState={fishingState}
        castPower={castPower}
        lineTension={lineTension}
        fishDistance={fishDistance}
        weather={weather}
        timeOfDay={timeOfDay}
        equippedRod={equippedRod}
        customization={customization}
        cabinTheme={cabinTheme}
        dockLighting={dockLighting}
        mountedTrophies={mountedTrophies}
        isPaused={isPaused}
        onCanFishChange={setCanFish}
        joystickInput={joystickInput}
        onCanvasClick={() => {
          soundEngine.resume();
          if (fishingState === 'BITE') {
            handleHookFish();
          }
        }}
      />

      {/* 3. MOBILE MOVEMENT JOYSTICK (Only visible in IDLE state) */}
      {fishingState === 'IDLE' && !isPaused && (
        <div className="fixed bottom-6 left-6 z-20 pointer-events-auto md:hidden">
          <MobileJoystick
            onMove={(dx, dy) => setJoystickInput({ x: dx, y: dy })}
            disabled={isPaused}
          />
        </div>
      )}

      {/* 4. FISHING ACTION CONTROLS & HUD */}
      <FishingHUD
        fishingState={fishingState}
        castPower={castPower}
        lineTension={lineTension}
        fishDistance={fishDistance}
        isReeling={isReeling}
        canFish={canFish}
        language={language}
        onStartCastCharge={handleStartCastCharge}
        onReleaseCastCharge={handleReleaseCastCharge}
        onHookFish={handleHookFish}
        onStartReel={handleStartReel}
        onStopReel={handleStopReel}
        onResetToIdle={handleResetToIdle}
      />

      {/* 5. CATCH SUCCESS MODAL */}
      {showCatchModal && (
        <CatchModal
          catchRecord={lastCatchRecord}
          species={activeFish}
          isNewRecord={isNewRecordCatch}
          language={language}
          onSell={handleSellCatch}
          onKeep={handleKeepCatch}
        />
      )}

      {/* 6. FISH COLLECTION MODAL */}
      {showCollectionModal && (
        <FishCollectionModal
          unlockedCatches={unlockedCatches}
          language={language}
          onClose={() => setShowCollectionModal(false)}
        />
      )}
    </main>
  );
}
