// Zero-dependency Cardano helpers shared by the site and the Worker.
// hex, CBOR (decode + tiny encode), bech32, address parsing, canonical JSON, sha256.

export const hexToBytes = (h) => {
  if (h.length % 2) throw new Error('bad hex');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
};
export const bytesToHex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
export const utf8ToHex = (s) => bytesToHex(new TextEncoder().encode(s));
export const hexToUtf8 = (h) => new TextDecoder().decode(hexToBytes(h));
export const eqBytes = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

// ---------- CBOR decode ----------
export function cborDecode(input) {
  const b = typeof input === 'string' ? hexToBytes(input) : input;
  let p = 0;
  const big = (n) => (n <= Number.MAX_SAFE_INTEGER ? Number(n) : n);
  function readArg(ai) {
    if (ai < 24) return ai;
    if (ai === 24) return b[p++];
    if (ai === 25) { const v = (b[p] << 8) | b[p + 1]; p += 2; return v; }
    if (ai === 26) { const v = ((b[p] << 24) >>> 0) + ((b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]); p += 4; return v; }
    if (ai === 27) { let v = 0n; for (let i = 0; i < 8; i++) v = (v << 8n) | BigInt(b[p++]); return big(v); }
    throw new Error('cbor: bad additional info ' + ai);
  }
  function item() {
    const ib = b[p++];
    if (ib === undefined) throw new Error('cbor: truncated');
    const mt = ib >> 5, ai = ib & 31;
    if (mt === 7) {
      if (ai === 20) return false; if (ai === 21) return true; if (ai === 22 || ai === 23) return null;
      throw new Error('cbor: unsupported simple/float');
    }
    if (ai === 31) { // indefinite
      if (mt === 2 || mt === 3) {
        const parts = [];
        while (b[p] !== 0xff) parts.push(item());
        p++;
        if (mt === 3) return parts.join('');
        const tot = parts.reduce((n, x) => n + x.length, 0), out = new Uint8Array(tot); let o = 0;
        for (const x of parts) { out.set(x, o); o += x.length; }
        return out;
      }
      if (mt === 4) { const a = []; while (b[p] !== 0xff) a.push(item()); p++; return a; }
      if (mt === 5) { const m = new Map(); while (b[p] !== 0xff) { const k = item(); m.set(k, item()); } p++; return m; }
      throw new Error('cbor: bad indefinite');
    }
    const arg = readArg(ai);
    switch (mt) {
      case 0: return arg;
      case 1: return typeof arg === 'bigint' ? -1n - arg : -1 - arg;
      case 2: { const v = b.slice(p, p + arg); p += arg; return v; }
      case 3: { const v = new TextDecoder().decode(b.slice(p, p + arg)); p += arg; return v; }
      case 4: { const a = []; for (let i = 0; i < arg; i++) a.push(item()); return a; }
      case 5: { const m = new Map(); for (let i = 0; i < arg; i++) { const k = item(); m.set(k, item()); } return m; }
      case 6: {
        const v = item();
        if (arg === 2 && v instanceof Uint8Array) return big(BigInt('0x' + (bytesToHex(v) || '0')));
        if (arg === 3 && v instanceof Uint8Array) return -1n - BigInt('0x' + (bytesToHex(v) || '0'));
        return v; // ignore other tags
      }
    }
  }
  return item();
}

// ---------- CBOR encode (uint, bytes, text, array only: enough for COSE Sig_structure) ----------
export function cborEncode(v) {
  const head = (mt, n) => {
    if (n < 24) return [(mt << 5) | n];
    if (n < 256) return [(mt << 5) | 24, n];
    if (n < 65536) return [(mt << 5) | 25, n >> 8, n & 255];
    return [(mt << 5) | 26, (n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
  };
  const parts = [];
  (function enc(x) {
    if (typeof x === 'number') parts.push(Uint8Array.from(head(0, x)));
    else if (typeof x === 'string') { const u = new TextEncoder().encode(x); parts.push(Uint8Array.from(head(3, u.length)), u); }
    else if (x instanceof Uint8Array) parts.push(Uint8Array.from(head(2, x.length)), x);
    else if (Array.isArray(x)) { parts.push(Uint8Array.from(head(4, x.length))); x.forEach(enc); }
    else throw new Error('cborEncode: unsupported');
  })(v);
  const len = parts.reduce((n, x) => n + x.length, 0), out = new Uint8Array(len); let o = 0;
  for (const x of parts) { out.set(x, o); o += x.length; }
  return out;
}

// ---------- bech32 ----------
const CH = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
const polymod = (vals) => {
  let chk = 1;
  for (const v of vals) { const top = chk >>> 25; chk = ((chk & 0x1ffffff) << 5) ^ v; for (let i = 0; i < 5; i++) if ((top >>> i) & 1) chk ^= GEN[i]; }
  return chk >>> 0;
};
const hrpExp = (h) => [...h].map((c) => c.charCodeAt(0) >> 5).concat([0], [...h].map((c) => c.charCodeAt(0) & 31));
const conv = (data, from, to, pad) => {
  let acc = 0, bits = 0; const out = [], max = (1 << to) - 1;
  for (const v of data) { acc = (acc << from) | v; bits += from; while (bits >= to) { bits -= to; out.push((acc >> bits) & max); } }
  if (pad && bits) out.push((acc << (to - bits)) & max);
  return out;
};
export function bech32Encode(hrp, bytes) {
  const d = conv(bytes, 8, 5, true);
  const mod = polymod(hrpExp(hrp).concat(d, [0, 0, 0, 0, 0, 0])) ^ 1;
  const chk = Array.from({ length: 6 }, (_, i) => (mod >>> (5 * (5 - i))) & 31);
  return hrp + '1' + d.concat(chk).map((x) => CH[x]).join('');
}
export function bech32Decode(str) {
  const s = str.toLowerCase(), i = s.lastIndexOf('1');
  if (i < 1) throw new Error('bech32');
  const hrp = s.slice(0, i), d = [...s.slice(i + 1)].map((c) => CH.indexOf(c));
  if (d.includes(-1) || polymod(hrpExp(hrp).concat(d)) !== 1) throw new Error('bech32 checksum');
  return { hrp, bytes: Uint8Array.from(conv(d.slice(0, -6), 5, 8, false)) };
}

// ---------- addresses ----------
export function parseAddress(hexOrBytes) {
  const b = typeof hexOrBytes === 'string' ? hexToBytes(hexOrBytes) : hexOrBytes;
  const type = b[0] >> 4, net = b[0] & 15;
  const o = { type, net, payment: null, stake: null, payKey: false, stakeKey: false, kind: 'other' };
  if (type <= 3 && b.length >= 57) { o.kind = 'base'; o.payment = b.slice(1, 29); o.stake = b.slice(29, 57); o.payKey = type === 0 || type === 2; o.stakeKey = type === 0 || type === 1; }
  else if (type === 6 || type === 7) { o.kind = 'enterprise'; o.payment = b.slice(1, 29); o.payKey = type === 6; }
  else if (type === 14 || type === 15) { o.kind = 'reward'; o.stake = b.slice(1, 29); o.stakeKey = type === 14; }
  return o;
}
export const stakeAddressFromHash = (hash, net = 1) => bech32Encode(net === 1 ? 'stake' : 'stake_test', Uint8Array.from([net === 1 ? 0xe1 : 0xe0, ...hash]));

// ---------- assets from a CIP-30 getBalance() value ----------
export function assetsFromBalance(balanceHex) {
  const v = cborDecode(balanceHex);
  const out = [];
  if (!Array.isArray(v) || !(v[1] instanceof Map)) return out;
  for (const [pol, names] of v[1]) for (const [nm, q] of names) out.push({ policy: bytesToHex(pol), nameHex: bytesToHex(nm), qty: q });
  return out;
}

// ---------- canonical JSON + sha256 ----------
export function canonical(x) {
  if (Array.isArray(x)) return '[' + x.map(canonical).join(',') + ']';
  if (x && typeof x === 'object') return '{' + Object.keys(x).sort().map((k) => JSON.stringify(k) + ':' + canonical(x[k])).join(',') + '}';
  return JSON.stringify(x);
}
export async function sha256Hex(str) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))));
}
