import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const dryRun = process.argv.includes("--dry-run");
const sourceName = "transatlantic_campaign_xlsx";
const targetClientName = "Paceops";
const inputPath = path.resolve("transatlantic_campaign.xlsx");
const prospectSheet = "Prospect List";

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

function toSafeEmail(value = "") {
  const raw = normalize(value).toLowerCase();
  if (!raw) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : "";
}

function buildContactEmail(pattern = "", fullName = "", website = "") {
  const rawPattern = normalize(pattern);
  if (!rawPattern) return "";
  const domain = domainFromWebsite(website);
  const { firstName, lastName } = splitName(fullName);
  const firstLower = normalize(firstName).toLowerCase().replace(/[^a-z]/g, "");
  const lastLower = normalize(lastName).toLowerCase().replace(/[^a-z]/g, "");
  if (!firstLower && !lastLower) return toSafeEmail(rawPattern);

  let candidate = rawPattern
    .toLowerCase()
    .replace(/\bfirst\.last\b/g, [firstLower, lastLower].filter(Boolean).join("."))
    .replace(/\bfirst_?last\b/g, [firstLower, lastLower].filter(Boolean).join(""))
    .replace(/\bfirst\.?lastname\b/g, [firstLower, lastLower].filter(Boolean).join(""))
    .replace(/\bfirstname\.last\b/g, [firstLower, lastLower].filter(Boolean).join("."))
    .replace(/\bfirstname\b/g, firstLower || "firstname")
    .replace(/\bfirst\b/g, firstLower || "firstname")
    .replace(/\blastname\b/g, lastLower || "lastname")
    .replace(/\blast\b/g, lastLower || "lastname")
    .replace(/\bfirstinitial\b/g, firstLower ? firstLower[0] || "" : "")
    .replace(/\blastinitial\b/g, lastLower ? lastLower[0] || "" : "");
  if (candidate.includes("firstname") || candidate.includes("lastname")) return "";
  if (!candidate.includes("@") && domain) candidate = `${candidate}@${domain}`;
  return toSafeEmail(candidate);
}

function candidateContactIdentity(contactName = "", companyName = "") {
  return `person:${normalizeKey(contactName)}|${normalizeKey(companyName)}`;
}

function extractRows() {
  const workbook = XLSX.readFile(inputPath, { cellDates: false });
  const sheet = workbook.Sheets[prospectSheet];
  if (!sheet) throw new Error(`Could not find sheet "${prospectSheet}".`);
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false })
    .map(row => {
      const companyName = normalize(row["Company Name"]);
      const contactName = normalize(row["Key Decision Maker"]);
      const email = buildContactEmail(row["Email Pattern"], contactName, row["Website"]);
      return {
        companyName,
        contactName,
        email,
        identityKey: candidateContactIdentity(contactName, companyName),
      };
    })
    .filter(row => row.companyName && row.contactName && row.email);
}

async function rest(pathName, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathName}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${pathName} failed ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : [];
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

async function patchContact(id, body) {
  if (dryRun) return { id, ...body };
  const rows = await rest(`contacts?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

const rows = extractRows();
const clients = await restAll(`clients?select=id,organization_id,name&name=eq.${encodeURIComponent(targetClientName)}`);
const client = clients.find(item => normalizeKey(item.name) === normalizeKey(targetClientName));
if (!client) throw new Error(`Could not find client "${targetClientName}".`);

const contacts = await restAll(`contacts?select=id,client_id,contact_name,full_name,email,manual_email,normalized_identity_key,custom_fields&client_id=eq.${client.id}&organization_id=eq.${client.organization_id}`);
const contactsByIdentity = new Map(contacts.filter(contact => contact.normalized_identity_key).map(contact => [contact.normalized_identity_key, contact]));

const stats = {
  dryRun,
  sourceRowsWithEmails: rows.length,
  existingContacts: contacts.length,
  updatedContacts: 0,
  alreadyHadEmail: 0,
  missingContact: 0,
  skippedNoChange: 0,
};

for (const row of rows) {
  const contact = contactsByIdentity.get(row.identityKey);
  if (!contact) {
    stats.missingContact += 1;
    continue;
  }

  const patch = {};
  if (!toSafeEmail(contact.email)) patch.email = row.email;
  if (!toSafeEmail(contact.manual_email)) patch.manual_email = row.email;
  if (!contact.custom_fields?.source_email_backfill) {
    patch.custom_fields = {
      ...(contact.custom_fields || {}),
      source_email_backfill: sourceName,
    };
  }

  if (!patch.email && !patch.manual_email && !patch.custom_fields) {
    stats.alreadyHadEmail += 1;
    continue;
  }

  if (!patch.email && !patch.manual_email) {
    stats.skippedNoChange += 1;
    continue;
  }

  await patchContact(contact.id, patch);
  stats.updatedContacts += 1;
}

console.log(JSON.stringify(stats, null, 2));
