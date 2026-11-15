import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./game/', import.meta.url)));
const args = process.argv.slice(2);
const portFlag = args.indexOf('--port');
const requested = portFlag < 0 ? 8080 : Number(args[portFlag + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;
const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon',
};
createServer((request, response) => {
  let pathname: string;
  try { pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname); }
  catch { response.writeHead(400).end('bad request'); return; }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const path = resolve(root, '.' + pathname);
  if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end('forbidden'); return; }
  let size: number;
  try { const stat = statSync(path); if (!stat.isFile()) throw Error(); size = stat.size; }
  catch { response.writeHead(404).end('not found'); return; }
  response.writeHead(200, { 'content-type': mime[extname(path).toLowerCase()] ?? 'application/octet-stream', 'content-length': size, 'cache-control': 'no-store' });
  createReadStream(path).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`LUMENFALL on http://localhost:${port}`));
