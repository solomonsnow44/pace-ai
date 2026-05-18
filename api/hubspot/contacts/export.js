import { handleApiRequest } from '../../../src/server/apiHandler.js'

export default async function handler(req, res) {
  if (await handleApiRequest(req, res)) return;
  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'API route not found' }));
}
