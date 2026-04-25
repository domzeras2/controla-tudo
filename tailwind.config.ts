import type { Config } from "tailwindcss";

const config: Config = {
  content: {
    relative: true,
    files: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
      "./lib/**/*.{js,ts,jsx,tsx,mdx}",
      "./*.{js,ts,jsx,tsx,mdx}"
    ]
  },
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        slateSoft: "#64748b",
        borderSoft: "#e2e8f0",
        panel: "#ffffff",
        canvas: "#f8fafc",
        brand: {
          50: "#eef7ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8"
        },
        emeraldSoft: "#e8fff5",
        amberSoft: "#fff7e6",
        roseSoft: "#fff1f2"
      },
      boxShadow: {
        panel: "0 22px 55px rgba(2, 6, 23, 0.38)"
      },
      borderRadius: {
        "2xl": "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
