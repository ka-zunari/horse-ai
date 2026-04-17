type Entry = {
  raceId: number;
  popularity: number;
  odds: number;
  horse: string;
};

type PredictionEntry = Entry & {
  score: number;
};

export function calculateScore(entry: Entry) {
  const popularityScore = 10 - entry.popularity;
  const oddsScore = 10 / entry.odds;

  return popularityScore + oddsScore;
}

export function getMark(rank: number) {
  if (rank === 0) return "◎";
  if (rank === 1) return "○";
  if (rank === 2) return "▲";
  return "△";
}

export function getPredictions(
  entries: Entry[],
  raceId: number
): PredictionEntry[] {
  return entries
    .filter((entry) => entry.raceId === raceId)
    .map((entry) => ({
      ...entry,
      score: calculateScore(entry),
    }))
    .sort((a, b) => b.score - a.score);
}