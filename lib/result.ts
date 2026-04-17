type RaceResult = {
  first: string;
  winPayout: number;
};

export function isWinHit(topHorse: string, result: RaceResult) {
  return topHorse === result.first;
}

export function calculateRecovery(topHorse: string, result: RaceResult) {
  const betAmount = 100;

  if (topHorse === result.first) {
    return {
      betAmount,
      payout: result.winPayout,
      profit: result.winPayout - betAmount,
      hit: true,
    };
  }

  return {
    betAmount,
    payout: 0,
    profit: -betAmount,
    hit: false,
  };
}