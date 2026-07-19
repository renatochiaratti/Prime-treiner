"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Mensagem } from "@/lib/types";

export default function MensagensPanel({
  athleteId,
  athleteName,
  initialMensagens,
  editable,
}: {
  athleteId: string;
  athleteName: string;
  initialMensagens: Mensagem[];
  editable: boolean;
}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>(
    [...initialMensagens].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  );
  const [texto, setTexto] = useState("");
  const unread = mensagens.filter((m) => !m.lida).length;

  async function enviar() {
    const t = texto.trim();
    if (!t) return;
    const { data } = await supabase
      .from("mensagens")
      .insert({ athlete_id: athleteId, texto: t, lida: false })
      .select()
      .single();
    if (data) {
      setMensagens((prev) => [data as Mensagem, ...prev]);
      setTexto("");
    }
  }

  async function marcarLida(m: Mensagem) {
    setMensagens((prev) => prev.map((x) => (x.id === m.id ? { ...x, lida: true } : x)));
    await supabase.from("mensagens").update({ lida: true }).eq("id", m.id);
  }

  async function excluir(m: Mensagem) {
    setMensagens((prev) => prev.filter((x) => x.id !== m.id));
    await supabase.from("mensagens").delete().eq("id", m.id);
  }

  return (
    <div>
      <h2 className="text-white font-extrabold text-[17px] mb-3 flex items-center gap-2">
        <span style={{ width: 9, height: 9, background: "#d4af37", display: "inline-block", transform: "rotate(45deg)", borderRadius: 3 }} />
        Mural de Recados
        {!editable && unread > 0 && (
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full" style={{ background: "#d4af37", color: "#1a1305" }}>
            {unread} nova{unread > 1 ? "s" : ""}
          </span>
        )}
      </h2>

      {editable && (
        <div className="mb-3.5">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={`Escreva um recado para ${athleteName}...`}
            className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold mb-2"
            style={{ background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0", minHeight: 66 }}
          />
          <button onClick={enviar} className="btn btn-gold w-full">Enviar recado</button>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {mensagens.length === 0 && (
          <p className="text-sm font-bold" style={{ color: "#6c6c72" }}>Nenhum recado enviado ainda.</p>
        )}
        {mensagens.map((m) => (
          <div
            key={m.id}
            className="card px-4 py-3.5"
            style={m.lida ? {} : { borderColor: "rgba(212,175,55,0.35)", background: "rgba(212,175,55,0.14)" }}
          >
            <div className="text-[14px] font-bold mb-2" style={{ color: "#f2f2f0" }}>{m.texto}</div>
            <div className="flex items-center gap-2.5 text-[11.5px] font-bold" style={{ color: "#6c6c72" }}>
              <span>{new Date(m.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} às {new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              {!m.lida ? (
                editable
                  ? <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full" style={{ background: "#d4af37", color: "#1a1305" }}>não lida</span>
                  : <button onClick={() => marcarLida(m)} className="text-[12px] font-bold" style={{ color: "#9a9a9f" }}>Marcar como lida</button>
              ) : (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full" style={{ background: "#26272c", color: "#6c6c72" }}>lida</span>
              )}
              {editable && (
                <span onClick={() => excluir(m)} className="ml-auto cursor-pointer" style={{ color: "#6c6c72" }}>excluir</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
