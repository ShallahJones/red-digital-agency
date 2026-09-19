// Provisional intern badge → PNG. Peeling on purpose.
import { daysSince } from './util.js';
export async function makeBadge(entry, imgUrl) {
  const c = document.createElement('canvas'); c.width = 600; c.height = 900; const x = c.getContext('2d');
  x.fillStyle = '#07080a'; x.fillRect(0, 0, 600, 900);
  x.strokeStyle = '#ff2b2b'; x.lineWidth = 6; x.strokeRect(14, 14, 572, 872);
  x.fillStyle = '#ff2b2b'; x.fillRect(14, 14, 572, 92);
  x.fillStyle = '#0a0000'; x.font = '700 30px "Chakra Petch", sans-serif'; x.textAlign = 'center'; x.fillText('CORTEX CITY GOVERNANCE', 300, 62);
  x.font = '600 15px "IBM Plex Mono", monospace'; x.fillText('DEPT. OF ANTI-FUCKERY  //  INTERN', 300, 88);
  let drew = false;
  if (imgUrl) { try { const im = await new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = imgUrl; }); x.drawImage(im, 100, 140, 400, 400); drew = true; } catch {} }
  if (!drew) { x.fillStyle = '#12161b'; x.fillRect(100, 140, 400, 400); x.fillStyle = '#5c0a0a'; x.font = '700 120px "Chakra Petch", sans-serif'; x.fillText('?', 300, 380); }
  x.strokeStyle = '#ff2b2b'; x.lineWidth = 2; x.strokeRect(100, 140, 400, 400);
  x.fillStyle = '#fff'; x.font = '700 46px "Chakra Petch", sans-serif'; x.fillText((entry.callsign || 'UNNAMED').toUpperCase().slice(0, 18), 300, 610);
  x.fillStyle = '#ff2b2b'; x.font = '600 18px "IBM Plex Mono", monospace'; x.fillText('PROVISIONAL INTERN', 300, 650);
  x.fillStyle = '#7f8b98'; x.font = '14px "IBM Plex Mono", monospace';
  x.fillText('CLEARANCE: PUBLIC   ·   DAYS ON THE JOB: ' + daysSince(entry.publishedAt), 300, 690);
  x.fillText('VALID FOR ONE (1) QUARTER. RARELY SURVIVED.', 300, 714);
  for (let i = 0; i < 64; i++) { x.fillStyle = i % 3 ? '#d6dbe2' : '#ff2b2b'; x.fillRect(90 + i * 6.2, 760, 2 + (i * 7 % 3), 70); }
  x.fillStyle = '#4b5560'; x.font = '11px "IBM Plex Mono", monospace'; x.fillText((entry.unit || '').slice(0, 56).toUpperCase(), 300, 858);
  x.save(); x.translate(470, 210); x.rotate(0.35); x.strokeStyle = '#ff2b2b'; x.lineWidth = 3; x.strokeRect(-90, -22, 180, 44); x.fillStyle = '#ff2b2b'; x.font = '700 22px "Chakra Petch", sans-serif'; x.fillText('PEELING', 0, 8); x.restore();
  return new Promise((res) => c.toBlob(res, 'image/png'));
}
export async function downloadBadge(entry, imgUrl) {
  const blob = await makeBadge(entry, imgUrl), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'doaf-badge-' + (entry.callsign || 'intern').toLowerCase().replace(/\W+/g, '-') + '.png'; document.body.appendChild(a); a.click(); a.remove();
}
