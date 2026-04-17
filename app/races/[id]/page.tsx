"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import races from "../../../data/races.json";

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

export default function RaceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [storedRaces, setStoredRaces] = useState<Race[]>([]);
  const baseRaces = races as Race[];

  useEffect(() => {
    setStoredRaces(getStoredRaces());
  }, []);

  const race = useMemo(() => {
    const allRaces = [...baseRaces, ...storedRaces];
    return allRaces.find((r) => r.id === Number(params.id));
  }, [baseRaces, storedRaces, params.id]);

  const isCustomRace = useMemo(() => {
    return storedRaces.some((storedRace) => storedRace.id === Number(params.id));
  }, [storedRaces, params.id]);

  function handleDeleteRace() {
    if (!race) {
      return;
    }

    const confirmed = window.confirm("このレースを削除しますか？");
    if (!confirmed) {
      return;
    }

    const nextRaces = storedRaces.filter((storedRace) => storedRace.id !== race.id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRaces));
    setStoredRaces(nextRaces);
    router.push("/");
  }

  if (!race) {
    return (
      <main style={{ padding: "24px", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
          レースが見つかりません
        </h1>
        <div style={{ marginTop: "16px" }}>
          <Link href="/">← 一覧に戻る</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "24px",
        }}
      >
        {race.raceName} 詳細
      </h1>

      <div
        style={{
          display: "grid",
          gap: "16px",
          maxWidth: "700px",
        }}
      >
        <section
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
              marginBottom: "12px",
            }}
          >
            レース情報
          </h2>
          <p><strong>ID:</strong> {race.id}</p>
          <p><strong>レース名:</strong> {race.raceName}</p>
          <p><strong>開催場:</strong> {race.course}</p>
          <p><strong>発走時刻:</strong> {race.time}</p>
          <p>
            <strong>状態:</strong>{" "}
            {race.status === "before" ? "開催前" : "結果確定"}
          </p>
        </section>

        <section
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
              marginBottom: "12px",
            }}
          >
            予想
          </h2>
          <p><strong>◎ 本命:</strong> {race.prediction.honmei}</p>
          <p><strong>○ 対抗:</strong> {race.prediction.taiko}</p>
          <p><strong>▲ 単穴:</strong> {race.prediction.tanana}</p>
          <p><strong>見解:</strong> {race.prediction.comment || "なし"}</p>
        </section>

        <section
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
              marginBottom: "12px",
            }}
          >
            結果
          </h2>

          {race.status === "before" ? (
            <p>結果はまだ確定していません。</p>
          ) : (
            <>
              <p><strong>1着:</strong> {race.result.first || "未入力"}</p>
              <p><strong>2着:</strong> {race.result.second || "未入力"}</p>
              <p><strong>3着:</strong> {race.result.third || "未入力"}</p>
              <p>
                <strong>判定:</strong>{" "}
                {race.result.hit ? "的中" : "不的中"}
              </p>
            </>
          )}
        </section>
      </div>

      <div
        style={{
          marginTop: "16px",
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        <Link href="/">← 一覧に戻る</Link>

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
              onClick={handleDeleteRace}
              style={{
                padding: "8px 12px",
                border: "1px solid #cc3333",
                borderRadius: "8px",
                background: "#fff",
                color: "#cc3333",
                cursor: "pointer",
              }}
            >
              このレースを削除する
            </button>
          </>
        )}
      </div>
    </main>
  );
}