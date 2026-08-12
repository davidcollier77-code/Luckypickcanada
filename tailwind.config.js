/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './themes/**/*.{js,jsx,ts,tsx}',
    './*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      dropShadow: {
        '3d': [
          '0 2px 2px rgba(0,0,0,0.8)',
          '0 4px 6px rgba(0,0,0,0.5)',
          '0 8px 12px rgba(0,0,0,0.4)',
        ]
      },
      animation: {
        'spin-slow': 'spin 25s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'aurora-1': 'auroraWave 20s ease-in-out infinite alternate',
        'aurora-2': 'auroraWave 25s ease-in-out infinite alternate-reverse',
        'aurora-3': 'auroraWave 30s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.6, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.03)' },
        },
        auroraWave: {
          '0%': { transform: 'translateY(0) scaleX(1)', opacity: 0.3 },
          '50%': { transform: 'translateY(-5%) scaleX(1.05)', opacity: 0.5 },
          '100%': { transform: 'translateY(2%) scaleX(0.95)', opacity: 0.3 },
        }
      },
      colors: {
        background: 'var(--lp-bg)',
        foreground: 'var(--lp-text)',
        aurora: {
          blue: 'var(--lp-aurora-blue)',
          violet: 'var(--lp-aurora-violet)',
        },
        starry: {
          night: 'var(--lp-night)',
          ink: 'var(--lp-ink)',
        },
      },
    },
  },
  plugins: [],
};
