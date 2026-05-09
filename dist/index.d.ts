export interface BalanceInfo {
  address: string;
  raw: string;
  formatted: string;
  nonce: number;
  pendingNonce: number;
}

export interface TransactionResult {
  tx_hash?: string;
  hash?: string;
  [key: string]: any;
}

export interface SendTransactionOptions {
  to: string;
  amount: string | number | bigint;
  ou?: string;
  message?: string;
}

export interface DeployContractOptions {
  bytecode: string;
  params?: string;
  ou?: string;
}

export interface CallContractOptions {
  address: string;
  method: string;
  params?: any[];
  amount?: string | number;
  ou?: string;
}

export class Wallet {
  address: string;
  mnemonic?: string | null;
  privateKey: string;

  publicKey: Uint8Array;
  secretKey: Uint8Array;

  publicKeyBase64: string;

  rpc: string;

  hdIndex: number;

  hdVersion: number;

  provider: Provider;

  constructor(config: any);

  static createRandom(
    rpc?: string
  ): Wallet;

  static fromMnemonic(
    mnemonic: string,
    rpc?: string,
    hdIndex?: number,
    hdVersion?: number
  ): Wallet;

  static fromPrivateKey(
    privateKey: string,
    rpc?: string
  ): Wallet;

  connect(
    rpc: string
  ): Wallet;

  getBalance():
    Promise<BalanceInfo>;

  getAccount():
    Promise<any>;

  getHistory(
    limit?: number,
    offset?: number
  ): Promise<any[]>;

  transfer(
    to: string,
    amount: string | number,
    options?: Partial<
      SendTransactionOptions
    >
  ): Promise<TransactionResult>;

  sendTransaction(
    tx: SendTransactionOptions
  ): Promise<TransactionResult>;

  deployContract(
    config: DeployContractOptions
  ): Promise<{
    txHash: string;
    contractAddress: string;
  }>;

  callContract(
    config: CallContractOptions
  ): Promise<TransactionResult>;

  signTransaction(
    tx: any
  ): string;

  verifyTransaction(
    tx: any
  ): boolean;
}

export class Provider {
  rpc: any;

  rpcUrl: string;

  constructor(
    rpc?: string
  );

  getBalance(
    address: string
  ): Promise<BalanceInfo>;

  getAccount(
    address: string,
    limit?: number
  ): Promise<any>;

  getTransaction(
    hash: string
  ): Promise<any>;

  waitForTransaction(
    hash: string,
    interval?: number
  ): Promise<any>;

  getHistory(
    address: string,
    limit?: number,
    offset?: number
  ): Promise<any[]>;

  call(
    address: string,
    method: string,
    params?: any[],
    caller?: string
  ): Promise<any>;

  compileAml(
    source: string
  ): Promise<any>;

  compileAssembly(
    source: string
  ): Promise<any>;

  getFees(): Promise<any>;
}

export class Contract {
  address: string;

  abi: any[];

  runner: any;

  constructor(
    address: string,
    abi?: any[],
    signerOrProvider?: any
  );
}

export const octra: {
  Wallet: typeof Wallet;

  Provider: typeof Provider;

  Contract: typeof Contract;

  utils: {
    sha256(
      data: Uint8Array
    ): Uint8Array;

    hexEncode(
      data: Uint8Array
    ): string;

    base64Encode(
      data: Uint8Array
    ): string;

    base64Decode(
      data: string
    ): Uint8Array;

    normalizeAmount(
      amount:
        | string
        | number
        | bigint
    ): string;

    rawToDisplay(
      raw:
        | string
        | bigint
    ): string;

    deriveAddress(
      publicKey: Uint8Array
    ): string;

    randomBytes(
      length: number
    ): Uint8Array;

    canonicalTx(
      tx: any
    ): string;
  };

  version: string;
};

export default octra;