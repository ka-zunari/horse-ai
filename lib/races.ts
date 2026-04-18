import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import type { Race } from "./types";

dotenv.config({ path: ".env.local" });

const projectRoot = process.cwd();
const sourceCsvPath = path.join(projectRoot, "data", "source-races.csv");
const racesJsonPath = path.join(projectRoot, "data", "races.json");

function normalizeCourse(course: string) {
  const map: Record<string, string> = {
    中山: "nakayama",
    東京: "tokyo",
    阪神: "hanshin",
    京都: "kyoto",
    中京: "chukyo",
    新潟: "niigata",
    福島: "fukushima",
    小倉: "kokura",
    札幌: "sapporo",
    函館: "hakodate",
  };

  return map[course] ?? course.toLowerCase().replace(/\s+/g, "-");
}

function createRaceId(race: Omit<Race, "id">) {
  return `${race.date}-${normalizeCourse(race.course)}-${race.raceNumber.toLowerCase()}`;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result.map((value) => value.trim());
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);

    if (values.length !== headers.length) {
      throw new Error(
        `CSV ${index + 2}行目の列数が不正です。header=${headers.length}, row=${values.length}`
      );
    }

    return headers.reduce<Record<string, string>>((acc, header, headerIndex) => {
      acc[header] = values[headerIndex];
      return acc;
    }, {});
  });
}

function normalizeDate(date: string): string {
  const trimmed = date.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
    return trimmed.replaceAll("/", "-");
  }

  throw new Error(`date の形式が不正です: ${date}`);
}

function normalizeTime(time: string): string {
  const trimmed = time.trim();

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{1}:\d{2}$/.test(trimmed)) {
    const [hour, minute] = trimmed.split(":");
    return `${hour.padStart(2, "0")}:${minute}`;
  }

  throw new Error(`time の形式が不正です: ${time}`);
}

function normalizeRaceNumber(raceNumber: string): string {
  const trimmed = raceNumber.trim().toUpperCase();

  if (/^\d{1,2}R$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{1,2}$/.test(trimmed)) {
    return `${trimmed}R`;
  }

  throw new Error(`raceNumber の形式が不正です: ${raceNumber}`);
}

function transformRow(row: Record<string, string>): Race {
  const date = normalizeDate(row.date ?? "");
  const time = normalizeTime(row.time ?? "");
  const course = (row.course ?? "").trim();
  const raceNumber = normalizeRaceNumber(row.raceNumber ?? "");
  const raceName = (row.raceName ?? "").trim();
  const horse = (row.horse ?? "").trim();
  const reason = (row.reason ?? "").trim();

  if (!course) {
    throw new Error("course が空です。");
  }

  if (!raceName) {
    throw new Error("raceName が空です。");
  }

  const baseRace: Omit<Race, "id"> = {
    date,
    time,
    course,
    raceNumber,
    raceName,
  };

  if (horse) {
    baseRace.horse = horse;
  }

  if (reason) {
    baseRace.reason = reason;
  }

  return {
    id: createRaceId(baseRace),
    ...baseRace,
  };
}

export async function fetchSourceCsv(): Promise<string> {
  const csvUrl = process.env.RACE_SOURCE_CSV_URL;

  if (!csvUrl) {
    throw new Error("RACE_SOURCE_CSV_URL が設定されていません。");
  }

  const response = await fetch(csvUrl, {
    method: "GET",
    headers: {
      Accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`CSV取得に失敗しました: ${response.status} ${body}`);
  }

  const text = await response.text();

  if (!text.trim()) {
    throw new Error("取得したCSVが空です。");
  }

  fs.writeFileSync(sourceCsvPath, text, "utf8");
  return text;
}

export function parseRacesFromCsv(csvText: string): Race[] {
  const rows = parseCsv(csvText);
  return rows.map(transformRow);
}

export function saveRacesJson(races: Race[]): void {
  fs.writeFileSync(racesJsonPath, JSON.stringify(races, null, 2) + "\n", "utf8");
}

export async function syncRacesFromCsv(): Promise<Race[]> {
  const csvText = await fetchSourceCsv();
  const races = parseRacesFromCsv(csvText);
  saveRacesJson(races);
  return races;
}

export function getLocalRaces(): Race[] {
  if (!fs.existsSync(racesJsonPath)) {
    return [];
  }

  const raw = fs.readFileSync(racesJsonPath, "utf8");
  return JSON.parse(raw) as Race[];
}