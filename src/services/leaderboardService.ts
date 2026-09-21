import { CatchRecord, FishRarity } from '../types';

const LEADERBOARD_KEY = 'fishing_days_global_leaderboard_v1';

const SEED_RECORDS: CatchRecord[] = [
  {
    id: 'rec_1',
    speciesId: 'moonlight_leviathan',
    speciesName: 'Moonlight Leviathan',
    rarity: 'MYTHIC',
    weight: 62.4,
    length: 248,
    value: 2200,
    caughtAt: '2026-09-18 23:42',
    caughtBy: 'Capt. Andra',
    weather: 'FOG',
    timeOfDay: 'NIGHT',
    location: 'Forest Lake Deep Trench',
  },
  {
    id: 'rec_2',
    speciesId: 'celestial_fish',
    speciesName: 'Celestial Starlight Fish',
    rarity: 'MYTHIC',
    weight: 34.8,
    length: 176,
    value: 1500,
    caughtAt: '2026-09-19 02:15',
    caughtBy: 'StarlightAngler',
    weather: 'SUNNY',
    timeOfDay: 'NIGHT',
    location: 'Reflection Shrine Apex',
  },
  {
    id: 'rec_3',
    speciesId: 'giant_catfish',
    speciesName: 'Goliath Wels Catfish',
    rarity: 'EPIC',
    weight: 24.2,
    length: 154,
    value: 320,
    caughtAt: '2026-09-19 19:10',
    caughtBy: 'RiverHermit',
    weather: 'HEAVY_RAIN',
    timeOfDay: 'NIGHT',
    location: 'Muddy Basin Drop-off',
  },
  {
    id: 'rec_4',
    speciesId: 'ancient_trout',
    speciesName: 'Ancient Mossback Trout',
    rarity: 'LEGENDARY',
    weight: 21.6,
    length: 141,
    value: 700,
    caughtAt: '2026-09-20 06:12',
    caughtBy: 'MistyLover',
    weather: 'RAIN',
    timeOfDay: 'MORNING',
    location: 'Cold Mountain Runoff',
  },
  {
    id: 'rec_5',
    speciesId: 'golden_dorado',
    speciesName: 'Emperor Golden Dorado',
    rarity: 'LEGENDARY',
    weight: 19.8,
    length: 136,
    value: 750,
    caughtAt: '2026-09-20 15:30',
    caughtBy: 'SolReeler',
    weather: 'SUNNY',
    timeOfDay: 'AFTERNOON',
    location: 'Forest Lake Rapids',
  },
  {
    id: 'rec_6',
    speciesId: 'moonfin',
    speciesName: 'Luminescent Moonfin',
    rarity: 'LEGENDARY',
    weight: 17.5,
    length: 129,
    value: 650,
    caughtAt: '2026-09-20 21:05',
    caughtBy: 'NightOwl99',
    weather: 'SUNNY',
    timeOfDay: 'NIGHT',
    location: 'Moonlit Lake Center',
  },
  {
    id: 'rec_7',
    speciesId: 'ghost_carp',
    speciesName: 'Phantom Ghost Carp',
    rarity: 'EPIC',
    weight: 13.9,
    length: 108,
    value: 300,
    caughtAt: '2026-09-20 05:45',
    caughtBy: 'ZenFisher',
    weather: 'FOG',
    timeOfDay: 'MORNING',
    location: 'Misty Shorelines',
  },
  {
    id: 'rec_8',
    speciesId: 'crystal_koi',
    speciesName: 'Crystal Prism Koi',
    rarity: 'EPIC',
    weight: 11.2,
    length: 101,
    value: 280,
    caughtAt: '2026-09-20 17:50',
    caughtBy: 'AquaPrism',
    weather: 'SUNNY',
    timeOfDay: 'SUNSET',
    location: 'Shrine Reflection Pier',
  },
  {
    id: 'rec_9',
    speciesId: 'large_pike',
    speciesName: 'Northern Pike',
    rarity: 'RARE',
    weight: 8.4,
    length: 96,
    value: 120,
    caughtAt: '2026-09-20 11:20',
    caughtBy: 'SpikeMaster',
    weather: 'CLOUDY',
    timeOfDay: 'DAY',
    location: 'Sunken Log Cove',
  },
  {
    id: 'rec_10',
    speciesId: 'silver_salmon',
    speciesName: 'Silver Coho Salmon',
    rarity: 'RARE',
    weight: 7.7,
    length: 84,
    value: 135,
    caughtAt: '2026-09-20 09:14',
    caughtBy: 'NorthBreeze',
    weather: 'RAIN',
    timeOfDay: 'MORNING',
    location: 'Rushing Estuary',
  },
];

export const LeaderboardService = {
  getLeaderboard(): CatchRecord[] {
    try {
      const stored = localStorage.getItem(LEADERBOARD_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CatchRecord[];
        return parsed.sort((a, b) => b.weight - a.weight);
      }
    } catch {}
    return [...SEED_RECORDS].sort((a, b) => b.weight - a.weight);
  },

  submitCatch(record: CatchRecord): { isNewTopTen: boolean; rank: number } {
    const list = this.getLeaderboard();
    list.push(record);
    list.sort((a, b) => b.weight - a.weight);

    // Keep top 50
    const trimmed = list.slice(0, 50);
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));
    } catch {}

    const rank = trimmed.findIndex((item) => item.id === record.id) + 1;
    return {
      isNewTopTen: rank > 0 && rank <= 10,
      rank: rank > 0 ? rank : trimmed.length + 1,
    };
  },

  getBiggestCatchForSpecies(speciesId: string): CatchRecord | undefined {
    const list = this.getLeaderboard();
    return list.filter((r) => r.speciesId === speciesId).sort((a, b) => b.weight - a.weight)[0];
  },
};
