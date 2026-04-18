import races from "../../../data/races.json";
import { Redis } from "@upstash/redis";

type Race = {
  id: string;
  date: string;
  time: string;
  course: string;
  raceNumber: string;
  raceName: string;
  horse: string;
  reason?: string;
};

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const NOTIFY_MINUTES = [10, 5] as const;
const SENT_TTL_SECONDS = 60 * 60 * 24 * 7;

function parseJstDateTime(date: string, time: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);

  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0));
}

function formatJst(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function isWithinNotificationWindow(
  now: Date,
  raceStart: Date,
  targetMinutes: number
): boolean {
  const diffMs = raceStart.getTime() - now.getTime();
  const upper = targetMinutes * 60 * 1000;
  const lower = upper - 60 * 1000;

  return diffMs <= upper && diffMs > lower;
}

function buildMessage(race: Race, minutesBefore: number, raceStart: Date) {
  const lines = [
    `【競馬予想通知】発走${minutesBefore}分前`,
    `${race.date} ${race.time} 発走`,
    `${race.course} ${race.raceNumber} ${race.raceName}`,
    `◎ ${race.horse}`,
    race.reason ? `理由: ${race.reason}` : "",
    `発走時刻(JST): ${formatJst(raceStart)}`,
  ].filter(Boolean);

  return lines.join("\n");
}

async function markNotificationSent(key: string) {
  const result = await redis.set(key, "1", {
    nx: true,
    ex: SENT_TTL_SECONDS,
  });

  return result === "OK";
}

async function sendLinePushMessage(message: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_USER_ID;

  if (!token) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN が設定されていません。");
  }

  if (!to) {
    throw new Error("LINE_USER_ID が設定されていません。");
  }

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text: message }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LINE push failed: ${response.status} ${errorText}`);
  }
}

function isAuthorized(request: Request): boolean {
  const expectedToken = process.env.CRON_API_TOKEN;

  if (!expectedToken) {
    throw new Error("CRON_API_TOKEN が設定されていません。");
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return false;
  }

  return authHeader === `Bearer ${expectedToken}`;
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const raceList: Race[] = races;

    const results: Array<{
      id: string;
      matchedMinutes: number[];
      sentMinutes: number[];
      skippedMinutes: number[];
    }> = [];

    for (const race of raceList) {
      const raceStart = parseJstDateTime(race.date, race.time);

      if (raceStart.getTime() <= now.getTime()) {
        continue;
      }

      const matchedMinutes: number[] = [];
      const sentMinutes: number[] = [];
      const skippedMinutes: number[] = [];

      for (const minutesBefore of NOTIFY_MINUTES) {
        const shouldNotify = isWithinNotificationWindow(
          now,
          raceStart,
          minutesBefore
        );

        if (!shouldNotify) {
          continue;
        }

        matchedMinutes.push(minutesBefore);

        const sentKey = `sent:${race.id}:${minutesBefore}`;
        const isFirstSend = await markNotificationSent(sentKey);

        if (!isFirstSend) {
          skippedMinutes.push(minutesBefore);
          continue;
        }

        const message = buildMessage(race, minutesBefore, raceStart);
        await sendLinePushMessage(message);
        sentMinutes.push(minutesBefore);
      }

      if (matchedMinutes.length > 0) {
        results.push({
          id: race.id,
          matchedMinutes,
          sentMinutes,
          skippedMinutes,
        });
      }
    }

    return Response.json({
      ok: true,
      now: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("notify error:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}