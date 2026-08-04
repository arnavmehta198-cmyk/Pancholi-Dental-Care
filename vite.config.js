import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Keep animation modules behind their dynamic import boundaries. Rolldown's
// default async chunking avoids promoting shared animation dependencies into
// the initial entry graph.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
  },
  build: {
    sourcemap: false,
  },
})
