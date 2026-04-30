/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-body)", "system-ui", "sans-serif"],
        pixel: ["DM Mono", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "status-success": {
          DEFAULT: "hsl(var(--status-success))",
          foreground: "hsl(var(--status-success-fg))",
          dot: "hsl(var(--status-success-dot))",
        },
        "status-warning": {
          DEFAULT: "hsl(var(--status-warning))",
          foreground: "hsl(var(--status-warning-fg))",
          dot: "hsl(var(--status-warning-dot))",
        },
        "status-danger": {
          DEFAULT: "hsl(var(--status-danger))",
          foreground: "hsl(var(--status-danger-fg))",
          dot: "hsl(var(--status-danger-dot))",
        },
        "status-info": {
          foreground: "hsl(var(--status-info-fg))",
        },
        "accent-blue": {
          DEFAULT: "hsl(var(--accent-blue))",
        },
        link: "hsl(var(--link))",
      },
      borderRadius: {
        lg: "10px",
        md: "6px",
        sm: "4px",
        xs: "3px",
      },
      fontSize: {
        display: ["40px", { lineHeight: "48px", letterSpacing: "-0.02em", fontWeight: "700" }],
        h1: ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["20px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "24px" }],
        body: ["14px", { lineHeight: "22px" }],
        ui: ["13px", { lineHeight: "18px" }],
        small: ["12px", { lineHeight: "18px" }],
      },
      maxWidth: {
        page: "840px",
        "page-wide": "1080px",
        conversation: "768px",
      },
      boxShadow: {
        popover: "0 1px 4px rgba(15,15,15,0.05), 0 4px 12px rgba(15,15,15,0.10)",
        modal: "0 8px 32px rgba(15,15,15,0.14)",
        tooltip: "0 1px 2px rgba(15,15,15,0.16)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
