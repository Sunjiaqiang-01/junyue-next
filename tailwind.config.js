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
        primary: '#1A2B5C', // 深蓝色
        secondary: '#D4AF37', // 金色
        background: '#FFFFFF', // 白色
        card: '#F5F5F5', // 浅灰
        nanjing: '#D4AF37', // 金陵金
        suzhou: '#10B981', // 园林绿
        hangzhou: '#3B82F6', // 西湖蓝
        wuhan: '#EC4899', // 樱花粉
        zhengzhou: '#F97316', // 黄河金
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 