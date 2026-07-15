import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Local `npm run dev` → base `/`
// `npm run build` / GitHub Pages → /crypto-repo-tracker/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/crypto-repo-tracker/' : '/',
  plugins: [react(), tailwindcss()],
}));
