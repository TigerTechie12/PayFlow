import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'react-vendor'
            }
            if (id.includes('@mysten')) {
              return 'sui-vendor'
            }
            if (id.includes('@lifi')) {
              return 'lifi-vendor'
            }
            if (id.includes('@erc7824') || id.includes('nitrolite')) {
              return 'yellow-vendor'
            }
            if (id.includes('lucide') || id.includes('zustand')) {
              return 'ui-vendor'
            }
            if (id.includes('viem') || id.includes('ox')) {
              return 'web3-vendor'
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    cssCodeSplit: false,
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@mysten/dapp-kit', 'wagmi', '@wagmi/core'],
  },
})
