import { useModal } from "../context/ModalContext";

export default function ProfileModal() {
  const { profileOpen, closeProfile, openScanner, currentItem } = useModal();

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) closeProfile();
  }

  function handleScanThis() {
    closeProfile();
    openScanner(currentItem);
  }

  if (!currentItem) return null;

  return (
    <div className={`modal-backdrop${profileOpen ? " open" : ""}`} onClick={handleBackdropClick}>
      <div className="panel" role="dialog" aria-modal="true" aria-label="Dossier">
        <button className="close-btn" onClick={closeProfile}>CLOSE</button>
        <div className="ptitle">{currentItem.name || "RSI DOSSIER"}</div>
        <div className="psub">Designation verified. Click to open the source listing.</div>
        <div className="kv">
          <div><div className="k">DESIGNATION</div><div className="v">{currentItem.designation || currentItem.id || "—"}</div></div>
          <div><div className="k">SUBJECT</div><div className="v">{currentItem.subject || "—"}</div></div>
          <div><div className="k">STATUS</div><div className="v">{currentItem.status || "UNKNOWN"}</div></div>
          <div><div className="k">THREAT</div><div className="v">{currentItem.threat || "UNKNOWN"}</div></div>
        </div>
        <div className="note">{currentItem.desc || "No description loaded."}</div>
        <div className="panel-actions">
          <a className="btn" href={currentItem.url || "#"} target="_blank" rel="noreferrer">OPEN ASSET</a>
          <button className="btn primary" onClick={handleScanThis}>SCAN THIS SUBJECT</button>
        </div>
      </div>
    </div>
  );
}
