import races from "../../../data/races.json";

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
};

function getJapanNow() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return {
    today: `${get("year")}-${get("month")}-${get("day")}`,
    currentTime: `${get("hour")}:${get("minute")}`,
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

// ★ここが追加ポイント
const sentMap = new Set<string>();

function isAlreadySent(key: string) {
  return sentMap.has(key);
}

function markAsSent(key: string) {
  sentMap.add(key);
}

async function sendLinePushMessage(message: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
  const to = process.env.LINE_TO_USER_ID!;

  await fetch("https://api.line.me/v2/bot/message/push", {
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
}

export async function GET() {
  const { today, currentTime } = getJapanNow();

  const raceList = races as Race[];

  const targets = raceList.filter(
    (r) =>
      r.status === "before" &&
      r.date === today &&
      r.notifyTimes.includes(currentTime)
  );

  const results = [];

  for (const race of targets) {
    const key = `${race.id}-${currentTime}`;

    // ★重複防止
    if (isAlreadySent(key)) {
      continue;
    }

    const message = buildMessage(race);
    await sendLinePushMessage(message);

    markAsSent(key);

    results.push({
      id: race.id,
      sent: true,
    });
  }

  return Response.json({
    sent: results.length,
    time: currentTime,
  });
}