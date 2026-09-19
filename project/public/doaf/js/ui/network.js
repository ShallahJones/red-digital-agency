// "Who's been digging": every holder who filed a Dataleak, labelled by their $handle, each wired to the Dataleaks they connected.
import { fnv } from './util.js';
const tag = (h) => { const s = String(h || '').replace(/^[@$\s]+/, '').trim(); return s ? '$' + s : ''; };
export function mountNetwork(canvas, entries, onPick) {
  const ctx = canvas.getContext('2d'); let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2), raf = 0, hover = -1;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes = [{ x: 0, y: 0, r: 9, label: 'BOXLORD', hub: true, ph: 0 }];
  /* one node per holder ($handle, else the filing wallet); their Dataleaks orbit them */
  const byHolder = new Map();
  entries.forEach((e) => { const k = tag(e.entry && e.entry.handle) || e.owner || e.unit; (byHolder.get(k) || byHolder.set(k, []).get(k)).push(e); });
  let hi = 0; const total = Math.max(byHolder.size, 1);
  byHolder.forEach((list, k) => {
    const seed = fnv(k), a = (hi++ / total) * Math.PI * 2 + (seed % 100) / 400, d = 0.44 + ((seed >> 3) % 100) / 100 * 0.38;
    const h = { a, d, r: 5.5, label: tag(list[0].entry && list[0].entry.handle) || (list[0].owner || '').slice(0, 14), holder: true, e: list[0], ph: seed % 628 / 100 };
    nodes.push(h);
    list.forEach((e, j) => nodes.push({ e, parent: h, la: (j / list.length) * Math.PI * 2 + (fnv(e.unit) % 100) / 60, lr: 22 + (j % 2) * 8, r: 3, label: e.callsign, ph: fnv(e.unit) % 628 / 100 }));
  });
  function size() { const b = canvas.getBoundingClientRect(); W = b.width; H = b.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function place(t) {
    const cx = W / 2, cy = H / 2;
    nodes.forEach((n, i) => { if (n.hub) { n.x = cx; n.y = cy; return; } if (n.parent) return;
      const a = n.a + (reduce ? 0 : t * 0.00006 * (1 + (i % 3) * 0.3)), d = n.d + Math.sin(t * 0.0005 + n.ph) * 0.015; n.x = cx + Math.cos(a) * d * W * 0.5; n.y = cy + Math.sin(a) * d * H * 0.5; });
    nodes.forEach((n) => { if (!n.parent) return; const a = n.la + (reduce ? 0 : t * 0.0004); n.x = n.parent.x + Math.cos(a) * n.lr; n.y = n.parent.y + Math.sin(a) * n.lr; });
  }
  function draw(t) {
    place(t); ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; [0.25, 0.5, 0.75].forEach((k) => { ctx.beginPath(); ctx.ellipse(W / 2, H / 2, W * 0.5 * k * 1.7, H * 0.5 * k * 1.7, 0, 0, 7); ctx.stroke(); });
    nodes.forEach((n, i) => { if (!i) return; const on = i === hover || (n.parent && nodes[hover] === n.parent) || (nodes[hover] && nodes[hover].parent === n);
      const from = n.parent || nodes[0]; ctx.strokeStyle = on ? 'rgba(199,157,85,.9)' : n.parent ? 'rgba(199,157,85,.28)' : 'rgba(181,71,58,.38)'; ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(n.x, n.y); ctx.stroke(); });
    nodes.forEach((n, i) => { const on = i === hover, pulse = n.hub ? 1 + Math.sin(t * 0.003) * 0.15 : 1;
      ctx.fillStyle = n.hub ? '#b5473a' : on ? '#c79d55' : n.holder ? '#948a7a' : '#6f675b'; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse + (on ? 2 : 0), 0, 7); ctx.fill();
      if (n.hub || n.holder || on) { ctx.fillStyle = on || n.hub ? '#cbc3b6' : 'rgba(203,195,182,.72)'; ctx.font = (n.holder && !on ? '10px' : '11px') + ' "Jura", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(n.label, n.x, n.y - (n.hub ? 16 : n.r + 8)); } });
    if (!reduce) raf = requestAnimationFrame(draw);
  }
  const pos = (ev) => { const b = canvas.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; };
  canvas.addEventListener('pointermove', (ev) => { const [x, y] = pos(ev); let best = -1, bd = 14; nodes.forEach((n, i) => { if (!i) return; const d = Math.hypot(n.x - x, n.y - y); if (d < bd) { bd = d; best = i; } }); hover = best; canvas.style.cursor = hover > 0 ? 'pointer' : 'default'; if (reduce) draw(0); });
  canvas.addEventListener('click', () => { if (hover > 0) onPick(nodes[hover].e); });
  size(); addEventListener('resize', size); draw(0);
  return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); };
}
