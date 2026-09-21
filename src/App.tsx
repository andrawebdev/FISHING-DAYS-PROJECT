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
  ViewMode,
  CraftingRecipe,
} from './types';
import { FISH_DATABASE } from './data/fishDatabase';
import { RODS, REELS, LINES, BAITS, LURES } from './data/gearDatabase';
import { soundEngine } from './services/soundEngine';
import { LeaderboardService } from './services/leaderboardService';
import { multiplayerService } from './services/multiplayerService';
import { ThreeCanvas } from './components/ThreeCanvas';
import { FishingHUD } from './components/FishingHUD';
import { MobileJoystick } from './components/MobileJoystick';
import { CatchModal } from './components/CatchModal';
import { FishCollectionModal } from './components/FishCollectionModal';
import { TackleShopModal } from './components/TackleShopModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { MultiplayerChatDrawer } from './components/MultiplayerChatDrawer';
import { EnvironmentControlBar } from './components/EnvironmentControlBar';
import { GearCustomizationModal } from './components/GearCustomizationModal';
import { PlayerCabinModal } from './components/PlayerCabinModal';
import { UnderwaterEcosystemHUD } from './components/UnderwaterEcosystemHUD';

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

  const [playerName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_player_name');
      return saved || 'Angler_' + Math.floor(1000 + Math.random() * 9000);
    } catch {
      return 'Angler_1234';
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
  const [equippedRodId, setEquippedRodId] = useState<string>('bamboo_starter');
  const [equippedReelId, setEquippedReelId] = useState<string>('basic_reel');
  const [equippedLineId, setEquippedLineId] = useState<string>('mono_starter');
  const [equippedBaitId, setEquippedBaitId] = useState<string>('bread_crumbs');
  const [equippedLureId, setEquippedLureId] = useState<string>(LURES[0]?.id || 'feather_spinner');

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
      const saved = localStorage.getItem('fishing_days_bait_inv');
      return saved ? JSON.parse(saved) : { bread_crumbs: 25, earthworm: 15 };
    } catch {
      return { bread_crumbs: 25, earthworm: 15 };
    }
  });

  // Gear Customization State
  const [customization, setCustomization] = useState<GearCustomization>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_customization');
      return saved
        ? JSON.parse(saved)
        : {
            rodColor: '#a16207',
            rodPattern: 'SOLID',
            handleGrip: 'NATURAL_CORK',
            guideRingColor: '#eab308',
            reelMetalTint: 'SILVER',
            lineTint: 'CLEAR',
            bobberStyle: 'CLASSIC_SPHERE',
          };
    } catch {
      return {
        rodColor: '#a16207',
        rodPattern: 'SOLID',
        handleGrip: 'NATURAL_CORK',
        guideRingColor: '#eab308',
        reelMetalTint: 'SILVER',
        lineTint: 'CLEAR',
        bobberStyle: 'CLASSIC_SPHERE',
      };
    }
  });

  // Player Cabin & Base State
  const [cabinTheme, setCabinTheme] = useState<CabinTheme>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_cabin_theme') as CabinTheme;
      return saved || 'RUSTIC_CEDAR';
    } catch {
      return 'RUSTIC_CEDAR';
    }
  });

  const [dockLighting, setDockLighting] = useState<DockLighting>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_dock_lighting') as DockLighting;
      return saved || 'EDISON_BULBS';
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

  const [craftingMaterials, setCraftingMaterials] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('fishing_days_craft_mats');
      return saved
        ? JSON.parse(saved)
        : {
            fish_scales: 14,
            lake_driftwood: 10,
            polished_pebble: 8,
            feather_down: 6,
            firefly_essence: 3,
            pearl_shards: 2,
          };
    } catch {
      return {
        fish_scales: 14,
        lake_driftwood: 10,
        polished_pebble: 8,
        feather_down: 6,
        firefly_essence: 3,
        pearl_shards: 2,
      };
    }
  });

  // Catch history for trophies & statistics
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
  const [viewMode, setViewMode] = useState<ViewMode>('FISHING_DOCK');

  // --- FISHING STATE MACHINE & GROUND POSITION ---
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
  const [showShopModal, setShowShopModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showMultiplayerDrawer, setShowMultiplayerDrawer] = useState<boolean>(false);
  const [showCustomizationModal, setShowCustomizationModal] = useState<boolean>(false);
  const [showCabinModal, setShowCabinModal] = useState<boolean>(false);
  const [showEcosystemHUD, setShowEcosystemHUD] = useState<boolean>(false);

  // Multiplayer peers
  const [peers, setPeers] = useState(multiplayerService.getPeers());

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
      localStorage.setItem('fishing_days_unlocked_gear', JSON.stringify(unlockedGearIds));
    } catch {}
  }, [unlockedGearIds]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_bait_inv', JSON.stringify(baitInventory));
    } catch {}
  }, [baitInventory]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_collection', JSON.stringify(unlockedCatches));
    } catch {}
  }, [unlockedCatches]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_customization', JSON.stringify(customization));
    } catch {}
  }, [customization]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_cabin_theme', cabinTheme);
    } catch {}
  }, [cabinTheme]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_dock_lighting', dockLighting);
    } catch {}
  }, [dockLighting]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_trophies', JSON.stringify(mountedTrophies));
    } catch {}
  }, [mountedTrophies]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_craft_mats', JSON.stringify(craftingMaterials));
    } catch {}
  }, [craftingMaterials]);

  useEffect(() => {
    try {
      localStorage.setItem('fishing_days_catch_history', JSON.stringify(catchHistory));
    } catch {}
  }, [catchHistory]);

  // Subscribe to multiplayer peers
  useEffect(() => {
    const unsub = multiplayerService.subscribe(() => {
      setPeers([...multiplayerService.getPeers()]);
    });
    return unsub;
  }, []);

  // Sync Audio Atmosphere
  useEffect(() => {
    soundEngine.init();
    soundEngine.updateAtmosphere(weather, timeOfDay);
  }, [weather, timeOfDay]);

  // Dynamic Day/Night Cycle (Every 90 seconds advances time, unless paused)
  useEffect(() => {
    const timeCycle: TimeOfDay[] = ['MORNING', 'DAY', 'AFTERNOON', 'SUNSET', 'NIGHT'];
    const weatherCycle: WeatherType[] = ['SUNNY', 'CLOUDY', 'RAIN', 'HEAVY_RAIN', 'FOG'];

    const interval = window.setInterval(() => {
      if (isPaused) return;

      setTimeOfDay((prev) => {
        const nextIdx = (timeCycle.indexOf(prev) + 1) % timeCycle.length;
        return timeCycle[nextIdx];
      });

      if (Math.random() < 0.35) {
        setWeather((prev) => {
          const nextIdx = (weatherCycle.indexOf(prev) + 1) % weatherCycle.length;
          return weatherCycle[nextIdx];
        });
      }
    }, 90000);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Clean all fishing timers helper
  const clearAllFishingTimers = useCallback(() => {
    if (castChargeTimerRef.current) {
      clearInterval(castChargeTimerRef.current);
      castChargeTimerRef.current = null;
    }
    if (castLandingTimerRef.current) {
      clearTimeout(castLandingTimerRef.current);
      castLandingTimerRef.current = null;
    }
    if (approachTimerRef.current) {
      clearTimeout(approachTimerRef.current);
      approachTimerRef.current = null;
    }
    if (biteTimeoutRef.current) {
      clearTimeout(biteTimeoutRef.current);
      biteTimeoutRef.current = null;
    }
    if (biteWindowTimerRef.current) {
      clearTimeout(biteWindowTimerRef.current);
      biteWindowTimerRef.current = null;
    }
    if (hookTransitionTimerRef.current) {
      clearTimeout(hookTransitionTimerRef.current);
      hookTransitionTimerRef.current = null;
    }
    if (gameLoopTimerRef.current) {
      clearInterval(gameLoopTimerRef.current);
      gameLoopTimerRef.current = null;
    }
    isHookingRef.current = false;
    isCastingRef.current = false;
  }, []);

  // --- FISH ENCOUNTER ALGORITHM ---
  const selectEligibleFish = useCallback((): FishSpecies => {
    const baitBoost = equippedBait.rarityBoostPercent;

    const scored = FISH_DATABASE.map((fish) => {
      let weight = 10;
      if (fish.preferredWeather.includes(weather)) weight += 15;
      if (fish.preferredTime.includes(timeOfDay)) weight += 15;
      if (fish.preferredBait.includes(equippedBait.id)) weight += 30;

      switch (fish.rarity) {
        case 'COMMON':
          weight *= 4;
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
      setFishingState('FAILED');
    }, reactionWindow);
  }, []);

  const scheduleFishApproach = useCallback(() => {
    if (approachTimerRef.current) clearTimeout(approachTimerRef.current);
    if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);

    const baseDelay = Math.random() * 3200 + 2200;
    const speedMultiplier = 1 / (1 + (equippedBait.biteRateBonus || 0) / 100);
    const approachDelay = baseDelay * speedMultiplier;

    approachTimerRef.current = window.setTimeout(() => {
      setFishingState('FISH_APPROACHING');
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
    setFishingState('PREPARING');
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

    if (fishingState !== 'PREPARING' || !canFish || isCastingRef.current) return;
    isCastingRef.current = true;

    soundEngine.playCastWhoosh();
    setFishingState('CASTING');

    const maxCast = 8 + castPower * 14 * (1 + equippedRod.castDistanceBonus / 100);
    setFishDistance(maxCast);

    // Bobber lands in water after 650ms
    castLandingTimerRef.current = window.setTimeout(() => {
      isCastingRef.current = false;
      soundEngine.playBobberSplash();
      setFishingState('BOBBER_ACTIVE');
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

    hookTransitionTimerRef.current = window.setTimeout(() => {
      isHookingRef.current = false;
      setFishingState('FISH_STRUGGLING');
      setLineTension(0.45);
    }, 400);
  }, [fishingState]);

  const handleStartReel = useCallback(() => {
    if (isPaused) return;
    if (fishingState !== 'FISH_STRUGGLING' && fishingState !== 'REELING') return;
    setIsReeling(true);
    setFishingState('REELING');
    soundEngine.startReelingSound();
  }, [isPaused, fishingState]);

  const handleStopReel = useCallback(() => {
    setIsReeling(false);
    soundEngine.stopReelingSound();
    if (fishingState === 'REELING') {
      setFishingState('FISH_STRUGGLING');
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
      caughtBy: playerName,
      weather,
      timeOfDay,
      location: 'Village Dock Waters',
    };

    // Store in history
    setCatchHistory((prev) => [record, ...prev.slice(0, 49)]);

    // Award Crafting Materials based on catch
    setCraftingMaterials((prev) => {
      const updated = { ...prev };
      const scalesGained = Math.floor(Math.random() * 3) + 1;
      updated.fish_scales = (updated.fish_scales || 0) + scalesGained;

      if (fish.rarity === 'RARE' || fish.rarity === 'EPIC') {
        updated.polished_pebble = (updated.polished_pebble || 0) + 1;
      }
      if (fish.rarity === 'LEGENDARY' || fish.rarity === 'MYTHIC') {
        updated.pearl_shards = (updated.pearl_shards || 0) + 1;
        updated.firefly_essence = (updated.firefly_essence || 0) + 1;
      }
      return updated;
    });

    // Check personal record
    const existing = unlockedCatches[fish.id];
    const isNewBest = !existing || caughtWeight > existing.weight;
    setIsNewRecordCatch(isNewBest);

    // Update global leaderboard
    LeaderboardService.submitCatch(record);

    // Broadcast catch to multiplayer peers
    multiplayerService.broadcastPlayerCatch(playerName, fish.name, fish.rarity, caughtWeight);

    // Consume 1 bait if available
    setBaitInventory((prev) => {
      const cur = prev[equippedBait.id] || 0;
      return { ...prev, [equippedBait.id]: Math.max(0, cur - 1) };
    });

    setLastCatchRecord(record);
    setFishingState('SUCCESS');
    setShowCatchModal(true);
  }, [activeFish, playerName, weather, timeOfDay, unlockedCatches, equippedBait, clearAllFishingTimers]);

  // --- ACTIVE FIGHT GAME LOOP ---
  useEffect(() => {
    if (isPaused || (fishingState !== 'FISH_STRUGGLING' && fishingState !== 'REELING')) {
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
          const tensionRate = (0.022 * (fishDifficulty * 0.7)) / (rodTolerance * reelDrag);
          nextTension += tensionRate;
        } else {
          nextTension -= 0.024;
        }

        if (Math.random() < 0.12) {
          nextTension += (Math.random() * 0.15 * fishDifficulty) / rodTolerance;
        }

        soundEngine.updateTensionSound(nextTension);

        if (nextTension >= 0.98) {
          soundEngine.playLineSnap();
          setFishingState('FAILED');
          setIsReeling(false);
          soundEngine.stopReelingSound();
          return 1.0;
        }

        if (nextTension <= 0.04) {
          soundEngine.stopTensionSound();
          soundEngine.stopReelingSound();
          setFishingState('FAILED');
          setIsReeling(false);
          return 0.0;
        }

        return Math.min(1.0, Math.max(0.01, nextTension));
      });

      setFishDistance((prevDist) => {
        if (!isReeling) {
          return Math.min(22, prevDist + 0.06);
        }

        const reelSpeed = 0.28 * (1 + equippedReel.reelSpeedBonus / 100);
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

  // Shop handlers
  const handleBuyOrEquipRod = useCallback(
    (rod: RodItem) => {
      if (unlockedGearIds.includes(rod.id)) {
        setEquippedRodId(rod.id);
      } else if (coins >= rod.price) {
        setCoins((c) => c - rod.price);
        setUnlockedGearIds((u) => [...u, rod.id]);
        setEquippedRodId(rod.id);
      }
    },
    [coins, unlockedGearIds]
  );

  const handleBuyOrEquipReel = useCallback(
    (reel: ReelItem) => {
      if (unlockedGearIds.includes(reel.id)) {
        setEquippedReelId(reel.id);
      } else if (coins >= reel.price) {
        setCoins((c) => c - reel.price);
        setUnlockedGearIds((u) => [...u, reel.id]);
        setEquippedReelId(reel.id);
      }
    },
    [coins, unlockedGearIds]
  );

  const handleBuyOrEquipLine = useCallback(
    (line: LineItem) => {
      if (unlockedGearIds.includes(line.id)) {
        setEquippedLineId(line.id);
      } else if (coins >= line.price) {
        setCoins((c) => c - line.price);
        setUnlockedGearIds((u) => [...u, line.id]);
        setEquippedLineId(line.id);
      }
    },
    [coins, unlockedGearIds]
  );

  const handleBuyBait = useCallback(
    (bait: BaitItem) => {
      if (coins >= bait.price) {
        setCoins((c) => c - bait.price);
        setBaitInventory((prev) => ({
          ...prev,
          [bait.id]: (prev[bait.id] || 0) + bait.count,
        }));
        setEquippedBaitId(bait.id);
      }
    },
    [coins]
  );

  const handleCraftSuccess = useCallback((recipe: CraftingRecipe) => {
    if (recipe.category === 'BAIT' || recipe.category === 'LURE') {
      setBaitInventory((prev) => ({
        ...prev,
        [recipe.id]: (prev[recipe.id] || 0) + recipe.resultCount,
      }));
    }
  }, []);

  // Environment Controls
  const cycleWeather = useCallback(() => {
    const weathers: WeatherType[] = ['SUNNY', 'CLOUDY', 'RAIN', 'HEAVY_RAIN', 'FOG'];
    setWeather((w) => weathers[(weathers.indexOf(w) + 1) % weathers.length]);
  }, []);

  const cycleTimeOfDay = useCallback(() => {
    const times: TimeOfDay[] = ['MORNING', 'DAY', 'AFTERNOON', 'SUNSET', 'NIGHT'];
    setTimeOfDay((t) => times[(times.indexOf(t) + 1) % times.length]);
  }, []);

  const cycleViewMode = useCallback(() => {
    const modes: ViewMode[] = ['FISHING_DOCK', 'PLAYER_CABIN', 'UNDERWATER_SONAR'];
    setViewMode((cur) => modes[(modes.indexOf(cur) + 1) % modes.length]);
  }, []);

  const toggleSound = useCallback(() => {
    const nextMute = soundEngine.toggleMute();
    setSoundEnabled(!nextMute);
  }, []);

  // Keyboard pause listener (Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP') {
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden select-none bg-slate-950 font-sans">
      {/* 1. TOP ENVIRONMENT & NAVIGATION BAR */}
      <EnvironmentControlBar
        weather={weather}
        timeOfDay={timeOfDay}
        coins={coins}
        equippedRod={equippedRod}
        equippedBait={equippedBait}
        soundEnabled={soundEnabled}
        language={language}
        viewMode={viewMode}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((p) => !p)}
        onCycleWeather={cycleWeather}
        onCycleTimeOfDay={cycleTimeOfDay}
        onToggleSound={toggleSound}
        onOpenCollection={() => setShowCollectionModal(true)}
        onOpenShop={() => setShowShopModal(true)}
        onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        onOpenMultiplayer={() => setShowMultiplayerDrawer(true)}
        onOpenCustomization={() => setShowCustomizationModal(true)}
        onOpenCabin={() => setShowCabinModal(true)}
        onOpenEcosystem={() => setShowEcosystemHUD(true)}
        onCycleViewMode={cycleViewMode}
      />

      {/* 2. 3D WEBGL ENGINE */}
      <ThreeCanvas
        fishingState={fishingState}
        castPower={castPower}
        lineTension={lineTension}
        fishDistance={fishDistance}
        weather={weather}
        timeOfDay={timeOfDay}
        peers={peers}
        equippedRod={equippedRod}
        customization={customization}
        cabinTheme={cabinTheme}
        dockLighting={dockLighting}
        mountedTrophies={mountedTrophies}
        viewMode={viewMode}
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

      {/* 3. MOBILE MOVEMENT JOYSTICK (Only visible in IDLE & Exploration) */}
      {fishingState === 'IDLE' && viewMode === 'FISHING_DOCK' && !isPaused && (
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
        isPaused={isPaused}
        onStartCastCharge={handleStartCastCharge}
        onReleaseCastCharge={handleReleaseCastCharge}
        onHookFish={handleHookFish}
        onStartReel={handleStartReel}
        onStopReel={handleStopReel}
        onResetToIdle={handleResetToIdle}
      />

      {/* 5. MODALS & DRAWERS */}
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

      {showCollectionModal && (
        <FishCollectionModal
          unlockedCatches={unlockedCatches}
          language={language}
          onClose={() => setShowCollectionModal(false)}
        />
      )}

      {showShopModal && (
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
          onEquipBait={(bId) => setEquippedBaitId(bId)}
          onClose={() => setShowShopModal(false)}
        />
      )}

      {showLeaderboardModal && (
        <LeaderboardModal
          language={language}
          playerName={playerName}
          onClose={() => setShowLeaderboardModal(false)}
        />
      )}

      <MultiplayerChatDrawer
        isOpen={showMultiplayerDrawer}
        playerName={playerName}
        language={language}
        onClose={() => setShowMultiplayerDrawer(false)}
        onLanguageChange={(lang) => setLanguage(lang)}
      />

      {/* 6. GEAR CUSTOMIZATION MODAL */}
      <GearCustomizationModal
        isOpen={showCustomizationModal}
        onClose={() => setShowCustomizationModal(false)}
        equippedRod={equippedRod}
        equippedReel={equippedReel}
        equippedLine={equippedLine}
        equippedLure={equippedLure}
        customization={customization}
        onUpdateCustomization={setCustomization}
        onEquipRod={(rod: RodItem) => setEquippedRodId(rod.id)}
        onEquipReel={(reel: ReelItem) => setEquippedReelId(reel.id)}
        onEquipLine={(line: LineItem) => setEquippedLineId(line.id)}
        onEquipLure={(lure: LureItem) => setEquippedLureId(lure.id)}
      />

      {/* 7. PLAYER CABIN & BASE SYSTEM MODAL */}
      <PlayerCabinModal
        isOpen={showCabinModal}
        onClose={() => setShowCabinModal(false)}
        coins={coins}
        onUpdateCoins={setCoins}
        catchHistory={catchHistory}
        mountedTrophies={mountedTrophies}
        onUpdateTrophies={setMountedTrophies}
        cabinTheme={cabinTheme}
        onUpdateCabinTheme={setCabinTheme}
        dockLighting={dockLighting}
        onUpdateDockLighting={setDockLighting}
        craftingMaterials={craftingMaterials}
        onUpdateCraftingMaterials={setCraftingMaterials}
        onCraftSuccess={handleCraftSuccess}
        onSwitchToCabinView={() => setViewMode('PLAYER_CABIN')}
      />

      {/* 8. DYNAMIC UNDERWATER ECOSYSTEM & SONAR HUD */}
      <UnderwaterEcosystemHUD
        isOpen={showEcosystemHUD}
        onClose={() => setShowEcosystemHUD(false)}
        weather={weather}
        timeOfDay={timeOfDay}
        viewMode={viewMode}
        onToggleSonarView={() => {
          setViewMode((cur) => (cur === 'UNDERWATER_SONAR' ? 'FISHING_DOCK' : 'UNDERWATER_SONAR'));
        }}
      />
    </main>
  );
}
