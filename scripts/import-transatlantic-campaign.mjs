import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const dryRun = process.argv.includes("--dry-run");
const skipContactImageEnrichment = process.env.SKIP_CONTACT_IMAGE_ENRICHMENT === "1";
const sourceName = "transatlantic_campaign_xlsx";
const bucket = "client-campaign-images";
const profileBucket = "profile-images";
const targetClientName = "Paceops";
const targetCampaignName = "Transatlantic List 1";
const inputPath = path.resolve("transatlantic_campaign.xlsx");
const prospectSheet = "Prospect List";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const contactLinkedInLookupCache = new Map();

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith("#") && line.includes("="))
      .map(line => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      }),
  );
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
}
if (!fs.existsSync(inputPath)) {
  throw new Error(`Missing file at ${inputPath}.`);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

function normalize(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeKey(value = "") {
  return normalize(value).toLowerCase();
}

function sanitizeStorageName(value = "image") {
  return String(value || "image")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}

function splitName(value = "") {
  const parts = normalize(value).split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function domainFromWebsite(value = "") {
  const raw = normalize(value);
  if (!raw) return "";
  const first = raw.split(/[,\s]+/).find(Boolean) || raw;
  const maybeWithProtocol = /^https?:\/\//i.test(first) ? first : `https://${first}`;
  try {
    return new URL(maybeWithProtocol).hostname.replace(/^www\./i, "");
  } catch {
    return first.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
  }
}

function normalizeUrl(value = "") {
  const raw = normalize(value);
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  return `https://${raw}`;
}

function parseIntField(value = "") {
  const raw = normalize(value).replace(/,/g, "").replace(/[^\d.-]/g, "");
  if (!raw) return null;
  const number = Number(raw);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : null;
}

function parseMoneyField(value = "") {
  const raw = normalize(value).replace(/,/g, "").toLowerCase();
  if (!raw) return null;
  const match = raw.match(/([0-9]+(?:\.[0-9]+)?)(?:\s*[-–]\s*([0-9]+(?:\.[0-9]+)?))?(?:\s*(k|m|mm|b|bn))?/i);
  if (!match) return null;
  const left = Number(match[1]);
  const right = match[2] ? Number(match[2]) : null;
  const unit = (match[3] || "").toLowerCase();
  const multiplier = {
    k: 1_000,
    m: 1_000_000,
    mm: 1_000_000,
    b: 1_000_000_000,
    bn: 1_000_000_000,
  }[unit] || 1;
  const estimate = right != null ? (left + right) / 2 : left;
  if (!Number.isFinite(estimate)) return null;
  const amount = estimate * multiplier;
  return amount > 0 ? amount : null;
}

function toSafeEmail(value = "") {
  const raw = normalize(value).toLowerCase();
  if (!raw) return "";
  if (raw.includes("@")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : "";
  }
  return "";
}

function buildContactEmail(pattern = "", fullName = "", website = "") {
  const rawPattern = normalize(pattern);
  if (!rawPattern) return "";
  const domain = domainFromWebsite(website);
  if (!domain) return "";
  const cleanDomain = domain;
  const { firstName, lastName } = splitName(fullName);
  const firstLower = normalize(firstName).toLowerCase().replace(/[^a-z]/g, "");
  const lastLower = normalize(lastName).toLowerCase().replace(/[^a-z]/g, "");
  if (!firstLower && !lastLower) return "";
  let candidate = rawPattern
    .toLowerCase()
    .replace(/\bfirstname\b/g, firstLower || "firstname")
    .replace(/\bfirst\b/g, firstLower || "firstname")
    .replace(/\blastname\b/g, lastLower || "lastname")
    .replace(/\blast\b/g, lastLower || "lastname")
    .replace(/\bfirst\.last\b/g, [firstLower, lastLower].filter(Boolean).join("."))
    .replace(/\bfirst_?last\b/g, [firstLower, lastLower].filter(Boolean).join(""))
    .replace(/\bfirst\.?lastname\b/g, [firstLower, lastLower].filter(Boolean).join(""))
    .replace(/\bfirstname\.last\b/g, [firstLower, lastLower].filter(Boolean).join("."))
    .replace(/\bfirstinitial\b/g, firstLower ? firstLower[0] || "" : "")
    .replace(/\blastinitial\b/g, lastLower ? lastLower[0] || "" : "");
  if (candidate.includes("firstname") || candidate.includes("lastname")) return "";
  if (!candidate.includes("@")) candidate = `${candidate}@${cleanDomain}`;
  const final = candidate.includes("@") ? candidate : `${candidate}@${cleanDomain}`;
  return toSafeEmail(final);
}

function extractLinkedInFromSearchHtml(html = "") {
  if (!html) return "";
  const redirectPattern = /uddg=([^&"']+)/g;
  let redirectMatch;
  while ((redirectMatch = redirectPattern.exec(html))) {
    try {
      const raw = decodeURIComponent(redirectMatch[1]);
      const normalized = normalizeLinkedIn(raw);
      if (normalized) {
        try {
          const url = new URL(normalized);
          if (url.pathname.toLowerCase().includes("/in/")) return normalized;
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore malformed decode
    }
  }

  const inlineMatch = html.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-z0-9._-]+/gi);
  if (inlineMatch?.length) {
    for (const match of inlineMatch) {
      const normalized = normalizeLinkedIn(match);
      if (normalized) {
        try {
          const url = new URL(normalized);
          if (url.pathname.toLowerCase().includes("/in/")) return normalized;
        } catch {
          // ignore
        }
      }
    }
  }

  return "";
}

async function lookupContactLinkedIn(contactName = "", companyName = "") {
  if (!contactName || !companyName) return "";
  const cacheKey = `${normalizeKey(contactName)}|${normalizeKey(companyName)}`;
  if (contactLinkedInLookupCache.has(cacheKey)) {
    return contactLinkedInLookupCache.get(cacheKey);
  }

  const query = `${contactName} ${companyName} site:linkedin.com/in`;
  const searchUrl = `https://r.jina.ai/http://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const fallbackResponse = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PaceOpsContactLookup/1.0)",
        },
        signal: controller.signal,
      });
      if (fallbackResponse.ok) {
        const fallbackHtml = await fallbackResponse.text();
        const foundFallback = extractLinkedInFromSearchHtml(fallbackHtml);
        if (foundFallback) {
          contactLinkedInLookupCache.set(cacheKey, foundFallback);
          return foundFallback;
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    // ignore fallback failures
  }

  contactLinkedInLookupCache.set(cacheKey, "");
  return "";
}

async function preloadContactLinkedInMappings(rowItems, concurrency = 4) {
  const queue = [...rowItems];
  let index = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(concurrency, queue.length)) }, async () => {
    while (index < queue.length) {
      const item = queue[index++];
      if (!item?.contactName || !item?.companyName) {
        // should not happen
        continue;
      }
      if (!item.contactLinkedIn) {
        const lookup = await lookupContactLinkedIn(item.contactName, item.companyName);
        item.contactLinkedIn = lookup || "";
      }
    }
  });
  await Promise.all(workers);
}

function parseLinkedIn(raw = "") {
  const value = normalize(raw).replace(/^mailto:/i, "");
  if (!value) return "";
  const hasHttp = /^https?:\/\//i.test(value);
  if (value.includes("linkedin.com")) return hasHttp ? value : `https://${value}`;
  return "";
}

function normalizeLinkedIn(raw = "", fallbackDomain = "") {
  const value = parseLinkedIn(raw);
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    if (fallbackDomain && value.includes("linkedin.com/")) return value;
    return "";
  }
}

function splitLinkedInUrls(linkedin = "") {
  const url = normalizeLinkedIn(linkedin);
  if (!url) return { person: "", company: "" };
  const pathname = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return "";
    }
  })();
  if (pathname.includes("/in/")) return { person: url, company: "" };
  if (pathname.includes("/company/")) return { person: "", company: url };
  return { person: "", company: url };
}

function isPersonLinkedInUrl(linkedin = "") {
  const url = normalizeLinkedIn(linkedin);
  if (!url) return false;
  try {
    return new URL(url).pathname.toLowerCase().includes("/in/");
  } catch {
    return false;
  }
}

function isCompanyLinkedInUrl(linkedin = "") {
  const url = normalizeLinkedIn(linkedin);
  if (!url) return false;
  try {
    return new URL(url).pathname.toLowerCase().includes("/company/");
  } catch {
    return false;
  }
}

function shouldReplaceContactLinkedIn(current = "", next = "") {
  const nextUrl = normalizeLinkedIn(next);
  if (!nextUrl) return false;
  if (!current) return true;
  return isPersonLinkedInUrl(nextUrl) && (isCompanyLinkedInUrl(current) || !isPersonLinkedInUrl(current));
}

function extractMetadata(row) {
  const website = normalize(row["Website"]);
  const linkedInRaw = normalize(row["LinkedIn"]);
  const companyName = normalize(row["Company Name"]);
  const contactName = normalize(row["Key Decision Maker"]);
  const usExpansionSignal = normalize(row["US Expansion Signal"]);
  const icpFitScoreRaw = normalize(row["ICP Fit Score\r\n(1-5)"]);
  const parsedIcpFitScore = Number.parseFloat(icpFitScoreRaw);
  const notes = [
    normalize(row["Notes / Trigger"]),
    usExpansionSignal ? `US Expansion Signal: ${usExpansionSignal}` : "",
    Number.isFinite(parsedIcpFitScore) ? `ICP Fit Score: ${parsedIcpFitScore}` : "",
  ].filter(Boolean).join(" | ");
  const { person: contactLinkedIn, company: companyLinkedIn } = splitLinkedInUrls(linkedInRaw);
  return {
    companyName,
    industry: normalize(row["Sector / Niche"]),
    location: normalize(row["HQ City"]),
    headcount: parseIntField(row["Est. Headcount"]),
    annualRevenue: parseMoneyField(row["Est. ARR (€)"]),
    website,
    usExpansionSignal,
    companyLinkedIn,
    notes: notes || "",
    contactName,
    contactTitle: normalize(row["Title"]),
    contactEmailPattern: normalize(row["Email Pattern"]),
    contactLinkedIn,
    icpFitScore: Number.isFinite(parsedIcpFitScore) ? parsedIcpFitScore : null,
  };
}

function extractRows() {
  const workbook = XLSX.readFile(inputPath, { cellDates: false });
  const sheet = workbook.Sheets[prospectSheet];
  if (!sheet) throw new Error(`Could not find sheet "${prospectSheet}".`);
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  return rows
    .map(extractMetadata)
    .filter(item => item.companyName && item.website && item.contactName);
}

async function rest(pathName, options = {}) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${pathName}`, {
        ...options,
        headers: { ...headers, ...(options.headers || {}) },
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`${options.method || "GET"} ${pathName} failed ${response.status}: ${text}`);
      }
      return text ? JSON.parse(text) : [];
    } catch (error) {
      if (
        attempt === 5
        || !/(fetch failed|UND_ERR_SOCKET|GOAWAY|ECONNRESET|ETIMEDOUT|ENOTFOUND|aborted)/i.test(String(error?.message || error))
      ) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, attempt * 750));
    }
  }
  return [];
}

async function restAll(pathName) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const separator = pathName.includes("?") ? "&" : "?";
    const page = await rest(`${pathName}${separator}limit=${pageSize}&offset=${offset}`);
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

function extractMissingColumn(error) {
  const message = String(error?.message || error);
  const match1 = message.match(/column "([a-z_][a-z0-9_]*)" does not exist/i);
  const match2 = message.match(/Could not find the '([a-z_][a-z0-9_]*)' column/i);
  const match3 = message.match(/column ([a-z_][a-z0-9_]*) does not exist/i);
  return (match1?.[1] || match2?.[1] || match3?.[1] || null);
}

async function insert(table, body) {
  if (dryRun) return { id: `dry-${table}-${Math.random().toString(36).slice(2)}`, ...body };
  let payload = { ...body };
  const dropped = new Set();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!Object.keys(payload).length) {
      const rows = await rest(table, { method: "POST", body: "{}" });
      return Array.isArray(rows) ? rows[0] : rows;
    }
    try {
      const rows = await rest(table, { method: "POST", body: JSON.stringify(payload) });
      return Array.isArray(rows) ? rows[0] : rows;
    } catch (error) {
      const missingColumn = extractMissingColumn(error);
      if (!missingColumn || !Object.prototype.hasOwnProperty.call(payload, missingColumn) || dropped.has(missingColumn)) {
        throw error;
      }
      dropped.add(missingColumn);
      delete payload[missingColumn];
    }
  }
  return {};
}

async function patch(table, id, body) {
  if (dryRun || !Object.keys(body).length) return { id, ...body };
  let payload = { ...body };
  const dropped = new Set();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!Object.keys(payload).length) return { id, ...body };
    try {
      const rows = await rest(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      return Array.isArray(rows) ? rows[0] : rows;
    } catch (error) {
      const missingColumn = extractMissingColumn(error);
      if (!missingColumn || !Object.prototype.hasOwnProperty.call(payload, missingColumn) || dropped.has(missingColumn)) {
        throw error;
      }
      dropped.add(missingColumn);
      delete payload[missingColumn];
    }
  }
  return { id, ...body };
}

function keyOrEmpty(value) {
  return normalizeKey(value || "");
}

function candidateContactIdentity(contactName = "", companyName = "") {
  return `person:${keyOrEmpty(contactName)}|${keyOrEmpty(companyName)}`;
}

function mergeCustomFields(existing = {}, additions = {}) {
  return { ...(existing || {}), ...additions };
}

function contentTypeToExtension(contentType = "") {
  const map = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[contentType?.toLowerCase()] || "png";
}

function isSupportedImageType(contentType = "") {
  return ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"].includes(contentType?.toLowerCase());
}

function normalizeNameForUpload(value = "") {
  return sanitizeStorageName(value || "asset").replace(/[-_]+/g, "-");
}

async function fetchImageBinary(url, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PaceOpsImporter/1.0)" },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/") || !isSupportedImageType(contentType)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) return null;
    return { bytes, contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchLogoImage(website = "", companyName = "") {
  const domain = domainFromWebsite(website);
  const attempts = [];
  if (domain) {
    attempts.push(`https://logo.clearbit.com/${encodeURIComponent(domain)}?size=256`);
    attempts.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`);
    attempts.push(`https://${domain.replace(/\/+$/, "")}/favicon.ico`);
    attempts.push(`${normalizeUrl(website)}/favicon.ico`);
  } else if (companyName) {
    attempts.push(`https://logo.clearbit.com/${encodeURIComponent(companyName)}.com?size=256`);
  }
  for (const candidate of attempts) {
    const result = await fetchImageBinary(candidate);
    if (result) return result;
  }
  return null;
}

async function fetchContactProfileImage(linkedin = "") {
  const personUrl = splitLinkedInUrls(linkedin).person;
  if (!personUrl) return null;
  try {
    const path = new URL(personUrl).pathname.replace(/\/+$/, "");
    const handle = path.split("/").filter(Boolean).pop();
    if (!handle) return null;
    const candidateUrls = [
      `https://unavatar.io/linkedin/${encodeURIComponent(handle)}`,
      `https://avatars.githubusercontent.com/u/${encodeURIComponent(handle)}?s=256`,
    ];
    for (const candidate of candidateUrls) {
      const binary = await fetchImageBinary(candidate, 10000);
      if (binary) return binary;
    }
  } catch {
    return null;
  }
  return null;
}

async function uploadCompanyLogo({ organizationId, clientId, companyId, name, website }) {
  const binary = await fetchLogoImage(website, name);
  if (!binary) return null;
  const extension = contentTypeToExtension(binary.contentType);
  const storagePath = `${organizationId}/clients/${clientId}/companies/${companyId}/${Date.now()}-${sanitizeStorageName(name)}.${extension}`;
  if (dryRun) {
    return {
      logoUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`,
      logoPath: storagePath,
      logoName: `${sanitizeStorageName(name)}.${extension}`,
    };
  }
  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${storagePath}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": binary.contentType,
      "Cache-Control": "31536000",
      "x-upsert": "true",
    },
    body: binary.bytes,
  });
  const text = await uploadResponse.text();
  if (!uploadResponse.ok) {
    throw new Error(`Upload logo failed ${uploadResponse.status}: ${text}`);
  }
  return {
    logoUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${storagePath}`,
    logoPath: storagePath,
    logoName: `${sanitizeStorageName(name)}.${extension}`,
  };
}

async function uploadProfileImage({ organizationId, clientId, companyId, contactId, name, url, contactName = "" }) {
  const binary = url ? await fetchContactProfileImage(url) : null;
  if (!binary) return null;
  const extension = contentTypeToExtension(binary.contentType);
  const safeName = normalizeNameForUpload(contactName || name || "contact");
  const storagePath = `${organizationId}/clients/${clientId}/contacts/${companyId || "unassigned"}/${contactId}/profile/${Date.now()}-${safeName}.${extension}`;
  if (dryRun) {
    return {
      profilePictureUrl: `${supabaseUrl}/storage/v1/object/public/${profileBucket}/${storagePath}`,
      profilePicturePath: storagePath,
      profilePictureName: `${safeName}.${extension}`,
    };
  }

  const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${profileBucket}/${storagePath}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": binary.contentType,
      "Cache-Control": "31536000",
      "x-upsert": "true",
    },
    body: binary.bytes,
  });
  const text = await uploadResponse.text();
  if (!uploadResponse.ok) {
    throw new Error(`Upload contact profile image failed ${uploadResponse.status}: ${text}`);
  }
  return {
    profilePictureUrl: `${supabaseUrl}/storage/v1/object/public/${profileBucket}/${storagePath}`,
    profilePicturePath: storagePath,
    profilePictureName: `${safeName}.${extension}`,
  };
}

function slugify(value) {
  return keyOrEmpty(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "record";
}

function pickOwner(users = []) {
  return users.find(user => ["org_owner", "org_admin", "admin", "platform_admin"].includes(user.role))
    || users.find(user => user.status === "active")
    || users[0];
}

function companyPatchPayload(saved, next) {
  const patchPayload = {};
  for (const field of ["website", "industry", "employee_count", "annual_revenue", "status", "notes", "location"]) {
    if (!saved[field] && next[field] != null) patchPayload[field] = next[field];
  }
  if (!saved.linkedin_url && next.linkedin_url) patchPayload.linkedin_url = next.linkedin_url;
  if (!saved.picture_url && next.picture_url) patchPayload.picture_url = next.picture_url;
  const existingCustomFields = saved.custom_fields || {};
  const nextCustom = mergeCustomFields(existingCustomFields, next.custom_fields || {});
  if (JSON.stringify(existingCustomFields) !== JSON.stringify(nextCustom)) {
    patchPayload.custom_fields = nextCustom;
  }
  return patchPayload;
}

function contactPatchPayload(saved, next) {
  const patchPayload = {};
  if (shouldReplaceContactLinkedIn(saved.linkedin_url, next.linkedin_url)) {
    patchPayload.linkedin_url = next.linkedin_url;
  }
  if (shouldReplaceContactLinkedIn(saved.linkedin_profile_url, next.linkedin_profile_url)) {
    patchPayload.linkedin_profile_url = next.linkedin_profile_url;
  }
  for (const field of ["job_title", "linkedin_url", "linkedin_profile_url", "location", "email", "manual_email", "mobile", "direct_dial", "phone", "company", "profile_picture_url"]) {
    if (!saved[field] && next[field]) patchPayload[field] = next[field];
  }
  const existingCustomFields = saved.custom_fields || {};
  const nextCustom = mergeCustomFields(existingCustomFields, next.custom_fields || {});
  if (JSON.stringify(existingCustomFields) !== JSON.stringify(nextCustom)) {
    patchPayload.custom_fields = nextCustom;
  }
  return patchPayload;
}

function createCompanyPayload(row, clientId, logo = null) {
  return {
    organization_id: clientId.organization_id,
    client_id: clientId.id,
    name: row.companyName,
    slug: `${slugify(row.companyName)}-${Date.now().toString(36)}`,
    website: row.website || null,
    industry: row.industry || null,
    employee_count: row.headcount,
    annual_revenue: row.annualRevenue,
    location: row.location || null,
    status: "active",
    notes: row.notes || null,
    linkedin_url: row.companyLinkedIn || null,
    picture_url: logo?.logoUrl || null,
    custom_fields: {
      source: sourceName,
      source_sheet: prospectSheet,
      source_campaign_name: targetCampaignName,
      ui_stage: "lead",
      ui_status: "Active",
      company_hq_location: row.location || "",
      us_expansion_signal: row.usExpansionSignal || "",
      icp_fit_score: row.icpFitScore != null ? row.icpFitScore : null,
      linkedin_url: row.companyLinkedIn || "",
    },
  };
}

function createContactPayload(row, clientId, company, contactEmail = "") {
  const { firstName, lastName } = splitName(row.contactName);
  const resolvedContactEmail = toSafeEmail(contactEmail || row.contactEmail || "");
  return {
    organization_id: clientId.organization_id,
    client_id: clientId.id,
    company_id: company.id,
    contact_name: row.contactName,
    first_name: firstName || null,
    last_name: lastName || null,
    full_name: row.contactName || null,
    company: company.name,
    email: resolvedContactEmail || null,
    manual_email: resolvedContactEmail || null,
    job_title: row.contactTitle || null,
    location: row.location || null,
    linkedin_url: row.contactLinkedIn || null,
    linkedin_profile_url: row.contactLinkedIn || null,
    profile_picture_url: row.profilePictureUrl || null,
    data_source: sourceName,
    status: "active",
    custom_fields: {
      source_row_company: row.companyName,
      source: sourceName,
      source_sheet: prospectSheet,
      title: row.contactTitle || "",
      source_website: row.website || "",
      source_campaign: targetCampaignName,
    },
    normalized_identity_key: candidateContactIdentity(row.contactName, row.companyName),
  };
}

const rows = extractRows();
const stats = {
  dryRun,
  sourceRows: rows.length,
  createdClient: 0,
  createdCampaign: 0,
  createdCompanies: 0,
  updatedCompanies: 0,
  createdContacts: 0,
  updatedContacts: 0,
  createdCompanyTargets: 0,
  createdContactTargets: 0,
  logosUploaded: 0,
  contactImagesUploaded: 0,
  skippedRows: 0,
};

const clients = await restAll("clients?select=id,organization_id,name,metadata,industry,website,status");
const users = await restAll(`users?select=id,organization_id,role,status,email,display_name&status=eq.active&limit=500`);
const organizationId = (clients[0] && clients[0].organization_id)
  || (await restAll("organizations?select=id,created_at,updated_at&limit=1").then(rows => rows?.[0]?.id));

if (!organizationId) {
  throw new Error("No organization_id found in Supabase.");
}
const fallbackUser = pickOwner(users);

let client = clients.find(item => normalizeKey(item.name) === normalizeKey(targetClientName));
if (!client) {
  client = await insert("clients", {
    organization_id: organizationId,
    name: targetClientName,
    slug: `${slugify(targetClientName)}-${Date.now().toString(36)}`,
    status: "active",
    owner_id: UUID_PATTERN.test(String(fallbackUser?.id || "")) ? fallbackUser.id : null,
    industry: "Prospecting",
    website: "",
    metadata: {
      source: sourceName,
      owner: fallbackUser?.display_name || fallbackUser?.email || "",
      workspace: "Prospecting workspace",
    },
  });
  stats.createdClient = 1;
}

const existingCampaigns = await restAll(`campaigns?select=id,organization_id,client_id,name,status,settings&organization_id=eq.${organizationId}`);
const campaignsByClientAndName = new Map(existingCampaigns.map(item => [`${item.client_id}|${normalizeKey(item.name)}`, item]));
const existingCampaignsForClient = existingCampaigns.filter(item => item.client_id === client.id);
const campaignKey = `${client.id}|${normalizeKey(targetCampaignName)}`;
let campaign = campaignsByClientAndName.get(campaignKey) || null;
if (!campaign) {
  campaign = await insert("campaigns", {
    organization_id: organizationId,
    client_id: client.id,
    name: targetCampaignName,
    status: "active",
    channel: "Research-led outbound",
    settings: {
      source: sourceName,
      next_action: "Review transatlantic targets and onboard first contacts.",
    },
  });
  stats.createdCampaign = 1;
}

const existingCompanies = await restAll(`companies?select=id,organization_id,client_id,name,website,industry,employee_count,annual_revenue,status,notes,custom_fields&client_id=eq.${client.id}&organization_id=eq.${client.organization_id}`);
const existingContacts = await restAll(`contacts?select=id,organization_id,client_id,company_id,contact_name,first_name,last_name,full_name,email,job_title,normalized_identity_key,company,custom_fields&client_id=eq.${client.id}&organization_id=eq.${client.organization_id}`);
const existingTargets = await restAll(`campaign_targets?select=id,campaign_id,company_id,contact_id&campaign_id=eq.${campaign.id}&organization_id=eq.${client.organization_id}`);
const companiesByClientAndName = new Map(existingCompanies.map(company => [`${company.client_id}|${normalizeKey(company.name)}`, company]));
const companiesByClientAndDomain = new Map(existingCompanies.filter(company => domainFromWebsite(company.website)).map(company => [`${company.client_id}|${normalizeKey(domainFromWebsite(company.website))}`, company]));
const contactsByIdentity = new Map(existingContacts.filter(contact => contact.normalized_identity_key).map(contact => [contact.normalized_identity_key, contact]));
const contactsByEmail = new Map(existingContacts.filter(contact => contact.email).map(contact => [`${contact.client_id}|${normalizeKey(contact.email)}`, contact]));
const targetKeys = new Set(existingTargets.map(target => [target.campaign_id, target.company_id || "", target.contact_id || ""].join("|")));

const rowsForLookup = [];
const lookupSet = new Set();
for (const row of rows) {
  if (!row.contactName || row.contactLinkedIn) continue;
  const key = `${normalizeKey(row.contactName)}|${normalizeKey(row.companyName)}`;
  if (!lookupSet.has(key)) {
    rowsForLookup.push({ ...row, key });
    lookupSet.add(key);
  }
}
if (rowsForLookup.length) {
  await preloadContactLinkedInMappings(rowsForLookup, 4);
  for (const lookupRow of rowsForLookup) {
    if (lookupRow.contactLinkedIn) {
      const targetRows = rows.filter(item => normalizeKey(item.contactName) === normalizeKey(lookupRow.contactName) && normalizeKey(item.companyName) === normalizeKey(lookupRow.companyName));
      for (const targetRow of targetRows) {
        targetRow.contactLinkedIn = lookupRow.contactLinkedIn;
      }
    }
  }
}

for (const row of rows) {
  const rowContactEmail = buildContactEmail(row.contactEmailPattern, row.contactName, row.website);
  const existing = companiesByClientAndName.get(`${client.id}|${normalizeKey(row.companyName)}`)
    || (row.website ? companiesByClientAndDomain.get(`${client.id}|${normalizeKey(domainFromWebsite(row.website))}`) : null);
  const payload = createCompanyPayload(row, client);
  let company = existing ? { ...existing } : null;

  if (!company) {
    company = await insert("companies", {
      ...payload,
      slug: `${slugify(row.companyName)}-${Date.now().toString(36)}`,
    });
    stats.createdCompanies += 1;
    companiesByClientAndName.set(`${client.id}|${normalizeKey(company.name)}`, company);
    const companyDomain = domainFromWebsite(company.website);
    if (companyDomain) companiesByClientAndDomain.set(`${client.id}|${normalizeKey(companyDomain)}`, company);
  } else {
    const patchPayload = companyPatchPayload(existing, payload);
    if (Object.keys(patchPayload).length) {
      const patchedCompany = await patch("companies", existing.id, patchPayload);
      company = { ...company, ...patchedCompany };
      stats.updatedCompanies += 1;
    }
  }

  if (!company?.id) {
    stats.skippedRows += 1;
    continue;
  }

  if (!company.picture_url && row.website) {
    const logo = await uploadCompanyLogo({
      organizationId: client.organization_id,
      clientId: client.id,
      companyId: company.id,
      name: row.companyName,
      website: row.website,
    });
    if (logo?.logoUrl) {
      const picturePatch = { picture_url: logo.logoUrl };
      if (!dryRun) await patch("companies", company.id, picturePatch);
      company = { ...company, ...picturePatch };
      stats.updatedCompanies += 1;
      stats.logosUploaded += 1;
      companiesByClientAndName.set(`${company.client_id}|${normalizeKey(company.name)}`, company);
      const patchedCompanyDomain = domainFromWebsite(company.website);
      if (patchedCompanyDomain) companiesByClientAndDomain.set(`${company.client_id}|${normalizeKey(patchedCompanyDomain)}`, company);
    }
  }

  const companyTargetKey = `${campaign.id}|${company.id}|`;
  if (!targetKeys.has(companyTargetKey)) {
    await insert("campaign_targets", {
      organization_id: client.organization_id,
      client_id: client.id,
      campaign_id: campaign.id,
      company_id: company.id,
      status: "queued",
      metadata: { source: sourceName, source_sheet: prospectSheet },
    });
    targetKeys.add(companyTargetKey);
    stats.createdCompanyTargets += 1;
  }

  const identityKey = candidateContactIdentity(row.contactName, row.companyName);
  const resolvedContactLinkedIn = row.contactName ? (row.contactLinkedIn || await lookupContactLinkedIn(row.contactName, row.companyName)) : "";
  let contact = row.contactName ? contactsByIdentity.get(identityKey) : null;
  if (!contact && rowContactEmail) {
    contact = contactsByEmail.get(`${client.id}|${normalizeKey(rowContactEmail)}`) || null;
  }
  const contactPayload = createContactPayload({ ...row, contactEmail: rowContactEmail, contactLinkedIn: resolvedContactLinkedIn }, client, company, rowContactEmail);
  if (!contact && row.contactName) {
    contact = await insert("contacts", contactPayload);
    stats.createdContacts += 1;
    contactsByIdentity.set(identityKey, contact);
    if (contact.email) contactsByEmail.set(`${client.id}|${normalizeKey(contact.email)}`, contact);
  } else if (contact) {
    const contactPatch = contactPatchPayload(contact, contactPayload);
    if (Object.keys(contactPatch).length) {
      const patchedContact = await patch("contacts", contact.id, contactPatch);
      contact = { ...contact, ...patchedContact };
      stats.updatedContacts += 1;
      contactsByIdentity.set(identityKey, contact);
      if (contact.email) contactsByEmail.set(`${client.id}|${normalizeKey(contact.email)}`, contact);
    }
  } else {
    stats.skippedRows += 1;
  }

  if (!skipContactImageEnrichment && contact?.id && !contact.profile_picture_url && resolvedContactLinkedIn) {
    const imageUpload = await uploadProfileImage({
      organizationId: client.organization_id,
      clientId: client.id,
      companyId: company.id,
      contactId: contact.id,
      name: row.companyName,
      contactName: row.contactName || "",
      url: resolvedContactLinkedIn,
    });
    if (imageUpload?.profilePictureUrl) {
      const profilePicturePatch = { profile_picture_url: imageUpload.profilePictureUrl };
      if (!dryRun) await patch("contacts", contact.id, profilePicturePatch);
      contact = { ...contact, ...profilePicturePatch };
      stats.updatedContacts += 1;
      stats.contactImagesUploaded += 1;
    }
  }
}

console.log(JSON.stringify(stats, null, 2));
