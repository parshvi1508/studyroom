/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "#0a0a0a",
          surface: "#111111",
          elevated: "#1a1a1a",
          border: "#262626",
        },
        accent: {
          DEFAULT: "#6366f1",
          hover: "#4f46e5",
          muted: "#6366f120",
        },
        text: {
          primary: "#f5f5f5",
          secondary: "#a3a3a3",
          muted: "#525252",
        },
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
}