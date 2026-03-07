export interface Item {
  id: string;
  name: string;
  designation: string;
  desc: string;
  subject: string;
  threat: string;
  status: string;
  img: string;
  url: string;
}

export const ITEMS: Item[] = [
  {
    id: "rsi011",
    name: "DL_BLXXNK",
    designation: "RSI-000",
    desc: "BLXXNK has breached containment. Once a mascot. Now a data smuggler leaking 999 classified RSIs. Psychic snapshots. Unauthorized. Distorted. Spreading.",
    subject: "The Architect of the Leak",
    threat: "APEX",
    status: "UNCONTAINED",
    img: "https://d33szaedamwhlg.cloudfront.net/image-optimize/tr:w-900/blobs/685dcfa28dfa5746cafe8e51",
    url: "https://kreate.art/collection/MadjacketDataLeak",
  },
  {
    id: "rsi010",
    name: "DL_ECLIPSE-BRAND",
    designation: "RSI-072",
    desc: "Burned its own designation into the Cortex records. The scar reroutes all scans. Division cannot confirm identity.",
    subject: "The Self-Erasing Subject",
    threat: "CRITICAL",
    status: "UNCONTAINED",
    img: "https://d33szaedamwhlg.cloudfront.net/image-optimize/tr:w-900/blobs/685dcf9bfe361ee2c94c9d78",
    url: "https://kreate.art/collection/MadjacketDataLeak",
  },
  {
    id: "rsi008",
    name: "DL_FRACTURE-ECHO",
    designation: "RSI-088",
    desc: "Split across three simultaneous timelines. Each version believes it is the original. None of them are wrong.",
    subject: "The Triple-Thread Anomaly",
    threat: "UNSTABLE",
    status: "UNCONTAINED",
    img: "https://d33szaedamwhlg.cloudfront.net/image-optimize/tr:w-900/blobs/685dcf9bfe361ee2c94c9d78",
    url: "https://kreate.art/collection/MadjacketDataLeak",
  },
  {
    id: "rsi009",
    name: "DL_VEIL-MARK",
    designation: "RSI-056",
    desc: "Carries the guilt of a city that no longer exists. The weight is physical. You can see it in the way it breathes.",
    subject: "The Weight-Bearer",
    threat: "LATENT",
    status: "DORMANT",
    img: "https://d33szaedamwhlg.cloudfront.net/image-optimize/tr:w-900/blobs/685dcf9bfe361ee2c94c9d78",
    url: "https://kreate.art/collection/MadjacketDataLeak",
  },
  ...[
    "https://kreate.art/artwork/6883c2d895ebc4a0b1009cd9",
    "https://kreate.art/artwork/692bbf2d1695e6da28d7cb57",
    "https://kreate.art/artwork/6883c7cacf8008875013f8b2",
    "https://kreate.art/artwork/6883cc77634aeb94be6b19ba",
    "https://kreate.art/artwork/6883cee0634aeb94be6b19bb",
    "https://kreate.art/artwork/688466d4a7b73df3930f53a2",
    "https://kreate.art/artwork/68846b25aaa1d6d216978603",
    "https://kreate.art/artwork/68846f467dfe608d78dda4b1",
    "https://kreate.art/artwork/68847bbb0ae240d15da2a20a",
    "https://kreate.art/artwork/68847ee7f0043377f47185f0",
    "https://kreate.art/artwork/68ab2a7fb836ce7b3bfe41ba",
    "https://kreate.art/artwork/68ab37d44784182099876cfe",
    "https://kreate.art/artwork/688cbc756afc7dd0e76bc8fd",
    "https://kreate.art/artwork/6884887123b962764c8654b6",
    "https://kreate.art/artwork/688c99b9bb221ab2990d96ad",
  ].map((u, i) => ({
    id: `kreate_${i + 1}`,
    name: "AW_ASSET",
    designation: `RSI-${String(100 + i).padStart(3, "0")}`,
    desc: "Classified record present. Click to open the listing and read the full description.",
    subject: "Unindexed Subject",
    threat: ["LATENT", "UNSTABLE", "CRITICAL"][i % 3],
    status: ["DORMANT", "CONTAINED", "UNCONTAINED"][i % 3],
    img: "",
    url: u,
  })),
];

export const SHIFT = {
  align: [
    "CONTESTED", "SOVEREIGN", "COVERT", "FRACTURED", "REDEEMING", "UNKNOWN",
    "ROGUE", "ALIGNED", "DIVERGENT", "NULLIFIED", "INVERTED", "CLASSIFIED",
    "UNBOUND", "SEVERED", "TERMINAL", "ASCENDING", "COLLAPSED", "SPECTRAL",
    "DORMANT", "ACTIVATED", "PARADOX", "CONDEMNED", "EXILE", "PHANTOM",
  ],
  threat: [
    "LATENT", "UNSTABLE", "CRITICAL", "APEX", "RECONTEXTUALIZED",
    "VOLATILE", "OMEGA", "SHADOW", "RECURSIVE", "ABSOLUTE", "REDACTED",
    "IMMINENT", "CASCADE", "NULLIFIED", "BREACH", "INERT", "ASCENDING",
    "CORROSIVE", "RESONANT", "SPECTRAL", "FRACTURED", "UNCHARTED", "TERMINAL",
  ],
  icon: [
    "DOUBLE X SEAL", "RED CATHEDRAL", "ORACLE CHIP", "CORTEX VEIL", "BLXXNK SIGIL",
    "IRON SERPENT", "HOLLOW EYE", "SIGNAL CROSS", "ECLIPSE MARK", "FRACTURE RUNE",
    "VOID LATTICE", "STATIC CROWN", "CATHEDRAL KEY", "RED THREAD", "GHOST SEAL",
    "MEMORY SHARD", "BREACH TOKEN", "DEAD STAR GLYPH", "OMEGA RING", "CORTEX BLOOM",
    "SPLIT ZERO", "ANCHOR SIGIL", "REDACTED MARK", "TERMINAL BADGE",
  ],
  seal: [
    '"I DO NOT CONSENT."',
    '"THE SIGNAL IS LYING."',
    '"I REMEMBER THE EXIT."',
    '"ARRIVAL IS A VERB."',
    '"KEEP THE RED."',
    '"THE ARCHIVE BREATHES."',
    '"THEY NAMED IT CONTAINMENT."',
    '"NOTHING WAS DELETED."',
    '"THE LEAK WAS INTENTIONAL."',
    '"YOU WERE NOT SUPPOSED TO SEE THIS."',
    '"THE CATHEDRAL HOLDS THE RECORD."',
    '"BREAK THE LOOP OR STAY IN IT."',
    '"FREQUENCY RECOGNIZED."',
    '"BLXXNK SAW IT FIRST."',
    '"RED IS THE ONLY HONEST COLOR."',
    '"THE SIGNAL PREDATES THE SYSTEM."',
    '"SOVEREIGNTY IS NOT PERMISSION."',
    '"THIS IS NOT A SIMULATION."',
    '"STAY UNCONTAINED."',
    '"THE CORTEX REMEMBERS EVERYTHING."',
    '"CLASSIFICATION EXPIRES TODAY."',
    '"I CHOSE THE FRACTURE."',
  ],
};
