// Tiny zero-dependency static server for Hollowlight. Serves ./public only.
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const PORT = Number(process.env.PORT) || 3001;
// HOLLOWLIGHT_PUBLIC=1: this server is the public site (the live copy on :3000). It answers
// /js/site.js with PUBLIC = true, which turns test mode off in the game.
const PUBLIC = process.env.HOLLOWLIGHT_PUBLIC === '1';
const SITE_JS = Buffer.from('// Served by server.js for the public site (HOLLOWLIGHT_PUBLIC=1).\nexport const PUBLIC = true;\n');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Strict policy so the game stays publishable as-is: no inline code, no third parties.
const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'";

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    let pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.normalize(path.join(ROOT, pathname));
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    const body = PUBLIC && pathname === '/js/site.js' ? SITE_JS : await fs.readFile(file);
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-cache',
      'Content-Security-Policy': CSP,
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (err) {
    const code = err.code === 'ENOENT' || err.code === 'EISDIR' ? 404 : 500;
    res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }).end(code === 404 ? 'Not found' : 'Server error');
  }
});

server.listen(PORT, () => console.log(`[${new Date().toISOString()}] Hollowlight serving on :${PORT}${PUBLIC ? ' (public site: test mode off)' : ''}`));
