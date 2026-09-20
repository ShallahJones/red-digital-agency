import { CONFIG } from './config.js';
import { S, init, home, file, roster, agent } from './ui/views.js';
import { clearance } from './ui/clearance.js';
import { $, $$, ago, esc, store } from './ui/util.js';
import { mountRadio, loadRadio, onChange, nowPlaying } from './ui/radio.js';
import { getJson } from './lib/api.js';
import { syncTool } from './ui/sync.js';

const NAV = [['#/', 'Briefing', '01'], ['#/file', 'The file', '02'], ['#/roster', 'Roster', '03'], ['#/clearance', 'Clearance', '04'], ['#/radio', 'Radio', '05']];
function chrome() {
  const links = (cls) => NAV.map(([h, t, n]) => `<a href="${h}" data-h="${h}">${cls ? '' : `<small>${n}</small>`}${t}</a>`).join('');
  const sig = [['rust', '#b5473a'], ['moss', '#5f8a63'], ['ochre', '#c79d55']];
  let cur = 'rust'; try { cur = localStorage.getItem('doaf-tone') || 'rust'; } catch {}
  const setSig = (k) => { document.body.dataset.tone = k === 'rust' ? '' : k; try { localStorage.setItem('doaf-tone', k); } catch {} $$('.sigs button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.k === k)); };
  $('#nav').innerHTML = `<div class="sec-h">Files</div>${links(0)}<div class="sec-h t2">Theme</div><div class="sigs">${sig.map(([k, c]) => `<button style="--c:${c}" data-k="${k}" aria-label="${k}" aria-pressed="${k === cur}"></button>`).join('')}</div>
  <div class="foot">CORTEX CITY GOVERNANCE<br>DEPT. OF ANTI-FUCKERY<br>FORM DOAF-000<br><br><a href="${esc(CONFIG.X_URL)}" target="_blank" rel="noopener">@_madjacket ↗</a><br><a href="${esc(CONFIG.WAYUP_URL)}" target="_blank" rel="noopener">Dataleak on wayup ↗</a></div>`;
  $$('.sigs button').forEach((b) => (b.onclick = () => setSig(b.dataset.k))); setSig(cur);
  $('#mnav').innerHTML = links(1);
  const clock = () => { const t = new Date(); $('#clk').textContent = t.toLocaleTimeString([], { hour12: false }); };
  $('#top').innerHTML = `<a class="brand" href="/">MAD<em>JACKET</em></a><span><i class="dot"></i><b>DOAF</b></span><span class="hide-s">Cortex City Gov</span><span class="sp"></span><a href="#/radio" id="np" class="hide-s"></a><span class="hide-s" id="ses">Public</span><span id="clk"></span>`;
  clock(); setInterval(clock, 1000);
  onChange(() => { const t = nowPlaying(); $('#np').textContent = t ? '♪ ' + t : ''; });
}
async function route() {
  await S.ready; if (S.cleanup) { S.cleanup(); S.cleanup = null; }
  const h = location.hash || '#/', [, a, b] = h.split('/');
  $$('[data-h]').forEach((l) => l.classList.toggle('on', l.dataset.h === (a ? '#/' + a : '#/') || (a === 'agent' && l.dataset.h === '#/roster')));
  scrollTo(0, 0); { const am = $('#amb'); am && am.remove(); }
  ({ radio: () => { $('#app').innerHTML = `<div class="view"><div class="eyebrow">Radio</div><h1 style="font-size:clamp(28px,4vw,44px);margin:12px 0 10px">Madjacket FM</h1><p class="muted" style="max-width:60ch">Broadcasting from Cortex City. Open to everyone.</p><div id="rd" style="margin-top:22px;max-width:760px"></div></div>`; S.cleanup = mountRadio($('#rd')); }, file: () => file(b), roster, agent: () => agent(decodeURIComponent(b || '')), clearance, sync: async () => { S.cleanup = await syncTool(); } }[a] || home)();
}
const LINES = ['Initializing system . . .', 'Waking the system . . .', 'Verifying clearance . . .', 'Sweeping for Dataleak artifacts . . .', 'Filing the unfileable . . .', 'Redacting things . . .', 'Establishing secure connection . . .', 'Opening the drawer . . .'];
function boot() {
  const el = $('#boot'); let seen = false; try { seen = sessionStorage.getItem('doaf-boot'); } catch {}
  if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) return el.remove();
  el.innerHTML = `<div class="ld"><div class="tt"><span>LOADING</span><i>∴</i><b id="bp">0%</b></div><div class="bar"><div id="bb"></div></div><div class="warn"><i>!</i>Do not turn off.</div><pre id="bootlog"></pre></div><button class="skip" id="bootskip">ENTER ▸</button>`;
  let done = false, shown = 0; const T = 3400, t0 = performance.now();
  const end = () => { if (done) return; done = true; try { sessionStorage.setItem('doaf-boot', '1'); } catch {} el.classList.add('gone'); setTimeout(() => el.remove(), 800); };
  $('#bootskip').onclick = end; el.onclick = end; setTimeout(end, T + 1500); /* failsafe: the loader always lets you in */
  (function tick(now) {
    if (done) return; const k = Math.min(1, (now - t0) / T), p = k < 0.6 ? (k / 0.6) * 66 : 66 + ((k - 0.6) / 0.4) * 34;
    $('#bp').textContent = Math.round(p) + '%'; $('#bb').style.width = p + '%';
    const want = Math.min(LINES.length, Math.ceil(k * LINES.length)); while (shown < want) $('#bootlog').innerHTML += (shown++ ? '\n' : '') + LINES[shown - 1];
    if (k >= 1) return setTimeout(end, 450); requestAnimationFrame(tick);
  })(t0);
}
boot(); chrome();
init().catch(() => {}).then(() => { route(); }); loadRadio(getJson);
addEventListener('hashchange', route);
