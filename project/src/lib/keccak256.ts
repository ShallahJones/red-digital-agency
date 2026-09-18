// Minimal, dependency-free Keccak-256 (the original Keccak, not NIST SHA3) implementation
// using BigInt for 64-bit lane arithmetic, used only client-side to compute EIP-55 checksum
// casing for whitelist address validation.

const MASK64 = (1n << 64n) - 1n;

function rotl64(x: bigint, n: number): bigint {
  const nn = BigInt(n % 64);
  if (nn === 0n) return x & MASK64;
  return ((x << nn) | (x >> (64n - nn))) & MASK64;
}

const RC: bigint[] = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];

// r[x][y] rotation offsets, canonical Keccak table, indexed [x][y]
const ROT: number[][] = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];

function keccakF1600(state: bigint[]) {
  // state indexed as state[x + 5*y]
  for (let round = 0; round < 24; round++) {
    // theta
    const C = new Array<bigint>(5);
    for (let x = 0; x < 5; x++) {
      C[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    const D = new Array<bigint>(5);
    for (let x = 0; x < 5; x++) {
      D[x] = C[(x + 4) % 5] ^ rotl64(C[(x + 1) % 5], 1);
    }
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        state[x + 5 * y] ^= D[x];
      }
    }

    // rho + pi: B[y, (2x+3y) mod 5] = rot(A[x,y], r[x][y])
    const B = new Array<bigint>(25);
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        const newX = y;
        const newY = (2 * x + 3 * y) % 5;
        B[newX + 5 * newY] = rotl64(state[x + 5 * y], ROT[x][y]);
      }
    }

    // chi
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 5; y++) {
        state[x + 5 * y] =
          B[x + 5 * y] ^ (~B[(x + 1) % 5 + 5 * y] & B[(x + 2) % 5 + 5 * y] & MASK64);
      }
    }

    // iota
    state[0] ^= RC[round];
  }
}

export function keccak256(inputBytes: Uint8Array): Uint8Array {
  const rateBytes = 136; // 1088 bits, for Keccak-256
  const state = new Array<bigint>(25).fill(0n);

  // padding (original Keccak, not SHA3: pad with 0x01 ... 0x80)
  const numBlocks = Math.floor(inputBytes.length / rateBytes) + 1;
  const padded = new Uint8Array(numBlocks * rateBytes);
  padded.set(inputBytes);
  padded[inputBytes.length] ^= 0x01;
  padded[padded.length - 1] ^= 0x80;

  for (let offset = 0; offset < padded.length; offset += rateBytes) {
    for (let i = 0; i < rateBytes / 8; i++) {
      let lane = 0n;
      const byteOff = offset + i * 8;
      for (let b = 7; b >= 0; b--) {
        lane = (lane << 8n) | BigInt(padded[byteOff + b]);
      }
      state[i] ^= lane;
    }
    keccakF1600(state);
  }

  const out = new Uint8Array(32);
  for (let i = 0; i < 4; i++) {
    let lane = state[i];
    for (let b = 0; b < 8; b++) {
      out[i * 8 + b] = Number(lane & 0xffn);
      lane >>= 8n;
    }
  }
  return out;
}

function keccak256Hex(asciiInput: string): string {
  const bytes = new Uint8Array(asciiInput.length);
  for (let i = 0; i < asciiInput.length; i++) bytes[i] = asciiInput.charCodeAt(i);
  const digest = keccak256(bytes);
  return Array.from(digest)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Returns the EIP-55 checksummed form of a lowercase (no 0x) hex address. */
export function toChecksumAddress(addressNoPrefix: string): string {
  const lower = addressNoPrefix.toLowerCase();
  const hash = keccak256Hex(lower);
  let result = "";
  for (let i = 0; i < lower.length; i++) {
    const c = lower[i];
    if (/[0-9]/.test(c)) {
      result += c;
    } else {
      result += parseInt(hash[i], 16) >= 8 ? c.toUpperCase() : c;
    }
  }
  return result;
}

/**
 * Validates an EVM address's checksum per EIP-55.
 * All-lowercase and all-uppercase addresses (no checksum info present) are accepted as-is.
 * A mixed-case address must match its correct checksum casing exactly, or it's rejected.
 */
export function isValidChecksum(address: string): boolean {
  const hex = address.slice(2);
  const isAllLower = hex === hex.toLowerCase();
  const isAllUpper = hex === hex.toUpperCase();
  if (isAllLower || isAllUpper) return true;
  return toChecksumAddress(hex) === hex;
}
