"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { TreinadorTemplate, TreinadorRcpBloco } from "@/lib/types";
import VideoModal from "@/components/VideoModal";

const SEMANAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const EMAGRECIMENTO_ITENS = ["Progressão 3x na semana", "Progressão 5x na semana"];
const EX_SLOTS = [1, 2, 3, 4, 5, 6];

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
  const [videoSlot, setVideoSlot] = useState<{ f: TreinadorTemplate; n: number } | null>(null);

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
    const confirmado = window.confirm("Remover esse fortalecimento da lista? Ele também some do plano dos alunos.");
    if (!confirmado) return;
    await supabase.from("athlete_fortalecimentos").delete().eq("template_id", id);
    await supabase.from("treinador_templates").delete().eq("id", id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function broadcastFortalecimento(template: TreinadorTemplate) {
    const nomes = (template.alunos_alvo || "")
      .split(",")
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean);
    if (nomes.length === 0) return;

    const { data: allAthletes } = await supabase.from("athletes").select("id, name");
    if (!allAthletes) return;
    const alvos = (allAthletes as { id: string; name: string }[]).filter((a) =>
      nomes.includes((a.name || "").trim().toLowerCase())
    );
    if (alvos.length === 0) return;

    const campos: Record<string, string> = {
      titulo: template.titulo,
      descricao: template.descricao || "",
    };
    for (const n of EX_SLOTS) {
      campos[`ex${n}_sr`] = (template as any)[`ex${n}_sr`] || "";
      campos[`ex${n}_mov`] = (template as any)[`ex${n}_mov`] || "";
      campos[`ex${n}_rest`] = (template as any)[`ex${n}_rest`] || "";
      campos[`ex${n}_video`] = (template as any)[`ex${n}_video`] || "";
    }

    await Promise.all(
      alvos.map(async (a) => {
        const { data: existing } = await supabase
          .from("athlete_fortalecimentos")
          .select("id")
          .eq("athlete_id", a.id)
          .eq("template_id", template.id)
          .maybeSingle();
        if (existing) {
          await supabase.from("athlete_fortalecimentos").update(campos).eq("id", existing.id);
        } else {
          await supabase.from("athlete_fortalecimentos").insert({ athlete_id: a.id, template_id: template.id, ...campos });
        }
      })
    );
  }

  async function updateFortalecimentoField(f: TreinadorTemplate, campo: string, valor: string) {
    const atualizado = { ...f, [campo]: valor } as TreinadorTemplate;
    setTemplates((prev) => prev.map((t) => (t.id === f.id ? atualizado : t)));
    await supabase.from("treinador_templates").update({ [campo]: valor }).eq("id", f.id);
    await broadcastFortalecimento(atualizado);
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
  const smallInputStyle = { ...inputStyle, width: 90 };
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
        
