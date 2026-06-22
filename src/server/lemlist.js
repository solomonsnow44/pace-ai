export const LEMLIST_API_BASE_URL = "https://api.lemlist.com/api";
export const LEMLIST_ENV_KEYS = ["LEMLIST", "LEMLIST_API_KEY", "LEMLIST_KEY"];

const DEFAULT_CAMPAIGN_LIMIT = 50;
const DEFAULT_LEAD_LIMIT = 50;
const DEFAULT_CONTACT_LIMIT = 100;
const DEFAULT_COMPANY_LIMIT = 100;
const DEFAULT_PEOPLE_PROFILE_LIMIT = 25;

function compactString(value) {
  return String(value || "").trim();
}

function parsePositiveInteger(value, fallback, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number) || number < 1) return fallback;
  return Math.min(number, max);
}

function toIsoDate(value, fallback) {
  const date = value ? new Date(value) : fallback;
  if (Number.isNaN(date.getTime())) return fallback.toISOString();
  return date.toISOString();
}

function defaultStartDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date;
}

function buildQueryString(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

function parseResponseText(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function extractRateLimitHeaders(response) {
  return {
    retryAfter: response.headers.get("retry-after") || "",
    limit: response.headers.get("x-ratelimit-limit") || "",
    remaining: response.headers.get("x-ratelimit-remaining") || "",
    reset: response.headers.get("x-ratelimit-reset") || "",
  };
}

function normalizeArrayPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizePaginationPayload(payload) {
  return {
    records: normalizeArrayPayload(payload),
    total: Number.isFinite(Number(payload?.total)) ? Number(payload.total) : normalizeArrayPayload(payload).length,
    limit: Number.isFinite(Number(payload?.limit)) ? Number(payload.limit) : null,
    offset: Number.isFinite(Number(payload?.offset)) ? Number(payload.offset) : null,
  };
}

export function normalizeLinkedinLookupValue(value) {
  return compactString(value)
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function lemlistLinkedinUrlFromRecord(record = {}) {
  return compactString(
    record.linkedinUrl
    || record.fields?.linkedinUrl
    || record.leadLinkedinUrl
    || record.lead_linkedin_url
    || record.linkedin_url
  );
}

export function lemlistPeopleProfileLinkedinUrl(profile = {}) {
  return compactString(
    profile.lead_linkedin_url
    || profile.leadLinkedinUrl
    || profile.linkedinUrl
    || profile.linkedin_url
    || profile.linkedin
  );
}

function lowerCompact(value) {
  return compactString(value).toLowerCase();
}

function lemlistFullNameFromRecord(record = {}) {
  return compactString(
    record.fullName
    || record.full_name
    || record.name
    || [record.firstName || record.fields?.firstName, record.lastName || record.fields?.lastName].filter(Boolean).join(" ")
  );
}

function lemlistPeopleProfileFullName(profile = {}) {
  return compactString(profile.full_name || profile.fullName || profile.name);
}

function compactIdSet(values = []) {
  return new Set(values.map(lowerCompact).filter(Boolean));
}

function lemlistRecordContactIds(record = {}) {
  const id = compactString(record.id || record._id);
  return [
    record.contactId,
    record.lemlistContactId,
    record.provider_contact_id,
    record.providerContactId,
    record.fields?.contactId,
    id.startsWith("ctc_") ? id : "",
  ];
}

function lemlistRecordLeadIds(record = {}) {
  const id = compactString(record.id || record._id);
  return [
    record.leadId,
    record.lemlistLeadId,
    record.provider_lead_id,
    record.providerLeadId,
    record.fields?.leadId,
    id.startsWith("lea_") ? id : "",
  ];
}

function lemlistPeopleProfileContactIds(profile = {}) {
  const id = compactString(profile.id || profile._id);
  return [
    profile.provider_contact_id,
    profile.providerContactId,
    profile.contactId,
    profile.lemlistContactId,
    id.startsWith("ctc_") ? id : "",
  ];
}

function lemlistPeopleProfileLeadIds(profile = {}) {
  const id = compactString(profile.id || profile._id);
  return [
    profile.provider_lead_id,
    profile.providerLeadId,
    profile.leadId,
    profile.lemlistLeadId,
    id.startsWith("lea_") ? id : "",
  ];
}

function peopleProfileStableKey(profile = {}) {
  const linkedinKey = normalizeLinkedinLookupValue(lemlistPeopleProfileLinkedinUrl(profile));
  if (linkedinKey) return `linkedin:${linkedinKey}`;
  const contactId = [...compactIdSet(lemlistPeopleProfileContactIds(profile))][0];
  if (contactId) return `contact:${contactId}`;
  const leadId = [...compactIdSet(lemlistPeopleProfileLeadIds(profile))][0];
  if (leadId) return `lead:${leadId}`;
  const name = lowerCompact(lemlistPeopleProfileFullName(profile));
  return name ? `name:${name}` : "";
}

function uniquePeopleProfiles(profiles = []) {
  const byKey = new Map();
  for (const profile of Array.isArray(profiles) ? profiles : []) {
    const key = peopleProfileStableKey(profile);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, profile);
  }
  return [...byKey.values()];
}

function peopleProfileByLinkedinKey(peopleProfiles = []) {
  return (Array.isArray(peopleProfiles) ? peopleProfiles : []).reduce((map, profile) => {
    const key = normalizeLinkedinLookupValue(lemlistPeopleProfileLinkedinUrl(profile));
    if (key && !map.has(key)) map.set(key, profile);
    return map;
  }, new Map());
}

function storedPeopleProfilesForRecords(peopleProfiles = [], records = []) {
  const linkedinKeys = new Set();
  const contactIds = new Set();
  const leadIds = new Set();
  const names = new Set();

  for (const record of Array.isArray(records) ? records : []) {
    const linkedinKey = normalizeLinkedinLookupValue(lemlistLinkedinUrlFromRecord(record));
    if (linkedinKey) linkedinKeys.add(linkedinKey);
    compactIdSet(lemlistRecordContactIds(record)).forEach(id => contactIds.add(id));
    compactIdSet(lemlistRecordLeadIds(record)).forEach(id => leadIds.add(id));
    const name = lowerCompact(lemlistFullNameFromRecord(record));
    if (name) names.add(name);
  }

  return uniquePeopleProfiles((Array.isArray(peopleProfiles) ? peopleProfiles : []).filter(profile => {
    const linkedinKey = normalizeLinkedinLookupValue(lemlistPeopleProfileLinkedinUrl(profile));
    if (linkedinKey && linkedinKeys.has(linkedinKey)) return true;
    if (lemlistPeopleProfileContactIds(profile).some(id => contactIds.has(lowerCompact(id)))) return true;
    if (lemlistPeopleProfileLeadIds(profile).some(id => leadIds.has(lowerCompact(id)))) return true;
    const name = lowerCompact(lemlistPeopleProfileFullName(profile));
    return Boolean(name && names.has(name));
  }));
}

function uniquePeopleProfileLinkedinUrls(records = [], limit = DEFAULT_PEOPLE_PROFILE_LIMIT) {
  const seen = new Set();
  const urls = [];
  for (const record of records) {
    const url = lemlistLinkedinUrlFromRecord(record);
    const key = normalizeLinkedinLookupValue(url);
    if (!url || !key || seen.has(key)) continue;
    seen.add(key);
    urls.push(url);
    if (urls.length >= limit) break;
  }
  return urls;
}

function responseRawMessage(payload) {
  const raw = compactString(payload?.raw);
  if (!raw || /^\s*</.test(raw)) return "";
  return raw.length > 220 ? `${raw.slice(0, 220)}...` : raw;
}

function responseErrorMessage(payload, fallback) {
  return compactString(payload?.message)
    || compactString(payload?.error)
    || compactString(payload?.details)
    || responseRawMessage(payload)
    || fallback;
}

function pathFromProviderUrl(providerUrl) {
  try {
    const url = new URL(providerUrl);
    return url.pathname;
  } catch {
    return "";
  }
}

export function getLemlistEnvApiKey(env = process.env) {
  return LEMLIST_ENV_KEYS.map(key => compactString(env[key])).find(Boolean) || "";
}

export function buildLemlistAuthorizationHeader(apiKey) {
  return `Basic ${Buffer.from(`:${compactString(apiKey)}`).toString("base64")}`;
}

export async function lemlistRequest(path, options = {}) {
  const apiKey = compactString(options.apiKey);
  if (!apiKey) {
    const error = new Error("Lemlist API key is not configured. Add LEMLIST or LEMLIST_API_KEY to the server environment.");
    error.statusCode = 503;
    error.provider = "lemlist";
    throw error;
  }

  const fetcher = options.fetcher || fetch;
  const url = `${LEMLIST_API_BASE_URL}${path}${buildQueryString(options.query)}`;
  const response = await fetcher(url, {
    method: options.method || "GET",
    headers: {
      Authorization: buildLemlistAuthorizationHeader(apiKey),
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const payload = parseResponseText(text);
  const rateLimit = extractRateLimitHeaders(response);
  if (!response.ok) {
    const error = new Error(responseErrorMessage(payload, "Lemlist request failed"));
    error.statusCode = response.status;
    error.provider = "lemlist";
    error.providerStatus = response.status;
    error.providerUrl = url;
    error.payload = payload;
    error.rateLimit = rateLimit;
    throw error;
  }

  return { payload, rateLimit };
}

function errorSummary(error) {
  return {
    message: error?.message || "Lemlist request failed",
    statusCode: error?.statusCode || error?.providerStatus || null,
    endpoint: pathFromProviderUrl(error?.providerUrl),
  };
}

async function optionalRequest(name, requestPromise) {
  try {
    return { name, ok: true, ...(await requestPromise) };
  } catch (error) {
    return { name, ok: false, error: errorSummary(error), rateLimit: error?.rateLimit || null };
  }
}

async function lemlistCampaignLeadsRequest(campaignId, options = {}) {
  const encodedCampaignId = encodeURIComponent(campaignId);
  try {
    return await lemlistRequest(`/campaigns/${encodedCampaignId}/leads/`, options);
  } catch (error) {
    const statusCode = Number(error?.statusCode || error?.providerStatus);
    if (![404, 405].includes(statusCode)) throw error;
    return lemlistRequest(`/campaigns/${encodedCampaignId}/leads`, options);
  }
}

export async function createLemlistOverview(input = {}, options = {}) {
  const apiKey = options.apiKey ?? getLemlistEnvApiKey();
  const fetcher = options.fetcher || fetch;
  const campaignLimit = parsePositiveInteger(input.campaignLimit, DEFAULT_CAMPAIGN_LIMIT, 100);
  const leadLimit = parsePositiveInteger(input.leadLimit, DEFAULT_LEAD_LIMIT, 500);
  const contactLimit = parsePositiveInteger(input.contactLimit, DEFAULT_CONTACT_LIMIT, 100);
  const companyLimit = parsePositiveInteger(input.companyLimit, DEFAULT_COMPANY_LIMIT, 100);
  const peopleProfileLimit = parsePositiveInteger(input.peopleProfileLimit, DEFAULT_PEOPLE_PROFILE_LIMIT, 50);
  const endDate = toIsoDate(input.endDate, new Date());
  const startDate = toIsoDate(input.startDate, defaultStartDate());

  const campaignResult = await lemlistRequest("/campaigns", {
    apiKey,
    fetcher,
    query: {
      limit: campaignLimit,
      sortBy: "createdAt",
      sortOrder: "desc",
      status: input.status,
    },
  });
  const campaigns = normalizeArrayPayload(campaignResult.payload);
  const requestedCampaignId = compactString(input.campaignId);
  const selectedCampaign = campaigns.find(campaign => campaign?._id === requestedCampaignId) || campaigns[0] || null;
  const selectedCampaignId = selectedCampaign?._id || requestedCampaignId;
  const selectedLeadState = compactString(input.leadState);

  const optionalRequests = [
    optionalRequest("credits", lemlistRequest("/team/credits", { apiKey, fetcher })),
    optionalRequest("contacts", lemlistRequest("/contacts", {
      apiKey,
      fetcher,
      query: {
        limit: contactLimit,
        offset: input.contactOffset || 0,
        search: input.contactSearch,
        email: input.contactEmail,
        listId: input.contactListId,
        notInAnyCampaign: input.notInAnyCampaign,
      },
    })),
    optionalRequest("companies", lemlistRequest("/companies", {
      apiKey,
      fetcher,
      query: {
        limit: companyLimit,
        offset: input.companyOffset || 0,
        idsOrDomains: input.companyIdsOrDomains,
      },
    })),
    optionalRequest("contactLists", lemlistRequest("/contacts/lists", {
      apiKey,
      fetcher,
      query: { search: input.contactListSearch },
    })),
  ];

  if (selectedCampaignId) {
    optionalRequests.push(optionalRequest("stats", lemlistRequest(`/v2/campaigns/${encodeURIComponent(selectedCampaignId)}/stats`, {
      apiKey,
      fetcher,
      query: { startDate, endDate },
    })));
    optionalRequests.push(optionalRequest("leads", lemlistCampaignLeadsRequest(selectedCampaignId, {
      apiKey,
      fetcher,
      query: { limit: leadLimit, state: selectedLeadState },
    })));
  }

  const results = await Promise.all(optionalRequests);
  const byName = Object.fromEntries(results.map(result => [result.name, result]));
  const contactPage = byName.contacts?.ok ? normalizePaginationPayload(byName.contacts.payload) : { records: [], total: 0, limit: null, offset: null };
  const companyPage = byName.companies?.ok ? normalizePaginationPayload(byName.companies.payload) : { records: [], total: 0, limit: null, offset: null };
  const leadRecords = byName.leads?.ok ? normalizeArrayPayload(byName.leads.payload) : [];
  const peopleProfileCandidateRecords = [
    ...contactPage.records,
    ...leadRecords,
  ];
  const candidatePeopleProfileLinkedinUrls = uniquePeopleProfileLinkedinUrls(peopleProfileCandidateRecords, Math.min(contactLimit + leadLimit, 600));
  const storedPeopleProfileByKey = peopleProfileByLinkedinKey(options.storedPeopleProfiles);
  const storedPeopleProfiles = storedPeopleProfilesForRecords(options.storedPeopleProfiles, peopleProfileCandidateRecords);
  const peopleProfileLinkedinUrls = input.includePeopleProfiles === false ? [] : candidatePeopleProfileLinkedinUrls
    .filter(url => !storedPeopleProfileByKey.has(normalizeLinkedinLookupValue(url)))
    .slice(0, peopleProfileLimit);
  const peopleProfileResult = peopleProfileLinkedinUrls.length ? await optionalRequest("peopleProfiles", lemlistRequest("/database/people", {
    apiKey,
    fetcher,
    method: "POST",
    body: {
      filters: [{ filterId: "leadLinkedInUrl", in: peopleProfileLinkedinUrls, out: [] }],
      page: 1,
      size: Math.min(peopleProfileLinkedinUrls.length, peopleProfileLimit),
    },
  })) : null;
  const fetchedPeopleProfiles = peopleProfileResult?.ok ? normalizeArrayPayload(peopleProfileResult.payload) : [];
  const peopleProfiles = uniquePeopleProfiles([
    ...storedPeopleProfiles,
    ...fetchedPeopleProfiles,
  ]);
  const allResults = peopleProfileResult ? [...results, peopleProfileResult] : results;
  const firstRateLimit = [
    campaignResult.rateLimit,
    ...allResults.map(result => result.rateLimit),
  ].find(rateLimit => rateLimit && Object.values(rateLimit).some(Boolean)) || null;

  return {
    campaigns,
    selectedCampaignId,
    selectedCampaign,
    dateRange: { startDate, endDate },
    credits: byName.credits?.ok ? byName.credits.payload : null,
    contacts: contactPage.records,
    contactPagination: { total: contactPage.total, limit: contactPage.limit, offset: contactPage.offset },
    companies: companyPage.records,
    companyPagination: { total: companyPage.total, limit: companyPage.limit, offset: companyPage.offset },
    peopleProfiles,
    peopleProfilePagination: peopleProfileResult?.ok ? {
      total: Number.isFinite(Number(peopleProfileResult.payload?.total)) ? Number(peopleProfileResult.payload.total) : peopleProfiles.length,
      limit: peopleProfileResult.payload?.size || peopleProfileLimit,
      offset: null,
    } : { total: peopleProfiles.length, limit: peopleProfileLimit, offset: null },
    contactProfileEnrichment: {
      stored: storedPeopleProfiles.length,
      fetched: fetchedPeopleProfiles.length,
      requested: peopleProfileLinkedinUrls.length,
    },
    contactProfileEnrichmentsToStore: fetchedPeopleProfiles,
    contactLists: byName.contactLists?.ok ? normalizeArrayPayload(byName.contactLists.payload) : [],
    stats: byName.stats?.ok ? byName.stats.payload : null,
    leads: leadRecords,
    errors: Object.fromEntries(allResults.filter(result => !result.ok).map(result => [result.name, result.error])),
    rateLimit: firstRateLimit,
  };
}
