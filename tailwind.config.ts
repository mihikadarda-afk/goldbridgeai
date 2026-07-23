import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep navy primary
        navy: {
          50: "#eef1f7",
          100: "#d3dae9",
          200: "#a7b4d1",
          300: "#7488b3",
          400: "#4c6193",
          500: "#324878",
          600: "#233761",
          700: "#1a2a4d",
          800: "#111d38",
          900: "#0b1428",
          950: "#060c1a",
        },
        // Charcoal accents
        charcoal: {
          50: "#f4f5f6",
          100: "#e3e5e8",
          200: "#c7ccd1",
          300: "#a1a9b2",
          400: "#767f8b",
          500: "#5b6470",
          600: "#474e59",
          700: "#3a4049",
          800: "#2b2f37",
          900: "#1e2126",
          950: "#131519",
        },
        // Metallic gold highlights (used sparingly)
        gold: {
          50: "#fbf6e9",
          100: "#f5e9c4",
          200: "#ecd490",
          300: "#e0bd5c",
          400: "#d4a63a",
          500: "#c08d29",
          600: "#a5741f",
          700: "#83591c",
          800: "#6d491d",
          900: "#5e3e1d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,20,40,0.06), 0 12px 32px -12px rgba(11,20,40,0.18)",
        "card-dark": "0 1px 2px rgba(0,0,0,0.4), 0 20px 48px -20px rgba(0,0,0,0.6)",
        gold: "0 8px 24px -8px rgba(192,141,41,0.5)",
      },
      backgroundImage: {
        "gold-metallic":
          "linear-gradient(135deg, #e0bd5c 0%, #c08d29 45%, #e6c977 60%, #a5741f 100%)",
        "navy-radial":
          "radial-gradient(900px 500px at 80% -10%, rgba(50,72,120,0.18), transparent 60%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
