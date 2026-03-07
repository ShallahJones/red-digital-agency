import { useEffect, useState } from "react";

type HarekinPhase = "idle" | "in" | "out";

function HarekinVisitor({ side, active, onDone }: { side: "right" | "left"; active: boolean; onDone: () => void }) {
  const [phase, setPhase] = useState<HarekinPhase>("idle");
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (!active) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    let flashInterval: ReturnType<typeof setInterval> | null = null;

    setPhase("in");

    timers.push(setTimeout(() => {
      let flashes = 0;
      flashInterval = setInterval(() => {
        setGlitch((g) => !g);
        flashes++;
        if (flashes >= 10) {
          if (flashInterval) clearInterval(flashInterval);
          setGlitch(false);
          timers.push(setTimeout(() => {
            setPhase("out");
            timers.push(setTimeout(() => {
              setPhase("idle");
              onDone();
            }, 700));
          }, 400));
        }
      }, 75);
    }, 1200));

    return () => {
      timers.forEach(clearTimeout);
      if (flashInterval) clearInterval(flashInterval);
    };
  }, [active]);

  if (phase === "idle") return null;

  const slideIn = side === "right" ? "gv-slide-in-right" : "gv-slide-in-left";
  const slideOut = side === "right" ? "gv-slide-out-right" : "gv-slide-out-left";
  const containerClass = side === "right" ? "gv-lago" : "gv-lago-left";

  return (
    <div
      className={`${containerClass} ${phase === "in" ? slideIn : slideOut} ${glitch ? "gv-glitch" : ""}`}
      aria-hidden="true"
    >
      <img
        src="/lagomorph-0.png"
        alt=""
        draggable={false}
        style={side === "left" ? { transform: "scaleX(-1)" } : undefined}
      />
    </div>
  );
}

export default function GlitchVisitors() {
  const [turn, setTurn] = useState<"right" | "left" | "waiting">("waiting");

  useEffect(() => {
    const initial = setTimeout(() => setTurn("right"), 2000);
    return () => clearTimeout(initial);
  }, []);

  function handleDone(justFinished: "right" | "left") {
    const next = justFinished === "right" ? "left" : "right";
    const pause = setTimeout(() => setTurn(next), 6000);
    setTurn("waiting");
    return () => clearTimeout(pause);
  }

  return (
    <>
      <HarekinVisitor side="right" active={turn === "right"} onDone={() => handleDone("right")} />
      <HarekinVisitor side="left" active={turn === "left"} onDone={() => handleDone("left")} />
    </>
  );
}
