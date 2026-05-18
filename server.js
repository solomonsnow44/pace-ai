import { createReadStream, existsSync, readFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { handleApiRequest } from './src/server/apiHandler.js'

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const contents = readFileSync(path, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

const port = Number(process.env.PORT || 5173);
const distDir = resolve('dist');

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function sendNotFound(res) {
  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end('Not found');
}

async function sendFile(res, filePath) {
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      sendNotFound(res);
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', mimeTypes[extname(filePath)] || 'application/octet-stream');
    createReadStream(filePath).pipe(res);
  } catch {
    sendNotFound(res);
  }
}

function resolveStaticPath(pathname) {
  const decodedPath = decodeURIComponent(pathname);
  const relativePath = normalize(decodedPath).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
  const filePath = resolve(join(distDir, relativePath));
  return filePath.startsWith(distDir) ? filePath : '';
}

createServer(async (req, res) => {
  if (req.url?.startsWith('/api') && await handleApiRequest(req, res)) return;

  if (!existsSync(distDir)) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Production build is missing. Run npm run build before npm start.');
    return;
  }

  const pathname = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;
  const staticPath = resolveStaticPath(pathname === '/' ? '/index.html' : pathname);

  if (staticPath && existsSync(staticPath)) {
    await sendFile(res, staticPath);
    return;
  }

  await sendFile(res, join(distDir, 'index.html'));
}).listen(port, () => {
  console.log(`PaceOps Data Analytics server listening on port ${port}`);
});
