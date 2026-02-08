import { useState, useCallback, useEffect } from 'react'
import { Wallet, Unlink, ChevronDown, Loader2 } from 'lucide-react'
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { ConnectModal, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit'
import { usePayFlowStore } from '../lib/store'
import type { Chain } from '../types'
import { CHAIN_CONFIG } from '../types'

const EVM_CHAINS: Chain[] = ['ethereum', 'base', 'arbitrum', 'polygon', 'optimism']

const getChainId = (chain: Chain): number => CHAIN_CONFIG[chain].chainId

export function WalletConnect() {
  const {
    payerChain,
    setEvmWallet,
    setSuiWallet,
    setPayerChain,
  } = usePayFlowStore()

  const [showChainDropdown, setShowChainDropdown] = useState(false)
  const [showWalletOptions, setShowWalletOptions] = useState(false)

  const { address: evmAddress, isConnected: isEvmConnected } = useAccount()
  const { connect, connectors, isPending: isConnecting } = useConnect()
  const { disconnect: disconnectEvm } = useDisconnect()
  const { switchChain } = useSwitchChain()

  const suiAccount = useCurrentAccount()
  const { mutate: disconnectSuiWallet } = useDisconnectWallet()

  const isSuiWalletConnected = !!suiAccount?.address


  useEffect(() => {
    if (evmAddress) {
      setEvmWallet(evmAddress)
      console.log('[Wallet] Connected EVM wallet:', evmAddress)
    } else {
      setEvmWallet(null)
    }
  }, [evmAddress, setEvmWallet])

  useEffect(() => {
    if (suiAccount?.address) {
      setSuiWallet(suiAccount.address)
      console.log('[Wallet] Connected Sui wallet:', suiAccount.address)
    } else {
      setSuiWallet(null)
    }
  }, [suiAccount?.address, setSuiWallet])

  const handleEvmConnect = useCallback((connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId || c.name.toLowerCase().includes(connectorId.toLowerCase()))
    if (connector) {
      connect({ connector })
    }
    setShowWalletOptions(false)
  }, [connect, connectors])

  const handleDisconnectEvm = useCallback(() => {
    disconnectEvm()
    setEvmWallet(null)
  }, [disconnectEvm, setEvmWallet])

  const disconnectSui = useCallback(() => {
    disconnectSuiWallet()
    setSuiWallet(null)
  }, [disconnectSuiWallet, setSuiWallet])

  const handleSwitchChain = useCallback(async (chain: Chain) => {
    if (chain === 'sui') return

    const chainId = getChainId(chain)
    if (chainId && switchChain) {
      try {
        switchChain({ chainId: chainId as any })
      } catch (err) {
        console.warn('[Wallet] Failed to switch chain:', err)
      }
    }

    setPayerChain(chain)
    setShowChainDropdown(false)
  }, [setPayerChain, switchChain])

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`

  
  const injectedConnector = connectors.find(c => c.id === 'injected')
  const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')

  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
      <div className="flex items-center gap-2">
        {isEvmConnected && evmAddress ? (
          <div className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
            <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
            <span className="text-xs sm:text-sm text-gray-300 font-mono">
              {truncateAddress(evmAddress)}
            </span>
            <button
              onClick={handleDisconnectEvm}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Disconnect EVM"
            >
              <Unlink size={12} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => setShowWalletOptions(!showWalletOptions)}
              disabled={isConnecting}
              className="btn-primary flex items-center gap-1.5 text-xs sm:text-sm py-1.5 px-2 sm:px-4 disabled:opacity-70"
            >
              {isConnecting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Wallet size={14} />
              )}
              <span className="hidden xs:inline">{isConnecting ? 'Connecting...' : 'Connect EVM'}</span>
              <span className="xs:hidden">{isConnecting ? '...' : 'EVM'}</span>
            </button>

            {showWalletOptions && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowWalletOptions(false)}
                />
                <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[180px] p-2">
                  <p className="text-xs text-gray-400 px-2 pb-2">Select wallet</p>

                  {injectedConnector && (
                    <button
                      onClick={() => handleEvmConnect('injected')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <span className="text-lg">🦊</span>
                      Browser Wallet
                    </button>
                  )}

                  {walletConnectConnector && (
                    <button
                      onClick={() => handleEvmConnect('walletConnect')}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <span className="text-lg">📱</span>
                      WalletConnect
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isSuiWalletConnected ? (
          <div className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs sm:text-sm text-gray-300 font-mono">
              {truncateAddress(suiAccount?.address || '')}
            </span>
            <button
              onClick={disconnectSui}
              className="text-gray-500 hover:text-red-400 transition-colors"
              title="Disconnect Sui"
            >
              <Unlink size={12} />
            </button>
          </div>
        ) : (
          <ConnectModal
            trigger={
              <button
                type="button"
                className="btn-secondary flex items-center gap-1.5 text-xs sm:text-sm py-1.5 px-2 sm:px-4"
              >
                <span className="hidden xs:inline">Connect Sui</span>
                <span className="xs:hidden">Sui</span>
              </button>
            }
          />
        )}
      </div>

      {isEvmConnected && (
        <div className="relative">
          <button
            onClick={() => setShowChainDropdown(!showChainDropdown)}
            className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm hover:border-gray-600 transition-colors"
          >
            <span
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: CHAIN_CONFIG[payerChain].color }}
            />
            <span className="hidden sm:inline">{CHAIN_CONFIG[payerChain].name}</span>
            <span className="sm:hidden">{CHAIN_CONFIG[payerChain].icon}</span>
            <ChevronDown size={12} className="text-gray-500" />
          </button>
          {showChainDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowChainDropdown(false)}
              />
              <div className="absolute top-full mt-1 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[140px]">
                {EVM_CHAINS.map((chain) => (
                  <button
                    key={chain}
                    onClick={() => handleSwitchChain(chain)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      chain === payerChain ? 'text-primary-400' : 'text-gray-300'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
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
    </div>
  )
}
