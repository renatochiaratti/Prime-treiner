import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0d0d0d",
        bg2: "#131315",
        panel: "#18191c",
        panel2: "#1f2024",
        panel3: "#26272c",
        line: "rgba(255,255,255,0.09)",
        lineStrong: "rgba(255,255,255,0.16)",
        gold: "#d4af37",
        goldSoft: "rgba(212,175,55,0.14)",
        goldLine: "rgba(212,175,55,0.35)",
        green: "#22c55e",
        greenSoft: "rgba(34,197,94,0.14)",
        greenLine: "rgba(34,197,94,0.35)",
        danger: "#ef4444",
        dangerSoft: "rgba(239,68,68,0.14)",
        muted: "#9a9a9f",
        dim: "#6c6c72",
      },
      fontFamily: {
        display: ["Manrope", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg2: "20px",
      },
    },
  },
  plugins: [],
};
export default config;
