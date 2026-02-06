# PayFlow Sui Contract Deployment Guide

## Prerequisites

1. **Install Sui CLI**
   ```bash
   # Using Homebrew (macOS)
   brew install sui

   # Using Cargo (cross-platform)
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
   ```

2. **Verify installation**
   ```bash
   sui --version
   ```

## Setup Wallet

1. **Create a new wallet** (if you don't have one)
   ```bash
   sui client new-address ed25519
   ```

2. **Switch to testnet**
   ```bash
   sui client switch --env testnet
   ```

3. **Get testnet SUI tokens**
   ```bash
   sui client faucet
   ```

4. **Check your balance**
   ```bash
   sui client gas
   ```

## Build the Contract

```bash
cd contracts/sui
sui move build
```

Expected output:
```
BUILDING payflow
Successfully verified dependencies on-chain against source.
```

## Deploy to Testnet

```bash
sui client publish --gas-budget 100000000
```

After successful deployment, you'll see output like:
```
----- Transaction Effects ----
Created Objects:
  - ID: 0x... (Package)
```

**Save the Package ID** - you'll need it for the frontend integration.

## Update Frontend Configuration

After deployment, update the package ID in your frontend:

```typescript
// frontend/vite-project/src/lib/suiClient.ts
const PAYFLOW_PACKAGE_ID = '0x<your-deployed-package-id>';
```

## Testing the Contract

### Test batch_payout (SUI tokens)
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module batch_pay \
  --function batch_payout \
  --args <COIN_OBJECT_ID> '["0xrecipient1","0xrecipient2"]' '[1000000000,2000000000]' \
  --gas-budget 10000000
```

### Test batch_payout_generic (any token)
```bash
sui client call \
  --package <PACKAGE_ID> \
  --module batch_pay \
  --function batch_payout_generic \
  --type-args '0x2::sui::SUI' \
  --args <COIN_OBJECT_ID> '["0xrecipient1"]' '[1000000000]' '0x<batch_id_hex>' \
  --gas-budget 10000000
```

## Contract Functions

| Function | Description | Token Support |
|----------|-------------|---------------|
| `batch_payout` | Basic batch payment | SUI only |
| `batch_payout_with_refs` | Batch with references | SUI only |
| `batch_payout_generic<T>` | Generic batch payment | Any Coin<T> |
| `batch_payout_with_refs_generic<T>` | Generic with references | Any Coin<T> |

## Events

The contract emits events for tracking:

- **BatchPaymentExecuted**: Emitted once per batch
  - `batch_id`: Unique identifier
  - `payer`: Sender address
  - `total_amount`: Total paid
  - `recipient_count`: Number of recipients
  - `timestamp`: Epoch timestamp

- **PaymentSent**: Emitted for each payment
  - `batch_id`: Links to batch
  - `recipient`: Receiver address
  - `amount`: Amount sent
  - `reference`: Optional memo/reference

## Query Events

```bash
sui client events --query '{"MoveEventType":"<PACKAGE_ID>::batch_pay::BatchPaymentExecuted"}'
```

## Common Token Addresses (Testnet)

| Token | Type |
|-------|------|
| SUI | `0x2::sui::SUI` |
| USDC | `0x<usdc_package>::usdc::USDC` |
| USDT | `0x<usdt_package>::usdt::USDT` |

## Troubleshooting

**"Insufficient gas"**
- Increase `--gas-budget` value

**"Object not found"**
- Ensure you're on testnet: `sui client active-env`
- Check object exists: `sui client object <OBJECT_ID>`

**"Version mismatch"**
- Rebuild: `sui move build --fetch-deps-only`
