export interface RcpWeek {
  semana: number;
  fase: string;
  seriesReps: string;
  rpe: string;
  foco: string;
}

export const RCP_WEEKS: RcpWeek[] = [
  { semana: 1, fase: "Base", seriesReps: "4x8", rpe: "6-7 / 5-6", foco: "Priorize a técnica — essa semana define os padrões do plano inteiro." },
  { semana: 2, fase: "Base", seriesReps: "4x8", rpe: "6-7 / 5-6", foco: "Mantenha a execução limpa. Se sobrou facilidade, planeje aumentar na semana 3." },
  { semana: 3, fase: "Base", seriesReps: "4x8", rpe: "6-7 / 5-6", foco: "Hora de testar a progressão: se completou todas as reps bem, aumente a carga." },
  { semana: 4, fase: "Base", seriesReps: "4x8", rpe: "6-7 / 5-6", foco: "Última semana de base. Registre as cargas — são a referência do plano." },
  { semana: 5, fase: "Construção", seriesReps: "4x6", rpe: "7-8 / 6-7", foco: "Volume cai, carga sobe. Seu sistema nervoso vai sentir a diferença." },
  { semana: 6, fase: "Construção", seriesReps: "4x6", rpe: "7-8 / 6-7", foco: "Mantenha a barra controlada na descida — excêntrico gera adaptação de força." },
  { semana: 7, fase: "Construção", seriesReps: "4x6", rpe: "7-8 / 6-7", foco: "Última semana de construção. Prepare o corpo pra reduzir na semana 8." },
  { semana: 8, fase: "Deload", seriesReps: "4x6", rpe: "5-6 / 4-5", foco: "Semana de recuperação — carga leve, movimento limpo, sem força." },
  { semana: 9, fase: "Intensificação", seriesReps: "4x3-4", rpe: "8-9 / 7-8", foco: "Fase final. Poucas reps, máxima intenção em cada repetição." },
  { semana: 10, fase: "Intensificação", seriesReps: "4x3-4", rpe: "8-9 / 7-8", foco: "Pesado e técnico. Pode adicionar 15-20s de descanso entre rodadas se necessário." },
  { semana: 11, fase: "Intensificação", seriesReps: "4x3-4", rpe: "8-9 / 7-8", foco: "Última semana de treino pesado — deixe o tanque cheio pra semana 12." },
  { semana: 12, fase: "Teste de Carga", seriesReps: "1-3 (máx)", rpe: "Máximo", foco: "Dia de teste. Compare com a carga inicial e mostre a evolução pro aluno." },
];

export const RCP_EXERCICIOS_CARGA = ["Back Squat", "Supino Reto"];
