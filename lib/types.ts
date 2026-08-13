export interface Athlete {
  id: string;
  coach_id: string;
  name: string;
  share_token: string;
  cycle_start: string;
  cycle_end: string;
  created_at: string;
  rcp_athlete_id: string | null;
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

export interface RcpAthlete {
  id: string;
  name: string;
  grupo_trio: string | null;
  share_token: string;
  created_at: string;
}

export interface RcpLoadTracking {
  id: string;
  athlete_id: string;
  exercicio: string;
  semana: number;
  carga: string;
  created_at: string;
}

export interface RcpAssessment {
  id: string;
  athlete_id: string;
  tipo: "D1" | "D90";
  peso: string;
  massa_muscular: string;
  percentual_gordura: string;
  observacoes: string;
  created_at: string;
}

export interface RcpExtra {
  id: string;
  athlete_id: string;
  dia: string;
  texto: string;
  updated_at: string;
}

export interface RcpTreinoBloco {
  id: string;
  athlete_id: string;
  tipo: "superiores" | "inferiores";
  b1_movimento: string;
  b1_peso: string;
  b2_mov1: string;
  b2_peso1: string;
  b2_mov2: string;
  b2_peso2: string;
  b2_mov3: string;
  b2_peso3: string;
  b2_mov4: string;
  b2_peso4: string;
  b3_mov1: string;
  b3_peso1: string;
  b3_mov2: string;
  b3_peso2: string;
  b3_mov3: string;
  b3_peso3: string;
  b3_mov4: string;
  b3_peso4: string;
  b4_texto: string;
  updated_at: string;
}

export interface RcpExercicios {
  id: string;
  athlete_id: string;
  b1_movimento: string;
  b1_peso: string;
  b2_mov1: string;
  b2_peso1: string;
  b2_mov2: string;
  b2_peso2: string;
  b2_mov3: string;
  b2_peso3: string;
  b2_mov4: string;
  b2_peso4: string;
  b3_mov1: string;
  b3_peso1: string;
  b3_mov2: string;
  b3_peso2: string;
  b3_mov3: string;
  b3_peso3: string;
  b3_mov4: string;
  b3_peso4: string;
  b4_texto: string;
  updated_at: string;
}
