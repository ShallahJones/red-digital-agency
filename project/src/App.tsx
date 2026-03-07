import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModalProvider } from "./context/ModalContext";
import Nav from "./components/Nav";
import MobileNav from "./components/MobileNav";
import ProfileModal from "./components/ProfileModal";
import ScannerModal from "./components/ScannerModal";
import Home from "./pages/Home";
import Screening from "./pages/Screening";
import Dataleak from "./pages/Dataleak";
import RedPages from "./pages/RedPages";
import Whitelist from "./pages/Whitelist";
import "./mobile.css";

function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<HTMLDivElement>(null);
  const mx = useRef(0);
  const my = useRef(0);
  const tx = useRef(0);
  const ty = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      mx.current = e.clientX;
      my.current = e.clientY;
      const c = cursorRef.current;
      const f = flareRef.current;
      if (c) { c.style.left = mx.current - 6 + "px"; c.style.top = my.current - 6 + "px"; }
      if (f) { f.style.left = mx.current - 150 + "px"; f.style.top = my.current - 150 + "px"; }
    }

    function lerp() {
      tx.current += (mx.current - tx.current) * 0.12;
      ty.current += (my.current - ty.current) * 0.12;
      const t = trailRef.current;
      if (t) { t.style.left = tx.current - 15 + "px"; t.style.top = ty.current - 15 + "px"; }
      rafRef.current = requestAnimationFrame(lerp);
    }

    function attachHover() {
      document.querySelectorAll<HTMLElement>("a, button").forEach((el) => {
        el.addEventListener("mouseenter", () => {
          const c = cursorRef.current;
          const t = trailRef.current;
          if (c) c.style.transform = "scale(2)";
          if (t) t.style.transform = "scale(.5)";
        });
        el.addEventListener("mouseleave", () => {
          const c = cursorRef.current;
          const t = trailRef.current;
          if (c) c.style.transform = "";
          if (t) t.style.transform = "";
        });
        el.style.cursor = "none";
      });
    }

    document.addEventListener("mousemove", onMove);
    rafRef.current = requestAnimationFrame(lerp);

    const observer = new MutationObserver(attachHover);
    observer.observe(document.body, { childList: true, subtree: true });
    attachHover();

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={cursorRef} className="cursor" />
      <div ref={trailRef} className="cursor-trail" />
      <div ref={flareRef} className="flare" />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ModalProvider>
        <CustomCursor />
        <div className="scanlines" aria-hidden="true" />
        <Nav />
        <MobileNav />
        <ProfileModal />
        <ScannerModal />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/screening" element={<Screening />} />
          <Route path="/dataleak" element={<Dataleak />} />
          <Route path="/red-pages" element={<RedPages />} />
          <Route path="/whitelist" element={<Whitelist />} />
        </Routes>
      </ModalProvider>
    </BrowserRouter>
  );
}
