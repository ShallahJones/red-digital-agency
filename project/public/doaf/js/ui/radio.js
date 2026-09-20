// MADJACKET FM: one shared player. Keeps playing while you move between pages.
// Tracks come from data/tracks.json. With none configured it plays a generated ambient signal, so it never dead-ends.
import { $, $$, esc, sigil } from './util.js';

const R = { tracks: [], i: 0, playing: false, vol: 0.7, liked: new Set(), holder: false, audio: null, ctx: null, an: null, gen: null, t0: 0, subs: new Set(), ready: null };
const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
try { R.liked = new Set(JSON.parse(ls.get('doaf-liked') || '[]')); R.holder = ls.get('doaf-holder') === '1'; R.vol = +(ls.get('doaf-vol') || 0.7); } catch {}

const GEN = { id: 'gen', title: 'SIGNAL // 01', artist: 'Cortex City Transmission', gen: true };
/* Real tracks first (in tracks.json order); the generated signal only plays when there are none, or after them. */
export const list = () => [...R.tracks.filter((t) => !t.holders || R.holder), GEN];
const credit = (t) => (t.gen || !t.artist ? t.title : t.artist + ' – ' + t.title);
const cur = () => list()[R.i] || GEN;
const emit = () => R.subs.forEach((f) => f());

export function loadRadio(getJson) {
  if (!R.ready) R.ready = getJson('data/tracks.json').then((d) => { R.tracks = (d.tracks || []).filter((t) => t && t.src && t.title).map((t, i) => ({ ...t, id: t.id || 't' + i })); }).catch(() => {}).then(emit);
  return R.ready;
}
export function setHolder(v) { R.holder = !!v; ls.set('doaf-holder', v ? '1' : '0'); emit(); }

function stopGen() { if (R.gen) { try { R.gen.forEach((n) => n.stop && n.stop()); R.gen[0] && R.gen[0].disconnect(); } catch {} R.gen = null; } }
function startGen() {
  const C = (R.ctx = R.ctx || new (window.AudioContext || window.webkitAudioContext)());
  if (C.state === 'suspended') C.resume();
  R.an = R.an || Object.assign(C.createAnalyser(), { fftSize: 128, smoothingTimeConstant: 0.8 });
  const out = C.createGain(); out.gain.value = R.vol * 0.5; out.connect(R.an); R.an.connect(C.destination);
  const lp = C.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 6; lp.connect(out);
  const mk = (f, d) => { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = d; const g = C.createGain(); g.gain.value = 0.16; o.connect(g); g.connect(lp); o.start(); return o; };
  const lfo = C.createOscillator(); lfo.frequency.value = 0.07; const lg = C.createGain(); lg.gain.value = 300; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
  const buf = C.createBuffer(1, C.sampleRate * 2, C.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() < 0.0006 ? Math.random() * 2 - 1 : 0;
  const ns = C.createBufferSource(); ns.buffer = buf; ns.loop = true; const hp = C.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2400; ns.connect(hp); hp.connect(out); ns.start();
  R.gen = [out, mk(55, -6), mk(55.4, 7), mk(82.4, 3), mk(110.3, -9), lfo, ns]; R.genOut = out;
}
function audio() { if (!R.audio) { const a = (R.audio = new Audio()); a.preload = 'none'; a.addEventListener('timeupdate', emit); a.addEventListener('ended', () => next()); a.addEventListener('error', () => { if (R.playing) next(true); }); } return R.audio; }

export function play() {
  const t = cur(); R.t0 = R.t0 || Date.now();
  if (t.gen) { audio().pause(); stopGen(); try { startGen(); } catch { return; } } else { stopGen(); const a = audio(); if (a.dataset.id !== t.id) { a.src = t.src; a.dataset.id = t.id; } a.volume = R.vol; a.play().catch(() => {}); }
  R.playing = true; emit();
}
export function pause() { stopGen(); R.audio && R.audio.pause(); R.playing = false; emit(); }
export const toggle = () => (R.playing ? pause() : play());
export function go(i) { const n = list().length; R.i = ((i % n) + n) % n; if (R.audio) { R.audio.pause(); R.audio.dataset.id = ''; } stopGen(); R.t0 = Date.now(); if (R.playing) play(); else emit(); }
export function next(skipBad) { const n = list().length; if (skipBad && n === 1) return pause(); go(R.i + 1); }
export const prev = () => go(R.i - 1);
export function vol(v) { R.vol = v; ls.set('doaf-vol', String(v)); if (R.audio) R.audio.volume = v; if (R.genOut) R.genOut.gain.value = v * 0.5; }
export function like() { const id = cur().id; R.liked.has(id) ? R.liked.delete(id) : R.liked.add(id); ls.set('doaf-liked', JSON.stringify([...R.liked])); emit(); }
export const nowPlaying = () => (R.playing ? credit(cur()) : '');
export const onChange = (f) => (R.subs.add(f), () => R.subs.delete(f));

const fmt = (s) => (isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '--:--');

/* mount(el, {compact}) → renders the player into el; returns cleanup */
export function mountRadio(el, { compact = false } = {}) {
  if (!el) return () => {};
  el.innerHTML = `<div class="panel radio${compact ? ' compact' : ''}"><div class="hd"><b>MADJACKET FM</b><span id="rd-live">OFF AIR</span></div>
  <div class="rd-main"><div class="rd-art" id="rd-art"></div>
   <div class="rd-side"><div class="rd-info"><h3 id="rd-t"></h3><p class="muted" id="rd-a"></p></div><canvas class="rd-viz" id="rd-viz" width="520" height="90" aria-hidden="true"></canvas></div></div>
  <div class="rd-ctl"><button class="rd-b" id="rd-prev" aria-label="Previous">◂◂</button><button class="rd-b big" id="rd-play" aria-label="Play">▶</button><button class="rd-b" id="rd-next" aria-label="Next">▸▸</button>
   <div class="rd-bar" id="rd-bar" role="progressbar" aria-label="Progress"><div id="rd-fill"></div></div><span class="rd-time" id="rd-time">LIVE</span>
   <button class="rd-b" id="rd-like" aria-label="Like" aria-pressed="false">♡</button><input id="rd-vol" type="range" min="0" max="1" step="0.05" aria-label="Volume"></div>
  <ul class="rd-list" id="rd-list"></ul><p class="rd-note muted" id="rd-note"></p></div>`;
  const q = (s) => $(s, el), cv = q('#rd-viz'), cx = cv.getContext('2d'); q('#rd-vol').value = R.vol; let raf = 0, bars = Array(48).fill(0);
  const draw = () => {
    if (!cv.isConnected) return;
    cx.clearRect(0, 0, cv.width, cv.height); const n = bars.length, w = cv.width / n; let data = null;
    if (R.playing && cur().gen && R.an) { data = new Uint8Array(R.an.frequencyBinCount); R.an.getByteFrequencyData(data); }
    const t = performance.now() / 1000;
    for (let i = 0; i < n; i++) {
      const tgt = !R.playing ? 0.04 : data ? Math.min(1, (data[Math.floor(i * data.length / n)] / 255) * 1.7) : 0.15 + 0.55 * Math.abs(Math.sin(t * 2.1 + i * 0.55) * Math.sin(t * 0.7 + i * 0.21));
      bars[i] += (tgt - bars[i]) * 0.18; const h = Math.max(2, bars[i] * cv.height);
      cx.fillStyle = getComputedStyle(document.body).getPropertyValue('--acc') || '#c79d55'; cx.globalAlpha = 0.35 + bars[i] * 0.65; cx.fillRect(i * w + 1, cv.height - h, w - 3, h);
    }
    raf = requestAnimationFrame(draw);
  };
  const paint = () => {
    const t = cur(), L = list(); q('#rd-t').textContent = t.title; q('#rd-a').textContent = t.artist || 'Madjacket';
    q('#rd-art').innerHTML = t.cover ? `<img alt="" src="${esc(t.cover)}">` : sigil('fm:' + t.id, 'FM');
    q('#rd-play').textContent = R.playing ? '❚❚' : '▶'; q('#rd-play').setAttribute('aria-label', R.playing ? 'Pause' : 'Play');
    q('#rd-live').textContent = R.playing ? 'ON AIR' : 'OFF AIR'; q('#rd-live').className = R.playing ? 'red' : '';
    const lk = R.liked.has(t.id); q('#rd-like').textContent = lk ? '♥' : '♡'; q('#rd-like').setAttribute('aria-pressed', lk);
    let f = 0, tm = 'LIVE'; if (!t.gen && R.audio) { const a = R.audio; f = a.duration ? a.currentTime / a.duration : 0; tm = fmt(a.currentTime) + ' / ' + fmt(a.duration); } else if (R.playing) { f = ((Date.now() - R.t0) / 1000 % 60) / 60; tm = 'LIVE'; }
    q('#rd-fill').style.width = f * 100 + '%'; q('#rd-time').textContent = tm;
    q('#rd-list').innerHTML = L.map((x, i) => `<li><button class="${i === R.i ? 'on' : ''}" data-i="${i}"><span>${String(i + 1).padStart(2, '0')}</span>${esc(credit(x))}${x.holders ? '<em>HOLDERS</em>' : ''}${R.liked.has(x.id) ? '<i>♥</i>' : ''}</button></li>`).join('');
    $$('#rd-list button', el).forEach((b) => (b.onclick = () => { R.i = +b.dataset.i; go(R.i); play(); }));
    q('#rd-note').textContent = R.holder ? 'Holder channel unlocked.' : R.tracks.some((t) => t.holders) ? 'Link a Dataleak to unlock holder tracks.' : '';
  };
  q('#rd-play').onclick = toggle; q('#rd-next').onclick = () => next(); q('#rd-prev').onclick = prev; q('#rd-like').onclick = like; q('#rd-vol').oninput = (e) => vol(+e.target.value);
  q('#rd-bar').onclick = (e) => { if (cur().gen || !R.audio || !R.audio.duration) return; const r = e.currentTarget.getBoundingClientRect(); R.audio.currentTime = ((e.clientX - r.left) / r.width) * R.audio.duration; };
  const off = onChange(() => { if (!el.isConnected) return off(); paint(); }); paint(); draw();
  return () => { off(); cancelAnimationFrame(raf); };
}
