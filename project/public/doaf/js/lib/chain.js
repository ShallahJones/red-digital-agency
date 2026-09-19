// Chain reads (Koios) + metadata normalisation + IPFS/HTML-NFT resolution.
import { CONFIG } from '../config.js';
import { hexToUtf8 } from './cardano.js';

export const unitOf = (policy, nameHex) => policy + nameHex;
export const splitUnit = (u) => ({ policy: u.slice(0, 56), nameHex: u.slice(56) });

export function resolveUri(u, gw = 0) {
  if (!u) return '';
  if (Array.isArray(u)) u = u.join('');
  u = String(u);
  if (u.startsWith('ipfs://')) return CONFIG.IPFS_GATEWAYS[gw % CONFIG.IPFS_GATEWAYS.length] + u.slice(7).replace(/^ipfs\//, '');
  if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}/.test(u) || /^bafy/.test(u)) return CONFIG.IPFS_GATEWAYS[gw % CONFIG.IPFS_GATEWAYS.length] + u;
  if (u.startsWith('ar://')) return 'https://arweave.net/' + u.slice(5);
  return u;
}
const j = (x) => (Array.isArray(x) ? x.join('') : x);

export function normalizeAsset(info) {
  const policy = info.policy_id, nameHex = info.asset_name || '';
  let ascii = info.asset_name_ascii; if (!ascii) { try { ascii = hexToUtf8(nameHex); } catch { ascii = nameHex; } }
  const m721 = info.minting_tx_metadata && (info.minting_tx_metadata['721'] || info.minting_tx_metadata[721]);
  const pol = m721 && m721[policy];
  const raw = (pol && (pol[ascii] || pol[nameHex])) || null;
  const out = { unit: unitOf(policy, nameHex), policy, nameHex, ascii, fingerprint: info.fingerprint || '', name: ascii, description: '', image: '', mediaType: '', htmlSrc: '', attributes: {}, extra: {}, raw };
  if (raw) {
    out.name = j(raw.name) || ascii;
    out.description = j(raw.description) || '';
    out.mediaType = raw.mediaType || '';
    const files = Array.isArray(raw.files) ? raw.files : [];
    const fileImg = files.find((f) => /^image\//i.test(f.mediaType || '') && f.src);
    const img = resolveUri(raw.image || (fileImg && fileImg.src) || '');
    out.image = img;
    const html = files.find((f) => /html/i.test(f.mediaType || '')) || (/html/i.test(raw.mediaType || '') && raw.src ? { src: raw.src } : null) || (/html/i.test(raw.mediaType || '') ? { src: raw.image } : null);
    if (html) out.htmlSrc = resolveUri(html.src);
    if (/html/i.test(out.mediaType) && !out.htmlSrc) out.htmlSrc = img;
    if (raw.attributes && typeof raw.attributes === 'object') out.attributes = raw.attributes;
    const skip = new Set(['name', 'description', 'image', 'mediaType', 'files', 'attributes', 'src']);
    for (const k of Object.keys(raw)) if (!skip.has(k)) out.extra[k] = raw[k];
  }
  out.poolpm = 'https://pool.pm/' + (out.fingerprint || policy + '.' + nameHex);
  out.scan = 'https://cardanoscan.io/token/' + policy + nameHex;
  return out;
}

export async function fetchAssetInfo(pairs) {
  if (!pairs.length) return {};
  let arr = null; const body = pairs.map((p) => [p.policy, p.nameHex]);
  /* Koios blocks browser calls from our domain (CORS), so ask the Worker first */
  if (CONFIG.API_BASE) {
    try {
      const res = await fetch(CONFIG.API_BASE.replace(/\/$/, '') + '/v1/asset-info', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ assets: body }) });
      if (res.ok) arr = await res.json();
    } catch { /* fall through */ }
  }
  if (!arr || !arr.length) {
    const res = await fetch(CONFIG.KOIOS_BASE + '/asset_info', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ _asset_list: body }) });
    if (!res.ok) throw new Error('Chain lookup failed (' + res.status + ')');
    arr = await res.json();
  }
  if (!arr) throw new Error('Chain lookup failed');
  const map = {};
  for (const i of arr) { const n = normalizeAsset(i); map[n.unit] = n; }
  return map;
}

// Best-effort: never throws, returns {} on failure so UI can degrade to sigils.
export async function safeAssetInfo(pairs) { try { return await fetchAssetInfo(pairs); } catch { return {}; } }

// Known key names for the "Residual Self Image" dossier format, matched case-insensitively.
export const RSI_KEYS = [
  ['subject', 'Subject'], ['rsi', 'Residual Self Image'], ['backstory', 'Backstory'], ['knownFor', 'Known for'],
  ['status', 'Status'], ['threat', 'Threat Level'], ['markers', 'Visual markers'], ['message', 'Unauthorized message'],
];
export function prefillFromMeta(a) {
  const src = { ...(a.extra || {}), ...(a.attributes || {}) };
  const low = {}; for (const k of Object.keys(src)) low[k.toLowerCase().replace(/[^a-z]/g, '')] = src[k];
  const get = (label) => { const v = low[label.toLowerCase().replace(/[^a-z]/g, '')]; return v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : j(v); };
  const o = {};
  for (const [k, label] of RSI_KEYS) o[k] = get(label);
  if (!o.rsi && a.description) o.rsi = a.description.slice(0, 200);
  if (!o.subject) o.subject = a.name || '';
  return o;
}
