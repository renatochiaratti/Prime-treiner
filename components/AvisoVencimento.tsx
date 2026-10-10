"use client";

import { useEffect, useState } from "react";
import type { Pagamento } from "@/lib/types";

const DIAS_ANTES = 3;

function hojeKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Converte "YYYY-MM-DD" em data local (meia-noite), sem problema de fuso.
function parseLocal(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function fmtValor(v: number) {
  return v > 0 ? ` · ${v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 })}` : "";
}

function textoAluno(dias: number) {
  if (dias > 1) return `Heeeey, passando pra lembrar que seu plano vence em ${dias} dias 💛`;
  if (dias === 1) return "Heeeey, passando pra lembrar que seu plano vence amanhã 💛";
  if (dias === 0) return "Heeeey, passando pra lembrar que seu plano vence hoje 💛";
  const atraso = Math.abs(dias);
  return `Olá, seu plano venceu há ${atraso} ${atraso === 1 ? "dia" : "dias"}. 💛`;
}

function textoCoach(nome: string, dias: number) {
  const quem = nome ? `O plano de ${nome}` : "O plano do aluno";
  if (dias > 1) return `${quem} vence em ${dias} dias. Hora de combinar o pagamento.`;
  if (dias === 1) return `${quem} vence amanhã. Hora de combinar o pagamento.`;
  if (dias === 0) return `${quem} vence hoje. Hora de receber.`;
  const atraso = Math.abs(dias);
  return `${quem} venceu há ${atraso} ${atraso === 1 ? "dia" : "dias"}. Hora de cobrar.`;
}

export default function AvisoVencimento({
  pagamentos,
  modo,
  athleteName,
}: {
  pagamentos: Pagamento[];
  modo: "aluno" | "coach";
  athleteName?: string;
}) {
  // Atualiza sozinho quando vira o dia, mesmo com a página aberta.
  const [dia, setDia] = useState(hojeKey());
  useEffect(() => {
    const t = setInterval(() => setDia(hojeKey()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Próximo pagamento pendente (o de vencimento mais antigo que ainda não foi pago).
  const proximo = pagamentos
    .filter((p) => p.status === "pendente" && p.vencimento)
    .sort((a, b) => (a.vencimento as string).localeCompare(b.vencimento as string))[0];

  if (!proximo || !proximo.vencimento) return null;

  const venc = parseLocal(proximo.vencimento);
  const dias = Math.round((venc.getTime() - hoje.getTime()) / 86400000);

  if (dias > DIAS_ANTES) return null;

  const texto = modo === "aluno" ? textoAluno(dias) : textoCoach(athleteName || "", dias);
  const atrasado = dias < 0;

  return (
    <div
      key={dia}
      className="w-full rounded-xl text-center mb-3"
      style={{
        padding: "8px 12px",
        background: atrasado ? "rgba(239,68,68,0.10)" : "rgba(212,175,55,0.10)",
        border: `1px solid ${atrasado ? "rgba(239,68,68,0.45)" : "rgba(212,175,55,0.45)"}`,
      }}
    >
      <div style={{ color: "#f2f2f0", fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>{texto}</div>
      <div style={{ color: atrasado ? "#ef4444" : "#d4af37", fontSize: 11, marginTop: 2 }}>
        Vencimento: {fmtDate(proximo.vencimento)}
        {fmtValor(proximo.valor)}
      </div>
    </div>
  );
}
