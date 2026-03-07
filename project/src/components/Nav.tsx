import { NavLink, Link } from "react-router-dom";
import { useModal } from "../context/ModalContext";

export default function Nav() {
  const { openScanner } = useModal();

  return (
    <nav className="site-nav">
      <Link className="brand" to="/">MAD<em>JACKET</em></Link>
      <span className="tag">ARRIVAL · MEGAETH</span>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? "active-nav" : ""}>HOME</NavLink>
        <NavLink to="/screening" className={({ isActive }) => isActive ? "active-nav" : ""}>SCREENING</NavLink>
        <NavLink to="/dataleak" className={({ isActive }) => isActive ? "active-nav" : ""}>DATALEAK</NavLink>
        <NavLink to="/red-pages" className={({ isActive }) => isActive ? "active-nav" : ""}>RED STRIPS</NavLink>
        <a href="#" onClick={(e) => { e.preventDefault(); openScanner(null); }}>SCAN</a>
      </div>
    </nav>
  );
}
