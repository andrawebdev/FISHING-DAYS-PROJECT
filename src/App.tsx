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
  DailyMission,
} from './types';
import { FISH_DATABASE } from './data/fishDatabase';
import {
  RODS,
  REELS,
  LINES,
  BAITS,
  LURES,
  DEFAULT_GEAR_CUSTOMIZATION,
  INITIAL_CRAFTING_MATERIALS,
} from './data/gearDatabase';
import { INITIAL_DAILY_MISSIONS, updateMissionsOnCatch } from './data/dailyMissions';
import { soundEngine } from './services/soundEngine';
import { ThreeCanvas } from './components/ThreeCanvas';
import { FishingHUD } from './components/FishingHUD';
import { MobileJoystick } from './components/MobileJoystick';
import { CatchModal } from './components/CatchModal';
import { FishCollectionModal } from './components/FishCollectionModal';
import { EnvironmentControlBar } from './components/EnvironmentControlBar';
import { TackleShopModal } from './components/TackleShopModal';
import { GearCustomizationModal } from './components/GearCustomizationModal';
import { PlayerCabinModal } from './components/PlayerCabinModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';

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
  const [equippedRodId, setEquippedRodId] = useState<string>(() => {
    return localStorage.getItem('fishing_days_rod') || 'bamboo_starter';
  });
  const [equippedReelId, setEquippedReelId] = useState<string>(() => {
    return localStorage.getItem('fishing_days_reel') || 'basic_reel';
  });
  const [equippedLineId, setEquippedLineId] = useState<string>(() => {
    return localStorage.getItem('fishing_days_line') || 'mono_starter';
  });
  const [equippedBaitId, setEquippedBaitId] = useState<string>(() => {
    return localStorage.getItem('fishing_days_bait') || 'bread_crumbs';
  });
  const [equippedLureId, setEquippedLureId] = useState<string>(() => {
    return localStorage.getItem('fishing_days_lure') || 'surface_popper';
  });

  const [unlockedGearIds, setUnlockedGearIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_unlocked_gear');
      return saved ? JSON.parse(saved) : ['bamboo_starter', 'basic_reel', 'mono_starter'];
    } catch {
      return ['bamboo_starter', 'basic_reel', 'mono_starter'];
    }
  });

  const [baitInventory, setBaitInventory] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_bait_inventory');
      return saved ? JSON.parse(saved) : { bread_crumbs: 15, live_worms: 10, sweet_corn: 8 };
    } catch {
      return { bread_crumbs: 15, live_worms: 10, sweet_corn: 8 };
    }
  });

  // Gear Customization State
  const [customization, setCustomization] = useState<GearCustomization>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_customization');
      return saved ? JSON.parse(saved) : DEFAULT_GEAR_CUSTOMIZATION;
    } catch {
      return DEFAULT_GEAR_CUSTOMIZATION;
    }
  });

  // Player Cabin & Base State
  const [cabinTheme, setCabinTheme] = useState<CabinTheme>(() => {
    try {
      return (localStorage.getItem('fishing_days_cabin_theme') as CabinTheme) || 'RUSTIC_CEDAR';
    } catch {
      return 'RUSTIC_CEDAR';
    }
  });
  const [dockLighting, setDockLighting] = useState<DockLighting>(() => {
    try {
      return (localStorage.getItem('fishing_days_dock_lighting') as DockLighting) || 'EDISON_BULBS';
    } catch {
      return 'EDISON_BULBS';
    }
  });
  const [mountedTrophies, setMountedTrophies] = useState<MountedTrophy[]>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_trophies');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Crafting Materials
  const [craftingMaterials, setCraftingMaterials] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_materials');
      return saved ? JSON.parse(saved) : INITIAL_CRAFTING_MATERIALS;
    } catch {
      return INITIAL_CRAFTING_MATERIALS;
    }
  });

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

  // UI Modals
  const [showCatchModal, setShowCatchModal] = useState<boolean>(false);
  const [showCollectionModal, setShowCollectionModal] = useState<boolean>(false);
  const [showTackleShop, setShowTackleShop] = useState<boolean>(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState<boolean>(false);
  const [showCabinModal, setShowCabinModal] = useState<boolean>(false);
  const [showDailyMissionsModal, setShowDailyMissionsModal] = useState<boolean>(false);

  // Daily Missions System
  const [dailyMissions, setDailyMissions] = useState<DailyMission[]>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_daily_missions');
      return saved ? JSON.parse(saved) : INITIAL_DAILY_MISSIONS;
    } catch {
      return INITIAL_DAILY_MISSIONS;
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
  const isCatchHandledRef = useRef<boolean>(false);

  const equippedRod = RODS.find((r) => r.id === equippedRodId) || RODS[0];
  const equippedReel = REELS.find((r) => r.id === equippedReelId) || REELS[0];
  const equippedLine = LINES.find((l) => l.id === equippedLineId) || LINES[0];
  const equippedBait = BAITS.find((b) => b.id === equippedBaitId) || BAITS[0];
  const equippedLure = LURES.find((l) => l.id === equippedLureId) || LURES[0];

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

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_unlocked_gear', JSON.stringify(unlockedGearIds));
    } catch {}
  }, [unlockedGearIds]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_bait_inventory', JSON.stringify(baitInventory));
    } catch {}
  }, [baitInventory]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_customization', JSON.stringify(customization));
    } catch {}
  }, [customization]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_trophies', JSON.stringify(mountedTrophies));
    } catch {}
  }, [mountedTrophies]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_materials', JSON.stringify(craftingMaterials));
    } catch {}
  }, [craftingMaterials]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_daily_missions', JSON.stringify(dailyMissions));
    } catch {}
  }, [dailyMissions]);

  const handleClaimMission = (missionId: string) => {
    setDailyMissions((prev) =>
      prev.map((m) => {
        if (m.id === missionId && m.completed && !m.claimed) {
          setCoins((c) => c + m.rewardCoins);
          soundEngine.playCoinDing();
          return { ...m, claimed: true };
        }
        return m;
      })
    );
  };

  // Gear & Shop Action Handlers
  const handleBuyOrEquipRod = (rod: RodItem) => {
    if (!unlockedGearIds.includes(rod.id)) {
      if (coins < rod.price) {
        soundEngine.playCancel();
        return;
      }
      setCoins((c) => c - rod.price);
      setUnlockedGearIds((prev) => [...prev, rod.id]);
    }
    setEquippedRodId(rod.id);
    localStorage.setItem('fishing_days_rod', rod.id);
  };

  const handleBuyOrEquipReel = (reel: ReelItem) => {
    if (!unlockedGearIds.includes(reel.id)) {
      if (coins < reel.price) {
        soundEngine.playCancel();
        return;
      }
      setCoins((c) => c - reel.price);
      setUnlockedGearIds((prev) => [...prev, reel.id]);
    }
    setEquippedReelId(reel.id);
    localStorage.setItem('fishing_days_reel', reel.id);
  };

  const handleBuyOrEquipLine = (line: LineItem) => {
    if (!unlockedGearIds.includes(line.id)) {
      if (coins < line.price) {
        soundEngine.playCancel();
        return;
      }
      setCoins((c) => c - line.price);
      setUnlockedGearIds((prev) => [...prev, line.id]);
    }
    setEquippedLineId(line.id);
    localStorage.setItem('fishing_days_line', line.id);
  };

  const handleBuyBait = (bait: BaitItem) => {
    if (coins < bait.price) {
      soundEngine.playCancel();
      return;
    }
    setCoins((c) => c - bait.price);
    setBaitInventory((prev) => ({
      ...prev,
      [bait.id]: (prev[bait.id] || 0) + bait.count,
    }));
  };

  const handleEquipBait = (baitId: string) => {
    setEquippedBaitId(baitId);
    localStorage.setItem('fishing_days_bait', baitId);
  };

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
    isCatchHandledRef.current = false;
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
    if (isCatchHandledRef.current) return;
    isCatchHandledRef.current = true;

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

    // Update encyclopedia unlocked records immediately
    setUnlockedCatches((prev) => {
      const cur = prev[record.speciesId];
      if (!cur || record.weight > cur.weight) {
        return { ...prev, [record.speciesId]: record };
      }
      return prev;
    });

    // Update Daily Missions progress
    setDailyMissions((prevMissions) => {
      const { updatedMissions, newCompletedCount } = updateMissionsOnCatch(prevMissions, record);
      if (newCompletedCount > 0) {
        soundEngine.playCoinDing();
      }
      return updatedMissions;
    });

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
    }
    setShowCatchModal(false);
    clearAllFishingTimers();
    setFishingState('IDLE');
  }, [lastCatchRecord, clearAllFishingTimers]);

  const handleKeepCatch = useCallback(() => {
    if (lastCatchRecord) {
      setCraftingMaterials((prev) => ({
        ...prev,
        fish_scales: (prev.fish_scales || 0) + 1,
        polished_pebble: (prev.polished_pebble || 0) + (Math.random() < 0.5 ? 1 : 0),
      }));
      soundEngine.playEquipGear();
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

  // Check if any modal is currently open
  const isAnyModalOpen =
    showCatchModal ||
    showCollectionModal ||
    showTackleShop ||
    showCustomizationModal ||
    showCabinModal ||
    showDailyMissionsModal;

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pause toggle: Key P
      if (e.code === 'KeyP') {
        setIsPaused((prev) => !prev);
        return;
      }

      if (isPaused) return;

      if (e.code === 'Escape') {
        if (showCatchModal) setShowCatchModal(false);
        if (showCollectionModal) setShowCollectionModal(false);
        if (showTackleShop) setShowTackleShop(false);
        if (showCustomizationModal) setShowCustomizationModal(false);
        if (showCabinModal) setShowCabinModal(false);
        if (showDailyMissionsModal) setShowDailyMissionsModal(false);
        if (fishingState !== 'IDLE') handleResetToIdle();
        return;
      }

      // Do not process fishing inputs if modal is open
      if (isAnyModalOpen) return;

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
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isAnyModalOpen) return;

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
    isAnyModalOpen,
    fishingState,
    canFish,
    showCatchModal,
    showCollectionModal,
    showTackleShop,
    showCustomizationModal,
    showCabinModal,
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
        dailyMissions={dailyMissions}
        onOpenDailyMissions={() => setShowDailyMissionsModal(true)}
        onTogglePause={() => setIsPaused((p) => !p)}
        onCycleWeather={cycleWeather}
        onCycleTimeOfDay={cycleTimeOfDay}
        onToggleSound={toggleSound}
        onOpenCollection={() => setShowCollectionModal(true)}
        onOpenShop={() => setShowTackleShop(true)}
        onOpenCustomization={() => setShowCustomizationModal(true)}
        onOpenCabin={() => setShowCabinModal(true)}
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
      {fishingState === 'IDLE' && !isPaused && !isAnyModalOpen && (
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

      {/* 7. TACKLE SHOP MODAL */}
      {showTackleShop && (
        <TackleShopModal
          coins={coins}
          equippedRodId={equippedRodId}
          equippedReelId={equippedReelId}
          equippedLineId={equippedLineId}
          equippedBaitId={equippedBaitId}
          unlockedGearIds={unlockedGearIds}
          baitInventory={baitInventory}
          language={language}
          onBuyOrEquipRod={handleBuyOrEquipRod}
          onBuyOrEquipReel={handleBuyOrEquipReel}
          onBuyOrEquipLine={handleBuyOrEquipLine}
          onBuyBait={handleBuyBait}
          onEquipBait={handleEquipBait}
          onClose={() => setShowTackleShop(false)}
        />
      )}

      {/* 8. GEAR CUSTOMIZATION MODAL */}
      {showCustomizationModal && (
        <GearCustomizationModal
          isOpen={showCustomizationModal}
          onClose={() => setShowCustomizationModal(false)}
          equippedRod={equippedRod}
          equippedReel={equippedReel}
          equippedLine={equippedLine}
          equippedLure={equippedLure}
          customization={customization}
          onUpdateCustomization={(c) => setCustomization(c)}
          onEquipRod={handleBuyOrEquipRod}
          onEquipReel={handleBuyOrEquipReel}
          onEquipLine={handleBuyOrEquipLine}
          onEquipLure={(lu) => {
            setEquippedLureId(lu.id);
            localStorage.setItem('fishing_days_lure', lu.id);
          }}
        />
      )}

      {/* 9. PLAYER CABIN & TROPHIES MODAL */}
      {showCabinModal && (
        <PlayerCabinModal
          isOpen={showCabinModal}
          onClose={() => setShowCabinModal(false)}
          coins={coins}
          onUpdateCoins={setCoins}
          catchHistory={catchHistory}
          mountedTrophies={mountedTrophies}
          onUpdateTrophies={setMountedTrophies}
          cabinTheme={cabinTheme}
          onUpdateCabinTheme={(t) => {
            setCabinTheme(t);
            localStorage.setItem('fishing_days_cabin_theme', t);
          }}
          dockLighting={dockLighting}
          onUpdateDockLighting={(l) => {
            setDockLighting(l);
            localStorage.setItem('fishing_days_dock_lighting', l);
          }}
          craftingMaterials={craftingMaterials}
          onUpdateCraftingMaterials={setCraftingMaterials}
          onCraftSuccess={(recipe) => {
            soundEngine.playCoinDing();
            if (recipe.resultType === 'COINS' && recipe.resultCount) {
              setCoins((c) => c + recipe.resultCount);
            }
          }}
          onSwitchToCabinView={() => {
            setShowCabinModal(false);
          }}
        />
      )}

      {/* 10. DAILY MISSIONS MODAL */}
      {showDailyMissionsModal && (
        <DailyMissionsModal
          isOpen={showDailyMissionsModal}
          onClose={() => setShowDailyMissionsModal(false)}
          missions={dailyMissions}
          onClaim={handleClaimMission}
        />
      )}
    </main>
  );
}
