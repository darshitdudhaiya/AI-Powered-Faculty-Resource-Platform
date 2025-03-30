/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            h1: {
              marginTop: "2rem",
              marginBottom: "1rem",
              fontSize: "2.25rem",
              fontWeight: "700",
              borderBottom: "2px solid #e5e7eb",
              paddingBottom: "0.5rem",
            },
            h2: {
              marginTop: "1.5rem",
              marginBottom: "0.75rem",
              fontSize: "1.875rem",
              fontWeight: "600",
            },
            h3: {
              marginTop: "1.25rem",
              marginBottom: "0.5rem",
              fontSize: "1.5rem",
              fontWeight: "600",
            },
            "code::before": {
              content: '""',
            },
            "code::after": {
              content: '""',
            },
            hr: {
              margin: "2rem 0",
              borderColor: "#e5e7eb",
            },
            table: {
              fontSize: "0.875rem",
            },
            "thead th": {
              padding: "0.75rem",
              backgroundColor: "#f3f4f6",
            },
            "tbody td": {
              padding: "0.75rem",
            },
            pre: {
              backgroundColor: "#f3f4f6",
              padding: "1rem",
              borderRadius: "0.375rem",
              margin: "1rem 0",
            },
          },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
