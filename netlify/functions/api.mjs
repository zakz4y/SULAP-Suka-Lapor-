/**
 * Netlify Function entry for the SULAP API (/api/*).
 *
 * The backend in backend/src/server.js is a Node.js (req, res) handler. To reuse
 * it unchanged, it is hosted on a local http.Server inside the function and each
 * incoming request is proxied to it.
 */
import http from 'node:http';
import { requestHandler } from '../../backend/src/server.js';

let serverUrlPromise;

function getServerUrl() {
  if (!serverUrlPromise) {
    serverUrlPromise = new Promise((resolve, reject) => {
      const server = http.createServer(requestHandler);
      server.on('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        resolve(`http://127.0.0.1:${port}`);
      });
    });
  }
  return serverUrlPromise;
}

export default async (request) => {
  const baseUrl = await getServerUrl();
  const incoming = new URL(request.url);
  const target = new URL(incoming.pathname + incoming.search, baseUrl);

  const headers = new Headers(request.headers);
  headers.set('host', incoming.host);

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const response = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: 'manual',
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

export const config = {
  path: '/api/*',
};
