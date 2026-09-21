export type FishingState =
  | 'IDLE'
  | 'CASTING'
  | 'WAITING'
  | 'BITE'
  | 'HOOKED'
  | 'REELING'
  | 'CAUGHT'
  | 'CANCELLED';

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

export type SupportedLanguage = 'en' | 'es' | 'ja' | 'id';

export interface FishSpecies {
  id: string;
  name: string;
  rarity: FishRarity;
  minWeight: number;
  maxWeight: number;
  minLength: number;
  maxLength: number;
  baseValue: number;
  difficulty: number;
  preferredWeather: WeatherType[];
  preferredTime: TimeOfDay[];
  preferredBait: string[];
  description: string;
  color: string;
  secondaryColor?: string;
  dorsalColor?: string;
  habitat?: string;
  hasGlow?: boolean;
}

export interface CatchRecord {
  id: string;
  speciesId: string;
  speciesName: string;
  rarity: FishRarity;
  weight: number;
  length: number;
  value: number;
  caughtAt: string;
  caughtBy: string;
  weather: WeatherType;
  timeOfDay: TimeOfDay;
  location: string;
}

export interface RodItem {
  id: string;
  name: string;
  tier?: number;
  description: string;
  price: number;
  castDistanceBonus: number;
  tensionToleranceBonus: number;
  biteRateBonus?: number;
  sweetSpotBonus?: number;
  color: string;
}

export interface ReelItem {
  id: string;
  name: string;
  tier?: number;
  description: string;
  price: number;
  reelSpeedBonus: number;
  dragStability: number;
  recoveryRate?: number;
  slackRecoveryBonus?: number;
  color?: string;
}

export interface LineItem {
  id: string;
  name: string;
  tier?: number;
  description: string;
  price: number;
  strengthKg: number;
  snapResistance: number;
  invisibilityBonus?: number;
  abrasionResistance?: number;
  color?: string;
}

export interface BaitItem {
  id: string;
  name: string;
  rarityTier?: string;
  description: string;
  price: number;
  count: number;
  biteRateBonus?: number;
  rarityBoostPercent: number;
  icon: string;
}

export interface LureItem {
  id: string;
  name: string;
  tier?: number;
  description: string;
  price: number;
  attractType?: string;
  lureType?: string;
  attractBonus?: number;
  rarityBoostPercent?: number;
  biteRateBonus?: number;
  reactionGraceBonus?: number;
  attractionRadiusBonus?: number;
  color: string;
  icon?: string;
}

export type RodPattern = 'SOLID' | 'STRIPED' | 'METALLIC' | string;
export type HandleGrip = 'NATURAL_CORK' | 'DARK_FOAM' | 'LEATHER_WRAP' | 'DARK_EVA' | 'POLISHED_ROSEWOOD' | string;
export type ReelMetalTint = 'SILVER' | 'GOLD' | 'ONYX' | 'ROSE_GOLD' | 'TITANIUM_BLUE' | 'GUNMETAL' | 'NEON_IRIDESCENT' | string;
export type LineTint = 'CLEAR' | 'NEON_GREEN' | 'BRAIDED_GOLD' | 'DEEP_BLUE' | 'SUNSET_ORANGE' | 'NEON_YELLOW' | 'AQUA_BLUE' | 'CORAL_RED' | 'GLOW_EMERALD' | string;
export type BobberStyle = 'CLASSIC_SPHERE' | 'OVAL_FLOAT' | 'FEATHER_QUILL' | string;

export interface GearCustomization {
  rodColor: string;
  rodPattern: RodPattern;
  handleGrip: HandleGrip;
  guideRingColor: string;
  reelMetalTint: ReelMetalTint;
  lineTint: LineTint;
  bobberStyle: BobberStyle;
}

export type CabinTheme =
  | 'RUSTIC_CEDAR'
  | 'NORDIC_PINE'
  | 'WEATHERED_DRIFTWOOD'
  | 'MODERN_SLATE'
  | 'NORDIC_BIRCH'
  | 'ALPINE_PINE'
  | 'DARK_MAHOGANY';

export type DockLighting =
  | 'EDISON_BULBS'
  | 'LANTERNS'
  | 'FIREFLIES'
  | 'SOLAR_TIKI'
  | 'FAIRY_LIGHTS'
  | 'LANTERN_TORCHES'
  | 'NEON_STRIPS';

export type PlaqueStyle = 'BRONZE' | 'SILVER' | 'GOLD' | 'OBSIDIAN' | 'NATURAL_PINE' | 'DARK_WALNUT' | 'BURNISHED_BRASS' | 'CARVED_DRIFTWOOD' | string;

export interface MountedTrophy {
  id?: string;
  slot?: number;
  slotIndex?: number;
  speciesId?: string;
  speciesName?: string;
  weight?: number;
  length?: number;
  rarity?: FishRarity | any;
  caughtAt?: string;
  plaqueStyle?: PlaqueStyle;
  catchRecord?: CatchRecord;
}

export interface CraftingMaterial {
  id: string;
  name: string;
  icon: string;
  rarity: string;
  desc: string;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  resultId?: string;
  resultType?: string;
  category: 'BAIT' | 'LURE' | 'DECORATION';
  resultCount: number;
  coinsCost?: number;
  icon?: string;
  requiredMaterials: any;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string | number;
  avatar?: string;
  rarity?: string;
  isSystem?: boolean;
}

export interface AnglerPeer {
  id: string;
  name: string;
  position: [number, number, number];
  rotationY: number;
  state: 'idle' | 'casting' | 'reeling' | 'caught' | 'waiting';
  rodColor?: string;
  color: string;
  avatar?: string;
  lastCatch?: { name: string; rarity: string; weight: number };
}
