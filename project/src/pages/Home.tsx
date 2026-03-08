import { useRef, useEffect, useState } from "react";
import ScrollCarousel from "../components/ScrollCarousel";
import GlitchVisitors from "../components/GlitchVisitors";

function SplashScreen({ onEnter }: { onEnter: () => void }) {
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [barWidth, setBarWidth] = useState(0);
  const [statusText, setStatusText] = useState("INITIALIZING ANU NEURAL OS...");

  useEffect(() => {
    const steps = [
      { pct: 22, text: "INITIALIZING ANU NEURAL OS..." },
      { pct: 47, text: "RSI DATA SYNC IN PROGRESS..." },
      { pct: 68, text: "CORTEX FEED ESTABLISHING..." },
      { pct: 89, text: "SIGNAL INTERCEPT ACTIVE..." },
      { pct: 100, text: "CATHEDRAL ONLINE." },
    ];
    let i = 0;
    const tick = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(tick);
        setTimeout(() => setPhase("ready"), 300);
        return;
      }
      setBarWidth(steps[i].pct);
      setStatusText(steps[i].text);
      i++;
    }, 420);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="splash">
      <div className="splash-grid" aria-hidden="true" />
      <div className="splash-scanlines" aria-hidden="true" />
      <div className="splash-inner">
        <div className="splash-brand">MADJACKET</div>
        <div className="splash-sub">* ARRIVAL PROTOCOL INITIATED *</div>
        <div className="splash-bar-wrap">
          <div className="splash-bar" style={{ width: `${barWidth}%` }} />
        </div>
        <div className="splash-status">{statusText}</div>
        {phase === "ready" && (
          <button className="splash-enter" onClick={onEnter}>
            ENTER THE CATHEDRAL
          </button>
        )}
      </div>
    </div>
  );
}

const MAD_BRANCHES = [
  {
    abbr: "MAD",
    name: "Mood Abuse Defense",
    desc: "Enforcing laws against psionic threats and mood-altering contraband.",
  },
  {
    abbr: "JAC",
    name: "Joint Action Committee",
    desc: "Managing policy, public opinion, and political maneuvering.",
  },
  {
    abbr: "KET",
    name: "Kinetic Engagement Team",
    desc: "The tactical strike force — called in when the others have failed.",
  },
];

const PSICARE_ROWS = [
  {
    letters: "PSI",
    full: "Psionic Stabilization Initiative",
    desc: "Immediate crisis intervention for metapsychosis outbreaks",
  },
  {
    letters: "CA",
    full: "Compassionate Aid",
    desc: "Safe houses and therapy clinics, reintegration support",
  },
  {
    letters: "RE",
    full: "Rehabilitation & Education",
    desc: "Ethical research, training, and psionic mastery without coercion",
  },
];

const HAREKIN_TRAITS = [
  "EVASION", "NO SIGNAL TRACE", "URBAN FOLK", "RABBIT AUGMENTS",
  "EMPATHIC RESONANCE", "FREEDOM PROTOCOL", "MEGAETH NATIVE", "SPEED = SOVEREIGNTY",
  "GENE EDITING",
];

export default function Home() {
  const heroPanRef = useRef<HTMLImageElement>(null);
  const [splashDone, setSplashDone] = useState(() => {
    return sessionStorage.getItem("splash_done") === "1";
  });
  const [isArrivalHovered, setIsArrivalHovered] = useState(false);

  function handleEnter() {
    sessionStorage.setItem("splash_done", "1");
    setSplashDone(true);
  }

  useEffect(() => {
    function onScroll() {
      const img = heroPanRef.current;
      if (!img) return;
      img.style.transform = `translateY(${window.scrollY * 0.28}px)`;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!splashDone) {
    return <SplashScreen onEnter={handleEnter} />;
  }

  return (
    <>
      <section id="hero">
        <img
          ref={heroPanRef}
          className="hero-pan"
          alt=""
          src="/Red_cathedral.png"
        />
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-inner">
          <div className="eyebrow">AUTHORIZED SIGNAL INTERCEPT</div>
          <h1 className="hero-title">
            MADJACKET
            <span
              className="outline"
              style={{
                letterSpacing: isArrivalHovered ? '0.4em' : '0em',
                transition: 'letter-spacing 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'inline-block',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setIsArrivalHovered(true)}
              onMouseLeave={() => setIsArrivalHovered(false)}
            >
              ARRIVAL
            </span>
          </h1>
          <div className="hero-sub">
            A red cathedral feed. A live archive.<br></br> A leak you were not supposed to see.
          </div>
          <div className="cta">
           /* <a className="btn primary" href="https://opensea.io/collection/madjacket-arrival/overview" target="_blank" rel="noreferrer">PREVIEW COLLECTION</a>
            <a className="btn" href="/screening">SCREENING</a>
            <a className="btn" href="/dataleak">OPEN TERMINAL</a>*/
          </div>
        </div>
      </section>

      <div className="rule" />

      <section id="collection">
        <ScrollCarousel />
        <div className="faction-tagline">
          <span className="faction-label">THE 2 FACTIONS THAT RUN CORTEX CITY.</span>
          <span className="faction-sep"> AND THE </span>
          <span className="faction-disruptor" data-text="1 DISRUPTOR">1 DISRUPTOR</span>
        </div>
      </section>

      <div className="rule" />

      <section className="mad-section">
        <div className="wrap">
          <div className="mad-eyebrow">ENFORCEMENT ARM</div>
          <h2 className="mad-title">
            THE THREE BRANCHES<br />
            <span className="mad-accent">OF MADJACKET</span>
          </h2>
          <p className="mad-intro">
            Madjacket is the city's enforcement arm. To the public, they're safety. To those who've met them firsthand, they're something else entirely.
          </p>
          <div className="mad-cards">
            {MAD_BRANCHES.map((b) => (
              <div key={b.abbr} className="mad-card">
                <div className="mad-card-abbr">{b.abbr}</div>
                <div className="mad-card-name">{b.name}</div>
                <div className="mad-card-desc">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rule" />

      <section className="psicare-section">
        <div className="wrap">
          <div className="ps-eyebrow">OPPOSITION · PSICARE</div>
          <h2 className="ps-title">
            PSI<span className="ps-accent">CARE</span>
            <span className="ps-sub-title"> — THE OTHER PATH</span>
          </h2>
          <p className="section-p" style={{ marginBottom: "32px" }}>
            PsiCare believes psionics can be healed and integrated — not suppressed. They run safe houses, therapy clinics, and underground research.
          </p>
          <div className="ps-acronym-row">
            {["P","S","I","C","A","R","E"].map((l) => (
              <div key={l} className="ps-letter">{l}</div>
            ))}
          </div>
          <div className="ps-cards">
            {PSICARE_ROWS.map((row) => (
              <div key={row.letters} className="ps-card">
                <div className="ps-card-letters">{row.letters}</div>
                <div className="ps-card-full">{row.full}</div>
                <div className="ps-card-desc">{row.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="rule" />

      <section className="harekins-section">
        <GlitchVisitors />
        <div className="wrap">
          <div className="harekin-tag">◈ FACTION FILE — UNREGISTERED</div>
          <h2 className="harekin-title">
            THE <span className="harekin-accent">HAREKINS</span>
            <br />ARE ALREADY INSIDE.
          </h2>
          <div className="harekin-body">
            <p>
              They don't appear in any Signal registry. They leave no RSI trace. No compliance profile. No location data.
            </p>
            <p>
              The <strong>Harekins</strong> are a rogue faction who slipped through the cracks before The Signal reached full coverage — urban ghosts who move faster than the city's cognitive grid can track. They took the rabbit as their emblem. Not for cuteness. For what it means: <span className="harekin-cyan">quick, elusive, impossible to contain.</span>
            </p>
            <p>
              Where Madjacket enforces and PsiCare heals, the Harekins <strong>vanish</strong>. They are freedom as a survival tactic. Rebellion encoded in movement. The only faction The Signal cannot model because they refuse to hold still long enough to be read.
            </p>
            <p>
              The city that can't catch you can't own you. <span className="harekin-cyan">They move at MegaETH speed — and that is the only sovereignty that matters.</span>
            </p>
          </div>
          <div className="harekin-traits">
            {HAREKIN_TRAITS.map((t) => (
              <span key={t} className="harekin-trait">◈ {t}</span>
            ))}
          </div>
        </div>
        <div className="harekin-watermark" aria-hidden="true">HAREKIN</div>
      </section>

      <div className="rule" />

      <section className="megaeth-section">
        <div className="wrap">
          <div className="me-eyebrow">BUILT ON · MEGAETH</div>
          <h2 className="me-title">THIS IS THE GATEWAY.</h2>
          <p className="me-body">
            Not just collectors. Not just whales. <strong>Everybody into the gateway.</strong> Plebs, builders, runners — the whole bloc. MegaETH is speed. And speed is what gets you out.
          </p>
          <p className="me-body">
            Powered by <span className="me-accent">MegaETH</span>.
          </p>
          <div className="me-btns">
            <a className="btn primary" href="https://kreate.art/collection/MadjacketDataLeak" target="_blank" rel="noreferrer">KREATE</a>
            <a className="btn" href="https://opensea.io/collection/madjacket-arrival/overview" target="_blank" rel="noreferrer">OPENSEA</a>
          </div>
        </div>
      </section>

      <section className="cathedral-footer-section">
        <div className="cf-bg" style={{ backgroundImage: "url('/pfp/cath001.png')" }} />
        <div className="cf-overlay" />
      </section>

      <footer>
        <div className="foot">
          <div>MADJACKET <span style={{ color: "var(--red)" }}>ARRIVAL</span></div>
          <div><a href="#hero">Top</a></div>
        </div>
      </footer>
    </>
  );
}
