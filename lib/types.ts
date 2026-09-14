export interface Athlete {
  id: string;
  coach_id: string;
  name: string;
  share_token: string;
  cycle_start: string;
  cycle_end: string;
  created_at: string;
  rcp_athlete_id: string | null;
  crossfit_ativo: boolean;
  rcp_ativo: boolean;
  position: number;
  auth_user_id: string | null;
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
  crossfit_texto: string;
  updated_at: string;
}

export interface RcpCheck {
  id: string;
  athlete_id: string;
  dia: string;
  status: "verde" | "vermelho" | "amarelo";
  updated_at: string;
}

export interface RcpTreinoBloco {
  id: string;
  athlete_id: string;
  tipo: string;
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

export interface TreinadorTemplate {
  id: string;
  coach_id: string | null;
  categoria: string;
  titulo: string;
  conteudo: string;
  descricao: string;
  alunos_alvo: string;
  ex1_sr: string;
  ex1_mov: string;
  ex1_rest: string;
  ex2_sr: string;
  ex2_mov: string;
  ex2_rest: string;
  ex3_sr: string;
  ex3_mov: string;
  ex3_rest: string;
  ex4_sr: string;
  ex4_mov: string;
  ex4_rest: string;
  ex5_sr: string;
  ex5_mov: string;
  ex5_rest: string;
  ex6_sr: string;
  ex6_mov: string;
  ex6_rest: string;
  position: number;
  created_at: string;
}

export interface AthleteFortalecimento {
  id: string;
  athlete_id: string;
  template_id: string | null;
  titulo: string;
  descricao: string;
  ex1_sr: string;
  ex1_mov: string;
  ex1_rest: string;
  ex2_sr: string;
  ex2_mov: string;
  ex2_rest: string;
  ex3_sr: string;
  ex3_mov: string;
  ex3_rest: string;
  ex4_sr: string;
  ex4_mov: string;
  ex4_rest: string;
  ex5_sr: string;
  ex5_mov: string;
  ex5_rest: string;
  ex6_sr: string;
  ex6_mov: string;
  ex6_rest: string;
  position: number;
  updated_at: string;
}

export interface TreinadorRcpBloco {
  id: string;
  grupo: string;
  semana: number;
  b1_mov1: string;
  b1_peso1: string;
  b1_mov2: string;
  b1_peso2: string;
  b1_mov3: string;
  b1_peso3: string;
  b1_mov4: string;
  b1_peso4: string;
  b2_mov1: string;
  b2_peso1: string;
  b2_mov2: string;
  b2_peso2: string;
  b2_mov3: string;
  b2_peso3: string;
  b2_mov4: string;
  b2_peso4: string;
  updated_at: string;
}
