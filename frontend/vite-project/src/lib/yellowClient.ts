import type { TransactionResult, SessionStatus, Payment } from '../types';


interface QueuedPayment {
  recipient: string
  amount: string
  token: string
  timestamp: number
}

export class YellowSession {
  private isInitialized = false
  private depositAmount = '0'
  private token = ''
  private queuedPayments: QueuedPayment[] = []
  private spentAmount = 0
  private sessionId: string | null = null

  async initialize(depositAmount: string, token: string): Promise<void> {
    
    await this.simulateDelay(1500)

    this.depositAmount = depositAmount
    this.token = token
    this.isInitialized = true
    this.sessionId = `yellow-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    this.queuedPayments = []
    this.spentAmount = 0

    console.log(`[Yellow] Session ${this.sessionId} initialized with ${depositAmount} ${token}`)
  }

  async queuePayment(recipient: string, amount: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Yellow session not initialized. Call initialize() first.')
    }

    const newSpent = this.spentAmount + parseFloat(amount)
    if (newSpent > parseFloat(this.depositAmount)) {
      throw new Error(
        `Insufficient session balance. Deposited: ${this.depositAmount}, Trying to spend: ${newSpent}`
      )
    }

    await this.simulateDelay(200);

    this.queuedPayments.push({
      recipient,
      amount,
      token: this.token,
      timestamp: Date.now(),
    })
    this.spentAmount = newSpent

    console.log(`[Yellow] Queued payment: ${amount} ${this.token} → ${recipient}`)
  }

  async settleAll(): Promise<TransactionResult> {
    if (!this.isInitialized) {
      throw new Error('Yellow session not initialized')
    }

    if (this.queuedPayments.length === 0) {
      return { success: true, txHash: undefined, chain: 'ethereum' }
    }

    
    await this.simulateDelay(3000)

    const txHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`

    console.log(
      `[Yellow] Settled ${this.queuedPayments.length} payments in tx: ${txHash}`
    )

    const result: TransactionResult = {
      success: true,
      txHash,
      chain: 'ethereum',
    }

    this.queuedPayments = []
    this.spentAmount = 0

    return result
  }

  async getSessionStatus(): Promise<SessionStatus> {
    return {
      isActive: this.isInitialized,
      deposited: this.depositAmount,
      spent: this.spentAmount.toFixed(6),
      remaining: (parseFloat(this.depositAmount) - this.spentAmount).toFixed(6),
      queuedPayments: this.queuedPayments.length,
    }
  }

  getQueuedPayments(): QueuedPayment[] {
    return [...this.queuedPayments]
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export async function executeYellowBatchPayment(
  payments: Payment[],
  token: string
): Promise<TransactionResult> {
  const session = new YellowSession();

  const totalAmount = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount || '0'),
    0
  )


  await session.initialize(totalAmount.toFixed(6), token);

  
  for (const payment of payments) {
    await session.queuePayment(payment.recipient, payment.amount);
  }

  
  return session.settleAll();
}
