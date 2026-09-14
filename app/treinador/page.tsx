"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { TreinadorTemplate, TreinadorRcpBloco } from "@/lib/types";

const SEMANAS = [1, 2, 3];
const EMAGRECIMENTO_ITENS = ["Progressão 3x na semana", "Progressão 5x na semana"];

type Secao = "rcp" | "fortalecimentos" | "emagrecimento";

export default function TreinadorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TreinadorTemplate[]>([]);
  const [rcpBlocos, setRcpBlocos] = useState<TreinadorRcpBloco[]>([]);
  const [secao, setSecao] = useState<Secao>("rcp");
  const [grupo, setGrupo] = useState<"Superior" | "Inferior">("Superior");
  const [semana, setSemana] = useState(1);
  const [novoFortalecimento, setNovoFortalecimento] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/coach/login"); return; }

      const [{ data: tpl }, { data: rcp }] = await Promise.all([
        supabase.from("treinador_templates").select("*").order("position", { ascending: true }),
        supabase.from("treinador_rcp_blocos").select("*"),
      ]);
      setTemplates((tpl as TreinadorTemplate[]) || []);
      setRcpBlocos((rcp as TreinadorRcpBloco[]) || []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getTemplate(categoria: string, titulo: string) {
    return templates.find((t) => t.categoria === categoria && t.titulo === titulo);
  }

  async function saveTemplate(categoria: string, titulo: string, conteudo: string) {
    const existing = getTemplate(categoria, titulo);
    if (existing) {
      setTemplates((prev) => prev.map((t) => (t.id === existing.id ? { ...t, conteudo } : t)));
      await supabase.from("treinador_templates").update({ conteudo }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("treinador_templates")
        .insert({ categoria, titulo, conteudo, position: 0 })
        .select()
        .single();
      if (data) setTemplates((prev) => [...prev, data as TreinadorTemplate]);
    }
  }

  async function addFortalecimento() {
    const titulo = novoFortalecimento.trim();
    if (!titulo) return;
    const fortalecimentos = templates.filter((t) => t.categoria === "fortalecimento");
    const { data } = await supabase
      .from("treinador_templates")
      .insert({ categoria: "fortalecimento", titulo, conteudo: "", position: fortalecimentos.length })
      .select()
      .single();
    if (data) setTemplates((prev) => [...prev, data as TreinadorTemplate]);
    setNovoFortalecimento("");
  }

  async function removeFortalecimento(id: string) {
    const confirmado = window.confirm("Remover esse fortalecimento da lista?");
    if (!confirmado) return;
    await supabase.from("treinador_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function getRcpBloco(g: string, s: number) {
    return rcpBlocos.find((r) => r.grupo === g && r.semana === s);
  }

  async function saveRcpCampo(g: string, s: number, campo: string, valor: string) {
    const existing = getRcpBloco(g, s);
    if (existing) {
      setRcpBlocos((prev) => prev.map((r) => (r.id === existing.id ? { ...r, [campo]: valor } : r)));
      await supabase.from("treinador_rcp_blocos").update({ [campo]: valor }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("treinador_rcp_blocos")
        .insert({ grupo: g, semana: s, [campo]: valor })
        .select()
        .single();
      if (data) setRcpBlocos((prev) => [...prev, data as TreinadorRcpBloco]);
    }
  }

  const inputStyle = { background: "#0d0d0d", border: "1.5px solid rgba(255,255,255,0.16)", color: "#f2f2f0" };
  const fortalecimentos = templates.filter((t) => t.categoria === "fortalecimento");
  const bloco = getRcpBloco(grupo, semana);

  if (loading) {
    return <div className="app-shell flex items-center justify-center" style={{ minHeight: "100vh", color: "#9a9a9f" }}>Carregando...</div>;
  }

  function renderBlocoRcp(numero: 1 | 2) {
    const prefixo = `b${numero}`;
    return (
      <div className="card p-4 mb-3">
        <h3 className="font-extrabold text-[14px] mb-3" style={{ color: "#ccff00" }}>Bloco {numero}</h3>
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-2">
              <input
                placeholder={`Movimento ${i}`}
                defaultValue={(bloco as any)?.[`${prefixo}_mov${i}`] || ""}
                onBlur={(e) => saveRcpCampo(grupo, semana, `${prefixo}_mov${i}`, e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-lg text-sm"
                style={inputStyle}
              />
              <input
                placeholder="Peso"
                defaultValue={(bloco as any)?.[`${prefixo}_peso${i}`] || ""}
                onBlur={(e) => saveRcpCampo(grupo, semana, `${prefixo}_peso${i}`, e.target.value)}
                className="px-3 py-2.5 rounded-lg text-sm text-center"
                style={{ ...inputStyle, width: 90 }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell px-5 py-5" style={{ paddingBottom: 60 }}>
      <button onClick={() => router.push("/coach/dashboard")} className="text-xs font-bold mb-3" style={{ color: "#6c6c72" }}>
        ‹ Voltar
      </button>

      <div className="flex items-center gap-2 mb-6">
        <span style={{ fontSize: 28 }}>🗂️</span>
        <h1 className="text-white font-extrabold text-xl">Treinador · Biblioteca de treinos</h1>
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-0.5" style={{ borderBottom: "2px solid rgba(255,255,255,0.09)" }}>
        {[
          { key: "rcp", label: "Protocolo RCP" },
          { key: "fortalecimentos", label: "Fortalecimentos" },
          { key: "emagrecimento", label: "Emagrecimento" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setSecao(t.key as Secao)}
            className="flex-shrink-0 px-4 py-2.5 text-[13px] font-extrabold rounded-full"
            style={{
              background: secao === t.key ? "rgba(212,175,55,0.14)" : "#18191c",
              color: secao === t.key ? "#d4af37" : "#9a9a9f",
              border: `1px solid ${secao === t.key ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.09)"}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {secao === "rcp" && (
        <div>
          <div className="flex gap-2 mb-3">
            {(["Superior", "Inferior"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setGrupo(g)}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-extrabold"
                style={{
                  background: grupo === g ? "rgba(59,130,246,0.14)" : "#18191c",
                  color: grupo === g ? "#3b82f6" : "#9a9a9f",
                  border: `1px solid ${grupo === g ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.09)"}`,
                }}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            {SEMANAS.map((s) => (
              <button
                key={s}
                onClick={() => setSemana(s)}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-extrabold"
                style={{
                  background: semana === s ? "rgba(212,175,55,0.14)" : "#18191c",
                  color: semana === s ? "#d4af37" : "#9a9a9f",
                  border: `1px solid ${semana === s ? "rgba(212,175,55,0.35)" : "rgba(255,255,255,0.09)"}`,
                }}
              >
                Semana {s}
              </button>
            ))}
          </div>

          <div className="mb-2 text-[12.5px] font-extrabold" style={{ color: "#9a9a9f" }}>
            {grupo} · Semana {semana}
          </div>
          {renderBlocoRcp(1)}
          {renderBlocoRcp(2)}
        </div>
      )}

      {secao === "fortalecimentos" && (
        <div>
          <div className="flex gap-2 mb-4">
            <input
              value={novoFortalecimento}
              onChange={(e) => setNovoFortalecimento(e.target.value)}
              placeholder="Nome do fortalecimento novo (ex: Ombro, Core, Posterior)"
              className="flex-1 px-3 py-2.5 rounded-lg text-sm"
              style={inputStyle}
            />
            <button
              onClick={addFortalecimento}
              className="px-4 rounded-lg font-extrabold text-sm"
              style={{ background: "#d4af37", color: "#1a1400", border: "none" }}
            >
              + Adicionar
            </button>
          </div>

          {fortalecimentos.length === 0 && (
            <div className="text-center text-sm py-8" style={{ color: "#6c6c72" }}>
              Nenhum fortalecimento criado ainda. Adiciona o primeiro aí em cima.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {fortalecimentos.map((f) => (
              <div key={f.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-extrabold text-[14px]" style={{ color: "#d4af37" }}>{f.titulo}</h3>
                  <button
                    onClick={() => removeFortalecimento(f.id)}
                    className="text-[11px] font-bold"
                    style={{ color: "#ef4444" }}
                  >
                    🗑 Remover
                  </button>
                </div>
                <textarea
                  defaultValue={f.conteudo}
                  onBlur={(e) => saveTemplate("fortalecimento", f.titulo, e.target.value)}
                  rows={10}
                  placeholder="Escreva aqui a estrutura pronta desse fortalecimento..."
                  className="w-full px-3 py-2.5 rounded-lg text-sm"
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {secao === "emagrecimento" && (
        <div className="flex flex-col gap-4">
          {EMAGRECIMENTO_ITENS.map((titulo) => (
            <div key={titulo} className="card p-4">
              <h3 className="font-extrabold text-[14px] mb-3" style={{ color: "#d4af37" }}>{titulo}</h3>
              <textarea
                defaultValue={getTemplate("emagrecimento", titulo)?.conteudo || ""}
                onBlur={(e) => saveTemplate("emagrecimento", titulo, e.target.value)}
                rows={12}
                placeholder={`Escreva aqui a estrutura pronta de ${titulo}...`}
                className="w-full px-3 py-2.5 rounded-lg text-sm"
                style={inputStyle}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
