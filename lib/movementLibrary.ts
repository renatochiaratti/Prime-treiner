export const LEVANTAMENTOS_LIB = [
  "Air Squat", "Back Squat", "Front Squat", "Overhead Squat",
  "Shoulder Press", "Push Press", "Push Jerk", "Split Jerk",
  "Deadlift", "Sumo Deadlift High Pull", "Medicine Ball Clean",
  "Power Clean", "Squat Clean", "Power Snatch", "Squat Snatch",
  "Thruster", "Clean and Jerk",
];

export const GINASTICAS_LIB = [
  "Push-up", "Pull-up", "Strict Pull-up", "Chest-to-Bar Pull-up",
  "Butterfly Pull-up", "Ring Dip", "Handstand Push-up (HSPU)",
  "Handstand Walk", "Bar Muscle-up", "Ring Muscle-up", "Toes-to-Bar",
  "Knees-to-Elbows", "GHD Sit-up", "Back Extension (GHD)", "Rope Climb",
  "Box Jump", "Burpee", "Wall Ball Shot", "Pistol (1 perna)", "L-Sit", "Ring Row",
];

export const CICLICOS_LIB = [
  "Corrida 1km", "Corrida 3km", "Corrida 5km", "Corrida 10km", "Corrida 15km",
  "Corrida 21km (Meia Maratona)", "Corrida 35km", "Corrida 42km (Maratona)",
  "Double Unders", "Single Unders",
  "Remo 500m", "Remo 1km", "Remo 2km", "Remo 5km",
  "Bike Erg 1km", "Bike Erg 5km", "Ski Erg 1km",
];

export const GIRLS_LIB = [
  "Amanda", "Angie", "Annie", "Barbara", "Candy", "Chelsea", "Cindy", "Diane",
  "Elizabeth", "Eva", "Fran", "Grace", "Gwen", "Helen", "Hope", "Isabel",
  "Jackie", "Karen", "Kelly", "Linda", "Lynne", "Maggie", "Marguerita",
  "Mary", "Megan", "Nancy", "Nicole",
];

export const HEROES_LIB = [
  "Murph", "DT", "JT", "Nate", "Michael", "Randy", "Josh", "Badger",
  "Tommy V", "Griff", "Danny", "Jason", "Hansen", "Ryan", "Whitten",
  "Chad", "Nutts", "Paul", "Garrett", "The Seven", "Roy", "Big Chris",
];

export type Categoria = "levantamentos" | "ginasticas" | "ciclicos" | "benchmarks";

export interface SeedRow {
  categoria: Categoria;
  grupo: "girls" | "heroes" | null;
  movimento: string;
  position: number;
}

export function buildSeedMovementRows(): SeedRow[] {
  const rows: SeedRow[] = [];
  let pos = 0;
  LEVANTAMENTOS_LIB.forEach((m) => rows.push({ categoria: "levantamentos", grupo: null, movimento: m, position: pos++ }));
  pos = 0;
  GINASTICAS_LIB.forEach((m) => rows.push({ categoria: "ginasticas", grupo: null, movimento: m, position: pos++ }));
  pos = 0;
  CICLICOS_LIB.forEach((m) => rows.push({ categoria: "ciclicos", grupo: null, movimento: m, position: pos++ }));
  pos = 0;
  GIRLS_LIB.forEach((m) => rows.push({ categoria: "benchmarks", grupo: "girls", movimento: m, position: pos++ }));
  HEROES_LIB.forEach((m) => rows.push({ categoria: "benchmarks", grupo: "heroes", movimento: m, position: pos++ }));
  return rows;
}

const WEEKDAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function weekdayName(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  return WEEKDAY_NAMES[d.getDay()];
}

function toNum(v: string | null | undefined): number | null {
  if (!v) return null;
  const m = String(v).replace(",", ".").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

export function progressPct(start: string | null, atual: string | null, meta: string | null): number | null {
  const s = toNum(start), at = toNum(atual), mt = toNum(meta);
  if (at === null || mt === null) return null;
  if (s !== null && s !== mt) {
    return Math.max(0, Math.min(100, ((at - s) / (mt - s)) * 100));
  }
  if (mt > 0) return Math.max(0, Math.min(100, (at / mt) * 100));
  return null;
}

export function videoEmbedUrl(url: string): { type: "youtube" | "vimeo" | "link"; embed: string } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (yt) return { type: "youtube", embed: `https://www.youtube.com/embed/${yt[1]}` };
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return { type: "vimeo", embed: `https://player.vimeo.com/video/${vm[1]}` };
  return { type: "link", embed: url };
}
