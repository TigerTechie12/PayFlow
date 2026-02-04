import { useState, useCallback } from 'react'
import { executeSuiBatchPayment, previewSuiBatch } from '../lib/suiClient'
import type { Payment, TransactionResult } from '../types'
import { usePayFlowStore } from '../lib/store'

export function useSuiPayments() {
  const [result, setResult] = useState<TransactionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addLog = usePayFlowStore((s) => s.addLog)

  const preview = useCallback((payments: Payment[]) => {
    return previewSuiBatch(payments)
  }, [])

  const execute = useCallback(async (payments: Payment[]): Promise<TransactionResult | null> => {
    if (payments.length === 0) return null

    setIsLoading(true)
    setError(null)

    try {
      addLog(`Sui PTB: Building batch transaction for ${payments.length} payments.`)
      const txResult = await executeSuiBatchPayment(payments)
      setResult(txResult)

      if (txResult.success) {
        addLog(`Sui PTB: Batch executed! ${payments.length} transfers in 1 TX: ${txResult.txHash?.slice(0, 16)}...`)
      }

      return txResult
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sui batch execution failed'
      setError(msg)
      addLog(`Sui PTB: Error - ${msg}`)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [addLog])

  return { result, isLoading, error, preview, execute }
}
