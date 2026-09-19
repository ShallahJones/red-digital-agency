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
export function armImages(root) {
  $$('img[data-sig]', root).forEach((im) => im.addEventListener('error', () => { const w = document.createElement('div'); w.innerHTML = sigil(im.dataset.sig, im.dataset.lbl); im.replaceWith(w.firstChild); }, { once: true }));
}
export const rank = (e) => (daysSince(e.publishedAt) > 90 ? 'ANOMALY // SURVIVED A QUARTER' : 'PROVISIONAL INTERN');
export const THREATS = ['Negligible', 'Low', 'Elevated', 'Revelatory', 'Severe', 'Unclassified'];
export const CFG = CONFIG;
