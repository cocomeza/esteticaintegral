/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        // Paleta basada en el logo de Estética Integral
        primary: "#d63384",      // Rosa/Magenta profundo del logo
        secondary: "#f8d7da",    // Rosa claro del logo
        accent: "#6c757d",       // Gris oscuro del texto "INTEGRAL"
        neutral: "#495057",      // Gris medio
        dark: "#343a40",         // Gris muy oscuro
        light: "#fdf2f8",        // Rosa muy claro de fondo
        success: "#28a745",      // Verde suave
        error: "#dc3545",        // Rojo suave
        pink: {
          50: "#fdf2f8",
          100: "#fce7f3", 
          500: "#ec4899",
          600: "#d63384",
          700: "#be185d"
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}
