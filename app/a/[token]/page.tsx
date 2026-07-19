"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { weekdayName } from "@/lib/movementLibrary";
import type { Athlete, Objetivo, MovementRow, ExtraBloco, ExtraExercicio, Aula, Mensagem, Pagamento } from "@/lib/types";
import ObjetivosCard from "@/components/ObjetivosCard";
import MovementTable from "@/components/MovementTable";
import ExtrasEditor from "@/components/ExtrasEditor";
import AulasEditor from "@/components/AulasEditor";
import MensagensPanel from "@/components/MensagensPanel";
import PagamentosTable from "@/components/PagamentosTable";

const TABS = [
  { key: "levantamentos", label: "Levantamentos" },
  { key: "ginasticas", label: "Ginásticas" },
  { key: "ciclicos", label: "Cíclicos" },
  { key: "benchmarks", label: "Benchmarks" },
  { key: "extras", label: "Extras" },
  { key: "aulas", label: "Aulas" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function AthletePublicPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [athlete, setAthlete] = useState<Athlete | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [movementRows, setMovementRows] = useState<MovementRow[]>([]);
  const [blocos, setBlocos] = useState<(ExtraBloco & { extras_exercicios: ExtraExercicio[] })[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [tab, setTab] = useState<TabKey>("levantamentos");

  useEffect(() => {
    (async () => {
      const { data: a } = await supabase.from("athletes").select("*").eq("share_token", params.token).single();
      if (!a) { setNotFound(true); setLoading(false); return; }
      setAthlete(a as Athlete);

      const [{ data: obj }, { data: mov }, { data: bl }, { data: au }, { data: msg }, { data: pay }] = await Promise.all([
        supabase.from("objetivos").select("*").eq("athlete_id", a.id).order("position"),
        supabase.from("movement_rows").select("*").eq("athlete_id", a.id).order("position"),
        supabase.from("extras_blocos").select("*, extras_exercicios(*)").eq("athlete_id", a.id).order("position"),
        supabase.from("aulas").select("*").eq("athlete_id", a.id).order("data"),
        supabase.from("mensagens").select("*").eq("athlete_id", a.id).order("created_at", { ascending: false }),
        supabase.from("pagamentos").select("*").eq("athlete_id", a.id),
      ]);

      setObjetivos((obj as Objetivo[]) || []);
      setMovementRows((mov as MovementRow[
