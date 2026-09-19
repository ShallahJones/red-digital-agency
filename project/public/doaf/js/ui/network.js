// "The community is the database": a small living graph of every filed intern around the founder.
import { fnv } from './util.js';
export function mountNetwork(canvas, entries, onPick) {
  const ctx = canvas.getContext('2d'); let W = 0, H = 0, dpr = Math.min(devicePixelRatio || 1, 2), raf = 0, hover = -1;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes = [{ x: 0, y: 0, r: 9, label: 'BOXLORD', hub: true, ph: 0 }];
  entries.forEach((e, i) => { const a = (i / Math.max(entries.length, 1)) * Math.PI * 2 + (fnv(e.unit) % 100) / 100, d = 0.42 + ((fnv(e.unit + 'd') % 100) / 100) * 0.42; nodes.push({ e, a, d, r: 4.5, label: e.callsign, ph: fnv(e.unit) % 628 / 100 }); });
  function size() { const b = canvas.getBoundingClientRect(); W = b.width; H = b.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function place(t) { const cx = W / 2, cy = H / 2; nodes.forEach((n, i) => { if (n.hub) { n.x = cx; n.y = cy; return; } const a = n.a + (reduce ? 0 : t * 0.00006 * (1 + (i % 3) * 0.3)), d = n.d + Math.sin(t * 0.0005 + n.ph) * 0.015; n.x = cx + Math.cos(a) * d * W * 0.5; n.y = cy + Math.sin(a) * d * H * 0.5; }); }
  function draw(t) {
    place(t); ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.04)'; [0.25, 0.5, 0.75].forEach((k) => { ctx.beginPath(); ctx.ellipse(W / 2, H / 2, W * 0.5 * k * 1.7, H * 0.5 * k * 1.7, 0, 0, 7); ctx.stroke(); });
    for (let i = 1; i < nodes.length; i++) { const n = nodes[i], on = i === hover; ctx.strokeStyle = on ? 'rgba(199,157,85,.9)' : 'rgba(181,71,58,.38)'; ctx.beginPath(); ctx.moveTo(nodes[0].x, nodes[0].y); ctx.lineTo(n.x, n.y); ctx.stroke();
      const nx = nodes[(i % (nodes.length - 1)) + 1]; if (nx !== n) { ctx.strokeStyle = 'rgba(199,157,85,.12)'; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(nx.x, nx.y); ctx.stroke(); } }
    nodes.forEach((n, i) => { const on = i === hover, pulse = n.hub ? 1 + Math.sin(t * 0.003) * 0.15 : 1; ctx.fillStyle = n.hub ? '#b5473a' : on ? '#c79d55' : '#948a7a'; ctx.shadowBlur = 0; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * pulse + (on ? 2 : 0), 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      if (n.hub || on) { ctx.fillStyle = '#cbc3b6'; ctx.font = '11px "Jura", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(n.label, n.x, n.y - 16); } });
    if (!reduce) raf = requestAnimationFrame(draw);
  }
  const pos = (ev) => { const b = canvas.getBoundingClientRect(); return [ev.clientX - b.left, ev.clientY - b.top]; };
  canvas.addEventListener('pointermove', (ev) => { const [x, y] = pos(ev); hover = nodes.findIndex((n, i) => i && Math.hypot(n.x - x, n.y - y) < 14); canvas.style.cursor = hover > 0 ? 'pointer' : 'default'; if (reduce) draw(0); });
  canvas.addEventListener('click', () => { if (hover > 0) onPick(nodes[hover].e); });
  size(); addEventListener('resize', size); draw(0);
  return () => { cancelAnimationFrame(raf); removeEventListener('resize', size); };
}
