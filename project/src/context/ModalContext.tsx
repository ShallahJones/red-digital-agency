import { createContext, useContext, useState, ReactNode } from "react";
import { Item } from "../data/items";

interface ModalContextValue {
  profileOpen: boolean;
  scannerOpen: boolean;
  currentItem: Item | null;
  openProfile: (item: Item) => void;
  closeProfile: () => void;
  openScanner: (item?: Item | null) => void;
  closeScanner: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Item | null>(null);

  function openProfile(item: Item) {
    setCurrentItem(item);
    setProfileOpen(true);
    document.body.style.overflow = "hidden";
  }

  function closeProfile() {
    setProfileOpen(false);
    document.body.style.overflow = "";
  }

  function openScanner(item?: Item | null) {
    if (item) setCurrentItem(item);
    setScannerOpen(true);
    document.body.style.overflow = "hidden";
  }

  function closeScanner() {
    setScannerOpen(false);
    document.body.style.overflow = "";
  }

  return (
    <ModalContext.Provider
      value={{ profileOpen, scannerOpen, currentItem, openProfile, closeProfile, openScanner, closeScanner }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used inside ModalProvider");
  return ctx;
}
