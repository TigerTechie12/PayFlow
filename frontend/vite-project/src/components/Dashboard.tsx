import { useMemo } from 'react'
import { ArrowRightLeft, TrendingDown, Layers } from 'lucide-react'
import { WalletConnect } from './WalletConnect'
import { RecipientTable } from './RecipientTable'
import { PayrollExecutor } from './PayrollExecutor'
import { TransactionStatus } from './TransactionStatus'
import { usePayFlowStore } from '../lib/store'
import { categorizePayments, recipientsToPayments, calculateTotalAmount } from '../lib/payflowEngine'

export function Dashboard() {
  const { recipients, payerChain } = usePayFlowStore()

  const payments = useMemo(() => recipientsToPayments(recipients), [recipients])
  const routes = useMemo(() => categorizePayments(payments, payerChain), [payments, payerChain])

  const totalAmount = useMemo(() => calculateTotalAmount(payments), [payments])

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <ArrowRightLeft size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                  PayFlow
                </h1>
                <p className="text-[10px] text-gray-500 -mt-0.5">Universal Cross-Chain Payroll</p>
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {recipients.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={<Layers size={16} />}
              label="Recipients"
              value={recipients.length.toString()}
              color="text-primary-400"
            />
            <StatCard
              icon={<ArrowRightLeft size={16} />}
              label="Total Amount"
              value={parseFloat(totalAmount) > 0 ? totalAmount : '0'}
              color="text-secondary-400"
            />
            <StatCard
              icon={<TrendingDown size={16} />}
              label="Chains Used"
              value={new Set(recipients.map((r) => r.chain)).size.toString()}
              color="text-accent-400"
            />
            <StatCard
              icon={<Layers size={16} />}
              label="Protocols"
              value={[
                routes.yellowPayments.length > 0 ? 'Yellow' : '',
                routes.lifiPayments.length > 0 ? 'LI.FI' : '',
                routes.suiPayments.length > 0 ? 'Sui' : '',
              ].filter(Boolean).length.toString()}
              color="text-yellow-400"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecipientTable />
          </div>

          <div className="space-y-6">
            <PayrollExecutor />
            <TransactionStatus />
          </div>
        </div>

        <div className="mt-8 card">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
            How PayFlow Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ProtocolCard
              name="Yellow Network"
              description="Same-chain payments batched off-chain via state channels. All payments settle in 1 transaction."
              color="from-yellow-500/20 to-yellow-600/5"
              borderColor="border-yellow-800/30"
              tag="Gasless Batching"
            />
            <ProtocolCard
              name="LI.FI Protocol"
              description="Cross-chain EVM payments routed through optimal bridges and DEX aggregators."
              color="from-purple-500/20 to-purple-600/5"
              borderColor="border-purple-800/30"
              tag="Cross-Chain"
            />
            <ProtocolCard
              name="Sui PTB"
              description="All Sui payments combined into a single Programmable Transaction Block for atomic execution."
              color="from-blue-500/20 to-blue-600/5"
              borderColor="border-blue-800/30"
              tag="Atomic Batch"
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs text-gray-600">
            PayFlow - Built with Yellow Network, LI.FI, and Sui
          </p>
        </div>
      </footer>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className={`flex items-center gap-1.5 text-xs text-gray-500 mb-1`}>
        <span className={color}>{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  )
}

function ProtocolCard({
  name,
  description,
  color,
  borderColor,
  tag,
}: {
  name: string
  description: string
  color: string
  borderColor: string
  tag: string
}) {
  return (
    <div className={`bg-gradient-to-b ${color} border ${borderColor} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-white">{name}</h4>
        <span className="text-[10px] px-2 py-0.5 bg-gray-900/50 rounded-full text-gray-400">
          {tag}
        </span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}
