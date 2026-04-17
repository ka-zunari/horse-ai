import { calculateRecovery } from "./result";
import { getPredictions } from "./prediction";

type Race = {
  id: number;
};

type Entry = {
  raceId: number;
  popularity: number;
  odds: number;
  horse: string;
};

type Result = {
  raceId: number;
  first: string;
  winPayout: number;
};

type PredictionEntry = Entry & {
  score: number;
};

export function calculateSummary(
  races: Race[],
  entries: Entry[],
  results: Result[]
) {
  let totalRaces = 0;
  let hitCount = 0;
  let totalBet = 0;
  let totalPayout = 0;
  let totalProfit = 0;

  for (const race of races) {
    const raceEntries: PredictionEntry[] = getPredictions(entries, race.id);
    const result = results.find((r) => r.raceId === race.id);
    const topHorse = raceEntries.length > 0 ? raceEntries[0].horse : undefined;

    if (!result || !topHorse) continue;

    totalRaces++;

    const recovery = calculateRecovery(topHorse, result);

    totalBet += recovery.betAmount;
    totalPayout += recovery.payout;
    totalProfit += recovery.profit;

    if (recovery.hit) {
      hitCount++;
    }
  }

  const hitRate = totalRaces > 0 ? (hitCount / totalRaces) * 100 : 0;
  const recoveryRate = totalBet > 0 ? (totalPayout / totalBet) * 100 : 0;

  return {
    totalRaces,
    hitCount,
    totalBet,
    totalPayout,
    totalProfit,
    hitRate,
    recoveryRate,
  };
}