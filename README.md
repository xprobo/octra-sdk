# Octra SDK

Modern JavaScript/TypeScript SDK for the Octra blockchain inspired by ethers.js.

Supports wallet management, transactions, smart contracts, token interactions, and future privacy-oriented features.

---

# Features

- Wallet management
- HD Wallet (Mnemonic)
- Private key import
- Send transaction
- Contract deploy
- Contract call
- Contract view
- Token transfer
- Transaction history
- Fee estimation
- Global browser support
- Node.js support
- Ethers-like API
- Planned support for stealth and FHE features

---

# Requirements

- Node.js >= 18

---

# Installation

## NPM

```bash
npm install octra-sdk
```

## Bun

```bash
bun add octra-sdk
```

## Yarn

```bash
yarn add octra-sdk
```

---

# Import

## ESM

```js
import { Wallet, Provider, Contract } from 'octra-sdk';
```

## CommonJS

```js
const {
  Wallet,
  Provider,
  Contract
} = require('octra-sdk');
```

## Browser CDN

```html
<script src="https://cdn.jsdelivr.net/npm/octra-sdk/dist/octra-sdk.min.js"></script>

<script>
  const wallet =
    octra.Wallet.createRandom();
</script>
```

---

# Initialize Provider

```js
import { Provider } from 'octra-sdk';

const provider =
  new Provider(
    'https://your-octra-rpc.example'
  );
```

---

# Create Wallet

## Random Wallet

```js
import { Wallet } from 'octra-sdk';

const wallet =
  Wallet.createRandom();

console.log(wallet.address);

console.log(wallet.mnemonic);

console.log(wallet.privateKey);
```

---

# Import Wallet

## From Mnemonic

```js
const wallet =
  Wallet.fromMnemonic(
    'word word word ...'
  );
```

## From Private Key

```js
const wallet =
  Wallet.fromPrivateKey(
    'BASE64_PRIVATE_KEY'
  );
```

---

# Connect Wallet to RPC

```js
const wallet =
  Wallet
    .createRandom()
    .connect(
      'https://your-octra-rpc.example'
    );
```

---

# Get Balance

```js
const balance =
  await wallet.getBalance();

console.log(balance);
```

Output:

```js
{
  address:
    'oct...',
  raw:
    '1000000',
  formatted:
    '1.000000',
  nonce: 10,
  pendingNonce: 11
}
```

---

# Get Account Info

```js
const account =
  await wallet.getAccount();

console.log(account);
```

---

# Send Transaction

```js
const tx =
  await wallet.transfer(
    'octxxxxxxxxxxxxxxxx',
    '1.5'
  );

console.log(tx);
```

---

# Send Transaction with Message

```js
const tx =
  await wallet.sendTransaction({
    to:
      'octxxxxxxxxxxxxx',
    amount: '2.5',
    message:
      'hello octra',
    ou: '10000'
  });
```

---

# Wait Transaction Confirmation

```js
const provider =
  new Provider(
    'https://your-octra-rpc.example'
  );

const receipt =
  await provider.waitForTransaction(
    tx.tx_hash
  );

console.log(receipt);
```

---

# Get Transaction

```js
const tx =
  await provider.getTransaction(
    'TX_HASH'
  );
```

---

# Transaction History

```js
const history =
  await wallet.getHistory(
    20,
    0
  );

console.log(history);
```

---

# Compile AML Contract

```js
const compiled =
  await provider.compileAml(`
contract Counter {

  storage {
    count: u64
  }

}
`);

console.log(compiled);
```

---

# Compile Assembly Contract

```js
const compiled =
  await provider.compileAssembly(`
PUSH 1
PUSH 2
ADD
HALT
`);
```

---

# Deploy Contract

```js
const deployed =
  await wallet.deployContract({
    bytecode:
      compiled.bytecode
  });

console.log(
  deployed.contractAddress
);
```

---

# Create Contract Instance

```js
const contract =
  new Contract(
    'octcontractxxxxx',
    abi,
    wallet
  );
```

---

# Contract View Call

```js
const value =
  await contract.get_count();

console.log(value);
```

---

# Contract State Call

```js
const tx =
  await contract.increment(
    1
  );

console.log(tx);
```

---

# Manual Contract View

```js
const result =
  await provider.call(
    'octcontractxxxxx',
    'balance_of',
    [
      'octxxxxxxxxx'
    ]
  );
```

---

# Get Contract Info

```js
const info =
  await provider.getContract(
    'octcontractxxxxx'
  );

console.log(info);
```

---

# Token Transfer

```js
await wallet.callContract({
  address:
    'octtokenxxxx',
  method:
    'transfer',
  params: [
    'octxxxxx',
    1000000
  ]
});
```

---

# Fee Estimation

```js
const fees =
  await provider.getFees();

console.log(fees);
```

Output:

```js
{
  standard: {
    minimum: '1000',
    recommended: '10000',
    fast: '20000'
  },

  deploy: {
    minimum: '50000000'
  }
}
```

---

# Utility Functions

## Normalize Amount

```js
octra.utils.normalizeAmount(
  '1.5'
);

// 1500000
```

---

## Convert Raw to Display

```js
octra.utils.rawToDisplay(
  '1500000'
);

// 1.500000
```

---

## SHA256

```js
octra.utils.sha256(
  Buffer.from('hello')
);
```

---

# Global Browser Usage

```html
<script src=""https://cdn.jsdelivr.net/npm/octra-sdk/dist/octra-sdk.min.js"></script>

<script>
  const wallet =
    octra.Wallet
      .createRandom();

  console.log(
    wallet.address
  );
</script>
```

---

# Recommended Project Structure

```txt
project/
├── src/
├── contracts/
├── scripts/
├── tests/
├── package.json
└── .env
```

---

# Example Full Transfer Script

```js
import {
  Wallet
} from 'octra-sdk';

async function main() {

  const wallet =
    Wallet.fromMnemonic(
      process.env.MNEMONIC
    ).connect(
      'https://your-octra-rpc.example'
    );

  const balance =
    await wallet.getBalance();

  console.log(
    'Balance:',
    balance.formatted
  );

  const tx =
    await wallet.transfer(
      'octxxxxxxxxx',
      '1.25'
    );

  console.log(tx);

}

main();
```

---

# Example Smart Contract Script

```js
import {
  Wallet,
  Provider,
  Contract
} from 'octra-sdk';

const provider =
  new Provider(
    'https://your-octra-rpc.example'
  );

const wallet =
  Wallet.fromMnemonic(
    process.env.MNEMONIC
  ).connect(
    'https://your-octra-rpc.example'
  );

const abi = [
  {
    type: 'function',
    name: 'increment',
    stateMutability:
      'nonpayable'
  },
  {
    type: 'function',
    name: 'get_count',
    stateMutability:
      'view'
  }
];

const contract =
  new Contract(
    'octcontractxxxxx',
    abi,
    wallet
  );

const count =
  await contract.get_count();

console.log(count);

await contract.increment(
  1
);
```

---

# API Overview

| Class | Description |
|---|---|
| Wallet | Wallet management |
| Provider | RPC provider |
| Contract | Smart contract wrapper |

---

# Wallet Methods

| Method | Description |
|---|---|
| createRandom() | Create random wallet |
| fromMnemonic() | Import mnemonic |
| fromPrivateKey() | Import private key |
| getBalance() | Get balance |
| transfer() | Send OCT |
| deployContract() | Deploy contract |
| callContract() | Call contract |

---

# Provider Methods

| Method | Description |
|---|---|
| getBalance() | Get address balance |
| getTransaction() | Get tx detail |
| waitForTransaction() | Wait confirmation |
| getContract() | Get contract |
| compileAml() | Compile AML |
| compileAssembly() | Compile ASM |

---

# Contract Methods

| Method | Description |
|---|---|
| dynamic ABI methods | Auto-generated |
| view calls | Read contract |
| state calls | Write contract |

---

# Environment Variables

```env
RPC_URL=https://your-octra-rpc.example
MNEMONIC=your mnemonic here
PRIVATE_KEY=your_private_key
```

---

# Security Notes

- Never expose mnemonics
- Don't commit `.env`
- Store private keys offline
- Use hardware isolation for production
- Always verify contracts before deployment

---

# Disclaimer

This SDK is an independent open-source project and is not officially affiliated with the Octra core team.

Use at your own risk. Always audit smart contracts and transaction flows before using in production environments.

---

# License

MIT License

Copyright © Octra SDK Contributors