// Where the game is being served. This file says "not the public site" (dev on :3001, the tools).
// The live server (server.js started with HOLLOWLIGHT_PUBLIC=1, behind the public domain) answers
// /js/site.js with its own copy that says PUBLIC = true, which turns test mode off for players.
export const PUBLIC = false;
