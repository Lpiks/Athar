/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#060610',
          pure: '#030308',
          card: '#0D0E1A',
          surface: '#141624',
          border: '#1F2236',
        },
        gold: {
          DEFAULT: '#C5A059',
          light: '#E5C378',
          dark: '#9B7836',
          muted: '#8C7443',
        },
        emerald: {
          deep: '#071F1A',
          DEFAULT: '#0E3A2F',
          vivid: '#155B49',
          light: '#1E7C64',
        },
        spiritual: {
          text: '#F5F5F7',
          muted: '#8E90A6',
          subtle: '#52556B',
        },
      },
      fontFamily: {
        uthmani: ['Amiri', 'Traditional Arabic', 'serif'],
      },
    },
  },
  plugins: [],
};
