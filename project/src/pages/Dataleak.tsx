import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ITEMS, Item } from "../data/items";

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const PLACEHOLDER_SVG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><rect width='100%' height='100%' fill='#0b0b0b'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='rgba(255,0,60,.35)' font-family='monospace' font-size='18'>XX</text></svg>`
  );

export default function Dataleak() {
  const termRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function addLine(text: string, dim = false) {
    const term = termRef.current;
    if (!term) return;
    const div = document.createElement("div");
    div.className = "tline" + (dim ? " dim" : "");
    div.textContent = text;
    term.appendChild(div);
    term.scrollTop = term.scrollHeight;
  }

  function addEntry(item: Item) {
    const term = termRef.current;
    if (!term) return;
    const img = item.img || PLACEHOLDER_SVG;

    const el = document.createElement("div");
    el.className = "entry";
    el.innerHTML = `
      <div class="etop">
        <div class="eimg">
          <img alt="" loading="lazy" src="${img}">
          <div class="ov">LIVE</div>
        </div>
        <div class="emeta">
          <div class="edes">${item.designation || item.id || "RSI-???"} · ${item.name || "DL_ASSET"}</div>
          <div class="esub">${item.subject || "Unindexed Subject"} · <span class="status-tag">${item.status || "UNKNOWN"}</span> · <span class="threat-tag">${item.threat || "UNKNOWN"}</span></div>
          <div class="edesc">${item.desc || "Classified record present."}</div>
        </div>
      </div>
      <div class="efoot">
        <div class="pause">[ FEED PAUSED · RSI FRAGMENT STABLE ]</div>
        <a class="link" href="${item.url || "#"}" target="_blank" rel="noreferrer">[ VIEW FILE ON KREATE ↗ ]</a>
      </div>
    `;

    term.appendChild(el);
    term.scrollTop = term.scrollHeight;
    pausedRef.current = true;

    const resume = () => { pausedRef.current = false; cleanup(); };
    const cleanup = () => {
      el.querySelector<HTMLAnchorElement>(".link")?.removeEventListener("click", resume);
      clearTimeout(tid);
    };
    el.querySelector<HTMLAnchorElement>(".link")?.addEventListener("click", resume);
    const tid = setTimeout(resume, 9000);
  }

  useEffect(() => {
    addLine("resuming feed...", true);
    addLine("─────────────────────────────────────────────", true);

    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      const roll = Math.random();
      if (roll < 0.45) {
        const item = pick(ITEMS);
        const logs = [
          `packet drop :: ${(Math.random() * 5).toFixed(1)}% loss`,
          `null witness still unaccounted for`,
          `time-stamp anomaly :: log flagged`,
          `cross-contamination risk :: elevated`,
          `signal echo :: fragment detected`,
          `cortex sync delay :: ${Math.floor(Math.random() * 800 + 100)}ms`,
        ];
        addLine(pick(logs), true);
      } else if (roll < 0.72) {
        const item = pick(ITEMS);
        addLine(`ANOMALY DETECTED :: ${item.designation || item.id} — ${item.name || "DL_ASSET"}`, false);
        addLine(`rsi fragment surfacing... classification: ${item.threat || "UNKNOWN"}`, false);
      } else {
        addEntry(pick(ITEMS));
      }
    }, 1800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="dl-page">
      <div className="dl-header">
        <div className="dl-live-box">
          <div className="dl-live-text">LIVE</div>
        </div>
        <div className="dl-restricted">◈ RESTRICTED FEED</div>
      </div>

      <div className="wrap">
        <h1 className="dl-title">DATALEAK</h1>
        <p className="dl-intro">
          The Signal logs everything. The Cathedral logs what the Signal deletes.
        </p>

        <div className="terminal" role="region" aria-label="Data terminal">
          <div className="tbar">
            <span className="dot red" />
            <span className="dot" />
            <span className="dot" />
            <span className="ttitle">CORTEX SYSTEM :: ANOMALY LOG</span>
          </div>
          <div className="tbody" ref={termRef} />
        </div>

        <div style={{ marginTop: "24px" }}>
          <Link to="/" className="btn">← BACK TO HOME</Link>
        </div>
      </div>

      <footer>
        <div className="foot">
          <div>MADJACKET <span style={{ color: "var(--red)" }}>ARRIVAL</span></div>
          <div><Link to="/" style={{ color: "rgba(240,240,240,.25)", textDecoration: "none" }}>HOME</Link></div>
        </div>
      </footer>
    </div>
  );
}
