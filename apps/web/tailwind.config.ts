import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: { boxShadow: { glow: "0 0 90px rgba(124,92,255,.25)" }, animation: { pulseSoft: "pulseSoft 3s ease-in-out infinite" }, keyframes: { pulseSoft: { "0%,100%": { opacity: ".65" }, "50%": { opacity: "1" } } } } },
  plugins: []
};
export default config;
