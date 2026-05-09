import nacl from 'tweetnacl';
import bs58 from 'bs58';
import bip39 from 'bip39';

import {
  sha256 as nobleSha256
} from '@noble/hashes/sha256';

import {
  sha512 as nobleSha512
} from '@noble/hashes/sha512';

import {
  hmac
} from '@noble/hashes/hmac';

import {
  pbkdf2
} from '@noble/hashes/pbkdf2';

import {
  utf8ToBytes
} from '@noble/hashes/utils';

const textEncoder =
  new TextEncoder();

const textDecoder =
  new TextDecoder();

function toUint8Array(data) {

  if (
    data instanceof Uint8Array
  ) {
    return data;
  }

  if (
    Array.isArray(data)
  ) {
    return Uint8Array.from(data);
  }

  if (
    typeof data === 'string'
  ) {
    return textEncoder.encode(data);
  }

  if (
    data instanceof ArrayBuffer
  ) {
    return new Uint8Array(data);
  }

  if (
    ArrayBuffer.isView(data)
  ) {
    return new Uint8Array(
      data.buffer
    );
  }

  return new Uint8Array(data);
}

function concatBytes(
  ...arrays
) {

  let total = 0;

  for (const arr of arrays) {
    total += arr.length;
  }

  const result =
    new Uint8Array(total);

  let offset = 0;

  for (const arr of arrays) {

    const bytes =
      toUint8Array(arr);

    result.set(
      bytes,
      offset
    );

    offset += bytes.length;
  }

  return result;
}

function sha256(
  data
) {

  return Uint8Array.from(
    nobleSha256(
      toUint8Array(data)
    )
  );
}

function sha512(
  data
) {

  return Uint8Array.from(
    nobleSha512(
      toUint8Array(data)
    )
  );
}

function base64Encode(
  data
) {

  if (
    typeof Buffer !==
    'undefined'
  ) {

    return Buffer
      .from(
        toUint8Array(data)
      )
      .toString('base64');
  }

  let binary = '';

  const bytes =
    toUint8Array(data);

  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {
    binary +=
      String.fromCharCode(
        bytes[i]
      );
  }

  return btoa(binary);
}

function base64Decode(
  data
) {

  if (
    typeof Buffer !==
    'undefined'
  ) {

    return Uint8Array.from(
      Buffer.from(
        data,
        'base64'
      )
    );
  }

  const binary =
    atob(data);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
}

function base58Encode(
  data
) {

  return bs58.encode(
    toUint8Array(data)
  );
}

function base58Decode(
  data
) {

  return Uint8Array.from(
    bs58.decode(data)
  );
}

function hexEncode(
  data
) {

  return Array
    .from(
      toUint8Array(data)
    )
    .map((v) =>
      v
        .toString(16)
        .padStart(2, '0')
    )
    .join('');
}

function hexDecode(
  hex
) {

  if (
    hex.length % 2 !== 0
  ) {
    throw new Error(
      'invalid hex'
    );
  }

  const bytes =
    new Uint8Array(
      hex.length / 2
    );

  for (
    let i = 0;
    i < bytes.length;
    i++
  ) {

    bytes[i] =
      parseInt(
        hex.substr(
          i * 2,
          2
        ),
        16
      );
  }

  return bytes;
}

function utf8Encode(
  str
) {

  return textEncoder.encode(
    str
  );
}

function utf8Decode(
  bytes
) {

  return textDecoder.decode(
    toUint8Array(bytes)
  );
}

function randomBytes(
  len
) {

  if (
    globalThis.crypto &&
    globalThis.crypto
      .getRandomValues
  ) {

    const arr =
      new Uint8Array(len);

    globalThis.crypto
      .getRandomValues(
        arr
      );

    return arr;
  }

  return nacl.randomBytes(
    len
  );
}

function secureZero(
  buffer
) {

  if (
    buffer instanceof Uint8Array
  ) {
    buffer.fill(0);
  }
}

function keypairFromSeed(
  seed
) {

  seed =
    toUint8Array(seed);

  if (
    seed.length < 32
  ) {
    throw new Error(
      'seed must be 32 bytes'
    );
  }

  const pair =
    nacl.sign.keyPair.fromSeed(
      seed.slice(0, 32)
    );

  return {
    publicKey:
      pair.publicKey,

    secretKey:
      pair.secretKey
  };
}

function ed25519SkToCurve25519(
  secretKey
) {

  const seed =
    toUint8Array(secretKey)
      .slice(0, 32);

  const hash =
    sha512(seed);

  hash[0] &= 248;
  hash[31] &= 127;
  hash[31] |= 64;

  return hash.slice(0, 32);
}

function ed25519PkToCurve25519(
  secretKey
) {

  const xSk =
    ed25519SkToCurve25519(
      secretKey
    );

  return nacl.scalarMult.base(
    xSk
  );
}

function deriveKeyFromPin(
  pin,
  salt,
  iterations = 600000
) {

  return Uint8Array.from(
    pbkdf2(
      nobleSha256,
      utf8ToBytes(pin),
      toUint8Array(salt),
      {
        c: iterations,
        dkLen: 32
      }
    )
  );
}

function walletEncrypt(
  plaintext,
  pin
) {

  throw new Error(
    'AES-GCM removed from sync mode'
  );
}

function walletDecrypt(
  data,
  pin
) {

  throw new Error(
    'AES-GCM removed from sync mode'
  );
}

function hmacSha512(
  key,
  data
) {

  return Uint8Array.from(
    hmac(
      nobleSha512,
      toUint8Array(key),
      toUint8Array(data)
    )
  );
}

function deriveHdSeed(
  masterSeed,
  index,
  hdVersion = 2
) {

  masterSeed =
    toUint8Array(masterSeed);

  if (
    hdVersion === 1 &&
    index === 0
  ) {
    return masterSeed.slice(
      0,
      32
    );
  }

  const hmacKey =
    utf8Encode(
      'Octra seed'
    );

  if (
    hdVersion === 2 &&
    index === 0
  ) {

    const out =
      hmacSha512(
        hmacKey,
        masterSeed
      );

    return out.slice(
      0,
      32
    );
  }

  const data =
    new Uint8Array(68);

  data.set(
    masterSeed,
    0
  );

  const view =
    new DataView(
      data.buffer
    );

  view.setUint32(
    64,
    index,
    true
  );

  const result =
    hmacSha512(
      hmacKey,
      data
    );

  secureZero(data);

  return result.slice(
    0,
    32
  );
}

function mnemonicToSeed(
  mnemonic,
  passphrase = ''
) {

  return Uint8Array.from(
    bip39.mnemonicToSeedSync(
      mnemonic,
      passphrase
    )
  );
}

function generateMnemonic12() {

  return bip39.generateMnemonic(
    128
  );
}

function validateMnemonic(
  mnemonic
) {

  return bip39.validateMnemonic(
    mnemonic
  );
}

function looksLikeMnemonic(
  input
) {

  return (
    input
      .trim()
      .split(/\s+/g)
      .length >= 12
  );
}

export {
  sha256,
  sha512,

  base64Encode,
  base64Decode,

  base58Encode,
  base58Decode,

  hexEncode,
  hexDecode,

  utf8Encode,
  utf8Decode,

  randomBytes,
  secureZero,

  keypairFromSeed,

  ed25519SkToCurve25519,
  ed25519PkToCurve25519,

  deriveKeyFromPin,

  walletEncrypt,
  walletDecrypt,

  hmacSha512,

  deriveHdSeed,

  mnemonicToSeed,
  generateMnemonic12,
  validateMnemonic,
  looksLikeMnemonic,

  toUint8Array,
  concatBytes
};