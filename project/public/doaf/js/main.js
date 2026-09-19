import { CONFIG } from './config.js';
import { S, init, home, file, roster, agent } from './ui/views.js';
import { clearance } from './ui/clearance.js';
import { $, $$, ago, esc, store } from './ui/util.js';

const NAV = [['#/', 'Briefing', '01'], ['#/file', 'The file', '02'], ['#/roster', 'Roster', '03'], ['#/clearance', 'Clearance', '04']];
function chrome() {
  const links = (cls) => NAV.map(([h, t, n]) => `<a href="${h}" data-h="${h}">${cls ? '' : `<small>${n}</small>`}${t}</a>`).join('');
  $('#nav').innerHTML = links(0) + `<div class="foot">CORTEX CITY GOVERNANCE<br>DEPT. OF ANTI-FUCKERY<br>FORM DOAF-000<br><br><a href="${esc(CONFIG.X_URL)}" target="_blank" rel="noopener">@_madjacket ↗</a><br><a href="${esc(CONFIG.WAYUP_URL)}" target="_blank" rel="noopener">Dataleak on wayup ↗</a></div>`;
  $('#mnav').innerHTML = links(1);
  const clock = () => { const t = new Date(); $('#clk').textContent = t.toLocaleTimeString([], { hour12: false }); };
  $('#top').innerHTML = `<a class="brand" href="/">MAD<em>JACKET</em></a><span><i class="dot"></i><b>DOAF</b></span><span class="hide-s">Cortex City Gov // DOAF</span><span class="sp"></span><span class="hide-s" id="ses">Clearance: public</span><span id="clk"></span>`;
  clock(); setInterval(clock, 1000);
}
function ticker() {
  const bits = ['The Department does not take applications. Only discoveries.', 'Nothing is fixed. Everything is filed.', 'Interns rarely survive a full quarter.', 'Some things don’t want to be filed.'];
  const fresh = S.entries.slice(0, 6).map((e) => `<em>▸ Cleared</em> ${esc(e.callsign)} · ${ago(e.publishedAt)}`);
  const line = fresh.concat(bits.map((b) => '✦ ' + esc(b))).join('<span></span>');
  $('#ticker').innerHTML = `<span>${line}</span><span>${line}</span>`;
  $$('#ticker span').forEach((s) => (s.style.cssText = 'display:inline-flex;gap:56px;padding-right:56px'));
}
async function route() {
  await S.ready; if (S.cleanup) { S.cleanup(); S.cleanup = null; }
  const h = location.hash || '#/', [, a, b] = h.split('/');
  $$('[data-h]').forEach((l) => l.classList.toggle('on', l.dataset.h === (a ? '#/' + a : '#/') || (a === 'agent' && l.dataset.h === '#/roster')));
  scrollTo(0, 0);
  ({ file: () => file(b), roster, agent: () => agent(decodeURIComponent(b || '')), clearance }[a] || home)();
}
const LINES = ['DOAF//OS 0.9.4 — CORTEX CITY GOVERNANCE', 'establishing link ................ <span class="r">ok</span>', 'checking the Signal ............ <span class="r">bleeding (acceptable)</span>', 'mounting the junk drawer ....... ok', 'loading 6 files, 0 explanations', '', 'WELCOME, INTERN.', 'Your role has been automatically approved by the system.'];
function boot() {
  const el = $('#boot'), log = $('#bootlog'); let seen = false; try { seen = sessionStorage.getItem('doaf-boot'); } catch {}
  if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) return el.remove();
  let i = 0, done = false; const end = () => { if (done) return; done = true; try { sessionStorage.setItem('doaf-boot', '1'); } catch {} el.classList.add('gone'); setTimeout(() => el.remove(), 800); };
  $('#bootskip').onclick = end; el.onclick = end;
  (function next() { if (done) return; if (i >= LINES.length) return setTimeout(end, 700); log.innerHTML += LINES[i++] + '\n'; setTimeout(next, 330); })();
}
boot(); chrome();
init().then(() => { ticker(); route(); });
addEventListener('hashchange', route);
