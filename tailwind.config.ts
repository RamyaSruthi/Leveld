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
        // bg-base        → app background, sidebar
        // bg-surface     → main content panel, cards
        // bg-hover       → hover state on rows and nav items
        // bg-active      → selected / active item
        base: "#fafaf9",
        surface: "#ffffff",
        hover: "#f4f2ee",
        active: "#f0eee9",

        // Borders
        // border-line           → all borders and dividers
        // border-line-subtle    → hover borders, input focus
        line: {
          DEFAULT: "#eeece8",
          subtle: "#ddd9d4",
        },

        // Text
        // text-ink          → headings, active labels
        // text-ink-dim      → body text, topic names (text.secondary)
        // text-ink-muted    → timestamps, metadata
        // text-ink-faint    → done items, placeholders (text.disabled)
        ink: {
          DEFAULT: "#1a1a1a",
          dim: "#888480",
          muted: "#b0ada8",
          faint: "#c0bdb8",
        },

        // Accent — purple
        // text-purple / bg-purple  → primary CTA, progress, streak, active
        // bg-purple-light          → accent background tint
        // border-purple-border     → accent border
        purple: {
          DEFAULT: "#6c5ce7",
          light: "#f0eeff",
          border: "#ddd9ff",
        },

        // Status — green (in-progress)
        "status-green": {
          DEFAULT: "#2d7a3a",
          bg: "#f0fff4",
          border: "#c3e6cb",
        },

        // Status — amber (up next / review due)
        "status-amber": {
          DEFAULT: "#b07030",
          bg: "#fff8f0",
          border: "#f0d8b0",
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
