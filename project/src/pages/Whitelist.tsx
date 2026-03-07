import { useState, useCallback } from "react";





const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdmr6WxzoyhKIp7Ytb67ugGv9cA2e8UFnkUn3CoCz6mvKXk_A/formResponse";
const ENTRY = "entry.718361902";
const LOCAL_KEY = "mj_whitelist";

function getList(): string[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]"); } catch { return []; }
}
function saveAddr(a: string) {
  const l = getList(); if (!l.includes(a)) { l.push(a); localStorage.setItem(LOCAL_KEY, JSON.stringify(l)); }
}
function inList(a: string) { return getList().includes(a); }
function isValidAddr(a: string) { return /^0x[0-9a-fA-F]{40}$/.test(a); }

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
      setRegStatus({ type: "error", lines: ["// REJECTED — INVALID ADDRESS", "Paste a real ETH/EVM address from your wallet."] });
      return;
    }
    const norm = addr.toLowerCase();
    if (inList(norm)) {
      setRegStatus({ type: "success", lines: ["// ALREADY REGISTERED", `${addr.slice(0,6)}...${addr.slice(-4)} is already on the list.`] });
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append(ENTRY, addr);
      await fetch(FORM_URL, { method: "POST", mode: "no-cors", body: fd });
    } catch (_) {}
    saveAddr(norm);
    setLoading(false);
    setRegStatus({
      type: "success",
      lines: [
        "// CLEARANCE GRANTED",
        `${addr.slice(0,6)}...${addr.slice(-4)} filed.`,
        "Watch @_madjacket for mint details.",
        `Timestamp: ${new Date().toLocaleString()}`,
      ],
    });
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
      setVerStatus({ type: "success", lines: ["// CONFIRMED — CLEARANCE ACTIVE", `${addr.slice(0,6)}...${addr.slice(-4)} is on the list.`, "WAVE ONE — MADJACKET: AWAKENING"] });
    } else {
      setVerStatus({ type: "error", lines: ["// NOT FOUND", `${addr.slice(0,6)}...${addr.slice(-4)} is not on the list.`, "Register above."] });
    }
  }, [verAddr]);

  return (
    <div className="wl-page">
      {/* hex lattice bg */}
      <div className="wl-hex" aria-hidden="true" />

      <div className="wl-container">
        <div className="wl-title">MADJACKET — CLEARANCE REGISTRY — WAVE ONE</div>

        {/* REGISTER */}
        <div className="wl-section">
          <label className="wl-label" htmlFor="walletAddress">Wallet Address (ETH / MegaETH)</label>
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
          <p>This is a drawing. The Cathedral does not reward followers. It rewards those who remember. You read the strip. You know the world. Step forward.</p>
          <p style={{marginTop: '10px', fontSize: '10px', color: '#333'}}>Max 50 selected per wave. Percentage of total mint allocation announced at drop.</p>
        </div>
      </div>
    </div>
  );
}
