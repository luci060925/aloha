import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rolldownOptions: {
      output: {
        // Las librerías cambian poco: en archivos aparte el navegador las guarda en caché
        // y en cada actualización del sitio solo se vuelve a descargar el código propio.
        codeSplitting: {
          groups: [
            { name: 'vendor-supabase', test: /node_modules[\\/]@supabase/ },
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
})
