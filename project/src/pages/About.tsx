import { useState } from "react";
import { Link } from "react-router-dom";
import PdfReader from "../components/PdfReader";

const PITCH_DECK_SRC = "/madjacket-pitch-deck.pdf";
const PITCH_DECK_TITLE = "MADJACKET_PITCHDECK.pdf";

export default function About() {
  const [readerOpen, setReaderOpen] = useState(false);

  return (
    <div className="page-wrap">
      <section id="about">
        <div className="wrap">
          <div style={{ marginBottom: "8px" }}>
            <Link to="/" style={{ fontSize: "10px", letterSpacing: "3px", color: "rgba(255,0,60,.6)", textDecoration: "none" }}>
              ← BACK TO HOME
            </Link>
          </div>
          <h2 className="section-h">ABOUT</h2>
          <p className="section-p">
            Not everything here is meant to be understood on the first pass. Some of it isn't meant
            to be understood at all — just felt, the way a rumor is felt before it's confirmed.
          </p>

          <div className="about-seal-row">
            <img src="/doaf-seal.png" alt="Department of Anti-Fuckery seal" className="about-seal" />
            <div className="about-seal-caption">
              <div className="about-seal-title">DEPT. OF ANTI-FUCKERY</div>
              <div className="about-seal-sub">Cortex City Governance · est. status unconfirmed</div>
            </div>
          </div>

          <div className="dossier">
            <p className="dossier-p">
              Somewhere under Cortex City there's a full file on what MADJACKET actually is — the world,
              the mechanics, the numbers, who's really behind it. It wasn't supposed to leak. It did anyway.
              Open it if you want the whole picture before you take a seat.
            </p>
            <div className="dossier-row">
              <button
                type="button"
                className="desktop-file"
                onClick={() => setReaderOpen(true)}
              >
                <div className="desktop-file-icon" aria-hidden="true">
                  <span className="desktop-file-corner" />
                  <span className="desktop-file-label">PDF</span>
                </div>
                <span className="desktop-file-name">{PITCH_DECK_TITLE}</span>
              </button>

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

      <PdfReader
        open={readerOpen}
        onClose={() => setReaderOpen(false)}
        src={PITCH_DECK_SRC}
        title={PITCH_DECK_TITLE}
      />
    </div>
  );
}
