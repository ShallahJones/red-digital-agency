import { useRef, useEffect, useState } from "react";
import { ITEMS } from "../data/items";
import { useModal } from "../context/ModalContext";

const OCTAGON = "polygon(14% 0%, 86% 0%, 100% 14%, 100% 86%, 86% 100%, 14% 100%, 0% 86%, 0% 14%)";

const PFP_IMAGES = [
  "/pfp/002.png",
  "/pfp/004.png",
  "/pfp/006.png",
  "/pfp/007.png",
  "/pfp/011.png",
  "/pfp/195.png",
  "/pfp/013.png",
  "/pfp/018.png",
  "/pfp/035.png",
  "/pfp/050.png",
  "/pfp/053.png",
  "/pfp/132.png",
  "/pfp/134.png",
  "/pfp/140.png",
  "/pfp/154.png",
  "/pfp/201.png",
];

interface CardData {
  id: string;
  label: string;
  name: string;
  status: string;
  img: string;
  itemRef?: (typeof ITEMS)[0];
}

interface LightboxState {
  open: boolean;
  img: string;
  label: string;
  name: string;
  status: string;
}

function buildRows(): [CardData[], CardData[]] {
  const all: CardData[] = [];

  ITEMS.forEach((item, i) => {
    all.push({
      id: item.id,
      label: item.designation,
      name: item.name || "AW_ASSET",
      status: item.status,
      img: item.img || PFP_IMAGES[i % PFP_IMAGES.length],
      itemRef: item,
    });
  });

  PFP_IMAGES.forEach((src, i) => {
    all.push({
      id: `pfp_${i}`,
      label: `RSI-${String(200 + i).padStart(3, "0")}`,
      name: "AW_ASSET",
      status: ["DORMANT", "CONTAINED", "UNCONTAINED"][i % 3],
      img: src,
    });
  });

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

function CarouselCard({ card, onLightbox }: { card: CardData; onLightbox: (c: CardData) => void }) {
  const { openProfile } = useModal();

  function handleClick() {
    if (card.itemRef) {
      openProfile(card.itemRef);
    } else {
      onLightbox(card);
    }
  }

  return (
    <div
      className="sc-card"
      style={{ clipPath: OCTAGON }}
      onClick={handleClick}
    >
      <div className="sc-card-inner">
        {card.img ? (
          <img className="sc-card-img" src={card.img} alt="" loading="lazy" />
        ) : (
          <div className="sc-card-placeholder" />
        )}
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
