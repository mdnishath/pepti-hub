import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "var(--font-geist-sans)", "sans-serif"],
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        brand: {
          DEFAULT: "#3db7c2",
          foreground: "#ffffff",
          50: "#eaf9fa",
          100: "#cef0f2",
          200: "#a6e3e8",
          300: "#70cfd8",
          400: "#3db7c2",
          500: "#229ba7",
          600: "#197c88",
          700: "#16646f",
          800: "#18535c",
          900: "#16454e",
          950: "#0b2d34",
        },
        "dark-bg": {
          DEFAULT: "#020618",
          lighter: "#0b122b",
          card: "#0f1736",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
