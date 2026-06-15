import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: "#6A1B29",
          light: "#8B2E3E",
          dark: "#4A121C",
        },
        navy: {
          DEFAULT: "#1A237E",
          light: "#283593",
          dark: "#0D1442",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#E5C558",
          dark: "#B8962E",
        },
        cream: {
          DEFAULT: "#FCFAF6",
          light: "#FFFFFF",
          dark: "#F5F0E6",
        },
      },
      fontFamily: {
        playfair: ["Playfair Display", "serif"],
        cinzel: ["Cinzel", "serif"],
        inter: ["Inter", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in",
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
