import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── shadcn/ui CSS variable tokens (keep for shadcn components) ──
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",

        // ── Leveld Design Tokens (PRD §14.3) ────────────────────────────

        // Backgrounds
        base: "#ffffff",
        surface: "#ffffff",
        hover: "#f5f6f8",
        active: "#ebebed",

        // Borders
        line: {
          DEFAULT: "#e4e4e7",
          subtle: "#d1d5db",
        },

        // Text
        ink: {
          DEFAULT: "#111827",
          dim: "#52525b",
          muted: "#a1a1aa",
          faint: "#d4d4d8",
        },

        // Accent — purple
        purple: {
          DEFAULT: "#7c3aed",
          light: "#f5f3ff",
          border: "#ddd6fe",
        },

        // Status — green (in-progress)
        "status-green": {
          DEFAULT: "#16a34a",
          bg: "#f0fdf4",
          border: "#bbf7d0",
        },

        // Status — amber (up next / review due)
        "status-amber": {
          DEFAULT: "#d97706",
          bg: "#fffbeb",
          border: "#fde68a",
        },
      },

      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
