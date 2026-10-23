import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // o pacote compartilhado do monorepo é CommonJS (também usado pelo backend)
  optimizeDeps: {
    include: ['@RoteiroNutri/shared'],
  },
  build: {
    commonjsOptions: {
      include: [/packages\/shared/, /node_modules/],
    },
  },
  server: {
    port: 5173,
  },
})
