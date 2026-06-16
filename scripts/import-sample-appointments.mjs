import fs from "node:fs";
import XLSX from "xlsx";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(fs.readFileSync(path, "utf8")
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

const sampleFiles = [
  ["Construction - Contacts - Last view used.xlsx", "Construction - Contacts"],
  ["NHS Trust - Contacts - Last view used.xlsx", "NHS Trust - Contacts"],
  ["NHS Webinar - Account Priority .xlsx", "NHS Webinar"],
];

function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeKey(value) {
  return normalize(value).toLowerCase();
}

function splitName(name) {
  const parts = normalize(name).split(" ").filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function phoneValue(value) {
  const raw = normalize(value);
  if (!raw || /^tps$/i.test(raw)) return "";
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 ? raw : "";
}

function parseAppointmentDate(value) {
  const raw = normalize(value);
  if (!raw) return null;
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const [, date, hour, minute] = match;
  return `${date}T${hour.padStart(2, "0")}:${minute}:00+01:00`;
}

function contactIdentity(name, company) {
  return `person:${normalizeKey(name)}|${normalizeKey(company)}`;
}

async function rest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} failed ${response.status}: ${text}`);
  }
  return text ? JSON.parse(text) : [];
}

async function insert(table, body) {
  const rows = await rest(table, { method: "POST", body: JSON.stringify(body) });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function patch(table, id, body) {
  const rows = await rest(`${table}?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(body) });
  return Array.isArray(rows) ? rows[0] : rows;
}

function contactHeaders(headers, slot) {
  const prefix = slot === 1 ? "(Primary) 1." : `${slot}.`;
  return {
    first: headers.find(header => header.includes(prefix) && /First Name|Firstname/i.test(header)),
    last: headers.find(header => header.includes(prefix) && /Last Name|Lastname|Contact Last/i.test(header)),
    title: headers.find(header => header.includes(prefix) && /Title/i.test(header)),
    email: headers.find(header => header.includes(prefix) && /Direct Email/i.test(header)),
    mobile: headers.find(header => header.includes(prefix) && /Direct Dial|Mobile/i.test(header)),
    linkedin: headers.find(header => header.includes(prefix) && /LinkedIn/i.test(header)),
    location: headers.find(header => header.includes(prefix) && /Contacts Location/i.test(header)),
  };
}

function appointmentRowsFromFiles() {
  const rows = [];
  for (const [file, campaignName] of sampleFiles) {
    const workbook = XLSX.readFile(`sampleCampaigns/${file}`, { cellDates: false });
    for (const sheetName of workbook.SheetNames) {
      const sheetRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "", raw: false });
      const headers = sheetRows[0] ? Object.keys(sheetRows[0]) : [];
      sheetRows.forEach((row, index) => {
        const appointmentStart = normalize(row["Appointment Set Date  - start"]);
        const appointmentEnd = normalize(row["Appointment Set Date  - end"]);
        const closing = normalize(row.Closing);
        if (!/appointment set/i.test(closing) && !appointmentStart && !appointmentEnd) return;
        const organizationName = normalize(row["Organisation Name"]);
        const contacts = [];
        for (let slot = 1; slot <= 3; slot += 1) {
          const keys = contactHeaders(headers, slot);
          const name = normalize([row[keys.first], row[keys.last]].filter(Boolean).join(" "));
          const email = normalize(row[keys.email]);
          const mobile = phoneValue(row[keys.mobile]);
          const title = normalize(row[keys.title]);
          if (!name && !email && !mobile && !title) continue;
          contacts.push({
            slot,
            name,
            title,
            email,
            mobile,
            linkedin: normalize(row[keys.linkedin]),
            location: normalize(row[keys.location]),
          });
        }
        rows.push({
          file,
          sheetName,
          sourceRow: index + 2,
          campaignName,
          organizationName,
          appointmentStart,
          appointmentEnd,
          meetingAt: parseAppointmentDate(appointmentStart),
          closing,
          prospecting: normalize(row.Prospecting),
          accountPriority: normalize(row["Account Priority"]),
          companyDescription: normalize(row["Company Description"]),
          actionNotes: normalize(row["Action Notes"]),
          researchNotes: normalize(row["Account Research - Event Notes"]),
          contacts,
        });
      });
    }
  }
  return rows;
}

function buildNotes(row) {
  return [
    row.researchNotes,
    row.actionNotes,
    row.companyDescription,
    `Imported from ${row.file}, row ${row.sourceRow}.`,
    row.appointmentEnd ? `Appointment end: ${row.appointmentEnd}.` : "",
    row.accountPriority ? `Account priority: ${row.accountPriority}.` : "",
    row.prospecting ? `Prospecting: ${row.prospecting}.` : "",
  ].filter(Boolean).join("\n\n");
}

function isSameMeeting(meeting, candidate) {
  const sameCampaign = meeting.campaign_id === candidate.campaign_id;
  const sameCompany = meeting.company_id === candidate.company_id;
  const sameContact = (meeting.contact_id || "") === (candidate.contact_id || "");
  const sameTime = meeting.meeting_at && candidate.meeting_at
    ? new Date(meeting.meeting_at).getTime() === new Date(candidate.meeting_at).getTime()
    : (meeting.meeting_at || "") === (candidate.meeting_at || "");
  const sameNullTimeTitle = !meeting.meeting_at && !candidate.meeting_at && meeting.title === candidate.title;
  return sameCampaign && sameCompany && sameContact && (sameTime || sameNullTimeTitle);
}

const appointmentRows = appointmentRowsFromFiles();
const clients = await rest("clients?select=id,organization_id,name,metadata");
const emsolClient = clients.find(client => normalizeKey(client.name) === "emsol");
if (!emsolClient) throw new Error("EMSOL client not found.");

const [campaigns, companies, contacts, campaignTargets, meetings, users] = await Promise.all([
  rest(`campaigns?select=id,organization_id,client_id,name&client_id=eq.${emsolClient.id}`),
  rest(`companies?select=id,organization_id,client_id,name&client_id=eq.${emsolClient.id}`),
  rest(`contacts?select=id,organization_id,client_id,company_id,full_name,email,mobile,direct_dial,job_title,linkedin_url,normalized_identity_key&client_id=eq.${emsolClient.id}`),
  rest(`campaign_targets?select=id,campaign_id,company_id,contact_id&client_id=eq.${emsolClient.id}`),
  rest(`meetings?select=id,client_id,campaign_id,company_id,contact_id,user_id,owner_user_id,booked_by_user_id,title,meeting_at,phone_number&client_id=eq.${emsolClient.id}`),
  rest(`users?select=id,organization_id,email,display_name,role,status&organization_id=eq.${emsolClient.organization_id}&status=eq.active`),
]);

const fallbackUser = users.find(user => ["org_owner", "org_admin", "admin", "platform_admin"].includes(user.role)) || users[0];
if (!fallbackUser) throw new Error("No active workspace user found for required meetings.user_id.");

const campaignByName = new Map(campaigns.map(campaign => [normalizeKey(campaign.name), campaign]));
const companyByName = new Map(companies.map(company => [normalizeKey(company.name), company]));
const contactsByIdentity = new Map(contacts.map(contact => [contact.normalized_identity_key, contact]));
const contactsByEmail = new Map(contacts.filter(contact => contact.email).map(contact => [normalizeKey(contact.email), contact]));
const targetKeys = new Set(campaignTargets.map(target => [
  target.campaign_id,
  target.company_id || "",
  target.contact_id || "",
].join("|")));

let createdContacts = 0;
let updatedContacts = 0;
let createdTargets = 0;
let createdMeetings = 0;
let skippedRows = 0;
const rowSummaries = [];
const currentMeetings = [...meetings];

for (const row of appointmentRows) {
  const campaign = campaignByName.get(normalizeKey(row.campaignName));
  let company = companyByName.get(normalizeKey(row.organizationName));
  if (!campaign) {
    skippedRows += 1;
    rowSummaries.push({ organization: row.organizationName, skipped: true, reason: "campaign not found" });
    continue;
  }
  if (!company) {
    company = await insert("companies", {
      organization_id: emsolClient.organization_id,
      client_id: emsolClient.id,
      name: row.organizationName,
      slug: `${normalizeKey(row.organizationName).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`,
      status: "active",
      notes: row.companyDescription || row.researchNotes || null,
      custom_fields: {
        source: "sample_appointment_import",
        source_file: row.file,
        source_row: row.sourceRow,
      },
    });
    companyByName.set(normalizeKey(company.name), company);
  }

  const importedContacts = [];
  for (const contact of row.contacts) {
    if (!contact.name) continue;
    const identity = contactIdentity(contact.name, row.organizationName);
    const { firstName, lastName } = splitName(contact.name);
    const payload = {
      organization_id: emsolClient.organization_id,
      client_id: emsolClient.id,
      company_id: company.id,
      contact_name: contact.name,
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: contact.name,
      company: row.organizationName,
      email: contact.email || null,
      phone: contact.mobile || null,
      mobile: contact.mobile || null,
      direct_dial: contact.mobile || null,
      manual_email: contact.email || null,
      manual_mobile: contact.mobile || null,
      manual_direct_dial: contact.mobile || null,
      job_title: contact.title || null,
      location: contact.location || null,
      linkedin_url: contact.linkedin || null,
      linkedin_profile_url: contact.linkedin || null,
      data_source: "sample_appointment_import",
      normalized_identity_key: identity,
      status: "active",
      custom_fields: { source_file: row.file, source_row: row.sourceRow, appointment_contact_slot: contact.slot },
    };
    let savedContact = contactsByIdentity.get(identity) || (contact.email ? contactsByEmail.get(normalizeKey(contact.email)) : null);
    if (savedContact) {
      const patchPayload = {};
      for (const key of ["email", "mobile", "direct_dial", "phone", "job_title", "linkedin_url", "linkedin_profile_url", "location"]) {
        if (!savedContact[key] && payload[key]) patchPayload[key] = payload[key];
      }
      if (Object.keys(patchPayload).length) {
        savedContact = await patch("contacts", savedContact.id, patchPayload);
        updatedContacts += 1;
        contactsByIdentity.set(identity, savedContact);
        if (savedContact.email) contactsByEmail.set(normalizeKey(savedContact.email), savedContact);
      }
    } else {
      savedContact = await insert("contacts", payload);
      contactsByIdentity.set(identity, savedContact);
      if (savedContact.email) contactsByEmail.set(normalizeKey(savedContact.email), savedContact);
      createdContacts += 1;
    }
    importedContacts.push(savedContact);

    const contactTargetKey = [campaign.id, "", savedContact.id].join("|");
    if (!targetKeys.has(contactTargetKey)) {
      await insert("campaign_targets", {
        organization_id: emsolClient.organization_id,
        client_id: emsolClient.id,
        campaign_id: campaign.id,
        contact_id: savedContact.id,
        status: "queued",
        metadata: { source: "sample_appointment_import", source_file: row.file, source_row: row.sourceRow },
      });
      targetKeys.add(contactTargetKey);
      createdTargets += 1;
    }
  }

  const companyTargetKey = [campaign.id, company.id, ""].join("|");
  if (!targetKeys.has(companyTargetKey)) {
    await insert("campaign_targets", {
      organization_id: emsolClient.organization_id,
      client_id: emsolClient.id,
      campaign_id: campaign.id,
      company_id: company.id,
      status: "queued",
      metadata: { source: "sample_appointment_import", source_file: row.file, source_row: row.sourceRow },
    });
    targetKeys.add(companyTargetKey);
    createdTargets += 1;
  }

  const primaryContact = importedContacts[0] || null;
  const firstPhone = row.contacts.map(contact => contact.mobile).find(Boolean) || "";
  const title = `Meeting with ${primaryContact?.full_name || row.organizationName}`;
  const meetingPayload = {
    organization_id: emsolClient.organization_id,
    client_id: emsolClient.id,
    campaign_id: campaign.id,
    company_id: company.id,
    contact_id: primaryContact?.id || null,
    user_id: fallbackUser.id,
    owner_user_id: null,
    booked_by_user_id: null,
    title,
    meeting_at: row.meetingAt,
    status: "booked",
    notes: buildNotes(row),
    phone_number: firstPhone || null,
  };
  if (!currentMeetings.some(meeting => isSameMeeting(meeting, meetingPayload))) {
    const savedMeeting = await insert("meetings", meetingPayload);
    currentMeetings.push(savedMeeting);
    createdMeetings += 1;
  }
  rowSummaries.push({
    organization: row.organizationName,
    campaign: campaign.name,
    contact: primaryContact?.full_name || "",
    meetingAt: row.meetingAt,
    phone: firstPhone,
  });
}

console.log(JSON.stringify({
  appointmentRows: appointmentRows.length,
  createdContacts,
  updatedContacts,
  createdTargets,
  createdMeetings,
  skippedRows,
  rows: rowSummaries,
}, null, 2));
