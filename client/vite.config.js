import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// This file is the Vite configuration for the Travel Planner MVP client application.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 5173 }
})
