// Lyric sync tool (unlisted page: #/sync). Play a track, tap when the vocalist starts each line. Instrumental parts: just don't tap.
import { $, $$, esc, toast } from './util.js';
import { getJson } from '../lib/api.js';
import { pause, lyricsReset } from './radio.js';

const KEY = (id) => 'doaf-lyrics:' + id;
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }, del: (k) => { try { localStorage.removeItem(k); } catch {} } };
const LAG = 0.12; /* human reaction time: a tap lands this long after the vocal actually starts */

export async function syncTool() {
  pause(); const app = $('#app');
  let tracks = []; try { tracks = ((await getJson('data/tracks.json')).tracks || []).filter((t) => t.lyrics); } catch {}
  if (!tracks.length) { app.innerHTML = '<div class="view"><div class="panel"><p class="muted">No tracks with lyrics yet.</p></div></div>'; return () => {}; }
  app.innerHTML = `<div class="view"><div class="eyebrow">Tools</div><h1 style="font-size:clamp(26px,3.6vw,40px);margin:12px 0 10px">Lyric sync</h1>
  <p class="muted" style="max-width:62ch">Press play, then tap <b>Space</b> (or the big button) the moment the vocalist starts each line. Skip taps during solos: the last line just holds until you tap the next one. <b>Backspace</b> undoes a tap.</p>
  <div class="tools"><select id="sy-t" aria-label="Track">${tracks.map((t) => `<option value="${esc(t.id)}">${esc(t.title)}</option>`).join('')}</select><select id="sy-r" aria-label="Speed"><option value="1">1× speed</option><option value="0.85">0.85× (easier)</option><option value="0.7">0.7×</option></select></div>
  <div class="panel" id="sy-so"><div class="hd"><b>MARK SOLOS</b><span>parts with no vocals</span></div>
   <p class="muted" style="margin:6px 0 12px">Press play. When the vocals drop out for a solo or break, hit <b>S</b> (or the button). Hit it again when the vocals come back. The lyrics re-time themselves around it.</p>
   <div class="tools" style="margin:0 0 10px"><button class="btn" id="sy-pl2" type="button">▶ Play</button><button class="btn" id="sy-s" type="button" style="min-width:200px">SOLO STARTS ▸</button><button class="btn ghost" id="sy-b2" type="button">◂ 5s</button><span class="muted" id="sy-tm2"></span></div>
   <ul id="sy-sl" class="muted" style="list-style:none;padding:0;margin:0 0 12px"></ul>
   <div class="tools" style="margin:0"><button class="btn ghost" id="sy-suse" type="button">Use on this device</button><button class="btn ghost" id="sy-scopy" type="button">Copy solos</button><button class="btn ghost" id="sy-sreset" type="button">Clear</button></div></div>
  <div class="panel" id="sy-p" style="margin-top:18px"><div class="hd"><b>TAP EVERY LINE (advanced)</b><span id="sy-c"></span></div>
   <p class="muted" id="sy-prev" style="min-height:1.7em;margin:6px 0"></p><h2 id="sy-now" style="font-size:clamp(20px,3vw,30px);margin:6px 0;min-height:2.4em"></h2><p class="muted" id="sy-next" style="min-height:3.4em;margin:6px 0 16px"></p>
   <div class="tools" style="margin:0"><button class="btn" id="sy-play" type="button">▶ Play</button><button class="btn" id="sy-tap" type="button" style="min-width:180px">TAP · line starts</button><button class="btn ghost" id="sy-undo" type="button">Undo</button><button class="btn ghost" id="sy-b" type="button">◂ 5s</button><button class="btn ghost" id="sy-rs" type="button">Restart</button><span class="muted" id="sy-tm"></span></div></div>
  <div class="panel" style="margin-top:18px"><div class="hd"><b>RESULT</b><span>test here, then copy</span></div>
   <div class="tools" style="margin:0 0 10px"><button class="btn ghost" id="sy-use" type="button">Use on this device</button><button class="btn ghost" id="sy-copy" type="button">Copy JSON</button><button class="btn ghost" id="sy-reset" type="button">Clear my override</button></div>
   <textarea id="sy-out" rows="8" readonly style="width:100%;background:var(--panel);color:var(--ink);border:1px solid var(--line);font:11px var(--f-m);padding:10px"></textarea></div></div>`;
  const a = new Audio(); a.preload = 'auto'; let tr = null, lines = [], taps = [], raf = 0, solos = [], open = null;
  const fmtT = (s) => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') + '.' + Math.floor((s % 1) * 10);
  const drawSolos = () => {
    $('#sy-sl').innerHTML = solos.map((r, i) => `<li>${fmtT(r[0])} → ${fmtT(r[1])} <button class="btn ghost" data-i="${i}" type="button" style="padding:2px 8px">remove</button></li>`).join('') + (open != null ? `<li>${fmtT(open)} → … (solo in progress)</li>` : '') || '<li>No solos marked.</li>';
    $$('#sy-sl button').forEach((b) => (b.onclick = () => { solos.splice(+b.dataset.i, 1); drawSolos(); }));
    $('#sy-s').textContent = open != null ? 'VOCALS BACK ▸' : 'SOLO STARTS ▸';
  };
  const markSolo = () => { if (a.paused) return toast('Press play first'); const t = +a.currentTime.toFixed(1); if (open == null) open = t; else { if (t > open) solos.push([open, t]); solos.sort((x, y) => x[0] - y[0]); open = null; } drawSolos(); };
  const draw = () => {
    const i = taps.length, L = (k) => (lines[k] ? esc(lines[k]) : '');
    $('#sy-prev').innerHTML = i ? L(i - 1) : ''; $('#sy-now').innerHTML = i < lines.length ? L(i) : 'All lines tapped. Check the result below.';
    $('#sy-next').innerHTML = [L(i + 1), L(i + 2)].filter(Boolean).join('<br>'); $('#sy-c').textContent = i + ' / ' + lines.length;
    $('#sy-out').value = i ? JSON.stringify({ lines: lines.slice(0, i).map((text, k) => ({ t: taps[k], text })) }, null, 1) : '';
  };
  const clock = () => { $('#sy-tm2').textContent = a.duration ? fmtT(a.currentTime) + ' / ' + fmtT(a.duration) : ''; $('#sy-tm').textContent = a.duration ? Math.floor(a.currentTime / 60) + ':' + String(Math.floor(a.currentTime % 60)).padStart(2, '0') + ' / ' + Math.floor(a.duration / 60) + ':' + String(Math.floor(a.duration % 60)).padStart(2, '0') : ''; raf = requestAnimationFrame(clock); };
  const load = async (id) => {
    tr = tracks.find((t) => t.id === id); a.pause(); a.src = tr.src; a.playbackRate = +$('#sy-r').value; taps = [];
    let src = null; try { const r = await fetch(tr.lyrics); src = (await r.json()).lines; } catch {}
    lines = (src || []).map((l) => l.text); $('#sy-play').textContent = $('#sy-pl2').textContent = '▶ Play'; open = null;
    try { solos = JSON.parse(ls.get('doaf-solos:' + id) || 'null') || (tr.solos || []).map((r) => [...r]); } catch { solos = []; }
    drawSolos(); draw();
  };
  const tap = () => { if (taps.length >= lines.length || a.paused) return; taps.push(Math.max(0, +(a.currentTime - LAG * a.playbackRate).toFixed(1))); draw(); };
  const undo = () => { taps.pop(); draw(); };
  const key = (e) => { if (e.target.closest && e.target.closest('select,textarea,input')) return; if (e.key === 's' || e.key === 'S') { markSolo(); } else if (e.code === 'Space') { e.preventDefault(); tap(); } else if (e.key === 'Backspace') { e.preventDefault(); undo(); } };
  $('#sy-t').onchange = (e) => load(e.target.value); $('#sy-r').onchange = (e) => (a.playbackRate = +e.target.value);
  const toggle = () => { if (a.paused) { a.play().catch(() => {}); $('#sy-play').textContent = $('#sy-pl2').textContent = '❚❚ Pause'; } else { a.pause(); $('#sy-play').textContent = $('#sy-pl2').textContent = '▶ Play'; } };
  $('#sy-play').onclick = $('#sy-pl2').onclick = toggle; $('#sy-s').onclick = markSolo; $('#sy-b2').onclick = () => { a.currentTime = Math.max(0, a.currentTime - 5); };
  $('#sy-suse').onclick = () => { ls.set('doaf-solos:' + tr.id, JSON.stringify(solos)); lyricsReset(tr.id); toast(solos.length ? 'Saved on this device. Play the radio to test.' : 'Saved: no solos'); };
  $('#sy-scopy').onclick = () => { const v = JSON.stringify({ id: tr.id, solos }); navigator.clipboard.writeText(v).then(() => toast('Copied. Paste it to Claude.'), () => toast('Copy failed')); };
  $('#sy-sreset').onclick = () => { solos = []; open = null; ls.del('doaf-solos:' + tr.id); lyricsReset(tr.id); drawSolos(); toast('Cleared'); };
  $('#sy-tap').onclick = tap; $('#sy-undo').onclick = undo; $('#sy-b').onclick = () => { a.currentTime = Math.max(0, a.currentTime - 5); while (taps.length && taps[taps.length - 1] > a.currentTime) taps.pop(); draw(); };
  $('#sy-rs').onclick = () => { a.pause(); a.currentTime = 0; taps = []; $('#sy-play').textContent = '▶ Play'; draw(); };
  $('#sy-copy').onclick = () => { const v = $('#sy-out').value; if (!v) return toast('Nothing tapped yet'); navigator.clipboard.writeText(v).then(() => toast('Copied'), () => { $('#sy-out').select(); toast('Select and copy'); }); };
  $('#sy-use').onclick = () => { if (taps.length < lines.length) return toast('Tap all ' + lines.length + ' lines first'); ls.set(KEY(tr.id), $('#sy-out').value); lyricsReset(tr.id); toast('Saved on this device. Play the radio to test.'); };
  $('#sy-reset').onclick = () => { ls.del(KEY(tr.id)); lyricsReset(tr.id); toast('Override cleared'); };
  a.addEventListener('ended', () => { $('#sy-play').textContent = '▶ Play'; });
  document.addEventListener('keydown', key); clock(); await load(tracks[0].id);
  return () => { a.pause(); cancelAnimationFrame(raf); document.removeEventListener('keydown', key); };
}
