import { Terminal, CheckCircle2, ExternalLink, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { usePayFlowStore } from '../lib/store'
import type { Chain } from '../types'
import { CHAIN_CONFIG } from '../types'

export function TransactionStatus() {
  const { executionLogs, currentSession, recipients, payerChain } = usePayFlowStore()

  const completed = recipients.filter((r) => r.status === 'completed').length
  const failed = recipients.filter((r) => r.status === 'failed').length
  const processing = recipients.filter((r) => r.status === 'processing').length
  const total = recipients.length

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Terminal size={18} className="text-primary-400" />
        <h2 className="text-base sm:text-lg font-semibold">Transaction Status</h2>
      </div>

      {total > 0 && (
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          <div className="text-center p-1.5 sm:p-2 bg-gray-800/50 rounded-lg">
            <div className="text-base sm:text-lg font-bold text-gray-300">{total}</div>
            <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-wider">Total</div>
          </div>
          <div className="text-center p-1.5 sm:p-2 bg-gray-800/50 rounded-lg">
            <div className="text-base sm:text-lg font-bold text-accent-400">{completed}</div>
            <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-wider">Done</div>
          </div>
          <div className="text-center p-1.5 sm:p-2 bg-gray-800/50 rounded-lg">
            <div className="text-base sm:text-lg font-bold text-yellow-400">{processing}</div>
            <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-wider">Active</div>
          </div>
          <div className="text-center p-1.5 sm:p-2 bg-gray-800/50 rounded-lg">
            <div className="text-base sm:text-lg font-bold text-red-400">{failed}</div>
            <div className="text-[8px] sm:text-[10px] text-gray-500 uppercase tracking-wider">Failed</div>
          </div>
        </div>
      )}

      {currentSession && (
        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
          {currentSession.yellowTxHash && (
            <TxRow
              label="Yellow"
              hash={currentSession.yellowTxHash}
              color="text-yellow-400"
              chain={payerChain}
            />
          )}
          {currentSession.suiTxHash && (
            <TxRow
              label="Sui PTB"
              hash={currentSession.suiTxHash}
              color="text-blue-400"
              chain="sui"
            />
          )}
          {currentSession.lifiTxHashes?.map((hash, i) => (
            <TxRow
              key={hash}
              label={`LI.FI #${i + 1}`}
              hash={hash}
              color="text-purple-400"
              chain={payerChain}
            />
          ))}
        </div>
      )}

      {total > 0 && (
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{completed + failed}/{total}</span>
          </div>
          <div className="w-full h-1.5 sm:h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${((completed + failed) / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="bg-gray-950 border border-gray-800 rounded-lg p-2 sm:p-3 max-h-[180px] sm:max-h-[250px] overflow-y-auto font-mono text-[10px] sm:text-xs">
        {executionLogs.length === 0 ? (
          <div className="text-gray-600 text-center py-3 sm:py-4 text-xs">
            Waiting for execution...
          </div>
        ) : (
          executionLogs.map((log, i) => (
            <div key={i} className="py-0.5 break-all">
              {log.includes('✓') || log.includes('Complete') ? (
                <span className="text-accent-400">{log}</span>
              ) : log.includes('✗') || log.includes('error') || log.includes('Error') ? (
                <span className="text-red-400">{log}</span>
              ) : log.includes('===') ? (
                <span className="text-primary-400 font-bold">{log}</span>
              ) : log.includes('---') ? (
                <span className="text-secondary-400">{log}</span>
              ) : (
                <span className="text-gray-400">{log}</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TxRow({
  label,
  hash,
  color,
  chain,
}: {
  label: string
  hash: string
  color: string
  chain: Chain
}) {
  const [copied, setCopied] = useState(false)

  const explorerUrl = CHAIN_CONFIG[chain].explorer + hash

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = hash
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <CheckCircle2 size={12} className={color} />
        <span className="text-[10px] sm:text-xs text-gray-400">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-[10px] sm:text-xs font-mono text-gray-500">
          {hash.slice(0, 6)}...{hash.slice(-4)}
        </span>
        <button
          onClick={copyToClipboard}
          className="text-gray-600 hover:text-gray-400 transition-colors p-0.5"
          title="Copy hash"
        >
          {copied ? (
            <Check size={12} className="text-accent-400" />
          ) : (
            <Copy size={12} />
          )}
        </button>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-primary-400 transition-colors p-0.5"
          title="View on explorer"
        >
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}
