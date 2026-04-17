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
    now,
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const preview = searchParams.get("preview") === "1";

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

  const response = {
    mode: preview ? "preview" : "live",
    now: {
      date: today,
      time: currentTime,
      timezone: "Asia/Tokyo",
    },
    count: targetRaces.length,
    races: targetRaces.map((race) => ({
      id: race.id,
      raceName: race.raceName,
      course: race.course,
      date: race.date,
      time: race.time,
      notifyTimes: race.notifyTimes,
      prediction: race.prediction,
      message: buildMessage(race),
    })),
  };

  return Response.json(response);
}