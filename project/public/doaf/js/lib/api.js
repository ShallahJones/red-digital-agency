// Public dossier data: Worker API + seed file.
import { CONFIG } from '../config.js';

async function getJson(url) { const pre = globalThis.__DOAF_DATA__ && globalThis.__DOAF_DATA__[url]; if (pre) return pre; const r = await fetch(url, { headers: { accept: 'application/json' } }); if (!r.ok) throw new Error(r.status); return r.json(); }

export async function loadEntries() {
  let list = [], source = 'seed';
  try { const s = await getJson('data/entries.seed.json'); list = s.entries || []; } catch {}
  if (CONFIG.API_BASE) {
    try { const r = await getJson(CONFIG.API_BASE.replace(/\/$/, '') + '/v1/entries'); const seen = new Set(r.entries.map((e) => e.unit)); list = r.entries.concat(list.filter((e) => !seen.has(e.unit))); source = 'live'; }
    catch { source = 'seed'; }
  }
  list.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  return { entries: list, source };
}

export async function loadLore() { try { return (await getJson('data/lore.json')).chapters || []; } catch { return []; } }

async function post(path, body) {
  const r = await fetch(CONFIG.API_BASE.replace(/\/$/, '') + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const t = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(t.error || 'Request failed (' + r.status + ')');
  return t;
}
export const submitEntry = (packet) => post('/v1/entries', packet);
export const retractEntry = (packet) => post('/v1/retract', packet);
