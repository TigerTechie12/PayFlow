import { createConfig, http } from 'wagmi'
import {
  mainnet, base, arbitrum, polygon, optimism,
  sepolia, baseSepolia, arbitrumSepolia, polygonAmoy, optimismSepolia
} from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo'

const isTestnet = import.meta.env.VITE_USE_TESTNET === 'true'

const mainnetChains = [mainnet, base, arbitrum, polygon, optimism] as const
const testnetChains = [sepolia, baseSepolia, arbitrumSepolia, polygonAmoy, optimismSepolia] as const

const chains = isTestnet ? testnetChains : mainnetChains

export const wagmiConfig = createConfig({
  chains,
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
    
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [optimismSepolia.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
