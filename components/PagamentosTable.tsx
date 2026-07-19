"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Pagamento } from "@/lib/types";

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
    await supabase.from("pagamentos").update({ valor: num }).eq("id", p.id);
  }

  return (
    <div>
      <h2 className="text-white font-extrabold text-[17px] mb-1 flex items-center gap-2">
        <span style={{ width: 9, height: 9, background: "#d4af37", display: "inline-block", transform: "rotate(45deg)", borderRadius: 3 }} />
        Ciclo Anual — Pagamentos
      </h2>
      <p className="text-[13px] mb-3" style={{ color: "#9a9a9f" }}>
        Início: {fmtDate(cycleStart)} · Término: {fmtDate(cycleEnd)} · 12 meses
      </p>

      <div className="card overflow-hidden">
        <table className="w-full text-[13.5px] border-collapse">
          <thead>
            <tr style={{ background: "#1f2024" }}>
              {["Nº", "Mês", "Valor", "Status"].map((h) => (
                <th key={h} className="text-left text-[10px] uppercase font-extrabold px-3 py-2.5" style={{ color: "#6c6c72", borderBottom: "1px solid rgba(255,255,255,0.09)" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagamentos.map((p, i) => (
              <tr key={p.id}>
                <td className="px-3 py-2.5 font-bold" style={{ borderBottom: "1px solid rgba(255,255,255,0.09)" }}>{i + 1}º</td>
                <td className="px-3 py-2.5 font-bold" style={{ borderBottom: "1px solid rgba(255,255,255,0.09)" }}>{p.mes}</td>
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
