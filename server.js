import { createReadStream, existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { handleApiRequest } from './src/server/apiHandler.js'

const port = Number(process.env.PORT || 3000);
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
  console.log(`PaceOps CRM server listening on port ${port}`);
});
