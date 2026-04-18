import { NextRequest, NextResponse } from "next/server";
import { getRaces } from "@/lib/races";
import { pushLineMessage } from "@/lib/line";
import { parseJstDateTime, isWithinNotificationWindow, formatJst } from "@/lib/race-time";
import { markNotificationSent } from "@/lib/redis";
import type { Race } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const NOTIFY_MINUTES = [10, 5] as const;
const SENT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7日

function isAuthorized(request: NextRequest): boolean {
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

function buildLineMessage(race: Race, minutesBefore: number, raceStart: Date) {
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

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const races = getRaces();

    const results: Array<{
      raceId: string;
      matchedMinutes: number[];
      sentMinutes: number[];
      skippedMinutes: number[];
    }> = [];

    for (const race of races) {
      const raceStart = parseJstDateTime(race.date, race.time);

      // 発走後は処理しない
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
        const isFirstSend = await markNotificationSent(sentKey, SENT_TTL_SECONDS);

        if (!isFirstSend) {
          skippedMinutes.push(minutesBefore);
          continue;
        }

        const message = buildLineMessage(race, minutesBefore, raceStart);
        await pushLineMessage(message);
        sentMinutes.push(minutesBefore);
      }

      if (matchedMinutes.length > 0) {
        results.push({
          raceId: race.id,
          matchedMinutes,
          sentMinutes,
          skippedMinutes
        });
      }
    }

    return NextResponse.json({
      ok: true,
      now: now.toISOString(),
      results
    });
  } catch (error) {
    console.error("notify cron error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}