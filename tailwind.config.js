/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5fe',
          100: '#e6eefb',
          200: '#bdd4f7',
          300: '#93b5f3',
          400: '#6996ef',
          500: '#2563eb',
          600: '#1e4fb8',
          700: '#1a44a3',
          800: '#153a8a',
          900: '#0f2b66',
          DEFAULT: '#2563eb',
        },
      },
    },
  },
  plugins: [],
};
