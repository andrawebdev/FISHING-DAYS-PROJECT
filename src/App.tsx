import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  TopLevelGameState,
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
import { MobileControls } from './components/MobileControls';
import { LoadingScreen } from './components/LoadingScreen';
import { MainMenu } from './components/MainMenu';
import { CatchModal } from './components/CatchModal';
import { FishCollectionModal } from './components/FishCollectionModal';
import { EnvironmentControlBar } from './components/EnvironmentControlBar';
import { TackleShopModal } from './components/TackleShopModal';
import { GearCustomizationModal } from './components/GearCustomizationModal';
import { PlayerCabinModal } from './components/PlayerCabinModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { FishingOnboardingOverlay } from './components/FishingOnboardingOverlay';
import { RotateCw, AlertTriangle, Play, Sliders, BookOpen, Home } from 'lucide-react';

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

  // --- STRICT AUTHORITATIVE FISHING STATE MACHINE ---
  // Allowed: IDLE → CASTING → WAITING → BITE → HOOKED → REELING → CAUGHT → IDLE (or CANCELLED → IDLE)
  const [fishingState, setFishingState] = useState<FishingState>('IDLE');
  const [canFish, setCanFish] = useState<boolean>(true);
  const [castPower, setCastPower] = useState<number>(0);
  const [isCastCharging, setIsCastCharging] = useState<boolean>(false);
  const [lineTension, setLineTension] = useState<number>(0.3);
  const [fishDistance, setFishDistance] = useState<number>(14);
  const [isReeling, setIsReeling] = useState<boolean>(false);
  const [joystickInput, setJoystickInput] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Active Fish on Line
  const [activeFish, setActiveFish] = useState<FishSpecies | null>(null);
  const [lastCatchRecord, setLastCatchRecord] = useState<CatchRecord | null>(null);
  const [isNewRecordCatch, setIsNewRecordCatch] = useState<boolean>(false);
  // One-time Fishing Onboarding Overlay
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    try {
      return localStorage.getItem('fishing_days_onboarding_completed') === 'true';
    } catch {
      return false;
    }
  });
  const [showOnboardingOverlay, setShowOnboardingOverlay] = useState<boolean>(false);

  // Authoritative Session Identification to prevent race conditions and orphaned callbacks
  const sessionIdCounterRef = useRef<number>(0);
  const activeSessionIdRef = useRef<number>(0);
  const catchProcessedRef = useRef<boolean>(false);
  const autoResetTimerRef = useRef<number | null>(null);

  // Strict Timer References
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

  // --- GAME STATE ARCHITECTURE ---
  // Allowed: BOOT -> LOADING -> MAIN_MENU -> PLAYING -> PAUSED -> FISHING -> CATCH_RESULT
  const [topLevelGameState, setTopLevelGameState] = useState<TopLevelGameState>('BOOT');
  const [showCreditsModal, setShowCreditsModal] = useState<boolean>(false);
  const [showPauseConfirmMenu, setShowPauseConfirmMenu] = useState<boolean>(false);
  const [hasExistingSave, setHasExistingSave] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('fishing_days_has_save') === 'true' ||
        localStorage.getItem('fishing_days_catch_history') !== null ||
        localStorage.getItem('fishing_days_coins') !== null
      );
    } catch {
      return false;
    }
  });

  // Device orientation tracking (Landscape-first requirement)
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false;
  });

  useEffect(() => {
    const handleOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleOrientation);
    window.addEventListener('orientationchange', handleOrientation);
    return () => {
      window.removeEventListener('resize', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientation);
    };
  }, []);

  // Trigger one-time onboarding on first arrival at dock or first fishing attempt
  useEffect(() => {
    if (canFish && !hasSeenOnboarding && (topLevelGameState === 'PLAYING' || topLevelGameState === 'FISHING')) {
      setShowOnboardingOverlay(true);
    }
  }, [canFish, hasSeenOnboarding, topLevelGameState]);

  // --- ENGINE LOADING PROGRESS ARCHITECTURE ---
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('BOOTING 3D ENGINE...');
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isLoadingComplete, setIsLoadingComplete] = useState(false);
  const cameraRotateRef = useRef<((deltaYaw: number, deltaPitch: number) => void) | null>(null);

  // Clean session disposal function
  const cleanupFishingSession = useCallback((reason?: string) => {
    console.log(`[FISHING] Cleanup session #${activeSessionIdRef.current}: ${reason || 'routine'}`);
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
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = null;
    }
    isHookingRef.current = false;
    isCastingRef.current = false;
    catchProcessedRef.current = false;
    setIsCastCharging(false);

    // Reset rod/line state variables to defaults
    setLineTension(0.3);
    setCastPower(0);
    setFishDistance(14);
    setIsReeling(false);
    setActiveFish(null);

    soundEngine.stopTensionSound();
    soundEngine.stopReelingSound();
  }, []);

  // Strict Authoritative Transition Validator
  const transitionFishingState = useCallback(
    (nextState: FishingState, expectedSessionId?: number, reason?: string) => {
      if (expectedSessionId !== undefined && expectedSessionId !== activeSessionIdRef.current) {
        console.debug(
          `[FISHING] Stale transition to ${nextState} ignored for session #${expectedSessionId} (active: #${activeSessionIdRef.current})`
        );
        return false;
      }

      const VALID_TRANSITIONS: Record<FishingState, FishingState[]> = {
        IDLE: ['CASTING'],
        CASTING: ['WAITING', 'CANCELLED', 'IDLE'],
        WAITING: ['BITE', 'CANCELLED', 'IDLE'],
        BITE: ['HOOKED', 'CANCELLED', 'IDLE'],
        HOOKED: ['REELING', 'CANCELLED', 'IDLE'],
        REELING: ['CAUGHT', 'HOOKED', 'CANCELLED', 'IDLE'],
        CAUGHT: ['IDLE'],
        CANCELLED: ['IDLE'],
      };

      setFishingState((currentState) => {
        if (currentState === nextState) return currentState;
        const allowed = VALID_TRANSITIONS[currentState] || [];
        if (!allowed.includes(nextState)) {
          console.warn(
            `[FISHING] Transition rejected: ${currentState} -> ${nextState} [Session #${activeSessionIdRef.current}] (${reason || ''})`
          );
          return currentState;
        }
        console.log(
          `[FISHING] State Transition: ${currentState} -> ${nextState} [Session #${activeSessionIdRef.current}] (${reason || ''})`
        );
        return nextState;
      });
      return true;
    },
    []
  );

  // Hard Reset to IDLE
  const handleResetToIdle = useCallback(
    (reason = 'user reset') => {
      cleanupFishingSession(reason);
      activeSessionIdRef.current = ++sessionIdCounterRef.current;
      setFishingState('IDLE');
      setLineTension(0.3);
      setCastPower(0);
      setTopLevelGameState((prev) => (prev === 'FISHING' || prev === 'CATCH_RESULT' ? 'PLAYING' : prev));
    },
    [cleanupFishingSession]
  );

  // Auto-recover from CANCELLED state back to IDLE after timeout
  useEffect(() => {
    if (fishingState === 'CANCELLED') {
      if (autoResetTimerRef.current) clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = window.setTimeout(() => {
        setFishingState((cur) => (cur === 'CANCELLED' ? 'IDLE' : cur));
      }, 2500);
    }
  }, [fishingState]);

  // Cleanup on unmount or pause
  useEffect(() => {
    return () => {
      cleanupFishingSession('unmount');
    };
  }, [cleanupFishingSession]);

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

  // --- BITE & APPROACH TIMERS WITH SESSION IDENTIFICATION ---
  const triggerFishBite = useCallback(
    (session: number) => {
      if (activeSessionIdRef.current !== session) return;
      transitionFishingState('BITE', session, 'fish bite triggered');
      soundEngine.playBiteAlert();

      const reactionWindow = 2200;
      biteWindowTimerRef.current = window.setTimeout(() => {
        if (activeSessionIdRef.current !== session) return;
        soundEngine.playHookEscape();
        cleanupFishingSession('bite reaction window expired');
        transitionFishingState('CANCELLED', session, 'bite reaction window expired');
      }, reactionWindow);
    },
    [transitionFishingState, cleanupFishingSession]
  );

  const scheduleFishApproach = useCallback(
    (session: number) => {
      if (approachTimerRef.current) clearTimeout(approachTimerRef.current);
      if (biteTimeoutRef.current) clearTimeout(biteTimeoutRef.current);

      const baseDelay = Math.random() * 3000 + 2000;
      const speedMultiplier = 1 / (1 + (equippedBait.biteRateBonus || 0) / 100);
      const approachDelay = baseDelay * speedMultiplier;

      approachTimerRef.current = window.setTimeout(() => {
        if (activeSessionIdRef.current !== session) return;
        soundEngine.playFishApproaching();
        const candidateFish = selectEligibleFish();
        setActiveFish(candidateFish);

        const biteDelay = Math.random() * 1600 + 900;
        biteTimeoutRef.current = window.setTimeout(() => {
          if (activeSessionIdRef.current !== session) return;
          triggerFishBite(session);
        }, biteDelay);
      }, approachDelay);
    },
    [equippedBait, selectEligibleFish, triggerFishBite]
  );

  // --- CAST CHARGING ---
  const handleDismissOnboarding = useCallback(() => {
    setShowOnboardingOverlay(false);
    setHasSeenOnboarding(true);
    try {
      localStorage.setItem('fishing_days_onboarding_completed', 'true');
    } catch {}
  }, []);

  const handleOpenGuide = useCallback(() => {
    setShowOnboardingOverlay(true);
  }, []);

  const handleStartCastCharge = useCallback(() => {
    if (fishingState !== 'IDLE' || !canFish || isPaused || isCastingRef.current) return;
    cleanupFishingSession('start cast charge');
    const session = ++sessionIdCounterRef.current;
    activeSessionIdRef.current = session;
    catchProcessedRef.current = false;

    // Trigger one-time onboarding guide on first fishing session
    if (!hasSeenOnboarding) {
      setShowOnboardingOverlay(true);
    }

    soundEngine.resume();
    setIsCastCharging(true);
    setTopLevelGameState('FISHING');
    transitionFishingState('CASTING', session, 'start charge');
    setCastPower(0.2);

    let power = 0.2;
    let direction = 1;
    castChargeTimerRef.current = window.setInterval(() => {
      if (activeSessionIdRef.current !== session) {
        if (castChargeTimerRef.current) clearInterval(castChargeTimerRef.current);
        return;
      }
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
  }, [fishingState, canFish, isPaused, hasSeenOnboarding, cleanupFishingSession, transitionFishingState]);

  const handleCastLanded = useCallback(
    (landingDistance: number) => {
      const session = activeSessionIdRef.current;
      if (fishingState !== 'CASTING') return;
      if (castLandingTimerRef.current) {
        clearTimeout(castLandingTimerRef.current);
        castLandingTimerRef.current = null;
      }
      isCastingRef.current = false;
      setIsCastCharging(false);
      soundEngine.playBobberSplash();
      setFishDistance(landingDistance);
      transitionFishingState('WAITING', session, 'bobber splash down');
      setLineTension(0.35);

      scheduleFishApproach(session);
    },
    [fishingState, transitionFishingState, scheduleFishApproach]
  );

  const handleReleaseCastCharge = useCallback(() => {
    if (castChargeTimerRef.current) {
      clearInterval(castChargeTimerRef.current);
      castChargeTimerRef.current = null;
    }

    const session = activeSessionIdRef.current;
    if (fishingState !== 'CASTING' || !canFish || isCastingRef.current) return;
    isCastingRef.current = true;
    setIsCastCharging(false);

    soundEngine.playCastWhoosh();

    const maxCast = 8 + castPower * 14 * (1 + equippedRod.castDistanceBonus / 100);
    setFishDistance(maxCast);

    // Backup safety timer in case 3D landing callback is interrupted by window blur
    castLandingTimerRef.current = window.setTimeout(() => {
      if (activeSessionIdRef.current !== session) return;
      if (fishingState === 'CASTING') {
        handleCastLanded(maxCast);
      }
    }, 1200);
  }, [fishingState, canFish, castPower, equippedRod, handleCastLanded]);

  // --- HOOKING & FIGHT REELING ---
  const handleHookFish = useCallback(() => {
    const session = activeSessionIdRef.current;
    if (fishingState !== 'BITE' || isHookingRef.current) return;
    isHookingRef.current = true;

    if (biteWindowTimerRef.current) {
      clearTimeout(biteWindowTimerRef.current);
      biteWindowTimerRef.current = null;
    }

    soundEngine.playHookSuccess();
    transitionFishingState('HOOKED', session, 'hook fish success');
    setLineTension(0.45);

    hookTransitionTimerRef.current = window.setTimeout(() => {
      if (activeSessionIdRef.current !== session) return;
      isHookingRef.current = false;
    }, 300);
  }, [fishingState, transitionFishingState]);

  const handleStartReel = useCallback(() => {
    if (isPaused) return;
    const session = activeSessionIdRef.current;
    if (fishingState !== 'HOOKED' && fishingState !== 'REELING') return;
    setIsReeling(true);
    transitionFishingState('REELING', session, 'reeling initiated');
    soundEngine.startReelingSound();
  }, [isPaused, fishingState, transitionFishingState]);

  const handleStopReel = useCallback(() => {
    setIsReeling(false);
    soundEngine.stopReelingSound();
    const session = activeSessionIdRef.current;
    if (fishingState === 'REELING') {
      transitionFishingState('HOOKED', session, 'paused reeling');
    }
  }, [fishingState, transitionFishingState]);

  // --- CATCH SUCCESS PRESENTATION (EXACTLY ONE CATCH RECORD PER SESSION) ---
  const triggerCatchSuccess = useCallback(
    (session: number) => {
      if (activeSessionIdRef.current !== session) return;
      if (catchProcessedRef.current) return;
      catchProcessedRef.current = true;

      cleanupFishingSession('catch success');

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

      // Exactly one addition to history and collection
      setCatchHistory((prev) => [record, ...prev.slice(0, 49)]);

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

      // Mark onboarding completed upon first successful catch
      if (!hasSeenOnboarding || showOnboardingOverlay) {
        setHasSeenOnboarding(true);
        setShowOnboardingOverlay(false);
        try {
          localStorage.setItem('fishing_days_onboarding_completed', 'true');
        } catch {}
      }

      transitionFishingState('CAUGHT', session, 'catch completed');
      setShowCatchModal(true);
      setTopLevelGameState('CATCH_RESULT');
    },
    [
      activeFish,
      weather,
      timeOfDay,
      unlockedCatches,
      hasSeenOnboarding,
      showOnboardingOverlay,
      cleanupFishingSession,
      transitionFishingState,
    ]
  );

  // --- ACTIVE FIGHT GAME LOOP: Deterministic Line Tension Calculation ---
  useEffect(() => {
    if (isPaused || (fishingState !== 'HOOKED' && fishingState !== 'REELING')) {
      if (gameLoopTimerRef.current) {
        clearInterval(gameLoopTimerRef.current);
        gameLoopTimerRef.current = null;
      }
      return;
    }

    const session = activeSessionIdRef.current;
    const interval = window.setInterval(() => {
      if (activeSessionIdRef.current !== session) {
        clearInterval(interval);
        return;
      }

      setLineTension((prevTension) => {
        let nextTension = prevTension;
        const fishDifficulty = activeFish?.difficulty || 3;
        const rodTolerance = 1 + equippedRod.tensionToleranceBonus / 100;
        const reelDrag = 1 + equippedReel.dragStability / 100;

        if (isReeling) {
          const tensionRate = (0.016 * (fishDifficulty * 0.6)) / (rodTolerance * reelDrag);
          nextTension += tensionRate;
        } else {
          nextTension -= 0.018;
        }

        // Controlled subtle fish struggle variance
        if (Math.random() < 0.08) {
          nextTension += (Math.random() * 0.04 * fishDifficulty) / rodTolerance;
        }

        soundEngine.updateTensionSound(nextTension);

        // Snap condition: High tension sustained >= 0.98
        if (nextTension >= 0.98) {
          soundEngine.playLineSnap();
          cleanupFishingSession('line snapped under tension');
          transitionFishingState('CANCELLED', session, 'line snapped under tension');
          return 1.0;
        }

        // Slack slip condition: Tension collapses below 0.02
        if (nextTension <= 0.02) {
          cleanupFishingSession('line tension collapsed');
          transitionFishingState('CANCELLED', session, 'line tension collapsed');
          return 0.0;
        }

        return Math.min(1.0, Math.max(0.01, nextTension));
      });

      setFishDistance((prevDist) => {
        if (!isReeling) {
          return Math.min(22, prevDist + 0.04);
        }

        const reelSpeed = 0.22 * (1 + equippedReel.reelSpeedBonus / 100);
        const nextDist = prevDist - reelSpeed;

        if (nextDist <= 1.0) {
          triggerCatchSuccess(session);
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
  }, [
    fishingState,
    isReeling,
    isPaused,
    activeFish,
    equippedRod,
    equippedReel,
    triggerCatchSuccess,
    transitionFishingState,
  ]);

  const handleSellCatch = useCallback(() => {
    if (lastCatchRecord) {
      setCoins((prev) => prev + lastCatchRecord.value);
      soundEngine.playCoinDing();
    }
    setShowCatchModal(false);
    cleanupFishingSession('sell catch');
    activeSessionIdRef.current = ++sessionIdCounterRef.current;
    setFishingState('IDLE');
    setCastPower(0);
    setLineTension(0.3);
    setTopLevelGameState('PLAYING');
  }, [lastCatchRecord, cleanupFishingSession]);

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
    cleanupFishingSession('keep catch');
    activeSessionIdRef.current = ++sessionIdCounterRef.current;
    setFishingState('IDLE');
    setCastPower(0);
    setLineTension(0.3);
    setTopLevelGameState('PLAYING');
  }, [lastCatchRecord, cleanupFishingSession]);

  // Emergency recovery for fishing system
  const resetFishingSystem = useCallback(() => {
    cleanupFishingSession('emergency system reset');
    activeSessionIdRef.current = ++sessionIdCounterRef.current;
    setFishingState('IDLE');
  }, [cleanupFishingSession]);

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

  const handleTogglePause = useCallback(() => {
    if (topLevelGameState === 'MAIN_MENU' || topLevelGameState === 'BOOT' || topLevelGameState === 'LOADING') return;

    if (topLevelGameState === 'PAUSED') {
      setIsPaused(false);
      setTopLevelGameState(fishingState === 'IDLE' ? 'PLAYING' : 'FISHING');
    } else {
      setIsPaused(true);
      setTopLevelGameState('PAUSED');
    }
  }, [topLevelGameState, fishingState]);

  const handleStartNewGame = useCallback(() => {
    setCoins(150);
    setEquippedRodId('bamboo_starter');
    setEquippedReelId('basic_reel');
    setEquippedLineId('mono_starter');
    setEquippedBaitId('bread_crumbs');
    setEquippedLureId('surface_popper');
    setUnlockedGearIds(['bamboo_starter', 'basic_reel', 'mono_starter']);
    setBaitInventory({ bread_crumbs: 15, live_worms: 10, sweet_corn: 8 });
    setCustomization(DEFAULT_GEAR_CUSTOMIZATION);
    setCabinTheme('RUSTIC_CEDAR');
    setDockLighting('EDISON_BULBS');
    setMountedTrophies([]);
    setCraftingMaterials(INITIAL_CRAFTING_MATERIALS);
    setCatchHistory([]);
    setUnlockedCatches({});
    setDailyMissions(INITIAL_DAILY_MISSIONS);
    handleResetToIdle('new game start');

    try {
      localStorage.setItem('fishing_days_has_save', 'true');
      localStorage.setItem('fishing_days_coins', '150');
      localStorage.setItem('fishing_days_rod', 'bamboo_starter');
      localStorage.setItem('fishing_days_reel', 'basic_reel');
      localStorage.setItem('fishing_days_line', 'mono_starter');
      localStorage.setItem('fishing_days_bait', 'bread_crumbs');
      localStorage.setItem('fishing_days_unlocked_gear', JSON.stringify(['bamboo_starter', 'basic_reel', 'mono_starter']));
      localStorage.setItem('fishing_days_bait_inventory', JSON.stringify({ bread_crumbs: 15, live_worms: 10, sweet_corn: 8 }));
      localStorage.setItem('fishing_days_customization', JSON.stringify(DEFAULT_GEAR_CUSTOMIZATION));
      localStorage.setItem('fishing_days_catch_history', JSON.stringify([]));
      localStorage.setItem('fishing_days_collection', JSON.stringify({}));
    } catch {}

    setHasExistingSave(true);
    soundEngine.resume();
    soundEngine.playCastWhoosh();
    setTopLevelGameState('PLAYING');
  }, [handleResetToIdle]);

  const handleContinueGame = useCallback(() => {
    soundEngine.resume();
    soundEngine.playCoinDing();
    setTopLevelGameState('PLAYING');
  }, []);

  // Check if any modal is currently open
  const isAnyModalOpen =
    showCatchModal ||
    showCollectionModal ||
    showTackleShop ||
    showCustomizationModal ||
    showCabinModal ||
    showDailyMissionsModal ||
    showCreditsModal ||
    showPauseConfirmMenu;

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pause toggle: Key P
      if (e.code === 'KeyP') {
        handleTogglePause();
        return;
      }

      if (e.code === 'Escape') {
        if (showPauseConfirmMenu) {
          setShowPauseConfirmMenu(false);
          return;
        }
        if (topLevelGameState === 'PAUSED') {
          handleTogglePause();
          return;
        }
        if (showCreditsModal) {
          setShowCreditsModal(false);
          return;
        }
        if (showCatchModal) {
          handleKeepCatch();
          return;
        }
        if (showCollectionModal) {
          setShowCollectionModal(false);
          return;
        }
        if (showTackleShop) {
          setShowTackleShop(false);
          return;
        }
        if (showCustomizationModal) {
          setShowCustomizationModal(false);
          return;
        }
        if (showCabinModal) {
          setShowCabinModal(false);
          return;
        }
        if (showDailyMissionsModal) {
          setShowDailyMissionsModal(false);
          return;
        }
        if (topLevelGameState === 'PLAYING' || topLevelGameState === 'FISHING') {
          handleTogglePause();
          return;
        }
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
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 1. LOADING SCREEN (BLACK + WHITE MAXIMALISM) */}
      {(topLevelGameState === 'BOOT' || topLevelGameState === 'LOADING' || !isLoadingComplete) && (
        <LoadingScreen
          progress={loadingProgress}
          statusText={loadingStatus}
          error={loadingError}
          isComplete={isLoadingComplete && topLevelGameState !== 'BOOT' && topLevelGameState !== 'LOADING'}
          onRetry={() => window.location.reload()}
        />
      )}

      {/* 2. MAIN MENU (BLACK + WHITE MAXIMALISM) */}
      {topLevelGameState === 'MAIN_MENU' && (
        <MainMenu
          hasExistingSave={hasExistingSave}
          weather={weather}
          timeOfDay={timeOfDay}
          onContinue={handleContinueGame}
          onNewGame={handleStartNewGame}
          onOpenEncyclopedia={() => setShowCollectionModal(true)}
          onOpenSettings={() => setShowCustomizationModal(true)}
        />
      )}

      {/* 3. 3D WEBGL ENGINE WITH AUTHORITATIVE CAMERA CONTROLLER */}
      <ThreeCanvas
        cameraMode={topLevelGameState === 'MAIN_MENU' ? 'CINEMATIC_MENU' : 'GAMEPLAY'}
        fishingState={fishingState}
        isCastCharging={isCastCharging}
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
        isPaused={isPaused || topLevelGameState === 'PAUSED'}
        onCanFishChange={setCanFish}
        onCastLanded={handleCastLanded}
        joystickInput={joystickInput}
        onLoadingProgress={(prog, step) => {
          setLoadingProgress(prog);
          setLoadingStatus(step);
          if (topLevelGameState === 'BOOT') {
            setTopLevelGameState('LOADING');
          }
        }}
        onLoadingError={(err) => setLoadingError(err)}
        onLoadingComplete={() => {
          setLoadingProgress(100);
          setLoadingStatus('READY');
          window.setTimeout(() => {
            setIsLoadingComplete(true);
            setTopLevelGameState('MAIN_MENU');
          }, 450);
        }}
        cameraRotateRef={cameraRotateRef}
        onCanvasClick={() => {
          if (topLevelGameState === 'PLAYING' || topLevelGameState === 'FISHING') {
            soundEngine.resume();
            if (fishingState === 'BITE') {
              handleHookFish();
            }
          }
        }}
      />

      {/* 4. TOP HUD & ENVIRONMENT CONTROLS (ONLY IN ACTIVE GAMEPLAY OR PAUSE) */}
      {(topLevelGameState === 'PLAYING' || topLevelGameState === 'FISHING' || topLevelGameState === 'PAUSED') && (
        <EnvironmentControlBar
          weather={weather}
          timeOfDay={timeOfDay}
          coins={coins}
          soundEnabled={soundEnabled}
          language={language}
          isPaused={topLevelGameState === 'PAUSED'}
          dailyMissions={dailyMissions}
          onOpenDailyMissions={() => setShowDailyMissionsModal(true)}
          onTogglePause={handleTogglePause}
          onCycleWeather={cycleWeather}
          onCycleTimeOfDay={cycleTimeOfDay}
          onToggleSound={toggleSound}
          onOpenCollection={() => setShowCollectionModal(true)}
          onOpenShop={() => setShowTackleShop(true)}
          onOpenCustomization={() => setShowCustomizationModal(true)}
          onOpenCabin={() => setShowCabinModal(true)}
          onOpenGuide={handleOpenGuide}
        />
      )}

      {/* 5. DEDICATED MOBILE LANDSCAPE CONTROLS & CAMERA TOUCH ZONE */}
      {(topLevelGameState === 'PLAYING' || topLevelGameState === 'FISHING') && !isAnyModalOpen && (
        <MobileControls
          fishingState={fishingState}
          canFish={canFish}
          isPaused={false}
          disabled={!isLoadingComplete || isAnyModalOpen}
          onMove={(dx, dy) => setJoystickInput({ x: dx, y: dy })}
          onCameraRotate={(deltaYaw, deltaPitch) => {
            if (cameraRotateRef.current) {
              cameraRotateRef.current(deltaYaw, deltaPitch);
            }
          }}
          onStartCastCharge={handleStartCastCharge}
          onReleaseCastCharge={handleReleaseCastCharge}
          onHookFish={handleHookFish}
          onStartReel={handleStartReel}
          onStopReel={handleStopReel}
          onResetToIdle={handleResetToIdle}
        />
      )}

      {/* 6. FISHING ACTION CONTROLS & HUD */}
      {(topLevelGameState === 'PLAYING' || topLevelGameState === 'FISHING') && !isAnyModalOpen && (
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
      )}

      {/* 6.5 ONE-TIME ONBOARDING OVERLAY FOR FIRST FISHING SESSION */}
      {showOnboardingOverlay &&
        (topLevelGameState === 'PLAYING' || topLevelGameState === 'FISHING') &&
        !isAnyModalOpen && (
          <FishingOnboardingOverlay
            fishingState={fishingState}
            castPower={castPower}
            lineTension={lineTension}
            language={language}
            isOpen={showOnboardingOverlay}
            onDismiss={handleDismissOnboarding}
          />
        )}

      {/* 7. PAUSE MENU (BLACK + WHITE MAXIMALISM) */}
      {topLevelGameState === 'PAUSED' && (
        <div
          id="pause-menu-modal"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm text-white flex flex-col items-center justify-center p-6 select-none font-mono"
        >
          <div className="w-full max-w-sm border-4 border-white bg-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_#ffffff] flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-[10px] tracking-[0.3em] font-black uppercase text-[#888888]">
                GAME SUSPENDED
              </span>
              <h2 className="text-3xl font-black uppercase tracking-widest text-white">PAUSED</h2>
              <div className="w-16 h-1 bg-white mt-1" />
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                id="btn-pause-resume"
                onClick={() => {
                  setIsPaused(false);
                  setTopLevelGameState(fishingState === 'IDLE' ? 'PLAYING' : 'FISHING');
                }}
                className="w-full py-3 bg-white text-black font-black text-xs uppercase tracking-widest border-2 border-white hover:bg-black hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#ffffff]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME</span>
              </button>

              <button
                id="btn-pause-gear"
                onClick={() => setShowCustomizationModal(true)}
                className="w-full py-2.5 bg-black text-white font-black text-xs uppercase tracking-widest border-2 border-white hover:bg-white hover:text-black transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4" />
                <span>SETTINGS & GEAR</span>
              </button>

              <button
                id="btn-pause-encyclopedia"
                onClick={() => setShowCollectionModal(true)}
                className="w-full py-2.5 bg-black text-white font-black text-xs uppercase tracking-widest border-2 border-white hover:bg-white hover:text-black transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>FISH ENCYCLOPEDIA</span>
              </button>

              <button
                id="btn-pause-main-menu"
                onClick={() => setShowPauseConfirmMenu(true)}
                className="w-full py-2.5 bg-black text-[#aaaaaa] hover:text-white font-black text-xs uppercase tracking-widest border-2 border-[#555555] hover:border-white transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                <Home className="w-4 h-4" />
                <span>RETURN TO MAIN MENU</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. PAUSE RETURN CONFIRMATION MODAL */}
      {showPauseConfirmMenu && (
        <div
          id="pause-confirm-menu-modal"
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md text-white flex flex-col items-center justify-center p-6 select-none font-mono"
        >
          <div className="w-full max-w-sm border-4 border-white bg-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_#ffffff] flex flex-col items-center gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-white" />
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
                RETURN TO MAIN MENU?
              </h3>
              <p className="text-xs text-[#888888] uppercase tracking-wider leading-relaxed">
                UNSAVED ACTIVE PROGRESS MAY BE LOST.
              </p>
            </div>
            <div className="w-full grid grid-cols-2 gap-3">
              <button
                id="btn-cancel-return-menu"
                onClick={() => setShowPauseConfirmMenu(false)}
                className="py-2.5 bg-black text-white font-black text-xs uppercase tracking-widest border-2 border-white hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                CANCEL
              </button>
              <button
                id="btn-confirm-return-menu"
                onClick={() => {
                  setShowPauseConfirmMenu(false);
                  handleResetToIdle('return to main menu');
                  setIsPaused(false);
                  setTopLevelGameState('MAIN_MENU');
                }}
                className="py-2.5 bg-white text-black font-black text-xs uppercase tracking-widest border-2 border-white hover:bg-black hover:text-white transition-all cursor-pointer shadow-[4px_4px_0px_0px_#ffffff]"
              >
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. LANDSCAPE ORIENTATION WARNING */}
      {isPortrait && (
        <div
          id="portrait-orientation-lock"
          className="fixed inset-0 z-70 bg-[#000000] text-white flex flex-col items-center justify-center p-6 sm:p-8 text-center select-none font-mono"
        >
          <div className="w-full max-w-sm border-4 border-white p-6 sm:p-8 bg-black shadow-[8px_8px_0px_0px_#ffffff] flex flex-col items-center gap-4">
            <RotateCw className="w-12 h-12 text-white animate-spin" style={{ animationDuration: '4s' }} />
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider">
              ROTATE YOUR DEVICE
            </h2>
            <div className="w-16 h-1 bg-white" />
            <p className="text-xs text-[#aaaaaa] leading-relaxed uppercase tracking-wider">
              FISHING DAYS WORKS IN LANDSCAPE MODE.
            </p>
          </div>
        </div>
      )}

      {/* 10. CREDITS MODAL */}
      {showCreditsModal && (
        <div
          id="credits-modal"
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm text-white flex flex-col items-center justify-center p-6 select-none font-mono"
        >
          <div className="w-full max-w-md border-4 border-white bg-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_#ffffff] flex flex-col items-center gap-6">
            <div className="text-center flex flex-col items-center gap-1">
              <span className="text-[10px] tracking-[0.3em] font-black uppercase text-[#888888]">
                FISHING DAYS
              </span>
              <h2 className="text-2xl font-black uppercase tracking-widest text-white">CREDITS</h2>
              <p className="text-[11px] text-[#888888] uppercase tracking-widest">
                3D COZY INDIE FISHING & EXPLORATION
              </p>
              <div className="w-16 h-1 bg-white mt-1" />
            </div>
            <div className="w-full flex flex-col gap-3 text-xs uppercase text-[#cccccc] leading-relaxed">
              <div className="flex justify-between border-b border-[#333333] pb-1.5">
                <span className="text-[#888888]">DESIGN & CODE</span>
                <span className="font-bold text-white">INDIE ANGLER LABS</span>
              </div>
              <div className="flex justify-between border-b border-[#333333] pb-1.5">
                <span className="text-[#888888]">ENGINE</span>
                <span className="font-bold text-white">THREE.JS WEBGL</span>
              </div>
              <div className="flex justify-between border-b border-[#333333] pb-1.5">
                <span className="text-[#888888]">AUDIO</span>
                <span className="font-bold text-white">PROCEDURAL WEBAUDIO</span>
              </div>
              <div className="flex justify-between border-b border-[#333333] pb-1.5">
                <span className="text-[#888888]">STYLE</span>
                <span className="font-bold text-white">BLACK + WHITE MAXIMALISM</span>
              </div>
            </div>
            <button
              id="btn-close-credits"
              onClick={() => setShowCreditsModal(false)}
              className="w-full py-2.5 bg-white text-black font-black text-xs uppercase tracking-widest border-2 border-white hover:bg-black hover:text-white transition-all cursor-pointer shadow-[4px_4px_0px_0px_#ffffff]"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

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
