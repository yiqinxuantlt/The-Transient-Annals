import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isDesktopBuild = process.env.VITE_DESKTOP === 'true'

// https://vite.dev/config/
export default defineConfig({
  base: isDesktopBuild ? './' : '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('reactflow')) return 'graph-vendor'
          if (id.includes('@dagrejs')) return 'layout-vendor'
          return undefined
        },
      },
    },
  },
})
