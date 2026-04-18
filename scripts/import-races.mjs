import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const inputPath = path.join(projectRoot, "data", "source-races.csv");
const outputPath = path.join(projectRoot, "data", "races.json");

function normalizeCourse(course) {
  const map = {
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

function createRaceId(race) {
  return `${race.date}-${normalizeCourse(race.course)}-${race.raceNumber.toLowerCase()}`;
}

function parseCsvLine(line) {
  const result = [];
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

function parseCsv(text) {
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

    return headers.reduce((acc, header, headerIndex) => {
      acc[header] = values[headerIndex];
      return acc;
    }, {});
  });
}

function normalizeDate(date) {
  const trimmed = date.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{4}\/\d{2}\/\d{2}$/.test(trimmed)) {
    return trimmed.replaceAll("/", "-");
  }

  throw new Error(`date の形式が不正です: ${date}`);
}

function normalizeTime(time) {
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

function normalizeRaceNumber(raceNumber) {
  const trimmed = raceNumber.trim().toUpperCase();

  if (/^\d{1,2}R$/.test(trimmed)) {
    return trimmed;
  }

  if (/^\d{1,2}$/.test(trimmed)) {
    return `${trimmed}R`;
  }

  throw new Error(`raceNumber の形式が不正です: ${raceNumber}`);
}

function transformRow(row) {
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

  const race = {
    id: "",
    date,
    time,
    course,
    raceNumber,
    raceName,
  };

  if (horse) {
    race.horse = horse;
  }

  if (reason) {
    race.reason = reason;
  }

  race.id = createRaceId(race);
  return race;
}

function main() {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`入力CSVが見つかりません: ${inputPath}`);
  }

  const csvText = fs.readFileSync(inputPath, "utf8");
  const rows = parseCsv(csvText);
  const races = rows.map(transformRow);

  fs.writeFileSync(outputPath, JSON.stringify(races, null, 2) + "\n", "utf8");

  console.log(`完了: ${races.length}件のレースを ${outputPath} に出力しました。`);
}

main();