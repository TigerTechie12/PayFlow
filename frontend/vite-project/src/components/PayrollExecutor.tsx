import { useState, useMemo } from 'react'
import { Play, Zap, ArrowRight, Loader2, RotateCcw, CheckCircle2 } from 'lucide-react'
import { usePayFlowStore } from '../lib/store'
import { categorizePayments, recipientsToPayments, estimateGasSavings } from '../lib/payflowEngine'
import { executeYellowBatchPayment } from '../lib/yellowClient'
import { executeLifiBatchPayments } from '../lib/lifiClient'
import { executeSuiBatchPayment } from '../lib/suiClient'
import type { TransactionResult } from '../types'
import { CHAIN_CONFIG } from '../types'


export function PayrollExecutor() {
  const {
    recipients,
    payerChain,
    isExecuting,

    isEvmConnected,
    setExecuting,
    createSession,

    updateSession,

    updateRecipientStatus,
    addLog,
  } = usePayFlowStore()


  const [phase, setPhase] = useState<'idle' | 'yellow' | 'lifi' | 'sui' | 'done'>('idle')

  const payments = useMemo(() => recipientsToPayments(recipients), [recipients])
  const routes = useMemo(() => categorizePayments(payments, payerChain), [payments, payerChain])
  const savings = useMemo(() => estimateGasSavings(routes), [routes])

  const pendingCount = recipients.filter((r) => r.status === 'pending').length

  const executePayroll = async () => {
    if (pendingCount === 0) return

    setExecuting(true)
    createSession()

    addLog('=== PayFlow Execution Started ===')
    addLog(`Routing ${payments.length} payments from ${CHAIN_CONFIG[payerChain].name}`)

    addLog(`  Yellow (same-chain): ${routes.yellowPayments.length}`)

    addLog(`  LI.FI (cross-chain): ${routes.lifiPayments.length}`)
    addLog(`  Sui PTB (batched): ${routes.suiPayments.length}`)

    const txHashes: string[] = []

    if (routes.yellowPayments.length > 0) {
      setPhase('yellow')
      addLog('Phase 1: Yellow Network Session')
 

 
      for (const p of routes.yellowPayments) {
      
        const match = recipients.find((r) => r.address === p.recipient && r.status === 'pending')
      
        if (match) updateRecipientStatus(match.id, 'processing')
      }

      try {
        const result: TransactionResult = await executeYellowBatchPayment(
          routes.yellowPayments,
      
          routes.yellowPayments[0].token
      
        )

        for (const p of routes.yellowPayments) {
          const match = recipients.find((r) => r.address === p.recipient)
          if (match) {
      
            updateRecipientStatus(
              match.id,
      
              result.success ? 'completed' : 'failed',
      
              result.txHash,
      
              result.error
            )
          }
        }

        if (result.txHash) {
          txHashes.push(result.txHash)
          updateSession({ yellowTxHash: result.txHash })
        }
      } catch (err) {
        addLog(`Yellow error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }


    if (routes.lifiPayments.length > 0) {
      setPhase('lifi')
           
             addLog(' Phase 2: LI.FI Cross-Chain Routing ')

      for (const p of routes.lifiPayments) {
        const match = recipients.find((r) => r.address === p.recipient && r.status === 'pending')
        
        if (match) updateRecipientStatus(match.id, 'processing')
      }

      const lifiResults = await executeLifiBatchPayments(
        routes.lifiPayments,
        payerChain,
       
        (index, _total, result) => {
     const payment = routes.lifiPayments[index]
          const match = recipients.find((r) => r.address === payment.recipient)
          if (match) {
            updateRecipientStatus(
              match.id,
              result.success ? 'completed' : 'failed',
              result.txHash,
  
              result.error
            )
          }
        }
      )

      const lifiHashes = lifiResults
        .filter((r) => r.txHash)
        .map((r) => r.txHash!)
      txHashes.push(...lifiHashes)
 
      updateSession({ lifiTxHashes: lifiHashes })
    }

    if (routes.suiPayments.length > 0) {
      setPhase('sui')
 
      addLog('Phase 3: Sui PTB Batch ')

      for (const p of routes.suiPayments) {
        const match = recipients.find((r) => r.address === p.recipient && r.status === 'pending')
        if (match) updateRecipientStatus(match.id, 'processing')
      }

      try {
        const result = await executeSuiBatchPayment(routes.suiPayments)

        for (const p of routes.suiPayments) {
          const match = recipients.find((r) => r.address === p.recipient)
          if (match) {
            updateRecipientStatus(
              match.id,
              result.success ? 'completed' : 'failed',
              result.txHash,
              result.error
            )
          }
        }

        if (result.txHash) {
          txHashes.push(result.txHash)
          updateSession({ suiTxHash: result.txHash })
        }
      } catch (err) {
        addLog(`Sui error: ${err instanceof Error ? err.message : 'Unknown'}`)
      }
    }

    updateSession({ status: 'completed' })
    addLog('=== PayFlow Execution Complete ===')
    addLog(`Total transactions used: ${txHashes.length} (saved ${savings.withoutPayflow - savings.withPayflow} txns)`)
    setPhase('done')
    setExecuting(false)
  }

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Zap size={18} className="text-accent-400" />
        <h2 className="text-base sm:text-lg font-semibold">Execute Payroll</h2>
      </div>

      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="bg-yellow-900/20 border border-yellow-800/30 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-xl sm:text-2xl font-bold text-yellow-400">{routes.yellowPayments.length}</div>
            <div className="text-[10px] sm:text-xs text-yellow-500 mt-0.5 sm:mt-1">Yellow</div>
            <div className="text-[8px] sm:text-[10px] text-gray-500 hidden sm:block">Same-chain</div>
          </div>
          <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-xl sm:text-2xl font-bold text-purple-400">{routes.lifiPayments.length}</div>
            <div className="text-[10px] sm:text-xs text-purple-500 mt-0.5 sm:mt-1">LI.FI</div>
            <div className="text-[8px] sm:text-[10px] text-gray-500 hidden sm:block">Cross-chain</div>
          </div>
          <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-xl sm:text-2xl font-bold text-blue-400">{routes.suiPayments.length}</div>
            <div className="text-[10px] sm:text-xs text-blue-500 mt-0.5 sm:mt-1">Sui PTB</div>
            <div className="text-[8px] sm:text-[10px] text-gray-500 hidden sm:block">Atomic</div>
          </div>
        </div>
      )}

      {savings.savingsPercent > 0 && (
        <div className="bg-accent-900/20 border border-accent-800/30 rounded-lg p-2.5 sm:p-3 mb-3 sm:mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs sm:text-sm text-accent-400 font-medium">Gas Savings</div>
            <div className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
              {savings.withoutPayflow} txns <ArrowRight size={10} className="inline" /> {savings.withPayflow} txns
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-accent-400">{savings.savingsPercent}%</div>
        </div>
      )}

      {isExecuting && (
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 size={14} className="animate-spin text-primary-400" />
            <span className="text-xs sm:text-sm text-gray-400">
              {phase === 'yellow' && 'Yellow Network...'}
              {phase === 'lifi' && 'LI.FI routing...'}
              {phase === 'sui' && 'Sui PTB batch...'}
            </span>
          </div>
          <div className="flex gap-1">
            {['yellow', 'lifi', 'sui'].map((p) => (
              <div
                key={p}
                className={`h-1 sm:h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                  phase === p
                    ? 'bg-primary-500 animate-pulse'
                    : phase === 'done' || ['yellow', 'lifi', 'sui'].indexOf(phase) > ['yellow', 'lifi', 'sui'].indexOf(p)
                      ? 'bg-accent-500'
                      : 'bg-gray-800'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={executePayroll}
        disabled={pendingCount === 0 || isExecuting || !isEvmConnected}
        className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 sm:py-3 text-sm sm:text-base font-semibold disabled:opacity-50"
      >
        {isExecuting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            <span className="hidden sm:inline">Executing Payroll...</span>
            <span className="sm:hidden">Executing...</span>
          </>
        ) : phase === 'done' ? (
          <>
            <Play size={18} />
            <span className="hidden sm:inline">Payroll Complete - Run Again</span>
            <span className="sm:hidden">Run Again</span>
          </>
        ) : (
          <>
            <Play size={18} />
            <span className="hidden sm:inline">Execute Payroll ({pendingCount} recipients)</span>
            <span className="sm:hidden">Execute ({pendingCount})</span>
          </>
        )}
      </button>

      {!isEvmConnected && (
        <p className="text-[10px] sm:text-xs text-gray-500 text-center mt-2">Connect EVM wallet to execute</p>
      )}

      {phase === 'done' && (
        <button
          onClick={() => {
            setPhase('idle')
            recipients.forEach((r) => {
              if (r.status !== 'pending') {
                updateRecipientStatus(r.id, 'pending')
              }
            })
          }}
          className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm text-gray-400 hover:text-gray-300 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      )}

      {phase === 'done' && (
        <div className="mt-3 sm:mt-4 flex items-center justify-center gap-2 text-accent-400">
          <CheckCircle2 size={14} />
          <span className="text-xs sm:text-sm">All payments processed!</span>
        </div>
      )}
    </div>
  )
}
