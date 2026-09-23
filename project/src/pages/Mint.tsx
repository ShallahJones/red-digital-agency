import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const TARGET_UTC = Date.UTC(2026, 8, 23, 21, 30, 0); // Sep 23 2026, 5:30 PM EDT (UTC-4)

const TARGET_DATE_STR = "SEP 23 2026 · 5:30 PM ET";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export default function Mint() {
  const [time, setTime] = useState({ d: "00", h: "00", m: "00", s: "00", live: false });
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    function tick() {
      const now = Date.now();
      let s = Math.floor((TARGET_UTC - now) / 1000);
      const live = s <= 0;
      if (s < 0) s = 0;
      const d = Math.floor(s / 86400); s %= 86400;
      const h = Math.floor(s / 3600); s %= 3600;
      const m = Math.floor(s / 60);
      const sec = s % 60;

      setTime({ d: pad2(d), h: pad2(h), m: pad2(m), s: pad2(sec), live });
    }
    tick();
    const id = setInterval(tick, 1000);

    // periodic glitch flicker on the digits — visual only, numbers stay real
    const glitchId = setInterval(() => {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 180);
    }, 4000);

    return () => { clearInterval(id); clearInterval(glitchId); };
  }, []);

  return (
    <div className="page-wrap">
      <section id="mint">
        <div className="wrap">
          <div style={{ marginBottom: "8px" }}>
            <Link to="/" style={{ fontSize: "10px", letterSpacing: "3px", color: "rgba(255,0,60,.6)", textDecoration: "none" }}>
              ← BACK TO HOME
            </Link>
          </div>
          <h2 className="section-h">MINT</h2>
          <p className="section-p">Countdown to mint day locked. Timestamp absolute. Eastern Time.</p>
          <div className="screen-card">
            <div className={`cd${glitching ? " cd-glitch" : ""}`} role="group" aria-label="Countdown">
              <div className="box"><span>{time.d}</span><em>DAYS</em></div>
              <div className="box"><span>{time.h}</span><em>HOURS</em></div>
              <div className="box"><span>{time.m}</span><em>MIN</em></div>
              <div className="box"><span>{time.s}</span><em>SEC</em></div>
            </div>
            <div className="seat">
              <div>{time.live ? "MINT IS LIVE" : `TARGET · ${TARGET_DATE_STR}`}</div>
            </div>
          </div>

          <div className="dossier">
            <p className="dossier-p">The full pitch deck is open for review — the vision, the world, the numbers behind MADJACKET. Read it, then hold your seat on the collection page.</p>
            <div className="dossier-row">
              <a
                className="desktop-file"
                href="/madjacket-pitch-deck.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="desktop-file-icon" aria-hidden="true">
                  <span className="desktop-file-corner" />
                  <span className="desktop-file-label">PDF</span>
                </div>
                <span className="desktop-file-name">MADJACKET_PITCHDECK.pdf</span>
              </a>

              <a
                className="wl-btn wl-btn--ghost dossier-opensea"
                href="https://opensea.io/collection/madjacket-rh/"
                target="_blank"
                rel="noopener noreferrer"
              >
                VIEW ON OPENSEA → <span className="wl-blink">_</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="foot">
          <div>MADJACKET <span style={{ color: "var(--red)" }}>ARRIVAL</span></div>
          <div><Link to="/" style={{ color: "rgba(240,240,240,.25)", textDecoration: "none" }}>HOME</Link></div>
        </div>
      </footer>
    </div>
  );
}
