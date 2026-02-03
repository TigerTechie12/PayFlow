import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Recipient, Chain, PayrollSession, RecipientStatus } from '../types'

interface PayFlowState {
  evmAddress: string | null
  suiAddress: string | null
  payerChain: Chain
  isEvmConnected: boolean
  isSuiConnected: boolean

  recipients: Recipient[]

  currentSession: PayrollSession | null
  isExecuting: boolean

  executionLogs: string[]

  setEvmWallet: (address: string | null) => void
  setSuiWallet: (address: string | null) => void
  setPayerChain: (chain: Chain) => void
  addRecipient: (recipient: Omit<Recipient, 'id' | 'status'>) => void
  addRecipients: (recipients: Omit<Recipient, 'id' | 'status'>[]) => void
  updateRecipient: (id: string, updates: Partial<Recipient>) => void
  removeRecipient: (id: string) => void
  clearRecipients: () => void
  updateRecipientStatus: (id: string, status: RecipientStatus, txHash?: string, error?: string) => void
  setExecuting: (executing: boolean) => void
  createSession: () => void
  updateSession: (updates: Partial<PayrollSession>) => void
  addLog: (message: string) => void
  clearLogs: () => void
  resetAll: () => void
}

export const usePayFlowStore = create<PayFlowState>((set, get) => ({
  evmAddress: null,
  suiAddress: null,
  payerChain: 'ethereum',
  isEvmConnected: false,
  isSuiConnected: false,

  recipients: [],

  currentSession: null,
  isExecuting: false,

  executionLogs: [],

  setEvmWallet: (address) =>
    set({ evmAddress: address, isEvmConnected: !!address }),

  setSuiWallet: (address) =>
    set({ suiAddress: address, isSuiConnected: !!address }),

  setPayerChain: (chain) => set({ payerChain: chain }),

  addRecipient: (recipient) =>
    set((state) => ({
      recipients: [
        ...state.recipients,
        { ...recipient, id: uuidv4(), status: 'pending' as const },
      ],
    })),

  addRecipients: (newRecipients) =>
    set((state) => ({
      recipients: [
        ...state.recipients,
        ...newRecipients.map((r) => ({
          ...r,
          id: uuidv4(),
          status: 'pending' as const,
        })),
      ],
    })),

  updateRecipient: (id, updates) =>
    set((state) => ({
      recipients: state.recipients.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  removeRecipient: (id) =>
    set((state) => ({
      recipients: state.recipients.filter((r) => r.id !== id),
    })),

  clearRecipients: () => set({ recipients: [] }),

  updateRecipientStatus: (id, status, txHash, error) =>
    set((state) => ({
      recipients: state.recipients.map((r) =>
        r.id === id ? { ...r, status, txHash, error } : r
      ),
    })),

  setExecuting: (executing) => set({ isExecuting: executing }),

  createSession: () => {
    const { recipients } = get()
    const totalAmount = recipients
      .reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0)
      .toFixed(6)

    set({
      currentSession: {
        id: uuidv4(),
        totalAmount,
        recipients: [...recipients],
        status: 'executing',
        createdAt: Date.now(),
      },
    })
  },

  updateSession: (updates) =>
    set((state) => ({
      currentSession: state.currentSession
        ? { ...state.currentSession, ...updates }
        : null,
    })),

  addLog: (message) =>
    set((state) => ({
      executionLogs: [
        ...state.executionLogs,
        `[${new Date().toLocaleTimeString()}] ${message}`,
      ],
    })),

  clearLogs: () => set({ executionLogs: [] }),

  resetAll: () =>
    set({
      recipients: [],
      currentSession: null,
      isExecuting: false,
      executionLogs: [],
    }),
}))