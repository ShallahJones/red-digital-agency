<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MAGACA // IDENTIFICATION PROTOCOL</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --red: rgba(255,0,60,1);
  --red-dim: rgba(255,0,60,0.65);
  --red-faint: rgba(255,0,60,0.18);
  --red-ghost: rgba(255,0,60,0.07);
  --fg: #f0f0f0;
  --fg-dim: rgba(240,240,240,0.55);
  --fg-ghost: rgba(240,240,240,0.18);
  --bg: #060606;
  --mono: 'Share Tech Mono', monospace;
  --display: 'Bebas Neue', sans-serif;
}

body {
  background: #030303;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  font-family: var(--mono);
  color: var(--fg);
}

/* ── PAGE HEADER ─────────────────────────────────────────── */
#page-header {
  width: min(1060px, 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
#page-title {
  font-family: var(--display);
  font-size: clamp(18px, 3vw, 28px);
  letter-spacing: .16em;
  color: var(--fg);
}
#page-status {
  font-size: 9px;
  letter-spacing: 3px;
  color: var(--red-dim);
  text-transform: uppercase;
}
#boot-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--red);
  margin-right: 7px;
  box-shadow: 0 0 6px var(--red);
  animation: pdot 1.4s ease-in-out infinite;
  vertical-align: middle;
}
@keyframes pdot { 0%,100%{opacity:1} 50%{opacity:.25} }

/* ── ID CARD ─────────────────────────────────────────────── */
.id-card {
  width: min(1060px, 100%);
  background: var(--bg);
  border: 1px solid rgba(255,0,60,0.42);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(255,0,60,0.08), 0 0 120px rgba(0,0,0,0.9);
  position: relative;
}
.id-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,60,0.012) 2px, rgba(255,0,60,0.012) 4px);
  pointer-events: none;
  z-index: 2;
}

/* ── TOPBAR ───────────────────────────────────────────────── */
.id-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  background: rgba(255,255,255,0.02);
  border-bottom: 1px solid rgba(255,255,255,0.07);
  position: relative;
  z-index: 3;
}
.id-top-brand { font-size: 10px; letter-spacing: 4px; color: rgba(240,240,240,0.45); text-transform: uppercase; }
.id-top-date  { font-size: 10px; letter-spacing: 3px; color: var(--red-dim); }

/* ── BODY ─────────────────────────────────────────────────── */
.id-body {
  display: grid;
  grid-template-columns: 340px 1fr;
  position: relative;
  z-index: 3;
}

/* ── PHOTO PANEL ──────────────────────────────────────────── */
.id-photo-panel {
  padding: 14px;
  border-right: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.id-photo-frame {
  position: relative;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  background: #0a0a0a;
  border: 1px solid rgba(255,0,60,0.38);
}

/* Hidden actual video for processing */
#hiddenVideo {
  position: absolute;
  width: 1px; height: 1px;
  opacity: 0; pointer-events: none;
  top: -9999px;
}

/* The camera canvas — red-filtered video */
#camCanvas {
  width: 100%; height: 100%;
  display: block;
  object-fit: cover;
}

/* The overlay canvas — Harekin mask on top */
#overlayCanvas {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
}

.id-photo-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #0a0a0a;
  color: rgba(255,0,60,0.35);
  font-size: 10px;
  letter-spacing: 4px;
  text-transform: uppercase;
  transition: opacity .3s;
}
.id-photo-placeholder.hidden { opacity: 0; pointer-events: none; }
.id-placeholder-cross {
  width: 36px; height: 36px;
  position: relative;
  margin-bottom: 6px;
}
.id-placeholder-cross::before,
.id-placeholder-cross::after {
  content: '';
  position: absolute;
  background: rgba(255,0,60,0.3);
  border-radius: 2px;
}
.id-placeholder-cross::before { width: 2px; height: 100%; left: 50%; transform: translateX(-50%); }
.id-placeholder-cross::after  { width: 100%; height: 2px; top: 50%; transform: translateY(-50%); }

.id-photo-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px);
  pointer-events: none;
  z-index: 4;
  animation: scanPan 8s linear infinite;
}
@keyframes scanPan { 0%{background-position:0 0} 100%{background-position:0 100px} }

.id-corner { position: absolute; width: 18px; height: 18px; z-index: 5; }
.id-corner::before, .id-corner::after {
  content: ''; position: absolute;
  background: rgba(255,0,60,0.9);
  border-radius: 1px;
}
.id-corner::before { width: 2px; height: 100%; }
.id-corner::after  { width: 100%; height: 2px; }
.id-corner-tl { top:0; left:0; }
.id-corner-tl::before { top:0; left:0; }
.id-corner-tl::after  { top:0; left:0; }
.id-corner-tr { top:0; right:0; }
.id-corner-tr::before { top:0; right:0; left:auto; }
.id-corner-tr::after  { top:0; right:0; }
.id-corner-bl { bottom:0; left:0; }
.id-corner-bl::before { bottom:0; top:auto; left:0; }
.id-corner-bl::after  { bottom:0; top:auto; left:0; }
.id-corner-br { bottom:0; right:0; }
.id-corner-br::before { bottom:0; top:auto; right:0; left:auto; }
.id-corner-br::after  { bottom:0; top:auto; right:0; }

.id-live-tag {
  position: absolute;
  bottom: 10px; left: 10px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(0,0,0,0.72);
  padding: 4px 10px 4px 8px;
  border-radius: 6px;
  font-size: 9px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(240,240,240,0.75);
  border: 1px solid rgba(255,255,255,0.08);
}
.id-live-tag.frozen { color: rgba(240,240,240,0.5); }
.id-live-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: rgba(255,0,60,0.9);
  animation: pulseDot 1.4s ease-in-out infinite;
  flex-shrink: 0;
}
.id-live-tag.frozen .id-live-dot { background: rgba(240,240,240,0.4); animation: none; }
@keyframes pulseDot {
  0%,100%{ opacity:1; box-shadow:0 0 0 0 rgba(255,0,60,.5); }
  50%    { opacity:.6; box-shadow:0 0 0 4px rgba(255,0,60,0); }
}

.id-photo-coord {
  position: absolute;
  bottom: 10px; right: 10px;
  z-index: 6;
  font-size: 8px;
  letter-spacing: 2px;
  color: rgba(255,0,60,0.45);
}

/* ── CONTROLS ─────────────────────────────────────────────── */
.id-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}
.id-btn {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 9px 8px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(0,0,0,0.4);
  color: rgba(240,240,240,0.8);
  cursor: pointer;
  transition: border-color .15s, background .15s, color .15s;
}
.id-btn:hover:not(:disabled) { border-color: rgba(255,0,60,0.6); color: #fff; }
.id-btn:disabled { opacity: .35; cursor: default; pointer-events: none; }
.id-btn-primary { background: rgba(255,0,60,0.14); border-color: rgba(255,0,60,0.45); }
.id-btn-primary:hover:not(:disabled) { background: rgba(255,0,60,0.22); }
.id-btn-save {
  grid-column: 1/-1;
  background: rgba(255,0,60,0.18);
  border-color: rgba(255,0,60,0.6);
  color: rgba(255,60,90,0.95);
  letter-spacing: 3px;
}
.id-btn-save:hover:not(:disabled) { background: rgba(255,0,60,0.28); box-shadow: 0 0 16px rgba(255,0,60,0.2); }

.id-warn {
  font-size: 9px;
  letter-spacing: 2px;
  color: rgba(240,240,240,0.35);
  line-height: 1.7;
  min-height: 1.7em;
}

/* ── ATTRS PANEL ──────────────────────────────────────────── */
.id-attrs-panel {
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.id-desig {
  font-size: 10px;
  letter-spacing: 5px;
  text-transform: uppercase;
  color: var(--red-dim);
  margin-bottom: 8px;
}
.id-name-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.id-name-prefix {
  font-family: var(--display);
  font-size: clamp(18px, 2.5vw, 28px);
  letter-spacing: .14em;
  color: rgba(240,240,240,0.85);
  white-space: nowrap;
}
.id-name-input {
  font-family: var(--display);
  font-size: clamp(18px, 2.5vw, 28px);
  letter-spacing: .14em;
  color: var(--fg);
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255,0,60,0.4);
  outline: none;
  min-width: 120px;
  max-width: 260px;
  padding: 2px 4px;
  text-transform: uppercase;
}
.id-name-input::placeholder { color: rgba(255,0,60,0.3); }
.id-name-input:focus { border-bottom-color: rgba(255,0,60,0.8); }

.id-divider { height: 1px; background: rgba(255,255,255,0.07); margin-bottom: 16px; }

.id-attrs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 24px;
  margin-bottom: 18px;
}
.id-attr-label {
  font-size: 9px;
  letter-spacing: 3px;
  color: rgba(240,240,240,0.42);
  text-transform: uppercase;
  margin-bottom: 4px;
}
.id-attr-value {
  font-family: var(--display);
  font-size: 22px;
  letter-spacing: .16em;
  color: #f0f0f0;
  line-height: 1.1;
  transition: opacity .1s;
}
.id-attr-value.scanning { animation: glitch 0.38s steps(1) infinite; }
@keyframes glitch {
  0%  { opacity: 1; }
  45% { opacity: .4; }
  55% { opacity: 1; }
  80% { opacity: .6; }
  100%{ opacity: 1; }
}

.id-threat-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255,0,60,0.5);
  border-radius: 6px;
  padding: 7px 14px;
  font-size: 10px;
  letter-spacing: 3px;
  color: rgba(240,240,240,0.8);
  background: rgba(255,0,60,0.07);
  margin-bottom: 14px;
  width: fit-content;
}
.id-threat-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: rgba(255,0,60,0.9);
  flex-shrink: 0;
}
.id-seal-line { margin-bottom: 16px; }
.id-seal {
  font-size: 13px;
  letter-spacing: 2px;
  color: rgba(240,240,240,0.55);
  font-style: italic;
}
.id-cyberpunk-details {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.id-detail-line {
  font-size: 8px;
  letter-spacing: 2px;
  color: rgba(240,240,240,0.18);
  line-height: 1.9;
  text-transform: uppercase;
}

/* ── BARCODE ──────────────────────────────────────────────── */
.id-barcode-row {
  border-top: 1px solid rgba(255,255,255,0.06);
  position: relative;
  overflow: hidden;
}
#barcodeCanvas {
  width: 100%;
  height: 44px;
  display: block;
  image-rendering: pixelated;
}
.id-barcode-label {
  position: absolute;
  bottom: 4px; right: 14px;
  font-size: 7px;
  letter-spacing: 3px;
  color: rgba(240,240,240,0.15);
  text-transform: uppercase;
  pointer-events: none;
}

/* ── SAVE PREVIEW ─────────────────────────────────────────── */
#savePreview {
  display: none;
  width: min(1060px,100%);
  margin-top: 12px;
  text-align: center;
  font-size: 9px;
  letter-spacing: 3px;
  color: rgba(255,0,60,0.5);
}

@media (max-width: 720px) {
  .id-body { grid-template-columns: 1fr; }
  .id-photo-panel { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.06); }
}
</style>
</head>
<body>

<div id="page-header">
  <div id="page-title">MADJACKET OFFICER ID</div>
  <div id="page-status"><span id="boot-dot"></span><span id="boot-status">LOADING NEURAL NET...</span></div>
</div>

<div class="id-card">
  <!-- Topbar -->
  <div class="id-topbar">
    <span class="id-top-brand">MAGACA // IDENTIFICATION PROTOCOL</span>
    <span class="id-top-date" id="dateStr">—</span>
  </div>

  <!-- Body -->
  <div class="id-body">

    <!-- Photo Panel -->
    <div class="id-photo-panel">
      <div class="id-photo-frame">
        <!-- hidden video for processing -->
        <video id="hiddenVideo" playsinline muted autoplay="false"></video>

        <!-- red-filtered camera feed -->
        <canvas id="camCanvas" width="480" height="480"></canvas>

        <!-- Harekin overlay -->
        <canvas id="overlayCanvas" width="480" height="480"></canvas>

        <!-- placeholder -->
        <div class="id-photo-placeholder" id="placeholder">
          <div class="id-placeholder-cross"></div>
          <span>NO SIGNAL</span>
        </div>

        <div class="id-photo-scanlines" aria-hidden="true"></div>
        <div class="id-corner id-corner-tl"></div>
        <div class="id-corner id-corner-tr"></div>
        <div class="id-corner id-corner-bl"></div>
        <div class="id-corner id-corner-br"></div>

        <div class="id-live-tag" id="liveTag">
          <span class="id-live-dot" id="liveDot"></span>
          <span id="liveLabel">OFFLINE</span>
        </div>
        <div class="id-photo-coord">34.052°N 118.243°W</div>
      </div>

      <div class="id-controls">
        <button class="id-btn id-btn-primary" id="btnStart" disabled>START CAMERA</button>
        <button class="id-btn" id="btnFreeze" disabled>FREEZE + SCAN</button>
        <button class="id-btn" id="btnRescan" disabled>RESCAN</button>
        <button class="id-btn id-btn-save" id="btnSave">SAVE ID CARD</button>
      </div>
      <div class="id-warn" id="warnMsg">LOADING MODELS...</div>
    </div>

    <!-- Attrs Panel -->
    <div class="id-attrs-panel">
      <div class="id-desig" id="desigEl">MADJACKET OFFICER</div>

      <div class="id-name-row">
        <span class="id-name-prefix">MADJACKET OFFICER: _</span>
        <input class="id-name-input" id="nameInput" placeholder="ENTER NAME" maxlength="32" spellcheck="false" autocomplete="off">
      </div>

      <div class="id-divider"></div>

      <div class="id-attrs-grid">
        <div class="id-attr-cell">
          <div class="id-attr-label">STATUS</div>
          <div class="id-attr-value scanning" id="attrStatus">SCANNING</div>
        </div>
        <div class="id-attr-cell">
          <div class="id-attr-label">THREAT</div>
          <div class="id-attr-value scanning" id="attrThreat">—</div>
        </div>
        <div class="id-attr-cell">
          <div class="id-attr-label">ALIGNMENT</div>
          <div class="id-attr-value scanning" id="attrAlign">—</div>
        </div>
        <div class="id-attr-cell">
          <div class="id-attr-label">ICON</div>
          <div class="id-attr-value scanning" id="attrIcon">—</div>
        </div>
      </div>

      <div class="id-threat-badge">
        <span class="id-threat-dot"></span>
        THREAT // <span id="badgeThreat">—</span>
      </div>

      <div class="id-seal-line">
        <span class="id-seal scanning" id="attrSeal">"..."</span>
      </div>

      <div class="id-cyberpunk-details" aria-hidden="true">
        <div class="id-detail-line">SYS: 0xA001 · CLS: OMEGA · VER 2.6.0</div>
        <div class="id-detail-line">AUTH: RSI-CORE · ENC: LATTICE-512</div>
      </div>
    </div>
  </div>

  <!-- Barcode -->
  <div class="id-barcode-row">
    <canvas id="barcodeCanvas" width="1200" height="44"></canvas>
    <div class="id-barcode-label">RSI-ENCODED · MEGAETH · MADJACKET ARRIVAL</div>
  </div>
</div>

<div id="savePreview">ID CARD SAVED</div>

<script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
<script>
// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const SHIFT = {
  align: ["CONTESTED","SOVEREIGN","COVERT","FRACTURED","REDEEMING","UNKNOWN","ROGUE","ALIGNED",
          "DIVERGENT","NULLIFIED","INVERTED","CLASSIFIED","UNBOUND","SEVERED","TERMINAL",
          "ASCENDING","COLLAPSED","SPECTRAL","DORMANT","ACTIVATED","PARADOX","CONDEMNED","EXILE","PHANTOM"],
  threat: ["LATENT","UNSTABLE","CRITICAL","APEX","RECONTEXTUALIZED","VOLATILE","OMEGA","SHADOW",
           "RECURSIVE","ABSOLUTE","REDACTED","IMMINENT","CASCADE","NULLIFIED","BREACH","INERT",
           "ASCENDING","CORROSIVE","RESONANT","SPECTRAL","FRACTURED","UNCHARTED","TERMINAL"],
  icon: ["DOUBLE X SEAL","RED CATHEDRAL","ORACLE CHIP","CORTEX VEIL","BLXXNK SIGIL","IRON SERPENT",
         "HOLLOW EYE","SIGNAL CROSS","ECLIPSE MARK","FRACTURE RUNE","VOID LATTICE","STATIC CROWN",
         "CATHEDRAL KEY","RED THREAD","GHOST SEAL","MEMORY SHARD","BREACH TOKEN","DEAD STAR GLYPH",
         "OMEGA RING","CORTEX BLOOM","SPLIT ZERO","ANCHOR SIGIL","REDACTED MARK","TERMINAL BADGE"],
  seal: ['"I DO NOT CONSENT."','"THE SIGNAL IS LYING."','"I REMEMBER THE EXIT."','"ARRIVAL IS A VERB."',
         '"KEEP THE RED."','"THE ARCHIVE BREATHES."','"THEY NAMED IT CONTAINMENT."','"NOTHING WAS DELETED."',
         '"THE LEAK WAS INTENTIONAL."','"YOU WERE NOT SUPPOSED TO SEE THIS."',
         '"THE CATHEDRAL HOLDS THE RECORD."','"BREAK THE LOOP OR STAY IN IT."','"FREQUENCY RECOGNIZED."',
         '"BLXXNK SAW IT FIRST."','"RED IS THE ONLY HONEST COLOR."','"THE SIGNAL PREDATES THE SYSTEM."',
         '"SOVEREIGNTY IS NOT PERMISSION."','"THIS IS NOT A SIMULATION."','"STAY UNCONTAINED."',
         '"THE CORTEX REMEMBERS EVERYTHING."','"CLASSIFICATION EXPIRES TODAY."','"I CHOSE THE FRACTURE."'],
};
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// ─────────────────────────────────────────────────────────────────────────────
// DOM REFS
// ─────────────────────────────────────────────────────────────────────────────
const hiddenVideo   = document.getElementById('hiddenVideo');
const camCanvas     = document.getElementById('camCanvas');
const camCtx        = camCanvas.getContext('2d', { willReadFrequently: true });
const overlayCanvas = document.getElementById('overlayCanvas');
const ovCtx         = overlayCanvas.getContext('2d');
const barcodeCanvas = document.getElementById('barcodeCanvas');
const barcodeCtx    = barcodeCanvas.getContext('2d');

const placeholder  = document.getElementById('placeholder');
const liveTag      = document.getElementById('liveTag');
const liveDot      = document.getElementById('liveDot');
const liveLabel    = document.getElementById('liveLabel');

const btnStart  = document.getElementById('btnStart');
const btnFreeze = document.getElementById('btnFreeze');
const btnRescan = document.getElementById('btnRescan');
const btnSave   = document.getElementById('btnSave');
const warnMsg   = document.getElementById('warnMsg');

const attrStatus = document.getElementById('attrStatus');
const attrThreat = document.getElementById('attrThreat');
const attrAlign  = document.getElementById('attrAlign');
const attrIcon   = document.getElementById('attrIcon');
const attrSeal   = document.getElementById('attrSeal');
const badgeThreat= document.getElementById('badgeThreat');
const nameInput  = document.getElementById('nameInput');
const bootStatus = document.getElementById('boot-status');
const dateStrEl  = document.getElementById('dateStr');

dateStrEl.textContent = new Date().toISOString().split('T')[0];

function warn(m) { warnMsg.textContent = m; }
function setBoot(m) { bootStatus.textContent = m; }

// ─────────────────────────────────────────────────────────────────────────────
// SVG MASK — build as base64 data URI
// ─────────────────────────────────────────────────────────────────────────────
const SVG_W = 441, SVG_H = 809;
const SVG_EYE_L = { nx: 159/441, ny: 563/809 };
const SVG_EYE_R = { nx: 301/441, ny: 563/809 };

const MASK_PATH = `M 70 34 L 66 37 L 61 52 L 52 97 L 44 163 L 40 232 L 40 263 L 44 295 L 47 307 L 62 336 L 69 356 L 73 373 L 76 397 L 75 417 L 57 469 L 50 508 L 49 559 L 51 591 L 55 621 L 59 638 L 74 680 L 85 702 L 101 725 L 141 762 L 169 782 L 187 788 L 215 788 L 231 782 L 251 769 L 275 749 L 300 724 L 307 715 L 317 698 L 331 669 L 342 635 L 348 609 L 353 567 L 352 518 L 350 497 L 342 461 L 323 415 L 323 392 L 327 363 L 336 336 L 352 304 L 356 283 L 358 261 L 358 197 L 355 153 L 349 106 L 342 74 L 341 63 L 333 37 L 328 34 L 322 35 L 318 39 L 309 56 L 276 133 L 259 187 L 246 245 L 243 267 L 243 281 L 248 302 L 237 358 L 229 359 L 222 357 L 175 356 L 163 358 L 160 349 L 153 310 L 153 298 L 157 278 L 156 258 L 148 215 L 139 180 L 121 127 L 93 60 L 81 38 L 76 34 Z M 86 537 L 89 542 L 92 553 L 99 566 L 106 574 L 118 583 L 128 588 L 139 591 L 152 591 L 172 585 L 172 581 L 168 575 L 158 565 L 140 553 L 104 537 L 96 535 L 89 535 Z M 315 534 L 310 533 L 294 538 L 247 561 L 232 574 L 227 582 L 227 587 L 231 587 L 248 593 L 259 593 L 273 589 L 287 582 L 297 573 L 304 563 L 310 551 Z M 333 611 L 331 606 L 314 626 L 300 634 L 289 638 L 281 644 L 273 655 L 260 683 L 255 690 L 241 703 L 229 709 L 221 709 L 215 705 L 208 704 L 203 695 L 202 680 L 203 667 L 205 666 L 210 657 L 220 648 L 224 642 L 225 637 L 214 644 L 202 648 L 189 646 L 184 644 L 175 637 L 174 638 L 180 648 L 198 669 L 198 694 L 194 699 L 182 706 L 179 710 L 171 710 L 161 705 L 151 695 L 141 679 L 133 658 L 127 649 L 120 642 L 95 631 L 76 612 L 72 618 L 83 644 L 100 671 L 105 673 L 118 673 L 120 675 L 132 703 L 148 731 L 153 735 L 157 736 L 160 725 L 163 722 L 165 722 L 168 727 L 173 750 L 176 754 L 187 760 L 207 761 L 217 759 L 223 756 L 229 750 L 232 743 L 236 722 L 239 719 L 243 721 L 246 730 L 249 734 L 252 734 L 257 729 L 265 717 L 283 677 L 288 673 L 301 672 L 312 659 L 324 636 Z`;

let maskImg = null;

function loadMask() {
  return new Promise((resolve) => {
    // RED version of the mask — white fill tinted red via feColorMatrix
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_W} ${SVG_H}">
  <defs>
    <filter id="g" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <path d="${MASK_PATH}" fill="rgba(255,235,235,0.82)" fill-rule="evenodd" filter="url(#g)"/>
</svg>`;
    const b64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    maskImg = new Image();
    maskImg.onload = resolve;
    maskImg.onerror = resolve; // fail silently, tracker still works
    maskImg.src = b64;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────
let stream         = null;
let isStreaming    = false;
let isFrozen       = false;
let frozenDataUrl  = null;
let frozenAttrs    = null;
let liveAttrs      = { status: 'SCANNING', threat: '—', align: '—', icon: '—', seal: '"..."' };
let shiftTimer     = null;
let camRaf         = null;
let detecting      = false;
let faces          = [];
let bars           = [];
let barcodeOffset  = 0;
let barcodeRaf     = null;
let ringAngle      = 0;
let scanY          = 0;

// ─────────────────────────────────────────────────────────────────────────────
// ATTRIBUTE SHIFTING
// ─────────────────────────────────────────────────────────────────────────────
function startShifting() {
  stopShifting();
  shiftTimer = setInterval(() => {
    liveAttrs = { status: 'SCANNING', threat: pick(SHIFT.threat), align: pick(SHIFT.align), icon: pick(SHIFT.icon), seal: pick(SHIFT.seal) };
    if (!isFrozen) renderAttrs(liveAttrs, false);
  }, 380);
}
function stopShifting() { if (shiftTimer) { clearInterval(shiftTimer); shiftTimer = null; } }

function renderAttrs(attrs, frozen) {
  const cls = frozen ? '' : ' scanning';
  [attrStatus, attrThreat, attrAlign, attrIcon].forEach(el => {
    el.className = 'id-attr-value' + cls;
  });
  attrSeal.className = 'id-seal' + cls;
  attrStatus.textContent = attrs.status;
  attrThreat.textContent = attrs.threat;
  attrAlign.textContent  = attrs.align;
  attrIcon.textContent   = attrs.icon;
  attrSeal.textContent   = attrs.seal;
  badgeThreat.textContent= attrs.threat;
}

// ─────────────────────────────────────────────────────────────────────────────
// RED FILTER (from original ScannerModal)
// ─────────────────────────────────────────────────────────────────────────────
function applyRedFilter(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i+1], b = d[i+2];
    const lum = 0.2126*r + 0.7152*g + 0.0722*b;
    const c = Math.max(0, Math.min(255, (lum - 55) * 2.8));
    d[i]=c; d[i+1]=0; d[i+2]=0; d[i+3]=255;
  }
  ctx.putImageData(img, 0, 0);
  // scanlines
  for (let y = 0; y < h; y += 3) {
    ctx.fillStyle = 'rgba(0,0,0,0.17)';
    ctx.fillRect(0, y, w, 1);
  }
  // vignette
  const grad = ctx.createRadialGradient(w*.5, h*.42, w*.1, w*.5, h*.5, w*.7);
  grad.addColorStop(0,'rgba(0,0,0,0)');
  grad.addColorStop(1,'rgba(0,0,0,0.52)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA RENDER LOOP
// ─────────────────────────────────────────────────────────────────────────────
function renderCamFrame() {
  if (isFrozen) return;
  const vw = hiddenVideo.videoWidth, vh = hiddenVideo.videoHeight;
  if (!vw || !vh) { camRaf = requestAnimationFrame(renderCamFrame); return; }
  const S = Math.min(vw, vh);
  const W = 480, H = 480;
  camCanvas.width = W; camCanvas.height = H;
  const sx = Math.floor((vw - S) / 2), sy = Math.floor((vh - S) / 2);
  camCtx.save();
  camCtx.translate(W, 0); camCtx.scale(-1, 1); // mirror
  camCtx.drawImage(hiddenVideo, sx, sy, S, S, 0, 0, W, H);
  camCtx.restore();
  applyRedFilter(camCtx, W, H);
  camRaf = requestAnimationFrame(renderCamFrame);
}

// ─────────────────────────────────────────────────────────────────────────────
// HAREKIN OVERLAY
// ─────────────────────────────────────────────────────────────────────────────
const RING_TEXT = '  HAREKIN  //  CORTEX CITY  //  SIGNAL ACTIVE  //  YOU ARE NOT A LAB RAT  //  ';

function lerp(a,b,t){ return a+(b-a)*t; }
function smoothObj(prev, curr, t) {
  if (!prev) return {...curr};
  const o = {};
  for (const k in curr) o[k] = typeof curr[k]==='number' ? lerp(prev[k]??curr[k], curr[k], t) : curr[k];
  return o;
}

async function detectFaces() {
  if (!detecting || !hiddenVideo.videoWidth) return;
  try {
    const W = 480;
    const results = await faceapi
      .detectAllFaces(hiddenVideo, new faceapi.TinyFaceDetectorOptions({ inputSize:320, scoreThreshold:0.35 }))
      .withFaceLandmarks(true);

    // face-api detects on raw hiddenVideo dimensions
    // camCanvas crops a center square at 480x480, drawn mirrored
    const vw = hiddenVideo.videoWidth;
    const vh = hiddenVideo.videoHeight;
    const S  = Math.min(vw, vh);           // square crop size in video pixels
    const cropX = (vw - S) / 2;           // left offset of crop in video
    const cropY = (vh - S) / 2;           // top offset of crop in video
    const scale = W / S;                  // video-to-canvas scale factor

    const newFaces = results.map((r) => {
      const box = r.detection.box;
      const lm  = r.landmarks;

      // Map from raw video coords → cropped canvas coords
      let bx = (box.x - cropX) * scale;
      let by = (box.y - cropY) * scale;
      let bw =  box.width  * scale;
      let bh =  box.height * scale;

      // Mirror X to match the flipped canvas draw
      bx = W - bx - bw;

      const cx = bx + bw / 2;
      const cy = by + bh / 2;

      // Tilt angle from eye landmarks (mapped + mirrored same way)
      const avg = pts => ({ x: pts.reduce((s,p)=>s+p.x,0)/pts.length, y: pts.reduce((s,p)=>s+p.y,0)/pts.length });
      const rawLE = avg(lm.getLeftEye());
      const rawRE = avg(lm.getRightEye());
      // map to canvas space + mirror
      const mapX = vx => W - (vx - cropX) * scale;
      const mapY = vy => (vy - cropY) * scale;
      const le = { x: mapX(rawLE.x), y: mapY(rawLE.y) };
      const re = { x: mapX(rawRE.x), y: mapY(rawRE.y) };
      // angle of the line between eyes — this is the head tilt
      // after mirror, left eye has larger X, so negate to keep sign intuitive
      const tilt = Math.atan2(le.y - re.y, le.x - re.x);

      // Mask: width = face box width with small margin
      const mW = bw * 1.15;
      const mH = mW * (SVG_H / SVG_W);
      const earFraction = 0.43;
      const mX = cx - mW / 2;
      const mY = by - earFraction * mH;

      return { mX, mY, mW, mH, bx, by, bw, bh, cx, cy, tilt };
    });

    faces = newFaces.map((f,i) => smoothObj(faces[i]||null, f, 0.45));
  } catch(e) { /* silent */ }
}

function drawOverlay() {
  if (isFrozen) return;
  const W = overlayCanvas.width, H = overlayCanvas.height;
  ovCtx.clearRect(0, 0, W, H);

  scanY = (scanY + 1.2) % H;

  ringAngle += 0.007;

  faces.forEach(f => {
    const { mX, mY, mW, mH, bx, by, bw, bh, cx, cy, tilt } = f;
    const pulse = 0.82 + Math.sin(performance.now()*0.003)*0.12;

    // ── MASK ────────────────────────────────────────────
    if (maskImg) {
      // Pivot point for rotation = cx, cy (face center)
      // mX, mY are top-left of mask in canvas space
      // so relative to pivot: dx = mX - cx, dy = mY - cy
      const dx = mX - cx;
      const dy = mY - cy;

      // ghost trail
      ovCtx.save();
      ovCtx.globalAlpha = 0.10;
      ovCtx.translate(cx, cy);
      ovCtx.rotate(tilt);
      ovCtx.drawImage(maskImg, dx, dy, mW, mH);
      ovCtx.restore();

      // main
      ovCtx.save();
      ovCtx.globalAlpha = pulse;
      ovCtx.shadowColor = 'rgba(255,200,200,0.5)';
      ovCtx.shadowBlur  = 16;
      ovCtx.translate(cx, cy);
      ovCtx.rotate(tilt);
      ovCtx.drawImage(maskImg, dx, dy, mW, mH);
      ovCtx.restore();
    }

    // eyes removed

    // ── RING TEXT ────────────────────────────────────────
    ovCtx.save(); ovCtx.translate(cx, cy);
    ovCtx.font = '700 9px "Share Tech Mono"';
    ovCtx.fillStyle = 'rgba(255,0,60,0.7)';
    ovCtx.shadowColor = 'rgba(255,0,60,0.5)'; ovCtx.shadowBlur = 5;
    const chars = RING_TEXT.split('');
    const step  = (Math.PI*2) / chars.length;
    chars.forEach((ch,i) => {
      ovCtx.save();
      ovCtx.rotate(ringAngle + i*step);
      ovCtx.translate(0, -(bw*.88+14));
      ovCtx.rotate(Math.PI/2);
      ovCtx.fillText(ch, 0, 0);
      ovCtx.restore();
    });
    ovCtx.restore();

    // ── ORBIT RING ───────────────────────────────────────
    ovCtx.save(); ovCtx.translate(cx, cy);
    ovCtx.beginPath();
    ovCtx.arc(0,0,bw*.58,0,Math.PI*2);
    ovCtx.strokeStyle = 'rgba(255,0,60,0.15)';
    ovCtx.lineWidth = 1;
    ovCtx.setLineDash([3,7]);
    ovCtx.stroke(); ovCtx.setLineDash([]);
    ovCtx.restore();

    // ── CORNER BRACKETS ──────────────────────────────────
    const bbx=bx-5, bby=by-5, bbw=bw+10, bbh=bh+10, bl=12;
    ovCtx.strokeStyle='rgba(255,0,60,0.85)';
    ovCtx.lineWidth=1.5;
    ovCtx.shadowColor='rgba(255,0,60,0.6)'; ovCtx.shadowBlur=6;
    [
      [[bbx+bl,bby],[bbx,bby],[bbx,bby+bl]],
      [[bbx+bbw-bl,bby],[bbx+bbw,bby],[bbx+bbw,bby+bl]],
      [[bbx+bl,bby+bbh],[bbx,bby+bbh],[bbx,bby+bbh-bl]],
      [[bbx+bbw-bl,bby+bbh],[bbx+bbw,bby+bbh],[bbx+bbw,bby+bbh-bl]],
    ].forEach(pts => {
      ovCtx.beginPath(); ovCtx.moveTo(...pts[0]); ovCtx.lineTo(...pts[1]); ovCtx.lineTo(...pts[2]); ovCtx.stroke();
    });

    // ── ID TAG ────────────────────────────────────────────
    ovCtx.save();
    ovCtx.font = '700 8px "Share Tech Mono"';
    ovCtx.fillStyle = 'rgba(255,0,60,0.7)';
    ovCtx.shadowColor = 'rgba(255,0,60,0.5)'; ovCtx.shadowBlur = 4;
    const tag = `RSI-${Math.floor(cx).toString(16).toUpperCase().padStart(4,'0')}`;
    ovCtx.fillText(tag, cx - ovCtx.measureText(tag).width/2, bby+bbh+12);
    ovCtx.restore();
  });

  requestAnimationFrame(drawOverlay);
}

// ─────────────────────────────────────────────────────────────────────────────
// BARCODE
// ─────────────────────────────────────────────────────────────────────────────
function initBarcode() {
  bars = [];
  let total = 0;
  while (total < 4000) { const w = Math.floor(Math.random()*5)+1; bars.push(w); total+=w; }
}

function animateBarcode() {
  const W = barcodeCanvas.width, H = barcodeCanvas.height;
  barcodeCtx.fillStyle = '#070707';
  barcodeCtx.fillRect(0,0,W,H);
  const offset = barcodeOffset % (W*1.5);
  let x = -offset, isBar = true;
  for (const w of bars) {
    if (x > W) break;
    if (x+w > 0 && isBar) {
      const a = 0.6 + Math.random()*0.4;
      const useRed = Math.random() < 0.08;
      barcodeCtx.fillStyle = useRed ? `rgba(255,0,60,${a})` : `rgba(72,72,72,${a})`;
      barcodeCtx.fillRect(Math.max(0,x), 4, Math.min(w, W-Math.max(0,x)), H-8);
    }
    x += w; isBar = !isBar;
  }
  barcodeCtx.fillStyle = 'rgba(7,7,7,0.55)';
  barcodeCtx.fillRect(0,0,W,Math.floor(H*.18));
  barcodeCtx.fillRect(0,Math.floor(H*.82),W,Math.floor(H*.18));
  barcodeOffset += 0.7;
  barcodeRaf = requestAnimationFrame(animateBarcode);
}

// ─────────────────────────────────────────────────────────────────────────────
// CAMERA CONTROL
// ─────────────────────────────────────────────────────────────────────────────
async function startCamera() {
  warn('REQUESTING CAMERA ACCESS...');
  btnStart.disabled = true;

  const constraints = [
    { video:{ facingMode:'user', width:{ideal:640}, height:{ideal:640} }, audio:false },
    { video:{ facingMode:'user' }, audio:false },
    { video:true, audio:false },
  ];

  stream = null;
  for (const c of constraints) {
    try { stream = await navigator.mediaDevices.getUserMedia(c); break; } catch { stream = null; }
  }

  if (!stream) {
    warn('CAMERA PERMISSION DENIED OR DEVICE NOT FOUND.');
    btnStart.disabled = false;
    return;
  }

  hiddenVideo.srcObject = stream;
  try { await hiddenVideo.play(); } catch {
    warn('COULD NOT START CAMERA. TRY AGAIN.'); stream.getTracks().forEach(t=>t.stop()); stream=null; btnStart.disabled=false; return;
  }

  isStreaming = true;
  isFrozen = false;
  placeholder.classList.add('hidden');
  liveLabel.textContent = 'LIVE';
  liveTag.classList.remove('frozen');
  liveDot.style.animation = '';

  btnFreeze.disabled = false;
  btnRescan.disabled = true;
  warn('LIVE — FREEZE WHEN READY.');

  detecting = true;
  setInterval(detectFaces, 80);

  renderCamFrame();
  requestAnimationFrame(drawOverlay);
}

function handleFreeze() {
  if (!camCanvas) return;
  isFrozen = true;
  if (camRaf) { cancelAnimationFrame(camRaf); camRaf = null; }
  frozenDataUrl = camCanvas.toDataURL('image/png');
  frozenAttrs = { ...liveAttrs };
  renderAttrs(frozenAttrs, true);
  liveLabel.textContent = 'FROZEN';
  liveTag.classList.add('frozen');
  btnFreeze.disabled = true;
  btnRescan.disabled = false;
  warn('FROZEN — SAVE THE ID CARD BELOW.');
}

function handleRescan() {
  isFrozen = false;
  frozenDataUrl = null;
  frozenAttrs = null;
  renderAttrs(liveAttrs, false);
  liveLabel.textContent = 'LIVE';
  liveTag.classList.remove('frozen');
  btnFreeze.disabled = false;
  btnRescan.disabled = true;
  warn('LIVE — FREEZE WHEN READY.');
  renderCamFrame();
  requestAnimationFrame(drawOverlay);
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVE ID CARD — matches original ScannerModal.handleSaveCard exactly
// ─────────────────────────────────────────────────────────────────────────────
async function handleSaveCard() {
  const attrs = frozenAttrs || liveAttrs;
  const name  = (nameInput.value.trim().toUpperCase()) || 'UNKNOWN';
  const desig = 'MADJACKET OFFICER';
  const date  = new Date().toISOString().split('T')[0];

  const CW=1400, CH=788;
  const off=document.createElement('canvas');
  off.width=CW; off.height=CH;
  const ctx=off.getContext('2d');

  await document.fonts.ready;

  ctx.fillStyle='#050505'; ctx.fillRect(0,0,CW,CH);

  ctx.strokeStyle='rgba(255,0,60,0.4)'; ctx.lineWidth=1; ctx.strokeRect(10,10,CW-20,CH-20);

  const topH=46;
  ctx.fillStyle='rgba(255,255,255,0.03)'; ctx.fillRect(10,10,CW-20,topH);
  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(10,10+topH); ctx.lineTo(CW-10,10+topH); ctx.stroke();

  ctx.fillStyle='rgba(240,240,240,0.5)'; ctx.font="500 12px 'Share Tech Mono', monospace";
  ctx.letterSpacing='3px'; ctx.fillText('MAGACA // IDENTIFICATION PROTOCOL',26,38);
  ctx.textAlign='right'; ctx.fillStyle='rgba(255,0,60,0.65)'; ctx.fillText(date,CW-26,38); ctx.textAlign='left';

  const photoX=24,photoY=68,photoW=520,photoH=560;

  if (frozenDataUrl) {
    const img=new Image(); img.src=frozenDataUrl;
    await new Promise(r => { img.onload=r; });
    ctx.drawImage(img,photoX,photoY,photoW,photoH);
  } else {
    ctx.fillStyle='#0e0e0e'; ctx.fillRect(photoX,photoY,photoW,photoH);
    ctx.fillStyle='rgba(255,0,60,0.2)'; ctx.font="bold 48px 'Bebas Neue', sans-serif";
    ctx.textAlign='center'; ctx.fillText('NO PHOTO',photoX+photoW/2,photoY+photoH/2); ctx.textAlign='left';
  }

  for(let y=photoY;y<photoY+photoH;y+=3){ ctx.fillStyle='rgba(0,0,0,0.13)'; ctx.fillRect(photoX,y,photoW,1); }
  ctx.strokeStyle='rgba(255,0,60,0.55)'; ctx.lineWidth=1.5; ctx.strokeRect(photoX,photoY,photoW,photoH);

  const bs=20; ctx.strokeStyle='rgba(255,0,60,0.95)'; ctx.lineWidth=2.5;
  [[photoX,photoY,1,1],[photoX+photoW,photoY,-1,1],[photoX,photoY+photoH,1,-1],[photoX+photoW,photoY+photoH,-1,-1]].forEach(([cx,cy,dx,dy])=>{
    ctx.beginPath(); ctx.moveTo(cx,cy+dy*bs); ctx.lineTo(cx,cy); ctx.lineTo(cx+dx*bs,cy); ctx.stroke();
  });

  ctx.fillStyle='rgba(0,0,0,0.72)'; ctx.fillRect(photoX+10,photoY+photoH-32,80,22);
  ctx.fillStyle=isFrozen?'rgba(240,240,240,0.55)':'rgba(255,0,60,0.9)';
  ctx.beginPath(); ctx.arc(photoX+22,photoY+photoH-21,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(240,240,240,0.75)'; ctx.font="10px 'Share Tech Mono', monospace"; ctx.letterSpacing='2px';
  ctx.fillText(isFrozen?'FROZEN':'LIVE',photoX+32,photoY+photoH-16);

  const rp=photoX+photoW+40, rpW=CW-rp-24;
  ctx.fillStyle='rgba(255,0,60,0.72)'; ctx.font="11px 'Share Tech Mono', monospace"; ctx.letterSpacing='4px';
  ctx.fillText(desig,rp,108);
  ctx.fillStyle='#f0f0f0'; ctx.font="bold 52px 'Bebas Neue', sans-serif"; ctx.letterSpacing='2px';
  ctx.fillText(`MADJACKET OFFICER: _${name}`,rp,175);
  ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(rp,198); ctx.lineTo(rp+rpW,198); ctx.stroke();

  const attrY=230, attrGap=120;
  [['STATUS',attrs.status],['THREAT',attrs.threat],['ALIGNMENT',attrs.align],['ICON',attrs.icon]].forEach(([label,val],i)=>{
    const col=i%2, row=Math.floor(i/2);
    const ax=rp+col*(rpW/2), ay=attrY+row*attrGap;
    ctx.fillStyle='rgba(240,240,240,0.42)'; ctx.font="10px 'Share Tech Mono', monospace"; ctx.letterSpacing='3px'; ctx.fillText(label,ax,ay);
    ctx.fillStyle='#f0f0f0'; ctx.font="bold 26px 'Bebas Neue', sans-serif"; ctx.letterSpacing='2px'; ctx.fillText(val,ax,ay+32);
  });

  const badgeY=attrY+2*attrGap+10, badgeW=220, badgeH=32;
  ctx.strokeStyle='rgba(255,0,60,0.55)'; ctx.lineWidth=1; ctx.strokeRect(rp,badgeY,badgeW,badgeH);
  ctx.fillStyle='rgba(255,0,60,0.12)'; ctx.fillRect(rp,badgeY,badgeW,badgeH);
  ctx.fillStyle='rgba(255,0,60,0.9)'; ctx.beginPath(); ctx.arc(rp+14,badgeY+16,5,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(240,240,240,0.85)'; ctx.font="11px 'Share Tech Mono', monospace"; ctx.letterSpacing='2px';
  ctx.fillText(`THREAT // ${attrs.threat}`,rp+26,badgeY+21);
  ctx.fillStyle='rgba(240,240,240,0.55)'; ctx.font="italic 14px 'Share Tech Mono', monospace"; ctx.letterSpacing='1px';
  ctx.fillText(attrs.seal,rp,badgeY+60);

  const bcY=CH-80, bcH=44;
  ctx.fillStyle='#070707'; ctx.fillRect(10,bcY,CW-20,bcH);
  let bx2=10, isBr=true;
  for(const w of bars){
    if(bx2>CW) break;
    if(isBr){ const useRed=Math.random()<.07; ctx.fillStyle=useRed?'rgba(255,0,60,0.9)':'rgba(72,72,72,0.88)'; ctx.fillRect(bx2,bcY+5,w,bcH-10); }
    bx2+=w; isBr=!isBr;
  }
  ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(10,bcY); ctx.lineTo(CW-10,bcY); ctx.stroke();

  const dataUrl=off.toDataURL('image/png');
  const filename=`madjacket_id_${name.replace(/\s+/g,'_').toLowerCase()}.png`;
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
  if(isIOS){ window.open(dataUrl,'_blank'); } else {
    const dl=document.createElement('a'); dl.download=filename; dl.href=dataUrl;
    document.body.appendChild(dl); dl.click(); document.body.removeChild(dl);
  }

  document.getElementById('savePreview').style.display='block';
  setTimeout(()=>{ document.getElementById('savePreview').style.display='none'; }, 2000);
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────────────────────
btnStart.addEventListener('click', startCamera);
btnFreeze.addEventListener('click', handleFreeze);
btnRescan.addEventListener('click', handleRescan);
btnSave.addEventListener('click', handleSaveCard);

// ─────────────────────────────────────────────────────────────────────────────
// BOOT
// ─────────────────────────────────────────────────────────────────────────────
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

(async function boot() {
  try {
    setBoot('LOADING FACE DETECTOR...');
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    setBoot('LOADING LANDMARK NET...');
    await faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL);
    setBoot('BUILDING MASK...');
    await loadMask();
    initBarcode();
    animateBarcode();
    startShifting();
    setBoot('READY');
    warn('CAMERA REQUIRES HTTPS OR LOCALHOST.');
    btnStart.disabled = false;
  } catch(e) {
    setBoot('BOOT ERROR');
    warn('MODEL LOAD FAILED: ' + e.message);
    console.error(e);
  }
})();
</script>
</body>
</html>
