import races from "../../../../data/races.json";

type Race = {
  id: number;
  raceName: string;
  course: string;
  date: string;
  time: string;
  status: "before" | "finished";
  notifyTimes: string[];
  prediction: {
    honmei: string;
    taiko: string;
    tanana: string;
    comment: string;
  };
  result: {
    first: string;
    second: string;
    third: string;
    hit: boolean;
  };
};

function getJapanNow() {
  const now = new Date();

  const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const dateParts = dateFormatter.formatToParts(now);
  const timeParts = timeFormatter.formatToParts(now);

  const year = dateParts.find((part) => part.type === "year")?.value ?? "";
  const month = dateParts.find((part) => part.type === "month")?.value ?? "";
  const day = dateParts.find((part) => part.type === "day")?.value ?? "";

  const hour = timeParts.find((part) => part.type === "hour")?.value ?? "";
  const minute = timeParts.find((part) => part.type === "minute")?.value ?? "";

  return {
    today: `${year}-${month}-${day}`,
    currentTime: `${hour}:${minute}`,
  };
}

function buildMessage(race: Race) {
  return `【レース予想通知】
${race.raceName}
開催場: ${race.course}
発走: ${race.date} ${race.time}

◎ ${race.prediction.honmei}
○ ${race.prediction.taiko}
▲ ${race.prediction.tanana}

見解:
${race.prediction.comment}`;
}

function getTargetRaces(preview: boolean) {
  const { today, currentTime } = getJapanNow();
  const raceList = races as Race[];

  const targetRaces = raceList.filter((race) => {
    if (race.status !== "before") {
      return false;
    }

    if (race.date !== today) {
      return false;
    }

    if (preview) {
      return true;
    }

    return race.notifyTimes.includes(currentTime);
  });

  return {
    today,
    currentTime,
    targetRaces,
  };
}

async function sendLinePushMessage(message: string) {
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const toUserId = process.env.LINE_TO_USER_ID;

  if (!channelAccessToken) {
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN が読み込めていません。");
  }

  if (!toUserId) {
    throw new Error("LINE_TO_USER_ID が読み込めていません。");
  }

  const trimmedToken = channelAccessToken.trim();
  const trimmedUserId = toUserId.trim();

  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${trimmedToken}`,
    },
    body: JSON.stringify({
      to: trimmedUserId,
      messages: [
        {
          type: "text",
          text: message,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LINE送信に失敗しました: ${response.status} ${errorText}`);
  }

  return true;
}

function isAuthorized(request: Request, preview: boolean) {
  if (preview) {
    return true;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const preview = searchParams.get("preview") === "1";
    const debug = searchParams.get("debug") === "1";

    if (!isAuthorized(request, preview)) {
      return Response.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const token = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "";
    const userId = process.env.LINE_TO_USER_ID ?? "";

    if (debug) {
      return Response.json({
        envCheck: {
          tokenExists: token.length > 0,
          tokenLength: token.length,
          tokenStartsWith: token ? token.slice(0, 8) : "",
          tokenEndsWith: token ? token.slice(-8) : "",
          userIdExists: userId.length > 0,
          userIdLength: userId.length,
          userIdStartsWith: userId ? userId.slice(0, 4) : "",
          userIdEndsWith: userId ? userId.slice(-4) : "",
          cronSecretExists: Boolean(process.env.CRON_SECRET),
        },
      });
    }

    const { today, currentTime, targetRaces } = getTargetRaces(preview);

    if (targetRaces.length === 0) {
      return Response.json({
        mode: preview ? "preview-send" : "live-send",
        now: {
          date: today,
          time: currentTime,
          timezone: "Asia/Tokyo",
        },
        sent: 0,
        message: "送信対象のレースはありません。",
        races: [],
      });
    }

    const sentResults = [];

    for (const race of targetRaces) {
      const message = buildMessage(race);
      await sendLinePushMessage(message);

      sentResults.push({
        id: race.id,
        raceName: race.raceName,
        date: race.date,
        time: race.time,
        sent: true,
      });
    }

    return Response.json({
      mode: preview ? "preview-send" : "live-send",
      now: {
        date: today,
        time: currentTime,
        timezone: "Asia/Tokyo",
      },
      sent: sentResults.length,
      races: sentResults,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "不明なエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}