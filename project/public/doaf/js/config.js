// ─────────────────────────────────────────────────────────────
//  DOAF // CONFIG. Everything you'd want to change lives here.
// ─────────────────────────────────────────────────────────────
export const CONFIG = {
  // Collections that grant clearance. Add more policy IDs any time.
  PRETENDER: { nameHex: '363932626266326431363935653664613238643763623537' },
  POLICY_IDS: ['9cd39a656eeb4aa407a5aaa052f160c7482cb17d4cc9dff1a7bac6c0'],

  // Founder assets (asset name in HEX). PORTRAIT = filed pfp, ASCENDED = what it became.
  FOUNDER: {
    handle: 'BOXLORD',
    portrait: { policy: '9cd39a656eeb4aa407a5aaa052f160c7482cb17d4cc9dff1a7bac6c0', nameHex: '363836626332643462376565393466366166366132653737' },
    ascended: { policy: '9cd39a656eeb4aa407a5aaa052f160c7482cb17d4cc9dff1a7bac6c0', nameHex: '363836626134316531323132636534396432343466306536' },
  },

  // URL of your deployed Worker (see /worker). Leave '' to run in DEAD-DROP mode (packets copied by hand).
  SLOTS: 0,
  API_BASE: 'https://doaf-api.madjacket.workers.dev',

  // Chain data. Koios is free and CORS-open. Swap for your own key/proxy if you like.
  KOIOS_BASE: 'https://api.koios.rest/api/v1',
  IPFS_GATEWAYS: ['https://w3s.link/ipfs/', 'https://gateway.pinata.cloud/ipfs/', 'https://nftstorage.link/ipfs/', 'https://cloudflare-ipfs.com/ipfs/', 'https://ipfs.io/ipfs/'],

  // Must match ALLOWED_DOMAINS on the Worker. Defaults to wherever the page is served.
  DOMAIN: typeof location !== 'undefined' && location.hostname ? location.hostname : 'madjacket.org',

  WAYUP_URL: 'https://www.wayup.io/collection/9cd39a656eeb4aa407a5aaa052f160c7482cb17d4cc9dff1a7bac6c0',
  X_URL: 'https://x.com/_madjacket',
  DISCORD_URL: '',

  // Set false to ship with an honest empty roster instead.
    NETWORK_ID: 1, // 1 = mainnet
};
