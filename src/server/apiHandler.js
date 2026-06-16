import { createClient } from '@supabase/supabase-js'
import { dialAircall } from './aircallDial.js'
import { createTemporaryAircallRecordingLink, syncAircallData } from './aircallSync.js'
import { createCognismPreview, redeemCognismContacts } from './cognismPreview.js'
import { exportContactsToHubSpot } from './hubspotContacts.js'
import { getRedeemedContactById } from './redeemedContactStore.js'
import { suggestTargetRoles } from './roleSuggestions.js'

let supabaseServer = null;
let supabaseService = null;

const integrationSecretFields = {
  cognism: ['apiKey'],
  aircall: ['apiId', 'apiToken'],
  hubspot: ['privateAppToken'],
};

const ADMIN_SETTINGS_METADATA_KEY = 'admin_settings';
const DEFAULT_ADMIN_SETTINGS = {
  cognism_preview_enabled: true,
  contact_deletion_enabled: false,
  test_account_enabled: false,
};
const SUPPORTED_CURRENCY_CODES = new Set(['EUR', 'GBP', 'USD']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSupabaseUrl() {
  return process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
}

function getSupabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
}

function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
}

function hasSupabaseServiceCredentials() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceKey());
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
    .select('organization_id, role, aircall_user_id')
    .eq('id', user.id)
    .single();

  if (error || !data?.organization_id) {
    const orgError = new Error('Workspace organization is not ready yet');
    orgError.statusCode = 400;
    throw orgError;
  }

  return {
    ...user,
    organizationId: data.organization_id,
    role: data.role || 'member',
    aircallUserId: data.aircall_user_id || user.aircallUserId,
  };
}

function isAdminRole(role) {
  return ['platform_admin', 'org_owner', 'org_admin', 'admin'].includes(role);
}

function isOrgAdminRole(role) {
  return ['platform_admin', 'org_owner', 'org_admin'].includes(role);
}

function isProtectedAdminRole(role) {
  return ['platform_admin', 'org_owner'].includes(role);
}

function assertOrgAdmin(user) {
  if (isOrgAdminRole(user?.role)) return;
  const error = new Error('Admin controls are available to org admins only.');
  error.statusCode = 403;
  throw error;
}

function assertAdmin(user) {
  if (isAdminRole(user?.role)) return;
  const error = new Error('Admin access is required.');
  error.statusCode = 403;
  throw error;
}

function normalizeAdminSettings(settings = {}) {
  return {
    ...DEFAULT_ADMIN_SETTINGS,
    ...(settings && typeof settings === 'object' ? settings : {}),
    cognism_preview_enabled: settings?.cognism_preview_enabled !== false,
    contact_deletion_enabled: settings?.contact_deletion_enabled === true,
    test_account_enabled: settings?.test_account_enabled === true,
  };
}

function normalizeCurrencyCode(code) {
  const value = String(code || '').trim().toUpperCase();
  return SUPPORTED_CURRENCY_CODES.has(value) ? value : '';
}

function hasOwnValue(input, key) {
  return Object.prototype.hasOwnProperty.call(input || {}, key);
}


async function loadOrganizationMetadata(serviceClient, organizationId) {
  const { data, error } = await serviceClient
    .from('organizations')
    .select('metadata')
    .eq('id', organizationId)
    .single();

  if (error) throw error;
  return data?.metadata && typeof data.metadata === 'object' ? data.metadata : {};
}

async function writeAuditLog(serviceClient, user, action, objectType, objectId, beforeData, afterData, metadata = {}) {
  const { error } = await serviceClient
    .from('audit_logs')
    .insert({
      organization_id: user.organizationId,
      actor_id: user.id,
      action,
      object_type: objectType,
      object_id: UUID_PATTERN.test(String(objectId || '')) ? objectId : null,
      before_data: beforeData || null,
      after_data: afterData || null,
      metadata,
    });

  if (error) throw error;
}

async function getAdminSettings(req) {
  if (canUseLocalCognismPreviewFallback() && !hasSupabaseServiceCredentials()) {
    return { settings: DEFAULT_ADMIN_SETTINGS, role: 'org_admin', isAdmin: true, isOrgAdmin: true };
  }

  const user = await getAuthenticatedCrmUserWithOrganization(req);
  const serviceClient = getServiceClient();
  const metadata = await loadOrganizationMetadata(serviceClient, user.organizationId);
  const settings = normalizeAdminSettings(metadata[ADMIN_SETTINGS_METADATA_KEY]);
  return {
    settings,
    role: user.role,
    isAdmin: isAdminRole(user.role),
    isOrgAdmin: isOrgAdminRole(user.role),
  };
}

async function updateAdminSettings(req, input = {}) {
  const user = await getAuthenticatedCrmUserWithOrganization(req);
  assertOrgAdmin(user);

  const serviceClient = getServiceClient();
  const metadata = await loadOrganizationMetadata(serviceClient, user.organizationId);
  const beforeSettings = normalizeAdminSettings(metadata[ADMIN_SETTINGS_METADATA_KEY]);
  const nextSettings = normalizeAdminSettings({
    ...beforeSettings,
    ...(typeof input.cognism_preview_enabled === 'boolean' ? { cognism_preview_enabled: input.cognism_preview_enabled } : {}),
    ...(typeof input.contact_deletion_enabled === 'boolean' ? { contact_deletion_enabled: input.contact_deletion_enabled } : {}),
    ...(typeof input.test_account_enabled === 'boolean' ? { test_account_enabled: input.test_account_enabled } : {}),
    updated_at: new Date().toISOString(),
    updated_by: user.id,
  });

  const nextMetadata = {
    ...metadata,
    [ADMIN_SETTINGS_METADATA_KEY]: nextSettings,
  };

  const { error } = await serviceClient
    .from('organizations')
    .update({ metadata: nextMetadata })
    .eq('id', user.organizationId);

  if (error) throw error;
  await writeAuditLog(serviceClient, user, 'admin_settings.updated', 'organization', user.organizationId, beforeSettings, nextSettings);
  return {
    settings: nextSettings,
    role: user.role,
    isAdmin: true,
    isOrgAdmin: true,
  };
}

async function updateCurrentUserProfile(req, input = {}) {
  const user = await getAuthenticatedCrmUserWithOrganization(req);
  const serviceClient = getServiceClient();
  const { data: beforeProfile, error: beforeError } = await serviceClient
    .from('users')
    .select('id,email,first_name,last_name,display_name,aircall_user_id,currency_code,avatar_url')
    .eq('id', user.id)
    .eq('organization_id', user.organizationId)
    .single();

  if (beforeError) throw beforeError;

  const firstName = hasOwnValue(input, 'firstName') ? String(input.firstName || '').trim() : beforeProfile.first_name || '';
  const lastName = hasOwnValue(input, 'lastName') ? String(input.lastName || '').trim() : beforeProfile.last_name || '';
  const defaultDisplayName = [firstName, lastName].filter(Boolean).join(' ');
  const displayName = hasOwnValue(input, 'displayName')
    ? String(input.displayName || '').trim() || defaultDisplayName
    : beforeProfile.display_name || defaultDisplayName;
  const aircallUserId = hasOwnValue(input, 'aircallUserId')
    ? String(input.aircallUserId || '').trim() || null
    : beforeProfile.aircall_user_id || null;
  const currencyCode = normalizeCurrencyCode(input.currencyCode) || normalizeCurrencyCode(beforeProfile.currency_code) || 'GBP';
  const avatarUrl = hasOwnValue(input, 'avatarUrl')
    ? String(input.avatarUrl || '').trim() || null
    : beforeProfile.avatar_url || null;

  const profilePayload = {
    first_name: firstName || null,
    last_name: lastName || null,
    display_name: displayName || beforeProfile.email?.split('@')[0] || null,
    aircall_user_id: aircallUserId,
    currency_code: currencyCode,
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedProfile, error: updateError } = await serviceClient
    .from('users')
    .update(profilePayload)
    .eq('id', user.id)
    .eq('organization_id', user.organizationId)
    .select('id,email,first_name,last_name,display_name,aircall_user_id,currency_code,avatar_url')
    .single();

  if (updateError) throw updateError;

  const { error: authUpdateError } = await serviceClient.auth.admin.updateUserById(user.id, {
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      display_name: displayName,
      avatar_url: avatarUrl,
    },
  });
  if (authUpdateError) console.warn('Could not sync profile display metadata', authUpdateError);

  await writeAuditLog(
    serviceClient,
    user,
    'workspace_user.profile_updated',
    'user',
    user.id,
    { firstName: beforeProfile.first_name, lastName: beforeProfile.last_name, displayName: beforeProfile.display_name, aircallUserId: beforeProfile.aircall_user_id, currencyCode: normalizeCurrencyCode(beforeProfile.currency_code) || '', avatarUrl: beforeProfile.avatar_url || '' },
    { firstName: updatedProfile.first_name, lastName: updatedProfile.last_name, displayName: updatedProfile.display_name, aircallUserId: updatedProfile.aircall_user_id, currencyCode: normalizeCurrencyCode(updatedProfile.currency_code) || '', avatarUrl: updatedProfile.avatar_url || '' },
  );

  return {
    profile: {
      id: updatedProfile.id,
      email: updatedProfile.email,
      firstName: updatedProfile.first_name || '',
      lastName: updatedProfile.last_name || '',
      displayName: updatedProfile.display_name || '',
      aircallUserId: updatedProfile.aircall_user_id || '',
      currencyCode: normalizeCurrencyCode(updatedProfile.currency_code) || 'GBP',
      avatarUrl: updatedProfile.avatar_url || '',
    },
  };
}

async function updateWorkspaceUserRole(req, input = {}) {
  const user = await getAuthenticatedCrmUserWithOrganization(req);
  assertAdmin(user);

  const targetUserId = String(input.userId || '').trim();
  const nextRole = String(input.role || '').trim();
  if (!UUID_PATTERN.test(targetUserId)) {
    const error = new Error('Workspace user id is required.');
    error.statusCode = 400;
    throw error;
  }
  if (!['member', 'admin', 'org_admin'].includes(nextRole)) {
    const error = new Error('Workspace role must be member, admin, or org_admin.');
    error.statusCode = 400;
    throw error;
  }
  if (targetUserId === user.id) {
    const error = new Error('You cannot change your own admin access.');
    error.statusCode = 400;
    throw error;
  }
  if (!isOrgAdminRole(user.role) && nextRole === 'org_admin') {
    const error = new Error('Only org admins can assign org admin access.');
    error.statusCode = 403;
    throw error;
  }

  const serviceClient = getServiceClient();
  const { data: targetUser, error: targetError } = await serviceClient
    .from('users')
    .select('id,email,first_name,last_name,display_name,role,status,organization_id')
    .eq('id', targetUserId)
    .eq('organization_id', user.organizationId)
    .single();

  if (targetError || !targetUser) {
    const error = new Error('Workspace user was not found.');
    error.statusCode = 404;
    throw error;
  }
  if (isProtectedAdminRole(targetUser.role)) {
    const error = new Error('Workspace owners and platform admins cannot be changed here.');
    error.statusCode = 403;
    throw error;
  }
  if (!isOrgAdminRole(user.role) && targetUser.role === 'org_admin') {
    const error = new Error('Only org admins can change org admin access.');
    error.statusCode = 403;
    throw error;
  }

  const beforeRole = targetUser.role || 'member';
  const { data: updatedUser, error: updateError } = await serviceClient
    .from('users')
    .update({ role: nextRole })
    .eq('id', targetUserId)
    .eq('organization_id', user.organizationId)
    .select('id,email,first_name,last_name,display_name,role,status')
    .single();

  if (updateError) throw updateError;

  await writeAuditLog(
    serviceClient,
    user,
    'workspace_user.role_updated',
    'user',
    targetUserId,
    { role: beforeRole },
    { role: updatedUser.role },
    { target_email: updatedUser.email },
  );

  return {
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      displayName: updatedUser.display_name,
      role: updatedUser.role || 'member',
      status: updatedUser.status || 'active',
    },
    role: user.role,
    isAdmin: isAdminRole(user.role),
    isOrgAdmin: isOrgAdminRole(user.role),
  };
}

async function assertCognismPreviewEnabled(req) {
  if (canUseLocalCognismPreviewFallback() && !hasSupabaseServiceCredentials()) return null;

  const user = await getAuthenticatedCrmUserWithOrganization(req);
  const serviceClient = getServiceClient();
  const metadata = await loadOrganizationMetadata(serviceClient, user.organizationId);
  const settings = normalizeAdminSettings(metadata[ADMIN_SETTINGS_METADATA_KEY]);
  if (settings.cognism_preview_enabled) return user;

  const error = new Error('Cognism preview is disabled by an administrator.');
  error.statusCode = 403;
  throw error;
}

async function archiveContact(req, input = {}) {
  const contactId = String(input.contactId || '').trim();
  if (!contactId) {
    const error = new Error('Contact id is required');
    error.statusCode = 400;
    throw error;
  }

  const user = await getAuthenticatedCrmUserWithOrganization(req);
  assertAdmin(user);
  const serviceClient = getServiceClient();
  const metadata = await loadOrganizationMetadata(serviceClient, user.organizationId);
  const settings = normalizeAdminSettings(metadata[ADMIN_SETTINGS_METADATA_KEY]);
  if (!settings.contact_deletion_enabled) {
    const error = new Error('Contact deletion is disabled by an administrator.');
    error.statusCode = 403;
    throw error;
  }

  if (!UUID_PATTERN.test(contactId)) {
    const error = new Error('Contact must be a database-backed record before it can be archived.');
    error.statusCode = 400;
    throw error;
  }

  const { data: contact, error: loadError } = await serviceClient
    .from('contacts')
    .select('id,contact_name,full_name,email,status,custom_fields')
    .eq('organization_id', user.organizationId)
    .eq('id', contactId)
    .single();

  if (loadError || !contact) {
    const error = new Error('Contact was not found.');
    error.statusCode = 404;
    throw error;
  }

  const { error: archiveError } = await serviceClient
    .from('contacts')
    .update({
      status: 'archived',
      custom_fields: {
        ...(contact.custom_fields || {}),
        ui_status: 'Archived',
        archived_at: new Date().toISOString(),
      },
      updated_by: user.id,
    })
    .eq('organization_id', user.organizationId)
    .eq('id', contactId);

  if (archiveError) throw archiveError;
  await writeAuditLog(serviceClient, user, 'contact.archived', 'contact', contactId, contact, { ...contact, status: 'Archived' }, { source: 'admin_controls', contact_id: contactId });
  return { contactId, contact: { ...contact, status: 'Archived' } };
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function configuredEnv(keys) {
  return Object.fromEntries(keys.map(key => [key, Boolean(process.env[key])]));
}

function getGooglePlacesApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
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
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

function getEnvironmentCredentialStatus(provider) {
  if (provider === 'cognism') return { configured: Boolean(process.env.COGNISM_API_KEY), hints: { apiKey: maskSecret(process.env.COGNISM_API_KEY) }, source: 'env' };
  if (provider === 'aircall') {
    const configured = Boolean(process.env.AIRCALL_API_ID && process.env.AIRCALL_API_TOKEN);
    return {
      configured,
      hints: {
        apiId: maskSecret(process.env.AIRCALL_API_ID),
        apiToken: maskSecret(process.env.AIRCALL_API_TOKEN),
      },
      source: 'env',
    };
  }
  if (provider === 'hubspot') return { configured: Boolean(process.env.HUBSPOT_PRIVATE_APP_TOKEN), hints: { privateAppToken: maskSecret(process.env.HUBSPOT_PRIVATE_APP_TOKEN) }, source: 'env' };
  return { configured: false, hints: {}, source: 'none' };
}

function canUseLocalCognismPreviewFallback() {
  return process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'production';
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
  if (canUseLocalCognismPreviewFallback() && !hasSupabaseServiceCredentials()) {
    const providers = Object.keys(integrationSecretFields);
    return {
      providers: Object.fromEntries(providers.map(provider => [provider, getEnvironmentCredentialStatus(provider)])),
    };
  }

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

function normalizeGooglePlace(place = {}) {
  const addressComponents = Array.isArray(place.addressComponents) ? place.addressComponents : [];
  const findAddressComponent = type => addressComponents.find(component => (component.types || []).includes(type))?.longText || '';
  const country = findAddressComponent('country');
  const city = findAddressComponent('postal_town') || findAddressComponent('locality') || findAddressComponent('administrative_area_level_2');
  const postcode = findAddressComponent('postal_code');
  const primaryType = place.primaryType || place.types?.[0] || 'store';
  const photoName = Array.isArray(place.photos) ? place.photos[0]?.name || '' : '';
  return {
    id: place.id || place.name || `place-${Math.random().toString(36).slice(2)}`,
    placeId: place.id || '',
    name: place.displayName?.text || place.displayName || 'Unnamed place',
    industry: place.primaryTypeDisplayName?.text || primaryType.split('_').map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' '),
    placeType: primaryType,
    address: place.formattedAddress || place.shortFormattedAddress || '',
    city,
    country,
    postcode,
    phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
    website: place.websiteUri || place.googleMapsUri || '',
    lat: place.location?.latitude || null,
    lng: place.location?.longitude || null,
    hours: place.currentOpeningHours?.weekdayDescriptions?.[0] || place.regularOpeningHours?.weekdayDescriptions?.[0] || '',
    photo: photoName ? `/api/google-places/photo?name=${encodeURIComponent(photoName)}` : '',
    photoName,
    score: 72,
    footfall: '',
    access: '',
    fit: 'Google Places match. Confirm frontage, access hours, power, landlord approval, and installation space before outreach.',
    source: 'Google Places',
    status: 'New prospect',
  };
}

async function proxyGooglePlacePhoto(req, res) {
  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    sendJson(res, 503, { error: 'Google Places API key is not configured.' });
    return true;
  }

  const url = new URL(req.url, 'http://localhost');
  const photoName = String(url.searchParams.get('name') || '').trim();
  if (!photoName || !photoName.startsWith('places/')) {
    sendJson(res, 400, { error: 'A valid Google Places photo name is required.' });
    return true;
  }

  try {
    const photoUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
    photoUrl.searchParams.set('maxWidthPx', '720');
    photoUrl.searchParams.set('maxHeightPx', '420');
    photoUrl.searchParams.set('key', apiKey);
    const response = await fetch(photoUrl);
    if (!response.ok) {
      sendJson(res, response.status, { error: 'Google Places photo request failed.' });
      return true;
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const bytes = Buffer.from(await response.arrayBuffer());
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(bytes);
  } catch (error) {
    sendJson(res, 500, { error: error?.message || 'Google Places photo request failed.' });
  }
  return true;
}

async function searchGooglePlaces(input = {}) {
  const apiKey = getGooglePlacesApiKey();
  if (!apiKey) {
    const error = new Error('Google Places API key is not configured. Add GOOGLE_PLACES_API_KEY or GOOGLE_MAPS_API_KEY to the server environment.');
    error.statusCode = 503;
    throw error;
  }

  const city = String(input.city || '').trim();
  const country = String(input.country || '').trim();
  const postcode = String(input.postcode || '').trim();
  const includedTypes = Array.isArray(input.placeTypes) ? input.placeTypes.filter(Boolean).slice(0, 8) : [];
  const customIndustryQueries = Array.isArray(input.customIndustryQueries)
    ? input.customIndustryQueries.map(value => String(value || '').trim()).filter(Boolean).slice(0, 6)
    : [];
  const queryLocation = [city, postcode, country].filter(Boolean).join(', ') || 'London, United Kingdom';
  const typeQueries = includedTypes;
  const searchQueries = [
    ...typeQueries.map(placeType => ({
      textQuery: `${placeType.replaceAll('_', ' ')} near ${queryLocation}`,
      includedType: placeType,
    })),
    ...customIndustryQueries.map(query => ({
      textQuery: `${query} near ${queryLocation}`,
      includedType: '',
    })),
  ];
  if (!searchQueries.length) {
    return {
      source: 'google_places',
      places: [],
      message: 'Choose at least one industry filter or enter a custom industry.',
    };
  }
  const resultsById = new Map();

  for (const searchQuery of searchQueries) {
    const requestBody = {
      textQuery: searchQuery.textQuery,
      maxResultCount: 12,
    };
    if (searchQuery.includedType) requestBody.includedType = searchQuery.includedType;
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.addressComponents',
          'places.location',
          'places.primaryType',
          'places.primaryTypeDisplayName',
          'places.types',
          'places.internationalPhoneNumber',
          'places.nationalPhoneNumber',
          'places.websiteUri',
          'places.googleMapsUri',
          'places.photos',
          'places.currentOpeningHours',
          'places.regularOpeningHours',
        ].join(','),
      },
      body: JSON.stringify(requestBody),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error?.message || 'Google Places search failed.');
      error.statusCode = response.status;
      error.provider = 'google_places';
      error.providerStatus = response.status;
      throw error;
    }

    for (const place of payload.places || []) {
      const normalized = normalizeGooglePlace(place);
      const scoreBoost = {
        convenience_store: 24,
        gas_station: 22,
        supermarket: 16,
        train_station: 14,
        parking: 10,
        shopping_mall: 8,
      }[normalized.placeType] || 0;
      resultsById.set(normalized.placeId || normalized.id, {
        ...normalized,
        score: Math.min(96, 68 + scoreBoost),
      });
    }
  }

  return {
    source: 'google_places',
    places: [...resultsById.values()].sort((a, b) => Number(b.score || 0) - Number(a.score || 0)),
  };
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
      provider: error?.provider,
      providerStatus: error?.providerStatus,
      providerUrl: error?.providerUrl,
      path: req.url,
    });
    sendJson(res, error.statusCode || 500, {
      error: error.message || fallbackMessage,
      provider: error?.provider,
      providerStatus: error?.providerStatus,
    });
  }

  return true;
}

export async function handleApiRequest(req, res) {
  const rawPathname = new URL(req.url, 'http://localhost').pathname;
  const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, '') : rawPathname;

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
        'COGNISM_API_KEY',
        'HUBSPOT_PRIVATE_APP_TOKEN',
        'AIRCALL_API_ID',
        'AIRCALL_API_TOKEN',
        'AIRCALL_USER_ID',
        'GOOGLE_PLACES_API_KEY',
        'GOOGLE_MAPS_API_KEY',
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

  if (pathname === '/api/profile') {
    return handlePostRoute(req, res, async body => updateCurrentUserProfile(req, body), 'Profile update failed');
  }

  if (pathname === '/api/admin-settings') {
    if (req.method === 'GET') {
      try {
        sendJson(res, 200, await getAdminSettings(req));
      } catch (error) {
        sendJson(res, error.statusCode || 500, { error: error.message || 'Admin settings failed' });
      }
      return true;
    }

    if (req.method === 'POST') {
      try {
        sendJson(res, 200, await updateAdminSettings(req, await readJsonBody(req)));
      } catch (error) {
        sendJson(res, error.statusCode || 500, { error: error.message || 'Admin settings failed' });
      }
      return true;
    }

    sendJson(res, 405, { error: 'Method not allowed' });
    return true;
  }

  if (pathname === '/api/workspace-users/role') {
    return handlePostRoute(req, res, async body => updateWorkspaceUserRole(req, body), 'Workspace user role update failed');
  }

  if (pathname === '/api/google-places/search') {
    return handlePostRoute(req, res, async body => searchGooglePlaces(body), 'Google Places search failed');
  }

  if (pathname === '/api/google-places/photo') {
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Method not allowed' });
      return true;
    }
    return proxyGooglePlacePhoto(req, res);
  }

  if (pathname === '/api/contacts/archive') {
    return handlePostRoute(req, res, async body => archiveContact(req, body), 'Contact archive failed');
  }

  if (pathname === '/api/cognism/roles') {
    return handlePostRoute(req, res, async body => suggestTargetRoles(body), 'Role suggestion failed');
  }

  if (pathname === '/api/client-suggestions') {
    sendJson(res, 503, { error: 'Company lookup is disabled.' });
    return true;
  }

  if (pathname === '/api/account-suggestions') {
    sendJson(res, 503, { error: 'Account lookup is disabled.' });
    return true;
  }

  if (pathname === '/api/account-scripts') {
    sendJson(res, 503, { error: 'Script generation is disabled.' });
    return true;
  }

  if (pathname === '/api/cognism/preview') {
    return handlePostRoute(req, res, async body => {
      await assertCognismPreviewEnabled(req);
      const payload = await createCognismPreview(body, {
        apiKey: await getCredentialValue(req, 'cognism', 'apiKey', 'COGNISM_API_KEY'),
        allowLocalPreviewWithoutApiKey: canUseLocalCognismPreviewFallback(),
      });
      console.info('Lead Finder preview estimated credits used:', payload.estimatedCreditsUsed);
      return payload;
    }, 'Lead Finder preview failed');
  }

  if (pathname === '/api/cognism/redeem') {
    return handlePostRoute(req, res, async body => {
      await assertCognismPreviewEnabled(req);
      if (!(canUseLocalCognismPreviewFallback() && !hasSupabaseServiceCredentials())) {
        const user = await getAuthenticatedCrmUserWithOrganization(req);
        assertAdmin(user);
      }
      const payload = await redeemCognismContacts(body, {
        apiKey: await getCredentialValue(req, 'cognism', 'apiKey', 'COGNISM_API_KEY'),
        allowLocalRedeemWithoutApiKey: canUseLocalCognismPreviewFallback(),
      });
      console.info('Lead Finder redeem estimated credits used:', payload.estimatedCreditsUsed);
      return payload;
    }, 'Lead Finder redeem failed');
  }

  if (pathname === '/api/aircall/dial') {
    return handlePostRoute(req, res, async body => {
      const user = await getAuthenticatedCrmUserWithOrganization(req);
      return dialAircall(body, {
        userId: user.id,
        aircallUserId: user.aircallUserId,
        apiId: await getCredentialValue(req, 'aircall', 'apiId', 'AIRCALL_API_ID'),
        apiToken: await getCredentialValue(req, 'aircall', 'apiToken', 'AIRCALL_API_TOKEN'),
        getContactById: getRedeemedContactById,
        allowSavedLeadNumbers: true,
      });
    }, 'Aircall dial failed');
  }

  if (pathname === '/api/aircall/sync') {
    return handlePostRoute(req, res, async body => {
      const user = await getAuthenticatedCrmUserWithOrganization(req);
      assertAdmin(user);
      return syncAircallData({
        organizationId: user.organizationId,
        apiId: await getCredentialValue(req, 'aircall', 'apiId', 'AIRCALL_API_ID'),
        apiToken: await getCredentialValue(req, 'aircall', 'apiToken', 'AIRCALL_API_TOKEN'),
        perPage: body.perPage,
        maxUserPages: body.maxUserPages,
        maxCallPages: body.maxCallPages,
      }, {
        serviceClient: getServiceClient(),
      });
    }, 'Aircall sync failed');
  }

  if (pathname === '/api/aircall/recording-link') {
    return handlePostRoute(req, res, async body => {
      const user = await getAuthenticatedCrmUserWithOrganization(req);
      const callId = String(body.callId || body.aircallCallId || '').trim();
      const { data: callRow, error: callError } = await getServiceClient()
        .from('aircall_calls')
        .select('id,user_id,aircall_user_id')
        .eq('organization_id', user.organizationId)
        .eq('aircall_call_id', callId)
        .maybeSingle();
      if (callError) throw callError;
      if (!callRow) {
        const error = new Error('Aircall call is not synced in this workspace.');
        error.statusCode = 404;
        throw error;
      }
      const canAccessCall = isAdminRole(user.role)
        || callRow.user_id === user.id
        || (user.aircallUserId && callRow.aircall_user_id === user.aircallUserId);
      if (!canAccessCall) {
        const error = new Error('You can only refresh recordings for your own calls.');
        error.statusCode = 403;
        throw error;
      }
      return createTemporaryAircallRecordingLink({
        callId,
        apiId: await getCredentialValue(req, 'aircall', 'apiId', 'AIRCALL_API_ID'),
        apiToken: await getCredentialValue(req, 'aircall', 'apiToken', 'AIRCALL_API_TOKEN'),
      });
    }, 'Aircall recording link refresh failed');
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
