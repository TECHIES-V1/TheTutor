import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Leather surface scale (warm browns)
        leather: {
          900: "#1a1611",
          800: "#2a2318",
          700: "#3d3428",
          600: "#5a4d3a",
          500: "#6b5b3e",
        },
        // Gold scale
        gold: {
          300: "#e8c84a",
          400: "#d4af37",
          500: "#b8920e",
          600: "#a07a0a",
          700: "#8a6d0a",
        },
        // Cream text scale
        cream: {
          100: "#f5f0e8",
          200: "#F6F1DF",
          300: "#f2ece0",
          400: "#D6C49A",
        },
        // Icon/warm brown
        icon: "var(--icon-color)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // Fixed: was all pointing to --font-comfortaa (bug)
        comfortaa: ["var(--font-comfortaa)", "cursive"],
        playfair: ["var(--font-playfair)", "serif"],
        lato: ["var(--font-comfortaa)", "sans-serif"],
      },
      boxShadow: {
        // Neumorphic shadow scale (all use CSS vars set per theme)
        "neo-inset":  "var(--shadow-inset)",
        "neo-card":   "var(--shadow-card)",
        "neo-raised": "var(--shadow-raised)",
        "neo-modal":  "var(--shadow-modal)",
        "neo-float":  "var(--shadow-float)",
        "neo-focus":  "var(--shadow-focus)",
        // Keep native shadows available (removed the none override)
        sm:      "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        md:      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        lg:      "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        xl:      "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "2xl":   "0 25px 50px -12px rgb(0 0 0 / 0.25)",
        inner:   "inset 0 2px 4px 0 rgb(0 0 0 / 0.05)",
        none:    "none",
      },
      transitionTimingFunction: {
        spring:    "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      transitionDuration: {
        "80":  "80ms",
        "150": "150ms",
        "350": "350ms",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
};

export default config;
