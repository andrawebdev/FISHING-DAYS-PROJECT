export type FishingState =
  | 'IDLE'
  | 'PREPARING'
  | 'CASTING'
  | 'BOBBER_ACTIVE'
  | 'FISH_APPROACHING'
  | 'BITE'
  | 'HOOKED'
  | 'FISH_STRUGGLING'
  | 'REELING'
  | 'SUCCESS'
  | 'FAILED';

export type ViewMode = 'FISHING_DOCK' | 'PLAYER_CABIN' | 'UNDERWATER_SONAR';

export type FishRarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC';

export type WeatherType =
  | 'SUNNY'
  | 'CLOUDY'
  | 'RAIN'
  | 'HEAVY_RAIN'
  | 'FOG';

export type TimeOfDay =
  | 'MORNING'
  | 'DAY'
  | 'AFTERNOON'
  | 'SUNSET'
  | 'NIGHT';

export interface FishSpecies {
  id: string;
  name: string;
  rarity: FishRarity;
  minWeight: number; // in kg
  maxWeight: number; // in kg
  minLength: number; // in cm
  maxLength: number; // in cm
  baseValue: number; // in coins
  difficulty: number; // 1 to 10
  habitat: string;
  preferredWeather: WeatherType[];
  preferredTime: TimeOfDay[];
  preferredBait: string[];
  description: string;
  color: string;
  secondaryColor: string;
  dorsalColor: string;
  hasGlow?: boolean;
}

export interface RodItem {
  id: string;
  name: string;
  tier: number;
  castDistanceBonus: number; // percentage
  tensionToleranceBonus: number; // percentage
  biteRateBonus?: number; // percentage faster bites
  sweetSpotBonus?: number; // bigger green safe zone
  price: number;
  description: string;
  color: string;
}

export interface ReelItem {
  id: string;
  name: string;
  tier: number;
  reelSpeedBonus: number;
  dragStability: number;
  slackRecoveryBonus?: number;
  price: number;
  description: string;
}

export interface LineItem {
  id: string;
  name: string;
  tier: number;
  strengthKg: number;
  snapResistance: number;
  abrasionResistance?: number;
  price: number;
  description: string;
}

export interface BaitItem {
  id: string;
  name: string;
  rarityTier: FishRarity;
  rarityBoostPercent: number;
  biteRateBonus?: number;
  count: number;
  price: number;
  description: string;
  icon: string;
}

export interface LureItem {
  id: string;
  name: string;
  tier: number;
  lureType: 'SURFACE_POPPER' | 'DEEP_DIVER' | 'JIG_FEATHER' | 'SPINNER_PRISM' | 'GLOW_JELLY';
  rarityBoostPercent: number;
  biteRateBonus: number; // +% bite speed
  reactionGraceBonus: number; // +sec to hook
  attractionRadiusBonus: number; // +% underwater detection range
  price: number;
  description: string;
  color: string;
  icon: string;
}

// Visual customization options for the rod, reel, line, bobber
export type RodPattern = 'SOLID' | 'CARBON_WEAVE' | 'CHERRY_BLOSSOM' | 'TIGER_STRIPES' | 'CELESTIAL_RUNES' | 'BAMBOO_RINGS';
export type HandleGrip = 'NATURAL_CORK' | 'DARK_EVA' | 'POLISHED_ROSEWOOD' | 'PEARL_INLAY';
export type ReelMetalTint = 'SILVER' | 'GOLD' | 'GUNMETAL' | 'ROSE_GOLD' | 'NEON_IRIDESCENT';
export type LineTint = 'CLEAR' | 'NEON_YELLOW' | 'AQUA_BLUE' | 'CORAL_RED' | 'GLOW_EMERALD';
export type BobberStyle = 'CLASSIC_SPHERE' | 'GOLDEN_ACORN' | 'WATERMELON_FLOAT' | 'CRYSTAL_ORB' | 'DUCKLING' | 'NEON_BEACON';

export interface GearCustomization {
  rodColor: string;
  rodPattern: RodPattern;
  handleGrip: HandleGrip;
  guideRingColor: string;
  reelMetalTint: ReelMetalTint;
  lineTint: LineTint;
  bobberStyle: BobberStyle;
}

// Player Housing & Base System
export type CabinTheme = 'RUSTIC_CEDAR' | 'NORDIC_BIRCH' | 'ALPINE_PINE' | 'DARK_MAHOGANY';
export type DockLighting = 'EDISON_BULBS' | 'FAIRY_LIGHTS' | 'LANTERN_TORCHES' | 'NEON_STRIPS';
export type PlaqueStyle = 'BRONZE' | 'SILVER' | 'GOLD' | 'OBSIDIAN';

export interface MountedTrophy {
  slot: number; // 1 to 4
  speciesId: string;
  speciesName: string;
  weight: number;
  length: number;
  rarity: FishRarity;
  caughtAt: string;
  plaqueStyle: PlaqueStyle;
}

export interface CraftingMaterial {
  id: string;
  name: string;
  count: number;
  description: string;
  icon: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  category: 'LURE' | 'BAIT' | 'UPGRADE';
  resultId: string;
  resultType: 'lure' | 'bait' | 'gear_upgrade';
  resultCount: number;
  requiredMaterials: { materialId: string; amount: number }[];
  coinsCost: number;
  description: string;
  icon: string;
}

// Dynamic Underwater Ecosystem
export type FishRole = 'PREY_MINNOW' | 'MEDIUM_PREDATOR' | 'APEX_PREDATOR' | 'BOTTOM_FEEDER';

export interface EcosystemFishState {
  id: string;
  speciesName: string;
  role: FishRole;
  rarity: FishRarity;
  x: number;
  y: number; // negative depth in water
  z: number;
  vx: number;
  vy: number;
  vz: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  speed: number;
  length: number;
  state: 'SCHOOLING' | 'HUNTING' | 'FLEEING' | 'FORAGING_WEEDS' | 'STALKING_BAIT';
  targetPreyId?: string;
  color: string;
  glow?: boolean;
}

export interface EcosystemVegetationPatch {
  id: string;
  type: 'KELP' | 'RIVER_REEDS' | 'WATER_LILY' | 'FEATHER_WEED';
  x: number;
  z: number;
  height: number;
  density: number;
  color: string;
}

export interface CatchRecord {
  id: string;
  speciesId: string;
  speciesName: string;
  rarity: FishRarity;
  weight: number; // kg
  length: number; // cm
  value: number;
  caughtAt: string;
  caughtBy: string;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  location: string;
}

export interface AnglerPeer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  position: [number, number, number];
  rotationY: number;
  state: 'idle' | 'casting' | 'waiting' | 'reeling' | 'caught';
  lastCatch?: {
    name: string;
    rarity: FishRarity;
    weight: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar?: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  isLocal?: boolean;
  rarity?: FishRarity;
}

export type SupportedLanguage = 'en' | 'id' | 'ja' | 'es';

export interface GameSettings {
  language: SupportedLanguage;
  soundEnabled: boolean;
  ambientVolume: number;
  sfxVolume: number;
  graphicsQuality: 'low' | 'medium' | 'high';
  autoCastTime: boolean;
}
