import { createConfig, http } from 'wagmi'
import { mainnet, base, arbitrum, polygon, optimism } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

// Get a project ID from https://cloud.walletconnect.com/
// For production, replace this with your own project ID
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo'

export const wagmiConfig = createConfig({
  chains: [mainnet, base, arbitrum, polygon, optimism],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      metadata: {
        name: 'PayFlow',
        description: 'Universal Cross-Chain Payroll',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://payflow.app',
        icons: ['https://payflow.app/icon.png'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
