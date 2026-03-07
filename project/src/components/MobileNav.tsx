import { useState, useEffect } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { useModal } from "../context/ModalContext";

export default function MobileNav() {
  const { openScanner } = useModal();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <nav className="mob-nav">
        <Link className="mob-brand" to="/">MAD<em>JACKET</em></Link>
        <button
          className={`mob-burger${open ? " open" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div className={`mob-drawer${open ? " open" : ""}`} aria-hidden={!open}>
        <div className="mob-drawer-inner">
          <div className="mob-drawer-brand">MAD<em>JACKET</em></div>
          <div className="mob-drawer-tag">ARRIVAL · MEGAETH</div>
          <nav className="mob-drawer-links">
            <NavLink to="/" end className={({ isActive }) => isActive ? "mob-link active" : "mob-link"}>HOME</NavLink>
            <NavLink to="/screening" className={({ isActive }) => isActive ? "mob-link active" : "mob-link"}>SCREENING</NavLink>
            <NavLink to="/dataleak" className={({ isActive }) => isActive ? "mob-link active" : "mob-link"}>DATALEAK</NavLink>
            <NavLink to="/red-pages" className={({ isActive }) => isActive ? "mob-link active" : "mob-link"}>RED STRIPS</NavLink>
            <button className="mob-link mob-scan-btn" onClick={() => { setOpen(false); openScanner(null); }}>SCAN</button>
          </nav>
        </div>
      </div>

      {open && <div className="mob-drawer-backdrop" onClick={() => setOpen(false)} />}
    </>
  );
}
