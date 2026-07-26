import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07090e",
          900: "#0b0e15",
          850: "#10141d",
          800: "#151a26",
          700: "#1e2434",
          600: "#2a3247",
        },
        accent: {
          DEFAULT: "#34d399",
          dim: "#10b981",
          soft: "rgba(52, 211, 153, 0.12)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
