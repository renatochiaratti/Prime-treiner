"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { DAYS, type ExtraBloco, type ExtraExercicio } from "@/lib/types";
import VideoModal from "./VideoModal";

type BlocoComExercicios = ExtraBloco & { extras_exercicios: ExtraExercicio[] };

export default function ExtrasEditor({
  athleteId,
  initialBlocos,
  editable,
}: {
  athleteId: string;
  initialBlocos: BlocoComExercicios[];
  editable: boolean;
}) {
  const [blocos, setBlocos] = useState<BlocoComExercicios[]>(initialBlocos);
  const [day, setDay] = useState<ExtraBloco["dia"]>("seg");
  const [videoEx, setVideoEx] = useState<ExtraExercicio | null>(null);

  const dayBlocos = blocos.filter((b) => b.dia === day);

  async function addBloco() {
    const { data } = await supabase
      .from("extras_blocos")
      .insert({ athlete_id: athleteId, dia: day, titulo: "Novo Bloco", position: dayBlocos.length })
      .select()
      .single();
    if (data) setBlocos((prev) => [...prev, { ...(data as ExtraBloco), extras_exercicios: [] }]);
  }

  async function removeBloco(bloco: BlocoComExercicios) {
    if (!confirm("Remover este bloco inteiro?")) return;
    setBlocos((prev) => prev.filter((b) => b.id !== bloco.id));
    await supabase.from("extras_blocos").delete().eq("id", bloco.id);
  }

  async function updateBlocoField(bloco: BlocoComExercicios, field: "titulo" | "observacao", value: string) {
    setBlocos((prev) => prev.map((b) => (b.id === bloco.id ? { ...b, [field]: value } : b)));
    await supabase.from("extras_blocos").update({ [field]: value }).eq("id", bloco.id);
  }

  async function addExercicio(bloco: BlocoComExercicios) {
    const { data } = await supabase
      .from("extras_exercicios")
      .insert({ bloco_id: bloco.id, descricao: "Novo exercício", position: bloco.extras_exercicios.length })
      .select()
      .single();
    if (data) {
      setBlocos((prev) => prev.map((b) => (b.id === bloco.id ? { ...b, extras_exercicios: [...b.extras_exercicios, data as ExtraExercicio] } : b)));
    }
  }

  async function removeExercicio(bloco: BlocoComExercicios, ex: ExtraExercicio) {
    setBlocos((prev) => prev.map((b) => (b.id === bloco.id ? { ...b, extras_exercicios: b.extras_exercicios.filter((e) => e.id !== ex.id) } : b)));
    await supabase.from("extras_exercicios").delete().eq("id", ex.id);
  }

  async function updateExercicio(bloco: BlocoComExercicios, ex: ExtraExercicio, descricao: string) {
    setBlocos((prev) => prev.map((b) => (b.id === bloco.id ? { ...b, extras_exercicios: b.extras_exercicios.map((e) => (e.id === ex.id ? { ...e, descricao } : e)) } : b)));
    await supabase.from("extras_exercicios").update({ descricao }).eq("id", ex.id);
  }

  async function saveExercicioVideo(ex: ExtraExercicio, url: string) {
    setBlocos((prev) => prev.map((b) => ({ ...b, extras_exercicios: b.extras_exercicios.map((e) => (e.id === ex.id ? { ...e, video_url: url } : e)) })));
    await supabase.from("extras_exercicios").update({ video_url: url }).eq("id", ex.id);
  }

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto mb-3.5 pb-0.5">
        {DAYS.map((d) => {
          const count = blocos.filter((b) => b.dia === d.key).length;
          return (
            <button
              key={d.key}
              onClick={() => setDay(d.key)}
              className="flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-extrabold"
              style={{
                background: day === d.key ? "#ffffff" : "#18191c",
                color: day === d.key ? "#0d0d0d" : "#9a9a9f",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              {d.label}{count ? ` · ${count}` : ""}
            </button>
          );
        })}
      </div>

      {dayBlocos.length === 0 && (
        <div className="text-center py-8 px-4 rounded-2xl text-sm font-bold mb-3.5" style={{ border: "1.5px dashed rgba(255,255,255,0.16)", color: "#6c6c72" }}>
          Nenhum treino extra para {DAYS.find((d) => d.key === day)?.label.toLowerCase()}.{editable ? " Adicione um bloco abaixo." : ""}
        </div>
      )}

      {dayBlocos.map((bloco) => (
        <div key={bloco.id} className="card overflow-hidden mb-3">
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.09)", background: "#0d0d0d" }}>
            <input
              value={bloco.titulo}
              disabled={!editable}
              onChange={(e) => setBlocos((prev) => prev.map((b) => (b.id === bloco.id ? { ...b, titulo: e.target.value } : b)))}
              onBlur={(e) => updateBlocoField(bloco, "titulo", e.target.value)}
              className="flex-1 bg-transparent border-none font-extrabold text-white text-[15px]"
            />
            {editable && (
              <button onClick={() => removeBloco(bloco)} className="text-xs font-bold ml-2" style={{ color: "#6c6c72" }}>
                Remover
              </button>
            )}
          </div>
          <div className="px-4 py-3.5">
            {bloco.extras_exercicios.map((ex) => (
              <div key={ex.id} className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setVideoEx(ex)}
                  title="Vídeo do exercício"
                  className="rounded-lg flex items-center justify-center text-[11px] flex-shrink-0"
                  style={{
                    width: 26, height: 26,
                    border: `1px solid ${ex.video_url ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.16)"}`,
                    background: ex.video_url ? "rgba(212,175,55,0.14)" : "#1f2024",
                    color: ex.video_url ? "#d4af37" : "#6c6c72",
                  }}
                >
                  ▶
                </button>
                <input
                  value={ex.descricao}
                  disabled={!editable}
                  onChange={(e) => setBlocos((prev) => prev.map((b) => (b.id === bloco.id ? { ...b, extras_exercicios: b.extras_exercicios.map((x) => (x.id === ex.id ? { ...x, descricao: e.target.value } : x)) } : b)))}
                  onBlur={(e) => updateExercicio(bloco, ex, e.target.value)}
                  className="flex-1 bg-transparent border-none text-[13.5px] font-semibold"
                  style={{ color: "#f2f2f0" }}
                />
                {editable && (
                  <span onClick={() => removeExercicio(bloco, ex)} className="text-xs cursor-pointer flex-shrink-0" style={{ color: "#6c6c72" }}>✕</span>
                )}
              </div>
            ))}
            {editable && (
              <button onClick={() => addExercicio(bloco)} className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ border: "1.5px dashed rgba(255,255,255,0.16)", color: "#9a9a9f" }}>
                + Adicionar exercício
              </button>
            )}
            <div className="mt-2 px-3 py-2.5 rounded-lg text-xs" style={{ border: "1.5px dashed rgba(255,255,255,0.16)", background: "#0d0d0d", color: "#9a9a9f" }}>
              {editable ? (
                <textarea
                  defaultValue={bloco.observacao}
                  placeholder="Observação para o aluno..."
                  onBlur={(e) => updateBlocoField(bloco, "observacao", e.target.value)}
                  className="w-full bg-transparent border-none text-xs"
                  style={{ minHeight: 56, color: "#9a9a9f" }}
                />
              ) : (
                bloco.observacao
              )}
            </div>
          </div>
        </div>
      ))}

      {editable && (
        <button onClick={addBloco} className="w-full py-3 rounded-xl text-sm font-bold" style={{ border: "1.5px dashed rgba(255,255,255,0.16)", color: "#9a9a9f" }}>
          + Adicionar bloco em {DAYS.find((d) => d.key === day)?.label}
        </button>
      )}

      {videoEx && (
        <VideoModal
          title={videoEx.descricao}
          initialUrl={videoEx.video_url}
          editable={editable}
          onClose={() => setVideoEx(null)}
          onSave={(url) => saveExercicioVideo(videoEx, url)}
        />
      )}
    </div>
  );
}
