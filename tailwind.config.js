/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: '#030712',
        'obsidian-light': '#0a0e1a',
        'obsidian-border': '#1f2937',
        'plasma-orange': '#FF6B35',
        'plasma-light': '#FF8C42',
        'aurora-green': '#00FF94',
        'aurora-teal': '#00D4AA',
        'flare-red': '#FF2E63',
        'magma-yellow': '#FFA726',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'aurora': 'aurora 8s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 1, filter: 'brightness(1)' },
          '50%': { opacity: 0.8, filter: 'brightness(1.3)' },
        },
        'aurora': {
          '0%, 100%': { transform: 'translateX(-10%) rotate(2deg)', opacity: 0.3 },
          '50%': { transform: 'translateX(10%) rotate(-2deg)', opacity: 0.6 },
        },
        'scanline': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      boxShadow: {
        'plasma': '0 0 20px rgba(255, 107, 53, 0.3)',
        'aurora': '0 0 20px rgba(0, 255, 148, 0.3)',
        'glow-sm': '0 0 10px currentColor',
      },
      fontFamily: {
        mono: ['SF Mono', 'Fira Code', 'JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
