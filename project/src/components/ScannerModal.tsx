import { useRef, useEffect, useState, useCallback } from "react";
import { useModal } from "../context/ModalContext";
import { SHIFT } from "../data/items";

// ── face-api loaded from CDN via script tag in index.html ──────────────────
// Add this to your index.html <head>:
// <script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
declare const faceapi: any;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

interface Attrs {
  align: string;
  threat: string;
  icon: string;
  seal: string;
  status: string;
}

interface FaceData {
  mX: number; mY: number; mW: number; mH: number;
  bx: number; by: number; bw: number; bh: number;
  cx: number; cy: number; tilt: number;
}

const DEFAULT_ATTRS: Attrs = { align: "—", threat: "—", icon: "—", seal: '"..."', status: "SCANNING" };

// ── SVG mask constants ────────────────────────────────────────────────────────
const SVG_W = 441, SVG_H = 809;
const MASK_PATH = `M 70 34 L 66 37 L 61 52 L 52 97 L 44 163 L 40 232 L 40 263 L 44 295 L 47 307 L 62 336 L 69 356 L 73 373 L 76 397 L 75 417 L 57 469 L 50 508 L 49 559 L 51 591 L 55 621 L 59 638 L 74 680 L 85 702 L 101 725 L 141 762 L 169 782 L 187 788 L 215 788 L 231 782 L 251 769 L 275 749 L 300 724 L 307 715 L 317 698 L 331 669 L 342 635 L 348 609 L 353 567 L 352 518 L 350 497 L 342 461 L 323 415 L 323 392 L 327 363 L 336 336 L 352 304 L 356 283 L 358 261 L 358 197 L 355 153 L 349 106 L 342 74 L 341 63 L 333 37 L 328 34 L 322 35 L 318 39 L 309 56 L 276 133 L 259 187 L 246 245 L 243 267 L 243 281 L 248 302 L 237 358 L 229 359 L 222 357 L 175 356 L 163 358 L 160 349 L 153 310 L 153 298 L 157 278 L 156 258 L 148 215 L 139 180 L 121 127 L 93 60 L 81 38 L 76 34 Z M 86 537 L 89 542 L 92 553 L 99 566 L 106 574 L 118 583 L 128 588 L 139 591 L 152 591 L 172 585 L 172 581 L 168 575 L 158 565 L 140 553 L 104 537 L 96 535 L 89 535 Z M 315 534 L 310 533 L 294 538 L 247 561 L 232 574 L 227 582 L 227 587 L 231 587 L 248 593 L 259 593 L 273 589 L 287 582 L 297 573 L 304 563 L 310 551 Z M 333 611 L 331 606 L 314 626 L 300 634 L 289 638 L 281 644 L 273 655 L 260 683 L 255 690 L 241 703 L 229 709 L 221 709 L 215 705 L 208 704 L 203 695 L 202 680 L 203 667 L 205 666 L 210 657 L 220 648 L 224 642 L 225 637 L 214 644 L 202 648 L 189 646 L 184 644 L 175 637 L 174 638 L 180 648 L 198 669 L 198 694 L 194 699 L 182 706 L 179 710 L 171 710 L 161 705 L 151 695 L 141 679 L 133 658 L 127 649 L 120 642 L 95 631 L 76 612 L 72 618 L 83 644 L 100 671 L 105 673 L 118 673 L 120 675 L 132 703 L 148 731 L 153 735 L 157 736 L 160 725 L 163 722 L 165 722 L 168 727 L 173 750 L 176 754 L 187 760 L 207 761 L 217 759 L 223 756 L 229 750 L 232 743 L 236 722 L 239 719 L 243 721 L 246 730 L 249 734 L 252 734 L 257 729 L 265 717 L 283 677 L 288 673 L 301 672 L 312 659 L 324 636 Z`;

function buildMaskDataURI(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_W} ${SVG_H}">
  <defs>
    <filter id="g" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <path d="${MASK_PATH}" fill="rgba(255,235,235,0.82)" fill-rule="evenodd" filter="url(#g)"/>
</svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function smoothFace(prev: FaceData | null, curr: FaceData, t: number): FaceData {
  if (!prev) return { ...curr };
  const s = {} as FaceData;
  (Object.keys(curr) as (keyof FaceData)[]).forEach(k => {
    s[k] = lerp(prev[k] ?? curr[k], curr[k], t) as never;
  });
  return s;
}

// ── Module-level: load models + mask once ────────────────────────────────────
let modelsLoaded = false;
let modelsLoading = false;
let maskImage: HTMLImageElement | null = null;

async function ensureModels() {
  if (modelsLoaded) return;
  if (modelsLoading) { while (modelsLoading) await new Promise(r => setTimeout(r, 100)); return; }
  modelsLoading = true;
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    const img = new Image();
    await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); img.src = buildMaskDataURI(); });
    maskImage = img;
    modelsLoaded = true;
  } finally {
    modelsLoading = false;
  }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function ScannerModal() {
  const { scannerOpen, closeScanner, currentItem } = useModal();

  const [officerName, setOfficerName] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [warnMsg, setWarnMsg] = useState("Camera requires HTTPS or localhost.");
  const [liveAttrs, setLiveAttrs] = useState<Attrs>(DEFAULT_ATTRS);
  const [frozenAttrs, setFrozenAttrs] = useState<Attrs | null>(null);
  const [modelsReady, setModelsReady] = useState(false);

  // canvas refs
  const canvasRef   = useRef<HTMLCanvasElement>(null);  // red-filtered camera feed
  const overlayRef  = useRef<HTMLCanvasElement>(null);  // harekin mask overlay
  const barcodeRef  = useRef<HTMLCanvasElement>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const videoRef    = useRef<HTMLVideoElement | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);

  // loop refs
  const camRafRef      = useRef<number | null>(null);
  const overlayRafRef  = useRef<number | null>(null);
  const detectIntRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const barcodeRafRef  = useRef<number | null>(null);
  const shiftTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // state refs (avoid stale closures)
  const frozenRef       = useRef(false);
  const detectingRef    = useRef(false);
  const facesRef        = useRef<FaceData[]>([]);
  const ringAngleRef    = useRef(0);
  const barsRef         = useRef<number[]>([]);
  const barcodeOffsetRef= useRef(0);
  const frozenDataUrlRef= useRef<string | null>(null);

  const displayAttrs = frozenAttrs || liveAttrs;

  // ── Boot models on mount ───────────────────────────────────────────────────
  useEffect(() => {
    if (typeof faceapi === "undefined") {
      setWarnMsg("face-api.js not loaded. Add CDN script to index.html.");
      return;
    }
    ensureModels().then(() => {
      setModelsReady(true);
      setWarnMsg("Camera requires HTTPS or localhost.");
    }).catch(() => {
      setWarnMsg("Model load failed. Check console.");
    });
  }, []);

  // ── Shifting attrs ─────────────────────────────────────────────────────────
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

  // ── Red filter (original logic) ────────────────────────────────────────────
  const applyRedFilter = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const c = clamp((lum - 55) * 2.8, 0, 255);
      d[i] = c; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = 255;
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

  // ── Camera render loop ─────────────────────────────────────────────────────
  const renderFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video || frozenRef.current) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) { camRafRef.current = requestAnimationFrame(renderFrame); return; }
    const S = Math.min(vw, vh);
    const W = 480, H = 480;
    canvas.width = W; canvas.height = H;
    const sx = Math.floor((vw - S) / 2), sy = Math.floor((vh - S) / 2);
    // draw mirrored
    ctx.save();
    ctx.translate(W, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, S, S, 0, 0, W, H);
    ctx.restore();
    applyRedFilter(ctx, W, H);
    camRafRef.current = requestAnimationFrame(renderFrame);
  }, [applyRedFilter]);

  // ── Face detection loop ────────────────────────────────────────────────────
  const detectFaces = useCallback(async () => {
    const video = videoRef.current;
    if (!detectingRef.current || !video || !video.videoWidth || !modelsLoaded) return;
    try {
      const W = 480;
      const vw = video.videoWidth, vh = video.videoHeight;
      const S = Math.min(vw, vh);
      const cropX = (vw - S) / 2, cropY = (vh - S) / 2;
      const scale = W / S;

      const results = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.35 }))
        .withFaceLandmarks(true);

      const newFaces: FaceData[] = results.map((r: any) => {
        const box = r.detection.box;
        const lm  = r.landmarks;

        // map + mirror face box to canvas space
        let bx = (box.x - cropX) * scale;
        let by = (box.y - cropY) * scale;
        let bw = box.width  * scale;
        let bh = box.height * scale;
        bx = W - bx - bw; // mirror X

        const cx = bx + bw / 2;
        const cy = by + bh / 2;

        // eye tilt angle from landmarks
        const avg = (pts: any[]) => ({
          x: pts.reduce((s: number, p: any) => s + p.x, 0) / pts.length,
          y: pts.reduce((s: number, p: any) => s + p.y, 0) / pts.length,
        });
        const mapX = (vx: number) => W - (vx - cropX) * scale;
        const mapY = (vy: number) => (vy - cropY) * scale;
        const rawLE = avg(lm.getLeftEye());
        const rawRE = avg(lm.getRightEye());
        const le = { x: mapX(rawLE.x), y: mapY(rawLE.y) };
        const re = { x: mapX(rawRE.x), y: mapY(rawRE.y) };
        const tilt = Math.atan2(le.y - re.y, le.x - re.x);

        // mask sizing
        const mW = bw * 1.15;
        const mH = mW * (SVG_H / SVG_W);
        const earFraction = 0.43;
        const mX = cx - mW / 2;
        const mY = by - earFraction * mH;

        return { mX, mY, mW, mH, bx, by, bw, bh, cx, cy, tilt };
      });

      facesRef.current = newFaces.map((f, i) => smoothFace(facesRef.current[i] || null, f, 0.45));
    } catch { /* silent */ }
  }, []);

  // ── Overlay draw loop ──────────────────────────────────────────────────────
  const drawOverlay = useCallback(() => {
    if (frozenRef.current) return;
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    ringAngleRef.current += 0.007;

    facesRef.current.forEach(f => {
      const { mX, mY, mW, mH, bx, by, bw, bh, cx, cy, tilt } = f;
      const pulse = 0.82 + Math.sin(performance.now() * 0.003) * 0.12;
      const dx = mX - cx, dy = mY - cy;

      if (maskImage) {
        // ghost
        ctx.save();
        ctx.globalAlpha = 0.10;
        ctx.translate(cx, cy); ctx.rotate(tilt);
        ctx.drawImage(maskImage, dx, dy, mW, mH);
        ctx.restore();
        // main
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.shadowColor = "rgba(255,200,200,0.5)";
        ctx.shadowBlur  = 16;
        ctx.translate(cx, cy); ctx.rotate(tilt);
        ctx.drawImage(maskImage, dx, dy, mW, mH);
        ctx.restore();
      }

      // ring text
      const RING_TEXT = "  HAREKIN  //  CORTEX CITY  //  SIGNAL ACTIVE  //  YOU ARE NOT A LAB RAT  //  ";
      ctx.save();
      ctx.translate(cx, cy);
      ctx.font = '700 9px "Share Tech Mono"';
      ctx.fillStyle = "rgba(255,0,60,0.7)";
      ctx.shadowColor = "rgba(255,0,60,0.4)"; ctx.shadowBlur = 4;
      const chars = RING_TEXT.split("");
      const step  = (Math.PI * 2) / chars.length;
      chars.forEach((ch, i) => {
        ctx.save();
        ctx.rotate(ringAngleRef.current + i * step);
        ctx.translate(0, -(bw * 0.88 + 14));
        ctx.rotate(Math.PI / 2);
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      });
      ctx.restore();

      // orbit ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath(); ctx.arc(0, 0, bw * 0.6, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,0,60,0.15)";
      ctx.lineWidth = 1; ctx.setLineDash([3, 7]); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();

      // corner brackets
      const bbx=bx-5, bby=by-5, bbw=bw+10, bbh=bh+10, bl=12;
      ctx.strokeStyle = "rgba(255,0,60,0.85)"; ctx.lineWidth = 1.5;
      ctx.shadowColor = "rgba(255,0,60,0.5)"; ctx.shadowBlur = 5;
      [
        [[bbx+bl,bby],[bbx,bby],[bbx,bby+bl]],
        [[bbx+bbw-bl,bby],[bbx+bbw,bby],[bbx+bbw,bby+bl]],
        [[bbx+bl,bby+bbh],[bbx,bby+bbh],[bbx,bby+bbh-bl]],
        [[bbx+bbw-bl,bby+bbh],[bbx+bbw,bby+bbh],[bbx+bbw,bby+bbh-bl]],
      ].forEach(pts => {
        ctx.beginPath();
        ctx.moveTo(pts[0][0], pts[0][1]);
        ctx.lineTo(pts[1][0], pts[1][1]);
        ctx.lineTo(pts[2][0], pts[2][1]);
        ctx.stroke();
      });

      // RSI tag
      ctx.save();
      ctx.font = '700 8px "Share Tech Mono"';
      ctx.fillStyle = "rgba(255,0,60,0.7)";
      ctx.shadowColor = "rgba(255,0,60,0.4)"; ctx.shadowBlur = 3;
      const tag = `RSI-${Math.floor(cx).toString(16).toUpperCase().padStart(4,"0")}`;
      ctx.fillText(tag, cx - ctx.measureText(tag).width / 2, bby + bbh + 12);
      ctx.restore();
    });

    overlayRafRef.current = requestAnimationFrame(drawOverlay);
  }, []);

  // ── Barcode ────────────────────────────────────────────────────────────────
  function initBarcode() {
    const bars: number[] = [];
    let total = 0;
    while (total < 4000) { const w = Math.floor(Math.random() * 5) + 1; bars.push(w); total += w; }
    barsRef.current = bars;
  }

  const animateBarcode = useCallback(() => {
    const canvas = barcodeRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#070707"; ctx.fillRect(0, 0, W, H);
    const bars = barsRef.current;
    const offset = barcodeOffsetRef.current % (W * 1.5);
    let x = -offset, isBar = true;
    for (const w of bars) {
      if (x > W) break;
      if (x + w > 0 && isBar) {
        const alpha = 0.6 + Math.random() * 0.4;
        const useRed = Math.random() < 0.08;
        ctx.fillStyle = useRed ? `rgba(255,0,60,${alpha})` : `rgba(72,72,72,${alpha})`;
        ctx.fillRect(Math.max(0, x), 4, Math.min(w, W - Math.max(0, x)), H - 8);
      }
      x += w; isBar = !isBar;
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

  // ── Camera control ─────────────────────────────────────────────────────────
  function stopCamera() {
    frozenRef.current = false;
    detectingRef.current = false;
    if (camRafRef.current)     { cancelAnimationFrame(camRafRef.current); camRafRef.current = null; }
    if (overlayRafRef.current) { cancelAnimationFrame(overlayRafRef.current); overlayRafRef.current = null; }
    if (detectIntRef.current)  { clearInterval(detectIntRef.current); detectIntRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (hiddenVideoRef.current) { hiddenVideoRef.current.pause(); hiddenVideoRef.current.srcObject = null; }
    videoRef.current = null;
    facesRef.current = [];
    setIsStreaming(false);
    setIsFrozen(false);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) { setWarnMsg("Camera API not available."); return; }
    if (!window.isSecureContext) { setWarnMsg("Camera requires HTTPS."); return; }
    setWarnMsg("Requesting camera access…");
    let stream: MediaStream | null = null;
    const constraints: MediaStreamConstraints[] = [
      { video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }, audio: false },
      { video: { facingMode: "user" }, audio: false },
      { video: true, audio: false },
    ];
    for (const c of constraints) {
      try { stream = await navigator.mediaDevices.getUserMedia(c); break; } catch { stream = null; }
    }
    if (!stream) { setWarnMsg("Camera permission denied."); return; }
    streamRef.current = stream;
    const video = hiddenVideoRef.current;
    if (!video) { stream.getTracks().forEach(t => t.stop()); return; }
    video.srcObject = stream;
    try { await video.play(); } catch {
      setWarnMsg("Could not start camera. Try again.");
      stream.getTracks().forEach(t => t.stop()); streamRef.current = null; return;
    }
    videoRef.current = video;
    frozenRef.current = false;
    setIsStreaming(true); setIsFrozen(false); setFrozenAttrs(null);
    frozenDataUrlRef.current = null;
    setWarnMsg("LIVE — Freeze when ready.");
    // start loops
    renderFrame();
    detectingRef.current = true;
    detectIntRef.current = setInterval(detectFaces, 80);
    overlayRafRef.current = requestAnimationFrame(drawOverlay);
  }

  function handleFreeze() {
    if (!canvasRef.current) return;
    frozenRef.current = true;
    if (camRafRef.current) { cancelAnimationFrame(camRafRef.current); camRafRef.current = null; }
    if (overlayRafRef.current) { cancelAnimationFrame(overlayRafRef.current); overlayRafRef.current = null; }
    // Composite camera feed + harekin overlay into a single snapshot
    const W = canvasRef.current.width, H = canvasRef.current.height;
    const composite = document.createElement("canvas");
    composite.width = W; composite.height = H;
    const compCtx = composite.getContext("2d");
    if (compCtx) {
      compCtx.drawImage(canvasRef.current, 0, 0);          // red-filtered camera
      if (overlayRef.current) {
        compCtx.drawImage(overlayRef.current, 0, 0);       // harekin mask on top
      }
    }
    frozenDataUrlRef.current = composite.toDataURL("image/png");
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
    overlayRafRef.current = requestAnimationFrame(drawOverlay);
  }

  // ── Save ID card (original logic, unchanged) ───────────────────────────────
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
    ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, CW, CH);
    ctx.strokeStyle = "rgba(255,0,60,0.4)"; ctx.lineWidth = 1; ctx.strokeRect(10, 10, CW - 20, CH - 20);
    const topH = 46;
    ctx.fillStyle = "rgba(255,255,255,0.03)"; ctx.fillRect(10, 10, CW - 20, topH);
    ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, 10 + topH); ctx.lineTo(CW - 10, 10 + topH); ctx.stroke();
    ctx.fillStyle = "rgba(240,240,240,0.5)"; ctx.font = "500 12px 'Share Tech Mono', monospace";
    ctx.fillText("MAGACA // IDENTIFICATION PROTOCOL", 26, 38);
    ctx.textAlign = "right"; ctx.fillStyle = "rgba(255,0,60,0.65)"; ctx.fillText(date, CW - 26, 38); ctx.textAlign = "left";
    const photoX = 24, photoY = 68, photoW = 520, photoH = 560;
    if (frozenDataUrlRef.current) {
      const img = new Image(); img.src = frozenDataUrlRef.current;
      await new Promise<void>(r => { img.onload = () => r(); });
      ctx.drawImage(img, photoX, photoY, photoW, photoH);
    } else {
      ctx.fillStyle = "#0e0e0e"; ctx.fillRect(photoX, photoY, photoW, photoH);
    }
    for (let y = photoY; y < photoY + photoH; y += 3) { ctx.fillStyle = "rgba(0,0,0,0.13)"; ctx.fillRect(photoX, y, photoW, 1); }
    ctx.strokeStyle = "rgba(255,0,60,0.55)"; ctx.lineWidth = 1.5; ctx.strokeRect(photoX, photoY, photoW, photoH);
    const bs = 20; ctx.strokeStyle = "rgba(255,0,60,0.95)"; ctx.lineWidth = 2.5;
    const corners = [[photoX, photoY, 1, 1],[photoX + photoW, photoY, -1, 1],[photoX, photoY + photoH, 1, -1],[photoX + photoW, photoY + photoH, -1, -1]] as const;
    for (const [cx, cy, dx, dy] of corners) {
      ctx.beginPath(); ctx.moveTo(cx, cy + dy * bs); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * bs, cy); ctx.stroke();
    }
    ctx.fillStyle = "rgba(0,0,0,0.72)"; ctx.fillRect(photoX + 10, photoY + photoH - 32, 80, 22);
    ctx.fillStyle = isFrozen ? "rgba(240,240,240,0.55)" : "rgba(255,0,60,0.9)";
    ctx.beginPath(); ctx.arc(photoX + 22, photoY + photoH - 21, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(240,240,240,0.75)"; ctx.font = "10px 'Share Tech Mono', monospace";
    ctx.fillText(isFrozen ? "FROZEN" : "LIVE", photoX + 32, photoY + photoH - 16);
    const rp = photoX + photoW + 40, rpW = CW - rp - 24;
    ctx.fillStyle = "rgba(255,0,60,0.72)"; ctx.font = "11px 'Share Tech Mono', monospace"; ctx.fillText(desig, rp, 108);
    ctx.fillStyle = "#f0f0f0"; ctx.font = "bold 52px 'Bebas Neue', sans-serif"; ctx.fillText(`MADJACKET OFFICER: _${name}`, rp, 175);
    ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rp, 198); ctx.lineTo(rp + rpW, 198); ctx.stroke();
    const attrY = 230, attrGap = 120;
    const pairs = [["STATUS", attrs.status],["THREAT", attrs.threat],["ALIGNMENT", attrs.align],["ICON", attrs.icon]] as const;
    pairs.forEach(([label, val], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const ax = rp + col * (rpW / 2), ay = attrY + row * attrGap;
      ctx.fillStyle = "rgba(240,240,240,0.42)"; ctx.font = "10px 'Share Tech Mono', monospace"; ctx.fillText(label, ax, ay);
      ctx.fillStyle = "#f0f0f0"; ctx.font = "bold 26px 'Bebas Neue', sans-serif"; ctx.fillText(val, ax, ay + 32);
    });
    const badgeY = attrY + 2 * attrGap + 10, badgeW = 220, badgeH = 32;
    ctx.strokeStyle = "rgba(255,0,60,0.55)"; ctx.lineWidth = 1; ctx.strokeRect(rp, badgeY, badgeW, badgeH);
    ctx.fillStyle = "rgba(255,0,60,0.12)"; ctx.fillRect(rp, badgeY, badgeW, badgeH);
    ctx.fillStyle = "rgba(255,0,60,0.9)"; ctx.beginPath(); ctx.arc(rp + 14, badgeY + 16, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(240,240,240,0.85)"; ctx.font = "11px 'Share Tech Mono', monospace";
    ctx.fillText(`THREAT // ${attrs.threat}`, rp + 26, badgeY + 21);
    ctx.fillStyle = "rgba(240,240,240,0.55)"; ctx.font = "italic 14px 'Share Tech Mono', monospace";
    ctx.fillText(attrs.seal, rp, badgeY + 60);
    const bcY = CH - 80, bcH = 44;
    ctx.fillStyle = "#070707"; ctx.fillRect(10, bcY, CW - 20, bcH);
    let bx2 = 10; let isBr = true;
    for (const w of barsRef.current) {
      if (bx2 > CW) break;
      if (isBr) { const useRed = Math.random() < 0.07; ctx.fillStyle = useRed ? "rgba(255,0,60,0.9)" : "rgba(72,72,72,0.88)"; ctx.fillRect(bx2, bcY + 5, w, bcH - 10); }
      bx2 += w; isBr = !isBr;
    }
    ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(10, bcY); ctx.lineTo(CW - 10, bcY); ctx.stroke();
    const dataUrl = off.toDataURL("image/png");
    const filename = `madjacket_id_${name.replace(/\s+/g, "_").toLowerCase()}.png`;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    if (isIOS) { window.open(dataUrl, "_blank"); } else {
      const dl = document.createElement("a"); dl.download = filename; dl.href = dataUrl;
      document.body.appendChild(dl); dl.click(); document.body.removeChild(dl);
    }
  }

  // ── scannerOpen effect ─────────────────────────────────────────────────────
  useEffect(() => {
    if (scannerOpen) {
      setFrozenAttrs(null); frozenDataUrlRef.current = null;
      setIsFrozen(false);
      setLiveAttrs({ align: "—", threat: currentItem?.threat || "—", icon: "—", seal: '"..."', status: currentItem?.status || "SCANNING" });
      initBarcode(); barcodeOffsetRef.current = 0;
      animateBarcode(); startShifting();
    } else {
      stopShifting(); stopCamera(); stopBarcodeAnim();
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

  function handleClose() { stopShifting(); stopCamera(); stopBarcodeAnim(); closeScanner(); }
  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) { if (e.target === e.currentTarget) handleClose(); }

  const dateStr = new Date().toISOString().split("T")[0];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={`id-modal-backdrop${scannerOpen ? " open" : ""}`} onClick={handleBackdropClick}>
      <video
        ref={hiddenVideoRef}
        playsInline muted autoPlay={false}
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
                {/* red-filtered camera feed */}
                <canvas ref={canvasRef} width={480} height={480} className="id-photo-canvas" />

                {/* harekin overlay — sits on top, pointer-events none */}
                <canvas
                  ref={overlayRef}
                  width={480} height={480}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}
                />

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
              <div className="id-warn">{warnMsg}{!modelsReady && isStreaming ? " (loading models...)" : ""}</div>
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
