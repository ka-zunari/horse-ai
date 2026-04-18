const JST_OFFSET_HOURS = 9;

export function parseJstDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  return new Date(Date.UTC(year, month - 1, day, hour - JST_OFFSET_HOURS, minute, 0));
}

export function formatJst(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

/**
 * 発走10分前 / 5分前の「その1分間」に入ったら true
 * 例: 15:00発走・10分前なら 14:50:00〜14:50:59 の間だけ true
 */
export function isWithinNotificationWindow(
  now: Date,
  raceStart: Date,
  targetMinutes: number
): boolean {
  const diffMs = raceStart.getTime() - now.getTime();
  const upper = targetMinutes * 60 * 1000;
  const lower = upper - 60 * 1000;

  return diffMs <= upper && diffMs > lower;
}