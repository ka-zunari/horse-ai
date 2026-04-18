"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Race = {
  id: string;
  date: string;
  time: string;
  course: string;
  raceNumber: string;
  raceName: string;
  horse: string;
  reason?: string;
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

function createRaceId(): string {
  return `custom-${Date.now()}`;
}

export default function NewRacePage() {
  const router = useRouter();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [course, setCourse] = useState("");
  const [raceNumber, setRaceNumber] = useState("");
  const [raceName, setRaceName] = useState("");
  const [horse, setHorse] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newRace: Race = {
      id: createRaceId(),
      date,
      time,
      course,
      raceNumber,
      raceName,
      horse,
      reason: reason || undefined,
    };

    const storedRaces = getStoredRaces();
    const nextRaces = [...storedRaces, newRace];

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRaces));
    router.push("/");
  }

  return (
    <main style={{ padding: "24px", fontFamily: "sans-serif", maxWidth: "720px" }}>
      <div style={{ marginBottom: "24px" }}>
        <Link
          href="/"
          style={{
            textDecoration: "none",
            color: "#333",
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "8px 12px",
            display: "inline-block",
          }}
        >
          ← 一覧へ戻る
        </Link>
      </div>

      <h1 style={{ fontSize: "28px", marginBottom: "24px" }}>新しいレースを追加</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
        <label style={{ display: "grid", gap: "8px" }}>
          <span>開催日</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
            style={{
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <span>発走時刻</span>
          <input
            type="time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
            style={{
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <span>開催場</span>
          <input
            type="text"
            value={course}
            onChange={(event) => setCourse(event.target.value)}
            placeholder="例: 中山"
            required
            style={{
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <span>レース番号</span>
          <input
            type="text"
            value={raceNumber}
            onChange={(event) => setRaceNumber(event.target.value)}
            placeholder="例: 11R"
            required
            style={{
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <span>レース名</span>
          <input
            type="text"
            value={raceName}
            onChange={(event) => setRaceName(event.target.value)}
            placeholder="例: 皐月賞"
            required
            style={{
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <span>本命馬</span>
          <input
            type="text"
            value={horse}
            onChange={(event) => setHorse(event.target.value)}
            placeholder="例: サンプルホース"
            required
            style={{
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: "8px" }}>
          <span>理由</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="予想理由を入力"
            rows={5}
            style={{
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              resize: "vertical",
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            padding: "12px 16px",
            border: "none",
            borderRadius: "8px",
            background: "#111",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          保存する
        </button>
      </form>
    </main>
  );
}