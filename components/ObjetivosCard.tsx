"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Objetivo } from "@/lib/types";

export default function ObjetivosCard({
  athleteId,
  initialObjetivos,
  editable,
}: {
  athleteId: string;
  initialObjetivos: Objetivo[];
  editable: boolean;
}) {
  const [items, setItems] = useState<Objetivo[]>(initialObjetivos);

  async function toggleDone(o: Objetivo) {
    const done = !o.done;
    setItems((prev) => prev.map((x) => (x.id === o.id ? { ...x, done } : x)));
    await supabase.from("objetivos").update({ done }).eq("id", o.id);
  }

  async function updateText(o: Objetivo, text: string) {
    setItems((prev) => prev.map((x) => (x.id === o.id ? { ...x, text } : x)));
    await supabase.from("objetivos").update({ text }).eq("id", o.id);
  }

  async function removeObjetivo(o: Objetivo) {
    setItems((prev) => prev.filter((x) => x.id !== o.id));
    await supabase.from("objetivos").delete().eq("id", o.id);
  }

  async function addObjetivo() {
    const position = items.length;
    const { data } = await supabase
      .from("objetivos")
      .insert({ athlete_id: athleteId, text: "Novo objetivo", done: false, position })
      .select()
      .single();
    if (data) setItems((prev) => [...prev, data as Objetivo]);
  }

  return (
    <div className="mb-6">
      <h2 className="text-white font-extrabold text-[17px] mb-3 flex items-center gap-2">
        <span style={{ width: 9, height: 9, background: "#d4af37", display: "inline-block", transform: "rotate(45deg)", borderRadius: 3 }} />
        Objetivos do Ciclo
      </h2>
      <div className="card px-4">
        <ul className="list-none m-0 p-0">
          {items.length === 0 && (
            <li className="py-3 text-sm" style={{ color: "#6c6c72" }}>Nenhum objetivo cadastrado.</li>
          )}
          {items.map((o, i) => (
            <li
              key={o.id}
              className="flex items-center gap-3 py-3"
              style={{
                borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.09)",
                margin: "0 -16px",
                paddingLeft: 16,
                paddingRight: 16,
                background: o.done ? "rgba(212,175,55,0.14)" : "transparent",
              }}
            >
              <button
                onClick={() => toggleDone(o)}
                title={o.done ? "Marcar como não concluído" : "Marcar como conquistado"}
                className="rounded-full flex-shrink-0 flex items-center justify-center font-extrabold"
                style={{
                  width: 24,
                  height: 24,
                  border: `1.5px solid ${o.done ? "#d4af37" : "rgba(255,255,255,0.16)"}`,
                  background: o.done ? "#d4af37" : "transparent",
                  color: o.done ? "#1a1305" : "transparent",
                  fontSize: 13,
                  boxShadow: o.done ? "0 0 0 4px rgba(212,175,55,0.14)" : "none",
                }}
              >
                {o.done ? "✓" : ""}
              </button>
              <input
                value={o.text}
                disabled={!editable}
                onChange={(e) => setItems((prev) => prev.map((x) => (x.id === o.id ? { ...x, text: e.target.value } : x)))}
                onBlur={(e) => updateText(o, e.target.value)}
                className="flex-1 bg-transparent border-none text-[14.5px] font-bold outline-none"
                style={{ color: o.done ? "#d4af37" : "#f2f2f0" }}
              />
              {o.done && <span className="text-sm flex-shrink-0">🏆</span>}
              {editable && (
                <span onClick={() => removeObjetivo(o)} className="text-xs flex-shrink-0 cursor-pointer" style={{ color: "#6c6c72" }}>
                  remover
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      {editable && (
        <button
          onClick={addObjetivo}
          className="w-full mt-2 py-2.5 rounded-xl text-sm font-bold"
          style={{ border: "1.5px dashed rgba(255,255,255,0.16)", color: "#9a9a9f" }}
        >
          + Adicionar objetivo
        </button>
      )}
    </div>
  );
}
