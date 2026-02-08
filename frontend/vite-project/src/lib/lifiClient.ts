import { createConfig, getQuote, executeRoute, getStatus } from '@lifi/sdk'
import type { Chain, Payment, Quote, TransactionResult } from '../types'
import { CHAIN_CONFIG } from '../types'

// Use dynamic chain IDs from config (supports testnet/mainnet)
export const LIFI_CHAIN_IDS: Record<string, number> = {
  ethereum: CHAIN_CONFIG.ethereum.chainId,
  base: CHAIN_CONFIG.base.chainId,
  arbitrum: CHAIN_CONFIG.arbitrum.chainId,
  polygon: CHAIN_CONFIG.polygon.chainId,
  optimism: CHAIN_CONFIG.optimism.chainId,
}

export const USDC_ADDRESSES: Record<string, string> = {
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  polygon: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
}

export const USDT_ADDRESSES: Record<string, string> = {
  ethereum: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
  polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
  optimism: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
}

export const DAI_ADDRESSES: Record<string, string> = {
  ethereum: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  base: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
  arbitrum: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
  polygon: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
}

const NATIVE_TOKEN = '0x0000000000000000000000000000000000000000'

const DEMO_MODE = typeof window === 'undefined' || !window.ethereum

let isInitialized = false

export function initializeLifi(): void {
  if (isInitialized) return

  if (!DEMO_MODE) {
    createConfig({ integrator: 'payflow' })
  }

  isInitialized = true
  console.log(`[LI.FI] SDK initialized (demo=${DEMO_MODE})`)
}

export function resolveTokenAddress(chain: string, token: string): string {
  const upper = token.toUpperCase()
  if (['ETH', 'MATIC', 'POL'].includes(upper)) return NATIVE_TOKEN
  if (upper === 'USDC') return USDC_ADDRESSES[chain] ?? NATIVE_TOKEN
  if (upper === 'USDT') return USDT_ADDRESSES[chain] ?? NATIVE_TOKEN
  if (upper === 'DAI') return DAI_ADDRESSES[chain] ?? NATIVE_TOKEN
  return NATIVE_TOKEN
}

export async function getPaymentQuote(
  fromChain: Chain,
  toChain: Chain,
  fromToken: string,
  toToken: string,
  amount: string,
  fromAddress?: string,
  toAddress?: string,
): Promise<Quote> {
  initializeLifi()

  const fromChainId = LIFI_CHAIN_IDS[fromChain]
  const toChainId = LIFI_CHAIN_IDS[toChain]

  if (!fromChainId || !toChainId) {
    throw new Error(`Unsupported chain pair: ${fromChain} → ${toChain}`)
  }

  if (!DEMO_MODE && fromAddress) {
    try {
      const quoteParams: Record<string, unknown> = {
        fromChain: fromChainId,
        toChain: toChainId,
        fromToken: resolveTokenAddress(fromChain, fromToken),
        toToken: resolveTokenAddress(toChain, toToken),
        fromAmount: amount,
        fromAddress,
      }

      if (toAddress) {
        quoteParams.toAddress = toAddress
      }

      const quote = await getQuote(quoteParams as Parameters<typeof getQuote>[0])

      return {
        fromChain,
        toChain,
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: quote.estimate?.toAmount ?? amount,
        estimatedGas: quote.estimate?.gasCosts?.[0]?.amount ?? '0',
        route: `${CHAIN_CONFIG[fromChain].name} → ${CHAIN_CONFIG[toChain].name} via ${quote.toolDetails?.name ?? 'LI.FI'}`,
      }
    } catch (err) {
      console.warn('[LI.FI] Real quote failed, falling back to estimate:', err)
    }
  }

  const slippage = 0.003
  const bridgeFee = 0.001
  const parsedAmount = parseFloat(amount)
  const estimatedReceived = parsedAmount * (1 - slippage - bridgeFee)

  return {
    fromChain,
    toChain,
    fromToken,
    toToken,
    fromAmount: amount,
    toAmount: estimatedReceived.toFixed(6),
    estimatedGas: (0.002 + Math.random() * 0.003).toFixed(6),
    route: `${CHAIN_CONFIG[fromChain].name} → ${CHAIN_CONFIG[toChain].name} via Stargate`,
  }
}

export async function routeCrossChainPayment(
  fromChain: Chain,
  toChain: Chain,
  toToken: string,
  amount: string,
  recipient: string,
  fromAddress?: string,
): Promise<TransactionResult> {
  initializeLifi()

  console.log(
    `[LI.FI] Routing ${amount} from ${fromChain} to ${toChain} (${toToken}) → ${recipient}`,
  )

  if (!DEMO_MODE && fromAddress) {
    try {
      const quoteRequest = {
        fromChain: LIFI_CHAIN_IDS[fromChain],
        toChain: LIFI_CHAIN_IDS[toChain],
        fromToken: resolveTokenAddress(fromChain, 'USDC'),
        toToken: resolveTokenAddress(toChain, toToken),
        fromAmount: amount,
        fromAddress,
        toAddress: recipient,
      }

      const quote = await getQuote(quoteRequest as any)

      const executedRoute = await executeRoute(quote as any, {
        updateRouteHook: (updatedRoute) => {
          console.log('[LI.FI] Route progress:', updatedRoute.id)
        },
      })

      const txHash =
        (executedRoute as any).steps?.[0]?.execution?.process?.[0]?.txHash ??
        `0x${Date.now().toString(16)}`

      return { success: true, txHash, chain: toChain }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'LI.FI execution failed'
      console.warn('[LI.FI] Real execution failed:', msg)
      return { success: false, error: msg, chain: toChain }
    }
  }

  await simulateDelay(3000 + Math.random() * 2000)

  const txHash = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('')}`

  console.log(`[LI.FI] Cross-chain transfer complete: ${txHash}`)
  return { success: true, txHash, chain: toChain }
}

export async function pollTransferStatus(
  txHash: string,
  fromChainId: number,
  toChainId: number,
  bridge?: string,
): Promise<{ status: string; substatus?: string }> {
  try {
    const result = await getStatus({
      txHash,
      fromChain: fromChainId,
      toChain: toChainId,
      bridge,
    } as Parameters<typeof getStatus>[0])
    return {
      status: result.status ?? 'PENDING',
      substatus: result.substatus,
    }
  } catch {
    return { status: 'UNKNOWN' }
  }
}

export async function executeLifiBatchPayments(
  payments: Payment[],
  fromChain: Chain,
  onProgress?: (index: number, total: number, result: TransactionResult) => void,
  fromAddress?: string,
): Promise<TransactionResult[]> {
  initializeLifi()
  const results: TransactionResult[] = []

  for (let i = 0; i < payments.length; i++) {
    const payment = payments[i]
    try {
      const result = await routeCrossChainPayment(
        fromChain,
        payment.chain,
        payment.token,
        payment.amount,
        payment.recipient,
        fromAddress,
      )
      results.push(result)
      onProgress?.(i, payments.length, result)
    } catch (error) {
      const failResult: TransactionResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        chain: payment.chain,
      }
      results.push(failResult)
      onProgress?.(i, payments.length, failResult)
    }
  }

  return results
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}