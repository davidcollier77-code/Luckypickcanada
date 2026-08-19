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
        'pop-out': 'popOut 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'vortex-spin': 'vortexSpin 4s linear infinite',
        'vortex-spin-fast': 'vortexSpin 0.5s linear infinite',
        'vortex-spin-reverse': 'vortexSpinReverse 6s linear infinite',
        'spin-slow': 'spin 25s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'aurora-1': 'auroraWave 20s ease-in-out infinite alternate',
        'aurora-2': 'auroraWave 25s ease-in-out infinite alternate-reverse',
        'aurora-3': 'auroraWave 30s ease-in-out infinite alternate',
        'flicker': 'flicker 1.5s infinite alternate',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '10%': { opacity: '0.8' },
          '20%': { opacity: '0.4' },
          '30%': { opacity: '0.9' },
          '40%': { opacity: '0.7' },
          '50%': { opacity: '1' },
          '60%': { opacity: '0.3' },
          '70%': { opacity: '0.8' },
          '80%': { opacity: '0.6' },
          '90%': { opacity: '0.9' },
        },
        popOut: {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: '0' },
          '60%': { transform: 'translate(-50%, -50%) scale(1.2)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
        },
        vortexSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        vortexSpinReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
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
