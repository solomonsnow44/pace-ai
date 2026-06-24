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

if (!supabaseUrl || !serviceKey) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
if (!fs.existsSync(inputPath)) throw new Error(`Missing file at ${inputPath}.`);

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

function normalizeLinkedIn(raw = "") {
  const value = normalize(raw).replace(/^mailto:/i, "");
  if (!value || !value.includes("linkedin.com/company/")) return "";
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withProtocol);
    return `${url.origin}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return withProtocol;
  }
}

function extractRows() {
  const workbook = XLSX.readFile(inputPath, { cellDates: false });
  const sheet = workbook.Sheets[prospectSheet];
  if (!sheet) throw new Error(`Could not find sheet "${prospectSheet}".`);
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false })
    .map(row => ({
      companyName: normalize(row["Company Name"]),
      linkedinUrl: normalizeLinkedIn(row.LinkedIn),
    }))
    .filter(row => row.companyName && row.linkedinUrl);
}

async function rest(pathName, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${pathName}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${options.method || "GET"} ${pathName} failed ${response.status}: ${text}`);
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

async function patchCompany(id, body) {
  if (dryRun) return { id, ...body };
  const rows = await rest(`companies?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

const rows = extractRows();
const clients = await restAll(`clients?select=id,organization_id,name&name=eq.${encodeURIComponent(targetClientName)}`);
const client = clients.find(item => normalizeKey(item.name) === normalizeKey(targetClientName));
if (!client) throw new Error(`Could not find client "${targetClientName}".`);

const companies = await restAll(`companies?select=id,name,custom_fields&client_id=eq.${client.id}&organization_id=eq.${client.organization_id}`);
const companiesByName = new Map(companies.map(company => [normalizeKey(company.name), company]));

const stats = {
  dryRun,
  sourceRowsWithLinkedIn: rows.length,
  existingCompanies: companies.length,
  updatedCompanies: 0,
  alreadyHadLinkedIn: 0,
  missingCompany: 0,
};

for (const row of rows) {
  const company = companiesByName.get(normalizeKey(row.companyName));
  if (!company) {
    stats.missingCompany += 1;
    continue;
  }
  if (normalizeLinkedIn(company.custom_fields?.linkedin_url)) {
    stats.alreadyHadLinkedIn += 1;
    continue;
  }
  await patchCompany(company.id, {
    custom_fields: {
      ...(company.custom_fields || {}),
      linkedin_url: row.linkedinUrl,
      source_linkedin_backfill: sourceName,
    },
  });
  stats.updatedCompanies += 1;
}

console.log(JSON.stringify(stats, null, 2));
