import { useEffect, useState } from "react";

interface PdfReaderProps {
  open: boolean;
  onClose: () => void;
  src: string;
  title: string;
}

const EXIT_MS = 420;

export default function PdfReader({ open, onClose, src, title }: PdfReaderProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let raf = 0;
    let timeout: ReturnType<typeof setTimeout>;

    if (open) {
      setMounted(true);
      // two frames, so the initial (collapsed) state definitely paints
      // before we flip to open — one rAF alone can land in the same paint.
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      timeout = setTimeout(() => setMounted(false), EXIT_MS);
    }

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div
      className={`pdfr-backdrop${visible ? " pdfr-open" : ""}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="pdfr-frame">
        <div className="pdfr-scaler" aria-hidden="true" />
        <div className="pdfr-content">
          <div className="pdfr-bar">
            <span className="pdfr-bar-dot" aria-hidden="true" />
            <span className="pdfr-bar-title">{title}</span>
            <div className="pdfr-bar-actions">
              <a
                className="pdfr-bar-link"
                href={src}
                target="_blank"
                rel="noopener noreferrer"
              >
                OPEN IN TAB ↗
              </a>
              <button
                type="button"
                className="pdfr-close"
                onClick={onClose}
                aria-label="Close reader"
              >
                ×
              </button>
            </div>
          </div>
          <div className="pdfr-viewport">
            {visible && (
              <iframe
                src={`${src}#view=FitH`}
                title={title}
                className="pdfr-iframe"
              />
            )}
          </div>
          <span className="id-corner id-corner-tl" />
          <span className="id-corner id-corner-tr" />
          <span className="id-corner id-corner-bl" />
          <span className="id-corner id-corner-br" />
        </div>
      </div>
    </div>
  );
}
