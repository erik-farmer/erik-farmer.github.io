/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      typography: (theme) => ({
        dark: {
          css: {
            color: theme('colors.gray.200'),
            a: { color: theme('colors.blue.400') },
            strong: { color: theme('colors.gray.100') },
            'blockquote p': { color: theme('colors.gray.300') },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
};