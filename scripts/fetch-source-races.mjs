import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config({ path: ".env.local" });

const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, "data", "source-races.csv");

const csvUrl = process.env.RACE_SOURCE_CSV_URL;

async function main() {
  if (!csvUrl) {
    throw new Error("RACE_SOURCE_CSV_URL が設定されていません。");
  }

  const response = await fetch(csvUrl, {
    method: "GET",
    headers: {
      Accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`CSV取得に失敗しました: ${response.status} ${body}`);
  }

  const text = await response.text();

  if (!text.trim()) {
    throw new Error("取得したCSVが空です。");
  }

  fs.writeFileSync(outputPath, text, "utf8");
  console.log(`CSV取得完了: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});