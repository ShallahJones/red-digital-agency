import { useState, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { isValidChecksum } from "../lib/keccak256";


// Registration is closed. Flip to false to reopen — this alone controls the form;
// no Supabase tables or policies are touched by this flag.
const REGISTRATION_CLOSED = true;

const LOCAL_KEY = "mj_whitelist";

function getList(): string[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function saveAddr(a: string) {
  const l = getList(); if (!l.includes(a)) { l.push(a); localStorage.setItem(LOCAL_KEY, JSON.stringify(l)); }
}
function inList(a: string) { return getList().includes(a); }
// Late arrivals (overflow past the 199 seats) are logged but NOT cleared, so they are tracked apart.
const LATE_KEY = "mj_whitelist_late";
function getLate(): string[] {
  try { return JSON.parse(localStorage.getItem(LATE_KEY) || "[]"); } catch { return []; }
}
function saveLate(a: string) {
  const l = getLate(); if (!l.includes(a)) { l.push(a); try { localStorage.setItem(LATE_KEY, JSON.stringify(l)); } catch { /* ignore */ } }
}
function isLate(a: string) { return getLate().includes(a); }
function isValidAddr(a: string) {
  return /^0x[0-9a-fA-F]{40}$/.test(a) && isValidChecksum(a);
}

type StatusState = { type: "success" | "error" | null; lines: string[] };

export default function Whitelist() {
  const [regAddr, setRegAddr] = useState("");
  const [verAddr, setVerAddr] = useState("");
  const [regStatus, setRegStatus] = useState<StatusState>({ type: null, lines: [] });
  const [verStatus, setVerStatus] = useState<StatusState>({ type: null, lines: [] });
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState<{ count: number; cap: number; overflow: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/whitelist-count")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && typeof data.count === "number" && typeof data.cap === "number") {
          setCounter({ count: data.count, cap: data.cap, overflow: typeof data.overflow === "number" ? data.overflow : 0 });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const register = useCallback(async () => {
    if (REGISTRATION_CLOSED) {
      setRegStatus({ type: "error", lines: ["// CLEARANCE REGISTRY CLOSED", "Registration for the Robinhood collection is closed. Watch @_madjacket for what's next."] });
      return;
    }
    const addr = regAddr.trim();
    if (!isValidAddr(addr)) {
      setRegStatus({ type: "error", lines: ["// REJECTED — INVALID ADDRESS", "Not a valid ETH address, or the checksum doesn't match. Copy it straight from your wallet."] });
      return;
    }
    const norm = addr.toLowerCase();
    if (inList(norm)) {
      setRegStatus({ type: "success", lines: ["// ALREADY REGISTERED", `${addr.slice(0,6)}...${addr.slice(-4)} is already on the list.`] });
      return;
    }
    setLoading(true);

    if (!supabase) {
      setLoading(false);
      setRegStatus({ type: "error", lines: ["// OFFLINE", "Registration is temporarily unavailable. Try again shortly."] });
      return;
    }

    const { error } = await supabase.from("robinhood_whitelist").insert({ wallet_address: norm });

    if (error && error.message?.includes("WHITELIST_FULL")) {
      // Real list is full at the cap — no clearance granted. Log the attempt to the
      // separate, uncapped overflow table purely so the site can display how many
      // extra wallets tried (hype counter). Best-effort; failure here doesn't matter.
      supabase.from("robinhood_whitelist_overflow").insert({ wallet_address: norm }).then(() => {});
      setCounter((c) => (c ? { ...c, overflow: c.overflow + 1 } : c));
      setLoading(false);
      saveAddr(norm);
      saveLate(norm);
      setRegStatus({ type: "success", lines: ["// SUBMISSION LOGGED — LATE ARRIVAL", `${addr.slice(0,6)}...${addr.slice(-4)} filed.`, "The Cathedral's first 199 seats are already claimed. Your submission was received all the same.", "Watch @_madjacket."] });
      setRegAddr("");
      return;
    }

    if (error && error.code !== "23505") {
      // 23505 = unique_violation, i.e. already registered — that's fine, not a real error.
      setLoading(false);
      setRegStatus({ type: "error", lines: ["// TRANSMISSION FAILED", "Something broke on our end. Try again in a moment."] });
      return;
    }

    saveAddr(norm);
    setLoading(false);

    if (error?.code === "23505") {
      setRegStatus({ type: "success", lines: ["// ALREADY REGISTERED", `${addr.slice(0,6)}...${addr.slice(-4)} is already on the list.`] });
    } else {
      setCounter((c) => (c ? { ...c, count: Math.min(c.count + 1, c.cap) } : c));
      setRegStatus({
        type: "success",
        lines: [
          "// CLEARANCE GRANTED",
          `${addr.slice(0,6)}...${addr.slice(-4)} filed.`,
          "Watch @_madjacket for mint details.",
          `Timestamp: ${new Date().toLocaleString()}`,
        ],
      });
    }
    setRegAddr("");
  }, [regAddr]);

  const verify = useCallback(async () => {
    const addr = verAddr.trim();
    if (!isValidAddr(addr)) {
      setVerStatus({ type: "error", lines: ["// ERROR", "Not a valid ETH/EVM address."] });
      return;
    }
    const norm = addr.toLowerCase();
    const short = `${addr.slice(0,6)}...${addr.slice(-4)}`;
    // Authoritative answer comes from the server (works on any device). If it can't be
    // reached, fall back to what this browser remembers.
    let status: "cleared" | "late" | "none" | null = null;
    try {
      const r = await fetch(`/api/whitelist-status?address=${norm}`);
      if (r.ok) {
        const d = await r.json();
        if (d.status === "cleared" || d.status === "late" || d.status === "none") status = d.status;
      }
    } catch { /* fall through to local */ }
    if (status === null) status = inList(norm) ? (isLate(norm) ? "late" : "cleared") : "none";

    if (status === "late") {
      setVerStatus({ type: "error", lines: ["// LATE ARRIVAL — NOT CLEARED", `${short} is logged, but arrived after the first 199 seats were claimed.`, "No free-mint clearance. Watch @_madjacket."] });
    } else if (status === "cleared") {
      setVerStatus({ type: "success", lines: ["// CONFIRMED — CLEARANCE ACTIVE", `${short} is on the list.`, "MADJACKET × ROBINHOOD — CLEARANCE ACTIVE"] });
    } else {
      setVerStatus({ type: "error", lines: ["// NOT FOUND", `${short} is not on the list.`, "Register above."] });
    }
  }, [verAddr]);

  return (
    <div className="wl-page">
      {/* layered kaleidoscope lattice bg */}
      <div className="wl-bg" aria-hidden="true">
        <div className="wl-kaleido--b" />
        <div className="wl-kaleido" />
        <div className="wl-lattice wl-lattice--b" />
        <div className="wl-lattice" />
        <div className="wl-vignette" />
      </div>

      <div className="wl-container">
        <div className="wl-title">MADJACKET — ROBINHOOD COLLECTION — CLEARANCE REGISTRY</div>

        {REGISTRATION_CLOSED && (
          <div className="wl-status wl-status--error" style={{ marginBottom: 22 }}>
            <span className="wl-status-code">// REGISTRY CLOSED</span>
            <span>The Robinhood collection whitelist is no longer accepting new submissions. Watch @_madjacket for what's next.</span>
          </div>
        )}

        {counter && (() => {
          const total = counter.count + counter.overflow;
          const pct = Math.round((total / counter.cap) * 100);
          const overallocated = total > counter.cap;
          return (
            <div className={`wl-counter${overallocated ? " wl-counter--over" : ""}`}>
              <div className="wl-counter-row">
                <span>{overallocated ? `${total} / ${counter.cap} CLAIMED` : `${counter.count} / ${counter.cap} CLAIMED`}</span>
                <span>{overallocated ? `${pct}% ALLOCATED` : `${counter.cap - counter.count} REMAINING`}</span>
              </div>
              <div className="wl-counter-track">
                <div
                  className="wl-counter-fill"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* REGISTER */}
        <div className="wl-section">
          <label className="wl-label" htmlFor="walletAddress">Wallet Address (ETH)</label>
          <input
            id="walletAddress"
            className="wl-input"
            type="text"
            placeholder="0x..."
            autoComplete="off"
            spellCheck={false}
            value={regAddr}
            disabled={REGISTRATION_CLOSED}
            onChange={e => setRegAddr(e.target.value)}
            onKeyDown={e => e.key === "Enter" && register()}
          />
          {loading && <div className="wl-loading"><div className="wl-loading-bar" /></div>}
          {regStatus.type && (
            <div className={`wl-status wl-status--${regStatus.type}`}>
              <span className="wl-status-code">{regStatus.lines[0]}</span>
              {regStatus.lines.slice(1).map((l, i) => <span key={i}>{l}</span>)}
            </div>
          )}
          <button className="wl-btn" onClick={register} disabled={loading || REGISTRATION_CLOSED}>
            {loading ? "TRANSMITTING..." : REGISTRATION_CLOSED ? "REGISTRY CLOSED" : "REGISTER FOR CLEARANCE"}
          </button>
        </div>

        <div className="wl-divider" />

        {/* VERIFY */}
        <div className="wl-section">
          <label className="wl-label" htmlFor="verifyAddress">Verify Clearance Status</label>
          <input
            id="verifyAddress"
            className="wl-input"
            type="text"
            placeholder="0x..."
            autoComplete="off"
            spellCheck={false}
            value={verAddr}
            onChange={e => setVerAddr(e.target.value)}
            onKeyDown={e => e.key === "Enter" && verify()}
          />
          {verStatus.type && (
            <div className={`wl-status wl-status--${verStatus.type}`}>
              <span className="wl-status-code">{verStatus.lines[0]}</span>
              {verStatus.lines.slice(1).map((l, i) => <span key={i}>{l}</span>)}
            </div>
          )}
          <button className="wl-btn wl-btn--ghost" onClick={verify}>
            CHECK STATUS → <span className="wl-blink">_</span>
          </button>
        </div>

        <div className="wl-divider" />

        {/* INTEL NOTE */}
        <div className="wl-intel">
          <div className="wl-intel-head">INTEL NOTE</div>
          <p>This drawing is closed. The Red Cathedral has counted who remembered. If you submitted, watch @_madjacket for what comes next.</p>
        </div>
      </div>
    </div>
  );
}
