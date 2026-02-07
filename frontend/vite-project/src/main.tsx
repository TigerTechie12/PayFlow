import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { SuiClientProvider, WalletProvider, createNetworkConfig, lightTheme } from '@mysten/dapp-kit'
import { getFullnodeUrl } from '@mysten/sui/client'
import { wagmiConfig } from './lib/wagmiConfig'
import '@mysten/dapp-kit/dist/index.css'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl('testnet') },
  mainnet: { url: getFullnodeUrl('mainnet') },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider
            stashedWallet={{
              name: 'PayFlow',
            }}
            preferredWallets={['Sui Wallet', 'Suiet', 'Ethos Wallet']}
            theme={lightTheme}
          >
            <App />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
)
