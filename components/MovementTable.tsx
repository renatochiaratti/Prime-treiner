"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { progressPct } from "@/lib/movementLibrary";
import type { MovementRow } from "@/lib/types";
import VideoModal from "./VideoModal";

export default function MovementTable({
  athleteId,
  categoria,
  initialRows,
  editable,
}: {
  athleteId: string;
  categoria: MovementRow["categoria"];
  initialRows: MovementRow[];
  editable: boolean;
}) {
  const [rows, setRows] = useState<MovementRow[]>(initialRows);
  const [videoRow, setVideoRow] = useState<MovementRow | null>(null);

  async function updateField(row: MovementRow, field: "movimento" | "start_val" | "atual" | "meta", value: string) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, [field]: value } : r)));
    await supabase.from("movement_rows").update({ [field]: value }).eq("id", row.id);
  }

  async function saveVideo(row: MovementRow, url: string) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, video_url: url } : r)));
    await supabase.from("movement_rows").update({ video_url: url }).eq("id", row.id);
  }

  async function addRow(grupo: "girls" | "heroes" | null = null) {
    const position = rows.length;
    const { data } = await supabase
      .from("movement_rows")
      .insert({ athlete_id: athleteId, categoria, grupo, movimento: "Novo movimento", position })
      .select()
      .single();
    if (data) setRows((prev) => [...prev, data as MovementRow]);
  }

  function Row({ row }: { row: MovementRow }) {
    const pct = progressPct(row.start_val, row.atual, row.meta);
    const done = pct !== null && pct >= 100;
    return (
      <div
        className="grid items-center gap-1.5 px-3 py-2.5 text-[13.5px]"
        style={{ gridTemplateColumns: "minmax(90px,1fr) 28px 46px 46px 46px minmax(70px,90px)", borderTop: "1px solid rgba(255,255,255,0.09)" }}
      >
        <input
          value={row.movimento}
          disabled={!editable}
          onChange={(e) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, movimento: e.target.value } : r)))}
          onBlur={(e) => updateField(row, "movimento", e.target.value)}
          className="bg-transparent border-none font-bold text-[13.5px]"
          style={{ color: "#f2f2f0" }}
        />
        <button
          onClick={() => setVideoRow(row)}
          title="Vídeo do movimento"
          className="rounded-lg flex items-center justify-center text-[11px]"
          style={{
            width: 26, height: 26,
            border: `1px solid ${row.video_url ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.16)"}`,
            background: row.video_url ? "rgba(212,175,55,0.14)" : "#1f2024",
            color: row.video_url ? "#d4af37" : "#6c6c72",
          }}
        >
          ▶
        </button>
        {(["start_val", "atual", "meta"] as const).map((f) => (
          <input
            key={f}
            value={row[f] || ""}
            disabled={!editable}
            placeholder="—"
            onChange={(e) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, [f]: e.target.value } : r)))}
            onBlur={(e) => updateField(row, f, e.target.value)}
            className="bg-transparent border-none text-center font-mono font-bold text-[13.5px]"
            style={{ color: "#f2f2f0" }}
          />
        ))}
        {pct !== null ? (
          <div className="flex items-center gap-1">
            <div className={`mark-bar flex-1 ${done ? "done" : ""}`}><i style={{ width: `${pct}%` }} /></div>
            {done && <span style={{ color: "#22c55e", fontSize: 12 }}>✔</span>}
          </div>
        ) : (
          <div className="text-center font-bold" style={{ fontSize: 10.5, color: "#6c6c72" }}>—</div>
        )}
      </div>
    );
  }

  const HeaderRow = ({ label }: { label: string }) => (
    <div
      className="grid items-center gap-1.5 px-3 pt-3 pb-1.5 text-[10px] uppercase font-extrabold"
      style={{ gridTemplateColumns: "minmax(90px,1fr) 28px 46px 46px 46px minmax(70px,90px)", color: "#6c6c72", background: "#1f2024", borderBottom: "1px solid rgba(255,255,255,0.09)" }}
    >
      <span>{label}</span><span /><span className="text-center">Start</span><span className="text-center">Atual</span><span className="text-center">Meta</span><span className="text-center">Progresso</span>
    </div>
  );

  if (categoria === "benchmarks") {
    const girls = rows.filter((r) => r.grupo !== "heroes");
    const heroes = rows.filter((r) => r.grupo === "heroes");
    return (
      <div>
        <p className="text-[13px] mb-3" style={{ color: "#9a9a9f" }}>
          As 27 Girls oficiais e os Heróis mais tradicionais do CrossFit — preencha conforme forem testados no ciclo.
        </p>
        <div className="card overflow-hidden mb-3">
          <HeaderRow label="🏅 As Girls" />
          {girls.map((r) => <Row key={r.id} row={r} />)}
          {editable && (
            <button onClick={() => addRow("girls")} className="m-3 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ border: "1.5px dashed rgba(255,255,255,0.16)", color: "#9a9a9f" }}>
              + Adicionar Girl
            </button>
          )}
        </div>
        <div className="card overflow-hidden">
          <HeaderRow label="🎖️ Os Heróis" />
          {heroes.map((r) => <Row key={r.id} row={r} />)}
          {editable && (
            <button onClick={() => addRow("heroes")} className="m-3 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ border: "1.5px dashed rgba(255,255,255,0.16)", color: "#9a9a9f" }}>
              + Adicionar Herói
            </button>
          )}
        </div>
        {videoRow && (
          <VideoModal title={videoRow.movimento} initialUrl={videoRow.video_url} editable={editable} onClose={() => setVideoRow(null)} onSave={(url) => saveVideo(videoRow, url)} />
        )}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <HeaderRow label="Movimento" />
      {rows.map((r) => <Row key={r.id} row={r} />)}
      {editable && (
        <button onClick={() => addRow(null)} className="m-3 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ border: "1.5px dashed rgba(255,255,255,0.16)", color: "#9a9a9f" }}>
          + Adicionar movimento
        </button>
      )}
      {videoRow && (
        <VideoModal title={videoRow.movimento} initialUrl={videoRow.video_url} editable={editable} onClose={() => setVideoRow(null)} onSave={(url) => saveVideo(videoRow, url)} />
      )}
    </div>
  );
}
