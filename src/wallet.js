import {
  sha256,
  base64Encode,
  base64Decode,
  base58Encode,
  secureZero,
  keypairFromSeed,
  walletEncrypt,
  walletDecrypt,
  deriveHdSeed,
  mnemonicToSeed,
  generateMnemonic12,
  validateMnemonic
} from './crypto-utils.js';

const DEFAULT_RPC =
  'http://46.101.86.250:8080';

const DEFAULT_EXPLORER =
  'https://octrascan.io';

const computeSeedHash = (
  masterSeedB64
) => {
  const raw = base64Decode(
    masterSeedB64
  );

  return Buffer.from(
    sha256(raw)
  )
    .subarray(0, 8)
    .toString('hex');
};

const deriveAddress = (
  publicKey
) => {
  const hash = sha256(publicKey);

  let b58 = base58Encode(hash);

  while (b58.length < 44) {
    b58 = `1${b58}`;
  }

  return `oct${b58}`;
};

const createWalletObject = ({
  secretKey,
  publicKey,
  rpcUrl = DEFAULT_RPC,
  explorerUrl = DEFAULT_EXPLORER,
  bridgeSignerUrl = '',
  masterSeedB64 = '',
  mnemonic = '',
  hdIndex = 0,
  hdVersion = 1
}) => {
  const addr = deriveAddress(
    publicKey
  );

  if (
    addr.length !== 47 ||
    !addr.startsWith('oct')
  ) {
    throw new Error(
      'derived address is invalid'
    );
  }

  return {
    priv_b64: base64Encode(
      Buffer.from(secretKey).subarray(
        0,
        32
      )
    ),

    addr,

    rpc_url: rpcUrl,

    explorer_url: explorerUrl,

    bridge_signer_url:
      bridgeSignerUrl,

    sk: Uint8Array.from(secretKey),

    pk: Uint8Array.from(publicKey),

    pub_b64: base64Encode(
      publicKey
    ),

    master_seed_b64:
      masterSeedB64,

    mnemonic,

    hd_index: hdIndex,

    hd_version: hdVersion,

    has_master_seed() {
      return !!this.master_seed_b64;
    }
  };
};

const saveWalletEncrypted = (
  wallet,
  pin
) => {
  const payload = {
    priv: wallet.priv_b64,
    addr: wallet.addr,
    rpc: wallet.rpc_url,
    explorer:
      wallet.explorer_url,
    bridge_signer:
      wallet.bridge_signer_url
  };

  if (wallet.master_seed_b64) {
    payload.master_seed =
      wallet.master_seed_b64;

    payload.hd_index =
      wallet.hd_index;

    payload.hd_version =
      wallet.hd_version;

    if (wallet.mnemonic) {
      payload.mnemonic =
        wallet.mnemonic;
    }
  }

  const plaintext =
    JSON.stringify(payload);

  const encrypted =
    walletEncrypt(
      Buffer.from(plaintext),
      pin
    );

  return encrypted;
};

const loadWalletEncrypted = (
  encryptedData,
  pin
) => {
  const plain = walletDecrypt(
    encryptedData,
    pin
  );

  if (!plain) {
    throw new Error('wrong pin');
  }

  const json = JSON.parse(
    Buffer.from(plain).toString()
  );

  secureZero(plain);

  const raw = base64Decode(
    json.priv
  );

  let pair;

  if (raw.length >= 64) {
    pair = {
      secretKey: raw,
      publicKey: raw.slice(32, 64)
    };
  } else if (raw.length >= 32) {
    pair = keypairFromSeed(
      raw.slice(0, 32)
    );
  } else {
    throw new Error(
      'invalid private key'
    );
  }

  return createWalletObject({
    secretKey: pair.secretKey,
    publicKey: pair.publicKey,
    rpcUrl:
      json.rpc || DEFAULT_RPC,
    explorerUrl:
      json.explorer ||
      DEFAULT_EXPLORER,
    bridgeSignerUrl:
      json.bridge_signer || '',
    masterSeedB64:
      json.master_seed || '',
    mnemonic:
      json.mnemonic || '',
    hdIndex:
      json.hd_index || 0,
    hdVersion:
      json.hd_version || 1
  });
};

const createWallet = (
  pin
) => {
  const mnemonic =
    generateMnemonic12();

  const seed =
    mnemonicToSeed(mnemonic);

  const hdSeed = deriveHdSeed(
    seed,
    0,
    2
  );

  const pair =
    keypairFromSeed(hdSeed);

  const wallet =
    createWalletObject({
      secretKey:
        pair.secretKey,
      publicKey:
        pair.publicKey,
      masterSeedB64:
        base64Encode(seed),
      mnemonic,
      hdIndex: 0,
      hdVersion: 2
    });

  const encrypted =
    saveWalletEncrypted(
      wallet,
      pin
    );

  secureZero(seed);
  secureZero(hdSeed);

  return {
    wallet,
    mnemonic,
    encrypted
  };
};

const importWalletMnemonic = (
  mnemonic,
  pin,
  hdVersion = 1
) => {
  if (
    !validateMnemonic(
      mnemonic
    )
  ) {
    throw new Error(
      'invalid seed phrase'
    );
  }

  const seed =
    mnemonicToSeed(mnemonic);

  const hdSeed = deriveHdSeed(
    seed,
    0,
    hdVersion
  );

  const pair =
    keypairFromSeed(hdSeed);

  const wallet =
    createWalletObject({
      secretKey:
        pair.secretKey,
      publicKey:
        pair.publicKey,
      masterSeedB64:
        base64Encode(seed),
      mnemonic,
      hdIndex: 0,
      hdVersion
    });

  const encrypted =
    saveWalletEncrypted(
      wallet,
      pin
    );

  secureZero(seed);
  secureZero(hdSeed);

  return {
    wallet,
    encrypted
  };
};

const importWallet = (
  privB64Raw,
  pin
) => {
  const clean =
    privB64Raw.replace(
      /\s+/g,
      ''
    );

  const raw =
    base64Decode(clean);

  let pair;

  if (raw.length >= 64) {
    pair = {
      secretKey: raw,
      publicKey: raw.slice(
        32,
        64
      )
    };
  } else if (raw.length >= 32) {
    pair = keypairFromSeed(
      raw.slice(0, 32)
    );
  } else {
    throw new Error(
      'invalid private key length'
    );
  }

  const wallet =
    createWalletObject({
      secretKey:
        pair.secretKey,
      publicKey:
        pair.publicKey
    });

  const encrypted =
    saveWalletEncrypted(
      wallet,
      pin
    );

  return {
    wallet,
    encrypted
  };
};

const addrFromMnemonic = (
  mnemonic,
  hdVersion
) => {
  const seed =
    mnemonicToSeed(mnemonic);

  const hdSeed = deriveHdSeed(
    seed,
    0,
    hdVersion
  );

  const pair =
    keypairFromSeed(hdSeed);

  const addr = deriveAddress(
    pair.publicKey
  );

  secureZero(seed);
  secureZero(hdSeed);

  return addr;
};

const deriveHdAccount = ({
  masterSeedB64,
  index,
  rpcUrl = DEFAULT_RPC,
  explorerUrl = DEFAULT_EXPLORER,
  bridgeSignerUrl = '',
  pin,
  hdVersion = 2
}) => {
  const masterRaw =
    base64Decode(
      masterSeedB64
    );

  if (
    masterRaw.length !== 64
  ) {
    throw new Error(
      'invalid master seed'
    );
  }

  const hdSeed = deriveHdSeed(
    masterRaw,
    index,
    hdVersion
  );

  const pair =
    keypairFromSeed(hdSeed);

  const wallet =
    createWalletObject({
      secretKey:
        pair.secretKey,
      publicKey:
        pair.publicKey,
      rpcUrl,
      explorerUrl,
      bridgeSignerUrl,
      masterSeedB64,
      hdIndex: index,
      hdVersion
    });

  const encrypted =
    saveWalletEncrypted(
      wallet,
      pin
    );

  secureZero(masterRaw);
  secureZero(hdSeed);

  return {
    wallet,
    encrypted
  };
};

const recoverHdIndex = ({
  masterSeedB64,
  targetAddr,
  hdVersion,
  maxSearch = 64
}) => {
  const masterRaw =
    base64Decode(
      masterSeedB64
    );

  if (
    masterRaw.length !== 64
  ) {
    return -1;
  }

  for (
    let i = 0;
    i < maxSearch;
    i++
  ) {
    const hdSeed =
      deriveHdSeed(
        masterRaw,
        i,
        hdVersion
      );

    const pair =
      keypairFromSeed(
        hdSeed
      );

    const addr =
      deriveAddress(
        pair.publicKey
      );

    secureZero(hdSeed);

    if (addr === targetAddr) {
      secureZero(masterRaw);

      return i;
    }
  }

  secureZero(masterRaw);

  return -1;
};

const manifestUpsert = (
  manifest,
  entry
) => {
  const next = [...manifest];

  const index = next.findIndex(
    (v) => v.addr === entry.addr
  );

  if (index !== -1) {
    next[index] = {
      ...next[index],
      ...entry
    };
  } else {
    next.push(entry);
  }

  return next;
};

const manifestRemove = (
  manifest,
  addr
) => {
  return manifest.filter(
    (v) => v.addr !== addr
  );
};

const manifestRename = (
  manifest,
  addr,
  name
) => {
  return manifest.map((v) => {
    if (v.addr === addr) {
      return {
        ...v,
        name
      };
    }

    return v;
  });
};

const manifestNextHdIndex = (
  manifest,
  masterSeedB64
) => {
  const hash =
    computeSeedHash(
      masterSeedB64
    );

  let max = -1;

  for (const item of manifest) {
    if (
      item.hd &&
      item.master_seed_hash ===
        hash &&
      item.hd_index > max
    ) {
      max = item.hd_index;
    }
  }

  return max + 1;
};

export {
  DEFAULT_RPC,
  DEFAULT_EXPLORER,
  computeSeedHash,
  deriveAddress,
  createWalletObject,
  saveWalletEncrypted,
  loadWalletEncrypted,
  createWallet,
  importWalletMnemonic,
  importWallet,
  addrFromMnemonic,
  deriveHdAccount,
  recoverHdIndex,
  manifestUpsert,
  manifestRemove,
  manifestRename,
  manifestNextHdIndex
};