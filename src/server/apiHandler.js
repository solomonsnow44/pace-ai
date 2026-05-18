import { createClient } from '@supabase/supabase-js'
import { dialAircall } from './aircallDial.js'
import { createCognismPreview } from './cognismPreview.js'
import { exportContactsToHubSpot } from './hubspotContacts.js'
import { getRedeemedContactById } from './redeemedContactStore.js'
import { suggestTargetRoles } from './roleSuggestions.js'
import { suggestAccountFieldsFromWeb, suggestClientFieldsFromWeb } from './clientSuggestions.js'
import { generateAccountScripts } from './accountScripts.js'

let supabaseServer = null;

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');
  return rawBody ? JSON.parse(rawBody) : {};
}

async function getAuthenticatedCrmUser(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    const error = new Error('Authenticated CRM user is required');
    error.statusCode = 401;
    throw error;
  }

  if (!supabaseServer && process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    supabaseServer = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  }

  if (!supabaseServer) {
    const error = new Error('Supabase auth is not configured on the server');
    error.statusCode = 500;
    throw error;
  }

  const { data, error } = await supabaseServer.auth.getUser(token);
  if (error || !data.user) {
    const authError = new Error('Authenticated CRM user is required');
    authError.statusCode = 401;
    throw authError;
  }

  return {
    id: data.user.id,
    aircallUserId: data.user.user_metadata?.aircallUserId,
  };
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function configuredEnv(keys) {
  return Object.fromEntries(keys.map(key => [key, Boolean(process.env[key])]));
}

async function handlePostRoute(req, res, handler, fallbackMessage) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return true;
  }

  try {
    const payload = await handler(await readJsonBody(req));
    sendJson(res, 200, payload);
  } catch (error) {
    sendJson(res, error.statusCode || 500, { error: error.message || fallbackMessage });
  }

  return true;
}

export async function handleApiRequest(req, res) {
  const pathname = new URL(req.url, 'http://localhost').pathname;

  if (pathname === '/api/health') {
    sendJson(res, 200, {
      ok: true,
      runtime: 'node',
      env: configuredEnv([
        'VITE_SUPABASE_URL',
        'VITE_SUPABASE_ANON_KEY',
        'OPENAI_API_KEY',
        'COGNISM_API_KEY',
        'HUBSPOT_PRIVATE_APP_TOKEN',
        'AIRCALL_API_ID',
        'AIRCALL_API_TOKEN',
        'AIRCALL_USER_ID',
      ]),
    });
    return true;
  }

  if (pathname === '/api/cognism/roles') {
    return handlePostRoute(req, res, body => suggestTargetRoles(body), 'Role suggestion failed');
  }

  if (pathname === '/api/client-suggestions') {
    return handlePostRoute(req, res, body => suggestClientFieldsFromWeb(body), 'Client suggestion failed');
  }

  if (pathname === '/api/account-suggestions') {
    return handlePostRoute(req, res, body => suggestAccountFieldsFromWeb(body), 'Account suggestion failed');
  }

  if (pathname === '/api/account-scripts') {
    return handlePostRoute(req, res, body => generateAccountScripts(body), 'Account script generation failed');
  }

  if (pathname === '/api/cognism/preview') {
    return handlePostRoute(req, res, async body => {
      const payload = await createCognismPreview(body);
      console.info('Lead Finder preview estimated credits used:', payload.estimatedCreditsUsed);
      return payload;
    }, 'Lead Finder preview failed');
  }

  if (pathname === '/api/aircall/dial') {
    return handlePostRoute(req, res, async body => {
      const user = await getAuthenticatedCrmUser(req);
      return dialAircall(body, {
        userId: user.id,
        aircallUserId: user.aircallUserId,
        getContactById: getRedeemedContactById,
        allowSavedLeadNumbers: true,
      });
    }, 'Aircall dial failed');
  }

  if (pathname === '/api/hubspot/contacts/export') {
    return handlePostRoute(req, res, async body => {
      await getAuthenticatedCrmUser(req);
      return exportContactsToHubSpot(body);
    }, 'HubSpot export failed');
  }

  return false;
}
