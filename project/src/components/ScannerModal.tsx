import { useRef, useEffect, useState, useCallback } from "react";
import { useModal } from "../context/ModalContext";
import { SHIFT } from "../data/items";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface Attrs {
  align: string;
  threat: string;
  icon: string;
  seal: string;
  status: string;
}

const DEFAULT_ATTRS: Attrs = { align: "—", threat: "—", icon: "—", seal: '"..."', status: "SCANNING" };

export default function ScannerModal() {
  const { scannerOpen, closeScanner, currentItem } = useModal();

  const [officerName, setOfficerName] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [warnMsg, setWarnMsg] = useState("Camera requires HTTPS or localhost. If denied, allow permission.");
  const [liveAttrs, setLiveAttrs] = useState<Attrs>(DEFAULT_ATTRS);
  const [frozenAttrs, setFrozenAttrs] = useState<Attrs | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const barcodeRafRef = useRef<number | null>(null);
  const shiftTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const frozenRef = useRef(false);
  const barsRef = useRef<number[]>([]);
  const barcodeOffsetRef = useRef(0);
  const frozenDataUrlRef = useRef<string | null>(null);

  const displayAttrs = frozenAttrs || liveAttrs;

  function stopShifting() {
    if (shiftTimerRef.current) { clearInterval(shiftTimerRef.current); shiftTimerRef.current = null; }
  }

  function startShifting() {
    stopShifting();
    shiftTimerRef.current = setInterval(() => {
      setLiveAttrs({
        align: pick(SHIFT.align),
        threat: currentItem?.threat || pick(SHIFT.threat),
        icon: pick(SHIFT.icon),
        seal: pick(SHIFT.seal),
        status: currentItem?.status || "SCANNING",
      });
    }, 380);
  }

  const applyRedFilter = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const c = clamp((lum - 55) * 2.8, 0, 255);
      d[i]   = c;
      d[i+1] = 0;
      d[i+2] = 0;
      d[i+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = "rgba(0,0,0,0.17)";
      ctx.fillRect(0, y, w, 1);
    }
    const grad = ctx.createRadialGradient(w * 0.5, h * 0.42, w * 0.1, w * 0.5, h * 0.5, w * 0.7);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.52)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }, []);

  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video || frozenRef.current) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) { rafRef.current = requestAnimationFrame(renderFrame); return; }
    const S = Math.min(vw, vh);
    const W = 480, H = 480;
    canvas.width = W; canvas.height = H;
    const sx = Math.floor((vw - S) / 2);
    const sy = Math.floor((vh - S) / 2);
    ctx.drawImage(video, sx, sy, S, S, 0, 0, W, H);
    applyRedFilter(ctx, W, H);
    rafRef.current = requestAnimationFrame(renderFrame);
  }, [applyRedFilter]);

  function initBarcode() {
    const bars: number[] = [];
    let total = 0;
    while (total < 4000) {
      const w = Math.floor(Math.random() * 5) + 1;
      bars.push(w);
      total += w;
    }
    barsRef.current = bars;
  }

  const animateBarcode = useCallback(() => {
    const canvas = barcodeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#070707";
    ctx.fillRect(0, 0, W, H);

    const bars = barsRef.current;
    const offset = barcodeOffsetRef.current % (W * 1.5);
    let x = -offset;
    let isBar = true;

    for (const w of bars) {
      if (x > W) break;
      if (x + w > 0 && isBar) {
        const alpha = 0.6 + Math.random() * 0.4;
        const useRed = Math.random() < 0.08;
        ctx.fillStyle = useRed ? `rgba(255,0,60,${alpha})` : `rgba(72,72,72,${alpha})`;
        ctx.fillRect(Math.max(0, x), 4, Math.min(w, W - Math.max(0, x)), H - 8);
      }
      x += w;
      isBar = !isBar;
    }

    ctx.fillStyle = "rgba(7,7,7,0.55)";
    ctx.fillRect(0, 0, W, Math.floor(H * 0.18));
    ctx.fillRect(0, Math.floor(H * 0.82), W, Math.floor(H * 0.18));

    barcodeOffsetRef.current += 0.7;
    barcodeRafRef.current = requestAnimationFrame(animateBarcode);
  }, []);

  function stopBarcodeAnim() {
    if (barcodeRafRef.current) { cancelAnimationFrame(barcodeRafRef.current); barcodeRafRef.current = null; }
  }

  function stopCamera() {
    frozenRef.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.pause();
      hiddenVideoRef.current.srcObject = null;
    }
    videoRef.current = null;
    setIsStreaming(false);
    setIsFrozen(false);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setWarnMsg("Camera API not available on this browser.");
      return;
    }
    if (!window.isSecureContext) {
      setWarnMsg("Camera requires HTTPS. Please use a secure connection.");
      return;
    }

    setWarnMsg("Requesting camera access…");

    let stream: MediaStream | null = null;

    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }, audio: false },
      { video: { facingMode: "user" }, audio: false },
      { video: true, audio: false },
    ];

    for (const c of constraints) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(c);
        break;
      } catch {
        stream = null;
      }
    }

    if (!stream) {
      setWarnMsg("Camera permission denied or device not found.");
      stopCamera();
      return;
    }

    streamRef.current = stream;

    let video = hiddenVideoRef.current;
    if (!video) {
      setWarnMsg("Internal error: video element missing.");
      stream.getTracks().forEach(t => t.stop());
      return;
    }

    video.srcObject = stream;

    try {
      await video.play();
    } catch {
      setWarnMsg("Could not start camera preview. Try again.");
      stream.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      return;
    }

    videoRef.current = video;
    frozenRef.current = false;
    setIsStreaming(true);
    setIsFrozen(false);
    setFrozenAttrs(null);
    frozenDataUrlRef.current = null;
    setWarnMsg("LIVE — Freeze when ready.");
    renderFrame();
  }

  function handleFreeze() {
    if (!canvasRef.current) return;
    frozenRef.current = true;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    frozenDataUrlRef.current = canvasRef.current.toDataURL("image/png");
    const locked: Attrs = {
      align: liveAttrs.align,
      threat: currentItem?.threat || liveAttrs.threat,
      icon: liveAttrs.icon,
      seal: liveAttrs.seal,
      status: currentItem?.status || liveAttrs.status,
    };
    setFrozenAttrs(locked);
    setIsFrozen(true);
    setWarnMsg("FROZEN — Save the ID card below.");
  }

  function handleRescan() {
    frozenRef.current = false;
    frozenDataUrlRef.current = null;
    setFrozenAttrs(null);
    setIsFrozen(false);
    setWarnMsg("LIVE — Freeze when ready.");
    renderFrame();
  }

  async function handleSaveCard() {
    const attrs = frozenAttrs || liveAttrs;
    const name = officerName.trim().toUpperCase() || "UNKNOWN";
    const desig = currentItem?.designation || "RSI-???";
    const date = new Date().toISOString().split("T")[0];

    const CW = 1400, CH = 788;
    const off = document.createElement("canvas");
    off.width = CW; off.height = CH;
    const ctx = off.getContext("2d");
    if (!ctx) return;

    await document.fonts.ready;

    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, CW, CH);

    ctx.strokeStyle = "rgba(255,0,60,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(10, 10, CW - 20, CH - 20);

    const topH = 46;
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(10, 10, CW - 20, topH);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, 10 + topH); ctx.lineTo(CW - 10, 10 + topH); ctx.stroke();

    ctx.fillStyle = "rgba(240,240,240,0.5)";
    ctx.font = "500 12px 'Share Tech Mono', monospace";
    ctx.letterSpacing = "3px";
    ctx.fillText("MAGACA // IDENTIFICATION PROTOCOL", 26, 38);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,0,60,0.65)";
    ctx.fillText(date, CW - 26, 38);
    ctx.textAlign = "left";

    const photoX = 24, photoY = 68, photoW = 520, photoH = 560;

    if (frozenDataUrlRef.current) {
      const img = new Image();
      img.src = frozenDataUrlRef.current;
      await new Promise<void>(r => { img.onload = () => r(); });
      ctx.drawImage(img, photoX, photoY, photoW, photoH);
    } else {
      ctx.fillStyle = "#0e0e0e";
      ctx.fillRect(photoX, photoY, photoW, photoH);
      ctx.fillStyle = "rgba(255,0,60,0.2)";
      ctx.font = "bold 48px 'Bebas Neue', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("NO PHOTO", photoX + photoW / 2, photoY + photoH / 2);
      ctx.textAlign = "left";
    }

    for (let y = photoY; y < photoY + photoH; y += 3) {
      ctx.fillStyle = "rgba(0,0,0,0.13)";
      ctx.fillRect(photoX, y, photoW, 1);
    }

    ctx.strokeStyle = "rgba(255,0,60,0.55)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(photoX, photoY, photoW, photoH);

    const bs = 20;
    ctx.strokeStyle = "rgba(255,0,60,0.95)";
    ctx.lineWidth = 2.5;
    const corners = [
      [photoX, photoY, 1, 1], [photoX + photoW, photoY, -1, 1],
      [photoX, photoY + photoH, 1, -1], [photoX + photoW, photoY + photoH, -1, -1],
    ] as const;
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * bs); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * bs, cy);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(photoX + 10, photoY + photoH - 32, 80, 22);
    ctx.fillStyle = isFrozen ? "rgba(240,240,240,0.55)" : "rgba(255,0,60,0.9)";
    ctx.beginPath(); ctx.arc(photoX + 22, photoY + photoH - 21, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(240,240,240,0.75)";
    ctx.font = "10px 'Share Tech Mono', monospace";
    ctx.letterSpacing = "2px";
    ctx.fillText(isFrozen ? "FROZEN" : "LIVE", photoX + 32, photoY + photoH - 16);

    const rp = photoX + photoW + 40;
    const rpW = CW - rp - 24;

    ctx.fillStyle = "rgba(255,0,60,0.72)";
    ctx.font = "11px 'Share Tech Mono', monospace";
    ctx.letterSpacing = "4px";
    ctx.fillText(desig, rp, 108);

    ctx.fillStyle = "#f0f0f0";
    ctx.font = "bold 52px 'Bebas Neue', sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(`MADJACKET OFFICER: _${name}`, rp, 175);

    const lineY = 198;
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rp, lineY); ctx.lineTo(rp + rpW, lineY); ctx.stroke();

    const attrY = 230;
    const attrGap = 120;
    const pairs = [
      ["STATUS", attrs.status], ["THREAT", attrs.threat],
      ["ALIGNMENT", attrs.align], ["ICON", attrs.icon],
    ] as const;
    pairs.forEach(([label, val], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const ax = rp + col * (rpW / 2);
      const ay = attrY + row * attrGap;
      ctx.fillStyle = "rgba(240,240,240,0.42)";
      ctx.font = "10px 'Share Tech Mono', monospace";
      ctx.letterSpacing = "3px";
      ctx.fillText(label, ax, ay);
      ctx.fillStyle = "#f0f0f0";
      ctx.font = "bold 26px 'Bebas Neue', sans-serif";
      ctx.letterSpacing = "2px";
      ctx.fillText(val, ax, ay + 32);
    });

    const badgeY = attrY + 2 * attrGap + 10;
    const badgeW = 220, badgeH = 32;
    ctx.strokeStyle = "rgba(255,0,60,0.55)";
    ctx.lineWidth = 1;
    ctx.strokeRect(rp, badgeY, badgeW, badgeH);
    ctx.fillStyle = "rgba(255,0,60,0.12)";
    ctx.fillRect(rp, badgeY, badgeW, badgeH);
    ctx.fillStyle = "rgba(255,0,60,0.9)";
    ctx.beginPath(); ctx.arc(rp + 14, badgeY + 16, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(240,240,240,0.85)";
    ctx.font = "11px 'Share Tech Mono', monospace";
    ctx.letterSpacing = "2px";
    ctx.fillText(`THREAT // ${attrs.threat}`, rp + 26, badgeY + 21);

    ctx.fillStyle = "rgba(240,240,240,0.55)";
    ctx.font = "italic 14px 'Share Tech Mono', monospace";
    ctx.letterSpacing = "1px";
    ctx.fillText(attrs.seal, rp, badgeY + 60);

    const bcY = CH - 80, bcH = 44;
    ctx.fillStyle = "#070707";
    ctx.fillRect(10, bcY, CW - 20, bcH);
    let bx = 10;
    let isBar = true;
    for (const w of barsRef.current) {
      if (bx > CW) break;
      if (isBar) {
        const useRed = Math.random() < 0.07;
        ctx.fillStyle = useRed ? "rgba(255,0,60,0.9)" : "rgba(72,72,72,0.88)";
        ctx.fillRect(bx, bcY + 5, w, bcH - 10);
      }
      bx += w;
      isBar = !isBar;
    }

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, bcY); ctx.lineTo(CW - 10, bcY); ctx.stroke();

    const dataUrl = off.toDataURL("image/png");
    const filename = `madjacket_id_${name.replace(/\s+/g, "_").toLowerCase()}.png`;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    if (isIOS) {
      window.open(dataUrl, "_blank");
    } else {
      const dl = document.createElement("a");
      dl.download = filename;
      dl.href = dataUrl;
      document.body.appendChild(dl);
      dl.click();
      document.body.removeChild(dl);
    }
  }

  useEffect(() => {
    if (scannerOpen) {
      setFrozenAttrs(null);
      frozenDataUrlRef.current = null;
      setIsFrozen(false);
      setLiveAttrs({
        align: "—", threat: currentItem?.threat || "—",
        icon: "—", seal: '"..."', status: currentItem?.status || "SCANNING",
      });
      initBarcode();
      barcodeOffsetRef.current = 0;
      animateBarcode();
      startShifting();
    } else {
      stopShifting();
      stopCamera();
      stopBarcodeAnim();
    }
  }, [scannerOpen]);

  useEffect(() => () => { stopShifting(); stopCamera(); stopBarcodeAnim(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && scannerOpen) { stopShifting(); stopCamera(); stopBarcodeAnim(); closeScanner(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [scannerOpen, closeScanner]);

  function handleClose() {
    stopShifting(); stopCamera(); stopBarcodeAnim(); closeScanner();
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) handleClose();
  }

  const dateStr = new Date().toISOString().split("T")[0];

  return (
    <div className={`id-modal-backdrop${scannerOpen ? " open" : ""}`} onClick={handleBackdropClick}>
      <video
        ref={hiddenVideoRef}
        playsInline
        muted
        autoPlay={false}
        style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none", top: 0, left: 0 }}
        aria-hidden="true"
      />
      <div className="id-modal-inner" role="dialog" aria-modal="true" aria-label="Identity Scanner">
        <button className="close-btn id-close" onClick={handleClose}>ESC / CLOSE</button>

        <div className="id-card">
          <div className="id-topbar">
            <span className="id-top-brand">MAGACA // IDENTIFICATION PROTOCOL</span>
            <div className="id-top-right">
              <span className="id-top-date">{dateStr}</span>
            </div>
          </div>

          <div className="id-body">
            <div className="id-photo-panel">
              <div className="id-photo-frame">
                <canvas ref={canvasRef} width={480} height={480} className="id-photo-canvas" />
                {!isStreaming && (
                  <div className="id-photo-placeholder">
                    <div className="id-placeholder-cross" />
                    <span>NO SIGNAL</span>
                  </div>
                )}
                <div className="id-photo-scanlines" aria-hidden="true" />
                <div className="id-corner id-corner-tl" aria-hidden="true" />
                <div className="id-corner id-corner-tr" aria-hidden="true" />
                <div className="id-corner id-corner-bl" aria-hidden="true" />
                <div className="id-corner id-corner-br" aria-hidden="true" />
                <div className={`id-live-tag${isFrozen ? " frozen" : ""}`}>
                  <span className="id-live-dot" />
                  {isFrozen ? "FROZEN" : isStreaming ? "LIVE" : "OFFLINE"}
                </div>
                <div className="id-photo-coord">34.052°N 118.243°W</div>
              </div>

              <div className="id-controls">
                <button className="id-btn id-btn-primary" onClick={startCamera} disabled={isStreaming && !isFrozen}>
                  START CAMERA
                </button>
                <button className="id-btn" onClick={handleFreeze} disabled={!isStreaming || isFrozen}>
                  FREEZE + SCAN
                </button>
                <button className="id-btn" onClick={handleRescan} disabled={!isFrozen}>
                  RESCAN
                </button>
                <button className="id-btn id-btn-save" onClick={handleSaveCard}>
                  SAVE ID CARD
                </button>
              </div>
              <div className="id-warn">{warnMsg}</div>
            </div>

            <div className="id-attrs-panel">
              <div className="id-desig">{currentItem?.designation || "MADJACKET OFFICER"}</div>

              <div className="id-name-row">
                <span className="id-name-prefix">MADJACKET OFFICER: _</span>
                <input
                  className="id-name-input"
                  value={officerName}
                  onChange={e => setOfficerName(e.target.value)}
                  placeholder="ENTER NAME"
                  maxLength={32}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>

              <div className="id-divider" />

              <div className="id-attrs-grid">
                <div className="id-attr-cell">
                  <div className="id-attr-label">STATUS</div>
                  <div className={`id-attr-value${!isFrozen ? " scanning" : ""}`}>{displayAttrs.status}</div>
                </div>
                <div className="id-attr-cell">
                  <div className="id-attr-label">THREAT</div>
                  <div className={`id-attr-value${!isFrozen ? " scanning" : ""}`}>{displayAttrs.threat}</div>
                </div>
                <div className="id-attr-cell">
                  <div className="id-attr-label">ALIGNMENT</div>
                  <div className={`id-attr-value${!isFrozen ? " scanning" : ""}`}>{displayAttrs.align}</div>
                </div>
                <div className="id-attr-cell">
                  <div className="id-attr-label">ICON</div>
                  <div className={`id-attr-value${!isFrozen ? " scanning" : ""}`}>{displayAttrs.icon}</div>
                </div>
              </div>

              <div className="id-threat-badge">
                <span className="id-threat-dot" />
                THREAT // {displayAttrs.threat}
              </div>

              <div className="id-seal-line">
                <span className={`id-seal${!isFrozen ? " scanning" : ""}`}>{displayAttrs.seal}</span>
              </div>

              <div className="id-cyberpunk-details" aria-hidden="true">
                <div className="id-detail-line">SYS: 0xA001 · CLS: OMEGA · VER 2.6.0</div>
                <div className="id-detail-line">AUTH: RSI-CORE · ENC: LATTICE-512</div>
              </div>
            </div>
          </div>

          <div className="id-barcode-row">
            <canvas ref={barcodeRef} className="id-barcode" width={1200} height={44} />
            <div className="id-barcode-label">RSI-ENCODED · MEGAETH · MADJACKET ARRIVAL</div>
          </div>
        </div>
      </div>
    </div>
  );
}
