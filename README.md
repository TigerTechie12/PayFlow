💸 PayFlow: Universal Cross-Chain Payroll System

One Deposit. Unlimited Payments. Any Chain.

PayFlow is a unified payroll solution that abstracts away blockchain complexity. It enables companies and DAOs to pay global contributors with a single click, regardless of which blockchain or token each recipient prefers. By combining state channels, programmable transaction blocks, and cross-chain routing, PayFlow reduces payroll from 100+ transactions to just 2.
🚨 The Problem

Global payroll in Web3 is fragmented and expensive.

    Fragmented Payments: Paying 100 employees often requires 100 separate transactions.

    High Gas Fees: Simple payroll runs can cost $500+ in gas fees alone.

    Manual Bridging: Treasurers waste hours manually bridging assets to match employee preferences (e.g., Alice wants USDC on Arbitrum, Bob wants SUI on Sui).

💡 The Solution

PayFlow creates a single workflow for multi-chain, multi-token payroll.

    Transactions: Reduced from 100+ to 2 (Deposit + Settlement).

    Gas Costs: Reduced from $500+ to **<$10**.

    Time: Reduced from hours to <1 minute.

    Flexibility: Sender deposits one token; recipients receive any token on any chain.

🛠 Technical Architecture

PayFlow utilizes a modular architecture leveraging the unique strengths of three key protocols.
1. 🟡 Yellow Network (Gasless Batching)

We use Yellow Network's State Channels to handle the queuing of payments off-chain.

    Role: Enables "Session-Based Payments" where we deposit once, execute unlimited off-chain transfers to queue the payroll, and settle with a single transaction.

    Impact: Zero gas per individual payment and instant finality.

2. 💧 Sui (Atomic Execution)

We leverage Sui's Programmable Transaction Blocks (PTBs) to batch payments on the Sui network.

    Role: Allows us to batch up to 1,024 operations (swaps + transfers) into a single atomic transaction.

    Impact: Massive scalability and sub-cent fees for distributing funds to Sui-based recipients.

3. 🦎 LI.FI (Cross-Chain Routing)

We integrate LI.FI as our intelligent cross-chain router.

    Role: Automatically finds the optimal route (bridge + DEX) when an employee requests payment on a different chain than the treasury.

    Impact: Enables the "Universal" aspect of PayFlow—paying an employee on Base using funds from Mainnet seamlessly.

🌊 System Flow

    Connect & Deposit: Company connects wallet and deposits funds (e.g., USDC) into a Yellow Network session.

    Upload Recipients: User uploads a CSV of recipients, amounts, and preferred chains.

    Smart Routing: The PayFlow Engine sorts payments:

        Same Chain: Routed via Yellow Session.

        Cross-Chain: Routed via LI.FI.

        Sui Native: Routed via Sui PTBs.

    Execute: One click triggers the batch settlement.

💻 Tech Stack

Frontend

    React 18 with TypeScript

    Tailwind CSS

    Wagmi + Viem (EVM)

    @mysten/sui.js (Sui)

    React Query

Smart Contracts & SDKs

    Yellow SDK (@aspect-dev/yellow-sdk)

    LI.FI SDK (@lifi/sdk)

    Sui Move (Custom Batch Payment Module)

    DeepBook (On-chain swaps on Sui)

🚀 Getting Started
Prerequisites

    Node.js v18+

    pnpm / yarn

Installation

    Clone the repo
    Bash

    git clone https://github.com/yourusername/PayFlow.git
    cd PayFlow

    Install Frontend Dependencies
    Bash

    cd frontend/vite-project
    npm install

    Environment Setup Create a .env file in the root directory:
    Code snippet

    VITE_LIFI_API_KEY=your_key
    VITE_YELLOW_NETWORK_KEY=your_key

    Run Development Server
    Bash

    npm run dev