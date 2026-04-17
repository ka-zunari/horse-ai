import { calculateRecovery } from "./result";
import { getPredictions } from "./prediction";

export function calculateSummary(races: any[], entries: any[], results: any[]) {
  let totalRaces = 0;
  let hitCount = 0;
  let totalBet = 0;
  let totalPayout = 0;
  let totalProfit = 0;

  for (const race of races) {
    const raceEntries = getPredictions(entries, race.id);
    const result = results.find((r) => r.raceId === race.id);
    const topHorse = raceEntries[0]?.horse;

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