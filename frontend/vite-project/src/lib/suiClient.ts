import type { Payment, TransactionResult } from '../types';


const SUI_DECIMALS = 9;

export function suiAmountToMist(amount: string): bigint {
  const parsed = parseFloat(amount)
  return BigInt(Math.floor(parsed * 10 ** SUI_DECIMALS))
}

export async function executeSuiBatchPayment(
  payments: Payment[]
): Promise<TransactionResult> {
  if (payments.length === 0) {
    return { success: true, chain: 'sui' }
  }

  console.log(`[Sui] Building PTB for ${payments.length} payments`)

 
  await simulateDelay(2500)

  const totalMist = payments.reduce(
    (sum, p) => sum + suiAmountToMist(p.amount),
    BigInt(0)
  )

  console.log(
    `[Sui] PTB executed: ${payments.length} transfers, total: ${totalMist} MIST`
  )

  const txHash = `0x${Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`

  return {
    success: true,
    txHash,
    chain: 'sui',
  }
}

export function previewSuiBatch(payments: Payment[]): {
  operations: string[]
  totalAmount: string
  estimatedGas: string
} {
  const operations = payments.map(
    (p) => `splitCoins(gas, [${p.amount} SUI]) → transferObjects → ${p.recipient.slice(0, 10)}...`
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
