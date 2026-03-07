import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const TARGET_UTC = Date.UTC(2026, 2, 27, 4, 0, 0);

const GLITCH_CHARS = ['?', '¿', '‽', '⁇', '؟', '？'];

function getGlitchyQuestionMarks(count: number): string {
  return Array(count).fill(0).map(() => GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]).join('');
}


export default function Screening() {
  const [time, setTime] = useState({ d: "??", h: "??", m: "??", s: "??", live: false });
  const [glitchTick, setGlitchTick] = useState(0);

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

      const dStr = getGlitchyQuestionMarks(String(d).length || 2);
      const hStr = getGlitchyQuestionMarks(2);
      const mStr = getGlitchyQuestionMarks(2);
      const sStr = getGlitchyQuestionMarks(2);

      setTime({ d: dStr, h: hStr, m: mStr, s: sStr, live });
      setGlitchTick(prev => prev + 1);
    }
    tick();
    const id = setInterval(tick, 150);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="page-wrap">
      <section id="screening">
        <div className="wrap">
          <div style={{ marginBottom: "8px" }}>
            <Link to="/" style={{ fontSize: "10px", letterSpacing: "3px", color: "rgba(255,0,60,.6)", textDecoration: "none" }}>
              ← BACK TO HOME
            </Link>
          </div>
          <h2 className="section-h">SCREENING</h2>
          <p className="section-p">Countdown to mint day locked. Timestamp absolute. Eastern Time.</p>
          <div className="screen-card">
            <div className="cd" role="group" aria-label="Countdown">
              <div className="box"><span>{time.d}</span><em>DAYS</em></div>
              <div className="box"><span>{time.h}</span><em>HOURS</em></div>
              <div className="box"><span>{time.m}</span><em>MIN</em></div>
              <div className="box"><span>{time.s}</span><em>SEC</em></div>
            </div>
            <div className="seat">
              <div>STATUS <b>{time.live ? "LIVE" : "RESERVED"}</b></div>
              <div>GATE <b>RED CATHEDRAL</b></div>
              <div>TIME <b>?? ??? ?? 2026 · 9:00 PM ET</b></div>
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
