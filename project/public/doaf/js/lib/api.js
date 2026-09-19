// Public dossier data: Worker API + seed file.
import { CONFIG } from '../config.js';
import { safeAssetInfo, splitUnit } from './chain.js';

export async function getJson(url) { const pre = globalThis.__DOAF_DATA__ && globalThis.__DOAF_DATA__[url]; if (pre) return pre; const r = await fetch(url, { headers: { accept: 'application/json' } }); if (!r.ok) throw new Error(r.status); return r.json(); }

export async function loadEntries() {
  let list = [], source = 'seed';
  try { const s = await getJson('data/entries.seed.json'); list = s.entries || []; } catch {}
  if (CONFIG.API_BASE) {
    try { const r = await getJson(CONFIG.API_BASE.replace(/\/$/, '') + '/v1/entries'); const seen = new Set(r.entries.map((e) => e.unit)); list = r.entries.concat(list.filter((e) => !seen.has(e.unit))); source = 'live'; }
    catch { source = 'seed'; }
  }
  list.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  /* entries filed before their art resolved: look the art up again, no re-signing needed */
  const need = list.filter((e) => !(e.meta && (e.meta.image || e.meta.htmlSrc))).slice(0, 20);
  if (need.length && CONFIG.API_BASE) {
    const info = await Promise.race([safeAssetInfo(need.map((e) => splitUnit(e.unit)).map((p) => ({ policy: p.policy, nameHex: p.nameHex }))), new Promise((r) => setTimeout(() => r({}), 4000))]);
    need.forEach((e) => { const m = info[e.unit]; if (m) e.meta = { ...(e.meta || {}), ...m }; });
  }
  return { entries: list, source };
}

export async function loadLore() { try { return (await getJson('data/lore.json')).chapters || []; } catch { return []; } }

async function post(path, body) {
  const r = await fetch(CONFIG.API_BASE.replace(/\/$/, '') + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const t = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(t.error || 'Request failed (' + r.status + ')');
  return t;
}
export async function loadSlots() { try { const r = await getJson(CONFIG.API_BASE.replace(/\/$/, '') + '/v1/collection'); if (r && r.count > 0) CONFIG.SLOTS = r.count; } catch {} return CONFIG.SLOTS; }
export const submitEntry = (packet) => post('/v1/entries', packet);
export const retractEntry = (packet) => post('/v1/retract', packet);
