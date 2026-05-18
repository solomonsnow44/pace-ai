import { createClient } from '@supabase/supabase-js'
import { dialAircall } from './aircallDial.js'
import { createCognismPreview } from './cognismPreview.js'
import { exportContactsToHubSpot } from './hubspotContacts.js'
import { getRedeemedContactById } from './redeemedContactStore.js'
import { suggestTargetRoles } from './roleSuggestions.js'
import { suggestAccountFieldsFromWeb, suggestClientFieldsFromWeb } from './clientSuggestions.js'
import { generateAccountScripts } from './accountScripts.js'

let supabaseServer = null;
let supabaseService = null;

const integrationSecretFields = {
  openai: ['apiKey'],
  cognism: ['apiKey'],
  aircall: ['apiId', 'apiToken', 'userId'],
  hubspot: ['privateAppToken'],
};

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
}

function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
}

function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
}

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

  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseServer && supabaseUrl && supabaseAnonKey) {
    supabaseServer = createClient(supabaseUrl, supabaseAnonKey);
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

function getServiceClient() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceKey();
  if (!supabaseUrl || !serviceRoleKey) {
    const error = new Error('Supabase service credentials are not configured on the server');
    error.statusCode = 500;
    throw error;
  }

  if (!supabaseService) {
    supabaseService = createClient(supabaseUrl, serviceRoleKey);
  }

  return supabaseService;
}

async function getAuthenticatedCrmUserWithOrganization(req) {
  const user = await getAuthenticatedCrmUser(req);
  const serviceClient = getServiceClient();
  const { data, error } = await serviceClient
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (error || !data?.organization_id) {
    const orgError = new Error('Workspace organization is not ready yet');
    orgError.statusCode = 400;
    throw orgError;
  }

  return { ...user, organizationId: data.organization_id };
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function configuredEnv(keys) {
  return Object.fromEntries(keys.map(key => [key, Boolean(process.env[key])]));
}

function maskSecret(value = '') {
  const cleanValue = String(value || '').trim();
  if (!cleanValue) return '';
  if (cleanValue.length <= 8) return '••••';
  return `${cleanValue.slice(0, 4)}••••${cleanValue.slice(-4)}`;
}

function parseCredentialSecret(record) {
  if (!record?.encrypted_secret) return {};
  try {
    const parsed = JSON.parse(record.encrypted_secret);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

async function findIntegrationConnection(serviceClient, organizationId, provider) {
  const { data, error } = await serviceClient
    .from('integration_connections')
    .select('id, provider, name, settings, updated_at, integration_credentials(id, encrypted_secret, secret_hint, updated_at)')
    .eq('organization_id', organizationId)
    .eq('provider', provider)
    .eq('name', provider)
    .is('client_id', null)
    .is('workspace_id', null)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

function getEnvironmentCredentialStatus(provider) {
  if (provider === 'openai') return { configured: Boolean(process.env.OPENAI_API_KEY), hints: { apiKey: maskSecret(process.env.OPENAI_API_KEY) }, source: 'env' };
  if (provider === 'cognism') return { configured: Boolean(process.env.COGNISM_API_KEY), hints: { apiKey: maskSecret(process.env.COGNISM_API_KEY) }, source: 'env' };
  if (provider === 'aircall') {
    const configured = Boolean(process.env.AIRCALL_API_ID && process.env.AIRCALL_API_TOKEN && process.env.AIRCALL_USER_ID);
    return {
      configured,
      hints: {
        apiId: maskSecret(process.env.AIRCALL_API_ID),
        apiToken: maskSecret(process.env.AIRCALL_API_TOKEN),
        userId: maskSecret(process.env.AIRCALL_USER_ID),
      },
      source: 'env',
    };
  }
  if (provider === 'hubspot') return { configured: Boolean(process.env.HUBSPOT_PRIVATE_APP_TOKEN), hints: { privateAppToken: maskSecret(process.env.HUBSPOT_PRIVATE_APP_TOKEN) }, source: 'env' };
  return { configured: false, hints: {}, source: 'none' };
}

function buildCredentialStatus(provider, connection) {
  const envStatus = getEnvironmentCredentialStatus(provider);
  const credential = connection?.integration_credentials?.[0] || null;
  const storedValues = parseCredentialSecret(credential);
  const fields = integrationSecretFields[provider] || [];
  const configuredFields = Object.fromEntries(fields.map(field => [field, Boolean(storedValues[field])]));
  const storedConfigured = fields.length ? fields.every(field => Boolean(storedValues[field])) : false;

  return {
    provider,
    configured: storedConfigured || envStatus.configured,
    source: storedConfigured ? 'supabase' : envStatus.source,
    fields: configuredFields,
    hints: storedConfigured
      ? Object.fromEntries(fields.map(field => [field, maskSecret(storedValues[field])]))
      : envStatus.hints,
    updatedAt: credential?.updated_at || connection?.updated_at || null,
  };
}

async function loadStoredIntegrationCredentials(req, provider) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return {};

  const user = await getAuthenticatedCrmUserWithOrganization(req);
  const serviceClient = getServiceClient();
  const connection = await findIntegrationConnection(serviceClient, user.organizationId, provider);
  const credential = connection?.integration_credentials?.[0] || null;
  return parseCredentialSecret(credential);
}

async function getCredentialValue(req, provider, field, envKey) {
  try {
    const storedCredentials = await loadStoredIntegrationCredentials(req, provider);
    return storedCredentials[field] || process.env[envKey];
  } catch {
    return process.env[envKey];
  }
}

async function getIntegrationStatuses(req) {
  const user = await getAuthenticatedCrmUserWithOrganization(req);
  const serviceClient = getServiceClient();
  const providers = Object.keys(integrationSecretFields);
  const connections = await Promise.all(providers.map(provider => findIntegrationConnection(serviceClient, user.organizationId, provider)));
  return {
    providers: Object.fromEntries(providers.map((provider, index) => [provider, buildCredentialStatus(provider, connections[index])])),
  };
}

async function saveIntegrationSettings(req, input = {}) {
  const provider = String(input.provider || '').trim().toLowerCase();
  const allowedFields = integrationSecretFields[provider];
  if (!allowedFields) {
    const error = new Error('Unsupported integration provider');
    error.statusCode = 400;
    throw error;
  }

  const values = input.values && typeof input.values === 'object' ? input.values : {};
  const cleanValues = Object.fromEntries(allowedFields
    .map(field => [field, String(values[field] || '').trim()])
    .filter(([, value]) => value));

  if (!Object.keys(cleanValues).length) {
    const error = new Error('Enter at least one credential value before saving');
    error.statusCode = 400;
    throw error;
  }

  const user = await getAuthenticatedCrmUserWithOrganization(req);
  const serviceClient = getServiceClient();
  const now = new Date().toISOString();
  const existingConnection = await findIntegrationConnection(serviceClient, user.organizationId, provider);
  const connectionPayload = {
    organization_id: user.organizationId,
    provider,
    name: provider,
    status: 'active',
    settings: { configuredFrom: 'settings' },
    connected_by: user.id,
  };
  const connectionQuery = existingConnection?.id
    ? serviceClient.from('integration_connections').update(connectionPayload).eq('id', existingConnection.id)
    : serviceClient.from('integration_connections').insert(connectionPayload);

  const { data: connection, error: connectionError } = await connectionQuery
    .select('id, provider, name, settings, updated_at')
    .single();

  if (connectionError) throw connectionError;

  const existingCredential = existingConnection?.integration_credentials?.[0] || null;
  const mergedValues = {
    ...parseCredentialSecret(existingCredential),
    ...cleanValues,
  };

  const credentialPayload = {
    organization_id: user.organizationId,
    connection_id: connection.id,
    encrypted_secret: JSON.stringify(mergedValues),
    secret_hint: Object.values(mergedValues).filter(Boolean).map(maskSecret).join(', '),
    created_by: user.id,
    rotated_at: now,
  };

  const credentialQuery = existingCredential?.id
    ? serviceClient.from('integration_credentials').update(credentialPayload).eq('id', existingCredential.id)
    : serviceClient.from('integration_credentials').insert(credentialPayload);

  const { error: credentialError } = await credentialQuery;
  if (credentialError) throw credentialError;

  return buildCredentialStatus(provider, {
    ...connection,
    integration_credentials: [{
      ...credentialPayload,
      updated_at: now,
    }],
  });
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
    console.error(fallbackMessage, {
      message: error?.message || String(error),
      statusCode: error?.statusCode,
      path: req.url,
    });
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
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_SERVICE_KEY',
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

  if (pathname === '/api/integration-settings') {
    if (req.method === 'GET') {
      try {
        sendJson(res, 200, await getIntegrationStatuses(req));
      } catch (error) {
        sendJson(res, error.statusCode || 500, { error: error.message || 'Integration settings failed' });
      }
      return true;
    }

    if (req.method === 'POST') {
      try {
        sendJson(res, 200, await saveIntegrationSettings(req, await readJsonBody(req)));
      } catch (error) {
        sendJson(res, error.statusCode || 500, { error: error.message || 'Integration settings failed' });
      }
      return true;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
    return true;
  }

  if (pathname === '/api/cognism/roles') {
    return handlePostRoute(req, res, async body => suggestTargetRoles(body, {
      apiKey: await getCredentialValue(req, 'openai', 'apiKey', 'OPENAI_API_KEY'),
    }), 'Role suggestion failed');
  }

  if (pathname === '/api/client-suggestions') {
    return handlePostRoute(req, res, async body => suggestClientFieldsFromWeb(body, {
      apiKey: await getCredentialValue(req, 'openai', 'apiKey', 'OPENAI_API_KEY'),
    }), 'Client suggestion failed');
  }

  if (pathname === '/api/account-suggestions') {
    return handlePostRoute(req, res, async body => suggestAccountFieldsFromWeb(body, {
      apiKey: await getCredentialValue(req, 'openai', 'apiKey', 'OPENAI_API_KEY'),
    }), 'Account suggestion failed');
  }

  if (pathname === '/api/account-scripts') {
    return handlePostRoute(req, res, async body => generateAccountScripts(body, {
      apiKey: await getCredentialValue(req, 'openai', 'apiKey', 'OPENAI_API_KEY'),
    }), 'Account script generation failed');
  }

  if (pathname === '/api/cognism/preview') {
    return handlePostRoute(req, res, async body => {
      const payload = await createCognismPreview(body, {
        apiKey: await getCredentialValue(req, 'cognism', 'apiKey', 'COGNISM_API_KEY'),
      });
      console.info('Lead Finder preview estimated credits used:', payload.estimatedCreditsUsed);
      return payload;
    }, 'Lead Finder preview failed');
  }

  if (pathname === '/api/aircall/dial') {
    return handlePostRoute(req, res, async body => {
      const user = await getAuthenticatedCrmUser(req);
      const aircallCredentials = await loadStoredIntegrationCredentials(req, 'aircall').catch(() => ({}));
      return dialAircall(body, {
        userId: user.id,
        aircallUserId: aircallCredentials.userId || user.aircallUserId,
        apiId: aircallCredentials.apiId,
        apiToken: aircallCredentials.apiToken,
        getContactById: getRedeemedContactById,
        allowSavedLeadNumbers: true,
      });
    }, 'Aircall dial failed');
  }

  if (pathname === '/api/hubspot/contacts/export') {
    return handlePostRoute(req, res, async body => {
      await getAuthenticatedCrmUser(req);
      return exportContactsToHubSpot(body, {
        token: await getCredentialValue(req, 'hubspot', 'privateAppToken', 'HUBSPOT_PRIVATE_APP_TOKEN'),
      });
    }, 'HubSpot export failed');
  }

  return false;
}
