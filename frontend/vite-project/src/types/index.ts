export type Chain = 'base' | 'arbitrum' | 'polygon' | 'optimism' | 'sui' | 'ethereum'

export type RecipientStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Recipient {
  id: string
  name: string
  address: string
  amount: string
  chain: Chain
  token: string
  status: RecipientStatus
  txHash?: string
  error?: string
}

export interface Payment {
  recipient: string
  name: string
  amount: string
  chain: Chain
  token: string
}

export interface PaymentRoutes {
  yellowPayments: Payment[]
  lifiPayments: Payment[]
  suiPayments: Payment[]
}

export interface TransactionResult {
  success: boolean
  txHash?: string
  error?: string
  chain: Chain
}

export interface SessionStatus {
  isActive: boolean
  deposited: string
  spent: string
  remaining: string
  queuedPayments: number
}

export interface Quote {
  fromChain: Chain
  toChain: Chain
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  estimatedGas: string
  route?: string
}

export interface PayrollSession {
  id: string
  totalAmount: string
  recipients: Recipient[]
  status: 'draft' | 'executing' | 'completed'
  yellowTxHash?: string
  suiTxHash?: string
  lifiTxHashes?: string[]
  createdAt: number
}

export const CHAIN_CONFIG: Record<Chain, { name: string, chainId: number, color: string, icon: string }> = {
  ethereum: { name: 'Ethereum', chainId: 1, color: '#627EEA', icon: 'Ξ' },
  base: { name: 'Base', chainId: 8453, color: '#0052FF', icon: 'B' },
  arbitrum: { name: 'Arbitrum', chainId: 42161, color: '#28A0F0', icon: 'A' },
  polygon: { name: 'Polygon', chainId: 137, color: '#8247E5', icon: 'P' },
  optimism: { name: 'Optimism', chainId: 10, color: '#FF0420', icon: 'O' },
  sui: { name: 'Sui', chainId: 0, color: '#4DA2FF', icon: 'S' },
}

export const SUPPORTED_TOKENS: Record<Chain, string[]> = {
  ethereum: ['ETH', 'USDC', 'USDT', 'DAI'],
  base: ['ETH', 'USDC', 'USDbC', 'DAI'],
  arbitrum: ['ETH', 'USDC', 'USDT', 'ARB'],
  polygon: ['MATIC', 'USDC', 'USDT', 'DAI'],
  optimism: ['ETH', 'USDC', 'USDT', 'OP'],
  sui: ['SUI', 'USDC'],
}
