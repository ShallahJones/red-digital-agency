import { useRef, useEffect, useState } from "react";

const OCTAGON = "polygon(14% 0%, 86% 0%, 100% 14%, 100% 86%, 86% 100%, 14% 100%, 0% 86%, 0% 14%)";

// RH collection (1999 supply) — curated sample pulled straight from the mint export.
// bg: "red" | "infected" (the sickly-green variant — used sparingly)
const RH_TOKENS: { id: number; bg: "red" | "infected" }[] = [
  { id: 175, bg: "red" },
  { id: 354, bg: "red" },
  { id: 405, bg: "red" },
  { id: 546, bg: "red" },
  { id: 701, bg: "red" },
  { id: 718, bg: "red" },
  { id: 1335, bg: "red" },
  { id: 1537, bg: "red" },
  { id: 988, bg: "red" },
  { id: 102, bg: "red" },
  { id: 1935, bg: "red" },
  { id: 199, bg: "red" },
  { id: 110, bg: "red" },
  { id: 393, bg: "red" },
  { id: 1013, bg: "red" },
  { id: 1904, bg: "red" },
  { id: 1643, bg: "red" },
  { id: 418, bg: "red" },
  { id: 230, bg: "red" },
  { id: 506, bg: "red" },
  { id: 762, bg: "infected" },
  { id: 1146, bg: "infected" },
  { id: 892, bg: "infected" },
  { id: 1691, bg: "infected" },
];

// Which infected (green-bg) cards get the graffiti tag, and which word — sparing, not every one.
const TAG_OVERRIDES: Record<number, "GANG!" | "SQUAD" | undefined> = {
  762: "GANG!",
  892: "SQUAD",
};

interface CardData {
  id: string;
  label: string;
  name: string;
  status: string;
  img: string;
  bg: "red" | "infected";
  tag?: "GANG!" | "SQUAD";
}

interface LightboxState {
  open: boolean;
  img: string;
  label: string;
  name: string;
  status: string;
}

function buildRows(): [CardData[], CardData[]] {
  const statuses = ["DORMANT", "CONTAINED", "UNCONTAINED"];

  const all: CardData[] = RH_TOKENS.map((t, i) => ({
    id: `rh_${t.id}`,
    label: `RSI-${String(t.id).padStart(4, "0")}`,
    name: `MADJACKET #${t.id}`,
    status: statuses[i % statuses.length],
    img: `/pfp/rh/${t.id}.png`,
    bg: t.bg,
    tag: TAG_OVERRIDES[t.id],
  }));

  const half = Math.ceil(all.length / 2);
  const row1 = all.slice(0, half);
  const row2 = all.slice(half);

  return [row1, row2];
}

const [ROW1_DATA, ROW2_DATA] = buildRows();

function Lightbox({ state, onClose }: { state: LightboxState; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!state.open) return null;

  return (
    <div className="lb-backdrop" onClick={onClose}>
      <div className="lb-box" onClick={(e) => e.stopPropagation()}>
        <button className="lb-close" onClick={onClose}>ESC · CLOSE</button>
        <div className="lb-frame" style={{ clipPath: OCTAGON }}>
          {state.img ? (
            <img className="lb-img" src={state.img} alt="" />
          ) : (
            <div className="lb-placeholder" />
          )}
          <div className="lb-overlay" />
        </div>
        <div className="lb-meta">
          <div className="lb-label">{state.label}</div>
          <div className="lb-name">{state.name}</div>
          <div className="lb-status">{state.status}</div>
        </div>
      </div>
    </div>
  );
}

function GraffitiTag({ text }: { text: "GANG!" | "SQUAD" }) {
  return (
    <div className="sc-graffiti" aria-hidden="true">
      <span className="sc-graffiti-text">{text}</span>
    </div>
  );
}

function CarouselCard({ card, onLightbox }: { card: CardData; onLightbox: (c: CardData) => void }) {
  return (
    <div
      className={`sc-card${card.bg === "infected" ? " sc-card-infected" : ""}`}
      style={{ clipPath: OCTAGON }}
      onClick={() => onLightbox(card)}
    >
      <div className="sc-card-inner">
        {card.img ? (
          <img className="sc-card-img" src={card.img} alt="" loading="lazy" />
        ) : (
          <div className="sc-card-placeholder" />
        )}
        {card.tag && <GraffitiTag text={card.tag} />}
        <div className="sc-card-overlay" />
        <div className="sc-card-meta">
          <div className="sc-card-label">{card.label}</div>
          <div className="sc-card-name">{card.name}</div>
          <div className="sc-card-status">{card.status}</div>
        </div>
      </div>
    </div>
  );
}

export default function ScrollCarousel() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [lightbox, setLightbox] = useState<LightboxState>({
    open: false, img: "", label: "", name: "", status: "",
  });

  useEffect(() => {
    function onScroll() {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollBudget = rect.height - vh;
      if (scrollBudget <= 0) return;
      const scrolled = -rect.top;
      const p = Math.max(0, Math.min(1, scrolled / scrollBudget));
      setProgress(p);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function openLightbox(card: CardData) {
    setLightbox({ open: true, img: card.img, label: card.label, name: card.name, status: card.status });
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    setLightbox((s) => ({ ...s, open: false }));
    document.body.style.overflow = "";
  }

  const maxShift = 260;
  const shift1 = -(progress * maxShift);
  const shift2 = progress * maxShift;

  const doubled1 = [...ROW1_DATA, ...ROW1_DATA];
  const doubled2 = [...ROW2_DATA, ...ROW2_DATA];

  return (
    <>
      <Lightbox state={lightbox} onClose={closeLightbox} />
      <div className="sc-scroll-wrapper" ref={wrapRef}>
        <div className="sc-sticky">
          <div className="scroll-carousel">
            <div className="sc-row" style={{ transform: `translateX(${shift1}px)` }}>
              {doubled1.map((card, i) => (
                <CarouselCard key={`r1-${i}`} card={card} onLightbox={openLightbox} />
              ))}
            </div>
            <div className="sc-row" style={{ transform: `translateX(${shift2}px)` }}>
              {doubled2.map((card, i) => (
                <CarouselCard key={`r2-${i}`} card={card} onLightbox={openLightbox} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
