import { CONFIG } from '../config.js';
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// [[text]] → redaction bar that declassifies on hover / focus / tap. Input is escaped first.
export const redactify = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, '<span class="redact" tabindex="0" title="Declassify">$1</span>');
export const short = (u) => (u && u.length > 20 ? u.slice(0, 9) + '…' + u.slice(-6) : u || '');
export const daysSince = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)) : 0);
export function ago(iso) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return Math.ceil(s / 60) + 'm ago'; if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
export const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
export function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
export function fnv(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// Deterministic angular sigil, used when an asset has no image (or the gateway is down).
export function sigil(seed, label = '') {
  let h = fnv(seed), r = () => (h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0, h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0, (h ^= h >>> 16) >>> 0);
  let cells = '';
  for (let y = 0; y < 7; y++) for (let x = 0; x < 4; x++) {
    const v = r() % 5; if (v > 2) continue;
    const px = 40 + x * 30, py = 40 + y * 30, mx = 320 - px - 30;
    const shape = v === 0 ? (X, Y) => `<rect x="${X}" y="${Y}" width="26" height="26"/>` : v === 1 ? (X, Y) => `<polygon points="${X},${Y + 26} ${X + 26},${Y + 26} ${X + 26},${Y}"/>` : (X, Y) => `<polygon points="${X},${Y} ${X + 26},${Y} ${X},${Y + 26}"/>`;
    cells += shape(px, py) + (v === 0 ? shape(mx, py) : `<g transform="translate(${360},0) scale(-1,1)">${shape(px, py)}</g>`);
  }
  const hue = 350 + (r() % 20);
  return `<svg viewBox="0 0 360 360" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg"><rect width="360" height="360" fill="#0b0a09"/><g fill="hsl(${hue} 38% 50%)" opacity=".92">${cells}</g><circle cx="180" cy="180" r="150" fill="none" stroke="#ff003c" stroke-opacity=".35"/><circle cx="180" cy="180" r="166" fill="none" stroke="#fff" stroke-opacity=".08" stroke-dasharray="3 7"/><text x="180" y="342" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="10" letter-spacing="3" fill="#ff003c" fill-opacity=".7">${esc(label || 'NO IMAGE ON FILE')}</text></svg>`;
}

// Specimen renderer: HTML NFTs run in a sandboxed iframe (no same-origin, no top navigation).
export function specimen(meta, unit, label) {
  if (meta && meta.htmlSrc) return `<iframe title="${esc(label)}" sandbox="allow-scripts" loading="lazy" referrerpolicy="no-referrer" src="${esc(meta.htmlSrc)}"></iframe>`;
  if (meta && meta.image) return `<img alt="${esc(label)}" loading="lazy" crossorigin="anonymous" referrerpolicy="no-referrer" src="${esc(meta.image)}" data-sig="${esc(unit)}" data-lbl="${esc(label)}">`;
  return sigil(unit, label);
}
// Cards use a still image only (never spin up an iframe per card).
export function thumb(meta, unit, label) {
  if (meta && meta.image && !/^data:text/.test(meta.image)) return `<img alt="${esc(label)}" loading="lazy" crossorigin="anonymous" referrerpolicy="no-referrer" src="${esc(meta.image)}" data-sig="${esc(unit)}" data-lbl="${esc(label)}">`;
  return sigil(unit, meta && meta.htmlSrc ? 'HTML SPECIMEN' : label);
}
export function runLoad(box) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  box.classList.add('flip'); const o = document.createElement('div'); o.className = 'ld2';
  o.innerHTML = '<div class="tt2"><span>LOADING</span><i>∴</i><b>0%</b></div><div class="bar2"><div></div></div><div class="wr2">Do not turn off.</div>'; box.appendChild(o);
  const bb = o.querySelector('b'), bar = o.querySelector('.bar2 div'), t0 = performance.now(), T = 1100; let gone = false;
  const end = () => { if (gone) return; gone = true; o.style.opacity = 0; setTimeout(() => o.remove(), 500); };
  (function f(t) { if (gone) return; const k = Math.min(1, (t - t0) / T); bb.textContent = Math.round(k * 100) + '%'; bar.style.width = k * 100 + '%'; k < 1 ? requestAnimationFrame(f) : end(); })(t0);
  setTimeout(end, T + 1200);
}
const IPFS_RE = /^https?:\/\/[^/]+\/ipfs\/((?:Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{50,})(?:\/[\w.\-]{1,80}){0,2})$/;
/* IPFS art goes through our own Worker: public gateways block cross-origin embeds */
export const artUrl = (u) => { const m = CONFIG.API_BASE && typeof u === 'string' && u.match(IPFS_RE); return m ? CONFIG.API_BASE + '/v1/img/' + m[1] : u; };
export function armImages(root) {
  $$('img[data-sig]', root).forEach((im) => {
    im.removeAttribute('crossorigin');
    { const p = artUrl(im.getAttribute('src')); if (p !== im.getAttribute('src')) im.src = p; }
    { const box = im.closest('.card .img'); if (box) { let fired = 0; const go = () => { if (fired++) return; runLoad(box); }; im.complete && im.naturalWidth ? go() : im.addEventListener('load', go, { once: true }); } }
    let n = 0;
    im.addEventListener('error', () => {
      /* any /ipfs/<cid> URL can be served by any gateway: walk the list before giving up */
      const m = im.src.match(/^https?:\/\/[^/]+\/(?:ipfs|v1\/img)\/(.+)$/), gws = CONFIG.IPFS_GATEWAYS;
      if (m && n < gws.length) { const next = gws[n++] + m[1]; if (next !== im.src) { im.src = next; return; } if (n < gws.length) { im.src = gws[n++] + m[1]; return; } }
      console.warn('DOAF: art failed to load', im.src);
      const w = document.createElement('div'); w.innerHTML = sigil(im.dataset.sig, im.dataset.lbl); im.replaceWith(w.firstChild);
    });
  });
}

export const rank = (e) => (daysSince(e.publishedAt) > 90 ? 'ANOMALY // SURVIVED A QUARTER' : 'PROVISIONAL INTERN');
export const THREATS = ['Negligible', 'Low', 'Elevated', 'Revelatory', 'Severe', 'Unclassified'];
export const CFG = CONFIG;
