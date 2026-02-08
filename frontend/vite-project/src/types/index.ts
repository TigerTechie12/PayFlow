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

const isTestnet = import.meta.env.VITE_USE_TESTNET === 'true'

export const CHAIN_CONFIG: Record<Chain, { name: string, chainId: number, color: string, icon: string, explorer: string }> = {
  ethereum: {
    name: isTestnet ? 'Sepolia' : 'Ethereum',
    chainId: isTestnet ? 11155111 : 1,
    color: '#627EEA',
    icon: 'Ξ',
    explorer: isTestnet ? 'https://sepolia.etherscan.io/tx/' : 'https://etherscan.io/tx/'
  },
  base: {
    name: isTestnet ? 'Base Sepolia' : 'Base',
    chainId: isTestnet ? 84532 : 8453,
    color: '#0052FF',
    icon: 'B',
    explorer: isTestnet ? 'https://sepolia.basescan.org/tx/' : 'https://basescan.org/tx/'
  },
  arbitrum: {
    name: isTestnet ? 'Arb Sepolia' : 'Arbitrum',
    chainId: isTestnet ? 421614 : 42161,
    color: '#28A0F0',
    icon: 'A',
    explorer: isTestnet ? 'https://sepolia.arbiscan.io/tx/' : 'https://arbiscan.io/tx/'
  },
  polygon: {
    name: isTestnet ? 'Amoy' : 'Polygon',
    chainId: isTestnet ? 80002 : 137,
    color: '#8247E5',
    icon: 'P',
    explorer: isTestnet ? 'https://amoy.polygonscan.com/tx/' : 'https://polygonscan.com/tx/'
  },
  optimism: {
    name: isTestnet ? 'OP Sepolia' : 'Optimism',
    chainId: isTestnet ? 11155420 : 10,
    color: '#FF0420',
    icon: 'O',
    explorer: isTestnet ? 'https://sepolia-optimism.etherscan.io/tx/' : 'https://optimistic.etherscan.io/tx/'
  },
  sui: {
    name: 'Sui',
    chainId: 0,
    color: '#4DA2FF',
    icon: 'S',
    explorer: isTestnet ? 'https://suiscan.xyz/testnet/tx/' : 'https://suiscan.xyz/mainnet/tx/'
  },
}

export const SUPPORTED_TOKENS: Record<Chain, string[]> = {
  ethereum: ['ETH', 'USDC', 'USDT', 'DAI'],
  base: ['ETH', 'USDC', 'USDbC', 'DAI'],
  arbitrum: ['ETH', 'USDC', 'USDT', 'ARB'],
  polygon: ['MATIC', 'USDC', 'USDT', 'DAI'],
  optimism: ['ETH', 'USDC', 'USDT', 'OP'],
  sui: ['SUI', 'USDC'],
}
