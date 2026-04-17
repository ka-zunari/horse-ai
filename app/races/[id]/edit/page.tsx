"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import races from "../../../../data/races.json";

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

type RaceForm = {
  id: number;
  raceName: string;
  course: string;
  time: string;
  status: "before" | "finished";
  honmei: string;
  taiko: string;
  tanana: string;
  comment: string;
  first: string;
  second: string;
  third: string;
  hit: boolean;
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

function toForm(race: Race): RaceForm {
  return {
    id: race.id,
    raceName: race.raceName,
    course: race.course,
    time: race.time,
    status: race.status,
    honmei: race.prediction.honmei,
    taiko: race.prediction.taiko,
    tanana: race.prediction.tanana,
    comment: race.prediction.comment,
    first: race.result.first,
    second: race.result.second,
    third: race.result.third,
    hit: race.result.hit,
  };
}

export default function EditRacePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState<RaceForm | null>(null);
  const [isCustomRace, setIsCustomRace] = useState(false);
  const baseRaces = races as Race[];

  useEffect(() => {
    const storedRaces = getStoredRaces();
    const customRace = storedRaces.find((race) => race.id === Number(params.id));

    if (customRace) {
      setForm(toForm(customRace));
      setIsCustomRace(true);
      return;
    }

    const baseRace = baseRaces.find((race) => race.id === Number(params.id));
    if (baseRace) {
      setForm(toForm(baseRace));
      setIsCustomRace(false);
      return;
    }

    setForm(null);
    setIsCustomRace(false);
  }, [params.id, baseRaces]);

  const preview = useMemo(() => {
    if (!form) {
      return null;
    }

    return {
      raceName: form.raceName || "未入力",
      course: form.course || "未入力",
      time: form.time || "未入力",
      status: form.status,
      prediction: {
        honmei: form.honmei || "未入力",
        taiko: form.taiko || "未入力",
        tanana: form.tanana || "未入力",
        comment: form.comment || "未入力",
      },
      result:
        form.status === "finished"
          ? {
              first: form.first || "未入力",
              second: form.second || "未入力",
              third: form.third || "未入力",
              hit: form.hit,
            }
          : null,
    };
  }, [form]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    if (!form) {
      return;
    }

    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [name]: checked,
        };
      });
      return;
    }

    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: value,
      };
    });
  }

  function handleSave() {
    if (!form) {
      return;
    }

    if (!isCustomRace) {
      alert("初期データは編集できません。追加したレースのみ編集できます。");
      return;
    }

    if (!form.raceName.trim()) {
      alert("レース名を入力してください。");
      return;
    }

    if (!form.course.trim()) {
      alert("開催場を入力してください。");
      return;
    }

    if (!form.time.trim()) {
      alert("発走時刻を入力してください。");
      return;
    }

    if (!form.honmei.trim()) {
      alert("◎ 本命を入力してください。");
      return;
    }

    const updatedRace: Race = {
      id: form.id,
      raceName: form.raceName.trim(),
      course: form.course.trim(),
      time: form.time.trim(),
      status: form.status,
      prediction: {
        honmei: form.honmei.trim(),
        taiko: form.taiko.trim(),
        tanana: form.tanana.trim(),
        comment: form.comment.trim(),
      },
      result: {
        first: form.status === "finished" ? form.first.trim() : "",
        second: form.status === "finished" ? form.second.trim() : "",
        third: form.status === "finished" ? form.third.trim() : "",
        hit: form.status === "finished" ? form.hit : false,
      },
    };

    const storedRaces = getStoredRaces();
    const nextRaces = storedRaces.map((race) =>
      race.id === updatedRace.id ? updatedRace : race
    );

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRaces));
    router.push(`/races/${updatedRace.id}`);
  }

  if (form === null) {
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
      <div style={{ marginBottom: "20px" }}>
        <Link href={`/races/${form.id}`} style={{ textDecoration: "none" }}>
          ← 詳細に戻る
        </Link>
      </div>

      <h1
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "24px",
        }}
      >
        レースを編集
      </h1>

      {!isCustomRace && (
        <div
          style={{
            marginBottom: "16px",
            padding: "12px",
            border: "1px solid #f0c36d",
            borderRadius: "8px",
            background: "#fff8e6",
          }}
        >
          初期データは編集できません。追加したレースのみ編集できます。
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          alignItems: "start",
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
              marginBottom: "16px",
            }}
          >
            編集フォーム
          </h2>

          <form>
            <div style={{ display: "grid", gap: "12px" }}>
              <div>
                <label htmlFor="raceName" style={{ display: "block", marginBottom: "6px" }}>
                  レース名
                </label>
                <input
                  id="raceName"
                  name="raceName"
                  type="text"
                  value={form.raceName}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isCustomRace}
                />
              </div>

              <div>
                <label htmlFor="course" style={{ display: "block", marginBottom: "6px" }}>
                  開催場
                </label>
                <input
                  id="course"
                  name="course"
                  type="text"
                  value={form.course}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isCustomRace}
                />
              </div>

              <div>
                <label htmlFor="time" style={{ display: "block", marginBottom: "6px" }}>
                  発走時刻
                </label>
                <input
                  id="time"
                  name="time"
                  type="text"
                  value={form.time}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isCustomRace}
                />
              </div>

              <div>
                <label htmlFor="status" style={{ display: "block", marginBottom: "6px" }}>
                  状態
                </label>
                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isCustomRace}
                >
                  <option value="before">開催前</option>
                  <option value="finished">結果確定</option>
                </select>
              </div>

              <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "8px 0" }} />

              <div>
                <label htmlFor="honmei" style={{ display: "block", marginBottom: "6px" }}>
                  ◎ 本命
                </label>
                <input
                  id="honmei"
                  name="honmei"
                  type="text"
                  value={form.honmei}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isCustomRace}
                />
              </div>

              <div>
                <label htmlFor="taiko" style={{ display: "block", marginBottom: "6px" }}>
                  ○ 対抗
                </label>
                <input
                  id="taiko"
                  name="taiko"
                  type="text"
                  value={form.taiko}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isCustomRace}
                />
              </div>

              <div>
                <label htmlFor="tanana" style={{ display: "block", marginBottom: "6px" }}>
                  ▲ 単穴
                </label>
                <input
                  id="tanana"
                  name="tanana"
                  type="text"
                  value={form.tanana}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={!isCustomRace}
                />
              </div>

              <div>
                <label htmlFor="comment" style={{ display: "block", marginBottom: "6px" }}>
                  見解
                </label>
                <textarea
                  id="comment"
                  name="comment"
                  rows={4}
                  value={form.comment}
                  onChange={handleChange}
                  style={textareaStyle}
                  disabled={!isCustomRace}
                />
              </div>

              {form.status === "finished" && (
                <>
                  <hr style={{ border: 0, borderTop: "1px solid #eee", margin: "8px 0" }} />

                  <div>
                    <label htmlFor="first" style={{ display: "block", marginBottom: "6px" }}>
                      1着
                    </label>
                    <input
                      id="first"
                      name="first"
                      type="text"
                      value={form.first}
                      onChange={handleChange}
                      style={inputStyle}
                      disabled={!isCustomRace}
                    />
                  </div>

                  <div>
                    <label htmlFor="second" style={{ display: "block", marginBottom: "6px" }}>
                      2着
                    </label>
                    <input
                      id="second"
                      name="second"
                      type="text"
                      value={form.second}
                      onChange={handleChange}
                      style={inputStyle}
                      disabled={!isCustomRace}
                    />
                  </div>

                  <div>
                    <label htmlFor="third" style={{ display: "block", marginBottom: "6px" }}>
                      3着
                    </label>
                    <input
                      id="third"
                      name="third"
                      type="text"
                      value={form.third}
                      onChange={handleChange}
                      style={inputStyle}
                      disabled={!isCustomRace}
                    />
                  </div>

                  <label
                    htmlFor="hit"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      opacity: !isCustomRace ? 0.6 : 1,
                    }}
                  >
                    <input
                      id="hit"
                      name="hit"
                      type="checkbox"
                      checked={form.hit}
                      onChange={handleChange}
                      disabled={!isCustomRace}
                    />
                    的中した
                  </label>
                </>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={handleSave}
                  style={primaryButtonStyle}
                  disabled={!isCustomRace}
                >
                  保存する
                </button>
              </div>
            </div>
          </form>
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
              marginBottom: "16px",
            }}
          >
            編集プレビュー
          </h2>

          {preview && (
            <div style={{ display: "grid", gap: "16px" }}>
              <section>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>
                  レース情報
                </h3>
                <p><strong>レース名:</strong> {preview.raceName}</p>
                <p><strong>開催場:</strong> {preview.course}</p>
                <p><strong>発走時刻:</strong> {preview.time}</p>
                <p><strong>状態:</strong> {preview.status === "before" ? "開催前" : "結果確定"}</p>
              </section>

              <section>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>
                  予想
                </h3>
                <p><strong>◎ 本命:</strong> {preview.prediction.honmei}</p>
                <p><strong>○ 対抗:</strong> {preview.prediction.taiko}</p>
                <p><strong>▲ 単穴:</strong> {preview.prediction.tanana}</p>
                <p><strong>見解:</strong> {preview.prediction.comment}</p>
              </section>

              <section>
                <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "8px" }}>
                  結果
                </h3>

                {preview.status === "before" || !preview.result ? (
                  <p>開催前のため、結果はまだありません。</p>
                ) : (
                  <>
                    <p><strong>1着:</strong> {preview.result.first}</p>
                    <p><strong>2着:</strong> {preview.result.second}</p>
                    <p><strong>3着:</strong> {preview.result.third}</p>
                    <p><strong>判定:</strong> {preview.result.hit ? "的中" : "不的中"}</p>
                  </>
                )}
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  fontSize: "14px",
  boxSizing: "border-box",
  resize: "vertical",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #333",
  borderRadius: "8px",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};