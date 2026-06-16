import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";

const targetFolders = ["Integrated Research", "Iron Mountain", "Kodak Alaris", "Each&Other"];
const dryRun = process.argv.includes("--dry-run");
const sourceName = "folder_crm_workbook_import";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  Prefer: "return=representation",
};

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeKey(value) {
  return normalize(value).toLowerCase();
}

function slugify(value) {
  return normalizeKey(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "record";
}

function get(row, patterns) {
  const keys = Object.keys(row);
  for (const pattern of patterns) {
    const key = keys.find(header => pattern.test(header));
    if (key && normalize(row[key])) return normalize(row[key]);
  }
  return "";
}

function getByHeader(row, header) {
  const key = Object.keys(row).find(candidate => candidate.trim() === header.trim());
  return key ? normalize(row[key]) : "";
}

function parseInteger(value) {
  const raw = normalize(value);
  const match = raw.match(/\d[\d,]*/);
  if (!match) return null;
  const number = Number(match[0].replace(/,/g, ""));
  return Number.isInteger(number) && number > 0 && number <= 2147483647 ? number : null;
}

function parseRevenue(value) {
  const raw = normalize(value).replace(/,/g, "");
  const number = Number(raw.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : null;
}

function domainFromWebsite(value) {
  const raw = normalize(value);
  if (!raw) return "";
  const first = raw.split(/[,\s]+/).find(Boolean) || raw;
  try {
    const url = new URL(/^https?:\/\//i.test(first) ? first : `https://${first}`);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return first.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
  }
}

function isSharedOrGenericDomain(value) {
  const domain = normalizeKey(value).replace(/^www\./, "");
  return [
    "nhs.net",
    "gov.uk",
    "linkedin.com",
    "facebook.com",
    "twitter.com",
    "x.com",
  ].includes(domain);
}

function phoneValue(value) {
  const raw = normalize(value);
  if (!raw || /^(tps|n\/a|na|none|null|no)$/i.test(raw)) return "";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 ? raw : "";
}

function emailValue(value) {
  const raw = normalize(value).toLowerCase();
  if (!raw || /^(n\/a|na|none|null)$/i.test(raw)) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : "";
}

function cleanName(value) {
  const raw = normalize(value);
  if (!raw || /^(n\/a|na|none|null|tbc|unknown|no contact|no contacts?)$/i.test(raw)) return "";
  if (/^(mainline|switchboard|reception)$/i.test(raw)) return "";
  return raw;
}

function splitName(name) {
  const parts = normalize(name).split(" ").filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function contactIdentity(name, company) {
  return `person:${normalizeKey(name)}|${normalizeKey(company)}`;
}

function cleanCampaignName(filePath) {
  return path.basename(filePath, path.extname(filePath))
    .replace(/\s+-\s+(Account Priority|Last view used|Region|Account Location|Prospecting|IM Account Owner)\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function workbookFiles() {
  return targetFolders.flatMap(folder => {
    if (!fs.existsSync(folder)) return [];
    return fs.readdirSync(folder)
      .filter(file => /\.(xlsx|xls|csv)$/i.test(file) && !file.startsWith("~$"))
      .map(file => path.join(folder, file));
  }).sort();
}

function slotValue(row, slot, fieldPatterns) {
  const keys = Object.keys(row);
  const slotPatterns = slot === 1
    ? [new RegExp(`^(?:\\(Primary\\)\\s*)?${slot}\\.`, "i")]
    : [new RegExp(`^${slot}\\.`, "i")];
  const key = keys.find(header => (
    slotPatterns.some(pattern => pattern.test(header.trim()))
    && fieldPatterns.some(pattern => pattern.test(header))
  ));
  return key ? normalize(row[key]) : "";
}

function namedContact(row, slot) {
  const fullName = cleanName(slotValue(row, slot, [/Contact Name/i]));
  const firstName = slotValue(row, slot, [/Contact First\s*Name|Contact Firstname/i]);
  const lastName = slotValue(row, slot, [/Contact\s+Last\s*Name|Contact Lastname|Contact\s+Last/i]);
  const name = fullName || cleanName([firstName, lastName].filter(Boolean).join(" "));
  const title = slotValue(row, slot, [/Contact Title/i]);
  const linkedin = slotValue(row, slot, [/Personal LinkedIn/i]);
  const mobile = phoneValue(slotValue(row, slot, [/Direct Dial - Mobile/i]));
  const directDial = phoneValue(slotValue(row, slot, [/Direct Dial - Work|Direct Dial - Main|Direct Dial - Other/i]));
  const email = emailValue(slotValue(row, slot, [/Direct Email - Work|Direct Email - Home|Direct Email - Other/i]));
  const location = slotValue(row, slot, [/Contacts Location/i]);
  if (!name && !email && !mobile && !directDial) return null;
  if (!name) return null;
  return { slot, name, title, linkedin, mobile, directDial, email, location, sourceRole: "" };
}

function roleContact(row, label, roleName) {
  const name = cleanName(getByHeader(row, `${label} Contact Name`));
  const title = getByHeader(row, `${label} Contact Title`);
  const linkedin = getByHeader(row, `${label} Personal LinkedIn`);
  const mobile = phoneValue(getByHeader(row, `${label} Direct Dial - Mobile`));
  const directDial = phoneValue(getByHeader(row, `${label} Direct Dial - Work`) || getByHeader(row, `${label} Direct Dial - Main`) || getByHeader(row, `${label} Direct Dial - Other`));
  const email = emailValue(getByHeader(row, `${label} Direct Email - Work`) || getByHeader(row, `${label} Direct Email - Home`) || getByHeader(row, `${label} Direct Email - Other`));
  if (!name && !email && !mobile && !directDial) return null;
  if (!name) return null;
  return { slot: roleName, name, title, linkedin, mobile, directDial, email, location: "", sourceRole: roleName };
}

function contactsFromRow(row) {
  const contacts = [];
  for (let slot = 1; slot <= 5; slot += 1) {
    const contact = namedContact(row, slot);
    if (contact) contacts.push(contact);
  }
  for (const [label, roleName] of [
    ["IT", "IT"],
    ["Procurement", "Procurement"],
    ["Ops and/or Facilities", "Ops/Facilities"],
    ["Ops and/or Facilties", "Ops/Facilities"],
  ]) {
    const contact = roleContact(row, label, roleName);
    if (contact) contacts.push(contact);
  }
  const seen = new Set();
  return contacts.filter(contact => {
    const key = contact.email || normalizeKey(contact.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dublinOffset(date) {
  const month = date.getUTCMonth() + 1;
  return month >= 4 && month <= 10 ? "+01:00" : "+00:00";
}

function parseAppointmentDate(value) {
  const raw = normalize(value);
  if (!raw) return null;
  const dateTime = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{1,2}):(\d{2}))?$/);
  if (!dateTime) return null;
  const [, year, month, day, hour, minute] = dateTime;
  if (!hour || !minute) return null;
  const offset = dublinOffset(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
  return `${year}-${month}-${day}T${hour.padStart(2, "0")}:${minute}:00${offset}`;
}

function rowHasAppointment(row) {
  const meetingSetWith = get(row, [/^Meeting set with$/i]);
  const appointmentStart = get(row, [/Appointment Set Date\s+-?\s*start/i]);
  const appointmentEnd = get(row, [/Appointment Set Date\s+-?\s*end/i]);
  const closing = get(row, [/^Closing$/i]);
  return Boolean(meetingSetWith || appointmentStart || appointmentEnd || /appointment set/i.test(closing));
}

function appointmentContact(contacts, meetingSetWith) {
  const raw = normalizeKey(meetingSetWith);
  if (!contacts.length) return null;
  if (!raw) return contacts[0];
  const parts = raw.split(/\s*(?:,|&|\||\/| and )\s*/i).filter(Boolean);
  return contacts.find(contact => {
    const contactName = normalizeKey(contact.name);
    return parts.some(part => part && (contactName.includes(part) || part.includes(contactName)));
  }) || contacts.find(contact => raw.includes(normalizeKey(contact.name))) || contacts[0];
}

function rowsFromFiles() {
  const rows = [];
  for (const filePath of workbookFiles()) {
    const clientName = path.dirname(filePath);
    const campaignName = cleanCampaignName(filePath);
    const workbook = XLSX.readFile(filePath, { cellDates: false });
    for (const sheetName of workbook.SheetNames) {
      const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false });
      sheetRows.forEach((row, index) => {
        const companyName = get(row, [/^Org\.? Name$/i, /^Organisation Name$/i, /^Company Name$/i, /^Trust Name$/i]);
        if (!companyName) return;
        const website = get(row, [/^Website$/i]);
        const location = get(row, [/Company HQ Location/i, /^Location$/i, /^Region$/i, /^Account Location$/i]);
        const research = get(row, [/Account Research - Event Notes/i, /^Account Research$/i, /Additonal Company Research/i, /^IM Customer Information$/i, /Company Description.*Research/i, /^Company Description$/i]);
        const notes = [
          research,
          get(row, [/^Action Notes$/i]),
          get(row, [/^Previous Action Notes$/i]),
          get(row, [/^Technology Stack$/i]),
          get(row, [/^Prospecting$/i]),
          get(row, [/^Discovery$/i]),
        ].filter(Boolean).join("\n\n");
        rows.push({
          filePath,
          file: path.basename(filePath),
          sheetName,
          sourceRow: index + 2,
          clientName,
          campaignName,
          companyName,
          website,
          domain: isSharedOrGenericDomain(domainFromWebsite(website)) ? "" : domainFromWebsite(website),
          industry: get(row, [/^Industry$/i]) || clientName,
          employeeCount: parseInteger(get(row, [/Org\. Size/i, /Company Size/i])),
          annualRevenue: parseRevenue(get(row, [/Turnover.*amount/i])),
          location,
          notes,
          accountPriority: get(row, [/^Account Priority$/i]),
          status: get(row, [/^Progress$/i]) || get(row, [/^Closing$/i]) || get(row, [/^Prospecting$/i]),
          meetingSetWith: get(row, [/^Meeting set with$/i]),
          appointmentStart: get(row, [/Appointment Set Date\s+-?\s*start/i]),
          appointmentEnd: get(row, [/Appointment Set Date\s+-?\s*end/i]),
          meetingAt: parseAppointmentDate(get(row, [/Appointment Set Date\s+-?\s*start/i])),
          hasAppointment: rowHasAppointment(row),
          contacts: contactsFromRow(row),
        });
      });
    }
  }
  return rows;
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
      if (attempt === 5 || !/(fetch failed|UND_ERR_SOCKET|GOAWAY|ECONNRESET|ETIMEDOUT|ENOTFOUND)/i.test(String(error?.message || error))) {
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

async function insert(table, body) {
  if (dryRun) return { id: `dry-${table}-${Math.random().toString(36).slice(2)}`, ...body };
  const rows = await rest(table, { method: "POST", body: JSON.stringify(body) });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function patch(table, id, body) {
  if (dryRun || !Object.keys(body).length) return { id, ...body };
  const rows = await rest(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return Array.isArray(rows) ? rows[0] : rows;
}

function targetKey(campaignId, companyId = "", contactId = "") {
  return [campaignId, companyId || "", contactId || ""].join("|");
}

function meetingKey(candidate) {
  return [
    candidate.campaign_id || "",
    candidate.company_id || "",
    candidate.contact_id || "",
    candidate.meeting_at ? new Date(candidate.meeting_at).getTime() : "",
    normalizeKey(candidate.title),
  ].join("|");
}

function buildCompanyNotes(row) {
  return [
    row.notes,
    row.accountPriority ? `Account priority: ${row.accountPriority}.` : "",
    `Imported from ${row.file}, row ${row.sourceRow}.`,
  ].filter(Boolean).join("\n\n");
}

function buildMeetingNotes(row) {
  return [
    row.notes,
    row.appointmentStart ? `Appointment start: ${row.appointmentStart}.` : "",
    row.appointmentEnd ? `Appointment end: ${row.appointmentEnd}.` : "",
    row.meetingSetWith ? `Meeting set with: ${row.meetingSetWith}.` : "",
    row.accountPriority ? `Account priority: ${row.accountPriority}.` : "",
    `Imported from ${row.file}, row ${row.sourceRow}.`,
  ].filter(Boolean).join("\n\n");
}

function contactPatchPayload(savedContact, payload) {
  const patchPayload = {};
  for (const key of ["email", "phone", "mobile", "direct_dial", "manual_email", "manual_mobile", "manual_direct_dial", "job_title", "linkedin_url", "linkedin_profile_url", "location"]) {
    if (!savedContact[key] && payload[key]) patchPayload[key] = payload[key];
  }
  return patchPayload;
}

const sourceRows = rowsFromFiles();
const clientNames = [...new Set(sourceRows.map(row => row.clientName))];
const campaignNames = [...new Set(workbookFiles().map(filePath => `${path.dirname(filePath)}|${cleanCampaignName(filePath)}`))];

const clients = await restAll("clients?select=id,organization_id,name,metadata,industry,website,status");
const organizationId = clients[0]?.organization_id;
if (!organizationId) throw new Error("No organization found.");

const [users, existingCampaigns, existingCompanies, existingContacts, existingTargets, existingMeetings, existingClientMembers, existingCampaignMembers] = await Promise.all([
  restAll(`users?select=id,organization_id,email,display_name,role,status&organization_id=eq.${organizationId}&status=eq.active`),
  restAll(`campaigns?select=id,organization_id,client_id,name,status,channel,settings&organization_id=eq.${organizationId}`),
  restAll(`companies?select=id,organization_id,client_id,name,domain,website,industry,employee_count,annual_revenue,status,notes,custom_fields&organization_id=eq.${organizationId}`),
  restAll(`contacts?select=id,organization_id,client_id,company_id,contact_name,first_name,last_name,full_name,email,phone,mobile,direct_dial,manual_email,manual_mobile,manual_direct_dial,job_title,linkedin_url,linkedin_profile_url,location,normalized_identity_key,status,custom_fields&organization_id=eq.${organizationId}`),
  restAll(`campaign_targets?select=id,campaign_id,company_id,contact_id&organization_id=eq.${organizationId}`),
  restAll(`meetings?select=id,client_id,campaign_id,company_id,contact_id,user_id,owner_user_id,booked_by_user_id,title,meeting_at,phone_number&organization_id=eq.${organizationId}`),
  restAll(`client_members?select=client_id,user_id&organization_id=eq.${organizationId}`),
  restAll(`campaign_members?select=campaign_id,user_id&organization_id=eq.${organizationId}`),
]);

const fallbackUser = users.find(user => ["org_owner", "org_admin", "admin", "platform_admin"].includes(user.role)) || users[0];
if (!fallbackUser) throw new Error("No active workspace user found for required meeting user_id.");

const stats = {
  dryRun,
  sourceRows: sourceRows.length,
  clientsCreated: 0,
  campaignsCreated: 0,
  companiesCreated: 0,
  companiesUpdated: 0,
  contactsCreated: 0,
  contactsUpdated: 0,
  campaignTargetsCreated: 0,
  meetingsCreated: 0,
  appointmentRows: sourceRows.filter(row => row.hasAppointment).length,
  skippedContacts: 0,
};

const clientByName = new Map(clients.map(client => [normalizeKey(client.name), client]));
const campaignByClientAndName = new Map(existingCampaigns.map(campaign => [`${campaign.client_id}|${normalizeKey(campaign.name)}`, campaign]));
const companyByClientAndName = new Map(existingCompanies.map(company => [`${company.client_id}|${normalizeKey(company.name)}`, company]));
const companyByClientAndDomain = new Map(existingCompanies.filter(company => company.domain).map(company => [`${company.client_id}|${normalizeKey(company.domain)}`, company]));
const contactsByIdentity = new Map(existingContacts.filter(contact => contact.normalized_identity_key).map(contact => [contact.normalized_identity_key, contact]));
const contactsByClientEmail = new Map(existingContacts.filter(contact => contact.email).map(contact => [`${contact.client_id}|${normalizeKey(contact.email)}`, contact]));
const targetKeys = new Set(existingTargets.map(target => targetKey(target.campaign_id, target.company_id, target.contact_id)));
const currentMeetingKeys = new Set(existingMeetings.map(meeting => meetingKey(meeting)));
const clientMemberKeys = new Set(existingClientMembers.map(member => `${member.client_id}|${member.user_id}`));
const campaignMemberKeys = new Set(existingCampaignMembers.map(member => `${member.campaign_id}|${member.user_id}`));

for (const clientName of clientNames) {
  if (clientByName.has(normalizeKey(clientName))) continue;
  const client = await insert("clients", {
    organization_id: organizationId,
    name: clientName,
    slug: `${slugify(clientName)}-${Date.now().toString(36)}`,
    status: "active",
    owner_id: UUID_PATTERN.test(String(fallbackUser.id || "")) ? fallbackUser.id : null,
    industry: clientName,
    metadata: {
      workspace: "Prospecting workspace",
      owner: fallbackUser.display_name || fallbackUser.email || "",
      source: sourceName,
    },
  });
  clientByName.set(normalizeKey(clientName), client);
  stats.clientsCreated += 1;
}

for (const key of campaignNames) {
  const [clientName, campaignName] = key.split("|");
  const client = clientByName.get(normalizeKey(clientName));
  if (!client) continue;
  const campaignKey = `${client.id}|${normalizeKey(campaignName)}`;
  if (campaignByClientAndName.has(campaignKey)) continue;
  const campaign = await insert("campaigns", {
    organization_id: organizationId,
    client_id: client.id,
    name: campaignName,
    status: "active",
    channel: "Outbound",
    settings: {
      next_action: "Review imported workbook contacts",
      source: sourceName,
    },
  });
  campaignByClientAndName.set(campaignKey, campaign);
  stats.campaignsCreated += 1;
}

const usersToAssign = users.filter(user => UUID_PATTERN.test(String(user.id || "")));
for (const clientName of clientNames) {
  const client = clientByName.get(normalizeKey(clientName));
  if (!client || dryRun) continue;
  const rows = usersToAssign
    .filter(user => !clientMemberKeys.has(`${client.id}|${user.id}`))
    .map(user => ({
      organization_id: organizationId,
      client_id: client.id,
      user_id: user.id,
      role: "member",
    }));
  if (rows.length) {
    await rest("client_members", { method: "POST", body: JSON.stringify(rows) });
    rows.forEach(row => clientMemberKeys.add(`${row.client_id}|${row.user_id}`));
  }
}

for (const key of campaignNames) {
  const [clientName, campaignName] = key.split("|");
  const client = clientByName.get(normalizeKey(clientName));
  const campaign = client ? campaignByClientAndName.get(`${client.id}|${normalizeKey(campaignName)}`) : null;
  if (!client || !campaign || dryRun) continue;
  const rows = usersToAssign
    .filter(user => !campaignMemberKeys.has(`${campaign.id}|${user.id}`))
    .map(user => ({
      organization_id: organizationId,
      client_id: client.id,
      campaign_id: campaign.id,
      user_id: user.id,
      role: "member",
    }));
  if (rows.length) {
    await rest("campaign_members", { method: "POST", body: JSON.stringify(rows) });
    rows.forEach(row => campaignMemberKeys.add(`${row.campaign_id}|${row.user_id}`));
  }
}

for (const row of sourceRows) {
  const client = clientByName.get(normalizeKey(row.clientName));
  const campaign = client ? campaignByClientAndName.get(`${client.id}|${normalizeKey(row.campaignName)}`) : null;
  if (!client || !campaign) continue;

  let company = companyByClientAndName.get(`${client.id}|${normalizeKey(row.companyName)}`)
    || (row.domain ? companyByClientAndDomain.get(`${client.id}|${normalizeKey(row.domain)}`) : null);

  const companyPayload = {
    organization_id: organizationId,
    client_id: client.id,
    name: row.companyName,
    slug: `${slugify(row.companyName)}-${Date.now().toString(36)}`,
    domain: row.domain || null,
    website: row.website || null,
    industry: row.industry || null,
    employee_count: row.employeeCount,
    annual_revenue: row.annualRevenue,
    status: "active",
    notes: buildCompanyNotes(row) || null,
    custom_fields: {
      company_hq_location: row.location || "",
      ui_stage: "Lead In",
      ui_status: row.status || "",
      source: sourceName,
      source_file: row.file,
      source_row: row.sourceRow,
    },
  };

  if (!company) {
    company = await insert("companies", companyPayload);
    stats.companiesCreated += 1;
    companyByClientAndName.set(`${client.id}|${normalizeKey(company.name)}`, company);
    if (company.domain) companyByClientAndDomain.set(`${client.id}|${normalizeKey(company.domain)}`, company);
  } else {
    const patchPayload = {};
    for (const key of ["domain", "website", "industry", "employee_count", "annual_revenue", "notes"]) {
      if (!company[key] && companyPayload[key]) patchPayload[key] = companyPayload[key];
    }
    if (Object.keys(patchPayload).length) {
      company = { ...company, ...(await patch("companies", company.id, patchPayload)) };
      stats.companiesUpdated += 1;
    }
  }

  const companyTargetKey = targetKey(campaign.id, company.id, "");
  if (!targetKeys.has(companyTargetKey)) {
    await insert("campaign_targets", {
      organization_id: organizationId,
      client_id: client.id,
      campaign_id: campaign.id,
      company_id: company.id,
      status: "queued",
      metadata: { source: sourceName, source_file: row.file, source_row: row.sourceRow },
    });
    targetKeys.add(companyTargetKey);
    stats.campaignTargetsCreated += 1;
  }

  const savedContacts = [];
  for (const contact of row.contacts) {
    const identity = contactIdentity(contact.name, row.companyName);
    const { firstName, lastName } = splitName(contact.name);
    const payload = {
      organization_id: organizationId,
      client_id: client.id,
      company_id: company.id,
      contact_name: contact.name,
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: contact.name,
      company: row.companyName,
      email: contact.email || null,
      phone: contact.directDial || contact.mobile || null,
      mobile: contact.mobile || null,
      direct_dial: contact.directDial || null,
      manual_email: contact.email || null,
      manual_mobile: contact.mobile || null,
      manual_direct_dial: contact.directDial || null,
      job_title: contact.title || null,
      location: contact.location || null,
      linkedin_url: contact.linkedin || null,
      linkedin_profile_url: contact.linkedin || null,
      data_source: sourceName,
      normalized_identity_key: identity,
      status: "active",
      custom_fields: {
        source_file: row.file,
        source_row: row.sourceRow,
        contact_slot: contact.slot,
        source_role: contact.sourceRole || "",
      },
    };
    let savedContact = contactsByIdentity.get(identity) || (contact.email ? contactsByClientEmail.get(`${client.id}|${normalizeKey(contact.email)}`) : null);
    if (savedContact) {
      const patchPayload = contactPatchPayload(savedContact, payload);
      if (Object.keys(patchPayload).length) {
        savedContact = { ...savedContact, ...(await patch("contacts", savedContact.id, patchPayload)) };
        stats.contactsUpdated += 1;
      }
    } else {
      savedContact = await insert("contacts", payload);
      stats.contactsCreated += 1;
    }
    contactsByIdentity.set(identity, savedContact);
    if (savedContact.email) contactsByClientEmail.set(`${client.id}|${normalizeKey(savedContact.email)}`, savedContact);
    savedContacts.push(savedContact);

    const contactTargetKey = targetKey(campaign.id, "", savedContact.id);
    if (!targetKeys.has(contactTargetKey)) {
      await insert("campaign_targets", {
        organization_id: organizationId,
        client_id: client.id,
        campaign_id: campaign.id,
        contact_id: savedContact.id,
        status: "queued",
        metadata: { source: sourceName, source_file: row.file, source_row: row.sourceRow },
      });
      targetKeys.add(contactTargetKey);
      stats.campaignTargetsCreated += 1;
    }
  }

  if (!row.contacts.length) stats.skippedContacts += 1;

  if (row.hasAppointment) {
    const selectedSourceContact = appointmentContact(row.contacts, row.meetingSetWith);
    const selectedContact = selectedSourceContact
      ? savedContacts.find(contact => normalizeKey(contact.full_name) === normalizeKey(selectedSourceContact.name) || (selectedSourceContact.email && normalizeKey(contact.email) === normalizeKey(selectedSourceContact.email)))
      : null;
    const phoneNumber = selectedSourceContact?.directDial || selectedSourceContact?.mobile || "";
    const title = `Meeting with ${selectedContact?.full_name || row.meetingSetWith || row.companyName}`;
    const meetingPayload = {
      organization_id: organizationId,
      client_id: client.id,
      campaign_id: campaign.id,
      company_id: company.id,
      contact_id: selectedContact?.id || null,
      user_id: fallbackUser.id,
      owner_user_id: null,
      booked_by_user_id: null,
      title,
      meeting_at: row.meetingAt,
      status: "booked",
      notes: buildMeetingNotes(row),
      phone_number: phoneNumber || null,
    };
    const key = meetingKey(meetingPayload);
    if (!currentMeetingKeys.has(key)) {
      const meeting = await insert("meetings", meetingPayload);
      currentMeetingKeys.add(meetingKey(meeting));
      stats.meetingsCreated += 1;
    }
  }
}

console.log(JSON.stringify(stats, null, 2));
