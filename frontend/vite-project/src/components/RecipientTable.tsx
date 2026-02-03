import { useState, useRef } from 'react'
import { Plus, Trash2, Upload, X, Users } from 'lucide-react'
import Papa from 'papaparse'
import { usePayFlowStore } from '../lib/store'
import type { Chain } from '../types'
import { CHAIN_CONFIG, SUPPORTED_TOKENS } from '../types'

const ALL_CHAINS = Object.keys(CHAIN_CONFIG) as Chain[]

export function RecipientTable() {
  const { recipients, addRecipient, addRecipients, removeRecipient, updateRecipient, clearRecipients, isExecuting } =
    usePayFlowStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAddress, setNewAddress] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newChain, setNewChain] = useState<Chain>('ethereum')
  const [newToken, setNewToken] = useState('USDC')

  const handleAdd = () => {
    if (!newAddress || !newAmount) return
    addRecipient({
      name: newName || 'Unnamed',
      address: newAddress,
      amount: newAmount,
      chain: newChain,
      token: newToken,
    })
    setNewName('')
    setNewAddress('')
    setNewAmount('')
    setShowAddForm(false)
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data as Record<string, string>[]
        const newRecipients = parsed
          .filter((row) => row.address && row.amount)
          .map((row) => ({
            name: row.name || 'CSV Import',
            address: row.address,
            amount: row.amount,
            chain: (row.chain as Chain) || 'ethereum',
            token: row.token || 'USDC',
          }))
        if (newRecipients.length > 0) {
          addRecipients(newRecipients)
        }
      },
    })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const loadSampleData = () => {
    addRecipients([
      { name: 'Alice', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD68', amount: '100', chain: 'ethereum', token: 'USDC' },
      { name: 'Bob', address: '0x53d284357ec70cE289D6D64134DfAc8E511c8a3D', amount: '250', chain: 'arbitrum', token: 'USDC' },
      { name: 'Charlie', address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', amount: '75', chain: 'base', token: 'ETH' },
      { name: 'Diana', address: '0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c', amount: '500', chain: 'polygon', token: 'MATIC' },
      { name: 'Eve', address: '0x' + 'b'.repeat(64), amount: '30', chain: 'sui', token: 'SUI' },
      { name: 'Frank', address: '0x' + 'c'.repeat(64), amount: '120', chain: 'sui', token: 'SUI' },
      { name: 'Grace', address: '0x1234567890abcdef1234567890abcdef12345678', amount: '200', chain: 'optimism', token: 'USDC' },
    ])
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-gray-700 text-gray-300',
      processing: 'bg-yellow-900/50 text-yellow-400',
      completed: 'bg-accent-900/50 text-accent-400',
      failed: 'bg-red-900/50 text-red-400',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.pending}`}>
        {status}
      </span>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-primary-400" />
          <h2 className="text-lg font-semibold">Recipients</h2>
          <span className="text-sm text-gray-500">({recipients.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSampleData}
            disabled={isExecuting}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            Load Sample
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isExecuting}
            className="flex items-center gap-1 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            <Upload size={14} />
            CSV
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={isExecuting}
            className="flex items-center gap-1 text-sm btn-primary py-1.5 disabled:opacity-50"
          >
            <Plus size={14} />
            Add
          </button>
          {recipients.length > 0 && (
            <button
              onClick={clearRecipients}
              disabled={isExecuting}
              className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Add Recipient</span>
            <button onClick={() => setShowAddForm(false)} className="text-gray-500 hover:text-gray-300">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input-field"
            />
            <input
              placeholder="0x... address"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="input-field"
            />
            <input
              placeholder="Amount"
              type="number"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="input-field"
            />
            <select
              value={newChain}
              onChange={(e) => {
                const chain = e.target.value as Chain
                setNewChain(chain)
                setNewToken(SUPPORTED_TOKENS[chain][0])
              }}
              className="select-field"
            >
              {ALL_CHAINS.map((c) => (
                <option key={c} value={c}>{CHAIN_CONFIG[c].name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <select
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                className="select-field flex-1"
              >
                {SUPPORTED_TOKENS[newChain].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button onClick={handleAdd} className="btn-accent py-1.5 px-3 text-sm whitespace-nowrap">
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {recipients.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">No recipients added yet</p>
          <p className="text-xs mt-1">Add manually, import CSV, or load sample data</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-left">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Address</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Chain</th>
                <th className="pb-2 font-medium">Token</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((r) => (
                <tr key={r.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-2.5 text-gray-300">{r.name}</td>
                  <td className="py-2.5 font-mono text-xs text-gray-400">
                    {r.address.slice(0, 8)}...{r.address.slice(-6)}
                  </td>
                  <td className="py-2.5">
                    {isExecuting ? (
                      <span>{r.amount}</span>
                    ) : (
                      <input
                        type="number"
                        value={r.amount}
                        onChange={(e) => updateRecipient(r.id, { amount: e.target.value })}
                        className="bg-transparent border-b border-gray-700 focus:border-primary-500 outline-none w-20 py-0.5"
                      />
                    )}
                  </td>
                  <td className="py-2.5">
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: CHAIN_CONFIG[r.chain].color + '20',
                        color: CHAIN_CONFIG[r.chain].color,
                      }}
                    >
                      {CHAIN_CONFIG[r.chain].icon} {CHAIN_CONFIG[r.chain].name}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-300">{r.token}</td>
                  <td className="py-2.5">{getStatusBadge(r.status)}</td>
                  <td className="py-2.5">
                    {!isExecuting && (
                      <button
                        onClick={() => removeRecipient(r.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
