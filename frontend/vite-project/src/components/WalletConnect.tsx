import { useState, useCallback } from 'react'
import { Wallet, Link, Unlink, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import { usePayFlowStore } from '../lib/store'
import type { Chain } from '../types'
import { CHAIN_CONFIG } from '../types'

const EVM_CHAINS: Chain[] = ['ethereum', 'base', 'arbitrum', 'polygon', 'optimism']

const CHAIN_RPC: Record<Chain, { chainId: string, chainName: string, rpcUrls: string[], nativeCurrency: { name: string, symbol: string, decimals: number } }> = {
  ethereum: { chainId: '0x1', chainName: 'Ethereum', rpcUrls: ['https://eth.llamarpc.com'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  base: { chainId: '0x2105', chainName: 'Base', rpcUrls: ['https://mainnet.base.org'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  arbitrum: { chainId: '0xa4b1', chainName: 'Arbitrum One', rpcUrls: ['https://arb1.arbitrum.io/rpc'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  polygon: { chainId: '0x89', chainName: 'Polygon', rpcUrls: ['https://polygon-rpc.com'], nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 } },
  optimism: { chainId: '0xa', chainName: 'Optimism', rpcUrls: ['https://mainnet.optimism.io'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  sui: { chainId: '0x0', chainName: 'Sui', rpcUrls: [], nativeCurrency: { name: 'SUI', symbol: 'SUI', decimals: 9 } },
}

export function WalletConnect() {
  const {
    evmAddress,
    suiAddress,
    payerChain,
    isEvmConnected,
    isSuiConnected,
    setEvmWallet,
    setSuiWallet,
    setPayerChain,
  } = usePayFlowStore()

  const [showChainDropdown, setShowChainDropdown] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const connectEvm = useCallback(async () => {
    setIsConnecting(true)
    setConnectError(null)

    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        }) as string[]

        if (accounts && accounts.length > 0) {
          setEvmWallet(accounts[0])
          console.log('[Wallet] Connected EVM wallet:', accounts[0])
          setIsConnecting(false)
          return
        }
      } catch (err) {
        console.warn('[Wallet] MetaMask connection failed:', err)
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 500))
    const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68'
    setEvmWallet(mockAddress)
    console.log('[Wallet] Demo mode: using mock EVM address')
    setIsConnecting(false)
  }, [setEvmWallet])

  const connectSui = useCallback(async () => {
    setIsConnecting(true)
    setConnectError(null)

    await new Promise((resolve) => setTimeout(resolve, 500))
    const mockAddress = '0x' + 'a'.repeat(64)
    setSuiWallet(mockAddress)
    console.log('[Wallet] Demo mode: using mock Sui address')
    setIsConnecting(false)
  }, [setSuiWallet])

  const disconnectEvm = useCallback(() => {
    setEvmWallet(null)
    setConnectError(null)
  }, [setEvmWallet])

  const disconnectSui = useCallback(() => {
    setSuiWallet(null)
    setConnectError(null)
  }, [setSuiWallet])

  const switchChain = useCallback(async (chain: Chain) => {
    if (chain === 'sui') return

    const chainConfig = CHAIN_RPC[chain]

    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainConfig.chainId }],
        })
      } catch (switchError: unknown) {
        if ((switchError as { code?: number })?.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [chainConfig],
            })
          } catch {
            console.warn('[Wallet] Failed to add chain')
          }
        }
      }
    }

    setPayerChain(chain)
    setShowChainDropdown(false)
  }, [setPayerChain])

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div className="flex flex-wrap items-center gap-3">
      {connectError && (
        <div className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle size={12} />
          {connectError}
        </div>
      )}

      <div className="flex items-center gap-2">
        {isEvmConnected ? (
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
            <span className="text-sm text-gray-300 font-mono">
              {truncateAddress(evmAddress!)}
            </span>
            <button
              onClick={disconnectEvm}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Disconnect EVM"
            >
              <Unlink size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={connectEvm}
            disabled={isConnecting}
            className="btn-primary flex items-center gap-2 text-sm disabled:opacity-70"
          >
            {isConnecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wallet size={16} />
            )}
            {isConnecting ? 'Connecting...' : 'Connect EVM'}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isSuiConnected ? (
          <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm text-gray-300 font-mono">
              {truncateAddress(suiAddress!)}
            </span>
            <button
              onClick={disconnectSui}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Disconnect Sui"
            >
              <Unlink size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={connectSui}
            disabled={isConnecting}
            className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-70"
          >
            {isConnecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Link size={16} />
            )}
            {isConnecting ? 'Connecting...' : 'Connect Sui'}
          </button>
        )}
      </div>

      {isEvmConnected && (
        <div className="relative">
          <button
            onClick={() => setShowChainDropdown(!showChainDropdown)}
            className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm hover:border-gray-600 transition-colors"
          >
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CHAIN_CONFIG[payerChain].color }}
            />
            <span>{CHAIN_CONFIG[payerChain].name}</span>
            <ChevronDown size={14} className="text-gray-500" />
          </button>
          {showChainDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowChainDropdown(false)}
              />
              <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px]">
                {EVM_CHAINS.map((chain) => (
                  <button
                    key={chain}
                    onClick={() => switchChain(chain)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      chain === payerChain ? 'text-primary-400' : 'text-gray-300'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHAIN_CONFIG[chain].color }}
                    />
                    {CHAIN_CONFIG[chain].name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {(isEvmConnected || isSuiConnected) && !window.ethereum && (
        <span className="text-xs text-yellow-500 px-2 py-1 bg-yellow-900/20 rounded-full">
          Demo Mode
        </span>
      )}
    </div>
  )
}
