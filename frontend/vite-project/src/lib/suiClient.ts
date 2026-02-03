import { Transaction } from '@mysten/sui/transactions'
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'
import type { Payment, TransactionResult } from '../types'

const SUI_DECIMALS = 9
const SUI_COIN_TYPE = '0x2::sui::SUI'

export const SUI_TOKEN_TYPES: Record<string, string> = {
  SUI: '0x2::sui::SUI',
  USDC: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
}

let _client: SuiClient | null = null

export function getSuiClient(): SuiClient {
  if (!_client) {
    _client = new SuiClient({ url: getFullnodeUrl('testnet') })
  }
  return _client
}

export function suiAmountToMist(amount: string): bigint {
  const parsed = parseFloat(amount)
  return BigInt(Math.floor(parsed * 10 ** SUI_DECIMALS))
}

export function buildSuiBatchPaymentTx(payments: Payment[]): Transaction {
  const tx = new Transaction()

  const coins = tx.splitCoins(
    tx.gas,
    payments.map((p) => tx.pure.u64(suiAmountToMist(p.amount))),
  )

  payments.forEach((payment, index) => {
    tx.transferObjects([coins[index]], tx.pure.address(payment.recipient))
  })

  return tx
}

export async function buildTokenBatchPaymentTx(
  payments: Payment[],
  senderAddress: string,
  coinType: string,
): Promise<Transaction> {
  const client = getSuiClient()

  const { data: coins } = await client.getCoins({
    owner: senderAddress,
    coinType,
  })

  if (coins.length === 0) {
    throw new Error(`No coins of type ${coinType} found for ${senderAddress}`)
  }

  const tx = new Transaction()

  const primaryCoin = tx.object(coins[0].coinObjectId)
  if (coins.length > 1) {
    tx.mergeCoins(
      primaryCoin,
      coins.slice(1).map((c) => tx.object(c.coinObjectId)),
    )
  }

  const splits = tx.splitCoins(
    primaryCoin,
    payments.map((p) => tx.pure.u64(suiAmountToMist(p.amount))),
  )

  payments.forEach((payment, index) => {
    tx.transferObjects([splits[index]], tx.pure.address(payment.recipient))
  })

  return tx
}

export async function executeSuiBatchPayment(
  payments: Payment[],
  signAndExecute?: (args: { transaction: Transaction }) => Promise<{ digest: string }>,
  senderAddress?: string,
): Promise<TransactionResult> {
  if (payments.length === 0) {
    return { success: true, chain: 'sui' }
  }

  console.log(`[Sui] Building PTB for ${payments.length} payments`)

  const allSui = payments.every((p) => p.token.toUpperCase() === 'SUI')

  let tx: Transaction

  if (allSui) {
    tx = buildSuiBatchPaymentTx(payments)
  } else if (senderAddress) {
    const coinType = SUI_TOKEN_TYPES[payments[0].token.toUpperCase()] ?? SUI_COIN_TYPE
    tx = await buildTokenBatchPaymentTx(payments, senderAddress, coinType)
  } else {
    tx = buildSuiBatchPaymentTx(payments)
  }

  if (signAndExecute) {
    try {
      const result = await signAndExecute({ transaction: tx })

      const client = getSuiClient()
      const txDetails = await client.waitForTransaction({
        digest: result.digest,
        options: { showEffects: true, showBalanceChanges: true },
      })

      const status = txDetails.effects?.status?.status
      if (status === 'failure') {
        const errorMsg = txDetails.effects?.status?.error ?? 'Transaction failed'
        console.error(`[Sui] PTB failed: ${errorMsg}`)
        return { success: false, error: errorMsg, chain: 'sui' }
      }

      console.log(`[Sui] PTB executed on-chain: ${result.digest}`)
      return { success: true, txHash: result.digest, chain: 'sui' }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sui execution failed'
      console.warn('[Sui] On-chain execution failed:', msg)
      return { success: false, error: msg, chain: 'sui' }
    }
  }

  await simulateDelay(2500)

  const totalMist = payments.reduce(
    (sum, p) => sum + suiAmountToMist(p.amount),
    BigInt(0),
  )

  console.log(
    `[Sui] PTB demo-executed: ${payments.length} transfers, total: ${totalMist} MIST`,
  )

  const txHash = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('')}`

  return { success: true, txHash, chain: 'sui' }
}

export async function estimateSuiBatchGas(
  payments: Payment[],
  senderAddress: string,
): Promise<{ totalGasMist: bigint; totalGasSui: number }> {
  const client = getSuiClient()
  const tx = buildSuiBatchPaymentTx(payments)
  tx.setSender(senderAddress)

  const txBytes = await tx.build({ client })
  const dryRun = await client.dryRunTransactionBlock({
    transactionBlock: txBytes,
  })

  const { computationCost, storageCost, storageRebate } = dryRun.effects.gasUsed
  const totalGasMist =
    BigInt(computationCost) + BigInt(storageCost) - BigInt(storageRebate)
  const totalGasSui = Number(totalGasMist) / 1_000_000_000

  return { totalGasMist, totalGasSui }
}

export function previewSuiBatch(payments: Payment[]): {
  operations: string[]
  totalAmount: string
  estimatedGas: string
} {
  const operations = payments.map(
    (p) =>
      `splitCoins(gas, [${p.amount} SUI]) → transferObjects → ${p.recipient.slice(0, 10)}...`,
  )

  const totalAmount = payments
    .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)
    .toFixed(4)

  const estimatedGas = (0.001 * payments.length + 0.002).toFixed(6)

  return { operations, totalAmount, estimatedGas }
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}