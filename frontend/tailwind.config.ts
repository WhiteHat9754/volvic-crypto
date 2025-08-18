import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse': 'spin 8s linear infinite reverse',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 2s',
        'float-reverse': 'float 6s ease-in-out infinite reverse',
        'orbit': 'orbit 10s linear infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'dataFlow': 'dataFlow 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': {
            transform: 'translateY(0px) translateX(0px)',
          },
          '50%': {
            transform: 'translateY(-20px) translateX(10px)',
          },
        },
        orbit: {
          '0%': {
            transform: 'rotate(0deg) translateX(130px) rotate(0deg)',
          },
          '100%': {
            transform: 'rotate(360deg) translateX(130px) rotate(-360deg)',
          },
        },
        dataFlow: {
          '0%': {
            transform: 'rotate(0deg) translateX(0px) scale(0)',
            opacity: '0'
          },
          '20%': {
            transform: 'rotate(0deg) translateX(60px) scale(1)',
            opacity: '1'
          },
          '80%': {
            transform: 'rotate(0deg) translateX(120px) scale(1)',
            opacity: '1'
          },
          '100%': {
            transform: 'rotate(0deg) translateX(150px) scale(0)',
            opacity: '0'
          }
        },
      },
    },
  },
  plugins: [],
}

export default config
