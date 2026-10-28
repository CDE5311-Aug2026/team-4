'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = fs.realpathSync(__dirname);
const port = Number(process.env.PORT || 4193);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8'
};

function insideRoot(candidate) {
  const relative = path.relative(root, candidate);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function reply(res, status, message) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(message);
}

const server = http.createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    reply(res, 405, 'Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname).replace(/\\/g, '/');
  } catch {
    reply(res, 400, 'Invalid request path');
    return;
  }
  if (pathname.includes('\0')) {
    reply(res, 400, 'Invalid request path');
    return;
  }

  let filename = path.resolve(root, `.${pathname}`);
  if (!insideRoot(filename)) {
    reply(res, 403, 'Forbidden');
    return;
  }

  try {
    let stat = await fs.promises.stat(filename);
    if (stat.isDirectory()) {
      filename = path.join(filename, 'index.html');
      stat = await fs.promises.stat(filename);
    }
    if (!stat.isFile()) {
      reply(res, 404, 'Not found');
      return;
    }
    // A symlink inside the demo cannot expose a file outside its own directory.
    filename = await fs.promises.realpath(filename);
    if (!insideRoot(filename)) {
      reply(res, 403, 'Forbidden');
      return;
    }
    res.writeHead(200, {
      'Content-Type': mime[path.extname(filename).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    const stream = fs.createReadStream(filename);
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch (error) {
    reply(res, error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500,
      error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 'Not found' : 'Unable to read file');
  }
});

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
server.on('error', (error) => {
  console.error(`Demo server: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Downstairs demo: http://127.0.0.1:${port}`);
});
