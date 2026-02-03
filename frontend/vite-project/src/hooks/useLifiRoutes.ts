import { useState, useCallback } from 'react';
import { executeLifiBatchPayments, getPaymentQuote } from '../lib/lifiClient';
import type { Chain, Payment, Quote, TransactionResult } from '../types';
import { usePayFlowStore } from '../lib/store';

export function useLifiRoutes() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [results, setResults] = useState<TransactionResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  
  const [error, setError] = useState<string | null>(null)
  const addLog = usePayFlowStore((s) => s.addLog)



  const fetchQuotes = useCallback(async (payments: Payment[], fromChain: Chain) => {
    setIsLoading(true)
    setError(null)
    try {
      const newQuotes: Quote[] = []
      for (const payment of payments) {
        const quote = await getPaymentQuote(
          fromChain,
          payment.chain,
          'USDC',
          payment.token,
          payment.amount
        )
        newQuotes.push(quote)
      }
      setQuotes(newQuotes)
      
      addLog(`LI.FI: Fetched ${newQuotes.length} cross-chain quotes`)
      return newQuotes
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch quotes';
      setError(msg)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [addLog])

  const executePayments = useCallback(async (
    payments: Payment[],
    fromChain: Chain
  ): Promise<TransactionResult[]> => {
    setIsLoading(true)
    setError(null)
    setProgress({ current: 0, total: payments.length })


    try {
      addLog(`LI.FI: Executing ${payments.length} cross-chain transfers...`)
      const txResults = await executeLifiBatchPayments(
        payments,
        fromChain,
        (index, total, result) => {
          setProgress({ current: index + 1, total })
          const payment = payments[index]
          if (result.success) {
            addLog(

              `LI.FI: [${index + 1}/${total}] ${payment.amount} → ${payment.chain} ✓ TX: ${result.txHash?.slice(0, 16)}...`
            )
          } else {
            addLog(
              `LI.FI: [${index + 1}/${total}] ${payment.amount} → ${payment.chain} ✗ ${result.error}`
            )
          }
        }
      )

      setResults(txResults)
      return txResults
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Execution failed'
      setError(msg)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [addLog])

  return { quotes, results, isLoading, progress, error, fetchQuotes, executePayments }
}
