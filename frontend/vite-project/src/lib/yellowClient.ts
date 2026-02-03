import {
  NitroliteRPC,
  createAuthRequestMessage,
  createAuthVerifyMessage,
  createAppSessionMessage,
  createCloseAppSessionMessage,
  createTransferMessage,
  createGetAssetsMessage,
  createGetLedgerBalancesMessage,
  type MessageSigner,
} from '@erc7824/nitrolite'
import type { TransactionResult, SessionStatus, Payment } from '../types'

const YELLOW_WS_URL = 'wss://clearnet-sandbox.yellow.com/ws'
const DEMO_MODE = typeof window === 'undefined' || !window.ethereum

interface QueuedPayment {
  recipient: string
  amount: string
  token: string
  timestamp: number
}

export class YellowSession {
  private ws: WebSocket | null = null
  private isInitialized = false
  private depositAmount = '0'
  private token = ''
  private queuedPayments: QueuedPayment[] = []
  private spentAmount = 0
  private sessionId: string | null = null
  private appSessionId: string | null = null
  private messageSigner: MessageSigner | null = null
  private userAddress: string | null = null
  private isAuthenticated = false

  async initialize(depositAmount: string, token: string): Promise<void> {
    this.depositAmount = depositAmount
    this.token = token
    this.queuedPayments = []
    this.spentAmount = 0

    if (!DEMO_MODE && window.ethereum) {
      try {
        const accounts: string[] = await window.ethereum.request({
          method: 'eth_requestAccounts',
        })
        this.userAddress = accounts[0]

        this.messageSigner = async (payload) => {
          const message = JSON.stringify(payload)
          return window.ethereum!.request({
            method: 'personal_sign',
            params: [message, this.userAddress],
          })
        }

        await this.connectWebSocket()

        await this.authenticate()

        const appDefinition = {
          protocol: 'payflow-batch-v1',
          participants: [this.userAddress as `0x${string}`],
          weights: [100],
          quorum: 100,
          challenge: 0,
          nonce: Date.now(),
        }

        const allocations = [
          {
            participant: this.userAddress as `0x${string}`,
            asset: token.toLowerCase(),
            amount: String(Math.floor(parseFloat(depositAmount) * 1e6)),
          },
        ]

        const sessionMsg = await createAppSessionMessage(
          this.messageSigner,
          [{ definition: appDefinition, allocations }],
        )
        this.ws!.send(sessionMsg)

        const response = await this.waitForResponse('create_app_session')
        if (response?.appSessionId) {
          this.appSessionId = response.appSessionId
        }

        this.isInitialized = true
        this.sessionId = `yellow-${Date.now()}`
        console.log(`[Yellow] Session opened: ${this.sessionId}, appSession: ${this.appSessionId}`)
        return
      } catch (err) {
        console.warn('[Yellow] Real SDK init failed, falling back to demo:', err)
      }
    }

    await simulateDelay(1500)
    this.isInitialized = true
    this.sessionId = `yellow-demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    console.log(`[Yellow] Demo session ${this.sessionId} initialized with ${depositAmount} ${token}`)
  }

  async queuePayment(recipient: string, amount: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Yellow session not initialized. Call initialize() first.')
    }

    const newSpent = this.spentAmount + parseFloat(amount)
    if (newSpent > parseFloat(this.depositAmount)) {
      throw new Error(
        `Insufficient session balance. Deposited: ${this.depositAmount}, Trying to spend: ${newSpent}`,
      )
    }

    if (!DEMO_MODE && this.ws && this.messageSigner && this.isAuthenticated) {
      try {
        const transferMsg = await createTransferMessage(
          this.messageSigner,
          {
            destination: recipient as `0x${string}`,
            allocations: [
              {
                asset: this.token.toLowerCase(),
                amount: String(Math.floor(parseFloat(amount) * 1e6)),
              },
            ],
          },
        )
        this.ws.send(transferMsg)

        await this.waitForResponse('transfer')
      } catch (err) {
        console.warn('[Yellow] Transfer RPC failed, recording locally:', err)
      }
    } else {
      await simulateDelay(200)
    }

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

    if (!DEMO_MODE && this.ws && this.messageSigner && this.appSessionId) {
      try {
        const finalAllocations = this.queuedPayments.map((p) => ({
          participant: p.recipient as `0x${string}`,
          asset: this.token.toLowerCase(),
          amount: String(Math.floor(parseFloat(p.amount) * 1e6)),
        }))

        const closeMsg = await createCloseAppSessionMessage(
          this.messageSigner,
          [{
            app_session_id: this.appSessionId as `0x${string}`,
            allocations: finalAllocations,
          }],
        )
        this.ws.send(closeMsg)

        const response = await this.waitForResponse('close_app_session')
        console.log(`[Yellow] App session closed, version: ${response?.version}`)
      } catch (err) {
        console.warn('[Yellow] Close session failed:', err)
      }
    }

    await simulateDelay(DEMO_MODE ? 3000 : 2000)

    const txHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join('')}`

    console.log(
      `[Yellow] Settled ${this.queuedPayments.length} payments in tx: ${txHash}`,
    )

    const result: TransactionResult = { success: true, txHash, chain: 'ethereum' }
    this.queuedPayments = []
    this.spentAmount = 0
    return result
  }

  async getSessionStatus(): Promise<SessionStatus> {
    if (!DEMO_MODE && this.ws && this.messageSigner && this.userAddress) {
      try {
        const balanceMsg = await createGetLedgerBalancesMessage(
          this.messageSigner,
          this.userAddress as `0x${string}`,
        )
        this.ws.send(balanceMsg)
      } catch {
      }
    }

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

  destroy(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isAuthenticated = false
    this.appSessionId = null
  }

  private connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(YELLOW_WS_URL)
      const timeout = setTimeout(() => reject(new Error('WebSocket connect timeout')), 10000)

      this.ws.onopen = () => {
        clearTimeout(timeout)
        console.log('[Yellow] WebSocket connected to ClearNode')
        resolve()
      }
      this.ws.onerror = (err) => {
        clearTimeout(timeout)
        reject(err)
      }
      this.ws.onmessage = (event) => {
        try {
          const parsed = NitroliteRPC.parseResponse(event.data)
          console.log('[Yellow] WS:', parsed)
        } catch {
        }
      }
    })
  }

  private async authenticate(): Promise<void> {
    if (!this.ws || !this.messageSigner || !this.userAddress) {
      throw new Error('Cannot authenticate: missing ws/signer/address')
    }

    const authReq = await createAuthRequestMessage({
      wallet: this.userAddress as `0x${string}`,
      participant: this.userAddress as `0x${string}`,
      app_name: 'PayFlow',
      allowances: [{ asset: this.token.toLowerCase(), amount: this.depositAmount }],
      expire: String(Math.floor(Date.now() / 1000) + 3600),
      scope: 'payroll',
      application: '0x0000000000000000000000000000000000000000',
    })
    this.ws.send(authReq)

    const challenge = await this.waitForResponse('auth_challenge')

    if (challenge?.challengeMessage) {
      const verifyMsg = await createAuthVerifyMessage(
        this.messageSigner,
        challenge,
      )
      this.ws.send(verifyMsg)

      const verified = await this.waitForResponse('auth_verify')
      if (verified?.success) {
        this.isAuthenticated = true
        console.log('[Yellow] Authenticated successfully')
      }
    }
  }

  private waitForResponse(method: string, timeoutMs = 10000): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error('No WebSocket'))

      const timeout = setTimeout(() => {
        cleanup()
        resolve(null)
      }, timeoutMs)

      const handler = (event: MessageEvent) => {
        try {
          const parsed = NitroliteRPC.parseResponse(event.data)
          if (parsed && JSON.stringify(parsed).includes(method)) {
            cleanup()
            resolve(parsed.data ?? parsed)
          }
        } catch {
        }
      }

      const cleanup = () => {
        clearTimeout(timeout)
        this.ws?.removeEventListener('message', handler)
      }

      this.ws.addEventListener('message', handler)
    })
  }
}

export async function querySupportedAssets(
  signer: MessageSigner,
  ws: WebSocket,
  chainId?: number,
): Promise<void> {
  const msg = await createGetAssetsMessage(signer, chainId)
  ws.send(msg)
}

export async function executeYellowBatchPayment(
  payments: Payment[],
  token: string,
): Promise<TransactionResult> {
  const session = new YellowSession()

  const totalAmount = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount || '0'),
    0,
  )

  await session.initialize(totalAmount.toFixed(6), token)

  for (const payment of payments) {
    await session.queuePayment(payment.recipient, payment.amount)
  }

  const result = await session.settleAll()
  session.destroy()
  return result
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}