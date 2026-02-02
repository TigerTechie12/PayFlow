import type { Payment, PaymentRoutes, Chain, Recipient } from '../types';


const EVM_CHAINS: Chain[] = ['ethereum', 'base', 'arbitrum', 'polygon', 'optimism']

export function categorizePayments(
  payments: Payment[],
  payerChain: Chain
): PaymentRoutes {
  const yellowPayments: Payment[] = []
  const lifiPayments: Payment[] = []
  const suiPayments: Payment[] = []

  for (const payment of payments) {
    if (payment.chain === 'sui') {
     
      suiPayments.push(payment)
    } else if (payment.chain === payerChain) {

      yellowPayments.push(payment)
    } else if (EVM_CHAINS.includes(payment.chain)) {
      
      lifiPayments.push(payment)
    }
  }

  return { yellowPayments, lifiPayments, suiPayments }
}

export function recipientsToPayments(recipients: Recipient[]): Payment[] {
  return recipients
    .filter((r) => r.status === 'pending')
    .map((r) => ({
      recipient: r.address,
      name: r.name,
      amount: r.amount,
      chain: r.chain,
      token: r.token,
    }))
}

export function calculateTotalAmount(payments: Payment[]): string {
  const total = payments.reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0)
  return total.toFixed(6)
}

export function estimateGasSavings(routes: PaymentRoutes): {
  withoutPayflow: number
  withPayflow: number
  savingsPercent: number
} {
  const yellowCount = routes.yellowPayments.length
  const lifiCount = routes.lifiPayments.length
  const suiCount = routes.suiPayments.length
  const total = yellowCount + lifiCount + suiCount

  const withoutPayflow = total

  const withPayflow =
    (yellowCount > 0 ? 1 : 0) +
    lifiCount +
    (suiCount > 0 ? 1 : 0)

  const savingsPercent = total > 0
    ? Math.round(((withoutPayflow - withPayflow) / withoutPayflow) * 100)
    : 0

  return { withoutPayflow, withPayflow, savingsPercent }
}

export function validatePayment(payment: Payment): string | null {
  if (!payment.recipient || payment.recipient.trim() === '') {
    return 'Recipient address is required'
  }
  if (!payment.amount || parseFloat(payment.amount) <= 0) {
    return 'Amount must be greater than 0'
  }
  if (payment.chain === 'sui') {
    if (!payment.recipient.startsWith('0x') || payment.recipient.length !== 66) {
      return 'Invalid Sui address format'
    }
  } else {
    if (!payment.recipient.startsWith('0x') || payment.recipient.length !== 42) {
      return 'Invalid EVM address format'
    }
  }
  return null
}
