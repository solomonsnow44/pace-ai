import { createContext, createElement, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import {
  ArrowRight,
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Contact,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  ListFilter,
  LockKeyhole,
  LogOut,
  LogIn,
  Mail,
  MapPin,
  Megaphone,
  Moon,
  PanelRight,
  Phone,
  Plug,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Upload,
  UserRound,
  Users,
} from "lucide-react";
import logoUrl from "../images/paceops-logo.jpeg";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const CRM_DATA_METADATA_KEY = "crm_data";
const ALLOWED_EMAIL_DOMAIN = "paceops.com";
const LEAD_FINDER_SEARCH_STATE_KEY = "paceops-lead-finder-search-state";
const LEAD_FINDER_SEARCH_STATE_VERSION = 2;
const DEFAULT_MAX_CONTACTS_PER_COMPANY = 10;

const demoClients = [
  {
    id: "each-other",
    name: "Example Client",
    workspace: "Outbound delivery",
    status: "Active",
    owner: "Workspace Admin",
    accounts: 4,
    contacts: 8,
    health: "Strong",
  },
];

const demoTeamMembers = [
  { name: "Workspace Admin", role: "Account lead", initials: "WA", status: "Online" },
  { name: "Campaign Manager", role: "Campaign operator", initials: "CM", status: "In call block" },
];

const demoCampaigns = [
  {
    id: "survey",
    name: "Survey Outreach",
    status: "Completed",
    owner: "Campaign Manager",
    channel: "Email and calls",
    accounts: 18,
    contacts: 42,
    meetings: 4,
    nextAction: "Review survey replies",
  },
  {
    id: "priority-targeting",
    name: "Priority Account Targeting",
    status: "Active",
    owner: "Workspace Admin",
    channel: "Research-led outbound",
    accounts: 9,
    contacts: 21,
    meetings: 2,
    nextAction: "Prioritise product, design, and research stakeholders",
  },
  {
    id: "discovery-calls",
    name: "Discovery Call Sprint",
    status: "Active",
    owner: "Campaign Manager",
    channel: "Phone and LinkedIn",
    accounts: 7,
    contacts: 16,
    meetings: 1,
    nextAction: "Prepare call block",
  },
];

const demoAccounts = [
  {
    id: "account-01",
    name: "Target Account 01",
    domain: "account-01.example",
    owner: "Workspace Admin",
    stage: "Researching",
    status: "Priority",
    industry: "Finance technology",
    location: "United Kingdom / Ireland",
    employees: "1,000+",
    value: 68000,
    lastActivity: "Persona map updated today",
    nextAction: "Validate product design buying committee",
    insight: "Product-led account with likely design operations and research maturity needs.",
  },
  {
    id: "account-02",
    name: "Target Account 02",
    domain: "account-02.example",
    owner: "Campaign Manager",
    stage: "Contacted",
    status: "Active",
    industry: "Digital banking",
    location: "London",
    employees: "5,000+",
    value: 84000,
    lastActivity: "No answer logged yesterday",
    nextAction: "Call UX research lead before 11:30",
    insight: "Large digital change programme creates a useful research operations entry point.",
  },
  {
    id: "account-03",
    name: "Target Account 03",
    domain: "account-03.example",
    owner: "Workspace Admin",
    stage: "Lead In",
    status: "New",
    industry: "Subscription software",
    location: "London",
    employees: "800+",
    value: 52000,
    lastActivity: "Imported from targeting list",
    nextAction: "Find product operations contacts",
    insight: "Fast team growth makes onboarding and product process consistency relevant.",
  },
  {
    id: "account-04",
    name: "Target Account 04",
    domain: "account-04.example",
    owner: "Campaign Manager",
    stage: "Meeting",
    status: "Warm",
    industry: "Customer operations",
    location: "Dublin",
    employees: "600+",
    value: 46000,
    lastActivity: "Meeting booked for Friday",
    nextAction: "Send discovery agenda",
    insight: "Customer workflow complexity may connect design systems and product velocity.",
  },
];

const demoContacts = [
  {
    id: "contact-01",
    name: "Design Leader 01",
    accountId: "account-01",
    account: "Target Account 01",
    role: "Head of Product Design",
    persona: "Design leadership",
    email: "contact-01@example.test",
    phone: "+35315550101",
    mobile: "+353871110101",
    owner: "Workspace Admin",
    status: "Researching",
    lastTouch: "Profile enriched today",
  },
  {
    id: "contact-02",
    name: "UX Research Contact 01",
    accountId: "account-02",
    account: "Target Account 02",
    role: "Senior UX Researcher",
    persona: "Research operations",
    email: "contact-02@example.test",
    phone: "+442071110202",
    mobile: "+447700900202",
    owner: "Campaign Manager",
    status: "Call back",
    lastTouch: "Voicemail yesterday",
  },
  {
    id: "contact-03",
    name: "Product Operations Contact 01",
    accountId: "account-03",
    account: "Target Account 03",
    role: "Product Operations Lead",
    persona: "Product operations",
    email: "contact-03@example.test",
    phone: "+442071110303",
    mobile: "+447700900303",
    owner: "Workspace Admin",
    status: "New",
    lastTouch: "Added from list",
  },
  {
    id: "contact-04",
    name: "Design Systems Contact 01",
    accountId: "account-04",
    account: "Target Account 04",
    role: "Design Systems Manager",
    persona: "Design systems",
    email: "contact-04@example.test",
    phone: "+35315550404",
    mobile: "+353871110404",
    owner: "Campaign Manager",
    status: "Meeting booked",
    lastTouch: "Meeting confirmed",
  },
  {
    id: "contact-05",
    name: "Product Manager Contact 01",
    accountId: "account-01",
    account: "Target Account 01",
    role: "Product Manager, Payments UX",
    persona: "Product management",
    email: "contact-05@example.test",
    phone: "+35315550505",
    mobile: "+353871110505",
    owner: "Workspace Admin",
    status: "Contacted",
    lastTouch: "Email opened",
  },
  {
    id: "contact-06",
    name: "Digital Experience Contact 01",
    accountId: "account-02",
    account: "Target Account 02",
    role: "Director of Digital Experience",
    persona: "Digital leadership",
    email: "contact-06@example.test",
    phone: "+442071110606",
    mobile: "+447700900606",
    owner: "Campaign Manager",
    status: "Priority",
    lastTouch: "LinkedIn viewed",
  },
];

const pipelineColumns = [
  { id: "lead", name: "Lead In" },
  { id: "researching", name: "Researching" },
  { id: "contacted", name: "Contacted" },
  { id: "meeting", name: "Meeting" },
  { id: "qualified", name: "Qualified" },
];

const scriptBoardStages = [
  { id: "ideas", name: "Ideas" },
  { id: "drafts", name: "Drafts" },
  { id: "ready", name: "Ready" },
  { id: "used", name: "Used" },
];

const demoDeals = [
  { id: "d1", account: "Target Account 03", contact: "Product Operations Contact 01", stage: "lead", value: 52000, owner: "Workspace Admin", due: "Today" },
  { id: "d2", account: "Target Account 01", contact: "Design Leader 01", stage: "researching", value: 68000, owner: "Workspace Admin", due: "Tomorrow" },
  { id: "d3", account: "Target Account 02", contact: "UX Research Contact 01", stage: "contacted", value: 84000, owner: "Campaign Manager", due: "Today" },
  { id: "d4", account: "Target Account 04", contact: "Design Systems Contact 01", stage: "meeting", value: 46000, owner: "Campaign Manager", due: "Friday" },
];

const demoActivities = [
  { type: "Call", title: "Voicemail left for UX Research Contact 01", account: "Target Account 02", time: "Yesterday", owner: "Campaign Manager" },
  { type: "Research", title: "Design systems signal added", account: "Target Account 01", time: "Today", owner: "Workspace Admin" },
  { type: "Meeting", title: "Discovery meeting booked", account: "Target Account 04", time: "Friday", owner: "Campaign Manager" },
  { type: "Import", title: "Product operations contacts added", account: "Target Account 03", time: "Today", owner: "Workspace Admin" },
];

const useDemoData = false;
const initialClients = useDemoData ? demoClients : [];
const initialTeamMembers = useDemoData ? demoTeamMembers : [];
const initialCampaigns = useDemoData ? demoCampaigns : [];
const initialAccounts = useDemoData ? demoAccounts : [];
const initialContacts = useDemoData ? demoContacts : [];
const initialDeals = useDemoData ? demoDeals : [];
const initialActivities = useDemoData ? demoActivities : [];
const initialResearchItems = [];
const initialFiles = [];
const initialScriptItems = [];
const initialCallInsights = [];
const initialWeeklyReports = [];

const emptyClient = {
  id: "none",
  name: "No client selected",
  workspace: "Create a client workspace",
  status: "Empty",
  owner: "Unassigned",
  accounts: 0,
  contacts: 0,
  health: "Not started",
};

const emptyCampaign = {
  id: "none",
  name: "No campaign selected",
  status: "Empty",
  owner: "Unassigned",
  channel: "Not configured",
  accounts: 0,
  contacts: 0,
  meetings: 0,
  nextAction: "Create a campaign to start building pipeline.",
};

const callOutcomes = [
  "Connected",
  "No answer",
  "Voicemail",
  "Gatekeeper",
  "Not interested",
  "Call back",
  "Meeting booked",
  "Wrong number",
];
const COGNISM_REDEEM_CONFIRMATION = "ENABLE REDEEM";

const collaborativeActivityTypes = new Set([
  "Call",
  "Email",
  "Import",
  "Meeting",
  "Research",
  "Team",
]);

const countrySuggestions = [
  "United Kingdom",
  "Ireland",
  "United States",
  "Canada",
  "Australia",
  "France",
  "Germany",
  "Netherlands",
  "Spain",
  "Portugal",
  "Italy",
  "Sweden",
  "Denmark",
  "Norway",
  "Finland",
  "Belgium",
  "Switzerland",
  "Austria",
  "Poland",
  "Mexico",
  "Brazil",
  "Argentina",
  "Chile",
  "India",
  "Singapore",
  "Japan",
];

const baseIntegrations = [
  { name: "Lead Finder", icon: Target, status: "Available", note: "Search preview lead records and export results.", action: "Open Lead Finder", view: "cognism" },
  { name: "Cognism", icon: Target, status: "Connected", note: "Lead Finder uses Cognism preview search for target contacts without redeeming credits.", action: "Open Lead Finder", view: "cognism", redeemEnabled: false },
  { name: "Aircall", icon: Phone, status: "Partial", note: "Click-to-call is available for contacts with redeemed phone numbers.", action: "Open Calls", view: "calls" },
  { name: "OpenAI", icon: Bot, status: "Available", note: "Used in account intelligence and script generation when an API key is configured.", action: "", workflow: "" },
  { name: "HubSpot", icon: Database, status: "Connected", note: "Lead Finder contacts can be exported to HubSpot contacts. Company association depends on HubSpot app scopes.", action: "Open Lead Finder", view: "cognism" },
];
const connectedIntegrationStatuses = new Set(["Available", "Connected", "Partial"]);
const SHOW_INTEGRATION_KEY_CONTROLS = false;

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients", label: "Clients", icon: Building2 },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "accounts", label: "Accounts", icon: BriefcaseBusiness },
  { id: "contacts", label: "Contacts", icon: Contact },
  { id: "cognism", label: "Lead Finder", icon: Target, highlight: true },
  { id: "lead-lists", label: "Lead Lists", icon: ListFilter, highlight: true },
  { id: "lead-lookup", label: "Lead Lookup", icon: Search, highlight: true },
  { id: "pipeline", label: "Pipeline", icon: KanbanSquare },
  { id: "calls", label: "Calls", icon: Phone },
  { id: "research", label: "Research", icon: FileText },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "settings", label: "Settings", icon: Settings },
];

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

function cloneRecords(records) {
  return records.map(record => ({ ...record }));
}

function hydrateIntegrations(savedIntegrations = []) {
  return baseIntegrations.map(integration => {
    const saved = savedIntegrations.find(item => item.name === integration.name) || {};
    return {
      ...saved,
      ...integration,
      redeemEnabled: typeof saved.redeemEnabled === "boolean" ? saved.redeemEnabled : integration.redeemEnabled,
      icon: integration.icon,
    };
  });
}

function createInitialCrmData() {
  return {
    clients: cloneRecords(initialClients),
    teamMembers: cloneRecords(initialTeamMembers),
    campaigns: cloneRecords(initialCampaigns),
    accounts: cloneRecords(initialAccounts),
    contacts: cloneRecords(initialContacts),
    deals: cloneRecords(initialDeals),
    activities: cloneRecords(initialActivities),
    researchItems: cloneRecords(initialResearchItems),
    files: cloneRecords(initialFiles),
    scriptItems: cloneRecords(initialScriptItems),
    callInsights: cloneRecords(initialCallInsights),
    weeklyReports: cloneRecords(initialWeeklyReports),
    integrations: hydrateIntegrations(),
    pipelineStages: cloneRecords(pipelineColumns),
  };
}

function normalizeCrmData(data) {
  const initial = createInitialCrmData();
  if (!data || typeof data !== "object") return initial;
  return {
    ...initial,
    ...data,
    clients: Array.isArray(data.clients) ? data.clients : initial.clients,
    teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : initial.teamMembers,
    campaigns: Array.isArray(data.campaigns) ? data.campaigns : initial.campaigns,
    accounts: Array.isArray(data.accounts) ? data.accounts : initial.accounts,
    contacts: Array.isArray(data.contacts) ? data.contacts : initial.contacts,
    deals: Array.isArray(data.deals) ? data.deals : initial.deals,
    activities: Array.isArray(data.activities) ? data.activities : initial.activities,
    researchItems: Array.isArray(data.researchItems) ? data.researchItems : initial.researchItems,
    files: Array.isArray(data.files) ? data.files : initial.files,
    scriptItems: Array.isArray(data.scriptItems) ? data.scriptItems : initial.scriptItems,
    callInsights: Array.isArray(data.callInsights) ? data.callInsights : initial.callInsights,
    weeklyReports: Array.isArray(data.weeklyReports) ? data.weeklyReports : initial.weeklyReports,
    integrations: hydrateIntegrations(Array.isArray(data.integrations) ? data.integrations : []),
    pipelineStages: Array.isArray(data.pipelineStages) && data.pipelineStages.length
      ? pipelineColumns.map(column => {
        const saved = data.pipelineStages.find(item => item.id === column.id);
        return { ...column, name: saved?.name || column.name };
      })
      : initial.pipelineStages,
  };
}

function serializeCrmData(data) {
  const { workspaceUsers: _workspaceUsers, ...records } = data;
  return {
    ...records,
    integrations: records.integrations.map(integration => ({
      name: integration.name,
      status: integration.status,
      note: integration.note,
      redeemEnabled: integration.redeemEnabled,
    })),
  };
}

function isAllowedEmail(email) {
  return String(email || "").trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

function getStorageKey(userId) {
  return `paceops-crm:${userId || "local"}`;
}

function getUiStateKey(userId) {
  return `paceops-crm-ui:${userId || "local"}`;
}

function loadCrmData(userId) {
  if (typeof window === "undefined" || !userId) return createInitialCrmData();
  const raw = window.localStorage.getItem(getStorageKey(userId));
  if (!raw) return createInitialCrmData();
  try {
    return normalizeCrmData(JSON.parse(raw));
  } catch {
    return createInitialCrmData();
  }
}

function loadUiState(userId) {
  if (typeof window === "undefined" || !userId) return {};
  try {
    const raw = window.localStorage.getItem(getUiStateKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function hasSavedUiState(userId) {
  return Boolean(typeof window !== "undefined" && userId && window.localStorage.getItem(getUiStateKey(userId)));
}

function saveUiState(userId, state) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(getUiStateKey(userId), JSON.stringify(state));
}

function saveCrmData(userId, data) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(serializeCrmData(data)));
}

async function loadSyncedCrmData(userId, organizationId) {
  if (!supabase || !organizationId) return loadCrmData(userId);
  const { data, error } = await supabase
    .from("organizations")
    .select("metadata")
    .eq("id", organizationId)
    .single();

  if (error) throw error;

  const syncedData = data?.metadata?.[CRM_DATA_METADATA_KEY];
  if (syncedData && typeof syncedData === "object") {
    return normalizeCrmData(syncedData);
  }

  const localData = loadCrmData(userId);
  await saveSyncedCrmData(organizationId, localData);
  return localData;
}

async function saveSyncedCrmData(organizationId, data) {
  if (!supabase || !organizationId) return;
  const { data: current, error: loadError } = await supabase
    .from("organizations")
    .select("metadata")
    .eq("id", organizationId)
    .single();

  if (loadError) throw loadError;

  const metadata = current?.metadata && typeof current.metadata === "object" ? current.metadata : {};
  const nextMetadata = {
    ...metadata,
    [CRM_DATA_METADATA_KEY]: serializeCrmData(data),
    crm_data_updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("organizations")
    .update({ metadata: nextMetadata })
    .eq("id", organizationId);

  if (error) throw error;
}

async function loadWorkspaceUsers(organizationId) {
  if (!supabase || !organizationId) return [];
  const { data, error } = await supabase
    .from("users")
    .select("id,email,display_name,full_name,role,status")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("display_name", { ascending: true });

  if (error) throw error;

  return (data || []).map(workspaceUser => {
    const name = workspaceUser.display_name || workspaceUser.full_name || workspaceUser.email?.split("@")[0] || "Workspace user";
    return {
      id: workspaceUser.id,
      email: workspaceUser.email,
      name,
      role: titleCase(workspaceUser.role || "member"),
      initials: accountInitial(name),
      status: "Active",
    };
  });
}

function mapAuthUserToWorkspaceUser(user) {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  const name = metadata.full_name || [metadata.first_name, metadata.last_name].filter(Boolean).join(" ") || user.email?.split("@")[0] || "Workspace user";
  return {
    id: user.id,
    email: user.email,
    name,
    role: "Current user",
    initials: accountInitial(name),
    status: "Active",
  };
}

function mergeWorkspaceUsers(users, fallbackUser) {
  const merged = fallbackUser ? [fallbackUser] : [];
  for (const user of users || []) {
    if (!user?.id || merged.some(item => item.id === user.id)) continue;
    merged.push(user);
  }
  return merged;
}

function mapLeadListRecord(record) {
  return {
    id: record.id,
    organizationId: record.organization_id,
    name: record.name,
    source: record.source,
    assignedUserIds: Array.isArray(record.assigned_user_ids) ? record.assigned_user_ids : [],
    leads: Array.isArray(record.leads) ? record.leads : [],
    filters: record.filters && typeof record.filters === "object" ? record.filters : {},
    createdBy: record.created_by,
    updatedBy: record.updated_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

async function loadLeadLists(organizationId) {
  if (!supabase || !organizationId) return [];
  const { data, error } = await supabase
    .from("lead_lists")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapLeadListRecord);
}

function normalizeLookupValue(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return normalizeLookupValue(value).toLowerCase();
}

function normalizePhone(value) {
  return normalizeLookupValue(value).replace(/[^\d+]/g, "");
}

function normalizeLinkedinUrl(value) {
  const url = normalizeLookupValue(value);
  if (!url) return "";
  return url
    .replace(/^http:\/\/(www\.)?linkedin\.com\/in\//i, "https://www.linkedin.com/in/")
    .replace(/^https:\/\/linkedin\.com\/in\//i, "https://www.linkedin.com/in/")
    .replace(/^www\.linkedin\.com\/in\//i, "https://www.linkedin.com/in/")
    .replace(/^linkedin\.com\/in\//i, "https://www.linkedin.com/in/");
}

function buildLinkedInTargetUrl(lead = {}) {
  if (lead.linkedinProfileUrl) return normalizeLinkedinUrl(lead.linkedinProfileUrl);
  const keywords = encodeURIComponent([lead.contactName, lead.company].map(normalizeLookupValue).filter(Boolean).join(" "));
  return `https://www.linkedin.com/search/results/people/?keywords=${keywords}`;
}

function splitContactName(contactName = "") {
  const parts = normalizeLookupValue(contactName).split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
}

function buildLeadIdentityKey(lead = {}) {
  if (lead.cognismContactId) return `cognism:${normalizeLookupValue(lead.cognismContactId).toLowerCase()}`;
  if (lead.linkedinProfileUrl) return `linkedin:${normalizeLinkedinUrl(lead.linkedinProfileUrl).toLowerCase()}`;
  return `person:${normalizeLookupValue(lead.contactName).toLowerCase()}|${normalizeLookupValue(lead.company).toLowerCase()}`;
}

function mapContactDatabaseRecord(record) {
  return {
    id: record.id,
    organizationId: record.organization_id,
    contactName: record.contact_name || "",
    firstName: record.first_name || "",
    lastName: record.last_name || "",
    company: record.company || "",
    jobTitle: record.job_title || "",
    location: record.location || "",
    linkedinProfileUrl: record.linkedin_profile_url || "",
    manualEmail: record.manual_email || "",
    manualMobile: record.manual_mobile || "",
    manualDirectDial: record.manual_direct_dial || "",
    notes: record.notes || record.lookup_notes || "",
    sourceNote: record.source_note || "",
    dataSource: record.data_source || "manual",
    confidence: record.confidence,
    cognismContactId: record.cognism_contact_id || "",
    normalizedIdentityKey: record.normalized_identity_key || "",
    lookupStatus: record.lookup_status || "",
    lookupNotes: record.lookup_notes || "",
    hubspotContactId: record.hubspot_contact_id || "",
    hubspotExportedAt: record.hubspot_exported_at || "",
    hubspotExportStatus: record.hubspot_export_status || "",
    hubspotExportError: record.hubspot_export_error || "",
    createdBy: record.created_by,
    updatedBy: record.updated_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

async function loadLeadContactDatabase(organizationId) {
  if (!supabase || !organizationId) return [];
  const { data, error } = await supabase
    .from("lead_contact_database")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapContactDatabaseRecord);
}

function findLeadDatabaseMatch(lead, contactDatabase = []) {
  const cognismId = normalizeLookupValue(lead.cognismContactId).toLowerCase();
  if (cognismId) {
    const match = contactDatabase.find(contact => normalizeLookupValue(contact.cognismContactId).toLowerCase() === cognismId);
    if (match) return match;
  }

  const linkedinUrl = normalizeLinkedinUrl(lead.linkedinProfileUrl).toLowerCase();
  if (linkedinUrl) {
    const match = contactDatabase.find(contact => normalizeLinkedinUrl(contact.linkedinProfileUrl).toLowerCase() === linkedinUrl);
    if (match) return match;
  }

  const contactName = normalizeLookupValue(lead.contactName).toLowerCase();
  const company = normalizeLookupValue(lead.company).toLowerCase();
  const fallbackKey = `person:${contactName}|${company}`;
  return contactDatabase.find(contact => (
    contact.normalizedIdentityKey === fallbackKey
    || (
      normalizeLookupValue(contact.contactName).toLowerCase() === contactName
      && normalizeLookupValue(contact.company).toLowerCase() === company
    )
  )) || null;
}

function hydrateLeadWithContactDatabase(lead, contactDatabase = []) {
  const match = findLeadDatabaseMatch(lead, contactDatabase);
  if (!match) return lead;

  return {
    ...lead,
    manualEmail: match.manualEmail || lead.manualEmail || "",
    manualMobile: match.manualMobile || lead.manualMobile || "",
    linkedinProfileUrl: match.linkedinProfileUrl || lead.linkedinProfileUrl || "",
    sourceNote: match.sourceNote || lead.sourceNote || "Added manually by PaceOps user",
    dataSource: match.dataSource || lead.dataSource || "manual",
    dbContactId: match.id,
    notes: match.notes || lead.notes || "",
    hubspotContactId: match.hubspotContactId || lead.hubspotContactId || "",
    hubspotExportedAt: match.hubspotExportedAt || lead.hubspotExportedAt || "",
    hubspotExportStatus: match.hubspotExportStatus || lead.hubspotExportStatus || "",
    hubspotExportError: match.hubspotExportError || lead.hubspotExportError || "",
  };
}

function hydrateLeadsWithContactDatabase(leads, contactDatabase = []) {
  return (leads || []).map(lead => hydrateLeadWithContactDatabase(lead, contactDatabase));
}

function loadLeadFinderSearchState() {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEAD_FINDER_SEARCH_STATE_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== LEAD_FINDER_SEARCH_STATE_VERSION && Number(parsed.maxPerCompany) <= 1) {
      return { ...parsed, maxPerCompany: DEFAULT_MAX_CONTACTS_PER_COMPANY };
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveLeadFinderSearchState(state) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEAD_FINDER_SEARCH_STATE_KEY, JSON.stringify(state));
}

function clearLeadFinderSearchState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(LEAD_FINDER_SEARCH_STATE_KEY);
}

function leadHasPaceOpsData(lead = {}) {
  return Boolean(
    normalizeLookupValue(lead.linkedinProfileUrl)
    || normalizeLookupValue(lead.manualEmail)
    || normalizeLookupValue(lead.manualMobile)
    || normalizeLookupValue(lead.notes)
    || normalizeLookupValue(lead.dbContactId)
  );
}

function leadHasManualData(lead = {}) {
  return Boolean(
    normalizeLookupValue(lead.linkedinProfileUrl)
    || normalizeLookupValue(lead.manualEmail)
    || normalizeLookupValue(lead.manualMobile)
    || normalizeLookupValue(lead.notes)
  );
}

function validateLeadManualFields(lead = {}) {
  const linkedinUrl = normalizeLinkedinUrl(lead.linkedinProfileUrl);
  const email = normalizeLookupValue(lead.manualEmail);
  const mobile = normalizeLookupValue(lead.manualMobile);
  const phonePattern = /^[+\d\s()-]+$/;

  if (linkedinUrl && !/^https:\/\/(www\.)?linkedin\.com\/in\/.+/i.test(linkedinUrl)) {
    return "LinkedIn profile URL must be a LinkedIn /in/ profile URL.";
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Manual email must look like a valid email address.";
  }
  if (mobile && !phonePattern.test(mobile)) {
    return "Manual mobile can only include +, digits, spaces, brackets, and dashes.";
  }
  return "";
}

function findPotentialContactConflicts(lead = {}, contactDatabase = []) {
  return contactDatabase.filter(contact => {
    if (lead.dbContactId && contact.id === lead.dbContactId) return false;
    const sameLinkedin = lead.linkedinProfileUrl && contact.linkedinProfileUrl
      && normalizeLinkedinUrl(lead.linkedinProfileUrl).toLowerCase() === normalizeLinkedinUrl(contact.linkedinProfileUrl).toLowerCase();
    const sameEmail = lead.manualEmail && contact.manualEmail
      && normalizeEmail(lead.manualEmail) === normalizeEmail(contact.manualEmail);
    const sameMobile = lead.manualMobile && contact.manualMobile
      && normalizePhone(lead.manualMobile) === normalizePhone(contact.manualMobile);
    return sameLinkedin || sameEmail || sameMobile;
  });
}

function buildLeadContactDatabasePayload(lead, organizationId, userId) {
  const { firstName, lastName } = splitContactName(lead.contactName);
  const hasManualData = leadHasManualData(lead) || lead.dataSource === "manual";
  const isCognismPreviewLead = Boolean(normalizeLookupValue(lead.cognismContactId));
  const sourceNote = hasManualData
    ? (isCognismPreviewLead ? "Cognism preview row edited by PaceOps user" : "Added manually by PaceOps user")
    : "Cognism preview search result";
  const dataSource = isCognismPreviewLead ? "cognism_preview" : hasManualData ? "manual" : "cognism_preview";

  const payload = {
    organization_id: organizationId,
    contact_name: normalizeLookupValue(lead.contactName),
    first_name: firstName,
    last_name: lastName,
    company: normalizeLookupValue(lead.company),
    job_title: normalizeLookupValue(lead.jobTitle),
    location: normalizeLookupValue(lead.location),
    linkedin_profile_url: normalizeLinkedinUrl(lead.linkedinProfileUrl) || null,
    manual_email: normalizeEmail(lead.manualEmail) || null,
    manual_mobile: normalizeLookupValue(lead.manualMobile) || null,
    manual_direct_dial: null,
    notes: normalizeLookupValue(lead.notes) || null,
    source_note: sourceNote,
    data_source: dataSource,
    confidence: Number.isFinite(Number(lead.confidence)) ? Number(lead.confidence) : 0.85,
    cognism_contact_id: normalizeLookupValue(lead.cognismContactId) || null,
    normalized_identity_key: buildLeadIdentityKey(lead),
    lookup_status: null,
    lookup_notes: normalizeLookupValue(lead.notes) || null,
    hubspot_contact_id: normalizeLookupValue(lead.hubspotContactId) || null,
    hubspot_exported_at: lead.hubspotExportedAt || null,
    hubspot_export_status: normalizeLookupValue(lead.hubspotExportStatus) || null,
    hubspot_export_error: normalizeLookupValue(lead.hubspotExportError) || null,
    created_by: userId,
    updated_by: userId,
  };

  if (lead.dbContactId) payload.id = lead.dbContactId;
  return payload;
}

function buildPreviewContactDatabasePayload(lead, organizationId, userId, existingContact) {
  const { firstName, lastName } = splitContactName(lead.contactName);
  const payload = {
    organization_id: organizationId,
    contact_name: existingContact?.contactName || normalizeLookupValue(lead.contactName),
    first_name: existingContact?.firstName || firstName,
    last_name: existingContact?.lastName || lastName,
    company: existingContact?.company || normalizeLookupValue(lead.company),
    job_title: existingContact?.jobTitle || normalizeLookupValue(lead.jobTitle),
    location: existingContact?.location || normalizeLookupValue(lead.location),
    linkedin_profile_url: existingContact?.linkedinProfileUrl || normalizeLinkedinUrl(lead.linkedinProfileUrl) || null,
    manual_email: existingContact?.manualEmail || null,
    manual_mobile: existingContact?.manualMobile || null,
    manual_direct_dial: existingContact?.manualDirectDial || null,
    notes: existingContact?.notes || null,
    source_note: existingContact?.sourceNote || "Cognism preview search result",
    data_source: existingContact?.dataSource || "cognism_preview",
    confidence: Number.isFinite(Number(existingContact?.confidence)) ? Number(existingContact.confidence) : 0.65,
    cognism_contact_id: normalizeLookupValue(existingContact?.cognismContactId || lead.cognismContactId) || null,
    normalized_identity_key: buildLeadIdentityKey({ ...lead, ...existingContact }),
    lookup_status: existingContact?.lookupStatus || null,
    lookup_notes: existingContact?.notes || null,
    hubspot_contact_id: existingContact?.hubspotContactId || lead.hubspotContactId || null,
    hubspot_exported_at: existingContact?.hubspotExportedAt || lead.hubspotExportedAt || null,
    hubspot_export_status: existingContact?.hubspotExportStatus || lead.hubspotExportStatus || null,
    hubspot_export_error: existingContact?.hubspotExportError || lead.hubspotExportError || null,
    created_by: existingContact?.createdBy || userId,
    updated_by: userId,
  };

  return payload;
}

function makeId(prefix) {
  const randomId = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomId}`;
}

function makeActivity(type, title, account = "Workspace", owner = "Workspace user", extra = {}) {
  return {
    id: makeId("activity"),
    type,
    title,
    account,
    time: "Just now",
    owner,
    ...extra,
  };
}

function titleCase(value) {
  return String(value || "")
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function buildCallInsight({ contact, account, outcome, notes = "", transcript = "", preset = "General analysis" }) {
  const text = `${notes} ${transcript}`.toLowerCase();
  const riskTerms = ["not interested", "expensive", "busy", "no budget", "already", "send info", "not now"];
  const positiveTerms = ["meeting", "interested", "send", "yes", "useful", "call back", "book"];
  const risks = riskTerms.filter(term => text.includes(term));
  const positives = positiveTerms.filter(term => text.includes(term));
  const sentimentScore = Math.max(1, Math.min(10, 5 + positives.length - risks.length));
  const possibleObjections = risks.length ? risks.map(term => titleCase(term)) : ["Timing", "Budget", "Current supplier"];
  const suggestedMove = outcome === "Meeting booked"
    ? "Confirm agenda, attendees, and business impact before the meeting."
    : risks.length
      ? "Acknowledge the objection, ask one diagnostic question, then agree a small next step."
      : "Use the strongest account signal and ask for the right owner or next conversation.";

  return {
    id: makeId("call-insight"),
    contactId: contact?.id || "",
    contactName: contact?.name || "Unknown contact",
    accountId: account?.id || "",
    account: account?.name || contact?.account || "Workspace",
    outcome,
    preset,
    sentimentScore,
    possibleObjections,
    suggestedMove,
    notes,
    transcript,
    createdAt: new Date().toISOString(),
  };
}

function buildWeeklyReport({ calls = [], insights = [], client, campaign, timeframe = "This week" }) {
  const meetingCount = calls.filter(call => call.outcome === "Meeting booked").length;
  const connectedCount = calls.filter(call => call.outcome === "Connected").length;
  const averageSentiment = insights.length
    ? Math.round((insights.reduce((total, insight) => total + Number(insight.sentimentScore || 0), 0) / insights.length) * 10) / 10
    : 0;
  const objections = [...new Set(insights.flatMap(insight => insight.possibleObjections || []))].slice(0, 6);

  return {
    id: makeId("weekly-report"),
    clientId: client?.id || "",
    campaignId: campaign?.id || "",
    timeframe,
    title: `${client?.name || "Workspace"} ${timeframe.toLowerCase()} sales analysis`,
    summary: `${calls.length} calls reviewed. ${connectedCount} connected, ${meetingCount} meetings booked. Average sentiment ${averageSentiment || "not enough data"}.`,
    highlights: [
      meetingCount ? `${meetingCount} meeting${meetingCount === 1 ? "" : "s"} booked` : "No meetings booked yet",
      objections.length ? `Common objections: ${objections.join(", ")}` : "No recurring objections captured yet",
      insights[0]?.suggestedMove || "Capture more transcripts to improve recommendations",
    ],
    createdAt: new Date().toISOString(),
  };
}

function refreshCrmData(data) {
  const workspaceUsers = Array.isArray(data.workspaceUsers) ? data.workspaceUsers : [];
  const clientsWithCounts = data.clients.map(client => {
    const clientAccounts = data.accounts.filter(account => account.clientId === client.id);
    const clientContacts = data.contacts.filter(contact => contact.clientId === client.id);
    return {
      ...client,
      accounts: clientAccounts.length,
      contacts: clientContacts.length,
      health: clientAccounts.length || clientContacts.length ? "Active" : "Needs setup",
    };
  });

  const campaignsWithCounts = data.campaigns.map(campaign => ({
    ...campaign,
    accounts: data.accounts.filter(account => account.clientId === campaign.clientId).length,
    contacts: data.contacts.filter(contact => contact.clientId === campaign.clientId).length,
  }));

  return {
    ...data,
    workspaceUsers,
    clients: clientsWithCounts,
    campaigns: campaignsWithCounts,
  };
}

const CrmDataContext = createContext(createInitialCrmData());

function useCrmData() {
  return useContext(CrmDataContext);
}

function accountInitial(name) {
  const initials = String(name || "")
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "PO";
}

function StatusBadge({ children, tone = "neutral" }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

function PhoneLink({ number, label = "Call" }) {
  if (!number) return <span className="muted-inline">No number</span>;
  return (
    <a className="call-link" href={`tel:${number}`}>
      <Phone size={14} />
      <span>{label}</span>
    </a>
  );
}

function getRedeemedPhoneNumber(contact) {
  return contact?.redeemed === true && contact?.phoneNumber ? String(contact.phoneNumber) : "";
}

async function buildApiHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (!supabase) return headers;
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

function AircallDialButton({ contact, phoneNumber: phoneNumberOverride = "", source = "crm_contact", label = "Call", compact = false }) {
  const phoneNumber = phoneNumberOverride || getRedeemedPhoneNumber(contact);
  const dialPhoneNumber = normalizePhone(phoneNumber);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const canDial = Boolean(dialPhoneNumber && contact?.id);
  const buttonTitle = message || (phoneNumber ? `Call ${phoneNumber}` : "Contact required");

  async function dialContact() {
    setStatus("loading");
    setMessage("");

    try {
      const { data } = supabase ? await supabase.auth.getSession() : { data: null };
      const token = data?.session?.access_token;
      if (!token) throw new Error("Sign in before sending numbers to Aircall.");

      const response = await fetch("/api/aircall/dial", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: dialPhoneNumber, contactId: contact.id, source }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Aircall dial failed");
      setStatus("success");
      setMessage(payload.message || "Number sent to Aircall.");
    } catch (dialError) {
      setStatus("error");
      setMessage(dialError.message || "Aircall dial failed");
    }
  }

  return (
    <div className={`aircall-dial ${compact ? "compact" : ""}`}>
      {!compact ? <span>{phoneNumber || "Contact required"}</span> : null}
      <button className={`secondary-button ${status === "error" ? "dial-button-error" : ""}`} type="button" disabled={!canDial || status === "loading"} onClick={dialContact} title={buttonTitle} aria-label={buttonTitle}>
        <Phone size={16} />
        {!compact ? (status === "loading" ? "Dialing" : label) : null}
      </button>
      {message && !compact ? <small className={status === "error" ? "dial-error" : "dial-success"}>{message}</small> : null}
    </div>
  );
}

function PageHeader({ title, eyebrow, description, children }) {
  return (
    <header className="page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-actions">{children}</div>
    </header>
  );
}

function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <button className="sidebar-logo" type="button" onClick={() => onNavigate("dashboard")} aria-label="Go to dashboard">
        <img src={logoUrl} alt="PaceOps" />
      </button>
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-button ${activeView === item.id ? "active" : ""} ${item.highlight ? "highlight" : ""}`}
              type="button"
              title={item.label}
              aria-label={item.label}
              onClick={() => onNavigate(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function TopBar({
  canGoBack,
  onBack,
  activeClient,
  activeCampaign,
  onClientChange,
  onCampaignChange,
  isDark,
  onThemeToggle,
  drawerOpen,
  onDrawerToggle,
  search,
  onSearchChange,
  searchResults,
  onSearchSelect,
  onLogout,
  loggingOut,
}) {
  const { clients, campaigns } = useCrmData();

  return (
    <header className="topbar">
      <div className="topbar-leading">
        {canGoBack && (
          <button className="back-button" type="button" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="switchers">
          <label>
            <span>Client</span>
            <select value={activeClient.id} onChange={event => onClientChange(event.target.value)}>
              {clients.length
                ? clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)
                : <option value="none">No clients yet</option>}
            </select>
            <ChevronDown size={14} />
          </label>
          <label>
            <span>Campaign</span>
            <select value={activeCampaign.id} onChange={event => onCampaignChange(event.target.value)}>
              {campaigns.length
                ? campaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)
                : <option value="none">No campaigns yet</option>}
            </select>
            <ChevronDown size={14} />
          </label>
        </div>
      </div>

      <div className="global-search">
        <Search size={18} />
        <input
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="Search accounts, contacts, campaigns, users"
          aria-label="Global search"
        />
        {search.length > 1 && (
          <div className="search-results">
            {searchResults.length ? searchResults.map(result => (
              <button key={`${result.type}-${result.id}`} type="button" onClick={() => onSearchSelect(result)}>
                <span>{result.type}</span>
                <strong>{result.title}</strong>
                <small>{result.meta}</small>
              </button>
            )) : <div className="search-empty">No matching records</div>}
          </div>
        )}
      </div>

      <div className="topbar-actions">
        <button className="icon-action" type="button" onClick={onDrawerToggle} aria-label="Toggle assistant drawer">
          <PanelRight size={18} />
          <span>{drawerOpen ? "Hide" : "AI"}</span>
        </button>
        <button className="icon-action" type="button" onClick={onThemeToggle} aria-label="Toggle theme">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon-action logout-action" type="button" onClick={onLogout} disabled={loggingOut}>
          <LogOut size={18} />
          <span>{loggingOut ? "Signing out" : "Log out"}</span>
        </button>
      </div>
    </header>
  );
}

function MetricCard({ label, value, detail, icon }) {
  return (
    <section className="metric-card">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
      {createElement(icon, { size: 20 })}
    </section>
  );
}

function FilterBar({ label = "Current view" }) {
  const [activeFilter, setActiveFilter] = useState("Priority");
  const filters = ["Priority", "Owner", "Last activity"];

  return (
    <div className="filter-bar">
      <div>
        <ListFilter size={16} />
        <span>{label}</span>
      </div>
      {filters.map(filter => (
        <button
          key={filter}
          className={`secondary-button ${activeFilter === filter ? "selected-filter" : ""}`}
          type="button"
          onClick={() => setActiveFilter(filter)}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function DashboardPage({ activeClient, activeCampaign, onNavigate, onOpenAccount }) {
  const { deals, campaigns, accounts, teamMembers } = useCrmData();
  const pipelineValue = deals.reduce((total, deal) => total + deal.value, 0);
  const bookedMeetings = campaigns.reduce((total, campaign) => total + campaign.meetings, 0);

  return (
    <>
      <PageHeader
        eyebrow={`${activeClient.name} workspace`}
        title="Sales workspace"
        description="A focused view of campaigns, accounts, calls, and research activity for the current client."
      >
        <button className="secondary-button" type="button" onClick={() => onNavigate("research")}>
          <FileText size={16} />
          Open research
        </button>
        <button className="primary-button" type="button" onClick={() => onNavigate("calls")}>
          <Phone size={16} />
          Create call block
        </button>
      </PageHeader>

      <div className="metrics-grid">
        <MetricCard label="Active campaign" value={campaigns.length ? activeCampaign.name : "No campaign yet"} detail={activeCampaign.nextAction} icon={Megaphone} />
        <MetricCard label="Priority accounts" value={accounts.length} detail={accounts.length ? "Ready for review" : "Add accounts to build pipeline"} icon={BriefcaseBusiness} />
        <MetricCard label="Open pipeline" value={currency.format(pipelineValue)} detail="Across current client workspace" icon={KanbanSquare} />
        <MetricCard label="Meetings booked" value={bookedMeetings} detail={bookedMeetings ? "From active campaigns" : "No meetings logged yet"} icon={CalendarDays} />
      </div>

      <div className="dashboard-grid single">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Next best action</span>
              <h2>Build your first workspace records</h2>
            </div>
            <StatusBadge tone="accent">Setup</StatusBadge>
          </div>
          {accounts.length ? (
            <div className="action-list">
              {accounts.slice(0, 4).map(account => (
              <button key={account.id} type="button" onClick={() => onOpenAccount(account.id)}>
                <span className="record-avatar">{accountInitial(account.name)}</span>
                <span>
                  <strong>{account.name}</strong>
                  <small>{account.nextAction}</small>
                </span>
                <ArrowRight size={16} />
              </button>
              ))}
            </div>
          ) : (
            <EmptyState icon={Target} title="No accounts yet" text="Create or import accounts, then add contacts and deals to start building pipeline." />
          )}
        </section>
      </div>

      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Activity timeline</span>
              <h2>Recent client activity</h2>
            </div>
          </div>
          <ActivityTimeline collaborativeOnly />
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Team</span>
              <h2>Delivery team</h2>
            </div>
          </div>
          {teamMembers.length ? (
            <div className="team-list">
              {teamMembers.map(member => (
              <div key={member.name} className="team-row">
                <span>{member.initials}</span>
                <div>
                  <strong>{member.name}</strong>
                  <small>{member.role}</small>
                </div>
                <TeamStatusBadge status={member.status} />
              </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="No team members yet" text="Invite teammates once your organization workspace is ready." />
          )}
        </section>
      </div>
    </>
  );
}

function ClientsPage({ onOpenClient, onNewClient, onEditClient }) {
  const { clients } = useCrmData();

  return (
    <>
      <PageHeader
        eyebrow="Clients"
        title="Client workspaces"
        description="Manage the client layer before moving into campaigns, accounts, contacts, and delivery workflows."
      >
        <button className="primary-button" type="button" onClick={onNewClient}>
          <Plus size={16} />
          New client
        </button>
      </PageHeader>
      <section className="panel">
        {clients.length ? <DataTable
          columns={["Client", "Workspace", "Owner", "Accounts", "Contacts", "Health", ""]}
          rows={clients.map(client => [
            <RecordName key="client" name={client.name} meta={client.status} />,
            client.workspace,
            client.owner,
            client.accounts,
            client.contacts,
            <StatusBadge key="health" tone="success">{client.health}</StatusBadge>,
            <div key="actions" className="row-actions">
              <button className="text-button" type="button" onClick={event => {
                event.stopPropagation();
                onEditClient(client);
              }}>Edit</button>
              <button className="text-button" type="button" onClick={event => {
                event.stopPropagation();
                onOpenClient(client.id);
              }}>Open</button>
            </div>,
          ])}
          rowActions={clients.map(client => () => onOpenClient(client.id))}
        /> : <EmptyState icon={Building2} title="No clients yet" text="Create your first client to start managing campaigns, accounts, contacts, and pipeline." />}
      </section>
    </>
  );
}

function ClientDetailPage({ client, onOpenCampaign, onEditClient, onNewCampaign, onNewAccount }) {
  const { campaigns, accounts, contacts, activities } = useCrmData();
  const clientCampaigns = campaigns.filter(campaign => campaign.clientId === client.id);
  const clientAccounts = accounts.filter(account => account.clientId === client.id);
  const clientContacts = contacts.filter(contact => contact.clientId === client.id);
  const clientCalls = activities.filter(activity => activity.type === "Call" && clientAccounts.some(account => account.name === activity.account));

  return (
    <>
      <PageHeader
        eyebrow="Client detail"
        title={client.name}
        description="A client-level view for campaign coverage, workspace health, account progress, and team ownership."
      >
        <button className="secondary-button" type="button" onClick={() => onEditClient(client)}>Edit client</button>
        <button className="secondary-button" type="button" onClick={onNewCampaign}>New campaign</button>
        <button className="primary-button" type="button" onClick={onNewAccount}>Add account</button>
      </PageHeader>
      <div className="metrics-grid">
        <MetricCard label="Campaigns" value={clientCampaigns.length} detail={clientCampaigns.length ? "Campaigns in this client" : "Create the first campaign"} icon={Megaphone} />
        <MetricCard label="Accounts" value={clientAccounts.length} detail={clientAccounts.length ? "Accounts assigned" : "Add target accounts"} icon={BriefcaseBusiness} />
        <MetricCard label="Contacts" value={clientContacts.length} detail={clientContacts.length ? "Contacts mapped" : "Add contacts after accounts"} icon={Users} />
        <MetricCard label="Calls logged" value={clientCalls.length} detail={clientCalls.length ? "Recent call activity" : "No calls logged yet"} icon={Phone} />
      </div>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header"><h2>Client campaigns</h2></div>
          <CampaignList compact onOpenCampaign={onOpenCampaign} />
        </section>
        <section className="panel">
          <div className="panel-header"><h2>Workspace notes</h2></div>
          <div className="detail-list">
            <div><span>Primary goal</span><strong>{client.workspace}</strong></div>
            <div><span>Data posture</span><strong>CRM data is created inside this signed-in workspace.</strong></div>
            <div><span>Next review</span><strong>{activities[0]?.title || "Add activity to build the workspace timeline"}</strong></div>
          </div>
        </section>
      </div>
    </>
  );
}

function CampaignsPage({ onOpenCampaign, onEditCampaign, onNewCampaign, onImport }) {
  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title="Campaign command"
        description="Switch between survey follow-up and current account targeting without losing client context."
      >
        <button className="secondary-button" type="button" onClick={onImport}>
          <Upload size={16} />
          CSV import
        </button>
        <button className="primary-button" type="button" onClick={onNewCampaign}>
          <Plus size={16} />
          New campaign
        </button>
      </PageHeader>
      <FilterBar label="Campaign filters" />
      <CampaignList onOpenCampaign={onOpenCampaign} onEditCampaign={onEditCampaign} />
    </>
  );
}

function CampaignList({ onOpenCampaign, onEditCampaign, compact = false }) {
  const { campaigns } = useCrmData();

  return (
    <section className={compact ? "" : "panel"}>
      {campaigns.length ? <div className={compact ? "campaign-list compact" : "campaign-grid"}>
        {campaigns.map(campaign => (
          <article
            key={campaign.id}
            className={`campaign-card ${compact ? "compact" : ""}`}
            onClick={compact && onOpenCampaign ? () => onOpenCampaign(campaign.id) : undefined}
          >
            <div className="campaign-card-head">
              <span className="record-avatar">{campaign.name.slice(0, 2).toUpperCase()}</span>
              <div>
                <h2>{campaign.name}</h2>
                <p>{campaign.channel}</p>
              </div>
              <StatusBadge tone={campaign.status === "Active" ? "success" : "neutral"}>{campaign.status}</StatusBadge>
            </div>
            <div className="mini-stats">
              <span>{campaign.accounts} accounts</span>
              <span>{campaign.contacts} contacts</span>
              <span>{campaign.meetings} meetings</span>
            </div>
            <button className={compact ? "icon-action" : "text-button"} type="button" onClick={event => {
              event.stopPropagation();
              onOpenCampaign?.(campaign.id);
            }} aria-label={`View ${campaign.name}`}>
              {compact ? <ArrowRight size={16} /> : <>View campaign <ArrowRight size={14} /></>}
            </button>
            {!compact && (
              <button className="text-button" type="button" onClick={event => {
                event.stopPropagation();
                onEditCampaign?.(campaign);
              }}>Edit</button>
            )}
          </article>
        ))}
      </div> : <EmptyState icon={Megaphone} title="No campaigns yet" text="Create a campaign when you are ready to run outreach, call blocks, or research workflows." />}
    </section>
  );
}

function CampaignDetailPage({ campaign, onNavigate, onOpenAccount, onEditCampaign }) {
  const { accounts, workspaceUsers } = useCrmData();
  const assignedUserIds = Array.isArray(campaign.memberIds) ? campaign.memberIds : [];
  const assignedUsers = (workspaceUsers || []).filter(workspaceUser => assignedUserIds.includes(workspaceUser.id));

  return (
    <>
      <PageHeader
        eyebrow="Campaign detail"
        title={campaign.name}
        description={campaign.nextAction}
      >
        <button className="secondary-button" type="button" onClick={() => onEditCampaign(campaign)}>Edit campaign</button>
        <button className="secondary-button" type="button" onClick={() => onNavigate("contacts")}>Contacts</button>
        <button className="primary-button" type="button" onClick={() => onNavigate("calls")}>Call queue</button>
      </PageHeader>
      <div className="metrics-grid">
        <MetricCard label="Accounts" value={campaign.accounts} detail="In campaign scope" icon={BriefcaseBusiness} />
        <MetricCard label="Contacts" value={campaign.contacts} detail="Mapped to personas" icon={Users} />
        <MetricCard label="Meetings" value={campaign.meetings} detail="Booked so far" icon={CalendarDays} />
        <MetricCard label="Owner" value={campaign.owner} detail={campaign.channel} icon={UserRound} />
      </div>
      <section className="panel">
        <div className="panel-header"><h2>Campaign account focus</h2></div>
        {accounts.length ? <AccountTable onOpenAccount={onOpenAccount} /> : <EmptyState icon={BriefcaseBusiness} title="No campaign accounts yet" text="Add accounts to this client to create campaign focus." />}
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Team</span>
            <h2>Campaign users</h2>
          </div>
          <button className="text-button" type="button" onClick={() => onEditCampaign(campaign)}>Manage users</button>
        </div>
        {assignedUsers.length ? (
          <div className="team-list">
            {assignedUsers.map(member => (
              <div key={member.id} className="team-row">
                <span>{member.initials}</span>
                <div>
                  <strong>{member.name}</strong>
                  <small>{member.email}</small>
                </div>
                <StatusBadge>{member.role}</StatusBadge>
              </div>
            ))}
          </div>
        ) : <EmptyState icon={Users} title="No users assigned" text="Add PaceOps users to make this campaign visible as collaborative work." />}
      </section>
    </>
  );
}

function AccountsPage({ onOpenAccount, onEditAccount, onNewAccount, onImport }) {
  const { accounts } = useCrmData();

  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="Target accounts"
        description="Account-based prospecting workspace for a fresh target account list."
      >
        <button className="secondary-button" type="button" onClick={onImport}>
          <Upload size={16} />
          Import list
        </button>
        <button className="primary-button" type="button" onClick={onNewAccount}>
          <Plus size={16} />
          Add account
        </button>
      </PageHeader>
      <FilterBar label="Account filters" />
      <section className="panel">
        {accounts.length ? <AccountTable onOpenAccount={onOpenAccount} onEditAccount={onEditAccount} /> : <EmptyState icon={BriefcaseBusiness} title="No accounts yet" text="Add accounts manually or import a CSV to start building your target list." />}
      </section>
    </>
  );
}

function AccountTable({ onOpenAccount, onEditAccount }) {
  const { accounts } = useCrmData();

  return (
    <DataTable
      columns={["Account", "Owner", "Stage", "Value", "Last activity", "Next action", ""]}
      rows={accounts.map(account => [
        <RecordName key="account" name={account.name} meta={`${account.industry} - ${account.domain}`} />,
        account.owner,
        <StatusBadge key="stage" tone={account.status === "Priority" ? "accent" : "neutral"}>{account.stage}</StatusBadge>,
        currency.format(account.value),
        account.lastActivity,
        account.nextAction,
        <div key="actions" className="row-actions">
          <button className="text-button" type="button" onClick={() => onEditAccount?.(account)}>Edit</button>
          <button className="text-button" type="button" onClick={() => onOpenAccount(account.id)}>Open</button>
        </div>,
      ])}
    />
  );
}

function AccountDetailPage({ account, onOpenContact, onEditAccount, onQueueResearch, onNewContact, onNewDeal }) {
  const { contacts, deals } = useCrmData();
  const accountContacts = contacts.filter(contact => contact.accountId === account.id);
  const accountDeals = deals.filter(deal => deal.account === account.name);

  return (
    <>
      <PageHeader
        eyebrow="Account detail"
        title={account.name}
        description={account.insight}
      >
        <button className="secondary-button" type="button" onClick={() => onEditAccount(account)}>Edit account</button>
        <button className="secondary-button" type="button">
          <ExternalLink size={16} />
          {account.domain}
        </button>
        <button className="primary-button" type="button" onClick={() => onQueueResearch(account.id)}>
          <Sparkles size={16} />
          Research brief
        </button>
      </PageHeader>
      <div className="record-hero">
        <span className="record-avatar large">{accountInitial(account.name)}</span>
        <div className="detail-list inline">
          <div><span>Owner</span><strong>{account.owner}</strong></div>
          <div><span>Stage</span><strong>{account.stage}</strong></div>
          <div><span>Location</span><strong>{account.location}</strong></div>
          <div><span>Employees</span><strong>{account.employees}</strong></div>
        </div>
      </div>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header">
            <h2>Contacts</h2>
            <button className="text-button" type="button" onClick={() => onNewContact(account.id)}>Add contact</button>
          </div>
          {accountContacts.length ? <div className="compact-list">
            {accountContacts.map(contact => (
              <button key={contact.id} type="button" onClick={() => onOpenContact(contact.id)}>
                <span>
                  <strong>{contact.name}</strong>
                  <small>{contact.role}</small>
                </span>
                <span className="muted-inline">{getRedeemedPhoneNumber(contact) || "Redeem required"}</span>
              </button>
            ))}
          </div> : <EmptyState icon={Contact} title="No contacts on this account" text="Add contacts to map stakeholders and build the call queue." />}
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Deals</h2>
            <button className="text-button" type="button" onClick={() => onNewDeal(account.id)}>New deal</button>
          </div>
          {accountDeals.length ? <div className="detail-list">
            {accountDeals.map(deal => (
              <div key={deal.id}>
                <span>{deal.stage}</span>
                <strong>{currency.format(deal.value)} with {deal.contact}</strong>
              </div>
            ))}
          </div> : <EmptyState icon={KanbanSquare} title="No deals for this account" text="Create a deal when there is a qualified opportunity to track." />}
        </section>
      </div>
      {account.scripts && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Account intelligence</span>
              <h2>Outreach scripts</h2>
            </div>
          </div>
          <div className="script-grid">
            <div>
              <span>Call opener</span>
              <p>{account.scripts.callOpener}</p>
            </div>
            <div>
              <span>Voicemail</span>
              <p>{account.scripts.voicemail}</p>
            </div>
            <div>
              <span>Email</span>
              <strong>{account.scripts.emailSubject}</strong>
              <p>{account.scripts.emailBody}</p>
            </div>
            <div>
              <span>LinkedIn note</span>
              <p>{account.scripts.linkedinNote}</p>
            </div>
            <div>
              <span>Discovery question</span>
              <p>{account.scripts.discoveryQuestion}</p>
            </div>
          </div>
        </section>
      )}
      <section className="panel">
        <div className="panel-header"><h2>Activity timeline</h2></div>
        <ActivityTimeline account={account.name} />
      </section>
    </>
  );
}

function ContactsPage({ onOpenContact, onEditContact, onNewContact, onImport }) {
  const { contacts } = useCrmData();

  return (
    <>
      <PageHeader
        eyebrow="Contacts"
        title="Contacts and personas"
        description="UX, product, design, and research stakeholders linked to the active account list."
      >
        <button className="secondary-button" type="button" onClick={onImport}>
          <Upload size={16} />
          Import contacts
        </button>
        <button className="primary-button" type="button" onClick={() => onNewContact()}>
          <Plus size={16} />
          Add contact
        </button>
      </PageHeader>
      <FilterBar label="Contact filters" />
      <section className="panel">
        {contacts.length ? <ContactTable onOpenContact={onOpenContact} onEditContact={onEditContact} /> : <EmptyState icon={Contact} title="No contacts yet" text="Add contacts after creating accounts, or import a contact list when CSV import is connected." />}
      </section>
    </>
  );
}

function ContactTable({ onOpenContact, onEditContact }) {
  const { contacts } = useCrmData();

  return (
    <DataTable
      columns={["Contact", "Account", "Persona", "Owner", "Status", "Revealed phone", ""]}
      rows={contacts.map(contact => [
        <RecordName key="contact" name={contact.name} meta={contact.role} />,
        contact.account,
        contact.persona,
        contact.owner,
        <StatusBadge key="status" tone={contact.status === "Meeting booked" ? "success" : "neutral"}>{contact.status}</StatusBadge>,
        <AircallDialButton key="aircall" contact={contact} />,
        <div key="actions" className="row-actions">
          <button className="text-button" type="button" onClick={() => onEditContact?.(contact)}>Edit</button>
          <button className="text-button" type="button" onClick={() => onOpenContact(contact.id)}>Open</button>
        </div>,
      ])}
    />
  );
}

function ContactDetailPage({ contact, onEditContact, onLogCall, onDraftEmail }) {
  const { accounts } = useCrmData();
  const [outcome, setOutcome] = useState("Connected");
  const [notes, setNotes] = useState("");
  const account = accounts.find(item => item.id === contact.accountId);

  return (
    <>
      <PageHeader
        eyebrow="Contact detail"
        title={contact.name}
        description={`${contact.role} at ${contact.account}. ${contact.lastTouch}.`}
      >
        <button className="secondary-button" type="button" onClick={() => onEditContact(contact)}>Edit contact</button>
        <AircallDialButton contact={contact} />
        <button className="primary-button" type="button" onClick={() => onDraftEmail(contact.id)}>
          <Mail size={16} />
          Draft email
        </button>
      </PageHeader>
      <div className="record-hero">
        <span className="record-avatar large">{accountInitial(contact.name)}</span>
        <div className="detail-list inline">
          <div><span>Account</span><strong>{contact.account}</strong></div>
          <div><span>Persona</span><strong>{contact.persona}</strong></div>
          <div><span>Owner</span><strong>{contact.owner}</strong></div>
          <div><span>Status</span><strong>{contact.status}</strong></div>
        </div>
      </div>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header"><h2>Contact details</h2></div>
          <div className="detail-list">
            <div><span>Email</span><strong>{contact.email}</strong></div>
            <div><span>Revealed phone</span><strong>{getRedeemedPhoneNumber(contact) || "Redeem required"}</strong></div>
            <div><span>Lead Finder status</span><strong>{contact.redeemed ? "Redeemed" : "Preview-only or not redeemed"}</strong></div>
            <div><span>Account signal</span><strong>{account?.insight}</strong></div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Aircall MVP</span>
              <h2>Log call outcome</h2>
            </div>
          </div>
          <div className="call-logger">
            <div className="call-actions">
              <AircallDialButton contact={contact} />
            </div>
            <label>
              Outcome
              <select value={outcome} onChange={event => setOutcome(event.target.value)}>
                {callOutcomes.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
            <textarea value={notes} placeholder="Notes, objections, next step" onChange={event => setNotes(event.target.value)} />
            <button className="primary-button" type="button" onClick={() => {
              onLogCall({ contactId: contact.id, outcome, notes });
              setNotes("");
            }}>Save outcome</button>
          </div>
        </section>
      </div>
    </>
  );
}

function PipelinePage({ onOpenAccount, onMoveDeal, onNewDeal, onUpdateStages }) {
  const { deals, accounts, pipelineStages } = useCrmData();
  const [draggedDealId, setDraggedDealId] = useState("");
  const [dropStage, setDropStage] = useState("");
  const [editingStages, setEditingStages] = useState(false);
  const [draftStages, setDraftStages] = useState(() => cloneRecords(pipelineStages || pipelineColumns));

  function saveStages() {
    const nextStages = draftStages.map((stage, index) => ({
      ...stage,
      name: stage.name.trim() || pipelineColumns[index]?.name || stage.id,
    }));
    onUpdateStages(nextStages);
    setEditingStages(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Opportunity board"
        description="Drag deals between stages to keep account movement current."
      >
        <button className="secondary-button" type="button" onClick={() => {
          if (!editingStages) setDraftStages(cloneRecords(pipelineStages || pipelineColumns));
          setEditingStages(value => !value);
        }}>
          <Settings size={16} />
          Stage settings
        </button>
        <button className="primary-button" type="button" onClick={() => onNewDeal()}>
          <Plus size={16} />
          New deal
        </button>
      </PageHeader>
      {editingStages && (
        <section className="panel pipeline-settings-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Pipeline stages</span>
              <h2>Rename stages</h2>
            </div>
          </div>
          <div className="stage-editor-grid">
            {draftStages.map((stage, index) => (
              <FormField key={stage.id} label={`Stage ${index + 1}`}>
                <input
                  value={stage.name}
                  onChange={event => setDraftStages(current => current.map(item => item.id === stage.id ? { ...item, name: event.target.value } : item))}
                />
              </FormField>
            ))}
          </div>
          <div className="stage-editor-actions">
            <button className="secondary-button" type="button" onClick={() => {
              setDraftStages(cloneRecords(pipelineStages || pipelineColumns));
              setEditingStages(false);
            }}>Cancel</button>
            <button className="primary-button" type="button" onClick={saveStages}>Save stages</button>
          </div>
        </section>
      )}
      <div className="pipeline-board">
        {(pipelineStages || pipelineColumns).map(column => {
          const columnDeals = deals.filter(deal => deal.stage === column.id);
          return (
            <section
              key={column.id}
              className={`pipeline-column ${dropStage === column.id ? "drop-target" : ""}`}
              onDragOver={event => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropStage(column.id);
              }}
              onDragLeave={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) setDropStage("");
              }}
              onDrop={event => {
                event.preventDefault();
                const dealId = event.dataTransfer.getData("text/plain") || draggedDealId;
                setDraggedDealId("");
                setDropStage("");
                if (dealId) onMoveDeal(dealId, column.id);
              }}
            >
              <div className="pipeline-column-head">
                <strong>{column.name}</strong>
                <span>{columnDeals.length}</span>
              </div>
              {columnDeals.map(deal => {
                const account = accounts.find(item => item.name === deal.account);
                return (
                  <article
                    key={deal.id}
                    className={`pipeline-card ${draggedDealId === deal.id ? "dragging" : ""}`}
                    draggable
                    role="button"
                    tabIndex={0}
                    onClick={() => account && onOpenAccount(account.id)}
                    onKeyDown={event => {
                      if (event.key === "Enter") account && onOpenAccount(account.id);
                    }}
                    onDragStart={event => {
                      setDraggedDealId(deal.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", deal.id);
                    }}
                    onDragEnd={() => {
                      setDraggedDealId("");
                      setDropStage("");
                    }}
                  >
                    <strong>{deal.account}</strong>
                    <span>{deal.contact}</span>
                    <div>
                      <small>{deal.owner}</small>
                      <small>{currency.format(deal.value)}</small>
                    </div>
                    <StatusBadge>{deal.due}</StatusBadge>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
      {!deals.length && (
        <section className="panel empty-board-panel">
          <EmptyState icon={KanbanSquare} title="No deals in the pipeline yet" text="Create accounts and contacts first, then add deals to start tracking pipeline." />
        </section>
      )}
    </>
  );
}

function CallsPage({ onOpenContact, onLogCall, onStartCallBlock }) {
  const { contacts, callInsights } = useCrmData();
  const [outcome, setOutcome] = useState("Connected");
  const [contactId, setContactId] = useState("");
  const [notes, setNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [analysisPreset, setAnalysisPreset] = useState("Possible objections");

  return (
    <>
      <PageHeader
        eyebrow="Calls"
        title="Call workspace"
        description="Aircall dialing is enabled only for contacts with redeemed phone numbers. Outcome logging writes to the CRM activity timeline."
      >
        <button className="secondary-button" type="button">
          <Phone size={16} />
          Aircall backend
        </button>
        <button className="primary-button" type="button" onClick={onStartCallBlock}>
          <Clock size={16} />
          Start call block
        </button>
      </PageHeader>
      <div className="content-grid calls-layout">
        <section className="panel">
          <div className="panel-header"><h2>Today call queue</h2></div>
          {contacts.length ? <DataTable
            columns={["Contact", "Account", "Status", "Revealed phone", ""]}
            rows={contacts.slice(0, 5).map(contact => [
              <RecordName key="contact" name={contact.name} meta={contact.role} />,
              contact.account,
              contact.status,
              <AircallDialButton key="aircall" contact={contact} />,
              <button key="open" className="text-button" type="button" onClick={() => onOpenContact(contact.id)}>Log</button>,
            ])}
          /> : <EmptyState icon={Phone} title="No calls queued" text="Add contacts with phone numbers to create your first call block." />}
        </section>
        <section className="panel call-sidebar">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Call outcome</span>
              <h2>Manual log</h2>
            </div>
          </div>
          <div className="call-logger">
            <label>
              Contact
              <select value={contactId || contacts[0]?.id || ""} onChange={event => setContactId(event.target.value)}>
                {contacts.length
                  ? contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>)
                  : <option value="">No contacts yet</option>}
              </select>
            </label>
            <label>
              Outcome
              <select value={outcome} onChange={event => setOutcome(event.target.value)}>
                {callOutcomes.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
            <textarea value={notes} placeholder="Notes, objections, next step" onChange={event => setNotes(event.target.value)} />
            <label>
              Analysis preset
              <select value={analysisPreset} onChange={event => setAnalysisPreset(event.target.value)}>
                <option>Possible objections</option>
                <option>Sentiment score</option>
                <option>Next best action</option>
                <option>Discovery gaps</option>
                <option>Custom review</option>
              </select>
            </label>
            <textarea value={transcript} placeholder="Paste call transcript for AI-style analysis and weekly reporting" onChange={event => setTranscript(event.target.value)} />
            <button className="primary-button" type="button" disabled={!contacts.length} onClick={() => {
              onLogCall({ contactId: contactId || contacts[0]?.id, outcome, notes, transcript, analysisPreset });
              setNotes("");
              setTranscript("");
            }}>Save outcome</button>
          </div>
        </section>
      </div>
      {callInsights.length ? (
        <section className="panel call-insights-panel">
          <div className="panel-header"><h2>Recent call insights</h2></div>
          <div className="call-insight-grid">
            {callInsights.slice(0, 6).map(insight => (
              <article key={insight.id} className="call-insight-card">
                <div>
                  <strong>{insight.contactName}</strong>
                  <StatusBadge tone={Number(insight.sentimentScore) >= 7 ? "success" : Number(insight.sentimentScore) <= 4 ? "warning" : "neutral"}>{insight.sentimentScore}/10</StatusBadge>
                </div>
                <span>{insight.account}</span>
                <p>{insight.suggestedMove}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function ResearchPage({ activeClient, activeCampaign, onOpenAccount, onAddSource, onQueueResearch, onGenerateScripts, onMoveScript, onGenerateReport }) {
  const { accounts, researchItems, scriptItems = [], weeklyReports = [], callInsights = [] } = useCrmData();
  const [draggedScriptId, setDraggedScriptId] = useState("");
  const [reportTimeframe, setReportTimeframe] = useState("This week");
  const scopedAccounts = activeClient?.id && activeClient.id !== "none" ? accounts.filter(account => account.clientId === activeClient.id) : accounts;
  const scopedResearchItems = researchItems.filter(item => (
    (!activeClient?.id || activeClient.id === "none" || item.clientId === activeClient.id)
    && (!activeCampaign?.id || activeCampaign.id === "none" || !item.campaignId || item.campaignId === activeCampaign.id)
  ));
  const scopedScripts = scriptItems.filter(item => (
    (!activeClient?.id || activeClient.id === "none" || item.clientId === activeClient.id)
    && (!activeCampaign?.id || activeCampaign.id === "none" || !item.campaignId || item.campaignId === activeCampaign.id)
  ));

  return (
    <>
      <PageHeader
        eyebrow="Research"
        title="Account intelligence"
        description={`${activeClient?.name || "Workspace"} research and scripts${activeCampaign?.name && activeCampaign.id !== "none" ? ` for ${activeCampaign.name}` : ""}.`}
      >
        <button className="secondary-button" type="button" onClick={onAddSource}>
          <Upload size={16} />
          Add source
        </button>
        <button className="primary-button" type="button" onClick={() => onQueueResearch()}>
          <Sparkles size={16} />
          Queue research
        </button>
        <button className="secondary-button" type="button" onClick={onGenerateScripts}>
          <Bot size={16} />
          Generate scripts
        </button>
      </PageHeader>
      <section className="panel research-scope-panel">
        <div className="results-summary">
          <div><span>Client</span><strong>{activeClient?.name || "No client"}</strong></div>
          <div><span>Campaign</span><strong>{activeCampaign?.name || "No campaign"}</strong></div>
          <div><span>Call insights</span><strong>{callInsights.length}</strong></div>
          <div><span>Reports</span><strong>{weeklyReports.length}</strong></div>
        </div>
      </section>
      {scopedResearchItems.length > 0 && (
        <section className="panel research-queue-panel">
          <div className="panel-header"><h2>Research queue</h2></div>
          <div className="detail-list">
            {scopedResearchItems.map(item => (
              <div key={item.id}>
                <span>{item.account}</span>
                <strong>{item.title}</strong>
                <small>{item.summary}</small>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="research-grid">
        {scopedAccounts.length ? scopedAccounts.map(account => (
          <article key={account.id} className="research-card">
            <div className="research-card-head">
              <span className="record-avatar">{accountInitial(account.name)}</span>
              <StatusBadge tone={account.status === "Priority" ? "accent" : "neutral"}>{account.status}</StatusBadge>
            </div>
            <h2>{account.name}</h2>
            <p>{account.insight}</p>
            <div className="detail-list">
              <div><span>Data gap</span><strong>Buying committee validation</strong></div>
              <div><span>Suggested angle</span><strong>{account.nextAction}</strong></div>
            </div>
            <button className="text-button" type="button" onClick={() => onOpenAccount(account.id)}>
              Open account <ArrowRight size={14} />
            </button>
          </article>
        )) : <section className="panel"><EmptyState icon={FileText} title="No research records yet" text="Research summaries will appear after accounts are added and research jobs are created." /></section>}
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Script builder</span>
            <h2>AI script board</h2>
          </div>
          <StatusBadge>{scopedScripts.length} scripts</StatusBadge>
        </div>
        <div className="script-board">
          {scriptBoardStages.map(stage => (
            <section
              key={stage.id}
              className={`script-board-column ${draggedScriptId ? "dragging" : ""}`}
              onDragOver={event => event.preventDefault()}
              onDrop={() => {
                if (draggedScriptId) onMoveScript(draggedScriptId, stage.id);
                setDraggedScriptId("");
              }}
            >
              <h3>{stage.name}</h3>
              {scopedScripts.filter(script => script.stage === stage.id).map(script => (
                <article key={script.id} className="script-card" draggable onDragStart={() => setDraggedScriptId(script.id)} onDragEnd={() => setDraggedScriptId("")}>
                  <strong>{script.title}</strong>
                  <span>{script.channel}</span>
                  <p>{script.body}</p>
                </article>
              ))}
            </section>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Calendar analysis</span>
            <h2>Sales analysis reports</h2>
          </div>
          <div className="report-range-controls">
            <select value={reportTimeframe} onChange={event => setReportTimeframe(event.target.value)}>
              <option>Today</option>
              <option>Yesterday</option>
              <option>This week</option>
              <option>Last 7 days</option>
              <option>This month</option>
            </select>
            <button className="secondary-button" type="button" onClick={() => onGenerateReport(reportTimeframe)}>
              <FileText size={16} />
              Generate report
            </button>
          </div>
        </div>
        {weeklyReports.length ? <div className="weekly-report-list">
          {weeklyReports.slice(0, 4).map(report => (
            <article key={report.id} className="weekly-report-card">
              <strong>{report.title}</strong>
              <span>{report.timeframe}</span>
              <p>{report.summary}</p>
              <ul>{(report.highlights || []).map(item => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div> : <EmptyState icon={FileText} title="No reports yet" text="Save call transcripts, then generate a weekly analysis report." />}
      </section>
    </>
  );
}

function parseLines(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

const companyImportColumnNames = new Set([
  "company",
  "company name",
  "account",
  "account name",
  "organisation",
  "organization",
]);

function normalizeImportHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function dedupeCompanyImportRows(rows) {
  const seenCompanies = new Set();
  const uniqueRows = [];

  for (const row of rows) {
    const companyName = String(row.companyName || "").trim();
    const companyKey = companyName.toLowerCase();
    if (!companyName || seenCompanies.has(companyKey)) continue;
    seenCompanies.add(companyKey);
    uniqueRows.push({ ...row, companyName });
  }

  return uniqueRows;
}

function extractCompanyImportRowsFromSheet(rows, sourceFile, sourceSheet = "") {
  const headerRowIndex = rows.findIndex(row => row.some(cell => companyImportColumnNames.has(normalizeImportHeader(cell))));
  if (headerRowIndex === -1) return [];

  const headerRow = rows[headerRowIndex];
  const companyColumnIndex = headerRow.findIndex(cell => companyImportColumnNames.has(normalizeImportHeader(cell)));

  return rows
    .slice(headerRowIndex + 1)
    .map(row => ({
      companyName: String(row[companyColumnIndex] || "").trim(),
      sourceFile,
      sourceSheet,
    }))
    .filter(row => row.companyName);
}

async function parseCompanyImportFile(file) {
  const filename = file?.name || "";
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!["csv", "xlsx"].includes(extension)) {
    throw new Error("Upload a .xlsx or .csv file.");
  }

  const workbook = extension === "csv"
    ? XLSX.read(await file.text(), { type: "string" })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });

  const importedRows = workbook.SheetNames.flatMap(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", blankrows: false });
    return extractCompanyImportRowsFromSheet(rows, filename, extension === "csv" ? "" : sheetName);
  });

  return dedupeCompanyImportRows(importedRows);
}

const cognismExportColumns = [
  ["company", "Company"],
  ["contactName", "Contact name"],
  ["jobTitle", "Job title"],
  ["location", "Location"],
  ["cognismContactId", "Preview/contact ID"],
  ["linkedinProfileUrl", "LinkedIn profile URL"],
  ["manualEmail", "Manual email"],
  ["manualMobile", "Manual mobile"],
  ["notes", "Notes"],
  ["dataSource", "Data source"],
  ["sourceNote", "Source note"],
  ["dbContactId", "PaceOps DB contact ID"],
  ["assignedUsers", "Assigned users"],
];

function exportCellValue(value) {
  if (typeof value === "boolean") return value ? "Available" : "Not available";
  return value ?? "";
}

function csvEscape(value) {
  const stringValue = String(exportCellValue(value));
  return /[",\n]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
}

function downloadTextFile(filename, mimeType, contents) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportCognismResults(results, format, assignedUsers = []) {
  const timestamp = new Date().toISOString().slice(0, 10);
  const assignedUserText = assignedUsers.map(user => `${user.name} <${user.email}>`).join("; ");
  const exportResults = results.map(result => ({
    ...result,
    assignedUsers: assignedUserText,
  }));

  if (format === "json") {
    downloadTextFile(
      `lead-finder-preview-${timestamp}.json`,
      "application/json;charset=utf-8",
      JSON.stringify({ mode: "preview_only", estimatedCreditsUsed: 0, assignedUsers, results: exportResults }, null, 2),
    );
    return;
  }

  if (format === "xls") {
    const headerCells = cognismExportColumns.map(([, label]) => `<th>${label}</th>`).join("");
    const rows = exportResults.map(result => (
      `<tr>${cognismExportColumns.map(([key]) => `<td>${String(exportCellValue(result[key])).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</td>`).join("")}</tr>`
    )).join("");

    downloadTextFile(
      `lead-finder-preview-${timestamp}.xls`,
      "application/vnd.ms-excel;charset=utf-8",
      `<table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>`,
    );
    return;
  }

  const header = cognismExportColumns.map(([, label]) => csvEscape(label)).join(",");
  const rows = exportResults.map(result => cognismExportColumns.map(([key]) => csvEscape(result[key])).join(","));
  downloadTextFile(
    `lead-finder-preview-${timestamp}.csv`,
    "text/csv;charset=utf-8",
    [header, ...rows].join("\n"),
  );
}

function userNamesForIds(userIds, workspaceUsers) {
  return (userIds || [])
    .map(userId => workspaceUsers.find(user => user.id === userId))
    .filter(Boolean);
}

function DataSourceBadge({ lead }) {
  return lead.dbContactId ? <StatusBadge tone="success">Saved</StatusBadge> : <StatusBadge>Not saved</StatusBadge>;
}

function LinkedInProfileField({ value, onChange, onBlur, onOpen, canSearch = true }) {
  const hasProfile = Boolean(value);
  const buttonLabel = hasProfile ? "Open LinkedIn profile" : "Search LinkedIn for this lead";

  return (
    <div className="linkedin-cell">
      <div className="linkedin-control-row">
        <button
          className={`secondary-button linkedin-open-button ${hasProfile ? "has-linkedin-url" : ""}`}
          type="button"
          onClick={onOpen}
          disabled={!hasProfile && !canSearch}
          title={buttonLabel}
          aria-label={buttonLabel}
        >
          <span className="linkedin-in-mark" aria-hidden="true">in</span>
          <span className="visually-hidden">{buttonLabel}</span>
        </button>
        <StatusBadge tone={hasProfile ? "success" : "neutral"}>{hasProfile ? "Profile" : "Search"}</StatusBadge>
      </div>
      <label className="linkedin-url-field">
        <span>LinkedIn URL</span>
        <input
          className="table-input"
          value={value || ""}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="linkedin.com/in/name"
        />
      </label>
    </div>
  );
}

function LeadLookupLinkedInButton({ contact }) {
  const displayName = contact.contactName || [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "this lead";
  const hasProfile = Boolean(contact.linkedinProfileUrl);

  return (
    <a
      className="lookup-linkedin-button"
      href={buildLinkedInTargetUrl(contact)}
      target="_blank"
      rel="noreferrer noopener"
      title={hasProfile ? "Open LinkedIn" : "Search LinkedIn"}
      aria-label={`Open LinkedIn for ${displayName}`}
    >
      <span aria-hidden="true">in</span>
    </a>
  );
}

function TeamStatusBadge({ status }) {
  const normalizedStatus = String(status || "").toLowerCase();
  const tone = ["active", "online"].includes(normalizedStatus) ? "success" : "neutral";
  return <StatusBadge tone={tone}>{status || "Invited"}</StatusBadge>;
}

function HubSpotExportResultModal({ result, onClose }) {
  if (!result?.open) return null;
  const isError = result.status === "error";
  const failures = Array.isArray(result.failures) ? result.failures : [];
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="workflow-modal hubspot-result-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <span className="eyebrow">HubSpot export</span>
            <h2>{isError ? "Export needs attention" : "Export successful"}</h2>
          </div>
          <button className="secondary-button" type="button" onClick={onClose}>Close</button>
        </div>
        <div className={isError ? "form-success warning" : "form-success"}>
          {result.summary}
        </div>
        {result.detail ? <p className="modal-helper-text">{result.detail}</p> : null}
        {failures.length ? (
          <div className="hubspot-failure-list">
            {failures.map(failure => (
              <div key={failure.rowId || `${failure.name}-${failure.error}`}>
                <strong>{failure.name || "Lead row"}</strong>
                {failure.company ? <span>{failure.company}</span> : null}
                <small>{failure.error || "HubSpot rejected this row."}</small>
              </div>
            ))}
          </div>
        ) : null}
        <div className="modal-actions">
          <button className="primary-button" type="button" onClick={onClose}>Done</button>
        </div>
      </section>
    </div>
  );
}

function buildHubSpotExportFailures(rows = [], results = []) {
  const rowsById = new Map(rows.map(row => [row.rowId, row]));
  return results
    .filter(result => result.hubspotExportStatus === "error")
    .map(result => {
      const row = rowsById.get(result.rowId) || {};
      return {
        rowId: result.rowId,
        name: row.contactName || "Unnamed lead",
        company: row.company || "",
        error: result.hubspotExportError || "HubSpot rejected this row.",
      };
    });
}

function createManualLeadDraft() {
  return {
    localId: makeId("manual-lead"),
    contactName: "",
    company: "",
    jobTitle: "",
    location: "",
    linkedinProfileUrl: "",
    manualEmail: "",
    manualMobile: "",
    notes: "",
    dataSource: "manual",
    sourceNote: "Added manually by PaceOps user",
  };
}

function LeadDatabasePage({ leadLists, contactDatabase = [], onSaveLeadContact, onAddToCrmContacts }) {
  const { contacts: crmContacts } = useCrmData();
  const [leadLookupQuery, setLeadLookupQuery] = useState("");
  const [leadLookupCompany, setLeadLookupCompany] = useState("");
  const [leadLookupTitle, setLeadLookupTitle] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [leadLookupDrafts, setLeadLookupDrafts] = useState({});
  const [leadLookupSaveStatuses, setLeadLookupSaveStatuses] = useState({});
  const [leadLookupPageSize, setLeadLookupPageSize] = useState("10");
  const [leadLookupPage, setLeadLookupPage] = useState(1);
  const leadLookupCompanyOptions = [...new Set(contactDatabase.map(contact => normalizeLookupValue(contact.company)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const leadLookupTitleOptions = [...new Set(contactDatabase.map(contact => normalizeLookupValue(contact.jobTitle)).filter(Boolean))].sort((a, b) => a.localeCompare(b)).slice(0, 120);
  const leadListMembershipByIdentity = new Map();

  for (const list of leadLists) {
    for (const lead of list.leads || []) {
      const keys = [
        buildLeadIdentityKey(lead),
        lead.dbContactId ? `db:${lead.dbContactId}` : "",
      ].filter(Boolean);
      for (const key of keys) {
        const current = leadListMembershipByIdentity.get(key) || [];
        if (!current.some(item => item.id === list.id)) current.push({ id: list.id, name: list.name });
        leadListMembershipByIdentity.set(key, current);
      }
    }
  }

  const leadLookupTerms = normalizeLookupValue(leadLookupQuery).toLowerCase().split(/\s+/).filter(Boolean);
  const filteredLeadLookupResults = contactDatabase.filter(contact => {
    if (leadLookupCompany && normalizeLookupValue(contact.company) !== leadLookupCompany) return false;
    if (leadLookupTitle && normalizeLookupValue(contact.jobTitle) !== leadLookupTitle) return false;
    if (!leadLookupTerms.length) return true;
    const searchableText = [
      contact.contactName,
      contact.firstName,
      contact.lastName,
      contact.manualEmail,
      contact.manualMobile,
      contact.manualDirectDial,
      contact.company,
      contact.jobTitle,
      contact.location,
      contact.linkedinProfileUrl,
      contact.notes,
    ].map(value => normalizeLookupValue(value).toLowerCase()).join(" ");
    return leadLookupTerms.every(term => searchableText.includes(term));
  });
  const leadLookupRowsPerPage = leadLookupPageSize === "all" ? filteredLeadLookupResults.length || 1 : Number(leadLookupPageSize);
  const leadLookupPageCount = Math.max(Math.ceil(filteredLeadLookupResults.length / leadLookupRowsPerPage), 1);
  const safeLeadLookupPage = Math.min(leadLookupPage, leadLookupPageCount);
  const leadLookupStartIndex = leadLookupPageSize === "all" ? 0 : (safeLeadLookupPage - 1) * leadLookupRowsPerPage;
  const leadLookupResults = leadLookupPageSize === "all"
    ? filteredLeadLookupResults
    : filteredLeadLookupResults.slice(leadLookupStartIndex, leadLookupStartIndex + leadLookupRowsPerPage);
  const leadLookupShownStart = filteredLeadLookupResults.length ? leadLookupStartIndex + 1 : 0;
  const leadLookupShownEnd = leadLookupStartIndex + leadLookupResults.length;

  function getLookupDraft(contact) {
    return leadLookupDrafts[contact.id] || contact;
  }

  function updateLookupDraft(contact, field, value) {
    setLeadLookupDrafts(current => ({
      ...current,
      [contact.id]: {
        ...contact,
        ...(current[contact.id] || {}),
        [field]: value,
      },
    }));
    setLeadLookupSaveStatuses(current => ({ ...current, [contact.id]: "idle" }));
  }

  function findCrmContactMatch(lead) {
    const leadEmail = normalizeEmail(lead.manualEmail);
    const leadMobile = normalizePhone(lead.manualMobile || lead.manualDirectDial);
    const leadName = normalizeLookupValue(lead.contactName || [lead.firstName, lead.lastName].filter(Boolean).join(" ")).toLowerCase();
    const leadCompany = normalizeLookupValue(lead.company).toLowerCase();

    return crmContacts.find(contact => {
      const sameEmail = leadEmail && normalizeEmail(contact.email) === leadEmail;
      const sameMobile = leadMobile && normalizePhone(contact.mobile || contact.phone) === leadMobile;
      const samePersonAtCompany = leadName
        && leadCompany
        && normalizeLookupValue(contact.name).toLowerCase() === leadName
        && normalizeLookupValue(contact.account).toLowerCase() === leadCompany;
      return sameEmail || sameMobile || samePersonAtCompany;
    }) || null;
  }

  async function saveLookupLead(contact) {
    const draft = getLookupDraft(contact);
    const nextLead = {
      ...contact,
      ...draft,
      contactName: normalizeLookupValue(draft.contactName),
      company: normalizeLookupValue(draft.company),
      jobTitle: normalizeLookupValue(draft.jobTitle),
      location: normalizeLookupValue(draft.location),
      linkedinProfileUrl: normalizeLinkedinUrl(draft.linkedinProfileUrl),
      manualEmail: normalizeEmail(draft.manualEmail),
      manualMobile: normalizeLookupValue(draft.manualMobile),
      notes: normalizeLookupValue(draft.notes),
      dbContactId: contact.id,
      sourceNote: draft.sourceNote || "Edited in Lead Lookup",
    };
    setLeadLookupSaveStatuses(current => ({ ...current, [contact.id]: "saving" }));
    try {
      await onSaveLeadContact(nextLead, { allowPreviewOnly: true });
      setLeadLookupDrafts(current => {
        const next = { ...current };
        delete next[contact.id];
        return next;
      });
      setLeadLookupSaveStatuses(current => ({ ...current, [contact.id]: "saved" }));
    } catch {
      setLeadLookupSaveStatuses(current => ({ ...current, [contact.id]: "error" }));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Lead Database"
        title="Lead lookup"
        description="Search saved lead records by person, company, position, email, phone, or notes."
      >
        <button className="secondary-button" type="button" onClick={() => setEditMode(current => !current)}>
          <Database size={16} />
          {editMode ? "Done editing" : "Edit mode"}
        </button>
      </PageHeader>
      <section className="panel lead-lookup-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Saved data</span>
            <h2>Find saved leads</h2>
          </div>
          <div className="cognism-meta">
            <StatusBadge>{contactDatabase.length} saved</StatusBadge>
            <StatusBadge>{filteredLeadLookupResults.length} matching</StatusBadge>
            <StatusBadge>{leadLookupResults.length} shown</StatusBadge>
          </div>
        </div>
        <div className="lead-lookup-controls">
          <label className="save-list-inline lead-lookup-search">
            <span>Search people, email, phone, company, title</span>
            <input
              value={leadLookupQuery}
              onChange={event => {
                setLeadLookupQuery(event.target.value);
                setLeadLookupPage(1);
              }}
              placeholder="Jane Smith, smith@company.com, +353, Stripe, CFO"
            />
          </label>
          <label className="save-list-inline">
            <span>Company</span>
            <select value={leadLookupCompany} onChange={event => {
              setLeadLookupCompany(event.target.value);
              setLeadLookupPage(1);
            }}>
              <option value="">All companies</option>
              {leadLookupCompanyOptions.map(company => <option key={company} value={company}>{company}</option>)}
            </select>
          </label>
          <label className="save-list-inline">
            <span>Position</span>
            <select value={leadLookupTitle} onChange={event => {
              setLeadLookupTitle(event.target.value);
              setLeadLookupPage(1);
            }}>
              <option value="">All positions</option>
              {leadLookupTitleOptions.map(title => <option key={title} value={title}>{title}</option>)}
            </select>
          </label>
          <button className="secondary-button" type="button" onClick={() => {
            setLeadLookupQuery("");
            setLeadLookupCompany("");
            setLeadLookupTitle("");
            setLeadLookupPage(1);
          }} disabled={!leadLookupQuery && !leadLookupCompany && !leadLookupTitle}>
            <Circle size={16} />
            Clear
          </button>
        </div>
        <div className="table-pagination">
          <div>
            <span className="eyebrow">Rows</span>
            <strong>{leadLookupShownStart}-{leadLookupShownEnd} of {filteredLeadLookupResults.length}</strong>
          </div>
          <div className="table-pagination-actions">
            <label className="save-list-inline compact-select">
              <span>Rows per page</span>
              <select value={leadLookupPageSize} onChange={event => {
                setLeadLookupPageSize(event.target.value);
                setLeadLookupPage(1);
              }}>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">All</option>
              </select>
            </label>
            <button className="secondary-button" type="button" onClick={() => setLeadLookupPage(page => Math.max(page - 1, 1))} disabled={safeLeadLookupPage <= 1 || leadLookupPageSize === "all"}>
              <ArrowLeft size={16} />
              Previous
            </button>
            <StatusBadge>Page {safeLeadLookupPage} of {leadLookupPageCount}</StatusBadge>
            <button className="secondary-button" type="button" onClick={() => setLeadLookupPage(page => Math.min(page + 1, leadLookupPageCount))} disabled={safeLeadLookupPage >= leadLookupPageCount || leadLookupPageSize === "all"}>
              Next
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
        <div className="table-wrap lead-lookup-table-wrap">
          <table className={`data-table lead-lookup-table ${editMode ? "editing" : ""}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Position</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Location</th>
                <th>Lists</th>
                <th>Contacts</th>
                <th>Source</th>
                {editMode ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {leadLookupResults.length ? leadLookupResults.map(contact => {
                const memberships = [
                  ...leadListMembershipByIdentity.get(buildLeadIdentityKey(contact)) || [],
                  ...leadListMembershipByIdentity.get(`db:${contact.id}`) || [],
                ].filter((membership, index, membershipsList) => membershipsList.findIndex(item => item.id === membership.id) === index);
                const phoneNumber = contact.manualMobile || contact.manualDirectDial || "";
                const draft = getLookupDraft(contact);
                const crmContact = findCrmContactMatch(contact);
                return (
                  <tr key={contact.id}>
                    <td>
                      {editMode ? (
                        <div className="lookup-name-action-cell">
                          <AircallDialButton contact={{ id: contact.id }} phoneNumber={draft.manualMobile || ""} source="lead_database" label="Call" compact />
                          <input className="table-input" value={draft.contactName || ""} onChange={event => updateLookupDraft(contact, "contactName", event.target.value)} placeholder="Contact name" />
                        </div>
                      ) : (
                        <div className="lookup-name-action-cell lookup-name-action-cell-with-linkedin">
                          <AircallDialButton contact={{ id: contact.id }} phoneNumber={phoneNumber} source="lead_database" label="Call" compact />
                          <LeadLookupLinkedInButton contact={contact} />
                          <div className="lookup-person-cell">
                            <div className="lookup-person-heading">
                              <strong>{contact.contactName || [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unknown lead"}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{editMode ? <input className="table-input" value={draft.company || ""} onChange={event => updateLookupDraft(contact, "company", event.target.value)} placeholder="Company" /> : contact.company || "Not available"}</td>
                    <td>{editMode ? <input className="table-input" value={draft.jobTitle || ""} onChange={event => updateLookupDraft(contact, "jobTitle", event.target.value)} placeholder="Position" /> : contact.jobTitle || "Not available"}</td>
                    <td className="lead-lookup-email" title={editMode ? draft.manualEmail || "" : contact.manualEmail || ""}>{editMode ? <input className="table-input" value={draft.manualEmail || ""} onChange={event => updateLookupDraft(contact, "manualEmail", event.target.value)} placeholder="name@company.com" /> : contact.manualEmail || "Not available"}</td>
                    <td className="lead-lookup-mobile" title={editMode ? draft.manualMobile || "" : phoneNumber}>{editMode ? <input className="table-input" value={draft.manualMobile || ""} onChange={event => updateLookupDraft(contact, "manualMobile", event.target.value)} placeholder="+353 ..." /> : phoneNumber || "Not available"}</td>
                    <td>{editMode ? <input className="table-input" value={draft.location || ""} onChange={event => updateLookupDraft(contact, "location", event.target.value)} placeholder="Location" /> : contact.location || "Not available"}</td>
                    <td>{memberships.length ? memberships.map(item => item.name).join(", ") : "No active list"}</td>
                    <td>
                      <button className="secondary-button" type="button" onClick={() => onAddToCrmContacts?.(contact)}>
                        <Contact size={16} />
                        {crmContact ? "Open contact" : "Add to Contacts"}
                      </button>
                    </td>
                    <td><DataSourceBadge lead={{ dbContactId: contact.id }} /></td>
                    {editMode ? (
                      <td>
                        <button className="secondary-button" type="button" onClick={() => saveLookupLead(contact)} disabled={leadLookupSaveStatuses[contact.id] === "saving"}>
                          <Database size={16} />
                          {leadLookupSaveStatuses[contact.id] === "saving" ? "Saving" : leadLookupSaveStatuses[contact.id] === "saved" ? "Saved" : "Save"}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={editMode ? 10 : 9} className="empty-table-cell">
                    {contactDatabase.length ? "No saved leads match those filters." : "Saved Lead Finder records will appear here."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function LeadListsPage({ leadLists, workspaceUsers, contactDatabase = [], error, onSaveLeadList, onAppendToLeadList, onUpdateLeadList, onDeleteLeadList, onSaveLeadContact }) {
  const [selectedListId, setSelectedListId] = useState("");
  const [manualListName, setManualListName] = useState("");
  const [manualAssignedUserIds, setManualAssignedUserIds] = useState([]);
  const [manualLeads, setManualLeads] = useState([createManualLeadDraft()]);
  const [manualStatus, setManualStatus] = useState("idle");
  const [manualError, setManualError] = useState("");
  const [manualMode, setManualMode] = useState(null);
  const [accessDrafts, setAccessDrafts] = useState({});
  const [accessStatus, setAccessStatus] = useState("idle");
  const [shareOpen, setShareOpen] = useState(false);
  const [listNameDrafts, setListNameDrafts] = useState({});
  const [listNameStatus, setListNameStatus] = useState("idle");
  const [leadEditDrafts, setLeadEditDrafts] = useState({});
  const [leadEditStatuses, setLeadEditStatuses] = useState({});
  const [selectedLeadIds, setSelectedLeadIds] = useState([]);
  const [deleteStatus, setDeleteStatus] = useState("idle");
  const [listHubspotExportStatus, setListHubspotExportStatus] = useState("idle");
  const [listHubspotExportSummary, setListHubspotExportSummary] = useState("");
  const [listHubspotExportDialog, setListHubspotExportDialog] = useState(null);
  const selectedList = leadLists.find(list => list.id === selectedListId) || leadLists[0] || null;
  const assignedUsers = selectedList ? userNamesForIds(selectedList.assignedUserIds, workspaceUsers) : [];
  const displayedLeads = selectedList ? hydrateLeadsWithContactDatabase(selectedList.leads, contactDatabase) : [];
  const displayedLeadEntries = displayedLeads.map(lead => ({ lead, leadId: buildLeadIdentityKey(lead) }));
  const selectedLeadEntries = displayedLeadEntries.filter(({ leadId }) => selectedLeadIds.includes(leadId));
  const selectedLeads = selectedLeadEntries.map(({ lead }) => lead);
  const exportableListLeads = selectedLeads.length ? selectedLeads : displayedLeads;
  const exportScopeText = selectedLeads.length ? `${selectedLeads.length} selected` : "All visible";
  const accessUserIds = selectedList ? (accessDrafts[selectedList.id] || selectedList.assignedUserIds || []) : [];
  const selectedListNameDraft = selectedList ? (listNameDrafts[selectedList.id] ?? selectedList.name) : "";
  const cleanManualLeads = manualLeads
    .map(lead => ({
      contactName: normalizeLookupValue(lead.contactName),
      company: normalizeLookupValue(lead.company),
      jobTitle: normalizeLookupValue(lead.jobTitle),
      location: normalizeLookupValue(lead.location),
      linkedinProfileUrl: normalizeLinkedinUrl(lead.linkedinProfileUrl),
      manualEmail: normalizeEmail(lead.manualEmail),
      manualMobile: normalizeLookupValue(lead.manualMobile),
      notes: normalizeLookupValue(lead.notes),
      dataSource: "manual",
      sourceNote: "Added manually by PaceOps user",
    }))
    .filter(lead => lead.contactName || lead.company || lead.jobTitle || lead.linkedinProfileUrl || lead.manualEmail || lead.manualMobile || lead.notes);

  useEffect(() => {
    if (!listHubspotExportSummary) return undefined;
    const timer = window.setTimeout(() => setListHubspotExportSummary(""), 5000);
    return () => window.clearTimeout(timer);
  }, [listHubspotExportSummary]);

  useEffect(() => {
    setSelectedLeadIds([]);
  }, [selectedList?.id]);

  function setSelectedListAccessUserIds(updater) {
    if (!selectedList) return;
    setAccessDrafts(current => ({
      ...current,
      [selectedList.id]: typeof updater === "function" ? updater(accessUserIds) : updater,
    }));
    setAccessStatus("idle");
  }

  function leadEditKey(lead) {
    return `${selectedList?.id || "list"}:${buildLeadIdentityKey(lead)}`;
  }

  function getLeadEditDraft(lead) {
    return leadEditDrafts[leadEditKey(lead)] || lead;
  }

  function updateLeadEditDraft(lead, field, value) {
    const key = leadEditKey(lead);
    setLeadEditDrafts(current => ({
      ...current,
      [key]: {
        ...lead,
        ...(current[key] || {}),
        [field]: value,
      },
    }));
    setLeadEditStatuses(current => ({ ...current, [key]: "idle" }));
  }

  function toggleListLead(leadId) {
    setSelectedLeadIds(current => current.includes(leadId)
      ? current.filter(id => id !== leadId)
      : [...current, leadId]);
  }

  async function saveSelectedListName() {
    if (!selectedList) return;
    if (!selectedListNameDraft.trim()) {
      setManualError("Name the lead list before saving.");
      return;
    }
    setListNameStatus("saving");
    setManualError("");
    try {
      await onUpdateLeadList({
        leadList: selectedList,
        name: selectedListNameDraft.trim(),
      });
      setListNameStatus("saved");
    } catch (saveError) {
      setListNameStatus("error");
      setManualError(saveError.message || "Could not rename lead list.");
    }
  }

  async function deleteSelectedList() {
    if (!selectedList) return;
    const confirmed = window.confirm(`Delete "${selectedList.name}"? This removes the saved list, but does not delete lead records from the database.`);
    if (!confirmed) return;

    setDeleteStatus("deleting");
    setManualError("");
    try {
      await onDeleteLeadList(selectedList);
      setSelectedListId("");
      setDeleteStatus("deleted");
    } catch (deleteError) {
      setDeleteStatus("error");
      setManualError(deleteError.message || "Could not delete lead list.");
    }
  }

  async function saveLeadEdit(lead) {
    if (!selectedList) return;
    const key = leadEditKey(lead);
    const draft = getLeadEditDraft(lead);
    const editedLead = {
      ...lead,
      ...draft,
      contactName: normalizeLookupValue(draft.contactName),
      company: normalizeLookupValue(draft.company),
      jobTitle: normalizeLookupValue(draft.jobTitle),
      location: normalizeLookupValue(draft.location),
      linkedinProfileUrl: normalizeLinkedinUrl(draft.linkedinProfileUrl),
      manualEmail: normalizeEmail(draft.manualEmail),
      manualMobile: normalizeLookupValue(draft.manualMobile),
      notes: normalizeLookupValue(draft.notes),
      sourceNote: draft.sourceNote || "Edited by PaceOps user",
    };
    const validationError = validateLeadManualFields(editedLead);
    if (validationError) {
      setManualError(validationError);
      return;
    }

    setLeadEditStatuses(current => ({ ...current, [key]: "saving" }));
    setManualError("");
    try {
      const savedContact = await onSaveLeadContact(editedLead, { allowPreviewOnly: true });
      const savedLead = hydrateLeadWithContactDatabase({ ...editedLead, dbContactId: savedContact.id }, [savedContact]);
      const originalKey = buildLeadIdentityKey(lead);
      const nextLeads = (selectedList.leads || []).map(listLead => (
        buildLeadIdentityKey(listLead) === originalKey ? savedLead : listLead
      ));
      await onUpdateLeadList({
        leadList: selectedList,
        leads: nextLeads,
      });
      setLeadEditDrafts(current => {
        const next = { ...current };
        delete next[key];
        return next;
      });
      setLeadEditStatuses(current => ({ ...current, [key]: "saved" }));
    } catch (saveError) {
      setLeadEditStatuses(current => ({ ...current, [key]: "error" }));
      setManualError(saveError.message || "Could not update lead.");
    }
  }

  async function removeLeadFromList(lead) {
    if (!selectedList) return;
    const confirmed = window.confirm(`Remove ${lead.contactName || lead.company || "this lead"} from "${selectedList.name}"? This does not delete the saved lead record.`);
    if (!confirmed) return;

    const key = leadEditKey(lead);
    setLeadEditStatuses(current => ({ ...current, [key]: "removing" }));
    setManualError("");
    try {
      const removeKey = buildLeadIdentityKey(lead);
      const nextLeads = (selectedList.leads || []).filter(listLead => buildLeadIdentityKey(listLead) !== removeKey);
      await onUpdateLeadList({
        leadList: selectedList,
        leads: nextLeads,
      });
      setLeadEditStatuses(current => ({ ...current, [key]: "removed" }));
    } catch (removeError) {
      setLeadEditStatuses(current => ({ ...current, [key]: "error" }));
      setManualError(removeError.message || "Could not remove lead from list.");
    }
  }

  async function exportSelectedListToHubSpot() {
    if (!selectedList || !exportableListLeads.length) {
      setManualError("Select a lead list with at least one lead before exporting to HubSpot.");
      return;
    }

    setListHubspotExportStatus("exporting");
    setManualError("");
    setListHubspotExportSummary("");
    try {
      const { data } = supabase ? await supabase.auth.getSession() : { data: null };
      const token = data?.session?.access_token;
      if (!token) throw new Error("Sign in before exporting to HubSpot.");

      const hubspotRows = exportableListLeads.map(lead => ({
        rowId: buildLeadIdentityKey(lead),
        dbContactId: lead.dbContactId,
        hubspotContactId: lead.hubspotContactId,
        contactName: lead.contactName,
        company: lead.company,
        jobTitle: lead.jobTitle,
        location: lead.location,
        manualEmail: lead.manualEmail,
        manualMobile: lead.manualMobile,
        manualDirectDial: lead.manualDirectDial,
      }));

      const response = await fetch("/api/hubspot/contacts/export", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows: hubspotRows }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "HubSpot export failed.");

      const resultsByRowId = new Map((payload.results || []).map(result => [result.rowId, result]));
      const savedContacts = [];
      for (const lead of exportableListLeads) {
        const exportResult = resultsByRowId.get(buildLeadIdentityKey(lead));
        if (!exportResult) continue;
        const nextLead = {
          ...lead,
          hubspotContactId: exportResult.hubspotContactId,
          hubspotExportedAt: exportResult.hubspotExportedAt,
          hubspotExportStatus: exportResult.hubspotExportStatus,
          hubspotExportError: exportResult.hubspotExportError,
        };
        const savedContact = await onSaveLeadContact(nextLead, { allowPreviewOnly: true, skipConflictPrompt: true });
        savedContacts.push(savedContact);
      }

      const nextLeads = (selectedList.leads || []).map(lead => {
        const exportResult = resultsByRowId.get(buildLeadIdentityKey(lead));
        if (!exportResult) return lead;
        return hydrateLeadWithContactDatabase({
          ...lead,
          hubspotContactId: exportResult.hubspotContactId,
          hubspotExportedAt: exportResult.hubspotExportedAt,
          hubspotExportStatus: exportResult.hubspotExportStatus,
          hubspotExportError: exportResult.hubspotExportError,
        }, savedContacts);
      });
      await onUpdateLeadList({ leadList: selectedList, leads: nextLeads });

      setListHubspotExportStatus((payload.results || []).some(result => result.hubspotExportStatus === "error") ? "error" : "exported");
      const failedCount = (payload.results || []).filter(result => result.hubspotExportStatus === "error").length;
      const exportedCount = (payload.results || []).filter(result => result.hubspotExportStatus === "exported").length;
      const failures = buildHubSpotExportFailures(hubspotRows, payload.results || []);
      const summary = `${exportedCount} exported to HubSpot${failedCount ? `, ${failedCount} failed` : ""}.`;
      setListHubspotExportSummary(summary);
      setListHubspotExportDialog({
        open: true,
        status: failedCount ? "error" : "success",
        summary,
        detail: failedCount ? "Review the failed row below, fix the lead data if needed, then export again." : `${exportScopeText} lead rows have been sent to HubSpot and export status has been saved in PaceOps.`,
        failures,
      });
      if (failedCount) setManualError(`${failedCount} HubSpot export${failedCount === 1 ? "" : "s"} failed. Check the HubSpot status column.`);
    } catch (exportError) {
      setListHubspotExportStatus("error");
      setListHubspotExportSummary("");
      setListHubspotExportDialog({
        open: true,
        status: "error",
        summary: exportError.message || "HubSpot export failed.",
        detail: "No successful export response was received from HubSpot.",
      });
      setManualError(exportError.message || "HubSpot export failed.");
    }
  }

  function updateManualLead(localId, field, value) {
    setManualLeads(current => current.map(lead => lead.localId === localId ? { ...lead, [field]: value } : lead));
    setManualStatus("idle");
  }

  function removeManualLead(localId) {
    setManualLeads(current => current.length > 1 ? current.filter(lead => lead.localId !== localId) : [createManualLeadDraft()]);
  }

  function validateManualLeadList({ requireName = false } = {}) {
    if (requireName && !manualListName.trim()) return "Name the lead list before creating it.";
    if (!manualAssignedUserIds.length) return "Assign the lead list to at least one user.";
    if (!cleanManualLeads.length) return "Add at least one manual lead.";
    if (cleanManualLeads.some(lead => !lead.contactName || !lead.company)) return "Each manual lead needs at least a contact name and company.";
    for (const lead of cleanManualLeads) {
      const validationError = validateLeadManualFields(lead);
      if (validationError) return validationError;
    }
    return "";
  }

  function resetManualBuilder() {
    setManualListName("");
    setManualLeads([createManualLeadDraft()]);
    setManualStatus("idle");
    setManualError("");
  }

  function openManualCreate() {
    resetManualBuilder();
    setManualAssignedUserIds(workspaceUsers.map(user => user.id));
    setManualMode("create");
  }

  function openManualAppend() {
    setManualListName(selectedList?.name || "");
    setManualLeads([createManualLeadDraft()]);
    setManualAssignedUserIds(selectedList?.assignedUserIds || []);
    setManualStatus("idle");
    setManualError("");
    setManualMode("append");
  }

  function closeManualModal() {
    setManualMode(null);
    setManualError("");
  }

  async function createManualList() {
    const validationError = validateManualLeadList({ requireName: true });
    if (validationError) {
      setManualError(validationError);
      return;
    }
    setManualStatus("saving");
    setManualError("");
    try {
      await onSaveLeadList({
        name: manualListName.trim(),
        assignedUserIds: manualAssignedUserIds,
        leads: cleanManualLeads,
        filters: { source: "manual" },
      });
      resetManualBuilder();
      setManualStatus("saved");
      setManualMode(null);
    } catch (saveError) {
      setManualStatus("error");
      setManualError(saveError.message || "Could not create lead list.");
    }
  }

  async function appendManualLeads() {
    if (!selectedList) {
      setManualError("Select a lead list before adding leads.");
      return;
    }
    const validationError = validateManualLeadList();
    if (validationError) {
      setManualError(validationError);
      return;
    }
    setManualStatus("saving");
    setManualError("");
    try {
      await onAppendToLeadList({
        leadList: selectedList,
        assignedUserIds: manualAssignedUserIds,
        leads: cleanManualLeads,
      });
      setManualLeads([createManualLeadDraft()]);
      setManualStatus("saved");
      setManualMode(null);
    } catch (saveError) {
      setManualStatus("error");
      setManualError(saveError.message || "Could not add leads to selected list.");
    }
  }

  async function saveListAccess() {
    if (!selectedList) return;
    setAccessStatus("saving");
    try {
      await onUpdateLeadList({
        leadList: selectedList,
        assignedUserIds: accessUserIds,
      });
      setAccessStatus("saved");
      setShareOpen(false);
    } catch (saveError) {
      setAccessStatus("error");
      setManualError(saveError.message || "Could not update list access.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Lead Lists"
        title="Saved lead lists"
        description="Open assigned lead lists, review contacts, and export the data whenever needed."
      >
        <button className="secondary-button" type="button" onClick={openManualCreate}>
          <Plus size={16} />
          New manual list
        </button>
        <button className="primary-button" type="button" onClick={openManualAppend} disabled={!selectedList}>
          <Plus size={16} />
          Add leads
        </button>
      </PageHeader>
      {error ? <div className="form-error">{error}</div> : null}
      <div className="lead-list-layout">
        <section className="panel lead-list-index">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Lists</span>
              <h2>Your saved lead lists</h2>
            </div>
            <StatusBadge>{leadLists.length}</StatusBadge>
          </div>
          {leadLists.length ? (
            <div className="lead-list-cards">
              {leadLists.map(list => {
                const users = userNamesForIds(list.assignedUserIds, workspaceUsers);
                return (
                  <button
                    key={list.id}
                    type="button"
                    className={`lead-list-card ${selectedList?.id === list.id ? "selected" : ""}`}
                    onClick={() => setSelectedListId(list.id)}
                  >
                    <strong>{list.name}</strong>
                    <span>{list.leads.length} leads</span>
                    <small>{users.length ? users.map(user => user.name).join(", ") : "No assigned users found"}</small>
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState icon={ListFilter} title="No saved lead lists yet" text="Save Lead Finder results to create a named list for yourself or teammates." />
          )}
        </section>

        <section className="panel lead-list-detail">
          {selectedList ? (
            <>
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Selected list</span>
                  <label className="save-list-inline lead-list-name-editor">
                    <span>List name</span>
                    <input
                      value={selectedListNameDraft}
                      onChange={event => {
                        setListNameDrafts(current => ({ ...current, [selectedList.id]: event.target.value }));
                        setListNameStatus("idle");
                      }}
                    />
                  </label>
                </div>
                <div className="export-actions compact-export-actions">
                  <button className="secondary-button" type="button" onClick={saveSelectedListName} disabled={listNameStatus === "saving" || selectedListNameDraft.trim() === selectedList.name}>
                    <CheckCircle2 size={16} />
                    {listNameStatus === "saving" ? "Saving" : listNameStatus === "saved" ? "Saved name" : "Save name"}
                  </button>
                  <button className="secondary-button" type="button" onClick={() => exportCognismResults(exportableListLeads, "csv", assignedUsers)} disabled={!exportableListLeads.length}>
                    <FileText size={16} />
                    {selectedLeads.length ? "Export selected CSV" : "Export CSV"}
                  </button>
                  <button className="secondary-button" type="button" onClick={() => exportCognismResults(exportableListLeads, "xls", assignedUsers)} disabled={!exportableListLeads.length}>
                    <FileText size={16} />
                    {selectedLeads.length ? "Export selected Excel" : "Export Excel"}
                  </button>
                  <button className="secondary-button" type="button" onClick={() => exportCognismResults(exportableListLeads, "json", assignedUsers)} disabled={!exportableListLeads.length}>
                    <FileText size={16} />
                    {selectedLeads.length ? "Export selected JSON" : "Export JSON"}
                  </button>
                  <button className="secondary-button" type="button" onClick={exportSelectedListToHubSpot} disabled={listHubspotExportStatus === "exporting" || !displayedLeads.length}>
                    <Database size={16} />
                    {listHubspotExportStatus === "exporting" ? "Exporting" : listHubspotExportStatus === "exported" ? "Exported" : selectedLeads.length ? "Export selected to HubSpot" : "Export to HubSpot"}
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setShareOpen(true)}>
                    <Users size={16} />
                    Share
                  </button>
                  <button className="secondary-button danger-button" type="button" onClick={deleteSelectedList} disabled={deleteStatus === "deleting"}>
                    <Circle size={16} />
                    {deleteStatus === "deleting" ? "Deleting" : "Delete list"}
                  </button>
                </div>
              </div>
              <div className="lead-list-meta">
                <StatusBadge>{displayedLeads.length} leads</StatusBadge>
                <StatusBadge>{exportScopeText}</StatusBadge>
                <StatusBadge>{assignedUsers.length ? assignedUsers.map(user => user.name).join(", ") : "No users"}</StatusBadge>
                {selectedList.filters?.countries?.length ? <StatusBadge>{selectedList.filters.countries.join(", ")}</StatusBadge> : null}
              </div>
              {listHubspotExportSummary ? (
                <div className={`form-success ${listHubspotExportStatus === "error" ? "warning" : ""}`}>
                  {listHubspotExportSummary}
                </div>
              ) : null}
              <div className="result-selection-actions">
                <div>
                  <span className="eyebrow">Lead rows</span>
                  <strong>{selectedLeads.length} of {displayedLeads.length} selected</strong>
                </div>
                <div className="role-actions">
                  <button className="secondary-button" type="button" onClick={() => setSelectedLeadIds(displayedLeadEntries.map(({ leadId }) => leadId))} disabled={!displayedLeadEntries.length || selectedLeads.length === displayedLeads.length}>
                    <CheckCircle2 size={16} />
                    Select all
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setSelectedLeadIds([])} disabled={!selectedLeads.length}>
                    <Circle size={16} />
                    Deselect all
                  </button>
                </div>
              </div>
              <div className="table-wrap saved-lead-list-table-wrap">
                <table className="data-table cognism-table saved-lead-list-table">
                  <colgroup>
                    <col className="saved-lead-list-col-select" />
                    <col className="saved-lead-list-col-contact" />
                    <col className="saved-lead-list-col-company" />
                    <col className="saved-lead-list-col-title" />
                    <col className="saved-lead-list-col-location" />
                    <col className="saved-lead-list-col-linkedin" />
                    <col className="saved-lead-list-col-email" />
                    <col className="saved-lead-list-col-mobile" />
                    <col className="saved-lead-list-col-call" />
                    <col className="saved-lead-list-col-notes" />
                    <col className="saved-lead-list-col-saved" />
                    <col className="saved-lead-list-col-hubspot" />
                    <col className="saved-lead-list-col-actions" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Contact name</th>
                      <th>Company</th>
                      <th>Job title</th>
                      <th>Location</th>
                      <th>LinkedIn profile</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Call</th>
                      <th>Notes</th>
                      <th>Saved</th>
                      <th>HubSpot</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedLeads.map(lead => {
                      const key = leadEditKey(lead);
                      const leadId = buildLeadIdentityKey(lead);
                      const draft = getLeadEditDraft(lead);
                      return (
                      <tr key={key}>
                        <td className="table-select-cell">
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.includes(leadId)}
                            onChange={() => toggleListLead(leadId)}
                            aria-label={`Select ${lead.contactName || lead.jobTitle || "lead"}`}
                          />
                        </td>
                        <td>
                          <div className="lookup-name-action-cell lookup-name-action-cell-with-linkedin">
                            <AircallDialButton contact={{ id: lead.dbContactId || buildLeadIdentityKey(lead) }} phoneNumber={draft.manualMobile || ""} source="lead_database" label="Call" compact />
                            <LeadLookupLinkedInButton contact={draft} />
                            <input className="table-input" value={draft.contactName || ""} onChange={event => updateLeadEditDraft(lead, "contactName", event.target.value)} placeholder="Contact name" />
                          </div>
                        </td>
                        <td><input className="table-input" value={draft.company || ""} onChange={event => updateLeadEditDraft(lead, "company", event.target.value)} placeholder="Company" /></td>
                        <td><input className="table-input" value={draft.jobTitle || ""} onChange={event => updateLeadEditDraft(lead, "jobTitle", event.target.value)} placeholder="Job title" /></td>
                        <td><input className="table-input" value={draft.location || ""} onChange={event => updateLeadEditDraft(lead, "location", event.target.value)} placeholder="Location" /></td>
                        <td>
                          <LinkedInProfileField
                            value={draft.linkedinProfileUrl}
                            onChange={event => updateLeadEditDraft(lead, "linkedinProfileUrl", event.target.value)}
                            onOpen={() => window.open(buildLinkedInTargetUrl(draft), "_blank", "noopener,noreferrer")}
                            canSearch={Boolean(draft.contactName || draft.company)}
                          />
                        </td>
                        <td><input className="table-input" value={draft.manualEmail || ""} onChange={event => updateLeadEditDraft(lead, "manualEmail", event.target.value)} placeholder="name@company.com" /></td>
                        <td><input className="table-input" value={draft.manualMobile || ""} onChange={event => updateLeadEditDraft(lead, "manualMobile", event.target.value)} placeholder="+353 ..." /></td>
                        <td><AircallDialButton contact={{ id: lead.dbContactId || buildLeadIdentityKey(lead) }} phoneNumber={draft.manualMobile || ""} source="lead_database" label="Call" compact /></td>
                        <td><textarea className="table-textarea" value={draft.notes || ""} onChange={event => updateLeadEditDraft(lead, "notes", event.target.value)} placeholder="Notes" /></td>
                        <td><DataSourceBadge lead={lead} /></td>
                        <td>
                          {lead.hubspotExportStatus ? (
                            <div className="db-source-cell">
                              <StatusBadge tone={lead.hubspotExportStatus === "exported" ? "success" : "warning"}>{lead.hubspotExportStatus}</StatusBadge>
                              {lead.hubspotContactId ? <small>{lead.hubspotContactId}</small> : null}
                              {lead.hubspotExportError ? <small>{lead.hubspotExportError}</small> : null}
                            </div>
                          ) : (
                            <StatusBadge>Not exported</StatusBadge>
                          )}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button className="secondary-button" type="button" onClick={() => saveLeadEdit(lead)} disabled={leadEditStatuses[key] === "saving" || leadEditStatuses[key] === "removing"}>
                              <Database size={16} />
                              {leadEditStatuses[key] === "saving" ? "Saving" : leadEditStatuses[key] === "saved" ? "Saved" : "Save"}
                            </button>
                            <button className="secondary-button danger-button" type="button" onClick={() => removeLeadFromList(lead)} disabled={leadEditStatuses[key] === "removing"}>
                              <Circle size={16} />
                              {leadEditStatuses[key] === "removing" ? "Removing" : "Remove"}
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyState icon={Target} title="No list selected" text="Save or select a lead list to review contacts." />
          )}
        </section>
      </div>
      {manualMode ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) closeManualModal();
        }}>
          <section className="workflow-modal lead-list-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <span className="eyebrow">{manualMode === "create" ? "New manual list" : "Add leads"}</span>
                <h2>{manualMode === "create" ? "Create manual lead list" : `Add leads to ${selectedList?.name || "selected list"}`}</h2>
              </div>
              <button className="secondary-button" type="button" onClick={closeManualModal}>Close</button>
            </div>
            <div className="manual-modal-grid">
              <section className="manual-modal-side">
                {manualMode === "create" ? (
                  <label className="save-list-inline">
                    <span>List name</span>
                    <input value={manualListName} onChange={event => setManualListName(event.target.value)} placeholder="Manual target leads" />
                  </label>
                ) : (
                  <div className="manual-selected-list">
                    <span>Selected list</span>
                    <strong>{selectedList?.name}</strong>
                  </div>
                )}
                <div className="role-actions">
                  <button className="secondary-button" type="button" onClick={() => setManualAssignedUserIds(workspaceUsers.map(user => user.id))} disabled={!workspaceUsers.length}>
                    <CheckCircle2 size={16} />
                    Select all
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setManualAssignedUserIds([])} disabled={!manualAssignedUserIds.length}>
                    <Circle size={16} />
                    Deselect
                  </button>
                </div>
                <div className="role-choice-grid compact-choice-grid">
                  {workspaceUsers.map(user => (
                    <label key={user.id} className={`role-choice ${manualAssignedUserIds.includes(user.id) ? "selected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={manualAssignedUserIds.includes(user.id)}
                        onChange={() => setManualAssignedUserIds(current => current.includes(user.id) ? current.filter(id => id !== user.id) : [...current, user.id])}
                      />
                      <span>{user.name}<small>{user.email}</small></span>
                    </label>
                  ))}
                </div>
              </section>
              <section className="manual-modal-main">
                <div className="manual-table-wrap">
                  <table className="manual-entry-table">
                    <thead>
                      <tr>
                        <th>Contact name</th>
                        <th>Company</th>
                        <th>Job title</th>
                        <th>Location</th>
                        <th>LinkedIn</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Notes</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {manualLeads.map(lead => (
                        <tr key={lead.localId}>
                          <td><input value={lead.contactName} onChange={event => updateManualLead(lead.localId, "contactName", event.target.value)} placeholder="Jane Smith" /></td>
                          <td><input value={lead.company} onChange={event => updateManualLead(lead.localId, "company", event.target.value)} placeholder="Company" /></td>
                          <td><input value={lead.jobTitle} onChange={event => updateManualLead(lead.localId, "jobTitle", event.target.value)} placeholder="Job title" /></td>
                          <td><input value={lead.location} onChange={event => updateManualLead(lead.localId, "location", event.target.value)} placeholder="Dublin" /></td>
                          <td><input value={lead.linkedinProfileUrl} onChange={event => updateManualLead(lead.localId, "linkedinProfileUrl", event.target.value)} placeholder="https://www.linkedin.com/in/..." /></td>
                          <td><input value={lead.manualEmail} onChange={event => updateManualLead(lead.localId, "manualEmail", event.target.value)} placeholder="name@company.com" /></td>
                          <td><input value={lead.manualMobile} onChange={event => updateManualLead(lead.localId, "manualMobile", event.target.value)} placeholder="+353 ..." /></td>
                          <td><textarea value={lead.notes} onChange={event => updateManualLead(lead.localId, "notes", event.target.value)} placeholder="Notes" /></td>
                          <td><button className="secondary-button danger-button" type="button" onClick={() => removeManualLead(lead.localId)}>Remove</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {manualError ? <div className="form-error">{manualError}</div> : null}
                <div className="modal-actions">
                  <button className="secondary-button" type="button" onClick={() => setManualLeads(current => [...current, createManualLeadDraft()])}>
                    <Plus size={16} />
                    Add row
                  </button>
                  <button className="primary-button" type="button" onClick={manualMode === "create" ? createManualList : appendManualLeads} disabled={manualStatus === "saving"}>
                    <ListFilter size={16} />
                    {manualStatus === "saving" ? "Saving" : manualMode === "create" ? "Create list" : "Add to list"}
                  </button>
                </div>
              </section>
            </div>
          </section>
        </div>
      ) : null}
      {shareOpen && selectedList ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setShareOpen(false);
        }}>
          <section className="workflow-modal share-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Share</span>
                <h2>{selectedList.name}</h2>
              </div>
              <button className="secondary-button" type="button" onClick={() => setShareOpen(false)}>Close</button>
            </div>
            <div className="role-actions">
              <button className="secondary-button" type="button" onClick={() => setSelectedListAccessUserIds(workspaceUsers.map(user => user.id))} disabled={!workspaceUsers.length}>
                <CheckCircle2 size={16} />
                Select all
              </button>
              <button className="secondary-button" type="button" onClick={() => setSelectedListAccessUserIds([])} disabled={!accessUserIds.length}>
                <Circle size={16} />
                Deselect
              </button>
            </div>
            <div className="role-choice-grid share-choice-grid">
              {workspaceUsers.map(user => (
                <label key={user.id} className={`role-choice ${accessUserIds.includes(user.id) ? "selected" : ""}`}>
                  <input
                    type="checkbox"
                    checked={accessUserIds.includes(user.id)}
                    onChange={() => setSelectedListAccessUserIds(current => current.includes(user.id) ? current.filter(id => id !== user.id) : [...current, user.id])}
                  />
                  <span>{user.name}<small>{user.email}</small></span>
                </label>
              ))}
            </div>
            {manualError ? <div className="form-error">{manualError}</div> : null}
            <div className="modal-actions">
              <button className="primary-button" type="button" onClick={saveListAccess} disabled={accessStatus === "saving"}>
                <Users size={16} />
                {accessStatus === "saving" ? "Saving" : "Save sharing"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      <HubSpotExportResultModal result={listHubspotExportDialog} onClose={() => setListHubspotExportDialog(null)} />
    </>
  );
}

function CognismContactFinder({ contactDatabase = [], onSaveLeadList, onSaveLeadContact, onPersistSearchResults }) {
  const { workspaceUsers = [] } = useCrmData();
  const savedSearchState = loadLeadFinderSearchState();
  const companyImportInputRef = useRef(null);
  const [companiesText, setCompaniesText] = useState(savedSearchState?.companiesText || "");
  const [roleQuery, setRoleQuery] = useState(savedSearchState?.roleQuery || "");
  const [suggestedRoles, setSuggestedRoles] = useState(Array.isArray(savedSearchState?.suggestedRoles) ? savedSearchState.suggestedRoles : []);
  const [selectedRoles, setSelectedRoles] = useState(Array.isArray(savedSearchState?.selectedRoles) ? savedSearchState.selectedRoles : []);
  const [selectedUserIds, setSelectedUserIds] = useState(Array.isArray(savedSearchState?.selectedUserIds) ? savedSearchState.selectedUserIds : []);
  const [maxPerCompany, setMaxPerCompany] = useState(String(savedSearchState?.maxPerCompany || DEFAULT_MAX_CONTACTS_PER_COMPANY));
  const [requireMobileAvailable, setRequireMobileAvailable] = useState(Boolean(savedSearchState?.requireMobileAvailable));
  const [countryQuery, setCountryQuery] = useState("");
  const [selectedCountries, setSelectedCountries] = useState(Array.isArray(savedSearchState?.selectedCountries) ? savedSearchState.selectedCountries : []);
  const [leadListName, setLeadListName] = useState(savedSearchState?.leadListName || "");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [customRolesText, setCustomRolesText] = useState(savedSearchState?.customRolesText || "");
  const [results, setResults] = useState(hydrateLeadsWithContactDatabase(Array.isArray(savedSearchState?.results) ? savedSearchState.results : [], contactDatabase));
  const [selectedResultIds, setSelectedResultIds] = useState(Array.isArray(savedSearchState?.selectedResultIds) ? savedSearchState.selectedResultIds : []);
  const [meta, setMeta] = useState(savedSearchState?.meta && typeof savedSearchState.meta === "object" ? savedSearchState.meta : { mode: "preview_only", estimatedCreditsUsed: 0, maxPerCompany: DEFAULT_MAX_CONTACTS_PER_COMPANY, requireMobileAvailable: false, countries: [] });
  const [status, setStatus] = useState(Array.isArray(savedSearchState?.results) && savedSearchState.results.length ? "done" : "idle");
  const [roleStatus, setRoleStatus] = useState("idle");
  const [roleMode, setRoleMode] = useState("");
  const [error, setError] = useState("");
  const [hubspotExportStatus, setHubspotExportStatus] = useState("idle");
  const [hubspotExportSummary, setHubspotExportSummary] = useState("");
  const [hubspotExportDialog, setHubspotExportDialog] = useState(null);
  const [companyImportOpen, setCompanyImportOpen] = useState(false);
  const [companyImportRows, setCompanyImportRows] = useState([]);
  const [companyImportStatus, setCompanyImportStatus] = useState("idle");
  const [companyImportError, setCompanyImportError] = useState("");
  const [resultCompanyFilter, setResultCompanyFilter] = useState("");
  const [companyListSaveStatus, setCompanyListSaveStatus] = useState("idle");
  const roleOptions = suggestedRoles;
  const selectedUsers = workspaceUsers.filter(user => selectedUserIds.includes(user.id));
  const canAssignResults = results.length > 0;
  const selectedResultEntries = results
    .map((result, index) => ({ result, index, resultId: leadResultId(result, index) }))
    .filter(({ resultId }) => selectedResultIds.includes(resultId));
  const selectedResults = selectedResultEntries.map(({ result }) => result);
  const resultCompanyOptions = [...new Set(results.map(result => normalizeLookupValue(result.company)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const displayedResultEntries = results
    .map((result, index) => ({ result, index }))
    .filter(({ result }) => !resultCompanyFilter || normalizeLookupValue(result.company) === resultCompanyFilter);
  const displayedResults = displayedResultEntries.map(({ result }) => result);
  const selectedDisplayedResults = displayedResultEntries.filter(({ result, index }) => selectedResultIds.includes(leadResultId(result, index)));
  const targetCompanyCount = parseLines(companiesText).length;
  const existingCompanyKeys = new Set(parseLines(companiesText).map(company => company.toLowerCase()));
  const companyImportFileCount = new Set(companyImportRows.map(row => row.sourceFile).filter(Boolean)).size;
  const companyImportNewCompanyCount = companyImportRows.filter(row => !existingCompanyKeys.has(row.companyName.toLowerCase())).length;
  const matchingCountries = countrySuggestions
    .filter(country => country.toLowerCase().includes(countryQuery.trim().toLowerCase()))
    .filter(country => !selectedCountries.includes(country))
    .slice(0, 8);

  useEffect(() => {
    saveLeadFinderSearchState({
      version: LEAD_FINDER_SEARCH_STATE_VERSION,
      companiesText,
      roleQuery,
      suggestedRoles,
      selectedRoles,
      selectedUserIds,
      maxPerCompany,
      requireMobileAvailable,
      selectedCountries,
      leadListName,
      customRolesText,
      results,
      selectedResultIds,
      meta,
    });
  }, [companiesText, customRolesText, leadListName, maxPerCompany, meta, requireMobileAvailable, results, roleQuery, selectedCountries, selectedResultIds, selectedRoles, selectedUserIds, suggestedRoles]);

  useEffect(() => {
    if (!hubspotExportSummary) return undefined;
    const timer = window.setTimeout(() => setHubspotExportSummary(""), 5000);
    return () => window.clearTimeout(timer);
  }, [hubspotExportSummary]);

  function leadResultId(result, index) {
    return result.cognismContactId || `${result.company || "company"}-${result.contactName || "contact"}-${result.jobTitle || "title"}-${index}`;
  }

  function toggleRole(role) {
    setSelectedRoles(current => current.includes(role)
      ? current.filter(item => item !== role)
      : [...current, role]);
  }

  function toggleUser(userId) {
    if (!canAssignResults) return;
    setSelectedUserIds(current => current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId]);
  }

  function toggleResult(resultId) {
    setSelectedResultIds(current => current.includes(resultId)
      ? current.filter(id => id !== resultId)
      : [...current, resultId]);
  }

  function clearSearch() {
    clearLeadFinderSearchState();
    setCompaniesText("");
    setRoleQuery("");
    setSuggestedRoles([]);
    setSelectedRoles([]);
    setSelectedUserIds([]);
    setMaxPerCompany(String(DEFAULT_MAX_CONTACTS_PER_COMPANY));
    setRequireMobileAvailable(false);
    setCountryQuery("");
    setSelectedCountries([]);
    setLeadListName("");
    setSaveStatus("idle");
    setCustomRolesText("");
    setResults([]);
    setSelectedResultIds([]);
    setMeta({ mode: "preview_only", estimatedCreditsUsed: 0, maxPerCompany: DEFAULT_MAX_CONTACTS_PER_COMPANY, requireMobileAvailable: false, countries: [] });
    setStatus("idle");
    setRoleStatus("idle");
    setRoleMode("");
    setError("");
    setHubspotExportStatus("idle");
    setResultCompanyFilter("");
    setCompanyListSaveStatus("idle");
  }

  function openCompanyImport() {
    setCompanyImportRows([]);
    setCompanyImportError("");
    setCompanyImportStatus("idle");
    setCompanyImportOpen(true);
  }

  function closeCompanyImport() {
    setCompanyImportOpen(false);
    setCompanyImportError("");
    setCompanyImportStatus("idle");
  }

  async function handleCompanyImportFile(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    setCompanyImportStatus("loading");
    setCompanyImportError("");
    const parsedRows = [];
    const failedFiles = [];

    for (const file of files) {
      try {
        const importedRows = await parseCompanyImportFile(file);
        if (!importedRows.length) {
          failedFiles.push(file.name);
          continue;
        }
        parsedRows.push(...importedRows);
      } catch {
        failedFiles.push(file.name);
      }
    }

    if (parsedRows.length) {
      setCompanyImportRows(current => dedupeCompanyImportRows([...current, ...parsedRows]));
      setCompanyImportStatus("done");
    } else {
      setCompanyImportStatus("idle");
    }

    if (failedFiles.length) {
      setCompanyImportError(`Could not find a company column in: ${failedFiles.join(", ")}. Use Company, Company Name, Account, Account Name, Organisation, or Organization.`);
    }
  }

  function confirmCompanyImport() {
    const existingCompanies = parseLines(companiesText);
    const existingKeys = new Set(existingCompanies.map(company => company.toLowerCase()));
    const importedCompanies = companyImportRows
      .map(row => row.companyName)
      .filter(company => {
        const companyKey = company.toLowerCase();
        if (existingKeys.has(companyKey)) return false;
        existingKeys.add(companyKey);
        return true;
      });

    setCompaniesText([...existingCompanies, ...importedCompanies].join("\n"));
    closeCompanyImport();
  }

  function updateMaxPerCompany(value) {
    const digitsOnly = value.replace(/\D/g, "");
    setMaxPerCompany(digitsOnly);
  }

  function normalizeMaxPerCompany() {
    setMaxPerCompany(current => String(Math.max(Number(current) || 1, 1)));
  }

  function updateResultField(resultId, field, value) {
    setResults(current => current.map((result, index) => {
      if (leadResultId(result, index) !== resultId) return result;
      const nextResult = {
        ...result,
        [field]: value,
      };
      if (["manualEmail", "manualMobile", "linkedinProfileUrl", "notes"].includes(field)) {
        nextResult.dataSource = "manual";
        nextResult.sourceNote = "Added manually by PaceOps user";
      }
      return nextResult;
    }));
    setSaveStatus("idle");
  }

  function linkedInTargetUrl(result) {
    return buildLinkedInTargetUrl(result);
  }

  function openLinkedIn(result) {
    window.open(linkedInTargetUrl(result), "_blank", "noopener,noreferrer");
  }

  async function saveContactResult(resultId) {
    const result = results.find((item, index) => leadResultId(item, index) === resultId);
    if (!result) return;
    const validationError = validateLeadManualFields(result);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    try {
      const savedContact = await onSaveLeadContact(result);
      setResults(current => current.map((item, index) => {
        if (leadResultId(item, index) !== resultId) return item;
        return hydrateLeadWithContactDatabase({ ...item, dbContactId: savedContact.id }, [savedContact]);
      }));
    } catch (saveError) {
      setError(saveError.message || "Could not save contact to PaceOps DB.");
    }
  }

  function addCountry(country) {
    const nextCountry = String(country || "").trim();
    if (!nextCountry) return;
    setSelectedCountries(current => current.includes(nextCountry) ? current : [...current, nextCountry]);
    setCountryQuery("");
  }

  function removeCountry(country) {
    setSelectedCountries(current => current.filter(item => item !== country));
  }

  async function loadRoleSuggestions() {
    setError("");
    setRoleStatus("loading");

    try {
      const response = await fetch("/api/cognism/roles", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({ query: roleQuery }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Role suggestion failed");
      const roles = Array.isArray(payload.roles) ? payload.roles : [];
      setSuggestedRoles(roles);
      setSelectedRoles(roles);
      setRoleMode(payload.mode || "fallback");
      setRoleStatus("done");
    } catch (roleError) {
      setError(roleError.message || "Role suggestion failed");
      setRoleStatus("error");
    }
  }

  async function previewContacts() {
    const companies = parseLines(companiesText);
    const customRoles = parseLines(customRolesText);
    const targetTitles = [...new Set([...selectedRoles, ...customRoles])];
    const requestedMax = Math.max(Number(maxPerCompany) || 1, 1);

    if (!companies.length) {
      setError("Add at least one company or domain.");
      return;
    }

    if (!targetTitles.length) {
      setError("Describe what you are looking for, generate role options, or add target roles manually.");
      return;
    }

    setError("");
    setStatus("loading");
    setResults([]);
    setSelectedResultIds([]);
    setSelectedUserIds([]);
    setResultCompanyFilter("");
    setCompanyListSaveStatus("idle");

    try {
      const response = await fetch("/api/cognism/preview", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({ companies, targetTitles, maxPerCompany: requestedMax, requireMobileAvailable, countries: selectedCountries }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Preview request failed");
      setMeta({
        mode: payload.mode,
        estimatedCreditsUsed: payload.estimatedCreditsUsed,
        maxPerCompany: payload.maxPerCompany,
        requireMobileAvailable: Boolean(payload.requireMobileAvailable),
        countries: Array.isArray(payload.countries) ? payload.countries : [],
      });
      const nextResults = hydrateLeadsWithContactDatabase(Array.isArray(payload.results) ? payload.results : [], contactDatabase);
      setResults(nextResults);
      setSelectedResultIds(nextResults.map((result, index) => leadResultId(result, index)));
      const savedContacts = await onPersistSearchResults(nextResults);
      setResults(current => hydrateLeadsWithContactDatabase(current, savedContacts));
      setStatus("done");
    } catch (previewError) {
      setError(previewError.message || "Preview request failed");
      setStatus("error");
    }
  }

  function validateLeadsBeforeListSave(leads) {
    for (const lead of leads) {
      const validationError = validateLeadManualFields(lead);
      if (validationError) {
        setError(validationError);
        return false;
      }
      const conflicts = findPotentialContactConflicts(lead, contactDatabase);
      if (conflicts.length) {
        const conflictNames = conflicts.map(contact => contact.contactName || contact.company || contact.id).join(", ");
        const confirmed = window.confirm(`Another PaceOps DB contact already has the same LinkedIn URL, email, or mobile (${conflictNames}). Continue only if this is the same person or intentionally different.`);
        if (!confirmed) {
          setError("Save cancelled.");
          return false;
        }
      }
    }
    return true;
  }

  async function saveLeadList() {
    if (!leadListName.trim()) {
      setError("Name this lead list before saving.");
      return;
    }
    if (!selectedUserIds.length) {
      setError("Assign the lead list to at least one user.");
      return;
    }
    if (!selectedResults.length) {
      setError("Select at least one retrieved lead before saving.");
      return;
    }
    if (!validateLeadsBeforeListSave(selectedResults)) return;

    setError("");
    setSaveStatus("saving");
    try {
      await onSaveLeadList({
        name: leadListName.trim(),
        assignedUserIds: selectedUserIds,
        leads: selectedResults,
        filters: {
          companies: parseLines(companiesText),
          roleQuery,
          selectedRoles,
          customRoles: parseLines(customRolesText),
          maxPerCompany: meta.maxPerCompany,
          requireMobileAvailable,
          countries: selectedCountries,
        },
      });
      setSaveStatus("saved");
    } catch (saveError) {
      setSaveStatus("error");
      setError(saveError.message || "Could not save lead list.");
    }
  }

  async function saveFilteredCompanyLeadList() {
    if (!resultCompanyFilter) {
      setError("Choose a company filter before saving a company list.");
      return;
    }
    if (!selectedUserIds.length) {
      setError("Assign the lead list to at least one user.");
      return;
    }
    if (!displayedResults.length) {
      setError("No leads found for the selected company.");
      return;
    }
    if (!validateLeadsBeforeListSave(displayedResults)) return;

    setError("");
    setCompanyListSaveStatus("saving");
    try {
      await onSaveLeadList({
        name: `${resultCompanyFilter} lead list`,
        assignedUserIds: selectedUserIds,
        leads: displayedResults,
        filters: {
          companies: [resultCompanyFilter],
          roleQuery,
          selectedRoles,
          customRoles: parseLines(customRolesText),
          maxPerCompany: meta.maxPerCompany,
          requireMobileAvailable,
          countries: selectedCountries,
          source: "lead_finder_company_filter",
        },
      });
      setCompanyListSaveStatus("saved");
    } catch (saveError) {
      setCompanyListSaveStatus("error");
      setError(saveError.message || "Could not save company lead list.");
    }
  }

  async function exportSelectedToHubSpot() {
    if (!selectedResultEntries.length) {
      setError("Select at least one lead before exporting to HubSpot.");
      return;
    }

    setError("");
    setHubspotExportSummary("");
    setHubspotExportStatus("exporting");
    try {
      const { data } = supabase ? await supabase.auth.getSession() : { data: null };
      const token = data?.session?.access_token;
      if (!token) throw new Error("Sign in before exporting to HubSpot.");

      const hubspotRows = selectedResultEntries.map(({ result, resultId }) => ({
        rowId: resultId,
        dbContactId: result.dbContactId,
        hubspotContactId: result.hubspotContactId,
        contactName: result.contactName,
        company: result.company,
        jobTitle: result.jobTitle,
        location: result.location,
        manualEmail: result.manualEmail,
        manualMobile: result.manualMobile,
        manualDirectDial: result.manualDirectDial,
      }));

      const response = await fetch("/api/hubspot/contacts/export", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows: hubspotRows }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "HubSpot export failed.");

      const resultsByRowId = new Map((payload.results || []).map(result => [result.rowId, result]));
      const savedContacts = [];
      for (const { result, resultId } of selectedResultEntries) {
        const exportResult = resultsByRowId.get(resultId);
        if (!exportResult) continue;
        const nextLead = {
          ...result,
          hubspotContactId: exportResult.hubspotContactId,
          hubspotExportedAt: exportResult.hubspotExportedAt,
          hubspotExportStatus: exportResult.hubspotExportStatus,
          hubspotExportError: exportResult.hubspotExportError,
        };
        const savedContact = await onSaveLeadContact(nextLead, { allowPreviewOnly: true, skipConflictPrompt: true });
        savedContacts.push(savedContact);
      }

      setResults(current => current.map((result, index) => {
        const resultId = leadResultId(result, index);
        const exportResult = resultsByRowId.get(resultId);
        if (!exportResult) return result;
        return hydrateLeadWithContactDatabase({
          ...result,
          hubspotContactId: exportResult.hubspotContactId,
          hubspotExportedAt: exportResult.hubspotExportedAt,
          hubspotExportStatus: exportResult.hubspotExportStatus,
          hubspotExportError: exportResult.hubspotExportError,
        }, savedContacts);
      }));

      setHubspotExportStatus((payload.results || []).some(result => result.hubspotExportStatus === "error") ? "error" : "exported");
      const failedCount = (payload.results || []).filter(result => result.hubspotExportStatus === "error").length;
      const exportedCount = (payload.results || []).filter(result => result.hubspotExportStatus === "exported").length;
      const failures = buildHubSpotExportFailures(hubspotRows, payload.results || []);
      const summary = `${exportedCount} exported to HubSpot${failedCount ? `, ${failedCount} failed` : ""}.`;
      setHubspotExportSummary(summary);
      setHubspotExportDialog({
        open: true,
        status: failedCount ? "error" : "success",
        summary,
        detail: failedCount ? "Review the failed row below, fix the lead data if needed, then export again." : "Selected Lead Finder rows have been sent to HubSpot and export status has been saved in PaceOps.",
        failures,
      });
      if (failedCount) setError(`${failedCount} HubSpot export${failedCount === 1 ? "" : "s"} failed. Check the HubSpot status column.`);
    } catch (exportError) {
      setHubspotExportStatus("error");
      setHubspotExportSummary("");
      setHubspotExportDialog({
        open: true,
        status: "error",
        summary: exportError.message || "HubSpot export failed.",
        detail: "No successful export response was received from HubSpot.",
      });
      setError(exportError.message || "HubSpot export failed.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Lead Finder"
        title="Lead finder"
        description="Search preview leads per company with title, mobile, and geography filters."
      >
        <button className="secondary-button" type="button" disabled>
          <LockKeyhole size={16} />
          Redeem disabled in test mode
        </button>
      </PageHeader>

      <div className="cognism-layout">
        <section className="panel cognism-controls">
          <div className="panel-header">
            <div>
            <span className="eyebrow">Search inputs</span>
            <h2>Any client or account list</h2>
          </div>
          <StatusBadge tone="accent">Configurable max</StatusBadge>
        </div>
          <div className="finder-input-section primary-section">
            <div className="finder-section-heading">
              <span>1</span>
              <div>
                <strong>Target persona</strong>
                <small>Describe the buyer or function.</small>
              </div>
            </div>
            <label className="form-field">
              <span>What are you looking for?</span>
              <input
                value={roleQuery}
                onChange={event => setRoleQuery(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    loadRoleSuggestions();
                  }
                }}
                placeholder="UX, cyber security, finance buyer, procurement, engineering leadership"
              />
            </label>
            <button className="secondary-button role-suggest-button" type="button" onClick={loadRoleSuggestions} disabled={roleStatus === "loading" || !roleQuery.trim()}>
              <Sparkles size={16} />
              {roleStatus === "loading" ? "Loading roles" : "Load role options"}
            </button>
          </div>
          <div className="finder-input-section company-section">
            <div className="finder-section-heading">
              <span>2</span>
              <div>
                <strong>Companies</strong>
                <small>One company or domain per line.</small>
              </div>
            </div>
            <div className="company-import-actions">
              <button className="secondary-button" type="button" onClick={openCompanyImport}>
                <Upload size={16} />
                Import companies
              </button>
              <input
                ref={companyImportInputRef}
                className="visually-hidden"
                type="file"
                multiple
                accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                onChange={handleCompanyImportFile}
              />
              <StatusBadge>{targetCompanyCount} targets</StatusBadge>
            </div>
            <label className="form-field">
              <span>Companies or domains</span>
              <textarea
                value={companiesText}
                onChange={event => setCompaniesText(event.target.value)}
                placeholder={"Microsoft\nadobe.com\nAtlassian"}
              />
            </label>
          </div>
          <div className="finder-input-section filter-section">
            <div className="finder-section-heading">
              <span>3</span>
              <div>
                <strong>Lead filters</strong>
                <small>Control volume and contact availability.</small>
              </div>
            </div>
            <label className="form-field">
              <span>Max contacts per company</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={maxPerCompany}
                onChange={event => updateMaxPerCompany(event.target.value)}
                onBlur={normalizeMaxPerCompany}
                aria-label="Max contacts per company"
              />
            </label>
            <div className="finder-availability-filters">
              <label className={`role-choice ${requireMobileAvailable ? "selected" : ""}`}>
                <input type="checkbox" checked={requireMobileAvailable} onChange={event => setRequireMobileAvailable(event.target.checked)} />
                <span>Must include mobile</span>
              </label>
            </div>
          </div>
          <div className="finder-input-section geography-section country-picker">
            <div className="finder-section-heading">
              <span>4</span>
              <div>
                <strong>Geography</strong>
                <small>Add one or more countries.</small>
              </div>
            </div>
            <label className="form-field">
              <span>Geography</span>
              <input
                value={countryQuery}
                onChange={event => setCountryQuery(event.target.value)}
                onKeyDown={event => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  addCountry(matchingCountries[0] || countryQuery);
                }}
                placeholder="Type a country, then press Enter"
                list="country-suggestions"
              />
            </label>
            <datalist id="country-suggestions">
              {matchingCountries.map(country => <option key={country} value={country} />)}
            </datalist>
            {countryQuery.trim() && matchingCountries.length ? (
              <div className="country-suggestion-list">
                {matchingCountries.map(country => (
                  <button key={country} type="button" onClick={() => addCountry(country)}>{country}</button>
                ))}
              </div>
            ) : null}
            {selectedCountries.length ? (
              <div className="country-token-list">
                {selectedCountries.map(country => (
                  <button key={country} type="button" onClick={() => removeCountry(country)}>
                    {country}
                    <span>x</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="finder-input-section finder-user-select">
            <div className="panel-header compact-header">
              <div>
                <span className="eyebrow">Users</span>
                <h2>Assign results</h2>
              </div>
              <StatusBadge>{canAssignResults ? `${selectedUserIds.length} selected` : "Retrieve first"}</StatusBadge>
            </div>
            <div className="role-actions">
              <button className="secondary-button" type="button" onClick={() => setSelectedUserIds(workspaceUsers.map(user => user.id))} disabled={!canAssignResults || !workspaceUsers.length}>
                <CheckCircle2 size={16} />
                Select all
              </button>
              <button className="secondary-button" type="button" onClick={() => setSelectedUserIds([])} disabled={!canAssignResults || !selectedUserIds.length}>
                <Circle size={16} />
                Deselect all
              </button>
            </div>
            {workspaceUsers.length ? (
              <div className="role-choice-grid compact-choice-grid">
                {workspaceUsers.map(user => (
                  <label key={user.id} className={`role-choice ${selectedUserIds.includes(user.id) ? "selected" : ""} ${!canAssignResults ? "disabled" : ""}`}>
                    <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => toggleUser(user.id)} disabled={!canAssignResults} />
                    <span>{user.name}<small>{user.email}</small></span>
                  </label>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="No users found" text="PaceOps users will appear here after they sign in to the CRM." />
            )}
          </div>
        </section>

        <section className="panel cognism-roles">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Role options</span>
              <h2>Select target titles</h2>
            </div>
            <StatusBadge>{selectedRoles.length} selected</StatusBadge>
          </div>
          <div className="role-actions">
            <button className="secondary-button" type="button" onClick={() => setSelectedRoles(roleOptions)} disabled={!roleOptions.length}>
              <CheckCircle2 size={16} />
              Select all
            </button>
            <button className="secondary-button" type="button" onClick={() => setSelectedRoles([])} disabled={!roleOptions.length && !selectedRoles.length}>
              <Circle size={16} />
              Deselect all
            </button>
            {roleMode ? <StatusBadge>{roleMode === "openai" ? "OpenAI suggested" : "Fallback suggested"}</StatusBadge> : null}
          </div>
          {roleOptions.length ? (
            <div className="role-choice-grid">
              {roleOptions.map(role => (
              <label key={role} className={`role-choice ${selectedRoles.includes(role) ? "selected" : ""}`}>
                <input type="checkbox" checked={selectedRoles.includes(role)} onChange={() => toggleRole(role)} />
                <span>{role}</span>
              </label>
              ))}
            </div>
          ) : (
            <EmptyState icon={Sparkles} title="No role options loaded" text="Enter what you are looking for, then load role options." />
          )}
          <div className="finder-input-section manual-title-section">
            <div className="finder-section-heading">
              <span>+</span>
              <div>
                <strong>Manual titles</strong>
                <small>Add exact titles the suggestions miss.</small>
              </div>
            </div>
            <label className="form-field">
              <span>Optional manual role titles, one per line or comma-separated</span>
              <textarea
                value={customRolesText}
                onChange={event => setCustomRolesText(event.target.value)}
                placeholder={"Use this only if the generated options miss a title.\nChief Information Security Officer\nVP Engineering, Head of Procurement"}
              />
            </label>
          </div>
        </section>
      </div>

      <div className="finder-retrieve-actions">
        <button className="primary-button" type="button" onClick={previewContacts} disabled={status === "loading"}>
          <Search size={16} />
          {status === "loading" ? "Retrieving" : "Retrieve leads"}
        </button>
        <button className="secondary-button danger-button" type="button" onClick={clearSearch}>
          <Circle size={16} />
          Clear search
        </button>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Preview results</span>
            <h2>Lead matches</h2>
          </div>
          <div className="cognism-meta">
            <StatusBadge tone="success">{meta.mode}</StatusBadge>
            <StatusBadge>Credits: {meta.estimatedCreditsUsed}</StatusBadge>
            <StatusBadge>Max: {meta.maxPerCompany}</StatusBadge>
            {meta.requireMobileAvailable ? <StatusBadge>Mobile required</StatusBadge> : null}
            {meta.countries?.length ? <StatusBadge>{meta.countries.join(", ")}</StatusBadge> : null}
          </div>
        </div>
        <div className="results-summary">
          <div>
            <span>Matches</span>
            <strong>{results.length}</strong>
          </div>
          <div>
            <span>Email available</span>
            <strong>{results.filter(result => result.emailAvailable).length}</strong>
          </div>
          <div>
            <span>Mobile available</span>
            <strong>{results.filter(result => result.mobileAvailable).length}</strong>
          </div>
          <div>
            <span>Direct dial</span>
            <strong>{results.filter(result => result.directDialAvailable).length}</strong>
          </div>
        </div>
        <div className="result-company-tools">
          <label className="save-list-inline">
            <span>Filter by company</span>
            <select
              value={resultCompanyFilter}
              onChange={event => {
                setResultCompanyFilter(event.target.value);
                setCompanyListSaveStatus("idle");
              }}
              disabled={!resultCompanyOptions.length}
            >
              <option value="">All companies</option>
              {resultCompanyOptions.map(company => (
                <option key={company} value={company}>{company}</option>
              ))}
            </select>
          </label>
          <StatusBadge>{displayedResults.length} visible</StatusBadge>
          {resultCompanyFilter ? (
            <button className="primary-button" type="button" onClick={saveFilteredCompanyLeadList} disabled={companyListSaveStatus === "saving" || !displayedResults.length}>
              <ListFilter size={16} />
              {companyListSaveStatus === "saving" ? "Saving" : companyListSaveStatus === "saved" ? "Saved" : "Save company list"}
            </button>
          ) : null}
        </div>
        <div className="export-actions compact-export-actions">
          <label className="save-list-inline">
            <span>Lead list name</span>
            <input
              value={leadListName}
              onChange={event => {
                setLeadListName(event.target.value);
                setSaveStatus("idle");
              }}
              placeholder="Stripe Ireland product support leads"
            />
          </label>
          <button className="primary-button" type="button" onClick={saveLeadList} disabled={saveStatus === "saving" || !selectedResults.length}>
            <ListFilter size={16} />
            {saveStatus === "saving" ? "Saving" : saveStatus === "saved" ? "Saved" : "Save lead list"}
          </button>
          <button className="secondary-button" type="button" disabled={!selectedResults.length} onClick={() => exportCognismResults(selectedResults, "csv", selectedUsers)}>
            <FileText size={16} />
            Export selected CSV
          </button>
          <button className="secondary-button" type="button" disabled={!selectedResults.length} onClick={() => exportCognismResults(selectedResults, "xls", selectedUsers)}>
            <FileText size={16} />
            Export selected Excel
          </button>
          <button className="secondary-button" type="button" disabled={!selectedResults.length} onClick={() => exportCognismResults(selectedResults, "json", selectedUsers)}>
            <FileText size={16} />
            Export selected JSON
          </button>
          <button className="secondary-button" type="button" onClick={exportSelectedToHubSpot} disabled={hubspotExportStatus === "exporting" || !selectedResults.length}>
            <Database size={16} />
            {hubspotExportStatus === "exporting" ? "Exporting" : hubspotExportStatus === "exported" ? "Exported" : "Export to HubSpot"}
          </button>
        </div>
        {hubspotExportSummary ? (
          <div className={`form-success ${hubspotExportStatus === "error" ? "warning" : ""}`}>
            {hubspotExportSummary}
          </div>
        ) : null}
        {error ? <div className="form-error">{error}</div> : null}
        <div className="result-selection-actions">
          <div>
            <span className="eyebrow">Generated rows</span>
            <strong>{selectedDisplayedResults.length} of {displayedResults.length} visible selected, {selectedResults.length} total selected</strong>
          </div>
          <div className="role-actions">
            <button className="secondary-button" type="button" onClick={() => setSelectedResultIds(current => [...new Set([...current, ...displayedResultEntries.map(({ result, index }) => leadResultId(result, index))])])} disabled={!displayedResultEntries.length || selectedDisplayedResults.length === displayedResults.length}>
              <CheckCircle2 size={16} />
              Select visible
            </button>
            <button className="secondary-button" type="button" onClick={() => {
              const visibleIds = new Set(displayedResultEntries.map(({ result, index }) => leadResultId(result, index)));
              setSelectedResultIds(current => current.filter(resultId => !visibleIds.has(resultId)));
            }} disabled={!selectedDisplayedResults.length}>
              <Circle size={16} />
              Deselect visible
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table cognism-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Contact name</th>
                <th>Company</th>
                <th>Job title</th>
                <th>Location</th>
                <th>LinkedIn</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Notes</th>
                <th>Saved</th>
                <th>HubSpot</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedResultEntries.length ? displayedResultEntries.map(({ result, index }) => {
                const resultId = leadResultId(result, index);
                return (
                <tr key={resultId}>
                  <td className="table-select-cell">
                    <input
                      type="checkbox"
                      checked={selectedResultIds.includes(resultId)}
                      onChange={() => toggleResult(resultId)}
                      aria-label={`Select ${result.contactName || result.jobTitle || "lead"}`}
                    />
                  </td>
                  <td>{result.contactName || "Not available"}</td>
                  <td>{result.company || "Not available"}</td>
                  <td>{result.jobTitle || "Not available"}</td>
                  <td>{result.location || "Not available"}</td>
                  <td>
                    <LinkedInProfileField
                      value={result.linkedinProfileUrl}
                      onChange={event => updateResultField(resultId, "linkedinProfileUrl", event.target.value)}
                      onBlur={() => leadHasPaceOpsData(result) && saveContactResult(resultId)}
                      onOpen={() => openLinkedIn(result)}
                      canSearch={Boolean(result.contactName || result.company)}
                    />
                  </td>
                  <td>
                    <input
                      className="table-input"
                      value={result.manualEmail || ""}
                      onChange={event => updateResultField(resultId, "manualEmail", event.target.value)}
                      onBlur={() => leadHasPaceOpsData(result) && saveContactResult(resultId)}
                      placeholder="name@company.com"
                    />
                  </td>
                  <td>
                    <input
                      className="table-input"
                      value={result.manualMobile || ""}
                      onChange={event => updateResultField(resultId, "manualMobile", event.target.value)}
                      onBlur={() => leadHasPaceOpsData(result) && saveContactResult(resultId)}
                      placeholder="+353 ..."
                    />
                  </td>
                  <td>
                    <textarea
                      className="table-textarea"
                      value={result.notes || ""}
                      onChange={event => updateResultField(resultId, "notes", event.target.value)}
                      onBlur={() => leadHasPaceOpsData(result) && saveContactResult(resultId)}
                      placeholder="Notes"
                    />
                  </td>
                  <td><DataSourceBadge lead={result} /></td>
                  <td>
                    {result.hubspotExportStatus ? (
                      <div className="db-source-cell">
                        <StatusBadge tone={result.hubspotExportStatus === "exported" ? "success" : "warning"}>{result.hubspotExportStatus}</StatusBadge>
                        {result.hubspotContactId ? <small>{result.hubspotContactId}</small> : null}
                        {result.hubspotExportError ? <small>{result.hubspotExportError}</small> : null}
                      </div>
                    ) : (
                      <StatusBadge>Not exported</StatusBadge>
                    )}
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="secondary-button" type="button" onClick={() => saveContactResult(resultId)} disabled={!leadHasPaceOpsData(result)}>
                        <Database size={16} />
                        Save
                      </button>
                    </div>
                  </td>
                </tr>
                );
              }) : (
                <tr>
                  <td colSpan="12" className="empty-table-cell">
                    {status === "done" ? "No preview matches returned for this company filter." : "Run a preview to see lead metadata."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {companyImportOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) closeCompanyImport();
        }}>
          <section className="workflow-modal company-import-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Import companies</span>
                <h2>Target company import</h2>
              </div>
              <button className="secondary-button" type="button" onClick={closeCompanyImport}>Close</button>
            </div>
            <div className="company-import-toolbar">
              <button className="secondary-button" type="button" onClick={() => companyImportInputRef.current?.click()} disabled={companyImportStatus === "loading"}>
                <Upload size={16} />
                {companyImportStatus === "loading" ? "Reading files" : companyImportRows.length ? "Add files" : "Choose files"}
              </button>
              <StatusBadge>{companyImportFileCount ? `${companyImportFileCount} files` : "No files selected"}</StatusBadge>
              <StatusBadge>{companyImportRows.length ? `${companyImportRows.length} unique companies` : "0 companies"}</StatusBadge>
              <StatusBadge tone="success">{companyImportNewCompanyCount} new targets</StatusBadge>
            </div>
            {companyImportError ? <div className="form-error">{companyImportError}</div> : null}
            <div className="table-wrap company-import-preview">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Company name</th>
                    <th>Source file</th>
                    <th>Source sheet</th>
                  </tr>
                </thead>
                <tbody>
                  {companyImportRows.length ? companyImportRows.map(row => (
                    <tr key={`${row.sourceFile}-${row.sourceSheet}-${row.companyName}`}>
                      <td>{row.companyName}</td>
                      <td>{row.sourceFile}</td>
                      <td>{row.sourceSheet || "CSV"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="empty-table-cell">Choose one or more CSV or Excel files with a company column.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={closeCompanyImport}>Cancel</button>
              <button className="primary-button" type="button" onClick={confirmCompanyImport} disabled={!companyImportRows.length}>
                <CheckCircle2 size={16} />
                Confirm import ({companyImportNewCompanyCount})
              </button>
            </div>
          </section>
        </div>
      ) : null}
      <HubSpotExportResultModal result={hubspotExportDialog} onClose={() => setHubspotExportDialog(null)} />
    </>
  );
}

function IntegrationsPage({ onNavigate, onOpenWorkflow, onUpdateIntegration, integrationCredentials, onSaveIntegrationCredentials }) {
  const { integrations } = useCrmData();
  const [cognismRedeemCode, setCognismRedeemCode] = useState("");
  const [cognismRedeemError, setCognismRedeemError] = useState("");
  const [cognismRedeemModalOpen, setCognismRedeemModalOpen] = useState(false);
  const [credentialProvider, setCredentialProvider] = useState("");
  const [credentialValues, setCredentialValues] = useState({});
  const [credentialVisibleFields, setCredentialVisibleFields] = useState({});
  const [credentialStatus, setCredentialStatus] = useState("idle");
  const [credentialError, setCredentialError] = useState("");

  const cognismIntegration = integrations.find(integration => integration.name === "Cognism");
  const credentialFormByName = new Map(integrationCredentialForms.map(form => [form.integrationName, form]));
  const activeCredentialForm = integrationCredentialForms.find(form => form.provider === credentialProvider);

  function openCredentialModal(provider) {
    setCredentialProvider(provider);
    setCredentialValues({});
    setCredentialVisibleFields({});
    setCredentialStatus("idle");
    setCredentialError("");
  }

  function closeCredentialModal() {
    setCredentialProvider("");
    setCredentialValues({});
    setCredentialVisibleFields({});
    setCredentialStatus("idle");
    setCredentialError("");
  }

  async function saveCredentials(event) {
    event.preventDefault();
    if (!activeCredentialForm) return;
    setCredentialStatus("saving");
    setCredentialError("");
    try {
      await onSaveIntegrationCredentials(activeCredentialForm.provider, credentialValues);
      setCredentialStatus("saved");
      setCredentialValues({});
      closeCredentialModal();
    } catch (error) {
      setCredentialStatus("idle");
      setCredentialError(error?.message || "Could not save credentials.");
    }
  }

  function enableCognismRedeem() {
    if (cognismRedeemCode.trim() !== COGNISM_REDEEM_CONFIRMATION) {
      setCognismRedeemError(`Type ${COGNISM_REDEEM_CONFIRMATION} to enable redeem mode.`);
      return;
    }
    setCognismRedeemError("");
    onUpdateIntegration("Cognism", { redeemEnabled: true });
    setCognismRedeemCode("");
    setCognismRedeemModalOpen(false);
  }

  function closeCognismRedeemModal() {
    setCognismRedeemModalOpen(false);
    setCognismRedeemCode("");
    setCognismRedeemError("");
  }

  return (
    <>
      <PageHeader
        eyebrow="Integrations"
        title="Connection centre"
        description="Active and planned external services for contact search, calling, account intelligence, and imports."
      />
      <div className="integration-grid">
        {integrations.map(integration => {
          const Icon = integration.icon;
          const isAvailable = Boolean(integration.view || integration.workflow);
          const credentialForm = credentialFormByName.get(integration.name);
          const credentialState = credentialForm ? integrationCredentials?.providers?.[credentialForm.provider] : null;
          return (
            <article key={integration.name} className="integration-card">
              <div>
                <span className="integration-icon"><Icon size={20} /></span>
                <StatusBadge tone={connectedIntegrationStatuses.has(integration.status) ? "success" : "neutral"}>{integration.status}</StatusBadge>
              </div>
              <h2>{integration.name}</h2>
              <p>{integration.note}</p>
              {integration.name === "Cognism" ? (
                <div className="integration-setting">
                  <div>
                    <span>Redeem mode</span>
                    <StatusBadge tone={integration.redeemEnabled ? "warning" : "success"}>{integration.redeemEnabled ? "Redeem on" : "Preview only"}</StatusBadge>
                  </div>
                  <button className="secondary-button" type="button" onClick={() => integration.redeemEnabled ? onUpdateIntegration(integration.name, { redeemEnabled: false }) : setCognismRedeemModalOpen(true)}>
                    {integration.redeemEnabled ? "Set preview only" : "Enable redeem"}
                  </button>
                </div>
              ) : null}
              {SHOW_INTEGRATION_KEY_CONTROLS && credentialForm ? (
                <div className="integration-setting">
                  <div>
                    <span>API key</span>
                    <StatusBadge tone={credentialState?.configured ? "success" : "neutral"}>
                      {credentialState?.configured ? `Configured${credentialState.source === "env" ? " via env" : ""}` : "Missing"}
                    </StatusBadge>
                  </div>
                  <button className="secondary-button" type="button" onClick={() => openCredentialModal(credentialForm.provider)}>
                    <ShieldCheck size={16} />
                    Manage key
                  </button>
                </div>
              ) : null}
              {isAvailable && integration.action ? (
                <button className="secondary-button" type="button" onClick={() => integration.workflow ? onOpenWorkflow(integration.workflow) : onNavigate(integration.view)}>
                  {integration.action}
                </button>
              ) : !integration.action ? null : (
                <StatusBadge>Not actionable yet</StatusBadge>
              )}
            </article>
          );
        })}
      </div>
      {cognismRedeemModalOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) closeCognismRedeemModal();
        }}>
          <section className="workflow-modal cognism-redeem-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Cognism</span>
                <h2>Enable redeem mode</h2>
              </div>
              <button className="secondary-button" type="button" onClick={closeCognismRedeemModal}>Close</button>
            </div>
            <p className="modal-helper-text">Redeem mode can consume Cognism credits. Type {COGNISM_REDEEM_CONFIRMATION} to turn it on.</p>
            <label className="form-field">
              <span>Confirmation</span>
              <input
                type="text"
                value={cognismRedeemCode}
                onChange={event => {
                  setCognismRedeemCode(event.target.value);
                  setCognismRedeemError("");
                }}
                placeholder={COGNISM_REDEEM_CONFIRMATION}
                autoComplete="off"
              />
            </label>
            {cognismRedeemError ? <div className="form-error">{cognismRedeemError}</div> : null}
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={closeCognismRedeemModal}>Cancel</button>
              <button className="primary-button" type="button" onClick={enableCognismRedeem} disabled={!cognismIntegration}>
                Enable redeem
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {activeCredentialForm ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) closeCredentialModal();
        }}>
          <form className="workflow-modal integration-key-modal" onSubmit={saveCredentials}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">API access</span>
                <h2>{activeCredentialForm.title}</h2>
              </div>
              <button className="secondary-button" type="button" onClick={closeCredentialModal}>Close</button>
            </div>
            <p className="modal-helper-text">{activeCredentialForm.description}</p>
            <div className="integration-credential-fields">
              {activeCredentialForm.fields.map(field => {
                const fieldKey = `${activeCredentialForm.provider}.${field.name}`;
                const status = integrationCredentials?.providers?.[activeCredentialForm.provider] || {};
                return (
                  <label key={field.name} className="api-secret-field">
                    <span>{field.label}</span>
                    <div>
                      <input
                        type={credentialVisibleFields[fieldKey] ? "text" : "password"}
                        value={credentialValues[field.name] || ""}
                        onChange={event => setCredentialValues(current => ({ ...current, [field.name]: event.target.value }))}
                        placeholder={status.hints?.[field.name] || field.placeholder}
                        autoComplete="off"
                      />
                      <button
                        className="icon-action"
                        type="button"
                        onClick={() => setCredentialVisibleFields(current => ({ ...current, [fieldKey]: !current[fieldKey] }))}
                        aria-label={credentialVisibleFields[fieldKey] ? "Hide key" : "Show key"}
                      >
                        {credentialVisibleFields[fieldKey] ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </label>
                );
              })}
            </div>
            {credentialError ? <div className="form-error">{credentialError}</div> : null}
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={closeCredentialModal}>Cancel</button>
              <button className="primary-button" type="submit" disabled={credentialStatus === "saving"}>
                {credentialStatus === "saving" ? "Saving" : "Save key"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

const integrationCredentialForms = [
  {
    provider: "openai",
    integrationName: "OpenAI",
    title: "ChatGPT / OpenAI",
    description: "Used for role suggestions, account lookup, and account intelligence scripts.",
    fields: [{ name: "apiKey", label: "OpenAI API key", placeholder: "sk-..." }],
  },
  {
    provider: "cognism",
    integrationName: "Cognism",
    title: "Cognism",
    description: "Used by Lead Finder preview search.",
    fields: [{ name: "apiKey", label: "Cognism API key", placeholder: "Bearer token" }],
  },
  {
    provider: "aircall",
    integrationName: "Aircall",
    title: "Aircall",
    description: "Used for click-to-call from saved leads and CRM contacts.",
    fields: [
      { name: "apiId", label: "API ID", placeholder: "Aircall API ID" },
      { name: "apiToken", label: "API token", placeholder: "Aircall API token" },
      { name: "userId", label: "Aircall user ID", placeholder: "Numeric user ID" },
    ],
  },
  {
    provider: "hubspot",
    integrationName: "HubSpot",
    title: "HubSpot",
    description: "Used for exporting Lead Finder contacts to HubSpot.",
    fields: [{ name: "privateAppToken", label: "Private app token", placeholder: "pat-..." }],
  },
];

function SettingsPage({ isDark, onThemeToggle, onInviteTeamMember, user, onUpdateProfile }) {
  const { teamMembers, clients, workspaceUsers } = useCrmData();
  const visibleTeamMembers = workspaceUsers?.length ? workspaceUsers : teamMembers;
  const metadata = user?.user_metadata || {};
  const nameParts = String(metadata.full_name || "").trim().split(" ").filter(Boolean);
  const [profileValues, setProfileValues] = useState({
    firstName: metadata.first_name || nameParts[0] || "",
    lastName: metadata.last_name || nameParts.slice(1).join(" ") || "",
  });
  const [profileStatus, setProfileStatus] = useState("idle");
  const [profileError, setProfileError] = useState("");

  async function submitProfile(event) {
    event.preventDefault();
    setProfileStatus("saving");
    setProfileError("");
    try {
      await onUpdateProfile({
        firstName: profileValues.firstName.trim(),
        lastName: profileValues.lastName.trim(),
      });
      setProfileStatus("saved");
    } catch (error) {
      setProfileStatus("idle");
      setProfileError(error?.message || "Could not update profile.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Tenant, team, preference, and security settings for the CRM workspace."
      >
        <button className="primary-button" type="button" onClick={onInviteTeamMember}>
          <Plus size={16} />
          Invite teammate
        </button>
      </PageHeader>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header"><h2>Account profile</h2></div>
          <form className="profile-settings-form" onSubmit={submitProfile}>
            <FormField label="Email">
              <input value={user?.email || ""} disabled />
            </FormField>
            <FormField label="First name">
              <input
                value={profileValues.firstName}
                onChange={event => {
                  setProfileStatus("idle");
                  setProfileValues(current => ({ ...current, firstName: event.target.value }));
                }}
                placeholder="First name"
              />
            </FormField>
            <FormField label="Last name">
              <input
                value={profileValues.lastName}
                onChange={event => {
                  setProfileStatus("idle");
                  setProfileValues(current => ({ ...current, lastName: event.target.value }));
                }}
                placeholder="Last name"
              />
            </FormField>
            {profileError ? <div className="form-error">{profileError}</div> : null}
            <button className="primary-button" type="submit" disabled={profileStatus === "saving"}>
              <UserRound size={16} />
              {profileStatus === "saving" ? "Saving" : profileStatus === "saved" ? "Saved" : "Save profile"}
            </button>
          </form>
        </section>
        <section className="panel">
          <div className="panel-header"><h2>Team members</h2></div>
          {visibleTeamMembers.length ? <div className="team-list">
            {visibleTeamMembers.map(member => (
              <div key={member.id || member.name} className="team-row">
                <span>{member.initials}</span>
                <div>
                  <strong>{member.name}</strong>
                  <small>{member.email || member.role}</small>
                </div>
                <TeamStatusBadge status={member.status} />
              </div>
            ))}
          </div> : <EmptyState icon={Users} title="No teammates yet" text="Invite a teammate to start assigning accounts, calls, and research." />}
        </section>
        <section className="panel">
          <div className="panel-header"><h2>Preferences</h2></div>
          <div className="settings-list">
            <div>
              <span>Theme</span>
              <button className="secondary-button" type="button" onClick={onThemeToggle}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
                {isDark ? "Light mode" : "Dark mode"}
              </button>
            </div>
            <div>
              <span>Default client</span>
              <strong>{clients[0]?.name || "Create a client first"}</strong>
            </div>
            <div>
              <span>Security posture</span>
              <strong>RLS-ready schema, no frontend API keys</strong>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function FilesPage({ onUploadFile }) {
  const { files } = useCrmData();

  return (
    <>
      <PageHeader
        eyebrow="Files"
        title="Source files"
        description="A lightweight entry point for future CSV imports, call notes, research packs, and mapping files."
      >
        <button className="primary-button" type="button" onClick={onUploadFile}>
          <Upload size={16} />
          Add source file
        </button>
      </PageHeader>
      <section className="panel">
        {files.length ? <DataTable
          columns={["File", "Source", "Rows", "Status", "Added"]}
          rows={files.map(file => [
            <RecordName key="file" name={file.name} meta={file.objectType} />,
            file.source,
            file.rows,
            <StatusBadge key="status" tone="accent">{file.status}</StatusBadge>,
            file.createdAt,
          ])}
        /> : <EmptyState
          icon={FileText}
          title="No files added yet"
          text="CSV import and file summariser workflows will attach source files to clients, accounts, and campaigns."
        />}
      </section>
    </>
  );
}

function ActivityTimeline({ account, collaborativeOnly = false }) {
  const { activities } = useCrmData();
  const filtered = activities.filter(item => {
    if (account && item.account !== account) return false;
    if (collaborativeOnly && !collaborativeActivityTypes.has(item.type)) return false;
    return true;
  });
  if (!filtered.length) {
    return <EmptyState icon={Clock} title="No activity yet" text="Calls, emails, imports, research, meetings, and team actions will appear here once your team starts working." />;
  }
  return (
    <div className="timeline">
      {filtered.map(item => (
        <div key={item.id || `${item.title}-${item.time}`} className="timeline-item">
          <span />
          <div>
            <strong>{item.title}</strong>
            <small>{item.type} - {item.account} - {item.time} - {item.owner}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecordName({ name, meta }) {
  return (
    <div className="record-name">
      <span className="record-avatar">{accountInitial(name)}</span>
      <div>
        <strong>{name}</strong>
        <small>{meta}</small>
      </div>
    </div>
  );
}

function DataTable({ columns, rows, rowActions = [] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>{columns.map(column => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={rowActions[index] ? "clickable-row" : undefined}
              onClick={rowActions[index]}
              tabIndex={rowActions[index] ? 0 : undefined}
              onKeyDown={event => {
                if (!rowActions[index] || !["Enter", " "].includes(event.key)) return;
                event.preventDefault();
                rowActions[index]();
              }}
            >
              {row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div className="empty-state">
      {createElement(icon, { size: 28 })}
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}

async function ensureWorkspace(user) {
  if (!supabase || !user) return;
  if (!isAllowedEmail(user.email)) {
    throw new Error(`Only @${ALLOWED_EMAIL_DOMAIN} email addresses can access this CRM.`);
  }
  const { data, error } = await supabase.rpc("bootstrap_current_user", {
    user_email: user.email,
    user_display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Workspace user",
  });

  if (error) throw error;
  return data;
}

function AuthPanel({ initialMode = "signin", onAuthenticate }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canSubmit = email.trim().length > 3 && password.trim().length >= 6;

  async function submit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!isAllowedEmail(normalizedEmail)) {
      setError(`Use your @${ALLOWED_EMAIL_DOMAIN} email address to access PaceOps/CRM.`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (!supabase) throw new Error("Authentication is not configured yet.");
      const credentials = { email: normalizedEmail, password };
      const { data, error: authError } = mode === "signin"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);
      if (authError) throw authError;
      if (mode === "signup" && !data.session) {
        setError("Check your email to confirm your account, then sign in.");
        return;
      }
      const user = data.user || data.session?.user;
      if (!user) {
        setError("Check your email to confirm your account, then sign in.");
        return;
      }
      await ensureWorkspace(user);
      onAuthenticate(user);
    } catch (authError) {
      const message = String(authError?.message || "").toLowerCase();
      if (message.includes("invalid login")) setError("Email or password is incorrect.");
      else if (message.includes("already registered")) setError("An account already exists for that email.");
      else if (message.includes("failed to fetch")) setError("Could not connect to Supabase. Check the project URL and keys.");
      else setError(authError?.message || "Could not complete authentication.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-panel auth-card">
          <div className="auth-brand">
            <img src={logoUrl} alt="PaceOps" />
            <div>
              <strong>PaceOps/CRM</strong>
              <span>Prospecting workspace</span>
            </div>
          </div>

          <div className="auth-copy">
            <span className="eyebrow">Workspace access</span>
            <h1>{mode === "signin" ? "Open your workspace" : "Create a workspace"}</h1>
            <p>Manage clients, campaigns, accounts, contacts, calls, and research from one PaceOps operating system.</p>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
              <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>
                Sign in
              </button>
              <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
                Create account
              </button>
            </div>

            <label>
              Work email
              <span>
                <Mail size={16} />
                <input
                  value={email}
                  type="email"
                  autoComplete="email"
                  placeholder={`name@${ALLOWED_EMAIL_DOMAIN}`}
                  onChange={event => setEmail(event.target.value)}
                />
              </span>
            </label>

            <label>
              Password
              <span>
                <LockKeyhole size={16} />
                <input
                  value={password}
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  placeholder="Minimum 6 characters"
                  onChange={event => setPassword(event.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </span>
            </label>

            {error && <div className="auth-error">{error}</div>}

            <button className="primary-button auth-submit" type="submit" disabled={!canSubmit}>
              <LogIn size={16} />
              {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
    </section>
  );
}

function HomePage({ isDark, onThemeToggle, onAuthenticate }) {
  const [authMode, setAuthMode] = useState("signin");

  return (
    <div className={`auth-app marketing-app ${isDark ? "dark" : "light"}`}>
      <header className="marketing-nav">
        <a className="marketing-brand" href="#top">
          <img src={logoUrl} alt="PaceOps" />
          <span>PaceOps/CRM</span>
        </a>
        <nav>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>
        <div>
          <a className="phone-pill" href="tel:+448438092108">+44 (0) 8438092108</a>
          <button className="secondary-button" type="button" onClick={onThemeToggle}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a className="primary-button" href="#auth" onClick={() => setAuthMode("signin")}>Sign in</a>
        </div>
      </header>

      <main id="top" className="marketing-shell">
        <section className="home-single-page">
          <div id="about" className="company-summary">
            <span className="eyebrow">PaceOps/CRM</span>
            <h1>Client account management for PaceOps teams.</h1>
            <p>PaceOps is a professional services prospecting hub focused on human-personalised outreach, data-driven insight, and sales development operations.</p>
            <p>PaceOps/CRM is the internal workspace for managing clients, campaigns, accounts, contacts, calls, research, and pipeline activity.</p>

            <div id="contact" className="contact-card">
              <h2>Contact</h2>
              <div className="contact-list">
                <a href="tel:+448438092108">+44 (0) 8438092108</a>
                <a href="tel:+3530216017406">+353 (0) 21 601 7406</a>
                <a href="tel:+12159953839">+1 215 995 3839</a>
                <a href="mailto:enquiries@paceops.com">enquiries@paceops.com</a>
              </div>
              <div className="address-list">
                <p><strong>UK</strong> The Bradfield Centre, Cambridge Science Park, Cambridge, CB4 0GA</p>
                <p><strong>Ireland</strong> The Guinness Enterprise Centre, Taylor's Lane, Dublin, D08 ET2R</p>
                <p><strong>US</strong> 1442 Pottstown Pike, Unit 3242, West Chester, PA 19380</p>
              </div>
            </div>
          </div>

          <div id="auth" className="home-auth">
            <AuthPanel key={authMode} initialMode={authMode} onAuthenticate={onAuthenticate} />
          </div>
        </section>
      </main>
    </div>
  );
}

function RightDrawer({ open, activeView, selectedAccount, activeCampaign }) {
  if (!open) return null;

  return (
    <aside className="right-drawer">
      <div className="drawer-head">
        <span className="assistant-mark"><Bot size={15} /></span>
        <div>
          <strong>AI research assistant</strong>
          <small>Workflow guidance</small>
        </div>
      </div>
      <section>
        <span className="eyebrow">Context</span>
        <h2>{selectedAccount?.name || activeCampaign.name}</h2>
        <p>{selectedAccount?.insight || activeCampaign.nextAction}</p>
      </section>
      <section>
        <span className="eyebrow">Suggested next step</span>
        <div className="drawer-task">
          <CheckCircle2 size={16} />
          <span>{selectedAccount?.nextAction || "Review campaign accounts before the next call block"}</span>
        </div>
      </section>
      <section>
        <span className="eyebrow">Data gaps</span>
        <ul className="drawer-list">
          <li>Confirm buying committee roles</li>
          <li>Validate current CRM ownership</li>
          <li>Map product, UX, and design stakeholders</li>
        </ul>
      </section>
      <section>
        <span className="eyebrow">Current page</span>
        <p>{activeView.replace("-", " ")}</p>
      </section>
    </aside>
  );
}

function FormField({ label, children }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

const clientWorkspaceOptions = [
  "Prospecting workspace",
  "Sales workspace",
  "Strategic account workspace",
  "Enterprise account workspace",
  "Client workspace",
  "Professional services workspace",
  "Agency workspace",
  "Account management workspace",
  "Customer success workspace",
  "Research workspace",
];

const clientIndustryOptions = [
  "Technology",
  "SaaS",
  "Payments",
  "Financial technology",
  "Cloud infrastructure",
  "Advertising technology",
  "Professional services",
  "UX consultancy",
  "Product design",
  "Design agency",
  "B2B services",
  "Financial services",
  "Healthcare",
];

function getWorkflowInitialValues(workflow, activeClientId, selectedAccountId, selectedContactId, data) {
  const context = workflow?.context || {};
  if (context.record) return { ...context.record };
  const accountId = context.accountId || selectedAccountId || data.accounts[0]?.id || "";
  const account = data.accounts.find(item => item.id === accountId);
  const contactId = context.contactId || selectedContactId || data.contacts.find(item => item.accountId === accountId)?.id || data.contacts[0]?.id || "";
  const clientId = context.clientId || account?.clientId || activeClientId || data.clients[0]?.id || "";

  switch (workflow.type) {
    case "client":
      return { name: "", workspace: "Prospecting workspace", owner: "Workspace user", industry: "", website: "" };
    case "campaign":
      return { clientId, name: "", channel: "Research-led outbound", status: "draft", nextAction: "Define account focus and first call block", memberIds: [] };
    case "account":
      return { clientId, name: "", domain: "", industry: "", location: "", employees: "", value: "0", stage: data.pipelineStages?.[0]?.name || "Lead In", status: "New", nextAction: "Map buying committee", insight: "" };
    case "contact":
      return { accountId, name: "", role: "", persona: "Product leadership", email: "", phone: "", mobile: "", status: "New" };
    case "deal":
      return { accountId, contactId, stage: "lead", value: "0", due: "Today", owner: "Workspace user" };
    case "call":
      return { contactId, outcome: "Connected", notes: "" };
    case "research":
      return { accountId, title: "Account research brief", summary: "", dataGap: "Buying committee validation" };
    case "file":
      return { name: "", source: "CSV import", objectType: "accounts", rows: "0" };
    case "team":
      return { name: "", role: "Team member", status: "Invited" };
    case "email":
      return { contactId, subject: "Follow-up", body: "" };
    case "audit":
      return { note: "Review who can connect integrations and where activity is logged." };
    default:
      return {};
  }
}

function getWorkflowTitle(type) {
  if (type?.startsWith("edit-")) {
    return `Edit ${type.replace("edit-", "").replace("-", " ")}`;
  }

  return {
    client: "New client",
    campaign: "New campaign",
    account: "Add account",
    contact: "Add contact",
    deal: "New deal",
    call: "Log call outcome",
    research: "Queue research",
    file: "Add source file",
    team: "Invite teammate",
    email: "Draft email",
    audit: "Audit model",
  }[type] || "CRM workflow";
}

function getWorkflowPrerequisite(type, data) {
  if (["campaign", "account"].includes(type) && !data.clients.length) {
    return { message: "Create a client first. Campaigns and accounts belong inside a client workspace.", nextType: "client", nextLabel: "Create client" };
  }
  if (["contact", "deal", "research"].includes(type) && !data.accounts.length) {
    return { message: "Add an account first. Contacts, deals, and research need an account to attach to.", nextType: data.clients.length ? "account" : "client", nextLabel: data.clients.length ? "Add account" : "Create client" };
  }
  if (["call", "email"].includes(type) && !data.contacts.length) {
    return { message: "Add a contact first. Calls and email drafts need a contact record.", nextType: data.accounts.length ? "contact" : data.clients.length ? "account" : "client", nextLabel: data.accounts.length ? "Add contact" : data.clients.length ? "Add account" : "Create client" };
  }
  return null;
}

function WorkflowModal({
  workflow,
  activeClientId,
  selectedAccountId,
  selectedContactId,
  onClose,
  onSubmit,
  onSwitchWorkflow,
}) {
  const data = useCrmData();
  const pipelineStages = data.pipelineStages || pipelineColumns;
  const [values, setValues] = useState(() => getWorkflowInitialValues(workflow, activeClientId, selectedAccountId, selectedContactId, data));
  const [companyLookupEnabled, setCompanyLookupEnabled] = useState(false);
  const [companyLookupStatus, setCompanyLookupStatus] = useState("idle");
  const [clientTouchedFields, setClientTouchedFields] = useState({ workspace: false, industry: false, website: false });
  const [accountLookupEnabled, setAccountLookupEnabled] = useState(false);
  const [accountLookupStatus, setAccountLookupStatus] = useState("idle");
  const [accountScriptStatus, setAccountScriptStatus] = useState("idle");
  const [accountTouchedFields, setAccountTouchedFields] = useState({
    domain: false,
    industry: false,
    location: false,
    employees: false,
    nextAction: false,
    insight: false,
  });
  const prerequisite = getWorkflowPrerequisite(workflow.type, data);

  function update(field, value, options = {}) {
    if (workflow.type === "client" && options.markTouched) {
      setClientTouchedFields(current => ({ ...current, [field]: true }));
    }
    if (workflow.type === "account" && options.markTouched) {
      setAccountTouchedFields(current => ({ ...current, [field]: true }));
    }
    setValues(current => ({ ...current, [field]: value }));
  }

  async function runCompanyLookup() {
    if (!companyLookupEnabled || values.name.trim().length < 2 || companyLookupStatus === "loading") return;
    setCompanyLookupStatus("loading");
    try {
      const response = await fetch("/api/client-suggestions", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({ name: values.name }),
      });
      const suggestions = await response.json();
      if (!response.ok) throw new Error(suggestions.error || "Company lookup failed");
      setValues(current => ({
        ...current,
        workspace: clientTouchedFields.workspace ? current.workspace : suggestions.workspace || current.workspace,
        industry: clientTouchedFields.industry ? current.industry : suggestions.industry || current.industry,
        website: clientTouchedFields.website ? current.website : suggestions.website || current.website,
      }));
      setCompanyLookupStatus(suggestions.source === "web_search" ? "found" : "fallback");
    } catch {
      setCompanyLookupStatus("failed");
    }
  }

  async function runAccountLookup() {
    if (!accountLookupEnabled || values.name.trim().length < 2 || accountLookupStatus === "loading") return;
    const clientName = data.clients.find(client => client.id === values.clientId)?.name || "";
    setAccountLookupStatus("loading");
    try {
      const response = await fetch("/api/account-suggestions", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({ name: values.name, clientName }),
      });
      const suggestions = await response.json();
      if (!response.ok) throw new Error(suggestions.error || "Account lookup failed");
      setValues(current => ({
        ...current,
        domain: accountTouchedFields.domain ? current.domain : suggestions.domain || current.domain,
        industry: accountTouchedFields.industry ? current.industry : suggestions.industry || current.industry,
        location: accountTouchedFields.location ? current.location : suggestions.location || current.location,
        employees: accountTouchedFields.employees ? current.employees : suggestions.employees || current.employees,
        nextAction: accountTouchedFields.nextAction ? current.nextAction : suggestions.nextAction || current.nextAction,
        insight: accountTouchedFields.insight ? current.insight : suggestions.insight || current.insight,
        evidence: suggestions.evidence || current.evidence || [],
      }));
      setAccountLookupStatus(["web_search", "openai_web"].includes(suggestions.source) ? "found" : "fallback");
    } catch {
      setAccountLookupStatus("failed");
    }
  }

  async function runAccountScriptGeneration() {
    if (!accountLookupEnabled || values.name.trim().length < 2 || accountScriptStatus === "loading") return;
    setAccountScriptStatus("loading");
    try {
      const response = await fetch("/api/account-scripts", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify(values),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Script generation failed");
      setValues(current => ({ ...current, scripts: payload.scripts || current.scripts }));
      setAccountScriptStatus(payload.mode === "openai" ? "found" : "fallback");
    } catch {
      setAccountScriptStatus("failed");
    }
  }

  function submit(event) {
    event.preventDefault();
    if (prerequisite) return;
    onSubmit(workflow.type, values, workflow.context || {});
  }

  function accountOptions() {
    return data.accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>);
  }

  function contactOptions() {
    const filtered = values.accountId ? data.contacts.filter(contact => contact.accountId === values.accountId) : data.contacts;
    const options = filtered.length ? filtered : data.contacts;
    return options.map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>);
  }

  function renderFields() {
    const fieldType = workflow.type.startsWith("edit-") ? workflow.type.replace("edit-", "") : workflow.type;

    switch (fieldType) {
      case "client":
        return (
          <>
            <datalist id="client-workspace-options">
              {clientWorkspaceOptions.map(option => <option key={option} value={option} />)}
            </datalist>
            <datalist id="client-industry-options">
              {clientIndustryOptions.map(option => <option key={option} value={option} />)}
            </datalist>
            <FormField label="Client name">
              <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="Company name" />
            </FormField>
            <label className="company-lookup-toggle">
              <span>
                <Sparkles size={16} />
                Enable company lookup
              </span>
              <input
                type="checkbox"
                checked={companyLookupEnabled}
                onChange={event => {
                  setCompanyLookupEnabled(event.target.checked);
                  setCompanyLookupStatus("idle");
                }}
              />
            </label>
            {companyLookupEnabled && (
              <button className="secondary-button lookup-button" type="button" onClick={runCompanyLookup} disabled={values.name.trim().length < 2 || companyLookupStatus === "loading"}>
                <Search size={16} />
                {companyLookupStatus === "loading" ? "Searching..." : "Find details"}
              </button>
            )}
            {companyLookupEnabled && companyLookupStatus !== "idle" && (
              <div className={`lookup-status ${companyLookupStatus}`}>
                {companyLookupStatus === "loading" && "Searching web..."}
                {companyLookupStatus === "found" && "Details found from web search."}
                {companyLookupStatus === "fallback" && "Used a best-effort suggestion."}
                {companyLookupStatus === "failed" && "Could not search right now."}
              </div>
            )}
            <FormField label="Workspace">
              <input list="client-workspace-options" value={values.workspace} onChange={event => update("workspace", event.target.value, { markTouched: true })} placeholder="Strategic account workspace" />
            </FormField>
            <FormField label="Industry">
              <input list="client-industry-options" value={values.industry} onChange={event => update("industry", event.target.value, { markTouched: true })} placeholder="Technology, payments, UX consultancy" />
            </FormField>
            <FormField label="Website">
              <input value={values.website} onChange={event => update("website", event.target.value, { markTouched: true })} placeholder="https://company.com" />
            </FormField>
          </>
        );
      case "campaign":
        return (
          <>
            <FormField label="Client">
              <select value={values.clientId} onChange={event => update("clientId", event.target.value)}>
                {data.clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </FormField>
            <FormField label="Campaign name">
              <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="Priority account campaign" />
            </FormField>
            <FormField label="Channel">
              <input value={values.channel} onChange={event => update("channel", event.target.value)} placeholder="Email and calls" />
            </FormField>
            <FormField label="Status">
              <select value={values.status} onChange={event => update("status", event.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </FormField>
            <FormField label="Next action">
              <input value={values.nextAction} onChange={event => update("nextAction", event.target.value)} placeholder="Define target account list" />
            </FormField>
            <FormField label="Campaign users">
              <select
                multiple
                value={Array.isArray(values.memberIds) ? values.memberIds : []}
                onChange={event => update("memberIds", Array.from(event.target.selectedOptions, option => option.value))}
              >
                {(data.workspaceUsers || []).map(workspaceUser => (
                  <option key={workspaceUser.id} value={workspaceUser.id}>{workspaceUser.name} - {workspaceUser.email}</option>
                ))}
              </select>
            </FormField>
          </>
        );
      case "account":
        return (
          <>
            <FormField label="Client">
              <select value={values.clientId} onChange={event => update("clientId", event.target.value)}>
                {data.clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </FormField>
            <FormField label="Account name">
              <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="Account name" />
            </FormField>
            <label className="company-lookup-toggle">
              <span>
                <Sparkles size={16} />
                Enable account intelligence
              </span>
              <input
                type="checkbox"
                checked={accountLookupEnabled}
                onChange={event => {
                  setAccountLookupEnabled(event.target.checked);
                  setAccountLookupStatus("idle");
                  setAccountScriptStatus("idle");
                }}
              />
            </label>
            {accountLookupEnabled && (
              <div className="lookup-actions">
                <button className="secondary-button lookup-button" type="button" onClick={runAccountLookup} disabled={values.name.trim().length < 2 || accountLookupStatus === "loading"}>
                  <Search size={16} />
                  {accountLookupStatus === "loading" ? "Searching..." : "Find details"}
                </button>
                <button className="secondary-button lookup-button" type="button" onClick={runAccountScriptGeneration} disabled={values.name.trim().length < 2 || accountScriptStatus === "loading"}>
                  <Sparkles size={16} />
                  {accountScriptStatus === "loading" ? "Writing..." : "Build scripts"}
                </button>
              </div>
            )}
            {accountLookupEnabled && accountLookupStatus !== "idle" && (
              <div className={`lookup-status ${accountLookupStatus}`}>
                {accountLookupStatus === "loading" && "Searching web..."}
                {accountLookupStatus === "found" && "Details found from web lookup."}
                {accountLookupStatus === "fallback" && "Web lookup unavailable. Filled only safe guesses."}
                {accountLookupStatus === "failed" && "Could not search right now."}
              </div>
            )}
            {accountLookupEnabled && accountScriptStatus !== "idle" && (
              <div className={`lookup-status ${accountScriptStatus}`}>
                {accountScriptStatus === "loading" && "Generating scripts..."}
                {accountScriptStatus === "found" && "Scripts generated with GPT."}
                {accountScriptStatus === "fallback" && "Used backup script templates."}
                {accountScriptStatus === "failed" && "Could not generate scripts right now."}
              </div>
            )}
            <FormField label="Domain">
              <input value={values.domain} onChange={event => update("domain", event.target.value, { markTouched: true })} placeholder="company.com" />
            </FormField>
            <FormField label="Industry">
              <input value={values.industry} onChange={event => update("industry", event.target.value, { markTouched: true })} placeholder="Technology" />
            </FormField>
            <FormField label="Location">
              <input value={values.location} onChange={event => update("location", event.target.value, { markTouched: true })} placeholder="United Kingdom" />
            </FormField>
            <FormField label="Employees">
              <input value={values.employees} onChange={event => update("employees", event.target.value, { markTouched: true })} placeholder="Employee range" />
            </FormField>
            <FormField label="Pipeline value">
              <input type="number" min="0" value={values.value} onChange={event => update("value", event.target.value)} />
            </FormField>
            <FormField label="Stage">
              <select value={values.stage} onChange={event => update("stage", event.target.value)}>
                {pipelineStages.map(column => <option key={column.id} value={column.name}>{column.name}</option>)}
              </select>
            </FormField>
            <FormField label="Next action">
              <input value={values.nextAction} onChange={event => update("nextAction", event.target.value, { markTouched: true })} placeholder="Map buying committee" />
            </FormField>
            <FormField label="Research signal">
              <textarea value={values.insight} onChange={event => update("insight", event.target.value, { markTouched: true })} placeholder="What makes this account relevant?" />
            </FormField>
            {values.scripts && (
              <section className="script-preview">
                <div>
                  <span>Call opener</span>
                  <p>{values.scripts.callOpener}</p>
                </div>
                <div>
                  <span>Email</span>
                  <p><strong>{values.scripts.emailSubject}</strong></p>
                  <p>{values.scripts.emailBody}</p>
                </div>
                <div>
                  <span>Voicemail</span>
                  <p>{values.scripts.voicemail}</p>
                </div>
                <div>
                  <span>LinkedIn note</span>
                  <p>{values.scripts.linkedinNote}</p>
                </div>
              </section>
            )}
          </>
        );
      case "contact":
        return (
          <>
            <FormField label="Account">
              <select value={values.accountId} onChange={event => update("accountId", event.target.value)}>
                {accountOptions()}
              </select>
            </FormField>
            <FormField label="Contact name">
              <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="Contact name" />
            </FormField>
            <FormField label="Role">
              <input value={values.role} onChange={event => update("role", event.target.value)} placeholder="Head of Product" />
            </FormField>
            <FormField label="Persona">
              <input value={values.persona} onChange={event => update("persona", event.target.value)} placeholder="Product leadership" />
            </FormField>
            <FormField label="Email">
              <input type="email" value={values.email} onChange={event => update("email", event.target.value)} placeholder="name@company.com" />
            </FormField>
            <FormField label="Phone">
              <input value={values.phone} onChange={event => update("phone", event.target.value)} placeholder="+44..." />
            </FormField>
            <FormField label="Mobile">
              <input value={values.mobile} onChange={event => update("mobile", event.target.value)} placeholder="+44..." />
            </FormField>
          </>
        );
      case "deal":
        return (
          <>
            <FormField label="Account">
              <select value={values.accountId} onChange={event => update("accountId", event.target.value)}>
                {accountOptions()}
              </select>
            </FormField>
            <FormField label="Primary contact">
              <select value={values.contactId} onChange={event => update("contactId", event.target.value)}>
                <option value="">No primary contact</option>
                {contactOptions()}
              </select>
            </FormField>
            <FormField label="Stage">
              <select value={values.stage} onChange={event => update("stage", event.target.value)}>
                {pipelineStages.map(column => <option key={column.id} value={column.id}>{column.name}</option>)}
              </select>
            </FormField>
            <FormField label="Value">
              <input type="number" min="0" value={values.value} onChange={event => update("value", event.target.value)} />
            </FormField>
            <FormField label="Due">
              <input value={values.due} onChange={event => update("due", event.target.value)} placeholder="Today" />
            </FormField>
          </>
        );
      case "call":
        return (
          <>
            <FormField label="Contact">
              <select value={values.contactId} onChange={event => update("contactId", event.target.value)}>
                {data.contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
              </select>
            </FormField>
            <FormField label="Outcome">
              <select value={values.outcome} onChange={event => update("outcome", event.target.value)}>
                {callOutcomes.map(outcome => <option key={outcome}>{outcome}</option>)}
              </select>
            </FormField>
            <FormField label="Notes">
              <textarea value={values.notes} onChange={event => update("notes", event.target.value)} placeholder="Notes, objections, next step" />
            </FormField>
          </>
        );
      case "research":
        return (
          <>
            <FormField label="Account">
              <select value={values.accountId} onChange={event => update("accountId", event.target.value)}>
                {accountOptions()}
              </select>
            </FormField>
            <FormField label="Research title">
              <input value={values.title} onChange={event => update("title", event.target.value)} />
            </FormField>
            <FormField label="Summary">
              <textarea value={values.summary} onChange={event => update("summary", event.target.value)} placeholder="Summarise the research angle or question" />
            </FormField>
            <FormField label="Data gap">
              <input value={values.dataGap} onChange={event => update("dataGap", event.target.value)} placeholder="Buying committee validation" />
            </FormField>
          </>
        );
      case "file":
        return (
          <>
            <FormField label="File name">
              <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="target-accounts.csv" />
            </FormField>
            <FormField label="Source">
              <select value={values.source} onChange={event => update("source", event.target.value)}>
                <option>CSV import</option>
                <option>Research pack</option>
                <option>Call notes</option>
              </select>
            </FormField>
            <FormField label="Record type">
              <select value={values.objectType} onChange={event => update("objectType", event.target.value)}>
                <option value="accounts">Accounts</option>
                <option value="contacts">Contacts</option>
                <option value="research">Research</option>
              </select>
            </FormField>
            <FormField label="Rows">
              <input type="number" min="0" value={values.rows} onChange={event => update("rows", event.target.value)} />
            </FormField>
          </>
        );
      case "team":
        return (
          <>
            <FormField label="Name">
              <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="Team member name" />
            </FormField>
            <FormField label="Role">
              <input value={values.role} onChange={event => update("role", event.target.value)} placeholder="Account lead" />
            </FormField>
            <FormField label="Status">
              <select value={values.status} onChange={event => update("status", event.target.value)}>
                <option>Invited</option>
                <option>Online</option>
                <option>In call block</option>
              </select>
            </FormField>
          </>
        );
      case "email":
        return (
          <>
            <FormField label="Contact">
              <select value={values.contactId} onChange={event => update("contactId", event.target.value)}>
                {data.contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
              </select>
            </FormField>
            <FormField label="Subject">
              <input value={values.subject} onChange={event => update("subject", event.target.value)} />
            </FormField>
            <FormField label="Draft notes">
              <textarea value={values.body} onChange={event => update("body", event.target.value)} placeholder="Key message points" />
            </FormField>
          </>
        );
      case "audit":
        return (
          <FormField label="Note">
            <textarea value={values.note} onChange={event => update("note", event.target.value)} />
          </FormField>
        );
      default:
        return null;
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <form className="workflow-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Workflow</span>
            <h2>{getWorkflowTitle(workflow.type)}</h2>
          </div>
          <button className="icon-action" type="button" onClick={onClose} aria-label="Close workflow">x</button>
        </div>

        {prerequisite ? (
          <div className="modal-prerequisite">
            <p>{prerequisite.message}</p>
            <button className="primary-button" type="button" onClick={() => onSwitchWorkflow(prerequisite.nextType)}>
              {prerequisite.nextLabel}
            </button>
          </div>
        ) : (
          <div className="modal-fields">
            {renderFields()}
          </div>
        )}

        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-button" type="submit" disabled={Boolean(prerequisite)}>
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [authReady, setAuthReady] = useState(() => !supabase);
  const [user, setUser] = useState(null);
  const [crmData, setCrmData] = useState(() => createInitialCrmData());
  const [dataUserId, setDataUserId] = useState(null);
  const [dataOrgId, setDataOrgId] = useState(null);
  const [crmSyncReady, setCrmSyncReady] = useState(false);
  const [leadLists, setLeadLists] = useState([]);
  const [leadListsError, setLeadListsError] = useState("");
  const [leadContactDatabase, setLeadContactDatabase] = useState([]);
  const [integrationCredentials, setIntegrationCredentials] = useState({ providers: {} });
  const [activeView, setActiveView] = useState("dashboard");
  const [activeClientId, setActiveClientId] = useState("each-other");
  const [activeCampaignId, setActiveCampaignId] = useState("priority-targeting");
  const [selectedAccountId, setSelectedAccountId] = useState("account-01");
  const [selectedContactId, setSelectedContactId] = useState("contact-01");
  const [viewHistory, setViewHistory] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(() => localStorage.getItem("paceops.drawerOpen") === "true");
  const [search, setSearch] = useState("");
  const [workflow, setWorkflow] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const lastSyncedCrmJsonRef = useRef("");

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        handleAuthenticatedUser(data.session.user);
        return;
      }
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleAuthenticatedUser(session.user);
        setLoggingOut(false);
        return;
      }
      lastSyncedCrmJsonRef.current = "";
      setCrmData(createInitialCrmData());
      setDataUserId(null);
      setDataOrgId(null);
      setCrmSyncReady(false);
      setLeadLists([]);
      setLeadListsError("");
      setLeadContactDatabase([]);
      setIntegrationCredentials({ providers: {} });
      setUser(null);
      setAuthReady(true);
      setLoggingOut(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!crmSyncReady || !dataOrgId || !user?.id || dataUserId !== user.id) return undefined;

    const nextJson = JSON.stringify(serializeCrmData(crmData));
    if (nextJson === lastSyncedCrmJsonRef.current) return undefined;

    const timer = window.setTimeout(() => {
      lastSyncedCrmJsonRef.current = nextJson;
      saveCrmData(user.id, crmData);
      saveSyncedCrmData(dataOrgId, crmData).catch(error => {
        lastSyncedCrmJsonRef.current = "";
        console.error("Could not sync CRM data to Supabase", error);
      });
    }, 450);

    return () => window.clearTimeout(timer);
  }, [crmData, crmSyncReady, dataOrgId, dataUserId, user?.id]);

  useEffect(() => {
    if (!supabase || !dataOrgId) return undefined;

    const channel = supabase
      .channel(`crm-data:${dataOrgId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "organizations", filter: `id=eq.${dataOrgId}` },
        payload => {
          const syncedData = payload.new?.metadata?.[CRM_DATA_METADATA_KEY];
          if (!syncedData || typeof syncedData !== "object") return;
          const nextData = refreshCrmData(normalizeCrmData(syncedData));
          const nextJson = JSON.stringify(serializeCrmData(nextData));
          if (nextJson === lastSyncedCrmJsonRef.current) return;
          lastSyncedCrmJsonRef.current = nextJson;
          setCrmData(current => ({
            ...nextData,
            workspaceUsers: current.workspaceUsers || [],
          }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dataOrgId]);

  useEffect(() => {
    if (!user?.id || dataUserId !== user.id) return;
    saveUiState(user.id, {
      activeView,
      activeClientId,
      activeCampaignId,
      selectedAccountId,
      selectedContactId,
    });
  }, [activeCampaignId, activeClientId, activeView, dataUserId, selectedAccountId, selectedContactId, user?.id]);

  useEffect(() => {
    localStorage.setItem("paceops.drawerOpen", drawerOpen ? "true" : "false");
  }, [drawerOpen]);

  async function handleAuthenticatedUser(nextUser) {
    setCrmSyncReady(false);
    try {
      const organizationId = await ensureWorkspace(nextUser);
      const currentWorkspaceUser = mapAuthUserToWorkspaceUser(nextUser);
      const [syncedCrmData, workspaceUsers, nextLeadLists, nextLeadContactDatabase] = await Promise.all([
        loadSyncedCrmData(nextUser.id, organizationId),
        loadWorkspaceUsers(organizationId),
        loadLeadLists(organizationId).catch(error => {
          console.error("Could not load lead lists", error);
          setLeadListsError(error.message || "Could not load lead lists.");
          return [];
        }),
        loadLeadContactDatabase(organizationId).catch(error => {
          console.error("Could not load Lead Finder contact database", error);
          setLeadListsError(error.message || "Could not load Lead Finder contact database.");
          return [];
        }),
      ]);
      const nextCrmData = {
        ...refreshCrmData(syncedCrmData),
        workspaceUsers: mergeWorkspaceUsers(workspaceUsers, currentWorkspaceUser),
      };
      lastSyncedCrmJsonRef.current = JSON.stringify(serializeCrmData(nextCrmData));
      setCrmData(nextCrmData);
      setLeadLists(nextLeadLists);
      setLeadContactDatabase(nextLeadContactDatabase);
      loadIntegrationCredentialsStatus().catch(error => {
        console.error("Could not load integration credential status", error);
      });
      const isFirstAuthenticatedLoad = !hasSavedUiState(nextUser.id);
      if (isFirstAuthenticatedLoad) {
        setActiveView("dashboard");
        setSelectedAccountId(null);
        setSelectedContactId(null);
      } else {
        const uiState = loadUiState(nextUser.id);
        if (uiState.activeView) setActiveView(uiState.activeView);
        if (uiState.activeClientId) setActiveClientId(uiState.activeClientId);
        if (uiState.activeCampaignId) setActiveCampaignId(uiState.activeCampaignId);
        if (uiState.selectedAccountId) setSelectedAccountId(uiState.selectedAccountId);
        if (uiState.selectedContactId) setSelectedContactId(uiState.selectedContactId);
      }
      setDataOrgId(organizationId);
      setDataUserId(nextUser.id);
      setUser(nextUser);
      setCrmSyncReady(true);
      setLeadListsError("");
    } catch (error) {
      console.error("Could not load synced CRM data", error);
      const localData = refreshCrmData(loadCrmData(nextUser.id));
      lastSyncedCrmJsonRef.current = JSON.stringify(serializeCrmData(localData));
      setCrmData({ ...localData, workspaceUsers: mergeWorkspaceUsers([], mapAuthUserToWorkspaceUser(nextUser)) });
      setDataOrgId(null);
      setLeadLists([]);
      setLeadContactDatabase([]);
      setIntegrationCredentials({ providers: {} });
      setDataUserId(nextUser.id);
      setUser(nextUser);
    } finally {
      setAuthReady(true);
      setLoggingOut(false);
    }
  }

  async function handleUpdateProfile({ firstName, lastName }) {
    if (!supabase) throw new Error("Authentication is not configured yet.");
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const { data, error } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
      },
    });
    if (error) throw error;
    if (data.user) setUser(data.user);
  }

  async function loadIntegrationCredentialsStatus() {
    const response = await fetch("/api/integration-settings", {
      method: "GET",
      headers: await buildApiHeaders(),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not load integration settings.");
    setIntegrationCredentials(payload);
    return payload;
  }

  async function handleSaveIntegrationCredentials(provider, values) {
    const response = await fetch("/api/integration-settings", {
      method: "POST",
      headers: await buildApiHeaders(),
      body: JSON.stringify({ provider, values }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not save integration settings.");
    setIntegrationCredentials(current => ({
      providers: {
        ...(current.providers || {}),
        [provider]: payload,
      },
    }));
    return payload;
  }

  async function getLeadContactSaveContext() {
    if (!supabase) throw new Error("Authentication is not configured yet.");

    let currentUser = user;
    if (!currentUser?.id) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
      if (sessionError) throw sessionError;
      currentUser = sessionData.user;
      if (currentUser) setUser(currentUser);
    }

    if (!currentUser?.id) throw new Error("Sign in before saving lead data.");

    let organizationId = dataOrgId;
    if (!organizationId) {
      organizationId = await ensureWorkspace(currentUser);
      if (organizationId) {
        setDataOrgId(organizationId);
        setDataUserId(currentUser.id);
      }
    }

    if (!organizationId) throw new Error("Workspace is not ready yet. Refresh and try saving again.");
    return { currentUser, organizationId };
  }

  async function handleUpsertLeadContact(lead, options = {}) {
    const validationError = validateLeadManualFields(lead);
    if (validationError) throw new Error(validationError);
    if (!leadHasPaceOpsData(lead) && lead.dataSource !== "manual" && !options.allowPreviewOnly) throw new Error("Add an email, mobile, LinkedIn URL, or note before saving to PaceOps DB.");

    const conflicts = findPotentialContactConflicts(lead, leadContactDatabase);
    if (conflicts.length && !options.skipConflictPrompt) {
      const conflictNames = conflicts.map(contact => contact.contactName || contact.company || contact.id).join(", ");
      const confirmed = window.confirm(`Another PaceOps DB contact already has the same LinkedIn URL, email, or mobile (${conflictNames}). Continue only if this is the same person or intentionally different.`);
      if (!confirmed) throw new Error("Save cancelled.");
    }

    const { currentUser, organizationId } = await getLeadContactSaveContext();
    const payload = buildLeadContactDatabasePayload(lead, organizationId, currentUser.id);
    const updatePayload = { ...payload };
    delete updatePayload.id;
    delete updatePayload.created_by;
    const query = lead.dbContactId
      ? supabase
        .from("lead_contact_database")
        .update(updatePayload)
        .eq("id", lead.dbContactId)
        .eq("organization_id", organizationId)
      : supabase
        .from("lead_contact_database")
        .upsert(payload, { onConflict: "organization_id,normalized_identity_key" });
    const { data, error } = await query.select("*").single();

    if (error) throw error;
    const savedContact = mapContactDatabaseRecord(data);
    setLeadContactDatabase(current => [savedContact, ...current.filter(contact => contact.id !== savedContact.id && contact.normalizedIdentityKey !== savedContact.normalizedIdentityKey)]);
    return savedContact;
  }

  async function handlePersistSearchResults(leads) {
    const previewLeads = (leads || []).filter(lead => normalizeLookupValue(lead.cognismContactId) || normalizeLookupValue(lead.contactName));
    if (!previewLeads.length) return [];

    const { currentUser, organizationId } = await getLeadContactSaveContext();
    const payloadsByIdentity = new Map();

    for (const lead of previewLeads) {
      const existingContact = findLeadDatabaseMatch(lead, leadContactDatabase);
      const payload = buildPreviewContactDatabasePayload(lead, organizationId, currentUser.id, existingContact);
      payloadsByIdentity.set(payload.normalized_identity_key, payload);
    }

    const payloads = [...payloadsByIdentity.values()];
    const { data, error } = await supabase
      .from("lead_contact_database")
      .upsert(payloads, { onConflict: "organization_id,normalized_identity_key" })
      .select("*");

    if (error) throw error;
    const savedContacts = (data || []).map(mapContactDatabaseRecord);
    setLeadContactDatabase(current => [
      ...savedContacts,
      ...current.filter(contact => !savedContacts.some(saved => saved.id === contact.id || saved.normalizedIdentityKey === contact.normalizedIdentityKey)),
    ]);
    return savedContacts;
  }

  async function handleSaveLeadList({ name, assignedUserIds, leads, filters }) {
    const { currentUser, organizationId } = await getLeadContactSaveContext();
    const leadsWithSavedContacts = [];

    for (const lead of leads) {
      if (!leadHasPaceOpsData(lead) && lead.dataSource !== "manual") {
        leadsWithSavedContacts.push(lead);
        continue;
      }
      const savedContact = await handleUpsertLeadContact(lead, { skipConflictPrompt: true });
      leadsWithSavedContacts.push(hydrateLeadWithContactDatabase({ ...lead, dbContactId: savedContact.id }, [savedContact]));
    }

    const payload = {
      organization_id: organizationId,
      name,
      assigned_user_ids: assignedUserIds,
      leads: leadsWithSavedContacts,
      filters,
      created_by: currentUser.id,
      updated_by: currentUser.id,
    };

    const { data, error } = await supabase
      .from("lead_lists")
      .insert(payload)
      .select("*")
      .single();

    if (error) throw error;
    const savedList = mapLeadListRecord(data);
    setLeadLists(current => [savedList, ...current.filter(list => list.id !== savedList.id)]);
    setLeadListsError("");
    return savedList;
  }

  async function handleAppendToLeadList({ leadList, assignedUserIds = [], leads = [] }) {
    if (!leadList?.id) throw new Error("Select a lead list first.");
    const { organizationId } = await getLeadContactSaveContext();
    const nextLeads = [];

    for (const lead of leads) {
      if (!leadHasPaceOpsData(lead) && lead.dataSource !== "manual") {
        nextLeads.push(lead);
        continue;
      }
      const savedContact = await handleUpsertLeadContact(lead, { skipConflictPrompt: true });
      nextLeads.push(hydrateLeadWithContactDatabase({ ...lead, dbContactId: savedContact.id }, [savedContact]));
    }

    const leadsByIdentity = new Map();
    for (const lead of [...(leadList.leads || []), ...nextLeads]) {
      leadsByIdentity.set(buildLeadIdentityKey(lead), lead);
    }

    const nextAssignedUserIds = [...new Set([...(leadList.assignedUserIds || []), ...assignedUserIds])];
    const { data, error } = await supabase
      .from("lead_lists")
      .update({
        leads: [...leadsByIdentity.values()],
        assigned_user_ids: nextAssignedUserIds,
      })
      .eq("id", leadList.id)
      .eq("organization_id", organizationId)
      .select("*")
      .single();

    if (error) throw error;
    const savedList = mapLeadListRecord(data);
    setLeadLists(current => current.map(list => list.id === savedList.id ? savedList : list));
    setLeadListsError("");
    return savedList;
  }

  async function handleUpdateLeadList({ leadList, name, assignedUserIds, leads, filters }) {
    if (!leadList?.id) throw new Error("Select a lead list first.");
    const { currentUser, organizationId } = await getLeadContactSaveContext();
    const updatePayload = {
      updated_by: currentUser.id,
    };

    if (typeof name === "string") updatePayload.name = name;
    if (Array.isArray(assignedUserIds)) updatePayload.assigned_user_ids = assignedUserIds;
    if (Array.isArray(leads)) updatePayload.leads = leads;
    if (filters && typeof filters === "object") updatePayload.filters = filters;

    const { data, error } = await supabase
      .from("lead_lists")
      .update(updatePayload)
      .eq("id", leadList.id)
      .eq("organization_id", organizationId)
      .select("*")
      .single();

    if (error) throw error;
    const savedList = mapLeadListRecord(data);
    setLeadLists(current => current.map(list => list.id === savedList.id ? savedList : list));
    setLeadListsError("");
    return savedList;
  }

  async function handleDeleteLeadList(leadList) {
    if (!leadList?.id) throw new Error("Select a lead list first.");
    const { organizationId } = await getLeadContactSaveContext();
    const { error } = await supabase
      .from("lead_lists")
      .delete()
      .eq("id", leadList.id)
      .eq("organization_id", organizationId);

    if (error) throw error;
    setLeadLists(current => current.filter(list => list.id !== leadList.id));
    setLeadListsError("");
  }

  async function handleLogout() {
    if (!supabase || loggingOut) return;
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoggingOut(false);
      window.alert(error.message || "Could not log out.");
    }
  }

  if (!authReady) {
    return (
      <div className={`auth-app app-loading-screen ${isDark ? "dark" : "light"}`} role="status" aria-live="polite">
        <div className="app-loading-card">
          <strong>PaceOps</strong>
          <span>Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <HomePage
        isDark={isDark}
        onThemeToggle={() => setIsDark(value => !value)}
        onAuthenticate={handleAuthenticatedUser}
      />
    );
  }

  const { clients, campaigns, accounts, contacts, workspaceUsers = [] } = crmData;
  const activeClient = clients.find(client => client.id === activeClientId) || clients[0] || emptyClient;
  const activeCampaign = campaigns.find(campaign => campaign.id === activeCampaignId) || campaigns[0] || emptyCampaign;
  const selectedAccount = accounts.find(account => account.id === selectedAccountId) || accounts[0] || null;
  const selectedContact = contacts.find(contact => contact.id === selectedContactId) || contacts[0] || null;

  const searchQuery = search.trim().toLowerCase();
  const searchResults = searchQuery.length < 2 ? [] : [
    ...accounts.map(account => ({ type: "Account", id: account.id, title: account.name, meta: account.nextAction })),
    ...contacts.map(contact => ({ type: "Contact", id: contact.id, title: contact.name, meta: `${contact.role}, ${contact.account}` })),
    ...campaigns.map(campaign => ({ type: "Campaign", id: campaign.id, title: campaign.name, meta: campaign.nextAction })),
    ...workspaceUsers.map(workspaceUser => ({ type: "User", id: workspaceUser.id, title: workspaceUser.name, meta: workspaceUser.email })),
  ].filter(result => `${result.title} ${result.meta}`.toLowerCase().includes(searchQuery)).slice(0, 7);

  function currentNavigationState() {
    return {
      activeView,
      activeClientId,
      activeCampaignId,
      selectedAccountId,
      selectedContactId,
    };
  }

  function navigateTo(view, updates = {}, options = {}) {
    if (options.pushHistory !== false) {
      setViewHistory(current => [...current.slice(-9), currentNavigationState()]);
    }
    if (updates.activeClientId) setActiveClientId(updates.activeClientId);
    if (updates.activeCampaignId) setActiveCampaignId(updates.activeCampaignId);
    if (updates.selectedAccountId) setSelectedAccountId(updates.selectedAccountId);
    if (updates.selectedContactId) setSelectedContactId(updates.selectedContactId);
    setActiveView(view);
  }

  function navigatePrimary(view) {
    setViewHistory([]);
    setActiveView(view);
  }

  function goBack() {
    setViewHistory(current => {
      const previous = current[current.length - 1];
      if (!previous) return current;
      setActiveClientId(previous.activeClientId);
      setActiveCampaignId(previous.activeCampaignId);
      setSelectedAccountId(previous.selectedAccountId);
      setSelectedContactId(previous.selectedContactId);
      setActiveView(previous.activeView);
      return current.slice(0, -1);
    });
  }

  function openAccount(id) {
    navigateTo("account-detail", { selectedAccountId: id });
  }

  function openContact(id) {
    navigateTo("contact-detail", { selectedContactId: id });
  }

  function openClient(id) {
    navigateTo("client-detail", { activeClientId: id });
  }

  function openCampaign(id) {
    navigateTo("campaign-detail", { activeCampaignId: id });
  }

  function openWorkflow(type, context = {}) {
    setWorkflow({
      type,
      context: {
        clientId: activeClient.id !== "none" ? activeClient.id : clients[0]?.id,
        accountId: selectedAccount?.id,
        contactId: selectedContact?.id,
        ...context,
      },
    });
  }

  function editClient(client) {
    openWorkflow("edit-client", { record: client });
  }

  function editCampaign(campaign) {
    openWorkflow("edit-campaign", { record: campaign });
  }

  function editAccount(account) {
    openWorkflow("edit-account", { record: account });
  }

  function editContact(contact) {
    openWorkflow("edit-contact", { record: contact });
  }

  function closeWorkflow() {
    setWorkflow(null);
  }

  function updateData(updater) {
    setCrmData(refreshCrmData(updater(crmData)));
  }

  function updateIntegration(name, updates) {
    updateData(current => ({
      ...current,
      integrations: current.integrations.map(integration => integration.name === name
        ? { ...integration, ...updates }
        : integration),
    }));
  }

  function handleLogCall({ contactId, outcome, notes, transcript = "", analysisPreset = "General analysis" }) {
    if (!contactId) return;
    updateData(current => {
      const contact = current.contacts.find(item => item.id === contactId);
      if (!contact) return current;
      const account = current.accounts.find(item => item.id === contact.accountId);
      const activity = makeActivity("Call", `${outcome} logged for ${contact.name}`, contact.account, "Workspace user", {
        contactId,
        outcome,
        notes,
        transcript,
        analysisPreset,
      });
      const insight = (notes || transcript)
        ? buildCallInsight({ contact, account, outcome, notes, transcript, preset: analysisPreset })
        : null;
      const nextContacts = current.contacts.map(item => item.id === contactId
        ? { ...item, status: outcome, lastTouch: `${outcome} just now` }
        : item);
      const nextCampaigns = outcome === "Meeting booked"
        ? current.campaigns.map(campaign => campaign.id === activeCampaignId
          ? { ...campaign, meetings: Number(campaign.meetings || 0) + 1 }
          : campaign)
        : current.campaigns;
      return {
        ...current,
        contacts: nextContacts,
        campaigns: nextCampaigns,
        callInsights: insight ? [insight, ...(current.callInsights || [])] : current.callInsights || [],
        activities: [activity, ...current.activities],
      };
    });
    setSelectedContactId(contactId);
  }

  function handleGenerateResearchScripts() {
    updateData(current => {
      const clientAccounts = activeClient.id !== "none" ? current.accounts.filter(account => account.clientId === activeClient.id) : current.accounts;
      const account = clientAccounts[0] || current.accounts[0];
      const contextName = activeCampaign.id !== "none" ? activeCampaign.name : activeClient.name;
      const signal = account?.insight || activeCampaign.nextAction || activeClient.health || "a new research signal";
      const clientId = activeClient.id !== "none" ? activeClient.id : current.clients[0]?.id || "";
      const campaignId = activeCampaign.id !== "none" ? activeCampaign.id : "";
      const scripts = [
        { channel: "Call opener", body: `Hi, this is PaceOps. I was looking at ${contextName} and noticed ${signal}. Is now a bad time for one quick question?` },
        { channel: "Voicemail", body: `Hi, this is PaceOps. I found a relevant angle for ${contextName} around ${signal}. I will send a short note as well.` },
        { channel: "Email", body: `Subject: ${contextName} research angle\n\nI noticed ${signal}. Is this owned by your team, or should I speak with someone else?` },
        { channel: "Objection handling", body: "If timing is the issue, ask what would need to change for this to become worth revisiting." },
      ].map(item => ({
        id: makeId("script"),
        clientId,
        campaignId,
        accountId: account?.id || "",
        title: `${item.channel} for ${contextName}`,
        channel: item.channel,
        body: item.body,
        stage: "drafts",
        createdAt: new Date().toISOString(),
      }));

      return {
        ...current,
        scriptItems: [...scripts, ...(current.scriptItems || [])],
        activities: [makeActivity("AI", `Generated scripts for ${contextName}`, account?.name || "Workspace"), ...current.activities],
      };
    });
  }

  function handleMoveScript(scriptId, stage) {
    updateData(current => ({
      ...current,
      scriptItems: (current.scriptItems || []).map(script => script.id === scriptId ? { ...script, stage } : script),
    }));
  }

  function handleGenerateReport(timeframe = "This week") {
    updateData(current => {
      const clientId = activeClient.id !== "none" ? activeClient.id : "";
      const clientContactIds = new Set(current.contacts.filter(contact => !clientId || contact.clientId === clientId).map(contact => contact.id));
      const scopedCalls = current.activities.filter(activity => activity.type === "Call" && (!clientContactIds.size || clientContactIds.has(activity.contactId)));
      const scopedInsights = (current.callInsights || []).filter(insight => !clientContactIds.size || clientContactIds.has(insight.contactId));
      const report = buildWeeklyReport({ calls: scopedCalls, insights: scopedInsights, client: activeClient, campaign: activeCampaign, timeframe });

      return {
        ...current,
        weeklyReports: [report, ...(current.weeklyReports || [])],
        activities: [makeActivity("Report", `Weekly analysis generated: ${report.title}`, activeClient.name || "Workspace"), ...current.activities],
      };
    });
  }

  function handleAddLeadToCrmContacts(lead) {
    updateData(current => {
      const leadName = normalizeLookupValue(lead.contactName || [lead.firstName, lead.lastName].filter(Boolean).join(" ")) || "Untitled contact";
      const companyName = normalizeLookupValue(lead.company) || "Lead Finder account";
      const leadEmail = normalizeEmail(lead.manualEmail);
      const leadMobile = normalizePhone(lead.manualMobile || lead.manualDirectDial);
      const existingContact = current.contacts.find(contact => {
        const sameEmail = leadEmail && normalizeEmail(contact.email) === leadEmail;
        const sameMobile = leadMobile && normalizePhone(contact.mobile || contact.phone) === leadMobile;
        const samePersonAtCompany = normalizeLookupValue(contact.name).toLowerCase() === leadName.toLowerCase()
          && normalizeLookupValue(contact.account).toLowerCase() === companyName.toLowerCase();
        return sameEmail || sameMobile || samePersonAtCompany;
      });

      if (existingContact) {
        setSelectedAccountId(existingContact.accountId);
        setSelectedContactId(existingContact.id);
        setActiveView("contact-detail");
        return current;
      }

      const fallbackClient = {
        id: makeId("client"),
        name: "Lead Finder",
        workspace: "Prospecting workspace",
        status: "Active",
        owner: "Workspace user",
        accounts: 0,
        contacts: 0,
        health: "Active",
        industry: "",
        website: "",
      };
      const client = current.clients[0] || fallbackClient;
      const existingAccount = current.accounts.find(account => normalizeLookupValue(account.name).toLowerCase() === companyName.toLowerCase());
      const account = existingAccount || {
        id: makeId("account"),
        clientId: client.id,
        name: companyName,
        domain: "No domain",
        owner: "Workspace user",
        stage: current.pipelineStages?.[0]?.name || "Lead In",
        status: "New",
        industry: "Unspecified",
        location: normalizeLookupValue(lead.location) || "Unspecified",
        employees: "Unknown",
        value: 0,
        lastActivity: "Added from Lead Lookup",
        nextAction: "Map buying committee",
        insight: "Created from a saved Lead Finder contact.",
        scripts: null,
      };
      const phoneNumber = normalizeLookupValue(lead.manualMobile || lead.manualDirectDial);
      const contact = {
        id: makeId("contact"),
        clientId: account.clientId,
        accountId: account.id,
        account: account.name,
        name: leadName,
        role: normalizeLookupValue(lead.jobTitle) || "Stakeholder",
        persona: "Lead Finder",
        email: leadEmail,
        phone: phoneNumber,
        mobile: phoneNumber,
        phoneNumber,
        redeemed: Boolean(phoneNumber),
        owner: "Workspace user",
        status: "New",
        lastTouch: "Added from Lead Lookup",
      };

      setActiveClientId(client.id);
      setSelectedAccountId(account.id);
      setSelectedContactId(contact.id);
      setActiveView("contact-detail");

      return {
        ...current,
        clients: current.clients.length ? current.clients : [client],
        accounts: existingAccount ? current.accounts : [account, ...current.accounts],
        contacts: [contact, ...current.contacts],
        activities: [makeActivity("Contact", `Contact added from Lead Lookup: ${contact.name}`, account.name), ...current.activities],
      };
    });
  }

  function handleMoveDeal(dealId, stage) {
    updateData(current => {
      const deal = current.deals.find(item => item.id === dealId);
      if (!deal || deal.stage === stage) return current;
      const column = (current.pipelineStages || pipelineColumns).find(item => item.id === stage);
      return {
        ...current,
        deals: current.deals.map(item => item.id === dealId ? { ...item, stage } : item),
        activities: [makeActivity("Pipeline", `${deal.account} moved to ${column?.name || stage}`, deal.account), ...current.activities],
      };
    });
  }

  function handleUpdatePipelineStages(stages) {
    updateData(current => ({
      ...current,
      pipelineStages: stages,
      activities: [makeActivity("Pipeline", "Pipeline stages renamed", "Workspace"), ...current.activities],
    }));
  }

  function handleWorkflowSubmit(type, values, context = {}) {
    if (type === "call") {
      handleLogCall(values);
      closeWorkflow();
      return;
    }

    updateData(current => {
      if (type === "edit-client") {
        return {
          ...current,
          clients: current.clients.map(client => client.id === values.id
            ? {
              ...client,
              name: values.name.trim() || client.name,
              workspace: values.workspace || client.workspace,
              owner: values.owner || client.owner,
              industry: values.industry,
              website: values.website,
            }
            : client),
          activities: [makeActivity("Client", `Client updated: ${values.name || "Untitled client"}`), ...current.activities],
        };
      }

      if (type === "edit-campaign") {
        return {
          ...current,
          campaigns: current.campaigns.map(campaign => campaign.id === values.id
            ? {
              ...campaign,
              clientId: values.clientId || campaign.clientId,
              name: values.name.trim() || campaign.name,
              channel: values.channel || campaign.channel,
              status: values.status || campaign.status,
              nextAction: values.nextAction || campaign.nextAction,
              memberIds: Array.isArray(values.memberIds) ? values.memberIds : [],
            }
            : campaign),
          activities: [makeActivity("Campaign", `Campaign updated: ${values.name || "Untitled campaign"}`), ...current.activities],
        };
      }

      if (type === "edit-account") {
        const previous = current.accounts.find(account => account.id === values.id);
        const accountName = values.name.trim() || previous?.name || "Untitled account";
        return {
          ...current,
          accounts: current.accounts.map(account => account.id === values.id
            ? {
              ...account,
              clientId: values.clientId || account.clientId,
              name: accountName,
              domain: values.domain || "No domain",
              stage: values.stage || account.stage,
              status: values.status || account.status,
              industry: values.industry || "Unspecified",
              location: values.location || "Unspecified",
              employees: values.employees || "Unknown",
              value: Number(values.value) || 0,
              nextAction: values.nextAction || "Map buying committee",
              insight: values.insight || "Research signal will be added by the team.",
              scripts: values.scripts || account.scripts || null,
              lastActivity: "Updated just now",
            }
            : account),
          contacts: current.contacts.map(contact => contact.accountId === values.id ? { ...contact, account: accountName, clientId: values.clientId || contact.clientId } : contact),
          deals: current.deals.map(deal => previous && deal.account === previous.name ? { ...deal, account: accountName } : deal),
          activities: [makeActivity("Account", `Account updated: ${accountName}`, accountName), ...current.activities],
        };
      }

      if (type === "edit-contact") {
        const account = current.accounts.find(item => item.id === values.accountId);
        return {
          ...current,
          contacts: current.contacts.map(contact => contact.id === values.id
            ? {
              ...contact,
              clientId: account?.clientId || contact.clientId,
              accountId: values.accountId || contact.accountId,
              account: account?.name || contact.account,
              name: values.name.trim() || contact.name,
              role: values.role || "Stakeholder",
              persona: values.persona || "Stakeholder",
              email: values.email,
              phone: values.phone || values.mobile,
              mobile: values.mobile || values.phone,
              status: values.status || contact.status,
              lastTouch: "Updated just now",
            }
            : contact),
          activities: [makeActivity("Contact", `Contact updated: ${values.name || "Untitled contact"}`, account?.name || "Workspace"), ...current.activities],
        };
      }

      switch (type) {
        case "client": {
          const client = {
            id: makeId("client"),
            name: values.name.trim() || "Untitled client",
            workspace: values.workspace.trim() || "Prospecting workspace",
            status: "Active",
            owner: "Workspace user",
            accounts: 0,
            contacts: 0,
            health: "Needs setup",
            industry: values.industry,
            website: values.website,
          };
          setActiveClientId(client.id);
          setActiveView("client-detail");
          return {
            ...current,
            clients: [client, ...current.clients],
            activities: [makeActivity("Client", `Client created: ${client.name}`), ...current.activities],
          };
        }
        case "campaign": {
          const clientId = values.clientId || current.clients[0]?.id;
          const campaign = {
            id: makeId("campaign"),
            clientId,
            name: values.name.trim() || "Untitled campaign",
            status: titleCase(values.status || "draft"),
            owner: "Workspace user",
            channel: values.channel || "Research-led outbound",
            accounts: current.accounts.filter(account => account.clientId === clientId).length,
            contacts: current.contacts.filter(contact => contact.clientId === clientId).length,
            meetings: 0,
            nextAction: values.nextAction || "Define account focus and next action",
            memberIds: Array.isArray(values.memberIds) ? values.memberIds : [],
          };
          setActiveClientId(clientId);
          setActiveCampaignId(campaign.id);
          setActiveView("campaign-detail");
          return {
            ...current,
            campaigns: [campaign, ...current.campaigns],
            activities: [makeActivity("Campaign", `Campaign created: ${campaign.name}`), ...current.activities],
          };
        }
        case "account": {
          const clientId = values.clientId || current.clients[0]?.id;
          const account = {
            id: makeId("account"),
            clientId,
            name: values.name.trim() || "Untitled account",
            domain: values.domain || "No domain",
            owner: "Workspace user",
            stage: values.stage || "Lead In",
            status: values.status || "New",
            industry: values.industry || "Unspecified",
            location: values.location || "Unspecified",
            employees: values.employees || "Unknown",
            value: Number(values.value) || 0,
            lastActivity: "Created just now",
            nextAction: values.nextAction || "Map buying committee",
            insight: values.insight || "Research signal will be added by the team.",
            scripts: values.scripts || null,
          };
          setActiveClientId(clientId);
          setSelectedAccountId(account.id);
          setActiveView("account-detail");
          return {
            ...current,
            accounts: [account, ...current.accounts],
            activities: [makeActivity("Account", `Account added: ${account.name}`, account.name), ...current.activities],
          };
        }
        case "contact": {
          const account = current.accounts.find(item => item.id === values.accountId);
          if (!account) return current;
          const contact = {
            id: makeId("contact"),
            clientId: account.clientId,
            accountId: account.id,
            account: account.name,
            name: values.name.trim() || "Untitled contact",
            role: values.role || "Stakeholder",
            persona: values.persona || "Stakeholder",
            email: values.email,
            phone: values.phone || values.mobile,
            mobile: values.mobile || values.phone,
            owner: "Workspace user",
            status: values.status || "New",
            lastTouch: "Created just now",
          };
          setSelectedAccountId(account.id);
          setSelectedContactId(contact.id);
          setActiveView("contact-detail");
          return {
            ...current,
            contacts: [contact, ...current.contacts],
            activities: [makeActivity("Contact", `Contact added: ${contact.name}`, account.name), ...current.activities],
          };
        }
        case "deal": {
          const account = current.accounts.find(item => item.id === values.accountId);
          if (!account) return current;
          const contact = current.contacts.find(item => item.id === values.contactId);
          const deal = {
            id: makeId("deal"),
            accountId: account.id,
            contactId: contact?.id,
            account: account.name,
            contact: contact?.name || "No primary contact",
            stage: values.stage || "lead",
            value: Number(values.value) || 0,
            owner: values.owner || "Workspace user",
            due: values.due || "Today",
          };
          setSelectedAccountId(account.id);
          setActiveView("pipeline");
          return {
            ...current,
            deals: [deal, ...current.deals],
            activities: [makeActivity("Deal", `Deal created for ${account.name}`, account.name), ...current.activities],
          };
        }
        case "research": {
          const account = current.accounts.find(item => item.id === values.accountId);
          if (!account) return current;
          const researchItem = {
            id: makeId("research"),
            accountId: account.id,
            clientId: account.clientId,
            campaignId: activeCampaignId,
            account: account.name,
            title: values.title || "Account research brief",
            summary: values.summary,
            dataGap: values.dataGap,
            status: "Queued",
            createdAt: "Just now",
          };
          setSelectedAccountId(account.id);
          setActiveView("research");
          return {
            ...current,
            researchItems: [researchItem, ...current.researchItems],
            accounts: current.accounts.map(item => item.id === account.id
              ? {
                ...item,
                insight: values.summary || item.insight,
                lastActivity: "Research queued just now",
                nextAction: values.dataGap || item.nextAction,
              }
              : item),
            activities: [makeActivity("Research", `${researchItem.title} queued`, account.name), ...current.activities],
          };
        }
        case "file": {
          const file = {
            id: makeId("file"),
            name: values.name.trim() || "source-file.csv",
            source: values.source || "CSV import",
            objectType: values.objectType || "accounts",
            rows: Number(values.rows) || 0,
            status: "Ready to review",
            createdAt: "Just now",
          };
          setActiveView(context.returnTo || activeView);
          return {
            ...current,
            files: [file, ...current.files],
            activities: [makeActivity("Import", `${file.source} added: ${file.name}`), ...current.activities],
          };
        }
        case "team": {
          const member = {
            name: values.name.trim() || "Team member",
            role: values.role || "Team member",
            initials: accountInitial(values.name || "Team member"),
            status: values.status || "Invited",
          };
          setActiveView("settings");
          return {
            ...current,
            teamMembers: [member, ...current.teamMembers],
            activities: [makeActivity("Team", `${member.name} invited`), ...current.activities],
          };
        }
        case "email": {
          const contact = current.contacts.find(item => item.id === values.contactId);
          if (!contact) return current;
          return {
            ...current,
            activities: [makeActivity("Email", `Email draft created for ${contact.name}`, contact.account, "Workspace user", {
              subject: values.subject,
              body: values.body,
            }), ...current.activities],
          };
        }
        case "audit":
          return {
            ...current,
            activities: [makeActivity("Audit", "Integration audit model reviewed", "Workspace", "Workspace user", { note: values.note }), ...current.activities],
          };
        default:
          return current;
      }
    });
    closeWorkflow();
  }

  function handleSearchSelect(result) {
    setSearch("");
    if (result.type === "Account") openAccount(result.id);
    if (result.type === "Contact") openContact(result.id);
    if (result.type === "Campaign") openCampaign(result.id);
    if (result.type === "User") openView("settings");
  }

  function openView(view) {
    navigateTo(view);
  }

  function renderPage() {
    switch (activeView) {
      case "clients":
        return <ClientsPage onOpenClient={openClient} onEditClient={editClient} onNewClient={() => openWorkflow("client")} />;
      case "client-detail":
        return (
          <ClientDetailPage
            client={activeClient}
            onOpenCampaign={openCampaign}
            onEditClient={editClient}
            onNewCampaign={() => openWorkflow("campaign", { clientId: activeClient.id })}
            onNewAccount={() => openWorkflow("account", { clientId: activeClient.id })}
          />
        );
      case "campaigns":
        return <CampaignsPage onOpenCampaign={openCampaign} onEditCampaign={editCampaign} onNewCampaign={() => openWorkflow("campaign")} onImport={() => openWorkflow("file", { returnTo: "campaigns" })} />;
      case "campaign-detail":
        return <CampaignDetailPage campaign={activeCampaign} onNavigate={openView} onOpenAccount={openAccount} onEditCampaign={editCampaign} />;
      case "accounts":
        return <AccountsPage onOpenAccount={openAccount} onEditAccount={editAccount} onNewAccount={() => openWorkflow("account")} onImport={() => openWorkflow("file", { returnTo: "accounts" })} />;
      case "account-detail":
        return selectedAccount
          ? <AccountDetailPage account={selectedAccount} onOpenContact={openContact} onEditAccount={editAccount} onQueueResearch={(accountId) => openWorkflow("research", { accountId })} onNewContact={(accountId) => openWorkflow("contact", { accountId })} onNewDeal={(accountId) => openWorkflow("deal", { accountId })} />
          : <AccountsPage onOpenAccount={openAccount} onEditAccount={editAccount} onNewAccount={() => openWorkflow("account")} onImport={() => openWorkflow("file", { returnTo: "accounts" })} />;
      case "contacts":
        return <ContactsPage onOpenContact={openContact} onEditContact={editContact} onNewContact={(accountId) => openWorkflow("contact", accountId ? { accountId } : {})} onImport={() => openWorkflow("file", { returnTo: "contacts" })} />;
      case "contact-detail":
        return selectedContact
          ? <ContactDetailPage contact={selectedContact} onEditContact={editContact} onLogCall={handleLogCall} onDraftEmail={(contactId) => openWorkflow("email", { contactId })} />
          : <ContactsPage onOpenContact={openContact} onEditContact={editContact} onNewContact={() => openWorkflow("contact")} onImport={() => openWorkflow("file", { returnTo: "contacts" })} />;
      case "cognism":
        return <CognismContactFinder contactDatabase={leadContactDatabase} onSaveLeadList={handleSaveLeadList} onSaveLeadContact={handleUpsertLeadContact} onPersistSearchResults={handlePersistSearchResults} />;
      case "lead-lists":
        return <LeadListsPage leadLists={leadLists} workspaceUsers={workspaceUsers} contactDatabase={leadContactDatabase} error={leadListsError} onSaveLeadList={handleSaveLeadList} onAppendToLeadList={handleAppendToLeadList} onUpdateLeadList={handleUpdateLeadList} onDeleteLeadList={handleDeleteLeadList} onSaveLeadContact={handleUpsertLeadContact} />;
      case "lead-lookup":
        return <LeadDatabasePage leadLists={leadLists} contactDatabase={leadContactDatabase} onSaveLeadContact={handleUpsertLeadContact} onAddToCrmContacts={handleAddLeadToCrmContacts} />;
      case "pipeline":
        return <PipelinePage onOpenAccount={openAccount} onMoveDeal={handleMoveDeal} onNewDeal={(accountId) => openWorkflow("deal", accountId ? { accountId } : {})} onUpdateStages={handleUpdatePipelineStages} />;
      case "calls":
        return <CallsPage onOpenContact={openContact} onLogCall={handleLogCall} onStartCallBlock={() => openWorkflow("call")} />;
      case "research":
        return <ResearchPage activeClient={activeClient} activeCampaign={activeCampaign} onOpenAccount={openAccount} onAddSource={() => openWorkflow("file", { returnTo: "research" })} onQueueResearch={(accountId) => openWorkflow("research", accountId ? { accountId } : {})} onGenerateScripts={handleGenerateResearchScripts} onMoveScript={handleMoveScript} onGenerateReport={handleGenerateReport} />;
      case "files":
        return <FilesPage onUploadFile={() => openWorkflow("file", { returnTo: "files" })} />;
      case "integrations":
        return <IntegrationsPage onNavigate={openView} onOpenWorkflow={(type) => openWorkflow(type)} onUpdateIntegration={updateIntegration} integrationCredentials={integrationCredentials} onSaveIntegrationCredentials={handleSaveIntegrationCredentials} />;
      case "settings":
        return <SettingsPage isDark={isDark} onThemeToggle={() => setIsDark(value => !value)} onInviteTeamMember={() => openWorkflow("team")} user={user} onUpdateProfile={handleUpdateProfile} />;
      default:
        return (
          <DashboardPage
            activeClient={activeClient}
            activeCampaign={activeCampaign}
            onNavigate={openView}
            onOpenAccount={openAccount}
          />
        );
    }
  }

  return (
    <CrmDataContext.Provider value={crmData}>
      <div className={`crm-app ${isDark ? "dark" : "light"}`}>
        <Sidebar activeView={activeView} onNavigate={navigatePrimary} />
        <div className="workspace">
          <TopBar
            canGoBack={viewHistory.length > 0}
            onBack={goBack}
            activeClient={activeClient}
            activeCampaign={activeCampaign}
            onClientChange={setActiveClientId}
            onCampaignChange={setActiveCampaignId}
            isDark={isDark}
            onThemeToggle={() => setIsDark(value => !value)}
            drawerOpen={drawerOpen}
            onDrawerToggle={() => setDrawerOpen(value => !value)}
            search={search}
            onSearchChange={setSearch}
            searchResults={searchResults}
            onSearchSelect={handleSearchSelect}
            onLogout={handleLogout}
            loggingOut={loggingOut}
          />
          <div className={`workspace-body ${drawerOpen ? "with-drawer" : ""}`}>
            <main className="main-content">
              {renderPage()}
            </main>
            <RightDrawer
              open={drawerOpen}
              activeView={activeView}
              selectedAccount={selectedAccount}
              activeCampaign={activeCampaign}
            />
          </div>
        </div>
        {workflow && (
          <WorkflowModal
            key={`${workflow.type}-${workflow.context?.record?.id || workflow.context?.accountId || workflow.context?.contactId || ""}`}
            workflow={workflow}
            activeClientId={activeClientId}
            selectedAccountId={selectedAccountId}
            selectedContactId={selectedContactId}
            onClose={closeWorkflow}
            onSubmit={handleWorkflowSubmit}
            onSwitchWorkflow={(type) => openWorkflow(type)}
          />
        )}
      </div>
    </CrmDataContext.Provider>
  );
}
