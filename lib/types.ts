export interface Athlete {
  id: string;
  coach_id: string;
  name: string;
  share_token: string;
  cycle_start: string;
  cycle_end: string;
  created_at: string;
}

export interface Objetivo {
  id: string;
  athlete_id: string;
  text: string;
  done: boolean;
  position: number;
}

export interface MovementRow {
  id: string;
  athlete_id: string;
  categoria: "levantamentos" | "ginasticas" | "ciclicos" | "benchmarks";
  grupo: "girls" | "heroes" | null;
  movimento: string;
  start_val: string;
  atual: string;
  meta: string;
  video_url: string;
  position: number;
}

export interface ExtraBloco {
  id: string;
  athlete_id: string;
  dia: "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
  titulo: string;
  observacao: string;
  position: number;
}

export interface ExtraExercicio {
  id: string;
  bloco_id: string;
  descricao: string;
  video_url: string;
  position: number;
}

export interface Aula {
  id: string;
  athlete_id: string;
  data: string | null;
  hora: string | null;
  status: "marcada" | "dada" | "falta";
  observacao: string;
}

export interface Mensagem {
  id: string;
  athlete_id: string;
  texto: string;
  lida: boolean;
  created_at: string;
}

export interface AulaSlot {
  dia: string;
  status: "marcada" | "feita" | "nao_feita";
}

export interface Pagamento {
  id: string;
  athlete_id: string;
  position: number;
  mes: string;
  vencimento: string | null;
  valor: number;
  status: "pago" | "pendente";
  aulas: AulaSlot[] | null;
}

export const DAYS: { key: ExtraBloco["dia"]; label: string }[] = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];
