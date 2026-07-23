"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { AulaSlot, Pagamento } from "@/lib/types";

const AULA_COLOR: Record<AulaSlot["status"], string> = {
  marcada: "#eab308",
  feita: "#22c55e",
  nao_feita: "#ef4444",
};
const NEXT_AULA_STATUS: Record<AulaSlot["status"], AulaSlot["status"]> = {
  marcada: "feita",
  feita: "nao_feita",
  nao_feita: "marcada",
};

function emptyAulas(): AulaSlot[] {
  return Array.from({ length: 8 }, () => ({ dia: "", status: "marcada" as const }));
}

function getAulas(p: Pagamento): AulaSlot[] {
  return p.aulas && p.aulas.length === 8 ? p.aulas : emptyAulas();
}

export default function PagamentosTable({
  initialPagamentos,
  cycleStart,
  cycleEnd,
  editable,
}: {
  initialPagamentos: Pagamento[];
  cycleStart: string;
  cycleEnd: string;
  editable: boolean;
}) {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>(initialPagamentos);

  async function toggleStatus(p: Pagamento) {
    const status = p.status === "pago" ? "pendente" : "pago";
    setPagamentos((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)));
    await supabase.from("pagamentos").update({ status }).eq("id", p.id);
  }

  async function updateValor(p: Pagamento, valor: string) {
    const num = parseFloat(valor.replace(",", ".")) || 0;
    setPagamentos((prev) => prev.map((x) => (x.id === p.id ? { ...x, valor: num } : x)));
    await supabase.from("pagamentos").update({ valor: num }).eq("id", p.id);
  }

  async function updateMes(p: Pagamento, mes: string) {
    setPagamentos((prev) => prev.map((x) => (x.id === p.id ? { ...x, mes } : x)));
    await supabase.from("pagamentos").update({ mes }).eq("id", p.id);
  }

  async function updateVencimento(p: Pagamento, vencimento: string) {
    const value = vencimento || null;
    setPagamentos((prev) => prev.map((x) => (x.id === p.id ? { ...x, vencimento: value } : x)));
    await supabase.from("pagamentos").update({ vencimento: value }).eq("id", p.id);
  }

  async function persistAulas(p: Pagamento, aulas: AulaSlot[]) {
    setPagamentos((prev) => prev.map((x) => (x.id === p.id ? { ...x, aulas } : x)));
    await supabase.from("pagamentos").update({ aulas }).eq("id", p.id);
  }

  function cycleAula(p: Pagamento, idx: number) {
    if (!editable) return;
    const aulas = getAulas(p).slice();
    aulas[idx] = { ...aulas[idx], status: NEXT_AULA_STATUS[aulas[idx].status] };
    persistAulas(p, aulas);
  }

  function updateAulaDia(p: Pagamento, idx: number, dia: string) {
    const clean = dia.replace(/\D/g, "").slice(0, 2);
    const aulas = getAulas(p).slice();
    aulas[idx] = { ...aulas[idx], dia: clean };
    persistAulas(p, aulas);
  }

  // Ordena por vencimento (cronológico). Pagamentos sem vencimento vão pro final.
  const sortedPagamentos = [...pagamentos].sort((a, b) => {
    if (!a.vencimento) return 1;
    if (!b.vencimento) return -1;
    return a.vencimento.localeCompare(b.vencimento);
  });

  return (
    <div>
      <h2 className="text-white font-extrabold text-[17px] mb-1 flex items-center gap-2">
        <span style={{ width: 9, height: 9, background: "#d4af37", display: "inline-block", transform: "rotate(45deg)", borderRadius: 3 }} />
        Ciclo Anual — Pagamentos
      </h2>
      <p className="text-[13px] mb-3" style={{ color: "#9a9a9f" }}>
        Início: {fmtDate(cycleStart)} · Término: {fmtDate(cycleEnd)} · 12 meses
      </p>

      <div className="card overflow-hidden" style={{ overflowX: "auto" }}>
        <table className="w-full text-[13.5px] border-collapse" style={{ minWidth: 600 }}>
          <thead>
            <tr style={{ background: "#1f2024" }}>
              {["Mês", "Aulas", "Vencimento", "Valor", "Status"].map((h) => (
                <th key={h} className="text-left text-[10px] uppercase font-extrabold px-3 py-2.5" style={{ color: "#6c6c72", borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedPagamentos.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2.5 font-bold" style={{ borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
                  <input
                    defaultValue={p.mes}
                    disabled={!editable}
                    onBlur={(e) => updateMes(p, e.target.value)}
                    className="bg-transparent border-none font-bold w-24"
                    style={{ color: "#f2f2f0" }}
                  />
                </td>
                <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
                  <div className="flex gap-1.5 flex-wrap" style={{ maxWidth: 150 }}>
                    {getAulas(p).map((slot, idx) => (
                      <div key={idx} style={{ width: 26 }}>
                        <div
                          onClick={() => cycleAula(p, idx)}
                          style={{
                            height: 8,
                            borderRadius: 3,
                            background: AULA_COLOR[slot.status],
                            cursor: editable ? "pointer" : "default",
                            marginBottom: 3,
                          }}
                          title="Clique pra alternar: amarelo (marcada) → verde (feita) → vermelho (não feita)"
                        />
                        <input
                          value={slot.dia}
                          disabled={!editable}
                          maxLength={2}
                          inputMode="numeric"
                          onChange={(e) => updateAulaDia(p, idx, e.target.value)}
                          placeholder="—"
                          className="text-center font-extrabold w-full rounded"
                          style={{
                            color: "#f2f2f0",
                            fontSize: 11,
                            background: "#1f2024",
                            border: "1px solid rgba(255,255,255,0.14)",
                            padding: "2px 0",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
                  <input
                    type="date"
                    defaultValue={p.vencimento || ""}
                    disabled={!editable}
                    onBlur={(e) => updateVencimento(p, e.target.value)}
                    className="bg-transparent border-none font-bold"
                    style={{ color: "#f2f2f0", colorScheme: "dark" }}
                  />
                </td>
                <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
                  <input
                    defaultValue={p.valor}
                    disabled={!editable}
                    onBlur={(e) => updateValor(p, e.target.value)}
                    className="bg-transparent border-none font-bold w-16"
                    style={{ color: "#f2f2f0" }}
                  />
                </td>
                <td className="px-3 py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
                  <button onClick={() => editable && toggleStatus(p)} className={`status-pill ${p.status}`} style={{ cursor: editable ? "pointer" : "default" }}>
                    {p.status === "pago" ? "✔ Pago" : "Pendente"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editable && (
        <p className="text-[13px] mt-3" style={{ color: "#9a9a9f" }}>
          Nas aulas: clique no quadrado pra alternar amarelo (marcada) → verde (feita) → vermelho (não feita), e digite o dia no campinho.
        </p>
      )}

      <div className="text-center py-5 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.09)" }}>
        <div className="text-[13px] mb-1" style={{ color: "#9a9a9f" }}>Compromisso, consistência e disciplina são o que constroem resultados.</div>
        <div className="font-extrabold text-[14.5px]" style={{ color: "#d4af37" }}>Estou aqui para te guiar em cada passo!</div>
      </div>
    </div>
  );
}

function fmtDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
