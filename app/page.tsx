"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import races from "../data/races.json";

type Race = {
  id: number;
  raceName: string;
  course: string;
  time: string;
  status: "before" | "finished";
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

const STORAGE_KEY = "custom_races";

function getStoredRaces(): Race[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Race[];
  } catch {
    return [];
  }
}

export default function Home() {
  const baseRaces = races as Race[];
  const [storedRaces, setStoredRaces] = useState<Race[]>([]);

  useEffect(() => {
    setStoredRaces(getStoredRaces());
  }, []);

  const raceList = useMemo(() => {
    return [...baseRaces, ...storedRaces].sort((a, b) => a.id - b.id);
  }, [baseRaces, storedRaces]);

  function handleDeleteRace(id: number) {
    const confirmed = window.confirm("このレースを削除しますか？");
    if (!confirmed) {
      return;
    }

    const nextRaces = storedRaces.filter((race) => race.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRaces));
    setStoredRaces(nextRaces);
  }

  return (
    <main style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "bold",
            margin: 0,
          }}
        >
          競馬レース一覧
        </h1>

        <Link
          href="/races/new"
          style={{
            display: "inline-block",
            padding: "10px 14px",
            border: "1px solid #333",
            borderRadius: "8px",
            textDecoration: "none",
            color: "#111",
            fontWeight: "bold",
          }}
        >
          ＋ 新しいレースを追加
        </Link>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        {raceList.map((race) => {
          const isCustomRace = storedRaces.some((storedRace) => storedRace.id === race.id);

          return (
            <div
              key={race.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                }}
              >
                {race.raceName}
              </h2>

              <p>開催場: {race.course}</p>
              <p>発走時刻: {race.time}</p>
              <p>本命: ◎ {race.prediction.honmei}</p>
              <p>状態: {race.status === "before" ? "開催前" : "結果確定"}</p>
              <p>
                判定:{" "}
                {race.status === "finished"
                  ? race.result.hit
                    ? "的中"
                    : "不的中"
                  : "未確定"}
              </p>

              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href={`/races/${race.id}`}
                  style={{
                    display: "inline-block",
                    padding: "8px 12px",
                    border: "1px solid #333",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: "#111",
                  }}
                >
                  詳細を見る
                </Link>

                {isCustomRace && (
                  <>
                    <Link
                      href={`/races/${race.id}/edit`}
                      style={{
                        display: "inline-block",
                        padding: "8px 12px",
                        border: "1px solid #333",
                        borderRadius: "8px",
                        textDecoration: "none",
                        color: "#111",
                      }}
                    >
                      編集する
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDeleteRace(race.id)}
                      style={{
                        display: "inline-block",
                        padding: "8px 12px",
                        border: "1px solid #cc3333",
                        borderRadius: "8px",
                        background: "#fff",
                        color: "#cc3333",
                        cursor: "pointer",
                      }}
                    >
                      削除する
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}