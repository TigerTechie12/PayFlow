import { useState, useCallback, useRef } from 'react';
import { YellowSession } from '../lib/yellowClient';
import type { Payment, SessionStatus, TransactionResult } from '../types';
import { usePayFlowStore } from '../lib/store';

export function useYellowSession() {
  const sessionRef = useRef<YellowSession | null>(null)
  const [status, setStatus] = useState<SessionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addLog = usePayFlowStore((s) => s.addLog)

  const initialize = useCallback(async (depositAmount: string, token: string) => {
    setIsLoading(true)
    setError(null)
    try {
      
      const session = new YellowSession()
      await session.initialize(depositAmount, token)
      sessionRef.current = session
      
      const newStatus = await session.getSessionStatus()

      setStatus(newStatus)
      addLog(`Yellow session initialized: ${depositAmount} ${token} deposited`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize Yellow session'
      setError(msg)
      addLog(`Yellow session error: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }, [addLog])

  const queuePayments = useCallback(async (payments: Payment[]) => {
    if (!sessionRef.current) {
      setError('Session not initialized')
      return
    }
    setIsLoading(true)
    try {
      for (const payment of payments) {
        await sessionRef.current.queuePayment(payment.recipient, payment.amount)
        addLog(`Yellow: Queued ${payment.amount} → ${payment.recipient.slice(0, 10)}`)
      }
      const newStatus = await sessionRef.current.getSessionStatus()
      setStatus(newStatus)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to queue payments'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }, [addLog])

  const settle = useCallback(async (): Promise<TransactionResult | null> => {
    if (!sessionRef.current) {
      setError('Session not initialized')
      return null
    }
    setIsLoading(true)
    try {
      addLog('Yellow: Settling all queued payments on-chain...')
      const result = await sessionRef.current.settleAll()
      const newStatus = await sessionRef.current.getSessionStatus()
      setStatus(newStatus)
      if (result.txHash) {
        addLog(`Yellow: Settled! TX: ${result.txHash.slice(0, 16)}`)
      }
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Settlement failed'
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [addLog])

  return { status, isLoading, error, initialize, queuePayments, settle }
}
