import { Redis } from "@upstash/redis";
import { parseJstDateTime, isWithinNotificationWindow, formatJst } from "@/lib/race-time";
import { pushLineMessage } from "@/lib/line";
import { syncRacesFromCsv, getLocalRaces } from "@/lib/races";
import type { Race } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const NOTIFY_MINUTES = [10, 5] as const;
const SENT_TTL_SECONDS = 60 * 60 * 24 * 7;

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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

function buildMessage(race: Race, minutesBefore: number, raceStart: Date): string {
  const alertLabel =
    minutesBefore === 10 ? "【発走10分前】" : "【発走5分前・最終確認】";

  const lines = [
    `${alertLabel} 競馬通知`,
    `${race.date} ${race.time} 発走`,
    `${race.course} ${race.raceNumber} ${race.raceName}`,
    race.horse ? `◎ ${race.horse}` : "予想はまだ未設定です",
    race.reason ? `理由: ${race.reason}` : "",
    `発走時刻(JST): ${formatJst(raceStart)}`,
  ].filter(Boolean);

  return lines.join("\n");
}

async function markNotificationSent(key: string): Promise<boolean> {
  const result = await redis.set(key, "1", {
    nx: true,
    ex: SENT_TTL_SECONDS,
  });

  return result === "OK";
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let raceList: Race[] = [];

    try {
      raceList = await syncRacesFromCsv();
    } catch (syncError) {
      console.error("CSV同期失敗。ローカルの races.json を使います。", syncError);
      raceList = getLocalRaces();
    }

    const now = new Date();

    const results: Array<{
      raceId: string;
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
        const shouldNotify = isWithinNotificationWindow(now, raceStart, minutesBefore);

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
        await pushLineMessage(message);
        sentMinutes.push(minutesBefore);
      }

      if (matchedMinutes.length > 0) {
        results.push({
          raceId: race.id,
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
      raceCount: raceList.length,
    });
  } catch (error) {
    console.error("notify cron error:", error);

    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}