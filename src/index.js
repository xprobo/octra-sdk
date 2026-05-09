import nacl from 'tweetnacl';

import RpcClient from './rpc-client.js';

import {
  base64Encode,
  base64Decode,
  hexEncode,
  randomBytes,
  keypairFromSeed,
  mnemonicToSeed,
  generateMnemonic12,
  validateMnemonic,
  deriveHdSeed,
  utf8Encode,
  base58Encode,
  sha256
} from './crypto-utils.js';

const OCTRA_DECIMALS =
  1_000_000;

const DEFAULT_RPC =
  'http://46.101.86.250:8080';

const MAX_OCT_RAW =
  1_000_000_000n *
  1_000_000n;

const now = () =>
  Date.now() / 1000;

const sleep = (ms) =>
  new Promise((r) =>
    setTimeout(r, ms)
  );

function canonicalTx(tx) {

  const obj = {};

  obj.from =
    tx.from;

  obj.to_ =
    tx.to_;

  obj.amount =
    String(tx.amount);

  obj.nonce =
    Number(tx.nonce);

  obj.ou =
    String(tx.ou);

  obj.timestamp =
    tx.timestamp;

  if (
    tx.op_type
  ) {
    obj.op_type =
      tx.op_type;
  }

  if (
    tx.encrypted_data
  ) {
    obj.encrypted_data =
      tx.encrypted_data;
  }

  if (
    tx.message
  ) {
    obj.message =
      tx.message;
  }

  return JSON.stringify(
    obj
  );
}

function normalizeAmount(
  amount
) {

  if (
    typeof amount ===
    'bigint'
  ) {
    amount =
      amount.toString();
  }

  if (
    typeof amount ===
    'number'
  ) {
    amount =
      amount.toString();
  }

  if (
    typeof amount !==
    'string'
  ) {
    throw new Error(
      'invalid amount'
    );
  }

  amount =
    amount.trim();

  if (
    !amount.length
  ) {
    throw new Error(
      'invalid amount'
    );
  }

  const parts =
    amount.split('.');

  if (
    parts.length > 2
  ) {
    throw new Error(
      'invalid amount'
    );
  }

  let [
    integerPart,
    fracPart = ''
  ] = parts;

  if (
    !/^\d+$/.test(
      integerPart || '0'
    )
  ) {
    throw new Error(
      'invalid amount'
    );
  }

  if (
    fracPart &&
    !/^\d+$/.test(
      fracPart
    )
  ) {
    throw new Error(
      'invalid amount'
    );
  }

  if (
    fracPart.length > 6
  ) {
    fracPart =
      fracPart.slice(
        0,
        6
      );
  }

  while (
    fracPart.length < 6
  ) {
    fracPart += '0';
  }

  const raw =
    (
      BigInt(
        integerPart || '0'
      ) *
      BigInt(
        OCTRA_DECIMALS
      )
    ) +
    BigInt(
      fracPart || '0'
    );

  if (
    raw <= 0n ||
    raw > MAX_OCT_RAW
  ) {
    throw new Error(
      'invalid amount'
    );
  }

  return raw.toString();
}

function rawToDisplay(
  raw
) {

  raw =
    BigInt(raw);

  const i =
    raw /
    BigInt(
      OCTRA_DECIMALS
    );

  const d =
    raw %
    BigInt(
      OCTRA_DECIMALS
    );

  return `${i}.${d
    .toString()
    .padStart(
      6,
      '0'
    )}`;
}

function deriveAddress(
  publicKey
) {

  if (
    !publicKey ||
    !publicKey.length
  ) {
    throw new Error(
      'invalid public key'
    );
  }

  const hash =
    sha256(publicKey);

  return (
    'oct' +
    base58Encode(hash)
  );
}

function signMessage(
  message,
  secretKey
) {

  const sig =
    nacl.sign.detached(
      utf8Encode(message),
      secretKey
    );

  return base64Encode(sig);
}

class Wallet {

  constructor({
    secretKey,
    publicKey,
    mnemonic = null,
    rpc = DEFAULT_RPC,
    hdIndex = 0,
    hdVersion = 2
  }) {

    this.secretKey =
      Uint8Array.from(
        secretKey
      );

    this.publicKey =
      Uint8Array.from(
        publicKey
      );

    this.address =
      deriveAddress(
        this.publicKey
      );

    this.mnemonic =
      mnemonic;

    this.rpc =
      rpc;

    this.hdIndex =
      hdIndex;

    this.hdVersion =
      hdVersion;

    this.privateKey =
      base64Encode(
        this.secretKey.slice(
          0,
          32
        )
      );

    this.publicKeyBase64 =
      base64Encode(
        this.publicKey
      );

    this.provider =
      new Provider(rpc);
  }

  static createRandom(
    rpc = DEFAULT_RPC
  ) {

    const mnemonic =
      generateMnemonic12();

    const seed =
      mnemonicToSeed(
        mnemonic
      );

    const hdSeed =
      deriveHdSeed(
        seed,
        0,
        2
      );

    const pair =
      keypairFromSeed(
        hdSeed
      );

    return new Wallet({
      secretKey:
        pair.secretKey,

      publicKey:
        pair.publicKey,

      mnemonic,

      rpc,

      hdIndex: 0,

      hdVersion: 2
    });
  }

  static fromMnemonic(
    mnemonic,
    rpc = DEFAULT_RPC,
    hdIndex = 0,
    hdVersion = 2
  ) {

    if (
      !validateMnemonic(
        mnemonic
      )
    ) {
      throw new Error(
        'invalid mnemonic'
      );
    }

    const seed =
      mnemonicToSeed(
        mnemonic
      );

    const hdSeed =
      deriveHdSeed(
        seed,
        hdIndex,
        hdVersion
      );

    const pair =
      keypairFromSeed(
        hdSeed
      );

    return new Wallet({
      secretKey:
        pair.secretKey,

      publicKey:
        pair.publicKey,

      mnemonic,

      rpc,

      hdIndex,

      hdVersion
    });
  }

  static fromPrivateKey(
    privateKey,
    rpc = DEFAULT_RPC
  ) {

    const raw =
      base64Decode(
        privateKey.trim()
      );

    let pair;

    if (
      raw.length >= 64
    ) {

      pair = {
        secretKey:
          raw.slice(0, 64),

        publicKey:
          raw.slice(
            32,
            64
          )
      };

    } else {

      pair =
        keypairFromSeed(
          raw.slice(0, 32)
        );
    }

    return new Wallet({
      secretKey:
        pair.secretKey,

      publicKey:
        pair.publicKey,

      rpc
    });
  }

  connect(rpc) {

    this.rpc =
      rpc;

    this.provider =
      new Provider(rpc);

    return this;
  }

  async getBalance() {

    return this.provider.getBalance(
      this.address
    );
  }

  async getAccount() {

    return this.provider.getAccount(
      this.address
    );
  }

  async getHistory(
    limit = 20,
    offset = 0
  ) {

    return this.provider.getHistory(
      this.address,
      limit,
      offset
    );
  }

  async sendTransaction({
    to,
    amount,
    ou,
    message = ''
  }) {

    const account =
      await this.getAccount();

    const nonce =
      (
        account
          ?.pending_nonce ??
        account?.nonce ??
        0
      ) + 1;

    const raw =
      normalizeAmount(
        amount
      );

    const tx = {
      from:
        this.address,

      to_:
        to,

      amount:
        raw,

      nonce,

      ou:
        ou ||
        (
          BigInt(raw) <
          1_000_000_000n
            ? '10000'
            : '30000'
        ),

      timestamp:
        now(),

      op_type:
        'standard'
    };

    if (
      message
    ) {
      tx.message =
        message;
    }

    tx.signature =
      this.signTransaction(
        tx
      );

    tx.public_key =
      this.publicKeyBase64;

    const result =
      await this.provider.rpc.submitTx(
        tx
      );

    if (
      !result.ok
    ) {
      throw new Error(
        result.error
      );
    }

    return result.result;
  }

  async transfer(
    to,
    amount,
    options = {}
  ) {

    return this.sendTransaction({
      to,
      amount,
      ...options
    });
  }

  async deployContract({
    bytecode,
    params = '',
    ou = '50000000'
  }) {

    const account =
      await this.getAccount();

    const nonce =
      (
        account
          ?.pending_nonce ??
        account?.nonce ??
        0
      ) + 1;

    const computed =
      await this.provider.rpc.computeContractAddress(
        bytecode,
        this.address,
        nonce
      );

    if (
      !computed.ok
    ) {
      throw new Error(
        computed.error
      );
    }

    const tx = {
      from:
        this.address,

      to_:
        computed.result
          .address,

      amount:
        '0',

      nonce,

      ou,

      timestamp:
        now(),

      op_type:
        'deploy',

      encrypted_data:
        bytecode
    };

    if (
      params
    ) {
      tx.message =
        params;
    }

    tx.signature =
      this.signTransaction(
        tx
      );

    tx.public_key =
      this.publicKeyBase64;

    const result =
      await this.provider.rpc.submitTx(
        tx
      );

    if (
      !result.ok
    ) {
      throw new Error(
        result.error
      );
    }

    return {
      txHash:
        result.result
          .tx_hash,

      contractAddress:
        computed.result
          .address
    };
  }

  async callContract({
    address,
    method,
    params = [],
    amount = '0',
    ou = '1000'
  }) {

    const account =
      await this.getAccount();

    const nonce =
      (
        account
          ?.pending_nonce ??
        account?.nonce ??
        0
      ) + 1;

    const tx = {
      from:
        this.address,

      to_:
        address,

      amount:
        normalizeAmount(
          amount
        ),

      nonce,

      ou,

      timestamp:
        now(),

      op_type:
        'call',

      encrypted_data:
        method,

      message:
        JSON.stringify(
          params
        )
    };

    tx.signature =
      this.signTransaction(
        tx
      );

    tx.public_key =
      this.publicKeyBase64;

    const result =
      await this.provider.rpc.submitTx(
        tx
      );

    if (
      !result.ok
    ) {
      throw new Error(
        result.error
      );
    }

    return result.result;
  }

  signTransaction(
    tx
  ) {

    const canonical =
      canonicalTx(tx);

    const sig =
      nacl.sign.detached(
        utf8Encode(
          canonical
        ),
        this.secretKey
      );

    return base64Encode(
      sig
    );
  }

  verifyTransaction(
    tx
  ) {

    const signature =
      base64Decode(
        tx.signature
      );

    const copy = {
      ...tx
    };

    delete copy.signature;
    delete copy.public_key;

    const canonical =
      canonicalTx(copy);

    return nacl.sign.detached.verify(
      utf8Encode(
        canonical
      ),
      signature,
      this.publicKey
    );
  }
}

class Provider {

  constructor(
    rpc = DEFAULT_RPC
  ) {

    this.rpc =
      new RpcClient(rpc);

    this.rpcUrl =
      rpc;
  }

  async getBalance(
    address
  ) {

    const result =
      await this.rpc.getBalance(
        address
      );

    if (
      !result.ok
    ) {
      throw new Error(
        result.error
      );
    }

    return {
      address,

      raw:
        result.result
          ?.balance_raw ||
        '0',

      formatted:
        rawToDisplay(
          result.result
            ?.balance_raw ||
            '0'
        ),

      nonce:
        result.result
          ?.nonce || 0,

      pendingNonce:
        result.result
          ?.pending_nonce ||
        0
    };
  }

  async getAccount(
    address,
    limit = 20
  ) {

    const result =
      await this.rpc.getAccount(
        address,
        limit
      );

    if (
      !result.ok
    ) {
      throw new Error(
        result.error
      );
    }

    return result.result;
  }

  async getTransaction(
    hash
  ) {

    const result =
      await this.rpc.getTransaction(
        hash
      );

    if (
      !result.ok
    ) {
      throw new Error(
        result.error
      );
    }

    return result.result;
  }

  async waitForTransaction(
    hash,
    interval = 3000
  ) {

    while (true) {

      try {

        const tx =
          await this.getTransaction(
            hash
          );

        if (
          tx.status ===
            'confirmed' ||
          tx.epoch ||
          tx.block_height
        ) {
          return tx;
        }

      } catch {}

      await sleep(
        interval
      );
    }
  }

  async getHistory(
    address,
    limit = 20,
    offset = 0
  ) {

    const result =
      await this.rpc.getTxsByAddress(
        address,
        limit,
        offset
      );

    if (
      !result.ok
    ) {
      throw new Error(
        result.error
      );
    }

    return (
      result.result
        ?.transactions || []
    );
  }

  async call(
    address,
    method,
    params = [],
    caller = ''
  ) {

    const result =
      await this.rpc.contractCallView(
        address,
        method,
        params,
        caller
      );

    if (
      !result.ok
    ) {
      throw new Error(
        result.error
      );
    }

    return result.result;
  }

  async getFees() {

    const methods = [
      'octra_recommendedFee',
      'octra_recommendedFee',
      'octra_recommendedFee',
      'octra_recommendedFee',
      'octra_recommendedFee',
      'octra_recommendedFee',
      'octra_recommendedFee'
    ];

    const params = [
      ['standard'],
      ['encrypt'],
      ['decrypt'],
      ['stealth'],
      ['claim'],
      ['deploy'],
      ['call']
    ];

    const result =
      await this.rpc.callBatch(
        methods,
        params
      );

    return {
      standard:
        result[0]?.result,

      encrypt:
        result[1]?.result,

      decrypt:
        result[2]?.result,

      stealth:
        result[3]?.result,

      claim:
        result[4]?.result,

      deploy:
        result[5]?.result,

      call:
        result[6]?.result
    };
  }
}

class Contract {

  constructor(
    address,
    abi = [],
    signerOrProvider
  ) {

    this.address =
      address;

    this.abi =
      abi;

    this.runner =
      signerOrProvider;

    for (const item of abi) {

      if (
        item.type ===
        'function'
      ) {

        this[
          item.name
        ] = async (
          ...args
        ) => {

          if (
            item.stateMutability ===
              'view' ||
            item.constant
          ) {

            return this.runner.call(
              address,
              item.name,
              args,
              this.runner
                ?.address ||
                ''
            );
          }

          return this.runner.callContract(
            {
              address,

              method:
                item.name,

              params:
                args
            }
          );
        };
      }
    }
  }
}

const octra = {
  Wallet,
  Provider,
  Contract,

  utils: {
    sha256,
    hexEncode,
    base64Encode,
    base64Decode,
    normalizeAmount,
    rawToDisplay,
    deriveAddress,
    randomBytes,
    canonicalTx
  },

  version:
    '1.1.0'
};

globalThis.octra =
  octra;

export {
  Wallet,
  Provider,
  Contract,
  octra
};

export default octra;