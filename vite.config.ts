import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A aplicação é publicada em https://www.missaoconsciencia.com.br/quiz
// então o base path é sempre /quiz/ (inclusive no dev server: http://localhost:5173/quiz/).
export default defineConfig({
  base: '/quiz/',
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
});
