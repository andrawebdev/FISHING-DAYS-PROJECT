import { DailyMission, CatchRecord } from '../types';

export const INITIAL_DAILY_MISSIONS: DailyMission[] = [
  {
    id: 'mission_1',
    title: 'SUNSHINE ANGLER',
    description: 'Catch 2 fish under Sunny skies',
    targetType: 'WEATHER',
    targetValue: 'SUNNY',
    targetCount: 2,
    currentCount: 0,
    rewardCoins: 50,
    completed: false,
    claimed: false,
  },
  {
    id: 'mission_2',
    title: 'BLUEGILL BOUNTY',
    description: 'Catch 1 Bluegill Sunfish from the lake',
    targetType: 'FISH_SPECIES',
    targetValue: 'bluegill_sunfish',
    targetCount: 1,
    currentCount: 0,
    rewardCoins: 75,
    completed: false,
    claimed: false,
  },
  {
    id: 'mission_3',
    title: 'TROPHY HUNTER',
    description: 'Catch any Rare, Epic, or Legendary fish',
    targetType: 'RARITY',
    targetValue: 'RARE',
    targetCount: 1,
    currentCount: 0,
    rewardCoins: 120,
    completed: false,
    claimed: false,
  },
  {
    id: 'mission_4',
    title: 'LAKE REGULAR',
    description: 'Catch any 3 fish of any species',
    targetType: 'CATCH_COUNT',
    targetValue: 'ANY',
    targetCount: 3,
    currentCount: 0,
    rewardCoins: 60,
    completed: false,
    claimed: false,
  },
];

export function updateMissionsOnCatch(
  missions: DailyMission[],
  catchRecord: CatchRecord
): { updatedMissions: DailyMission[]; newCompletedCount: number } {
  let newCompletedCount = 0;

  const updatedMissions = missions.map((mission) => {
    if (mission.completed) return mission;

    let matched = false;

    if (mission.targetType === 'WEATHER') {
      if (catchRecord.weather === mission.targetValue) {
        matched = true;
      }
    } else if (mission.targetType === 'FISH_SPECIES') {
      if (catchRecord.speciesId === mission.targetValue) {
        matched = true;
      }
    } else if (mission.targetType === 'RARITY') {
      const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];
      const targetIdx = rarities.indexOf(mission.targetValue as string);
      const catchIdx = rarities.indexOf(catchRecord.rarity);
      if (catchIdx >= targetIdx && targetIdx !== -1) {
        matched = true;
      }
    } else if (mission.targetType === 'CATCH_COUNT') {
      matched = true;
    }

    if (matched) {
      const nextCount = Math.min(mission.targetCount, mission.currentCount + 1);
      const isNowCompleted = nextCount >= mission.targetCount;
      if (isNowCompleted && !mission.completed) {
        newCompletedCount++;
      }
      return {
        ...mission,
        currentCount: nextCount,
        completed: isNowCompleted,
      };
    }

    return mission;
  });

  return { updatedMissions, newCompletedCount };
}
