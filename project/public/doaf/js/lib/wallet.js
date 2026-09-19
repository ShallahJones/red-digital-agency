// CIP-30 wallet bridge. Read-only until the user signs a message. Never builds a transaction.
import { CONFIG } from '../config.js';
import { assetsFromBalance, bech32Decode, bytesToHex, parseAddress, stakeAddressFromHash, utf8ToHex } from './cardano.js';

const KNOWN = { nami: 'Nami', eternl: 'Eternl', lace: 'Lace', vespr: 'Vespr', yoroi: 'Yoroi', flint: 'Flint', typhoncip30: 'Typhon', gerowallet: 'Gero', nufi: 'NuFi', begin: 'Begin', tokeo: 'Tokeo', xverse: 'Xverse' };

export function listWallets() {
  const c = typeof window !== 'undefined' ? window.cardano : null;
  if (!c) return [];
  return Object.keys(c)
    .filter((k) => c[k] && typeof c[k].enable === 'function' && k !== 'enable')
    .map((k) => ({ key: k, name: c[k].name || KNOWN[k] || k, icon: c[k].icon || '' }));
}

const toHexAddr = (a) => (/^(addr|stake)/i.test(a) ? bytesToHex(bech32Decode(a).bytes) : a);

export async function connect(key) {
  const api = await window.cardano[key].enable();
  const net = await api.getNetworkId();
  if (net !== CONFIG.NETWORK_ID) throw new Error('Wrong network. Switch your wallet to Cardano mainnet.');
  let reward = null, signAddr = null;
  try { const r = await api.getRewardAddresses(); if (r && r[0]) reward = toHexAddr(r[0]); } catch {}
  try {
    const u = await api.getUsedAddresses();
    if (u && u[0]) signAddr = toHexAddr(u[0]);
    else { const ch = await api.getChangeAddress(); if (ch) signAddr = toHexAddr(ch); }
  } catch {}
  let stake = null;
  if (reward) stake = stakeAddressFromHash(parseAddress(reward).stake, net);
  return { key, api, net, rewardHex: reward, signAddrHex: signAddr, stake, name: window.cardano[key].name || key };
}

export async function heldAssets(session) {
  const policies = new Set(CONFIG.POLICY_IDS);
  let list = [];
  try { list = assetsFromBalance(await session.api.getBalance()); } catch { list = []; }
  return list.filter((a) => policies.has(a.policy));
}

// CIP-8 / CIP-30 signData. Prefers the reward (stake) address, falls back to a payment address.
export async function signText(session, text) {
  const payload = utf8ToHex(text);
  const attempts = [session.rewardHex, session.signAddrHex].filter(Boolean);
  let lastErr;
  for (const addr of attempts) {
    try {
      const r = await session.api.signData(addr, payload);
      return { address: addr, signature: r.signature, key: r.key };
    } catch (e) {
      lastErr = e;
      if (e && (e.code === 2 || /declin|cancel|reject/i.test(String(e.info || e.message || '')))) throw e; // user said no
    }
  }
  throw lastErr || new Error('Wallet refused to sign.');
}
