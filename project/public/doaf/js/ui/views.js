import { CONFIG } from '../config.js';
import { loadEntries, loadLore, loadSlots, loadCatalog } from '../lib/api.js';
import { safeAssetInfo, unitOf, splitUnit } from '../lib/chain.js';
import { $, $$, esc, redactify, ago, daysSince, short, toast, thumb, specimen, armImages, rank, sigil, THREATS } from './util.js';
import { mountNetwork } from './network.js';
import { downloadBadge } from './badge.js';
import { mountRadio } from './radio.js';

export const S = { entries: [], catalog: [], source: 'seed', lore: [], meta: {}, ready: null, cleanup: null };
export function init() { S.ready = Promise.all([loadEntries(), loadLore(), loadSlots(), loadCatalog()]).then(([e, l, , c]) => { S.entries = e.entries; S.source = e.source; S.lore = l; S.catalog = c; if (c.length) CONFIG.SLOTS = c.length; }); return S.ready; }
const app = () => $('#app');

function countUp(el) { const to = +el.dataset.to; if (matchMedia('(prefers-reduced-motion: reduce)').matches || !to) { el.textContent = to; return; } const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); }

export const cardHTML = (e, i = 0, no = null) => `<a class="card" href="#/agent/${esc(e.unit)}" data-u="${esc(e.unit)}"><span class="in">
  <span class="img">${thumb(e.meta, e.unit, e.callsign)}<span class="no">${String(no != null ? no : i + 1).padStart(3, '0')}</span><span class="pill badge">${daysSince(e.publishedAt) > 90 ? 'ANOMALY' : 'INTERN'}</span></span>
  <span class="bd"><h3>${esc(e.callsign)}</h3><span class="sub">${esc(e.entry.rsi || e.entry.subject || '')}</span>
  <span class="row"><span>${esc(e.entry.threat || 'Unclassified')}</span><span>${ago(e.publishedAt)}</span></span></span></span></a>`;
const slots = (n) => { const open = Math.max(0, (CONFIG.SLOTS || 0) - n); let h = ''; for (let i = 1; i <= open; i++) h += emptyCard(n + i); return h; };
const emptyCard = (n) => `<a class="card empty" href="#/clearance"><span class="in"><span class="img">${String(n).padStart(3, '0')}</span><span class="bd"><h3>Open slot</h3><span class="sub">Link an asset to fill it.</span><span class="row"><span>Empty</span><span>Get cleared ▸</span></span></span></span></a>`;

/* dossier modal: click a card, read the file without leaving the roster */
let dmOpen = null;
export function closeDossier() { const d = $('#dm'); if (d) { d.remove(); $('#dm-bg') && $('#dm-bg').remove(); } if (dmOpen) { dmOpen.focus && dmOpen.focus(); dmOpen = null; } document.removeEventListener('keydown', dmKey); }
const dmKey = (ev) => { if (ev.key === 'Escape') closeDossier(); };
export function openDossier(e, from) {
  closeDossier(); dmOpen = from || null; const d = e.entry, days = daysSince(e.publishedAt);
  const f = (k, v) => (v ? `<div class="fld"><b>${k}</b>${redactify(v)}</div>` : '');
  document.body.insertAdjacentHTML('beforeend', `<button id="dm-bg" aria-label="Close"></button>
  <div id="dm" role="dialog" aria-modal="true" aria-labelledby="dm-t"><div class="handle"><span>DOAF // FILE ${esc(short(e.unit).toUpperCase())}</span></div>
  <div class="fr">${thumb(e.meta, e.unit, e.callsign)}</div>
  <div class="det"><button class="x" id="dm-x" aria-label="Close">✕</button><h2 id="dm-t">${esc(e.callsign)}</h2><p class="sub">${esc(d.subject || '')}</p>
  <p class="pill">${days > 90 ? 'Anomaly' : 'Provisional'} · ${esc(d.threat || 'Unclassified')}</p>
  ${f('Residual self image', d.rsi)}${f('Status', d.status)}${f('Known for', d.knownFor)}${d.message ? `<div class="q">${redactify('“' + d.message + '”')}</div>` : ''}
  <div class="act"><a class="btn" href="#/agent/${esc(e.unit)}" id="dm-o">Open full file ▸</a><button class="btn ghost" id="dm-c" type="button">Close</button></div>
  <div class="ut">Filed in Cortex City\nFiled, not fixed. Revisit when the research catches up.</div></div></div>`);
  armImages($('#dm')); $('#dm-bg').onclick = $('#dm-x').onclick = $('#dm-c').onclick = closeDossier; $('#dm-o').onclick = () => setTimeout(closeDossier, 0);
  document.addEventListener('keydown', dmKey); $('#dm-x').focus();
}
document.addEventListener('click', (ev) => {
  const a = ev.target.closest && ev.target.closest('a.card[data-u]'); if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return;
  const e = S.entries.find((x) => x.unit === a.dataset.u); if (e) { ev.preventDefault(); openDossier(e, a); }
});

/* ───────────── HOME ───────────── */
export function home() {
  const n = S.entries.length, real = n;
  const q = S.entries.filter((e) => daysSince(e.publishedAt) > 90).length;
  app().innerHTML = `<div class="view">
  <section class="hero"><div>
    <div class="eyebrow">Cortex City Governance · Civilian Auxiliary</div>
    <h1 class="glitch" data-t="Department of Anti-Fuckery">Department of <span class="gl" data-g="Anti-Fuckery">Anti-Fuckery</span></h1>
    <p class="lede">The Dataleak's files are missing. Holders are piecing them back together.</p>
    
    <div class="ctas"><a class="btn" href="#/file">Start the file ▸</a><a class="btn ghost" href="#/clearance">Get cleared</a></div>
  </div><div class="seal-wrap"><img src="assets/seal.png" alt="Cortex City Governance, Dept. of Anti-Fuckery seal" width="640" height="640"></div></section>
  <div class="stats" id="stats"></div>

  <section class="sec"><div class="eyebrow">Process</div><h2>Recover a file in three steps</h2>
  <div class="grid g3">
    <div class="panel step"><div class="n">I</div><h3>Connect</h3><p class="muted">Link a wallet that holds a Dataleak. Your NFTs show in full, HTML ones too.</p></div>
    <div class="panel step"><div class="n">II</div><h3>Sign</h3><p class="muted">Sign one message. No fees, no transaction.</p></div>
    <div class="panel step hot"><div class="n">III</div><h3>File</h3><p class="muted">Write your entry. One more file recovered.</p></div>
  </div></section>

  <section class="sec"><div class="eyebrow">Live map</div><h2>Who's been digging</h2>
  <div class="panel" style="padding:8px"><canvas id="net" aria-label="Network of cleared interns"></canvas></div></section>

  <section class="sec"><div class="eyebrow">Latest filings</div><h2>Recently recovered</h2>
  <div class="grid g4 roster">${S.entries.slice(0, 4).map(cardHTML).join('') || ''}${S.entries.length < 4 ? emptyCard(1) : ''}</div>
  <p style="margin-top:22px"><a class="btn ghost" href="#/roster">Full roster ▸</a></p></section>

  <section class="sec"><div class="eyebrow">Radio</div><h2>Madjacket FM</h2><div id="rd-home" style="max-width:760px"></div></section>

  <section class="sec"><div class="panel hot"><div class="hd"><b>Walk-in briefing</b><span>New arrivals</span></div><h2 style="font-size:22px;margin-bottom:12px">Came in through a brokerage app?</h2><p class="muted" style="max-width:62ch">What Madjacket is, how it started, and why we file what we can't explain.</p><a class="btn" href="#/file/004">Start with the intake ▸</a></div></section></div>`;
  const stats = () => { const es = S.entries, holders = new Set(es.map((e) => e.owner || e.unit)).size, q = es.filter((e) => daysSince(e.publishedAt) > 90).length, last = es[0] && es[0].publishedAt;
    $('#stats').innerHTML = `<div><b data-to="${es.length}">0</b><span>Files recovered</span></div><div><b data-to="${holders}">0</b><span>Holders cleared</span></div><div><b data-to="${q}">0</b><span>Quarters survived</span></div><div><b style="font-size:20px;padding-top:12px">${last ? esc(ago(last)) : '—'}</b><span>Last filing</span></div>`; $$('#stats b[data-to]').forEach(countUp); };
  stats();
  loadEntries().then((r) => { if (!$('#stats')) return; if (JSON.stringify(r.entries.map((e) => e.unit)) !== JSON.stringify(S.entries.map((e) => e.unit))) { S.entries = r.entries; stats(); } }).catch(() => {});
  armImages(app()); const rc = mountRadio($('#rd-home'), { compact: true });
  const cv = $('#net'), mn = cv ? mountNetwork(cv, S.entries.slice(0, 40), (e) => (location.hash = '#/agent/' + e.unit)) : null;
  S.cleanup = () => { rc(); mn && mn(); };
}

/* ───────────── FILE ───────────── */
async function loadFounder() {
  const F = CONFIG.FOUNDER, pairs = [F.portrait, F.ascended];
  const info = await safeAssetInfo(pairs);
  return { a: info[unitOf(F.portrait.policy, F.portrait.nameHex)] || null, b: info[unitOf(F.ascended.policy, F.ascended.nameHex)] || null };
}
export function file(param) {
  const F = CONFIG.FOUNDER, ua = unitOf(F.portrait.policy, F.portrait.nameHex), ub = unitOf(F.ascended.policy, F.ascended.nameHex);
  const L = S.lore, N = L.length + 1; /* last page: the ask */
  let cur = Math.max(0, L.findIndex((c) => c.id === param)); const seen = new Set();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  app().innerHTML = `<div class="view pg"><div class="pg-head"><span class="eyebrow">The file</span><span class="eyebrow" id="pgn"></span></div>
    <div class="pg-stage" id="stage" aria-live="polite"></div><div id="nxt"></div>
    <div class="pg-ctl"><button class="btn ghost" id="pv" type="button">◂ Back</button><div class="dots" id="dots">${Array.from({ length: N }, (_, i) => `<button type="button" data-i="${i}" aria-label="${i < L.length ? esc(L[i].title) : 'Clearance'}"></button>`).join('')}</div><button class="btn" id="nx" type="button">Next ▸</button></div></div>`;
  const founder = () => `<div class="founder"><div><div class="portrait" id="pt"><div class="a">${sigil(ua, 'FILED')}</div><div class="b">${sigil(ub, 'ASCENDED')}</div><span class="tag" id="ptag">AS FILED</span></div>
    <p style="margin:10px 0 0"><button class="btn ghost" id="asc" type="button" style="width:100%;justify-content:center;padding:8px 10px">Ascended form</button></p></div>
    <div><h3>${esc(F.handle)}</h3><p class="muted" style="margin:4px 0 12px">Founder. Acting Director. Reluctant boss.</p>
    <div class="quote">Nobody promoted me. So I promoted the story.</div>
    <p class="muted" style="font-size:11px;margin:0"><a id="lnkA" href="#" target="_blank" rel="noopener">Verify filed ↗</a> · <a id="lnkB" href="#" target="_blank" rel="noopener">Verify ascended ↗</a></p></div></div>`;
  const exhibit = () => {
    const pu = CONFIG.POLICY_IDS[0] + CONFIG.PRETENDER.nameHex, filed = S.entries.find((e) => e.unit === pu);
    return `<div class="exhibit"><figure class="win"><div class="win-h"><span>TEASE // MAD ALCHEMY</span><span>ON FILE</span></div>
      <div class="win-b" id="vw"><video id="vd" muted loop playsinline autoplay preload="metadata" src="assets/tease.mp4" aria-label="Mad Alchemy tease"></video><i class="veil"></i></div>
      <figcaption>Tap to unmute</figcaption></figure>
      <div class="ex-card"><div class="eyebrow" style="margin-bottom:10px">Roster</div>${filed ? cardHTML(filed, 0) : `<div class="card empty" aria-label="The Pretender, awaiting upload"><span class="in"><span class="img">?</span><span class="bd"><h3>The Pretender</h3><span class="sub">Awaiting upload. Posts here once the holder files it.</span><span class="row"><span>Unfiled</span><span>Case 0001</span></span></span></span></div>`}</div></div>`;
  };
  const page = (i) => {
    if (i >= L.length) return `<div class="pg-end"><div class="eyebrow">End of file</div><h2>Your turn</h2><div class="tag">CLEARANCE</div>
      <p class="lede">The file is incomplete. Connect your Cardano wallet, link a Dataleak, and add what you know.</p>
      <p class="promise">Holders from the upcoming Robinhood mint will get a door here too. Connect early and your file is already on record when they arrive.</p>
      <p><a class="btn" href="#/clearance">Connect wallet ▸</a></p></div>`;
    const c = L[i];
    return `<div class="eyebrow">${esc(c.id)}</div><h2>${esc(c.title)}</h2><div class="tag">${esc(c.tag)}</div>${c.id === '002' ? founder() : ''}<div class="typed">${c.body.map((p) => `<p>${redactify(p)}</p>`).join('')}</div>${c.id === '003' ? exhibit() : ''}`;
  };
  const wire = () => {
    $$('.redact').forEach((r) => r.addEventListener('click', () => r.classList.toggle('open')));
    const vd = $('#vd'); if (vd) { const w = $('#vw'); w.onclick = () => { const on = w.classList.toggle('on'); vd.muted = !on; vd.controls = on; if (vd.paused) vd.play().catch(() => {}); }; }
    const pt = $('#pt'); if (!pt) return;
    $('#lnkA').href = 'https://pool.pm/' + F.portrait.policy + '.' + F.portrait.nameHex; $('#lnkB').href = 'https://pool.pm/' + F.ascended.policy + '.' + F.ascended.nameHex;
    $('#asc').onclick = () => { const on = pt.classList.toggle('asc'); $('#ptag').textContent = on ? 'ASCENDED' : 'AS FILED'; $('#asc').textContent = on ? 'As filed' : 'Ascended form'; };
    loadFounder().then(({ a, b }) => { if (!$('#pt')) return; if (a) { $('.a', pt).innerHTML = specimen(a, ua, 'Boxlord, as filed'); $('#lnkA').href = a.poolpm; } if (b) { $('.b', pt).innerHTML = specimen(b, ub, 'Boxlord, ascended'); $('#lnkB').href = b.poolpm; } armImages(pt); });
  };
  const paint = () => {
    seen.add(cur); $('#stage').innerHTML = page(cur); wire();
    $('#pgn').textContent = String(cur + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
    $$('#dots button').forEach((b, i) => { b.classList.toggle('on', i === cur); b.classList.toggle('seen', i !== cur && seen.has(i)); b.setAttribute('aria-current', i === cur); });
    $('#pv').disabled = cur === 0; $('#nx').style.visibility = cur === N - 1 ? 'hidden' : 'visible';
    const n = L[cur + 1]; $('#nxt').innerHTML = n ? `<button class="pg-next" type="button" id="pk" aria-label="Next: ${esc(n.title)}"><div class="eyebrow">Next · ${esc(n.id)}</div><h3>${esc(n.title)}</h3><p>${esc(n.body[0].replace(/\[\[|\]\]/g, ''))}</p></button>` : cur === L.length - 1 ? `<button class="pg-next" type="button" id="pk"><div class="eyebrow">Next</div><h3>Your turn</h3><p>Connect your wallet and file your entry.</p></button>` : '';
    if ($('#pk')) $('#pk').onclick = () => go(cur + 1);
    try { history.replaceState(null, '', '#/file/' + (cur < L.length ? L[cur].id : 'end')); } catch {}
    const st = $('#stage'); st.classList.add('pre'); void st.offsetWidth; st.classList.remove('pre');
  };
  let busy = false;
  const go = (i) => {
    if (busy || i < 0 || i >= N || i === cur) return; busy = true; const st = $('#stage'); if (!st) return;
    const swap = () => { cur = i; paint(); scrollTo(0, 0); busy = false; };
    if (reduce) return swap(); st.classList.add('out'); setTimeout(() => { if (!$('#stage')) return; st.classList.remove('out'); swap(); }, 420);
  };
  $('#pv').onclick = () => go(cur - 1); $('#nx').onclick = () => go(cur + 1);
  $$('#dots button').forEach((b) => (b.onclick = () => go(+b.dataset.i)));
  const key = (ev) => { if (!$('#stage')) return document.removeEventListener('keydown', key); if (/INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return; if (ev.key === 'ArrowRight') go(cur + 1); if (ev.key === 'ArrowLeft') go(cur - 1); };
  document.addEventListener('keydown', key); S.cleanup = () => document.removeEventListener('keydown', key);
  if (param === 'end') cur = N - 1;
  paint();
}

/* ───────────── ROSTER ───────────── */
const tagOf = (h) => { const s = String(h || '').replace(/^[@$\s]+/, '').trim(); return s ? '$' + s : ''; };
/* The broad themes that run through the whole collection. Items are tagged by the Worker (/v1/catalog); chips only show themes that at least one asset has. */
const THEME_LABELS = { signal: 'Signal & control', resistance: 'Resistance', cyber: 'Cyber & data', spectral: 'Spectral & mystic', stage: 'Sound & stage', warrior: 'Warriors & sentinels' };
const catCard = (r, i) => {
  const c = r.c, nm = c.subject && !/^[?\s]+$/.test(c.subject) ? c.subject : c.name.replace(/^[^:]*:/, '');
  return `<a class="card unfiled" href="#/clearance"><span class="in"><span class="img">${thumb({ image: c.image, htmlSrc: c.htmlSrc }, c.unit, nm)}<span class="no">${String(c.dl != null ? c.dl : i + 1).padStart(3, '0')}</span><span class="pill badge">UNFILED</span></span>
  <span class="bd"><h3>${esc(nm)}</h3><span class="sub">${esc(c.rsi || c.title || c.known || '')}</span><span class="row"><span>${esc((c.threat || c.series || 'Unclassified').slice(0, 26))}</span><span>Get cleared ▸</span></span></span></span></a>`;
};
/* One row per asset: its on-chain dossier (catalog) merged with whatever its holder has filed. */
function buildRows() {
  const filed = new Map(S.entries.map((e) => [e.unit, e])), seen = new Set(), rows = [];
  const add = (c, f) => {
    const en = (f && f.entry) || {}, handle = tagOf(en.handle);
    const body = [c ? [c.name, c.title, c.subject, c.rsi, c.known, c.status, c.threat, c.markers, c.message] : [], f ? [f.callsign, ...Object.values(en)] : [], handle].flat(2).filter((x) => typeof x === 'string' && x).join(' \n ').toLowerCase();
    rows.push({ unit: c ? c.unit : f.unit, c, f, body, themes: (c && c.themes) || [], dl: c && c.dl != null ? c.dl : null, minted: c && c.minted ? c.minted : '', name: (f && f.callsign) || (c && (c.subject || c.name)) || '' });
  };
  S.catalog.forEach((c) => { seen.add(c.unit); add(c, filed.get(c.unit)); });
  S.entries.forEach((f) => { if (!seen.has(f.unit)) add(null, f); });
  return rows;
}
export function roster() {
  const DEF = 'filed', st = { q: '', themes: new Set(), show: DEF, so: 'dl' }; let rows = [];
  app().innerHTML = `<div class="view"><div class="eyebrow">Roster</div><h1 style="font-size:clamp(28px,4vw,44px);margin:12px 0 10px">Cleared interns</h1><p class="muted" style="max-width:60ch">Every Dataleak in the collection, filed or not. Search the dossiers or browse by theme. Each file is written by a holder and verified on-chain.</p>
  <div class="tools"><input id="q" placeholder="Search name, look, backstory, $handle…" aria-label="Search roster" autocomplete="off"><select id="so" aria-label="Sort"><option value="dl">Collection order</option><option value="new">Newest first</option><option value="old">Oldest first</option><option value="az">A–Z</option></select><button class="btn ghost" id="clr" type="button" hidden>Clear</button><span class="muted" id="ct"></span><select id="sh" class="far" aria-label="Show"><option value="filed" selected>Filed files</option><option value="unfiled">Not yet filed</option><option value="all">Everything</option></select></div>
  <div class="chips" id="chips" role="group" aria-label="Themes"></div>
  <div class="grid g4 roster" id="rg"></div></div>`;
  const chips = () => {
    const n = {}; rows.forEach((r) => r.themes.forEach((t) => (n[t] = (n[t] || 0) + 1)));
    const keys = Object.keys(THEME_LABELS).filter((k) => n[k]).concat(Object.keys(n).filter((k) => !THEME_LABELS[k]));
    st.themes = new Set([...st.themes].filter((k) => n[k]));
    $('#chips').innerHTML = keys.map((k) => `<button type="button" class="chip" data-w="${esc(k)}" aria-pressed="${st.themes.has(k)}">${esc(THEME_LABELS[k] || k)} <i>${n[k]}</i></button>`).join('');
    $$('#chips .chip').forEach((b) => (b.onclick = () => { const w = b.dataset.w; st.themes.has(w) ? st.themes.delete(w) : st.themes.add(w); b.setAttribute('aria-pressed', st.themes.has(w)); draw(); }));
  };
  const any = () => !!(st.q.trim() || st.themes.size || st.show !== DEF);
  const clearAll = () => { st.q = ''; st.themes = new Set(); st.show = DEF; $('#q').value = ''; $('#sh').value = DEF; chips(); draw(); };
  const draw = () => {
    const toks = st.q.toLowerCase().split(/\s+/).filter(Boolean), pub = (r) => (r.f && r.f.publishedAt) || '';
    const byDl = (a, b) => (a.dl != null ? a.dl : 1e9) - (b.dl != null ? b.dl : 1e9) || a.name.localeCompare(b.name);
    const cmp = st.so === 'new' ? (a, b) => b.minted.localeCompare(a.minted) || byDl(a, b) : st.so === 'old' ? (a, b) => a.minted.localeCompare(b.minted) || byDl(a, b) : st.so === 'az' ? (a, b) => a.name.localeCompare(b.name) : byDl;
    const l = rows.filter((r) => toks.every((t) => r.body.includes(t)) && (!st.themes.size || r.themes.some((t) => st.themes.has(t))) && (st.show === 'all' || (st.show === 'filed') === !!r.f)).sort(cmp);
    $('#ct').textContent = l.length + ' of ' + rows.length + ' shown';
    $('#clr').hidden = !any(); $('#chips').hidden = !$('#chips').children.length;
    $('#rg').innerHTML = l.length ? l.map((r, i) => (r.f ? cardHTML(r.f, i, r.dl) : catCard(r, i))).join('') + (!S.catalog.length && !any() ? slots(S.entries.length) : '') : '<p class="muted">Nothing in the archive matches. <button class="btn ghost" id="clr2" type="button">Clear filters</button></p>';
    const c2 = $('#clr2'); if (c2) c2.onclick = clearAll;
    armImages($('#rg'));
  };
  rows = buildRows(); chips(); $('#q').oninput = (e) => { st.q = e.target.value; draw(); }; $('#so').onchange = (e) => { st.so = e.target.value; draw(); }; $('#sh').onchange = (e) => { st.show = e.target.value; draw(); }; $('#clr').onclick = clearAll; draw();
  const tick = setInterval(async () => { if (!$('#rg')) return clearInterval(tick); try { const [r, c] = await Promise.all([loadEntries(), loadCatalog()]); S.entries = r.entries; if (c.length) S.catalog = c; } catch {} if ($('#rg') && document.activeElement.id !== 'q') { rows = buildRows(); chips(); draw(); } }, 30000);
}

/* ───────────── AGENT ───────────── */
/* Second window for assets that are themselves HTML (comics): poster first, then the live, clickable page, as on pool.pm. */
const CID_RE = /^https?:\/\/[^/]+\/ipfs\/((?:Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{50,})(?:\/[\w.\-%]{1,120})*)$/;
function frameUrl(u) { const m = typeof u === 'string' && u.match(CID_RE); return m ? CONFIG.IPFS_GATEWAYS[0] + m[1] : u; }
function mountComic(e, p) {
  const m = e.meta; if (!m || !m.htmlSrc || $('#comic')) return;
  const src = frameUrl(m.htmlSrc), poster = m.image && !/^data:text/.test(m.image) ? thumb(m, e.unit, e.callsign) : sigil(e.unit, 'COMIC');
  const pm = 'https://pool.pm/' + ((m.fingerprint) || p.policy + '.' + p.nameHex);
  const host = $('.view'); if (!host) return;
  host.insertAdjacentHTML('beforeend', `<section class="panel comic" id="comic"><div class="hd"><b>READ // INTERACTIVE</b><span>ON-CHAIN HTML</span></div>
    <div class="cwin" id="cwin"><div class="poster" id="cposter">${poster}<button class="btn cplay" id="cplay" type="button">▶ Open the comic</button></div></div>
    <p class="muted" style="font-size:12px;margin:12px 0 0;display:flex;gap:16px;flex-wrap:wrap"><button class="btn ghost" id="cfs" type="button" hidden>Fullscreen</button><a target="_blank" rel="noopener" href="${esc(pm)}">Open on pool.pm ↗</a></p></section>`);
  armImages($('#comic'));
  const open = async () => {
    const w = $('#cwin'); if (!w || w.dataset.on) return; w.dataset.on = '1';
    const say = (t) => { w.innerHTML = `<div class="cmsg">${t}</div>`; };
    const frame = (attrs) => { w.innerHTML = `<iframe title="${esc(e.callsign)} — interactive comic" sandbox="allow-scripts" allow="fullscreen" referrerpolicy="no-referrer" ${attrs}></iframe>`; return w.querySelector('iframe'); };
    const fs = $('#cfs'); if (fs) { fs.hidden = false; fs.onclick = () => { const f = w.requestFullscreen || w.webkitRequestFullscreen; f && f.call(w).catch(() => {}); }; }
    if (/^data:text\/html/i.test(m.htmlSrc)) { frame(`src="${esc(m.htmlSrc)}"`); return; }
    const cm = typeof m.htmlSrc === 'string' && m.htmlSrc.match(CID_RE);
    if (!cm || !CONFIG.API_BASE) { frame(`src="${esc(src)}"`); return; }
    say('LOADING ∴ fetching the page…');
    try {
      const r = await fetch(CONFIG.API_BASE + '/v1/html/' + cm[1]); if (!r.ok) throw new Error('http ' + r.status);
      let h = await r.text();
      const gw = CONFIG.IPFS_GATEWAYS[0], base = gw + cm[1].replace(/[^/]*$/, ''); /* relative links resolve against the same IPFS folder */
      h = h.replace(/ipfs:\/\/(?:ipfs\/)?/gi, gw);
      const tag = `<base href="${base}">`;
      if (/<head[^>]*>/i.test(h)) h = h.replace(/<head[^>]*>/i, (x) => x + tag);
      else if (/^\s*<!doctype[^>]*>/i.test(h)) h = h.replace(/^\s*<!doctype[^>]*>/i, (x) => x + tag);
      else h = tag + h;
      const f = frame(''); f.srcdoc = h;
    } catch (err) { w.dataset.on = ''; say('The comic would not load here. <a target="_blank" rel="noopener" href="' + esc(pm) + '">Open it on pool.pm ↗</a>'); }
  };
  $('#cplay').onclick = open; $('#cposter').onclick = (ev) => { if (ev.target.id !== 'cplay') open(); };
}

export async function agent(unit) {
  const e = S.entries.find((x) => x.unit === unit);
  if (!e) { app().innerHTML = `<div class="view"><div class="panel"><div class="hd"><b>404 // FILE NOT FOUND</b></div><p>Nothing is filed under that ID. Either it was never written or somebody redacted it.</p><a class="btn ghost" href="#/roster">Back to roster</a></div></div>`; return; }
  const d = e.entry, p = splitUnit(e.unit);
  const row = (k, v) => (v ? `<dt>${k}</dt><dd>${redactify(v)}</dd>` : '');
  const days = daysSince(e.publishedAt);
  app().innerHTML = `<div class="view"><p><a href="#/roster" class="muted">◂ Roster</a></p>
  <div class="agent"><div><div class="spec" id="spec">${e.meta && e.meta.htmlSrc ? thumb(e.meta, e.unit, e.callsign) : specimen(e.meta, e.unit, e.callsign)}</div>
    <div class="tabs"><button class="on" data-t="s">Specimen</button><button data-t="c">On-chain</button></div>
    <div id="chain" hidden><pre class="raw">${esc(JSON.stringify({ unit: e.unit, policy: p.policy, assetNameHex: p.nameHex, owner: e.owner, fingerprint: e.meta && e.meta.fingerprint, mediaType: e.meta && e.meta.mediaType }, null, 2))}</pre></div>
    <p class="muted" style="font-size:12px"><a target="_blank" rel="noopener" href="https://pool.pm/${esc((e.meta && e.meta.fingerprint) || p.policy + '.' + p.nameHex)}">pool.pm ↗</a> · <a target="_blank" rel="noopener" href="https://cardanoscan.io/token/${esc(e.unit)}">cardanoscan ↗</a></p></div>
  <div class="panel hot"><div class="hd"><b>FILE // ${esc(short(e.unit).toUpperCase())}</b><span>${esc(rank(e))}</span></div>
    <h1 style="font-size:clamp(26px,3.4vw,40px)">${esc(e.callsign)}</h1><p class="muted" style="margin:6px 0 4px">${esc(d.subject || '')}</p>
    <p style="margin:12px 0"><span class="pill">${days > 90 ? 'Anomaly' : 'Provisional'}</span> <span class="pill sev" style="margin-left:14px">${esc(d.threat || 'Unclassified')}</span> <span class="pill ok" style="margin-left:14px">Verified on-chain</span></p>
    <dl class="kv dos">${row('Residual self image', d.rsi)}${row('Backstory', d.backstory)}${row('Known for', d.knownFor)}${row('Status', d.status)}${row('Visual markers', d.markers)}<dt>Days on the job</dt><dd>${days}${days > 90 ? ' · survived a full quarter' : ' · quarter survival: unlikely'}</dd><dt>Filed by</dt><dd>${esc(e.owner || '')}</dd></dl>
    ${d.message ? `<div class="quote">${redactify('“' + d.message + '”')}</div><div class="muted" style="font-size:10px;letter-spacing:.2em;margin-top:-6px">UNAUTHORIZED MESSAGE</div>` : ''}
    ${d.report ? `<h3 style="font-size:15px;margin:22px 0 10px;color:var(--red)">Field report for new arrivals</h3><div class="report">${esc(d.report)}</div>` : ''}
    <p style="margin-top:22px;display:flex;gap:12px;flex-wrap:wrap"><button class="btn ghost" id="cp">Copy link</button><button class="btn ghost" id="bd">Download badge</button></p></div></div></div>`;
  armImages(app()); mountComic(e, p);
  if (CONFIG.API_BASE) fetch(CONFIG.API_BASE.replace(/\/$/, '') + '/v1/supply?unit=' + e.unit).then((r) => r.ok && r.json()).then((s) => {
    const dl = $('.kv.dos'); if (!s || !(s.supply > 0) || !dl || $('#edn')) return;
    dl.insertAdjacentHTML('beforeend', `<dt id="edn">Edition</dt><dd>${s.supply === 1 ? '1 of 1' : 'Edition of ' + s.supply} · ${s.holders} holder${s.holders === 1 ? '' : 's'}</dd>`);
  }).catch(() => {});
  $$('.tabs button').forEach((b) => (b.onclick = () => { $$('.tabs button').forEach((x) => x.classList.toggle('on', x === b)); $('#spec').hidden = b.dataset.t !== 's'; $('#chain').hidden = b.dataset.t === 's'; }));
  $('#cp').onclick = () => { navigator.clipboard.writeText(location.href.split('#')[0] + '#/agent/' + e.unit).then(() => toast('Link copied'), () => toast('Copy failed')); };
  $('#bd').onclick = () => downloadBadge(e, e.meta && e.meta.image).catch(() => toast('Badge failed'));
  if (!e.meta || (!e.meta.image && !e.meta.htmlSrc)) { const m = await safeAssetInfo([p]); if (m[e.unit] && $('#spec')) { e.meta = { ...e.meta, ...m[e.unit] }; $('#spec').innerHTML = e.meta.htmlSrc ? thumb(e.meta, e.unit, e.callsign) : specimen(e.meta, e.unit, e.callsign); armImages($('#spec')); mountComic(e, p); } }
}
