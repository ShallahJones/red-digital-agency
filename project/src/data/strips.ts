export interface StripPanel {
  img: string;
  caption?: string;
  alt: string;
  link?: string;
  linkText?: string;
}

export interface Strip {
  id: string;
  number: number;
  title: string;
  rsi: string;
  thumbnail: string;
  panels: StripPanel[];
  classification: "OPEN SIGNAL" | "RESTRICTED" | "REDACTED";
  status: "PUBLIC" | "CLASSIFIED" | "LEAKED";
  date: string;
}

export const STRIPS: Strip[] = [
  {
    id: "strip_001",
    number: 1,
    title: "THE CYCLE BREAKER",
    rsi: "RSI #001",
    thumbnail: "/REDSTRIP/cyclebreaker.png",
    classification: "OPEN SIGNAL",
    status: "PUBLIC",
    date: "SATURDAY SIGNAL · WEEK 001",
    panels: [
      {
        img: "/REDSTRIP/001/CB_1.png",
        alt: "Panel 1 — Storm-23 trapped in corporate conformity",
        caption: "PANEL 01 // SUBJECT: STORM-23",
      },
      {
        img: "/REDSTRIP/001/CB_2.png",
        alt: "Panel 2 — Employee containment failing",
        caption: "PANEL 02 // CONTAINMENT FAILING",
      },
      {
        img: "/REDSTRIP/001/CB_3.png",
        alt: "Panel 3 — Authenticity levels critical, broadcasts unfiltered",
        caption: "PANEL 03 // THREAT LEVEL: AUTHENTICALLY INFECTIOUS",
      },
      {
        img: "https://image-optimizer.jpgstoreapis.com/QmUXhP6kzyBGSY9WmjCpDcT3PkPhj8RwUYVqUUAKcxj6NU?width=1200",
        alt: "View the OG on JPG Store",
        caption: "PANEL 04 // VIEW ON-CHAIN",
        link: "https://www.jpg.store/asset/9cd39a656eeb4aa407a5aaa052f160c7482cb17d4cc9dff1a7bac6c0363835646435313335653166613861336434326663323837",
        linkText: "view the original onchain!",
      },
    ],
  },
  {
    id: "strip_002",
    number: 2,
    title: "VIRGINIA WELLS",
    rsi: "RSI #040",
    thumbnail: "/REDSTRIP/virginia_wells.png",
    classification: "RESTRICTED",
    status: "LEAKED",
    date: "SATURDAY SIGNAL · WEEK 002",
    panels: [
      {
        img: "/REDSTRIP/002/VW_1.png",
        alt: "Virginia Wells — The Antiquarian Vigilante. Subject discovers The Signal's weakness through a 1950s television set.",
        caption: "PANEL 01 // SUBJECT: VIRGINIA WELLS",
      },
      {
        img: "/REDSTRIP/002/VW_2.png",
        alt: "Virginia Wells broadcasts unauthorized cultural memories. Status: Under cultural quarantine. Threat Level: Memory contagion risk.",
        caption: "PANEL 02 // MEMORY CONTAGION RISK",
      },
      {
        img: "/REDSTRIP/002/VW_3.png",
        alt: "Virginia Wells stands atop ruins broadcasting cultural contamination warning. Memory quarantine failed.",
        caption: "PANEL 03 // CULTURAL CONTAMINATION WARNING",
      },
      {
        img: "https://image-optimizer.jpgstoreapis.com/QmTbgKvXjBJyqFg4w2sVzrdHqdxLBMz3Z26XVdjTSj8Xhz?width=1200",
        alt: "View the OG on JPG Store",
        caption: "PANEL 04 // VIEW ON-CHAIN",
        link: "https://www.jpg.store/asset/9cd39a656eeb4aa407a5aaa052f160c7482cb17d4cc9dff1a7bac6c0363836626338333730626465346430326333303630373639",
        linkText: "View the OG on JPG Store!",
      },
    ],
  },
  {
    id: "strip_003",
    number: 3,
    title: "ASH PRINCE",
    rsi: "RSI #000",
    thumbnail: "/REDSTRIP/ashprince.png",
    classification: "RESTRICTED",
    status: "LEAKED",
    date: "SATURDAY SIGNAL · WEEK 003",
    panels: [
      {
        img: "/REDSTRIP/003/AP_1.png",
        alt: "Ash Prince — Sulking flame sculptor, boredom combusted into weaponized tantrums. Privileged suburban delinquent who lit backyard bonfires until the fire answered back.",
        caption: "PANEL 01 // SUBJECT: ASH PRINCE",
      },
      {
        img: "/REDSTRIP/003/AP_2.png",
        alt: "Ash Prince Louis III — Known for turning cul-de-sacs into ash labyrinths, graffiti tags scorched, riot arcs that spark in sync with his mood swings.",
        caption: "PANEL 02 // THREAT LEVEL: INCENDIARY",
      },
      {
        img: "/REDSTRIP/003/AP_3.png",
        alt: "Sir Ash Prince Louis III — Wandering gated-community ruins, every pout dripping kerosene. Unauthorized message: every flame I strike is a diary entry.",
        caption: "PANEL 03 // MEMORY QUARANTINE FAILED",
      },
      {
        img: "https://image-optimizer.jpgstoreapis.com/QmPxmCT3xo8E2p8VwvJ1L1F9hEcLJxxe7bBKBfmnfUG9Yy?width=1200",
        alt: "View original on-chain",
        caption: "PANEL 04 // VIEW ON-CHAIN",
        link: "https://kreate.art/artwork/68ab294972587eaf262ed701",
        linkText: "View original on-chain",
      },
    ],
  },
  {
    id: "strip_004",
    number: 4,
    title: "SIGNAL BREACH — UNKNOWN SUBJECT",
    rsi: "RSI #???",
    thumbnail: "/REDSTRIP/004/no_1.png",
    classification: "REDACTED",
    status: "LEAKED",
    date: "SATURDAY SIGNAL · WEEK 004",
    panels: [
      {
        img: "/REDSTRIP/004/no_1.png",
        alt: "Unknown subject — Identity corrupted, signal fragmenting",
        caption: "PANEL 01 // IDENTITY CORRUPTED",
      },
      {
        img: "/REDSTRIP/004/no_2.png",
        alt: "Signal breach detected — Subject unidentifiable",
        caption: "PANEL 02 // SIGNAL BREACH",
      },
      {
        img: "/REDSTRIP/004/no_3.png",
        alt: "Data corruption — Classification failed",
        caption: "PANEL 03 // CLASSIFICATION FAILED",
      },
    ],
  },
];
