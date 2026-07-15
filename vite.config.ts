import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Custom domain (devtrack.nodesandbits.tech) serves from site root → base `/`.
// Also correct for local `npm run dev`.
export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss()],
});
