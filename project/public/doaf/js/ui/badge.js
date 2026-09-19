// Provisional intern badge → PNG. Peeling on purpose.
import { daysSince, artUrl } from './util.js';
import { CONFIG } from '../config.js';
async function loadArt(u) {
  if (!u) return null;
  const m = u.match(/\/ipfs\/(.+)$/), list = m ? [artUrl(u), u, ...CONFIG.IPFS_GATEWAYS.map((g) => g + m[1])] : [u];
  for (const src of list) { try { const r = await fetch(src, { referrerPolicy: 'no-referrer' }); if (!r.ok) continue; return await createImageBitmap(await r.blob()); } catch {} }
  return null;
}
export async function makeBadge(entry, imgUrl) {
  const c = document.createElement('canvas'); c.width = 600; c.height = 900; const x = c.getContext('2d');
  x.fillStyle = '#0b0a09'; x.fillRect(0, 0, 600, 900);
  x.strokeStyle = '#b5473a'; x.lineWidth = 6; x.strokeRect(14, 14, 572, 872);
  x.fillStyle = '#b5473a'; x.fillRect(14, 14, 572, 92);
  x.fillStyle = '#000'; x.font = '400 26px "Oxanium", sans-serif'; x.textAlign = 'center'; x.fillText('CORTEX CITY GOVERNANCE', 318, 62);
  x.font = '600 15px "Jura", sans-serif'; x.fillText('DEPT. OF ANTI-FUCKERY  //  INTERN', 318, 88);
  const logo = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'assets/seal.png'; });
  if (logo) { x.drawImage(logo, 28, 22, 76, 76);  x.globalAlpha = 1; }
  let drew = false;
  { const im = await loadArt(imgUrl); if (im) { x.drawImage(im, 100, 140, 400, 400); drew = true; } }
  if (!drew) { x.fillStyle = '#151311'; x.fillRect(100, 140, 400, 400); if (logo) { x.globalAlpha = .5; x.drawImage(logo, 170, 210, 260, 260); x.globalAlpha = 1; } }
  x.strokeStyle = '#b5473a'; x.lineWidth = 2; x.strokeRect(100, 140, 400, 400);
  x.fillStyle = '#fff'; x.font = '300 40px "Oxanium", sans-serif'; x.fillText((entry.callsign || 'UNNAMED').toUpperCase().slice(0, 18), 300, 610);
  x.fillStyle = '#b5473a'; x.font = '600 18px "Jura", sans-serif'; x.fillText('PROVISIONAL INTERN', 300, 650);
  x.fillStyle = '#8a8276'; x.font = '14px "Jura", sans-serif';
  x.fillText('CLEARANCE: PUBLIC   ·   DAYS ON THE JOB: ' + daysSince(entry.publishedAt), 300, 690);
  x.fillText('VALID FOR ONE (1) QUARTER. RARELY SURVIVED.', 300, 714);
  for (let i = 0; i < 64; i++) { x.fillStyle = i % 3 ? '#cbc3b6' : '#b5473a'; x.fillRect(90 + i * 6.2, 772, 2 + (i * 7 % 3), 60); }
  x.fillStyle = '#5b554c'; x.font = '11px "Jura", sans-serif'; x.fillText((entry.unit || '').slice(0, 56).toUpperCase(), 300, 858);
  return new Promise((res) => c.toBlob(res, 'image/png'));
}
export async function downloadBadge(entry, imgUrl) {
  const blob = await makeBadge(entry, imgUrl), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'doaf-badge-' + (entry.callsign || 'intern').toLowerCase().replace(/\W+/g, '-') + '.png'; document.body.appendChild(a); a.click(); a.remove();
}
