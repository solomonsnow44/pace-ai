import fs from "node:fs";

const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find(arg => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 0;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(fs.readFileSync(filePath, "utf8")
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#") && line.includes("="))
    .map(line => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
    }));
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local") };
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase URL or service role key.");
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

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
    if (page.length < pageSize || (limit && rows.length >= limit)) break;
  }
  return limit ? rows.slice(0, limit) : rows;
}

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function list(value) {
  return normalize(value)
    .split(/[,;|]+/)
    .map(item => item.trim())
    .filter(Boolean)
    .filter(item => !/^(unprocessed|prospect|none|nan|null|n\/a|na|high|medium|low)$/i.test(item));
}

function titleCase(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/\b[a-z]/g, char => char.toUpperCase())
    .replace(/\bAnd\b/g, "and")
    .replace(/\bOf\b/g, "of");
}

function cleanCompanyName(value) {
  return normalize(value)
    .replace(/^\d+\.\s+/, "")
    .replace(/^\d+\s+/, "")
    .trim();
}

function isPlaceholderName(value) {
  const name = normalize(value);
  return !name || name.length < 2 || /^\d+\.?$/.test(name);
}

function sourceSector(company) {
  const source = normalize(company.custom_fields?.source_file).toLowerCase();
  if (source.includes("nhs") || source.includes("healthcare")) return "healthcare";
  if (source.includes("council")) return "local government";
  if (source.includes("housing")) return "housing";
  if (source.includes("construction")) return "construction";
  if (source.includes("legal")) return "legal services";
  if (source.includes("manufacturing")) return "manufacturing";
  if (source.includes("logistics")) return "logistics and facilities management";
  if (source.includes("pharma")) return "pharma and life sciences";
  return "";
}

function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "";
  if (number >= 1_000_000_000) return `estimated annual revenue around ${Math.round(number / 100_000_000) / 10}bn`;
  if (number >= 1_000_000) return `estimated annual revenue around ${Math.round(number / 100_000) / 10}m`;
  return `estimated annual revenue around ${Math.round(number).toLocaleString("en-GB")}`;
}

function hasContactData(text) {
  return /@|linkedin\.com|mailto:|\+\d{2,}|direct dial|contact title|contact firstname|contact last/i.test(text);
}

function isRawStackOrList(text) {
  const items = list(text);
  return items.length > 10 && text.length > 180;
}

function cleanExistingResearch(value) {
  const text = String(value || "")
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !/(^unprocessed$|^prospect$|^none$|imported from|account priority:|source file|row \d+)/i.test(line))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text || hasContactData(text) || isRawStackOrList(text)) return "";

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  let output = "";
  for (const sentence of sentences) {
    const next = `${output ? `${output} ` : ""}${sentence.trim()}`;
    if (next.length > 320) break;
    output = next;
    if (output.length >= 140) break;
  }
  output = output || text.slice(0, 280).trim();
  return output ? `${output.replace(/[,;:\s]+$/, "")}${/[.!?]$/.test(output) ? "" : "."}` : "";
}

function noteForCompany(company, clientName) {
  const rawName = normalize(company.name);
  const name = cleanCompanyName(rawName);
  const source = normalize(company.custom_fields?.source_file);

  if (isPlaceholderName(rawName)) {
    return `This imported account does not include a usable company name, so it should be cleaned before outreach. It appears in the ${clientName} dataset${source ? ` from ${source}` : ""}.

Add the correct organisation name, website, and sector before building research, messaging, or call scripts.`;
  }

  const sector = sourceSector(company);
  const industries = list(company.industry)
    .filter(item => item.toLowerCase() !== clientName.toLowerCase())
    .slice(0, 4);
  const industryText = industries.length
    ? industries.map(titleCase).join(", ")
    : sector || "target account";
  const location = normalize(company.custom_fields?.company_hq_location || company.custom_fields?.location);
  const employees = Number(company.employee_count) > 0 ? `${Number(company.employee_count).toLocaleString("en-GB")} employees` : "";
  const revenue = formatMoney(company.annual_revenue);
  const website = normalize(company.website || company.domain);

  const facts = [];
  if (location) facts.push(`based around ${location}`);
  if (employees) facts.push(`with ${employees}`);
  if (revenue) facts.push(revenue);
  if (website) facts.push(`website: ${website}`);

  const first = `${name} is ${/^[aeiou]/i.test(industryText) ? "an" : "a"} ${industryText} organisation${facts.length ? `, ${facts.join(", ")}` : ""}.`;
  const existing = cleanExistingResearch(company.notes);
  const second = existing || `Use this account for focused company validation, stakeholder mapping, and outreach planning. Check current priorities, relevant decision makers, and any active projects before moving the account further through the campaign.`;

  return `${first}\n\n${second}`;
}

const companies = await restAll("companies?select=id,client_id,name,industry,website,domain,employee_count,annual_revenue,notes,custom_fields&order=name.asc");
const clients = await restAll("clients?select=id,name");
const clientById = new Map(clients.map(client => [client.id, client.name]));

let updated = 0;
let unchanged = 0;
const samples = [];

for (const company of companies) {
  const clientName = clientById.get(company.client_id) || "client";
  const nextNotes = noteForCompany(company, clientName);
  if (normalize(nextNotes) === normalize(company.notes)) {
    unchanged += 1;
    continue;
  }
  updated += 1;
  if (samples.length < 12) {
    samples.push({ client: clientName, name: company.name, notes: nextNotes });
  }
  if (!dryRun) {
    const customFields = {
      ...(company.custom_fields || {}),
      research_note_cleanup: {
        cleaned_at: new Date().toISOString(),
        previous_notes: company.custom_fields?.research_note_cleanup?.previous_notes || company.notes || "",
      },
    };
    await rest(`companies?id=eq.${company.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ notes: nextNotes, custom_fields: customFields }),
    });
  }
}

console.log(JSON.stringify({ dryRun, total: companies.length, updated, unchanged, samples }, null, 2));
