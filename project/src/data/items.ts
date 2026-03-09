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
    "https://pool.pm/asset1sjmqc4eh0wae3qld2g8ane9w39ym0qpc44pg8u",
    "https://pool.pm/asset1j0hv52xwu8gy6mq2gauxudps3fqsr0tznud489",
    "https://pool.pm/asset16kkrg2u6j7ws5l3w6e6sq9dz6z448gss7vm4qm",
    "https://pool.pm/asset1t6nl9c79em6kvl344n6x9u6j7fqfupf9a30aeu",
    "https://pool.pm/asset1p7sfzqp9pdwwqev45fm5zs0d8yk59agmp504qe",
    "https://pool.pm/asset1m5rvgzhxql3uauw0hpnjt4465pzhhu2kp77uk8",
    "https://pool.pm/asset1vcp06fskff38k90rhmhdfacu7css3gg29lcxm6",
    "https://pool.pm/asset12qkm9xnvggnxy9j06s76c29znpvpyrwghr0ttm",
    "https://pool.pm/asset1hw44kmw9at0ujwqsym09k64mkazcmwafzvynpm",
    "https://pool.pm/asset1z2925ltkjfwf6fc8qn376v89tq4g34jdq9p2ga",
    "https://pool.pm/asset13ez6eaellg06wp32m6ksg9jv7k5fw5v9nk9vxz",
    "https://pool.pm/asset1xk0cyenvztuya6lcneg2l9mje7hp8c73vlk8gm",
    "https://pool.pm/asset14azg9qzqns29487638gngfp27gn2l5v3u0asju",
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
