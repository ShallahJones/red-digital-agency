import { CONFIG } from '../config.js';
import { loadEntries, loadLore } from '../lib/api.js';
import { safeAssetInfo, unitOf, splitUnit } from '../lib/chain.js';
import { $, $$, esc, redactify, ago, daysSince, short, toast, thumb, specimen, armImages, rank, sigil, THREATS } from './util.js';
import { mountNetwork } from './network.js';
import { downloadBadge } from './badge.js';

export const S = { entries: [], source: 'seed', lore: [], meta: {}, ready: null, cleanup: null };
export function init() { S.ready = Promise.all([loadEntries(), loadLore()]).then(([e, l]) => { S.entries = e.entries; S.source = e.source; S.lore = l; }); return S.ready; }
const app = () => $('#app');

function countUp(el) { const to = +el.dataset.to; if (matchMedia('(prefers-reduced-motion: reduce)').matches || !to) { el.textContent = to; return; } const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 900); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(f); })(t0); }

export const cardHTML = (e) => `<a class="card" href="#/agent/${esc(e.unit)}">
  <div class="img">${thumb(e.meta, e.unit, e.callsign)}<span class="pill ok badge">${daysSince(e.publishedAt) > 90 ? 'ANOMALY' : 'INTERN'}</span></div>
  <div class="bd"><h3>${esc(e.callsign)}</h3><div class="sub">${esc(e.entry.rsi || e.entry.subject || '')}</div>
  <div class="row"><span>${esc(e.entry.threat || 'Unclassified')}</span><span>${ago(e.publishedAt)}</span></div></div></a>`;
const emptyCard = (n) => `<a class="card empty" href="#/clearance"><div class="img">${String(n).padStart(3, '0')}</div><div class="bd"><h3>Open slot</h3><div class="sub">Link an asset to fill it.</div><div class="row"><span>Empty</span><span>Get cleared ▸</span></div></div></a>`;

/* ───────────── HOME ───────────── */
export function home() {
  const n = S.entries.length, real = n;
  const q = S.entries.filter((e) => daysSince(e.publishedAt) > 90).length;
  app().innerHTML = `<div class="view">
  <section class="hero"><div>
    <div class="eyebrow">Cortex City Governance · Civilian Auxiliary</div>
    <h1 class="glitch" data-t="Department of Anti-Fuckery">Department of <span>Anti-Fuckery</span></h1>
    <p class="lede">Run by the original holders of the Madjacket Dataleak.</p>
    
    <div class="ctas"><a class="btn" href="#/clearance">Get cleared ▸</a><a class="btn ghost" href="#/file">Read the file</a></div>
  </div><div class="seal-wrap"><img src="assets/seal.png" alt="Cortex City Governance, Dept. of Anti-Fuckery seal" width="640" height="640"></div></section>
  <div class="stats"><div><b data-to="${S.lore.length}">0</b><span>Files on record</span></div><div><b data-to="${n}">0</b><span>Interns cleared</span></div><div><b data-to="${q}">0</b><span>Quarters survived</span></div><div><b style="font-size:22px;padding-top:9px">BLEEDING</b><span>Signal · acceptable</span></div></div>

  <section class="sec"><div class="eyebrow">Process</div><h2>Get cleared in three steps</h2>
  <div class="grid g3">
    <div class="panel step"><div class="n">I</div><h3>Connect</h3><p class="muted">Link a wallet that holds a Dataleak. Your NFTs show in full, HTML ones too.</p></div>
    <div class="panel step"><div class="n">II</div><h3>Sign</h3><p class="muted">Sign one message. No fees, no transaction.</p></div>
    <div class="panel step hot"><div class="n" style="color:var(--red)">III</div><h3>File</h3><p class="muted">Write your entry. It goes public when you sign.</p></div>
  </div></section>

  <section class="sec"><div class="eyebrow">Live map</div><h2>Who's on the floor</h2>
  <div class="panel" style="padding:8px"><canvas id="net" aria-label="Network of cleared interns"></canvas></div></section>

  <section class="sec"><div class="eyebrow">Latest filings</div><h2>Recently cleared</h2>
  <div class="grid g4 roster">${S.entries.slice(0, 4).map(cardHTML).join('') || ''}${S.entries.length < 4 ? emptyCard(1) : ''}</div>
  <p style="margin-top:22px"><a class="btn ghost" href="#/roster">Full roster ▸</a></p></section>

  <section class="sec"><div class="panel hot"><div class="hd"><b>WALK-IN BRIEFING</b><span>NEW ARRIVALS</span></div><h2 style="font-size:28px;margin-bottom:12px">Came in through a brokerage app?</h2><p class="typed" style="max-width:62ch">What Madjacket is, how it started, and who runs this place.</p><a class="btn" href="#/file/004">Start with the intake ▸</a></div></section></div>`;
  $$('.stats b[data-to]').forEach(countUp);
  armImages(app());
  const cv = $('#net'); if (cv) S.cleanup = mountNetwork(cv, S.entries.slice(0, 40), (e) => (location.hash = '#/agent/' + e.unit));
}

/* ───────────── FILE ───────────── */
async function loadFounder() {
  const F = CONFIG.FOUNDER, pairs = [F.portrait, F.ascended];
  const info = await safeAssetInfo(pairs);
  return { a: info[unitOf(F.portrait.policy, F.portrait.nameHex)] || null, b: info[unitOf(F.ascended.policy, F.ascended.nameHex)] || null };
}
export function file(param) {
  const F = CONFIG.FOUNDER, ua = unitOf(F.portrait.policy, F.portrait.nameHex), ub = unitOf(F.ascended.policy, F.ascended.nameHex);
  const chapters = S.lore.map((c) => `<article class="chap" id="ch-${c.id}"><div class="eyebrow">File ${c.id} · ${esc(c.tag)}</div><h2>${esc(c.title)}</h2>
    <div class="cls"><span class="stamp">${esc(c.class)}</span><span class="pill">Cortex City Gov</span></div><div class="typed">${c.body.map((p) => `<p>${redactify(p)}</p>`).join('')}</div></article>`).join('');
  app().innerHTML = `<div class="view"><div class="eyebrow">The file</div><h1 style="font-size:clamp(32px,5vw,60px);margin:10px 0 26px">Department records</h1>
  <section class="panel hot founder"><span class="corner a"></span><span class="corner b"></span><span class="corner c"></span><span class="corner d"></span>
    <div><div class="portrait" id="pt"><div class="a">${sigil(ua, 'FILED')}</div><div class="b">${sigil(ub, 'ASCENDED')}</div><span class="tag" id="ptag">AS FILED</span></div>
    <p style="margin-top:12px"><button class="btn ghost" id="asc" style="width:100%;justify-content:center">Declassify ▸ ascended form</button></p></div>
    <div><div class="hd"><b>FILE 000 // DIRECTOR (ACTING)</b><span>QOROMANCY LABS</span></div>
      <h2 style="font-size:clamp(28px,4vw,46px)">${esc(F.handle)}</h2>
      <dl class="kv dos" style="margin-top:12px"><dt>Title</dt><dd>Founder. Acting Director. Reluctant boss.</dd><dt>Clearance</dt><dd>All of it. Attention span: limited.</dd><dt>Known for</dt><dd>Saying it out loud, then building the room anyway.</dd><dt>Status</dt><dd><span class="pill ok">STILL HERE</span></dd><dt>Threat level</dt><dd><span class="pill sev">Revelatory</span></dd></dl>
      <div class="quote">Nobody promoted me. So I promoted the story.</div>
      <p class="muted" style="font-size:12px">Portrait and ascended form are on-chain Dataleak assets. <a id="lnkA" href="#" target="_blank" rel="noopener">Verify filed ↗</a> · <a id="lnkB" href="#" target="_blank" rel="noopener">Verify ascended ↗</a></p></div></section>
  <div class="file"><div class="toc">${S.lore.map((c) => `<button data-c="${c.id}"><b>${c.id}</b>${esc(c.title)}</button>`).join('')}</div><div>${chapters}</div></div></div>`;
  loadFounder().then(({ a, b }) => {
    const pt = $('#pt'); if (!pt) return;
    if (a) { $('.a', pt).innerHTML = specimen(a, ua, 'Boxlord, as filed'); $('#lnkA').href = a.poolpm; }
    if (b) { $('.b', pt).innerHTML = specimen(b, ub, 'Boxlord, ascended'); $('#lnkB').href = b.poolpm; }
    armImages(pt);
  });
  $('#lnkA').href = 'https://pool.pm/' + F.portrait.policy + '.' + F.portrait.nameHex; $('#lnkB').href = 'https://pool.pm/' + F.ascended.policy + '.' + F.ascended.nameHex;
  $('#asc').onclick = (ev) => { const pt = $('#pt'), on = pt.classList.toggle('asc'); $('#ptag').textContent = on ? 'ASCENDED' : 'AS FILED'; ev.target.textContent = on ? '◂ Restore filed form' : 'Declassify ▸ ascended form'; };
  const go = (id) => { const t = $('#ch-' + id); if (t) t.scrollIntoView({ behavior: 'smooth' }); $$('.toc button').forEach((b) => b.classList.toggle('on', b.dataset.c === id)); };
  $$('.toc button').forEach((b) => (b.onclick = () => go(b.dataset.c)));
  $$('.redact').forEach((r) => r.addEventListener('click', () => r.classList.toggle('open')));
  if (param) setTimeout(() => go(param), 60);
}

/* ───────────── ROSTER ───────────── */
export function roster() {
  app().innerHTML = `<div class="view"><div class="eyebrow">Roster</div><h1 style="font-size:clamp(32px,5vw,60px);margin:10px 0 8px">Cleared interns</h1><p class="muted" style="max-width:60ch">Each file is written by the holder and verified on-chain.</p>
  <div class="tools"><input id="q" placeholder="Search callsign, subject, message…" aria-label="Search roster"><select id="th" aria-label="Threat level"><option value="">All threat levels</option>${THREATS.map((t) => `<option>${t}</option>`).join('')}</select><select id="so" aria-label="Sort"><option value="new">Newest</option><option value="old">Longest surviving</option><option value="az">A–Z</option></select><span class="muted" id="ct"></span></div>
  <div class="grid g4 roster" id="rg"></div></div>`;
  const draw = () => {
    const q = $('#q').value.toLowerCase(), th = $('#th').value, so = $('#so').value;
    let l = S.entries.filter((e) => (!th || e.entry.threat === th) && (!q || JSON.stringify([e.callsign, e.entry]).toLowerCase().includes(q)));
    l = [...l].sort((a, b) => so === 'az' ? a.callsign.localeCompare(b.callsign) : so === 'old' ? (a.publishedAt || '').localeCompare(b.publishedAt || '') : (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    $('#ct').textContent = l.length + ' on file';
    $('#rg').innerHTML = l.map(cardHTML).join('') + (q || th ? '' : [1, 2, 3, 4].map((i) => emptyCard(S.entries.length + i)).join(''));
    armImages($('#rg'));
  };
  ['q', 'th', 'so'].forEach((i) => ($('#' + i).oninput = draw)); draw();
}

/* ───────────── AGENT ───────────── */
export async function agent(unit) {
  const e = S.entries.find((x) => x.unit === unit);
  if (!e) { app().innerHTML = `<div class="view"><div class="panel"><div class="hd"><b>404 // FILE NOT FOUND</b></div><p>Nothing is filed under that ID. Either it was never written or somebody redacted it.</p><a class="btn ghost" href="#/roster">Back to roster</a></div></div>`; return; }
  const d = e.entry, p = splitUnit(e.unit);
  const row = (k, v) => (v ? `<dt>${k}</dt><dd>${redactify(v)}</dd>` : '');
  const days = daysSince(e.publishedAt);
  app().innerHTML = `<div class="view"><p><a href="#/roster" class="muted">◂ Roster</a></p>
  <div class="agent"><div><div class="spec" id="spec">${specimen(e.meta, e.unit, e.callsign)}</div>
    <div class="tabs"><button class="on" data-t="s">Specimen</button><button data-t="c">On-chain</button></div>
    <div id="chain" hidden><pre class="raw">${esc(JSON.stringify({ unit: e.unit, policy: p.policy, assetNameHex: p.nameHex, owner: e.owner, fingerprint: e.meta && e.meta.fingerprint, mediaType: e.meta && e.meta.mediaType }, null, 2))}</pre></div>
    <p class="muted" style="font-size:12px"><a target="_blank" rel="noopener" href="https://pool.pm/${esc((e.meta && e.meta.fingerprint) || p.policy + '.' + p.nameHex)}">pool.pm ↗</a> · <a target="_blank" rel="noopener" href="https://cardanoscan.io/token/${esc(e.unit)}">cardanoscan ↗</a></p></div>
  <div class="panel hot"><div class="hd"><b>FILE // ${esc(short(e.unit).toUpperCase())}</b><span>${esc(rank(e))}</span></div>
    <h1 style="font-size:clamp(30px,4vw,52px)">${esc(e.callsign)}</h1><p class="muted" style="margin:6px 0 4px">${esc(d.subject || '')}</p>
    <p style="margin:12px 0"><span class="stamp">${days > 90 ? 'Anomaly' : 'Provisional'}</span> <span class="pill sev" style="margin-left:10px">${esc(d.threat || 'Unclassified')}</span> <span class="pill ok">Verified on-chain</span></p>
    <dl class="kv dos">${row('Residual self image', d.rsi)}${row('Backstory', d.backstory)}${row('Known for', d.knownFor)}${row('Status', d.status)}${row('Visual markers', d.markers)}<dt>Days on the job</dt><dd>${days}${days > 90 ? ' · survived a full quarter' : ' · quarter survival: unlikely'}</dd><dt>Filed by</dt><dd>${esc(e.owner || '')}${d.handle ? ' · @' + esc(d.handle.replace(/^@/, '')) : ''}</dd></dl>
    ${d.message ? `<div class="quote">${redactify('“' + d.message + '”')}</div><div class="muted" style="font-size:10px;letter-spacing:.2em;margin-top:-6px">UNAUTHORIZED MESSAGE</div>` : ''}
    ${d.report ? `<h3 style="font-size:15px;margin:22px 0 10px;color:var(--red)">Field report for new arrivals</h3><div class="report">${esc(d.report)}</div>` : ''}
    <p style="margin-top:22px;display:flex;gap:12px;flex-wrap:wrap"><button class="btn ghost" id="cp">Copy link</button><button class="btn ghost" id="bd">Download badge</button></p></div></div></div>`;
  armImages(app());
  $$('.tabs button').forEach((b) => (b.onclick = () => { $$('.tabs button').forEach((x) => x.classList.toggle('on', x === b)); $('#spec').hidden = b.dataset.t !== 's'; $('#chain').hidden = b.dataset.t === 's'; }));
  $('#cp').onclick = () => { navigator.clipboard.writeText(location.href.split('#')[0] + '#/agent/' + e.unit).then(() => toast('Link copied'), () => toast('Copy failed')); };
  $('#bd').onclick = () => downloadBadge(e, e.meta && e.meta.image).catch(() => toast('Badge failed'));
  if (!e.meta || (!e.meta.image && !e.meta.htmlSrc)) { const m = await safeAssetInfo([p]); if (m[e.unit] && $('#spec')) { e.meta = { ...e.meta, ...m[e.unit] }; $('#spec').innerHTML = specimen(e.meta, e.unit, e.callsign); armImages($('#spec')); } }
}
