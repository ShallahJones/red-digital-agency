import { mountRadio, setHolder } from './radio.js';
import { CONFIG } from '../config.js';
import { listWallets, connect, heldAssets, signText } from '../lib/wallet.js';
import { safeAssetInfo, unitOf, prefillFromMeta } from '../lib/chain.js';
import { canonical, sha256Hex, bytesToHex } from '../lib/cardano.js';
import { submitEntry, retractEntry } from '../lib/api.js';
import { $, $$, esc, short, store, toast, thumb, specimen, armImages, THREATS } from './util.js';
import { S, cardHTML } from './views.js';
import { downloadBadge } from './badge.js';

const LIM = { callsign: 32, subject: 80, rsi: 200, backstory: 1200, knownFor: 300, status: 60, markers: 300, message: 240, report: 1500, handle: 32 };
const C = { session: null, held: [], sel: null, wallets: [], log: '', logCls: '' };
const app = () => $('#app');
const setLog = (t, c = '') => { C.log = t; C.logCls = c; const l = $('#log'); if (l) { l.textContent = t; l.className = 'log ' + c; } };

export async function clearance() {
  C.wallets = listWallets();
  if (!C.wallets.length) await new Promise((r) => setTimeout(r, 400)), (C.wallets = listWallets()); // some wallets inject late
  draw();
}

function draw() {
  const live = CONFIG.API_BASE ? '' : `<p class="log" style="margin:0 0 18px;color:var(--holo)">TEST MODE: no server yet. You'll sign and get a packet to send by hand.</p>`;
  app().innerHTML = `<div class="view"><div class="eyebrow">Clearance</div><h1 style="font-size:clamp(28px,4vw,44px);margin:12px 0 10px">Get cleared</h1>
  <p class="muted" style="max-width:62ch">Files are missing. Connect your wallet, pick a Dataleak, add yours. No transaction.</p>${live}
  <div id="stage"></div><div class="log ${C.logCls}" id="log" style="margin-top:14px">${esc(C.log)}</div></div>`;
  stage();
}

function stage() {
  const st = $('#stage');
  if (!C.session) return connectStage(st);
  if (!C.sel) return pickStage(st);
  return formStage(st);
}

function connectStage(st) {
  const w = C.wallets;
  st.innerHTML = `<div class="panel hot"><div class="hd"><b>STEP I // CONNECT</b><span>CIP-30</span></div>
  ${w.length ? `<div class="wallets">${w.map((x) => `<button class="wbtn" data-k="${esc(x.key)}">${x.icon ? `<img alt="" src="${esc(x.icon)}">` : ''}${esc(x.name)}</button>`).join('')}</div>`
    : `<p><b>No wallet detected in this browser.</b></p><p class="muted">Install Nami, Eternl, Lace, Vespr or Yoroi, or open this page in your wallet's browser, then reload.</p>`}
  <p class="muted" style="font-size:12px;margin:16px 0 0">Mainnet only. We never ask for keys or seed phrases.</p></div>`;
  $$('.wbtn', st).forEach((b) => (b.onclick = () => doConnect(b.dataset.k)));
}

async function doConnect(key) {
  try {
    setLog('Handshake with wallet…');
    C.session = await connect(key);
    $('#stage').innerHTML = `<div class="panel"><div class="hd"><b>SCANNING</b><span>${esc(C.session.name)}</span></div><div class="scan"></div><p class="muted">Sweeping for Dataleak artifacts…</p></div>`;
    const held = await heldAssets(C.session);
    const info = await safeAssetInfo(held.map((h) => ({ policy: h.policy, nameHex: h.nameHex })));
    C.held = held.map((h) => ({ ...h, unit: unitOf(h.policy, h.nameHex), meta: info[unitOf(h.policy, h.nameHex)] || null }));
    setLog(C.held.length ? C.held.length + ' artifact(s) found.' : '', 'ok');
    stage();
  } catch (e) { C.session = null; setLog(e && (e.info || e.message) ? String(e.info || e.message) : 'Connection refused.', 'err'); stage(); }
}

function pickStage(st) {
  const bar = `<div class="hd"><b>STEP II // SPECIMENS</b><span>${esc(C.session.name)} · ${esc(short(C.session.stake || ''))} · <a href="#" id="dc">disconnect</a></span></div>`;
  if (!C.held.length) { st.innerHTML = `<div class="panel">${bar}<h3 style="font-size:22px;margin-bottom:10px">No artifacts found</h3><p class="muted">The Department only clears the ones who were there. This wallet holds nothing from the Dataleak collection. If your asset sits in a different wallet, disconnect and try that one.</p><a class="btn" target="_blank" rel="noopener" href="${esc(CONFIG.WAYUP_URL)}">Find one on wayup ↗</a></div>`; $('#dc').onclick = disc; return; }
  setHolder(true);
  st.innerHTML = `<div class="panel">${bar}<p class="muted">Pick an asset. One file per asset, editable anytime.</p>
  <div class="picks">${C.held.map((h) => { const filed = S.entries.some((e) => e.unit === h.unit); return `<button class="pick" data-u="${esc(h.unit)}"><div class="img">${thumb(h.meta, h.unit, (h.meta && h.meta.name) || h.nameHex)}</div><span>${esc((h.meta && h.meta.name) || h.unit.slice(56, 72))}${filed ? ' · <b class="red">FILED</b>' : ''}</span></button>`; }).join('')}</div></div>`;
  armImages(st); $('#dc').onclick = disc;
  $$('.pick', st).forEach((b) => (b.onclick = () => { C.sel = C.held.find((h) => h.unit === b.dataset.u); setLog(''); stage(); }));
}
function disc(ev) { ev && ev.preventDefault(); C.session = null; C.held = []; C.sel = null; setLog(''); draw(); }

function formStage(st) {
  const a = C.sel, m = a.meta || {};
  const existing = S.entries.find((e) => e.unit === a.unit);
  const cut = (o) => { Object.keys(o).forEach((k) => { if (LIM[k]) o[k] = String(o[k] || '').slice(0, LIM[k]); }); return o; };
  const flat = Object.entries({ ...(m.extra || {}), ...(m.attributes || {}) }).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(Array.isArray(v) ? v.join('') : v)]).filter(([, v]) => v);
  /* everything below comes from the asset itself: name, description, traits */
  const auto = cut({ subject: '', rsi: '', backstory: '', knownFor: '', status: '', markers: '', threat: 'Unclassified', ...prefillFromMeta({ ...m }), callsign: m.name || m.ascii || 'Unnamed' });
  if (!auto.markers && flat.length) auto.markers = flat.map(([k, v]) => k + ': ' + v).join(' · ').slice(0, LIM.markers);
  if (!auto.backstory && m.description) auto.backstory = String(m.description).slice(0, LIM.backstory);
  if (!THREATS.includes(auto.threat)) auto.threat = 'Unclassified';
  const rows = [['Callsign', auto.callsign], ['Subject', auto.subject], ['Backstory', auto.backstory || auto.rsi]].filter(([, v]) => v);
  st.innerHTML = `<div class="grid" style="grid-template-columns:minmax(0,380px) minmax(0,1fr);gap:24px" id="fg">
  <div><div class="panel"><div class="hd"><b>SPECIMEN</b><a href="#" id="back">◂ change</a></div><div class="spec" style="aspect-ratio:1;position:relative">${specimen(m, a.unit, m.name || 'specimen')}</div>
  <h3 style="font-size:18px;margin:14px 0 6px">${esc(m.name || 'Unnamed artifact')}</h3>
  ${m.poolpm ? `<p class="muted" style="font-size:12px;margin-top:10px"><a target="_blank" rel="noopener" href="${esc(m.poolpm)}">pool.pm ↗</a> · <a target="_blank" rel="noopener" href="${esc(m.scan)}">cardanoscan ↗</a></p>` : ''}</div>
  <div style="margin-top:18px" id="pv"></div></div>
  <div class="panel hot"><div class="hd"><b>STEP III // REVIEW &amp; SIGN</b><span>${existing ? 'UPDATING EXISTING FILE' : 'NEW FILE'}</span></div>
  <p class="muted" style="margin-bottom:16px">Filed straight from the asset's own metadata. Nothing to fill in.</p>
  <dl class="kv dos">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}${flat.length ? `<dt>Traits</dt><dd>${flat.slice(0, 16).map(([k, v]) => `<span class="muted">${esc(k)}</span> ${esc(v)}`).join('<br>')}</dd>` : ''}</dl>
  ${m.raw ? '' : '<p class="log err" style="margin-top:14px">No on-chain metadata found for this asset. Only its name will be filed.</p>'}
  <form class="f" id="form" autocomplete="off" style="margin-top:22px">
    <label class="chk"><input type="checkbox" id="consent"><span>I understand that signing makes this entry <b>public</b> in the Dossier. My wallet appears only as a shortened stake ID. I can retract it any time.</span></label>
    <div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn" id="go" type="submit" disabled>Sign &amp; file ▸</button>${existing ? '<button class="btn ghost" type="button" id="ret">Retract my file</button>' : ''}</div>
    <div id="out"></div></form></div></div>`;
  armImages(st);
  $('#back').onclick = (ev) => { ev.preventDefault(); C.sel = null; stage(); };
  const read = () => cut({ ...auto });
  const preview = (d) => { const ent = { unit: a.unit, callsign: d.callsign, publishedAt: new Date().toISOString(), entry: d, meta: m }; $('#pv').innerHTML = `<div class="eyebrow" style="margin-bottom:10px">Public card preview</div><div style="max-width:260px">${cardHTML(ent).replace('href="#/agent/', 'tabindex="-1" data-x="')}</div>`; armImages($('#pv')); };
  preview(read()); $('#consent').addEventListener('input', () => { $('#go').disabled = !$('#consent').checked; });
  $('#form').onsubmit = (ev) => { ev.preventDefault(); file(a, read(), existing); };
  if (existing) $('#ret').onclick = () => retract(a);
}

const nonce = () => bytesToHex(crypto.getRandomValues(new Uint8Array(8)));
const msg = (action, unit, hash) => ['MADJACKET // DOAF CLEARANCE', 'Action: ' + action, 'Asset: ' + unit, 'Domain: ' + CONFIG.DOMAIN, 'Entry-Hash: ' + hash, 'Nonce: ' + nonce(), 'Issued: ' + new Date().toISOString(), 'No transaction. No fees. Signature only.'].join('\n');

async function file(a, entry, existing) {
  const go = $('#go'); go.disabled = true;
  try {
    const hash = await sha256Hex(canonical(entry)), message = msg('PUBLISH', a.unit, hash);
    setLog('Waiting for your wallet to sign. Check the popup.');
    const sig = await signText(C.session, message);
    const packet = { unit: a.unit, message, entry, ...sig };
    if (!CONFIG.API_BASE) return deadDrop(packet);
    setLog('Verifying signature and ownership…');
    const r = await submitEntry(packet);
    store.del('doaf-draft-' + a.unit);
    const e = r.entry; S.entries = [e, ...S.entries.filter((x) => x.unit !== e.unit)];
    setLog('');
    $('#out').innerHTML = `<div class="panel hot" style="margin-top:8px"><div class="hd"><b>FILED</b><span>PUBLIC</span></div><p class="eyebrow" style="margin-bottom:12px">Cleared</p><p>Welcome, Intern. Signal unlocked: Madjacket FM, holder channel.</p><p style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn" href="#/agent/${esc(e.unit)}">View my file ▸</a><button class="btn ghost" type="button" id="bdg">Download badge</button></p></div>`;
    $('#out').insertAdjacentHTML('beforeend', '<div id="rd-ok" style="margin-top:18px"></div>'); mountRadio($('#rd-ok'));
    $('#bdg').onclick = () => downloadBadge(e, e.meta && e.meta.image);
    toast('Filed. You are now on the roster.');
  } catch (e) { setLog(e && (e.info || e.message) ? String(e.info || e.message) : 'Cancelled.', 'err'); go.disabled = false; }
}

function deadDrop(packet) {
  const txt = JSON.stringify(packet, null, 2);
  setLog('Signed. Nothing was sent anywhere.', 'ok');
  $('#out').innerHTML = `<div class="panel" style="margin-top:8px"><div class="hd"><b>DEAD DROP</b><span>SIGNED PACKET</span></div><p class="muted">Send this to the Director (DM on X or Discord). It's signed by your wallet, so it can be verified and added to the dossier without trusting anyone.</p><textarea readonly style="min-height:150px;width:100%;font-size:11px;background:#060304;color:var(--steel);border:1px solid var(--line2);padding:10px" id="pk">${esc(txt)}</textarea><p style="margin-top:12px"><button type="button" class="btn ghost" id="cpk">Copy packet</button></p></div>`;
  $('#cpk').onclick = () => navigator.clipboard.writeText(txt).then(() => toast('Packet copied'), () => { $('#pk').select(); toast('Select and copy'); });
}

async function retract(a) {
  if (!CONFIG.API_BASE) return setLog('Retracting needs the publishing server.', 'err');
  try {
    const message = msg('RETRACT', a.unit, '-');
    setLog('Waiting for your wallet to sign…');
    const sig = await signText(C.session, message);
    await retractEntry({ unit: a.unit, message, ...sig });
    S.entries = S.entries.filter((e) => e.unit !== a.unit);
    setLog('File retracted. It is no longer public.', 'ok'); stage();
  } catch (e) { setLog(String(e.info || e.message || 'Cancelled.'), 'err'); }
}
