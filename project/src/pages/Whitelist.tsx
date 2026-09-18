import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { isValidChecksum } from "../lib/keccak256";


const LOCAL_KEY = "mj_whitelist";

function getList(): string[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function saveAddr(a: string) {
  const l = getList(); if (!l.includes(a)) { l.push(a); localStorage.setItem(LOCAL_KEY, JSON.stringify(l)); }
}
function inList(a: string) { return getList().includes(a); }
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

  const register = useCallback(async () => {
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
      setLoading(false);
      setRegStatus({ type: "error", lines: ["// CLEARANCE REGISTRY FULL", "All 199 spots for this wave are filled. Watch @_madjacket for the next drop."] });
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

  const verify = useCallback(() => {
    const addr = verAddr.trim();
    if (!isValidAddr(addr)) {
      setVerStatus({ type: "error", lines: ["// ERROR", "Not a valid ETH/EVM address."] });
      return;
    }
    const norm = addr.toLowerCase();
    if (inList(norm)) {
      setVerStatus({ type: "success", lines: ["// CONFIRMED — CLEARANCE ACTIVE", `${addr.slice(0,6)}...${addr.slice(-4)} is on the list.`, "MADJACKET × ROBINHOOD — CLEARANCE ACTIVE"] });
    } else {
      setVerStatus({ type: "error", lines: ["// NOT FOUND", `${addr.slice(0,6)}...${addr.slice(-4)} is not on the list.`, "Register above."] });
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
          <button className="wl-btn" onClick={register} disabled={loading}>
            {loading ? "TRANSMITTING..." : "REGISTER FOR CLEARANCE"}
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
          <p>This is a drawing. The Red Cathedral rewards those who remember. You read the lore. You know the world. Step forward.</p>
        </div>
      </div>
    </div>
  );
}
