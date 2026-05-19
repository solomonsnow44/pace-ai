import { createContext, createElement, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import {
  ArrowRight,
  ArrowLeft,
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
  LoaderCircle,
  LockKeyhole,
  LogOut,
  LogIn,
  Mail,
  MapPin,
  Megaphone,
  Moon,
  PanelRight,
  Pencil,
  Phone,
  Plug,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import logoUrl from "../images/paceops-logo.jpeg";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const CRM_DATA_METADATA_KEY = "crm_data";
const ALLOWED_EMAIL_DOMAIN = "paceops.com";
const LEAD_FINDER_SEARCH_STATE_KEY = "paceops-lead-finder-search-state";
const LEAD_FINDER_SEARCH_STATE_VERSION = 4;
const DEFAULT_MAX_CONTACTS_PER_COMPANY = 1;
const DEFAULT_ADMIN_SETTINGS = {
  cognism_preview_enabled: true,
  contact_deletion_enabled: false,
};
const ADMIN_ROLES = new Set(["platform_admin", "org_owner", "org_admin"]);

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
    directDial: "+35315550101",
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
    directDial: "+442071110202",
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
    directDial: "+442071110303",
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
    directDial: "+35315550404",
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
    directDial: "+35315550505",
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
    directDial: "+442071110606",
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
  name: "No client account selected",
  workspace: "Create a client account",
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
const COGNISM_REDEEM_CONFIRMATION = "ENABLE";

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
  { name: "Cognism", icon: Target, status: "Connected", note: "Lead Finder searches preview contact data and saves selected rows.", action: "Open Lead Finder", view: "cognism", redeemEnabled: false },
  // Calls workspace disabled: { name: "Aircall", icon: Phone, status: "Partial", note: "Click-to-call is available for contacts with saved phone numbers.", action: "Open Calls", view: "calls" },
  { name: "Aircall", icon: Phone, status: "Partial", note: "Click-to-call is available for contacts with saved phone numbers.", action: "Open Contacts", view: "contacts" },
  { name: "HubSpot", icon: Database, status: "Connected", note: "Lead Finder contacts can be exported to HubSpot contacts. Company association depends on HubSpot app scopes.", action: "Open Lead Finder", view: "cognism" },
];
const connectedIntegrationStatuses = new Set(["Available", "Connected", "Partial"]);
const SHOW_INTEGRATION_KEY_CONTROLS = false;

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients", label: "Client Accounts", icon: Building2 },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "contacts", label: "Contacts", icon: Contact, highlight: true },
  { id: "cognism", label: "Lead Finder", icon: Target, highlight: true },
  { id: "lead-lists", label: "Lead Lists", icon: ListFilter, highlight: true },
  { id: "lead-lookup", label: "Lead Lookup", icon: Search, highlight: true },
  { id: "pipeline", label: "Pipeline", icon: KanbanSquare },
  // Calls workspace disabled: { id: "calls", label: "Calls", icon: Phone },
  { id: "research", label: "Research", icon: FileText },
  { id: "integrations", label: "Integrations", icon: Plug, highlight: true },
  { id: "settings", label: "Settings", icon: Settings, highlight: true },
];

const workspaceViewIds = new Set(navItems.map(item => item.id).concat([
  "client-detail",
  "campaign-detail",
  "account-detail",
  "contact-detail",
]));

function readWorkspaceViewFromUrl() {
  if (typeof window === "undefined") return "";
  const view = new URL(window.location.href).searchParams.get("view") || "";
  return workspaceViewIds.has(view) ? view : "";
}

function writeWorkspaceHistory(state, mode = "push") {
  if (typeof window === "undefined" || !state?.activeView) return;
  const url = new URL(window.location.href);
  if (state.activeView === "dashboard") {
    url.searchParams.delete("view");
  } else {
    url.searchParams.set("view", state.activeView);
  }
  window.history[mode === "replace" ? "replaceState" : "pushState"]({ workspaceNavigation: state }, "", url);
}

const CURRENCY_STORAGE_KEY = "paceops.currencyCode";
const currencyOptions = [
  { code: "EUR", label: "Euro", locale: "en-IE" },
  { code: "GBP", label: "Pounds", locale: "en-GB" },
  { code: "USD", label: "USD", locale: "en-US" },
];

function normalizeCurrencyCode(code) {
  const value = String(code || "").toUpperCase();
  return currencyOptions.some(option => option.code === value) ? value : "GBP";
}

function createCurrencyFormatter(code) {
  const currencyCode = normalizeCurrencyCode(code);
  const option = currencyOptions.find(item => item.code === currencyCode) || currencyOptions[1];
  return new Intl.NumberFormat(option.locale, {
    style: "currency",
    currency: option.code,
    maximumFractionDigits: 0,
  });
}

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
      roleKey: workspaceUser.role || "member",
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
    roleKey: "member",
    initials: accountInitial(name),
    status: "Active",
  };
}

function mergeWorkspaceUsers(users, fallbackUser) {
  const merged = [];
  for (const user of users || []) {
    if (!user?.id || merged.some(item => item.id === user.id)) continue;
    merged.push(user);
  }
  if (fallbackUser?.id && !merged.some(item => item.id === fallbackUser.id)) {
    merged.push(fallbackUser);
  }
  return merged;
}

function normalizeAdminSettings(settings = {}) {
  return {
    ...DEFAULT_ADMIN_SETTINGS,
    ...(settings && typeof settings === "object" ? settings : {}),
    cognism_preview_enabled: settings?.cognism_preview_enabled !== false,
    contact_deletion_enabled: settings?.contact_deletion_enabled === true,
  };
}

function formatRole(role) {
  return titleCase(String(role || "member").replaceAll("_", " "));
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

async function loadPrivateContactNotes(organizationId, userId) {
  if (!supabase || !organizationId || !userId) return {};
  const { data, error } = await supabase
    .from("contact_private_notes")
    .select("crm_contact_id,body")
    .eq("organization_id", organizationId)
    .eq("created_by", userId);

  if (error) throw error;
  return Object.fromEntries((data || []).map(note => [note.crm_contact_id, note.body || ""]));
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
    manualEmail: lead.manualEmail || match.manualEmail || "",
    manualMobile: lead.manualMobile || match.manualMobile || "",
    manualDirectDial: lead.manualDirectDial || match.manualDirectDial || "",
    linkedinProfileUrl: lead.linkedinProfileUrl || match.linkedinProfileUrl || "",
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

function leadMergeKey(lead = {}) {
  const cognismRedeemId = normalizeLookupValue(lead.cognismRedeemId).toLowerCase();
  if (cognismRedeemId) return `redeem:${cognismRedeemId}`;
  const cognismContactId = normalizeLookupValue(lead.cognismContactId).toLowerCase();
  if (cognismContactId) return `cognism:${cognismContactId}`;
  const linkedinUrl = normalizeLinkedinUrl(lead.linkedinProfileUrl).toLowerCase();
  if (linkedinUrl) return `linkedin:${linkedinUrl}`;
  return `person:${normalizeLookupValue(lead.contactName).toLowerCase()}|${normalizeLookupValue(lead.company).toLowerCase()}`;
}

function mergeLeadResults(existingLeads = [], incomingLeads = []) {
  const merged = [...existingLeads];
  const indexByKey = new Map(merged.map((lead, index) => [leadMergeKey(lead), index]));

  for (const incomingLead of incomingLeads) {
    const key = leadMergeKey(incomingLead);
    const existingIndex = indexByKey.get(key);
    if (existingIndex === undefined) {
      indexByKey.set(key, merged.length);
      merged.push(incomingLead);
    } else {
      merged[existingIndex] = {
        ...incomingLead,
        ...merged[existingIndex],
        emailAvailable: incomingLead.emailAvailable || merged[existingIndex].emailAvailable,
        mobileAvailable: incomingLead.mobileAvailable || merged[existingIndex].mobileAvailable,
        directDialAvailable: incomingLead.directDialAvailable || merged[existingIndex].directDialAvailable,
        matchScore: Math.max(Number(incomingLead.matchScore) || 0, Number(merged[existingIndex].matchScore) || 0),
      };
    }
  }

  return merged;
}

function loadLeadFinderSearchState() {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LEAD_FINDER_SEARCH_STATE_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== LEAD_FINDER_SEARCH_STATE_VERSION) {
      return {
        ...parsed,
        maxPerCompany: DEFAULT_MAX_CONTACTS_PER_COMPANY,
        requireMobileAvailable: true,
        searchMode: "preview",
        version: LEAD_FINDER_SEARCH_STATE_VERSION,
      };
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
    || normalizeLookupValue(lead.manualDirectDial)
    || normalizeLookupValue(lead.notes)
    || normalizeLookupValue(lead.dbContactId)
  );
}

function getLeadSavedPhoneData(lead = {}, contactDatabase = []) {
  const leadMobile = normalizeLookupValue(lead.manualMobile);
  const leadDirectDial = normalizeLookupValue(lead.manualDirectDial);
  const match = findLeadDatabaseMatch(lead, contactDatabase);
  return {
    mobile: leadMobile || normalizeLookupValue(match?.manualMobile),
    directDial: leadDirectDial || normalizeLookupValue(match?.manualDirectDial),
  };
}

function leadNeedsSavedPhoneData(lead = {}, contactDatabase = []) {
  const phoneData = getLeadSavedPhoneData(lead, contactDatabase);
  return !phoneData.mobile || !phoneData.directDial;
}

function summarizeMissingPhoneData(leads = [], contactDatabase = []) {
  return leads.reduce((summary, lead) => {
    const phoneData = getLeadSavedPhoneData(lead, contactDatabase);
    const missingMobile = !phoneData.mobile;
    const missingDirectDial = !phoneData.directDial;
    if (missingMobile && missingDirectDial) summary.missingBoth += 1;
    else if (missingMobile) summary.missingMobile += 1;
    else if (missingDirectDial) summary.missingDirectDial += 1;
    return summary;
  }, { missingBoth: 0, missingMobile: 0, missingDirectDial: 0 });
}

function rawCognismPhoneValue(phone) {
  if (!phone) return "";
  if (typeof phone === "string") return normalizeLookupValue(phone);
  return normalizeLookupValue(phone.number || phone.phoneNumber || phone.value || phone.rawNumber);
}

function rawCognismCallablePhone(phone) {
  const value = rawCognismPhoneValue(phone);
  if (!value || value.toLowerCase() === "dnc" || phone?.dnc === true) return "";
  return value;
}

function firstRawCognismPhone(list) {
  if (!Array.isArray(list)) return "";
  for (const phone of list) {
    const value = rawCognismCallablePhone(phone);
    if (value) return value;
  }
  return "";
}

function rawCognismRedeemId(record = {}) {
  return normalizeLookupValue(record.redeemId || record.redeemID || record.redeem_id || record.id || record.contactId);
}

function normalizePhoneForCompare(value) {
  return normalizeLookupValue(value).replace(/[^\d+]/g, "");
}

function correctRedeemedRowsFromRawRecords(redeemedRows = [], rawRecords = []) {
  const rawByKey = new Map();
  rawRecords.forEach(record => {
    [rawCognismRedeemId(record), record.id, record.contactId].map(normalizeLookupValue).filter(Boolean).forEach(key => rawByKey.set(key, record));
  });

  return redeemedRows.map(row => {
    const rawRecord = rawByKey.get(normalizeLookupValue(row.cognismRedeemId || row.redeemId))
      || rawByKey.get(normalizeLookupValue(row.cognismContactId));
    if (!rawRecord) return row;

    const rawMobile = firstRawCognismPhone(rawRecord.mobilePhoneNumbers || rawRecord.mobilePhones || rawRecord.mobileNumbers || rawRecord.mobiles);
    const rawDirectDial = firstRawCognismPhone(rawRecord.directPhoneNumbers || rawRecord.directPhones || rawRecord.directNumbers || rawRecord.directDials);
    const nextRow = { ...row };

    if (rawMobile) nextRow.manualMobile = rawMobile;
    if (rawDirectDial) nextRow.manualDirectDial = rawDirectDial;
    else if (rawMobile && normalizePhoneForCompare(nextRow.manualDirectDial) === normalizePhoneForCompare(rawMobile)) {
      nextRow.manualDirectDial = "";
    }

    return nextRow;
  });
}

function leadHasManualData(lead = {}) {
  return Boolean(
    normalizeLookupValue(lead.linkedinProfileUrl)
    || normalizeLookupValue(lead.manualEmail)
    || normalizeLookupValue(lead.manualMobile)
    || normalizeLookupValue(lead.manualDirectDial)
    || normalizeLookupValue(lead.notes)
  );
}

function validateLeadManualFields(lead = {}) {
  const linkedinUrl = normalizeLinkedinUrl(lead.linkedinProfileUrl);
  const email = normalizeLookupValue(lead.manualEmail);
  const mobile = normalizeLookupValue(lead.manualMobile);
  const directDial = normalizeLookupValue(lead.manualDirectDial);
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
  if (directDial && !phonePattern.test(directDial)) {
    return "Manual direct dial can only include +, digits, spaces, brackets, and dashes.";
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
    const sameDirectDial = lead.manualDirectDial && contact.manualDirectDial
      && normalizePhone(lead.manualDirectDial) === normalizePhone(contact.manualDirectDial);
    return sameLinkedin || sameEmail || sameMobile || sameDirectDial;
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
    manual_direct_dial: normalizeLookupValue(lead.manualDirectDial) || null,
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
    manual_email: normalizeEmail(lead.manualEmail) || existingContact?.manualEmail || null,
    manual_mobile: normalizeLookupValue(lead.manualMobile) || existingContact?.manualMobile || null,
    manual_direct_dial: normalizeLookupValue(lead.manualDirectDial) || existingContact?.manualDirectDial || null,
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
const CurrencyContext = createContext({
  currencyCode: "GBP",
  currencyOptions,
  formatCurrency: value => createCurrencyFormatter("GBP").format(Number(value) || 0),
});

function useCrmData() {
  return useContext(CrmDataContext);
}

function useCurrency() {
  return useContext(CurrencyContext);
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

function getContactPhoneNumber(contact) {
  return getRedeemedPhoneNumber(contact) || contact?.phoneNumber || contact?.mobile || contact?.directDial || contact?.phone || "";
}

function getContactMobileNumber(contact) {
  return contact?.mobile || "";
}

function getContactDirectDialNumber(contact) {
  return contact?.directDial || contact?.phone || "";
}

async function buildApiHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (!supabase) return headers;
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error(`Server returned ${response.status || "an"} invalid response`);
    error.statusCode = response.status;
    throw error;
  }
}

function AircallDialButton({ contact, phoneNumber: phoneNumberOverride = "", source = "crm_contact", label = "Call", compact = false }) {
  const phoneNumber = phoneNumberOverride || getContactPhoneNumber(contact);
  const dialPhoneNumber = normalizePhone(phoneNumber);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const canDial = Boolean(dialPhoneNumber && contact?.id);
  const buttonTitle = message || (phoneNumber ? `Call ${phoneNumber}` : "Phone number needed");

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
      const payload = await readJsonResponse(response);
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
      {!compact ? <span>{phoneNumber || "Phone number needed"}</span> : null}
      <button className={`secondary-button ${status === "error" ? "dial-button-error" : ""}`} type="button" disabled={!canDial || status === "loading"} onClick={dialContact} title={buttonTitle} aria-label={buttonTitle}>
        {status === "loading" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <Phone size={16} />}
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
  drawerOpen,
  onDrawerToggle,
  search,
  onSearchChange,
  searchResults,
  onSearchSelect,
}) {
  const { clients, campaigns } = useCrmData();
  const activeClientCampaigns = activeClient?.id && activeClient.id !== "none"
    ? campaigns.filter(campaign => campaign.clientId === activeClient.id)
    : campaigns;
  const campaignSelectValue = activeClientCampaigns.some(campaign => campaign.id === activeCampaign.id)
    ? activeCampaign.id
    : activeClientCampaigns[0]?.id || "none";

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
            <span>Client account</span>
            <select value={activeClient.id} onChange={event => onClientChange(event.target.value)}>
              {clients.length
                ? clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)
                : <option value="none">No client accounts yet</option>}
            </select>
            <ChevronDown size={14} />
          </label>
          <label>
            <span>Campaign</span>
            <select value={campaignSelectValue} onChange={event => onCampaignChange(event.target.value)}>
              {activeClientCampaigns.length
                ? activeClientCampaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)
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
          placeholder="Search client accounts, contacts, campaigns, users"
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
          <span>{drawerOpen ? "Hide" : "Menu"}</span>
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

function DashboardPage({ activeClient, activeCampaign, onNavigate, onOpenAccount }) {
  const { deals, campaigns, accounts, teamMembers } = useCrmData();
  const { formatCurrency } = useCurrency();
  const scopedAccounts = activeClient?.id && activeClient.id !== "none"
    ? accounts.filter(account => account.clientId === activeClient.id)
    : accounts;
  const scopedAccountNames = new Set(scopedAccounts.map(account => account.name));
  const scopedCampaigns = activeClient?.id && activeClient.id !== "none"
    ? campaigns.filter(campaign => campaign.clientId === activeClient.id)
    : campaigns;
  const scopedDeals = deals.filter(deal => scopedAccountNames.has(deal.account));
  const pipelineValue = scopedDeals.reduce((total, deal) => total + deal.value, 0);
  const bookedMeetings = scopedCampaigns.reduce((total, campaign) => total + campaign.meetings, 0);

  return (
    <>
      <PageHeader
        eyebrow={`${activeClient.name} client account`}
        title="Sales workspace"
        description="A focused view of campaigns, pipeline, contacts, and research activity for the current client account."
      >
        <button className="secondary-button" type="button" onClick={() => onNavigate("research")}>
          <FileText size={16} />
          Open research
        </button>
        {/*
        Calls workspace disabled.
        <button className="primary-button" type="button" onClick={() => onNavigate("calls")}>
          <Phone size={16} />
          Create call block
        </button>
        */}
      </PageHeader>

      <div className="metrics-grid">
        <MetricCard label="Active campaign" value={scopedCampaigns.length ? activeCampaign.name : "No campaign yet"} detail={activeCampaign.nextAction} icon={Megaphone} />
        <MetricCard label="Target accounts" value={scopedAccounts.length} detail={scopedAccounts.length ? "Ready for review" : "Add targets inside a client account"} icon={BriefcaseBusiness} />
        <MetricCard label="Open pipeline" value={formatCurrency(pipelineValue)} detail="Across the active client account" icon={KanbanSquare} />
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
            <EmptyState icon={Target} title="No target accounts yet" text="Create or import target accounts, then add contacts and deals to start building pipeline." />
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

function ClientsPage({ onOpenClient, onNewClient, onEditClient, onRemoveClient }) {
  const { clients } = useCrmData();
  const [pendingRemoval, setPendingRemoval] = useState(null);

  return (
    <>
      <PageHeader
        eyebrow="Client accounts"
        title="Client accounts"
        description="Manage each client account before moving into its campaigns, target accounts, contacts, pipeline, and research."
      >
        <button className="primary-button" type="button" onClick={onNewClient}>
          <Plus size={16} />
          New client account
        </button>
      </PageHeader>
      <section className="panel">
        {clients.length ? <DataTable
          columns={["Client account", "Workspace", "Owner", "Target accounts", "Contacts", "Health", ""]}
          rows={clients.map(client => [
            <RecordName key="client" name={client.name} meta={client.status} />,
            client.workspace,
            client.owner,
            client.accounts,
            client.contacts,
            <StatusBadge key="health" tone="success">{client.health}</StatusBadge>,
            <div key="actions" className="row-actions">
              <button className="icon-action" type="button" onClick={event => {
                event.stopPropagation();
                onEditClient(client);
              }} title={`Edit ${client.name}`} aria-label={`Edit ${client.name}`}>
                <Pencil size={16} />
              </button>
              <button className="icon-action" type="button" onClick={event => {
                event.stopPropagation();
                onOpenClient(client.id);
              }} title={`Open ${client.name}`} aria-label={`Open ${client.name}`}>
                <Eye size={16} />
              </button>
              <button className="icon-action danger-button" type="button" onClick={event => {
                event.stopPropagation();
                setPendingRemoval(client);
              }} title={`Remove ${client.name}`} aria-label={`Remove ${client.name}`}>
                <Trash2 size={16} />
              </button>
            </div>,
          ])}
          rowActions={clients.map(client => () => onOpenClient(client.id))}
        /> : <EmptyState icon={Building2} title="No client accounts yet" text="Create your first client account to manage campaigns, target accounts, contacts, research, and pipeline." />}
      </section>
      {pendingRemoval ? (
        <ClientRemovalDialog
          client={pendingRemoval}
          onCancel={() => setPendingRemoval(null)}
          onConfirm={() => {
            onRemoveClient?.(pendingRemoval);
            setPendingRemoval(null);
          }}
        />
      ) : null}
    </>
  );
}

function ClientRemovalDialog({ client, onCancel, onConfirm }) {
  return (
    <section className="modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <div className="workflow-modal confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="remove-client-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Remove client account</span>
            <h2 id="remove-client-title">{client.name}</h2>
          </div>
          <button className="icon-action" type="button" onClick={onCancel} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <p className="modal-helper-text">This removes the client account and its campaigns, target accounts, contacts, deals, research, scripts, and reports from the CRM.</p>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="secondary-button danger-button" type="button" onClick={onConfirm}>
            <Trash2 size={16} />
            Remove client account
          </button>
        </div>
      </div>
    </section>
  );
}

function ClientDetailPage({ client, onOpenCampaign, onOpenAccount, onEditClient, onEditAccount, onRemoveClient, onNewCampaign, onNewAccount }) {
  const { campaigns, accounts, contacts, activities } = useCrmData();
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const clientCampaigns = campaigns.filter(campaign => campaign.clientId === client.id);
  const clientAccounts = accounts.filter(account => account.clientId === client.id);
  const clientContacts = contacts.filter(contact => contact.clientId === client.id);
  const clientCalls = activities.filter(activity => activity.type === "Call" && clientAccounts.some(account => account.name === activity.account));

  return (
    <>
      <PageHeader
        eyebrow="Client account"
        title={client.name}
        description="The parent record for this client account, its campaigns, target accounts, contacts, pipeline, and research."
      >
        <button className="secondary-button" type="button" onClick={() => onEditClient(client)}>Edit client account</button>
        <button className="secondary-button danger-button" type="button" onClick={() => setPendingRemoval(client)}>
          <Trash2 size={16} />
          Remove client account
        </button>
        <button className="secondary-button" type="button" onClick={onNewCampaign}>New campaign</button>
        <button className="primary-button" type="button" onClick={onNewAccount}>Add target account</button>
      </PageHeader>
      <div className="metrics-grid">
        <MetricCard label="Campaigns" value={clientCampaigns.length} detail={clientCampaigns.length ? "Campaigns in this client account" : "Create the first campaign"} icon={Megaphone} />
        <MetricCard label="Target accounts" value={clientAccounts.length} detail={clientAccounts.length ? "Target accounts assigned" : "Add target accounts"} icon={BriefcaseBusiness} />
        <MetricCard label="Contacts" value={clientContacts.length} detail={clientContacts.length ? "Contacts mapped" : "Add contacts after target accounts"} icon={Users} />
        <MetricCard label="Calls logged" value={clientCalls.length} detail={clientCalls.length ? "Recent call activity" : "No calls logged yet"} icon={Phone} />
      </div>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header"><h2>Campaigns</h2></div>
          <CampaignList campaigns={clientCampaigns} compact onOpenCampaign={onOpenCampaign} />
        </section>
        <section className="panel">
          <div className="panel-header"><h2>Workspace notes</h2></div>
          <div className="detail-list">
            <div><span>Primary goal</span><strong>{client.workspace}</strong></div>
            <div><span>Data posture</span><strong>CRM data is created inside this signed-in workspace.</strong></div>
            <div><span>Next review</span><strong>{activities[0]?.title || "Add activity to build the workspace timeline"}</strong></div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Target accounts</h2>
            <button className="text-button" type="button" onClick={onNewAccount}>Add target account</button>
          </div>
          {clientAccounts.length
            ? <AccountTable accounts={clientAccounts} onOpenAccount={onOpenAccount} onEditAccount={onEditAccount} />
            : <EmptyState icon={BriefcaseBusiness} title="No target accounts yet" text="Add target accounts inside this client account before building contacts, research, and pipeline." />}
        </section>
      </div>
      {pendingRemoval ? (
        <ClientRemovalDialog
          client={pendingRemoval}
          onCancel={() => setPendingRemoval(null)}
          onConfirm={() => {
            onRemoveClient?.(pendingRemoval);
            setPendingRemoval(null);
          }}
        />
      ) : null}
    </>
  );
}

function CampaignsPage({ activeClient, onOpenCampaign, onEditCampaign, onNewCampaign, onImport }) {
  const { campaigns } = useCrmData();
  const scopedCampaigns = activeClient?.id && activeClient.id !== "none"
    ? campaigns.filter(campaign => campaign.clientId === activeClient.id)
    : campaigns;

  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title="Campaigns"
        description={`Campaigns inside ${activeClient?.name || "the active client account"}.`}
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
      <CampaignList campaigns={scopedCampaigns} onOpenCampaign={onOpenCampaign} onEditCampaign={onEditCampaign} />
    </>
  );
}

function CampaignList({ campaigns: providedCampaigns, onOpenCampaign, onEditCampaign, compact = false }) {
  const { campaigns: allCampaigns } = useCrmData();
  const campaigns = providedCampaigns || allCampaigns;

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
      </div> : <EmptyState icon={Megaphone} title="No campaigns yet" text="Create a campaign inside the client account when you are ready to run outreach, call blocks, or research workflows." />}
    </section>
  );
}

function CampaignDetailPage({ campaign, onNavigate, onOpenAccount, onEditCampaign }) {
  const { accounts, workspaceUsers } = useCrmData();
  const campaignAccounts = accounts.filter(account => account.clientId === campaign.clientId);
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
        {/* Calls workspace disabled: <button className="primary-button" type="button" onClick={() => onNavigate("calls")}>Call queue</button> */}
      </PageHeader>
      <div className="metrics-grid">
        <MetricCard label="Target accounts" value={campaign.accounts} detail="In campaign scope" icon={BriefcaseBusiness} />
        <MetricCard label="Contacts" value={campaign.contacts} detail="Mapped to personas" icon={Users} />
        <MetricCard label="Meetings" value={campaign.meetings} detail="Booked so far" icon={CalendarDays} />
        <MetricCard label="Owner" value={campaign.owner} detail={campaign.channel} icon={UserRound} />
      </div>
      <section className="panel">
        <div className="panel-header"><h2>Campaign target account focus</h2></div>
        {campaignAccounts.length ? <AccountTable accounts={campaignAccounts} onOpenAccount={onOpenAccount} /> : <EmptyState icon={BriefcaseBusiness} title="No target accounts yet" text="Add target accounts to this client account to create campaign focus." />}
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

function AccountTable({ accounts: providedAccounts, onOpenAccount, onEditAccount }) {
  const { accounts: allAccounts } = useCrmData();
  const accounts = providedAccounts || allAccounts;
  const { formatCurrency } = useCurrency();

  return (
    <DataTable
      columns={["Target account", "Owner", "Stage", "Value", "Last activity", "Next action", ""]}
      rows={accounts.map(account => [
        <RecordName key="account" name={account.name} meta={`${account.industry} - ${account.domain}`} />,
        account.owner,
        <StatusBadge key="stage" tone={account.status === "Priority" ? "accent" : "neutral"}>{account.stage}</StatusBadge>,
        formatCurrency(account.value),
        account.lastActivity,
        account.nextAction,
        <div key="actions" className="row-actions">
          <button className="icon-action" type="button" onClick={() => onEditAccount?.(account)} title={`Edit ${account.name}`} aria-label={`Edit ${account.name}`}>
            <Pencil size={16} />
          </button>
          <button className="icon-action" type="button" onClick={() => onOpenAccount(account.id)} title={`Open ${account.name}`} aria-label={`Open ${account.name}`}>
            <Eye size={16} />
          </button>
        </div>,
      ])}
    />
  );
}

function AccountDetailPage({ account, onOpenContact, onEditAccount, onQueueResearch, onNewContact, onNewDeal }) {
  const { contacts, deals } = useCrmData();
  const { formatCurrency } = useCurrency();
  const accountContacts = contacts.filter(contact => contact.accountId === account.id);
  const accountDeals = deals.filter(deal => deal.account === account.name);

  return (
    <>
      <PageHeader
        eyebrow="Target account"
        title={account.name}
        description={account.insight}
      >
        <button className="secondary-button" type="button" onClick={() => onEditAccount(account)}>Edit target account</button>
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
                <span className="muted-inline">{getContactPhoneNumber(contact) || "Phone number needed"}</span>
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
                <strong>{formatCurrency(deal.value)} with {deal.contact}</strong>
              </div>
            ))}
          </div> : <EmptyState icon={KanbanSquare} title="No deals for this account" text="Create a deal when there is a qualified opportunity to track." />}
        </section>
      </div>
      {account.scripts && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Target account intelligence</span>
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

function ContactsPage({ onOpenContact, onNewContact, onImportContacts, onRemoveContact, canDeleteContacts }) {
  const { contacts } = useCrmData();
  const importInputRef = useRef(null);
  const [importStatus, setImportStatus] = useState("idle");
  const [importMessage, setImportMessage] = useState("");
  const [query, setQuery] = useState("");
  const searchTerms = normalizeLookupValue(query).toLowerCase().split(/\s+/).filter(Boolean);
  const filteredContacts = searchTerms.length
    ? contacts.filter(contact => {
      const searchableText = [
        contact.name,
        contact.email,
        getContactMobileNumber(contact),
        getContactDirectDialNumber(contact),
        contact.role,
        contact.account,
      ].map(value => normalizeLookupValue(value).toLowerCase()).join(" ");
      return searchTerms.every(term => searchableText.includes(term));
    })
    : contacts;

  async function importContacts(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    setImportStatus("loading");
    setImportMessage("");
    try {
      const importedRows = (await Promise.all(files.map(parseContactImportFile))).flat();
      if (!importedRows.length) throw new Error("No contact rows found. Include contact name and company/account columns.");
      const result = onImportContacts?.(importedRows, files);
      setImportStatus("done");
      setImportMessage(`${result?.addedCount || importedRows.length} contacts imported from ${files.length} file${files.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setImportStatus("error");
      setImportMessage(error.message || "Could not import contacts.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Contacts"
        title="Contacts and personas"
        description="UX, product, design, and research stakeholders linked to the active target account list."
      >
        <input ref={importInputRef} className="visually-hidden" type="file" accept=".csv,.xlsx" multiple onChange={importContacts} />
        <button className="secondary-button" type="button" onClick={() => importInputRef.current?.click()} disabled={importStatus === "loading"}>
          {importStatus === "loading" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <Upload size={16} />}
          {importStatus === "loading" ? "Importing" : "Import contacts"}
        </button>
        <button className="primary-button" type="button" onClick={() => onNewContact()}>
          <Plus size={16} />
          Add contact
        </button>
      </PageHeader>
      <div className="contact-search-bar">
        <Search size={16} />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search contacts by name, email, phone, role, or account" />
        <span>{filteredContacts.length} of {contacts.length}</span>
      </div>
      {importMessage ? <div className={importStatus === "error" ? "form-error" : "form-success"}>{importMessage}</div> : null}
      <section className="panel">
        {contacts.length ? (
          filteredContacts.length
            ? <ContactTable contacts={filteredContacts} onOpenContact={onOpenContact} onRemoveContact={onRemoveContact} canDeleteContacts={canDeleteContacts} />
            : <EmptyState icon={Search} title="No matching contacts" text="Try a different name, email, phone number, role, or account." />
        ) : <EmptyState icon={Contact} title="No contacts yet" text="Add contacts after creating accounts, or import a contact list." />}
      </section>
    </>
  );
}

function ContactTable({ contacts, onOpenContact, onRemoveContact, canDeleteContacts }) {
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [confirmationValue, setConfirmationValue] = useState("");
  const [removalStatus, setRemovalStatus] = useState("idle");
  const [removalError, setRemovalError] = useState("");

  function openRemoval(contact) {
    setPendingRemoval(contact);
    setConfirmationValue("");
    setRemovalStatus("idle");
    setRemovalError("");
  }

  async function confirmRemoval() {
    if (!pendingRemoval || confirmationValue.trim() !== pendingRemoval.name) return;
    setRemovalStatus("saving");
    setRemovalError("");
    try {
      await onRemoveContact?.(pendingRemoval);
      setPendingRemoval(null);
      setConfirmationValue("");
      setRemovalStatus("idle");
    } catch (error) {
      setRemovalStatus("idle");
      setRemovalError(error?.message || "Could not archive contact.");
    }
  }

  return (
    <>
      <div className="contact-list-table">
        {contacts.map(contact => {
          const mobileNumber = getContactMobileNumber(contact);
          const directDialNumber = getContactDirectDialNumber(contact);
          const phoneNumber = getContactPhoneNumber(contact);
          return (
            <article
              key={contact.id}
              className="contact-list-row"
              role="button"
              tabIndex={0}
              onClick={() => onOpenContact(contact.id)}
              onKeyDown={event => {
                if (!["Enter", " "].includes(event.key)) return;
                event.preventDefault();
                onOpenContact(contact.id);
              }}
            >
              <div className="contact-list-person">
                <span className="record-avatar">{accountInitial(contact.name)}</span>
                <div>
                  <strong>{contact.name}</strong>
                  <span>{contact.role || "Role needed"}</span>
                  <small>{contact.account}</small>
                </div>
              </div>
              <div className="contact-list-phone">
                <span>Mobile</span>
                <strong>{mobileNumber || "Missing"}</strong>
              </div>
              <div className="contact-list-phone">
                <span>Direct</span>
                <strong>{directDialNumber || "Missing"}</strong>
              </div>
              <div className="contact-list-actions">
                <button className="icon-action" type="button" onClick={event => {
                  event.stopPropagation();
                  onOpenContact(contact.id);
                }} title={`Open ${contact.name}`} aria-label={`Open ${contact.name}`}>
                  <Eye size={16} />
                </button>
                {phoneNumber ? (
                  <div onClick={event => event.stopPropagation()} title={`Call ${phoneNumber}`} aria-label={`Call ${phoneNumber}`}>
                    <AircallDialButton contact={contact} compact />
                  </div>
                ) : null}
                {canDeleteContacts ? <button className="icon-action danger-button" type="button" onClick={event => {
                  event.stopPropagation();
                  openRemoval(contact);
                }} title={`Remove ${contact.name}`} aria-label={`Remove ${contact.name}`}>
                  <Trash2 size={16} />
                </button> : null}
              </div>
            </article>
          );
        })}
      </div>
      {pendingRemoval ? (
        <section className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setPendingRemoval(null);
        }}>
          <div className="workflow-modal confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="remove-contact-title">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Archive contact</span>
                <h2 id="remove-contact-title">{pendingRemoval.name}</h2>
              </div>
              <button className="icon-action" type="button" onClick={() => setPendingRemoval(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <p className="modal-helper-text">Type the contact name to archive this contact and remove it from CRM lists.</p>
            <FormField label={`Type ${pendingRemoval.name}`}>
              <input value={confirmationValue} onChange={event => setConfirmationValue(event.target.value)} autoFocus />
            </FormField>
            {removalError ? <div className="form-error">{removalError}</div> : null}
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setPendingRemoval(null)}>Cancel</button>
              <button className="secondary-button danger-button" type="button" onClick={confirmRemoval} disabled={removalStatus === "saving" || confirmationValue.trim() !== pendingRemoval.name}>
                {removalStatus === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <Trash2 size={16} />}
                {removalStatus === "saving" ? "Archiving" : "Archive contact"}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function ContactDetailPage({ contact, privateNote = "", onUpdateContact, onSavePrivateNote, onLogCall, onRemoveContact, canDeleteContacts }) {
  const { accounts } = useCrmData();
  const [outcome, setOutcome] = useState("Connected");
  const [noteDraft, setNoteDraft] = useState(privateNote);
  const [noteStatus, setNoteStatus] = useState("idle");
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("idle");
  const [deleteError, setDeleteError] = useState("");
  const [draft, setDraft] = useState(() => ({
    accountId: contact.accountId,
    name: contact.name || "",
    role: contact.role || "",
    email: contact.email || "",
    mobile: getContactMobileNumber(contact),
    directDial: getContactDirectDialNumber(contact),
  }));
  const phoneNumber = getContactPhoneNumber(contact);
  const mobileNumber = getContactMobileNumber(contact);
  const directDialNumber = getContactDirectDialNumber(contact);

  function updateDraft(field, value) {
    setDraft(current => ({ ...current, [field]: value }));
  }

  function saveContactChanges() {
    onUpdateContact?.({ id: contact.id, ...draft });
    setEditing(false);
  }

  async function archiveContact() {
    if (deleteConfirmation.trim() !== contact.name) return;
    setDeleteStatus("saving");
    setDeleteError("");
    try {
      await onRemoveContact?.(contact);
      setDeleteOpen(false);
    } catch (error) {
      setDeleteStatus("idle");
      setDeleteError(error?.message || "Could not archive contact.");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Contact detail"
        title={contact.name}
        description={`${contact.role} at ${contact.account}.`}
      >
        {phoneNumber ? <AircallDialButton contact={contact} /> : null}
        {canDeleteContacts ? (
          <button className="secondary-button danger-button" type="button" onClick={() => {
            setDeleteOpen(true);
            setDeleteConfirmation("");
            setDeleteError("");
            setDeleteStatus("idle");
          }}>
            <Trash2 size={16} />
            Delete contact
          </button>
        ) : null}
      </PageHeader>
      <div className="record-hero">
        <span className="record-avatar large">{accountInitial(contact.name)}</span>
        <div className="detail-list inline">
          <div><span>Account</span><strong>{contact.account}</strong></div>
          <div><span>Role</span><strong>{contact.role || "Role needed"}</strong></div>
        </div>
      </div>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header">
            <h2>Contact details</h2>
            {editing ? (
              <div className="row-actions">
                <button className="text-button" type="button" onClick={() => setEditing(false)}>Cancel</button>
                <button className="secondary-button" type="button" onClick={saveContactChanges}>Save</button>
              </div>
            ) : (
              <button className="secondary-button" type="button" onClick={() => setEditing(true)}>Edit</button>
            )}
          </div>
          {editing ? (
            <div className="detail-edit-grid">
              <FormField label="Account">
                <select value={draft.accountId} onChange={event => updateDraft("accountId", event.target.value)}>
                  {accounts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </FormField>
              <FormField label="Name">
                <input value={draft.name} onChange={event => updateDraft("name", event.target.value)} />
              </FormField>
              <FormField label="Role">
                <input value={draft.role} onChange={event => updateDraft("role", event.target.value)} />
              </FormField>
              <FormField label="Email">
                <input type="email" value={draft.email} onChange={event => updateDraft("email", event.target.value)} />
              </FormField>
              <FormField label="Mobile">
                <input value={draft.mobile} onChange={event => updateDraft("mobile", event.target.value)} />
              </FormField>
              <FormField label="Direct dial">
                <input value={draft.directDial} onChange={event => updateDraft("directDial", event.target.value)} />
              </FormField>
            </div>
          ) : (
            <div className="detail-list">
              <div><span>Email</span><strong>{contact.email || "Email needed"}</strong></div>
              <div><span>Mobile</span><strong>{mobileNumber || "Mobile needed"}</strong></div>
              <div><span>Direct dial</span><strong>{directDialNumber || "Direct dial needed"}</strong></div>
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Calls</span>
              <h2>Call outcome</h2>
            </div>
          </div>
          <div className="call-logger">
            <label>
              Outcome
              <select value={outcome} onChange={event => setOutcome(event.target.value)}>
                {callOutcomes.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
            <button className="primary-button" type="button" onClick={() => {
              onLogCall({ contactId: contact.id, outcome });
            }}>Save outcome</button>
          </div>
        </section>
        <section className="panel private-note-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Private</span>
              <h2>My notes</h2>
            </div>
          </div>
          <textarea value={noteDraft} placeholder="Only you can see notes saved here." onChange={event => {
            setNoteDraft(event.target.value);
            setNoteStatus("idle");
          }} />
          <div className="modal-actions">
            {noteStatus === "saved" ? <span className="muted-inline">Saved</span> : null}
            {noteStatus === "error" ? <span className="form-error">Could not save note.</span> : null}
            <button className="primary-button" type="button" disabled={noteStatus === "saving"} onClick={async () => {
              setNoteStatus("saving");
              try {
                await onSavePrivateNote?.(contact.id, noteDraft);
                setNoteStatus("saved");
              } catch {
                setNoteStatus("error");
              }
            }}>
              {noteStatus === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : null}
              {noteStatus === "saving" ? "Saving" : "Save note"}
            </button>
          </div>
        </section>
      </div>
      {deleteOpen ? (
        <section className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setDeleteOpen(false);
        }}>
          <div className="workflow-modal confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="archive-contact-detail-title">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Archive contact</span>
                <h2 id="archive-contact-detail-title">{contact.name}</h2>
              </div>
              <button className="icon-action" type="button" onClick={() => setDeleteOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <p className="modal-helper-text">Type the contact name to archive this contact and remove it from CRM lists.</p>
            <FormField label={`Type ${contact.name}`}>
              <input value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} autoFocus />
            </FormField>
            {deleteError ? <div className="form-error">{deleteError}</div> : null}
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setDeleteOpen(false)}>Cancel</button>
              <button className="secondary-button danger-button" type="button" onClick={archiveContact} disabled={deleteStatus === "saving" || deleteConfirmation.trim() !== contact.name}>
                {deleteStatus === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <Trash2 size={16} />}
                {deleteStatus === "saving" ? "Archiving" : "Archive contact"}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function PipelinePage({ activeClient, activeCampaign, onOpenAccount, onMoveDeal, onNewDeal, onUpdateStages }) {
  const { deals, accounts, pipelineStages } = useCrmData();
  const { formatCurrency } = useCurrency();
  const [draggedDealId, setDraggedDealId] = useState("");
  const [dropStage, setDropStage] = useState("");
  const [editingStages, setEditingStages] = useState(false);
  const [draftStages, setDraftStages] = useState(() => cloneRecords(pipelineStages || pipelineColumns));
  const scopedAccounts = activeClient?.id && activeClient.id !== "none"
    ? accounts.filter(account => account.clientId === activeClient.id)
    : accounts;
  const scopedAccountNames = new Set(scopedAccounts.map(account => account.name));
  const scopedDeals = deals.filter(deal => (
    scopedAccountNames.has(deal.account)
    && (!activeCampaign?.id || activeCampaign.id === "none" || !deal.campaignId || deal.campaignId === activeCampaign.id)
  ));

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
        description={`${activeClient?.name || "Client account"} pipeline${activeCampaign?.name && activeCampaign.id !== "none" ? ` for ${activeCampaign.name}` : ""}.`}
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
          const columnDeals = scopedDeals.filter(deal => deal.stage === column.id);
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
                      <small>{formatCurrency(deal.value)}</small>
                    </div>
                    <StatusBadge>{deal.due}</StatusBadge>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
      {!scopedDeals.length && (
        <section className="panel empty-board-panel">
          <EmptyState icon={KanbanSquare} title="No deals in this pipeline yet" text="Create target accounts and contacts inside the client account, then add deals to track pipeline." />
        </section>
      )}
    </>
  );
}

/*
Calls workspace disabled.
function CallsPage({ onOpenContact, onLogCall, onStartCallBlock }) {
  const { contacts, callInsights } = useCrmData();
  const [outcome, setOutcome] = useState("Connected");
  const [contactId, setContactId] = useState("");

  return (
    <>
      <PageHeader
        eyebrow="Calls"
        title="Call workspace"
        description="Call contacts with saved phone numbers and log outcomes to the CRM timeline."
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
            columns={["Contact", "Account", "Phone"]}
            rows={contacts.slice(0, 5).map(contact => [
              <RecordName key="contact" name={contact.name} meta={contact.role} />,
              contact.account,
              <div key="aircall" onClick={event => event.stopPropagation()}>
                <AircallDialButton contact={contact} />
              </div>,
            ])}
            rowActions={contacts.slice(0, 5).map(contact => () => onOpenContact(contact.id))}
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
            <button className="primary-button" type="button" disabled={!contacts.length} onClick={() => {
              onLogCall({ contactId: contactId || contacts[0]?.id, outcome });
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
*/

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
        title="Target account intelligence"
        description={`${activeClient?.name || "Client account"} research and scripts${activeCampaign?.name && activeCampaign.id !== "none" ? ` for ${activeCampaign.name}` : ""}.`}
      >
        <button className="secondary-button" type="button" onClick={onAddSource}>
          <Upload size={16} />
          Add source
        </button>
        <button className="primary-button" type="button" onClick={() => onQueueResearch()}>
          <ListFilter size={16} />
          Queue research
        </button>
        <button className="secondary-button" type="button" onClick={onGenerateScripts}>
          <FileText size={16} />
          Generate scripts
        </button>
      </PageHeader>
      <section className="panel research-scope-panel">
        <div className="results-summary">
          <div><span>Client account</span><strong>{activeClient?.name || "No client account"}</strong></div>
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
              Open target account <ArrowRight size={14} />
            </button>
          </article>
        )) : <section className="panel"><EmptyState icon={FileText} title="No research records yet" text="Research summaries will appear after accounts are added and research jobs are created." /></section>}
      </div>
      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Script builder</span>
            <h2>Script board</h2>
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

const contactImportColumnMap = {
  name: ["contact", "contact name", "name", "full name", "person", "lead", "lead name"],
  account: ["account", "account name", "company", "company name", "organisation", "organization"],
  role: ["role", "title", "job title", "position"],
  email: ["email", "email address", "work email"],
  mobile: ["mobile", "mobile phone", "mobile number", "cell", "cell phone"],
  directDial: ["direct", "direct dial", "direct phone", "direct number", "phone", "phone number", "telephone", "number"],
};

function normalizeImportHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function findImportColumnIndex(headerRow, aliases) {
  return headerRow.findIndex(cell => aliases.includes(normalizeImportHeader(cell)));
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

function dedupeContactImportRows(rows) {
  const seenContacts = new Set();
  const uniqueRows = [];

  for (const row of rows) {
    const contactName = String(row.name || "").trim();
    const accountName = String(row.account || "").trim();
    if (!contactName || !accountName) continue;
    const key = [
      contactName.toLowerCase(),
      accountName.toLowerCase(),
      normalizeEmail(row.email),
      normalizePhone(row.mobile),
      normalizePhone(row.directDial),
    ].join("|");
    if (seenContacts.has(key)) continue;
    seenContacts.add(key);
    uniqueRows.push({ ...row, name: contactName, account: accountName });
  }

  return uniqueRows;
}

function extractContactImportRowsFromSheet(rows, sourceFile, sourceSheet = "") {
  const headerRowIndex = rows.findIndex(row => (
    findImportColumnIndex(row, contactImportColumnMap.name) !== -1
    && findImportColumnIndex(row, contactImportColumnMap.account) !== -1
  ));
  if (headerRowIndex === -1) return [];

  const headerRow = rows[headerRowIndex];
  const nameColumnIndex = findImportColumnIndex(headerRow, contactImportColumnMap.name);
  const accountColumnIndex = findImportColumnIndex(headerRow, contactImportColumnMap.account);
  const roleColumnIndex = findImportColumnIndex(headerRow, contactImportColumnMap.role);
  const emailColumnIndex = findImportColumnIndex(headerRow, contactImportColumnMap.email);
  const mobileColumnIndex = findImportColumnIndex(headerRow, contactImportColumnMap.mobile);
  const directDialColumnIndex = findImportColumnIndex(headerRow, contactImportColumnMap.directDial);

  return rows
    .slice(headerRowIndex + 1)
    .map(row => ({
      name: String(row[nameColumnIndex] || "").trim(),
      account: String(row[accountColumnIndex] || "").trim(),
      role: roleColumnIndex === -1 ? "" : String(row[roleColumnIndex] || "").trim(),
      email: emailColumnIndex === -1 ? "" : normalizeEmail(row[emailColumnIndex]),
      mobile: mobileColumnIndex === -1 ? "" : String(row[mobileColumnIndex] || "").trim(),
      directDial: directDialColumnIndex === -1 ? "" : String(row[directDialColumnIndex] || "").trim(),
      sourceFile,
      sourceSheet,
    }))
    .filter(row => row.name && row.account);
}

async function parseContactImportFile(file) {
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
    return extractContactImportRowsFromSheet(rows, filename, extension === "csv" ? "" : sheetName);
  });

  return dedupeContactImportRows(importedRows);
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
  ["manualDirectDial", "Manual direct dial"],
  ["notes", "Notes"],
  ["dataSource", "Data source"],
  ["sourceNote", "Source note"],
  ["dbContactId", "PaceOps DB contact ID"],
  ["assignedUsers", "Assigned users"],
];
const cognismCsvExcludedColumns = new Set(["dataSource", "sourceNote", "dbContactId", "assignedUsers"]);

function cognismExportColumnsForFormat(format) {
  return format === "csv"
    ? cognismExportColumns.filter(([key]) => !cognismCsvExcludedColumns.has(key))
    : cognismExportColumns;
}

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

function exportFileExtension(format) {
  return format === "json" ? "json" : format === "xls" ? "xls" : "csv";
}

function sanitizeExportFilename(filename, fallbackBase, extension) {
  const strippedExtensionPattern = /\.(csv|xls|xlsx|json)$/i;
  const cleanedBase = String(filename || "")
    .trim()
    .replace(strippedExtensionPattern, "")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .trim();
  const fallback = String(fallbackBase || "lead-finder-export").replace(strippedExtensionPattern, "");
  return `${cleanedBase || fallback}.${extension}`;
}

function defaultLeadExportFilename(base, format) {
  const timestamp = new Date().toISOString().slice(0, 10);
  return sanitizeExportFilename(`${base || "lead-finder-export"}-${timestamp}`, "lead-finder-export", exportFileExtension(format));
}

function exportCognismResults(results, format, assignedUsers = [], requestedFilename = "") {
  const timestamp = new Date().toISOString().slice(0, 10);
  const extension = exportFileExtension(format);
  const filename = sanitizeExportFilename(requestedFilename, `lead-finder-preview-${timestamp}`, extension);
  const exportColumns = cognismExportColumnsForFormat(format);
  const assignedUserText = assignedUsers.map(user => `${user.name} <${user.email}>`).join("; ");
  const exportResults = results.map(result => ({
    ...result,
    assignedUsers: assignedUserText,
  }));

  if (format === "json") {
    downloadTextFile(
      filename,
      "application/json;charset=utf-8",
      JSON.stringify({ mode: "preview_only", estimatedCreditsUsed: 0, assignedUsers, results: exportResults }, null, 2),
    );
    return;
  }

  if (format === "xls") {
    const headerCells = exportColumns.map(([, label]) => `<th>${label}</th>`).join("");
    const rows = exportResults.map(result => (
      `<tr>${exportColumns.map(([key]) => `<td>${String(exportCellValue(result[key])).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</td>`).join("")}</tr>`
    )).join("");

    downloadTextFile(
      filename,
      "application/vnd.ms-excel;charset=utf-8",
      `<table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>`,
    );
    return;
  }

  const header = exportColumns.map(([, label]) => csvEscape(label)).join(",");
  const rows = exportResults.map(result => exportColumns.map(([key]) => csvEscape(result[key])).join(","));
  downloadTextFile(
    filename,
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
    manualDirectDial: "",
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
      manualDirectDial: normalizeLookupValue(draft.manualDirectDial),
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
                <th>Direct dial</th>
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
                          <AircallDialButton contact={{ id: contact.id }} phoneNumber={draft.manualMobile || draft.manualDirectDial || ""} source="lead_database" label="Call" compact />
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
                    <td className="lead-lookup-mobile" title={editMode ? draft.manualMobile || "" : contact.manualMobile || ""}>{editMode ? <input className="table-input" value={draft.manualMobile || ""} onChange={event => updateLookupDraft(contact, "manualMobile", event.target.value)} placeholder="+353 mobile" /> : contact.manualMobile || "Not available"}</td>
                    <td className="lead-lookup-mobile" title={editMode ? draft.manualDirectDial || "" : contact.manualDirectDial || ""}>{editMode ? <input className="table-input" value={draft.manualDirectDial || ""} onChange={event => updateLookupDraft(contact, "manualDirectDial", event.target.value)} placeholder="+353 direct" /> : contact.manualDirectDial || "Not available"}</td>
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
                  <td colSpan={editMode ? 11 : 10} className="empty-table-cell">
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
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
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

  function closeConfirmation() {
    setPendingConfirmation(null);
  }

  function confirmListAction(action) {
    setPendingConfirmation(action);
  }

  function requestListExport(format) {
    if (!exportableListLeads.length) return;
    confirmListAction({
      title: "Export lead list",
      message: `Export ${exportableListLeads.length} ${selectedLeads.length ? "selected" : "visible"} lead${exportableListLeads.length === 1 ? "" : "s"} from "${selectedList?.name || "this list"}" as ${format.toUpperCase()}?`,
      filenameLabel: "Export file name",
      defaultFilename: defaultLeadExportFilename(selectedList?.name || "lead-list", format),
      confirmLabel: "Export",
      onConfirm: filename => exportCognismResults(exportableListLeads, format, assignedUsers, filename),
    });
  }

  function requestListHubSpotExport() {
    if (!selectedList || !exportableListLeads.length) {
      setManualError("Select a lead list with at least one lead before exporting to HubSpot.");
      return;
    }
    confirmListAction({
      title: "Export to HubSpot",
      message: `Export ${exportableListLeads.length} ${selectedLeads.length ? "selected" : "visible"} lead${exportableListLeads.length === 1 ? "" : "s"} from "${selectedList.name}" to HubSpot?`,
      confirmLabel: "Export to HubSpot",
      onConfirm: exportSelectedListToHubSpot,
    });
  }

  function requestManualListSubmit() {
    const validationError = validateManualLeadList({ requireName: manualMode === "create" });
    if (validationError) {
      setManualError(validationError);
      return;
    }

    const isCreate = manualMode === "create";
    confirmListAction({
      title: isCreate ? "Create lead list" : "Add leads to list",
      message: isCreate
        ? `Create "${manualListName.trim()}" with ${cleanManualLeads.length} lead${cleanManualLeads.length === 1 ? "" : "s"}?`
        : `Add ${cleanManualLeads.length} lead${cleanManualLeads.length === 1 ? "" : "s"} to "${selectedList?.name || "this list"}"?`,
      confirmLabel: isCreate ? "Create list" : "Add to list",
      onConfirm: isCreate ? createManualList : appendManualLeads,
    });
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
      const payload = await readJsonResponse(response);
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
                    {listNameStatus === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <CheckCircle2 size={16} />}
                    {listNameStatus === "saving" ? "Saving" : listNameStatus === "saved" ? "Saved name" : "Save name"}
                  </button>
                  <button className="secondary-button" type="button" onClick={() => requestListExport("csv")} disabled={!exportableListLeads.length}>
                    <FileText size={16} />
                    {selectedLeads.length ? "Export selected CSV" : "Export CSV"}
                  </button>
                  <button className="secondary-button" type="button" onClick={() => requestListExport("xls")} disabled={!exportableListLeads.length}>
                    <FileText size={16} />
                    {selectedLeads.length ? "Export selected Excel" : "Export Excel"}
                  </button>
                  <button className="secondary-button" type="button" onClick={() => requestListExport("json")} disabled={!exportableListLeads.length}>
                    <FileText size={16} />
                    {selectedLeads.length ? "Export selected JSON" : "Export JSON"}
                  </button>
                  <button className="secondary-button" type="button" onClick={requestListHubSpotExport} disabled={listHubspotExportStatus === "exporting" || !displayedLeads.length}>
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
                <div className="result-selection-summary">
                  <span className="eyebrow">Lead rows</span>
                  <strong>{selectedLeads.length} of {displayedLeads.length} selected</strong>
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
                      <th>Direct dial</th>
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
                            <AircallDialButton contact={{ id: lead.dbContactId || buildLeadIdentityKey(lead) }} phoneNumber={draft.manualMobile || draft.manualDirectDial || ""} source="lead_database" label="Call" compact />
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
                        <td><input className="table-input" value={draft.manualMobile || ""} onChange={event => updateLeadEditDraft(lead, "manualMobile", event.target.value)} placeholder="+353 mobile" /></td>
                        <td><input className="table-input" value={draft.manualDirectDial || ""} onChange={event => updateLeadEditDraft(lead, "manualDirectDial", event.target.value)} placeholder="+353 direct" /></td>
                        <td><AircallDialButton contact={{ id: lead.dbContactId || buildLeadIdentityKey(lead) }} phoneNumber={draft.manualMobile || draft.manualDirectDial || ""} source="lead_database" label="Call" compact /></td>
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
                              {leadEditStatuses[key] === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <Database size={16} />}
                              {leadEditStatuses[key] === "saving" ? "Saving" : leadEditStatuses[key] === "saved" ? "Saved" : "Save"}
                            </button>
                            <button className="secondary-button danger-button" type="button" onClick={() => removeLeadFromList(lead)} disabled={leadEditStatuses[key] === "removing"}>
                              {leadEditStatuses[key] === "removing" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <Circle size={16} />}
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
                        <th>Direct dial</th>
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
                          <td><input value={lead.manualMobile} onChange={event => updateManualLead(lead.localId, "manualMobile", event.target.value)} placeholder="+353 mobile" /></td>
                          <td><input value={lead.manualDirectDial} onChange={event => updateManualLead(lead.localId, "manualDirectDial", event.target.value)} placeholder="+353 direct" /></td>
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
                  <button className="primary-button" type="button" onClick={requestManualListSubmit} disabled={manualStatus === "saving"}>
                    {manualStatus === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <ListFilter size={16} />}
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
                {accessStatus === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <Users size={16} />}
                {accessStatus === "saving" ? "Saving" : "Save sharing"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      <HubSpotExportResultModal result={listHubspotExportDialog} onClose={() => setListHubspotExportDialog(null)} />
      {pendingConfirmation ? (
        <ConfirmationModal
          eyebrow="Lead Lists"
          title={pendingConfirmation.title}
          message={pendingConfirmation.message}
          filenameLabel={pendingConfirmation.filenameLabel}
          defaultFilename={pendingConfirmation.defaultFilename}
          confirmLabel={pendingConfirmation.confirmLabel}
          onCancel={closeConfirmation}
          onConfirm={filename => {
            const action = pendingConfirmation.onConfirm;
            closeConfirmation();
            action?.(filename);
          }}
        />
      ) : null}
    </>
  );
}

function CognismContactFinder({ contactDatabase = [], onSaveLeadList, onSaveLeadContact, onPersistSearchResults, cognismPreviewEnabled = true, canUseRedeemMode = false, currentUserId = "" }) {
  const { workspaceUsers = [] } = useCrmData();
  const savedSearchState = loadLeadFinderSearchState();
  const companyImportInputRef = useRef(null);
  const redeemedPhoneRepairSaveKeysRef = useRef(new Set());
  const defaultAssignedUserId = currentUserId || workspaceUsers[0]?.id || "";
  const defaultAssignedUserIds = defaultAssignedUserId ? [defaultAssignedUserId] : [];
  const [companiesText, setCompaniesText] = useState(savedSearchState?.companiesText || "");
  const [roleQuery, setRoleQuery] = useState(savedSearchState?.roleQuery || "");
  const [suggestedRoles, setSuggestedRoles] = useState(Array.isArray(savedSearchState?.suggestedRoles) ? savedSearchState.suggestedRoles : []);
  const [selectedRoles, setSelectedRoles] = useState(Array.isArray(savedSearchState?.selectedRoles) ? savedSearchState.selectedRoles : []);
  const [selectedUserIds, setSelectedUserIds] = useState(Array.isArray(savedSearchState?.selectedUserIds) && savedSearchState.selectedUserIds.length ? savedSearchState.selectedUserIds : defaultAssignedUserIds);
  const [maxPerCompany, setMaxPerCompany] = useState(String(savedSearchState?.maxPerCompany || DEFAULT_MAX_CONTACTS_PER_COMPANY));
  const [requireMobileAvailable, setRequireMobileAvailable] = useState(savedSearchState?.requireMobileAvailable === false ? false : true);
  const [requireDirectDialAvailable, setRequireDirectDialAvailable] = useState(savedSearchState?.requireDirectDialAvailable === true);
  const [redeemReviewActive, setRedeemReviewActive] = useState(savedSearchState?.redeemReviewActive === true);
  const [countryQuery, setCountryQuery] = useState("");
  const [selectedCountries, setSelectedCountries] = useState(Array.isArray(savedSearchState?.selectedCountries) ? savedSearchState.selectedCountries : []);
  const [leadListName, setLeadListName] = useState(savedSearchState?.leadListName || "");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [customRolesText, setCustomRolesText] = useState(savedSearchState?.customRolesText || "");
  const [results, setResults] = useState(hydrateLeadsWithContactDatabase(Array.isArray(savedSearchState?.results) ? savedSearchState.results : [], contactDatabase));
  const [selectedResultIds, setSelectedResultIds] = useState(Array.isArray(savedSearchState?.selectedResultIds) ? savedSearchState.selectedResultIds : []);
  const [meta, setMeta] = useState(savedSearchState?.meta && typeof savedSearchState.meta === "object" ? savedSearchState.meta : { mode: "preview_only", estimatedCreditsUsed: 0, maxPerCompany: DEFAULT_MAX_CONTACTS_PER_COMPANY, requireMobileAvailable: false, requireDirectDialAvailable: false, countries: [] });
  const [status, setStatus] = useState(Array.isArray(savedSearchState?.results) && savedSearchState.results.length ? "done" : "idle");
  const [roleStatus, setRoleStatus] = useState("idle");
  const [roleMode, setRoleMode] = useState("");
  const [error, setError] = useState("");
  const [hubspotExportStatus, setHubspotExportStatus] = useState("idle");
  const [hubspotExportSummary, setHubspotExportSummary] = useState("");
  const [hubspotExportDialog, setHubspotExportDialog] = useState(null);
  const [redeemStatus, setRedeemStatus] = useState("idle");
  const [redeemDiagnostics, setRedeemDiagnostics] = useState(null);
  const [, setRedeemDiagnosticsCopyStatus] = useState("");
  const [companyImportOpen, setCompanyImportOpen] = useState(false);
  const [companyImportRows, setCompanyImportRows] = useState([]);
  const [selectedCompanyImportKeys, setSelectedCompanyImportKeys] = useState([]);
  const [companyImportStatus, setCompanyImportStatus] = useState("idle");
  const [companyImportError, setCompanyImportError] = useState("");
  const [resultCompanyFilter, setResultCompanyFilter] = useState("");
  const [companyListSaveStatus, setCompanyListSaveStatus] = useState("idle");
  const [redeemConfirmOpen, setRedeemConfirmOpen] = useState(false);
  const [redeemConfirmCount, setRedeemConfirmCount] = useState(0);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
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
  const companyImportKeySet = new Set(selectedCompanyImportKeys);
  const selectedCompanyImportRows = companyImportRows.filter(row => companyImportKeySet.has(companyImportRowKey(row)));
  const companyImportFileCount = new Set(companyImportRows.map(row => row.sourceFile).filter(Boolean)).size;
  const selectedCompanyImportNewCompanyCount = selectedCompanyImportRows.filter(row => !existingCompanyKeys.has(row.companyName.toLowerCase())).length;
  const selectedLeadsNeedingSavedPhoneData = selectedResults.filter(lead => leadNeedsSavedPhoneData(lead, contactDatabase));
  const selectedMissingPhoneSummary = summarizeMissingPhoneData(selectedLeadsNeedingSavedPhoneData, contactDatabase);
  const redeemableResultEntries = results
    .map((result, index) => ({ result, index, resultId: leadResultId(result, index) }))
    .filter(({ result }) => leadNeedsSavedPhoneData(result, contactDatabase));
  const displayedRedeemableEntries = displayedResultEntries.filter(({ result }) => leadNeedsSavedPhoneData(result, contactDatabase));
  const canOfferRedeemReview = canUseRedeemMode && status === "done" && results.length > 0;
  const displayModeLabel = redeemReviewActive ? "Redeem" : "Preview";
  const displayCreditsLabel = `Credits: ${meta.estimatedCreditsUsed || 0}`;
  const displayMaxPerCompany = Math.max(Number(maxPerCompany) || DEFAULT_MAX_CONTACTS_PER_COMPANY, 1);
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
      requireDirectDialAvailable,
      redeemReviewActive,
      selectedCountries,
      leadListName,
      customRolesText,
      results,
      selectedResultIds,
      meta,
    });
  }, [companiesText, customRolesText, leadListName, maxPerCompany, meta, redeemReviewActive, requireDirectDialAvailable, requireMobileAvailable, results, roleQuery, selectedCountries, selectedResultIds, selectedRoles, selectedUserIds, suggestedRoles]);

  useEffect(() => {
    if (!defaultAssignedUserId) return;
    setSelectedUserIds(current => current.length ? current : [defaultAssignedUserId]);
  }, [defaultAssignedUserId]);

  useEffect(() => {
    if (!canUseRedeemMode && redeemReviewActive) setRedeemReviewActive(false);
  }, [canUseRedeemMode, redeemReviewActive]);

  useEffect(() => {
    if (!redeemDiagnostics?.mappedRedeemed?.length || !redeemDiagnostics?.rawCognismRecords?.length) return;
    const correctedRows = correctRedeemedRowsFromRawRecords(redeemDiagnostics.mappedRedeemed, redeemDiagnostics.rawCognismRecords);
    const correctedByKey = new Map();
    correctedRows.forEach(lead => {
      [lead.rowId, lead.cognismRedeemId, lead.cognismContactId].map(normalizeLookupValue).filter(Boolean).forEach(key => correctedByKey.set(key, lead));
    });

    const repairsToSave = [];
    let changed = false;
    const nextResults = results.map((result, index) => {
      const rowId = leadResultId(result, index);
      const correctedLead = correctedByKey.get(normalizeLookupValue(rowId))
        || correctedByKey.get(normalizeLookupValue(result.cognismRedeemId))
        || correctedByKey.get(normalizeLookupValue(result.cognismContactId));
      if (!correctedLead) return result;
      const nextResult = hydrateLeadWithContactDatabase({ ...result, ...correctedLead, rowId }, contactDatabase);
      if (
        nextResult.manualMobile !== result.manualMobile
        || nextResult.manualDirectDial !== result.manualDirectDial
        || nextResult.manualEmail !== result.manualEmail
      ) {
        changed = true;
        const saveKey = normalizeLookupValue(nextResult.cognismContactId || nextResult.rowId || rowId);
        if (saveKey && !redeemedPhoneRepairSaveKeysRef.current.has(saveKey)) {
          redeemedPhoneRepairSaveKeysRef.current.add(saveKey);
          repairsToSave.push(nextResult);
        }
      }
      return nextResult;
    });
    if (!changed) return;

    setResults(nextResults);
    repairsToSave.forEach(lead => {
      onSaveLeadContact(lead, { allowPreviewOnly: true, skipConflictPrompt: true }).catch(() => {
        redeemedPhoneRepairSaveKeysRef.current.delete(normalizeLookupValue(lead.cognismContactId || lead.rowId));
      });
    });
  }, [contactDatabase, onSaveLeadContact, redeemDiagnostics, results]);

  useEffect(() => {
    if (!hubspotExportSummary) return undefined;
    const timer = window.setTimeout(() => setHubspotExportSummary(""), 5000);
    return () => window.clearTimeout(timer);
  }, [hubspotExportSummary]);

  function leadResultId(result, index) {
    return result.cognismContactId || `${result.company || "company"}-${result.contactName || "contact"}-${result.jobTitle || "title"}-${index}`;
  }

  function companyImportRowKey(row) {
    return `${row.sourceFile || "file"}|${row.sourceSheet || "csv"}|${row.companyName}`;
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

  function selectRedeemableRows(entries = redeemableResultEntries) {
    setSelectedResultIds(entries.map(({ resultId, result, index }) => resultId || leadResultId(result, index)));
  }

  function clearSearch() {
    clearLeadFinderSearchState();
    setCompaniesText("");
    setRoleQuery("");
    setSuggestedRoles([]);
    setSelectedRoles([]);
    setSelectedUserIds(defaultAssignedUserIds);
    setMaxPerCompany(String(DEFAULT_MAX_CONTACTS_PER_COMPANY));
    setRequireMobileAvailable(true);
    setRedeemReviewActive(false);
    setCountryQuery("");
    setSelectedCountries([]);
    setLeadListName("");
    setSaveStatus("idle");
    setRedeemStatus("idle");
    setRedeemDiagnostics(null);
    setRedeemDiagnosticsCopyStatus("");
    setCustomRolesText("");
    setResults([]);
    setSelectedResultIds([]);
    setMeta({ mode: "preview_only", estimatedCreditsUsed: 0, maxPerCompany: DEFAULT_MAX_CONTACTS_PER_COMPANY, requireMobileAvailable: true, requireDirectDialAvailable: false, countries: [] });
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
    setSelectedCompanyImportKeys([]);
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
      const nextRows = dedupeCompanyImportRows([...companyImportRows, ...parsedRows]);
      setCompanyImportRows(nextRows);
      setSelectedCompanyImportKeys(current => {
        const currentKeys = new Set(current);
        nextRows.forEach(row => currentKeys.add(companyImportRowKey(row)));
        return nextRows.map(companyImportRowKey).filter(key => currentKeys.has(key));
      });
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
    const importedCompanies = selectedCompanyImportRows
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

  function toggleCompanyImportRow(row) {
    const key = companyImportRowKey(row);
    setSelectedCompanyImportKeys(current => current.includes(key)
      ? current.filter(item => item !== key)
      : [...current, key]);
  }

  function selectAllCompanyImportRows() {
    setSelectedCompanyImportKeys(companyImportRows.map(companyImportRowKey));
  }

  function deselectAllCompanyImportRows() {
    setSelectedCompanyImportKeys([]);
  }

  function updateMaxPerCompany(value) {
    const digitsOnly = value.replace(/\D/g, "");
    setMaxPerCompany(digitsOnly);
  }

  function normalizeMaxPerCompany() {
    setMaxPerCompany(current => String(Math.max(Number(current) || 1, 1)));
  }

  function requestRedeemSelectedMissingData() {
    if (!canUseRedeemMode) {
      setError("Redeem access is not enabled for this workspace.");
      return;
    }
    if (status !== "done" || !results.length) {
      setError("Run a preview before redeeming contacts.");
      return;
    }
    if (!selectedResults.length) {
      setError("Select at least one preview row before redeeming.");
      return;
    }
    if (!selectedLeadsNeedingSavedPhoneData.length) {
      setError("All selected leads already have saved mobile and direct dial data in the PaceOps lead database.");
      return;
    }
    if (selectedLeadsNeedingSavedPhoneData.length > 20) {
      setError("Redeem up to 20 selected leads at a time.");
      return;
    }
    if (selectedLeadsNeedingSavedPhoneData.some(lead => !normalizeLookupValue(lead.cognismRedeemId))) {
      setError("Run a fresh preview before redeeming. These saved preview rows do not include Cognism redeem IDs.");
      return;
    }
    setRedeemConfirmCount(selectedLeadsNeedingSavedPhoneData.length);
    setRedeemConfirmOpen(true);
  }

  async function confirmRedeemSelectedMissingData() {
    const redeemEntries = selectedResultEntries.filter(({ result }) => leadNeedsSavedPhoneData(result, contactDatabase));
    if (!redeemEntries.length) {
      setRedeemConfirmOpen(false);
      setError("No selected leads need redeem data.");
      return;
    }
    if (redeemEntries.length > 20) {
      setError("Redeem up to 20 selected leads at a time.");
      return;
    }
    if (redeemEntries.some(({ result }) => !normalizeLookupValue(result.cognismRedeemId))) {
      setRedeemConfirmOpen(false);
      setError("Run a fresh preview before redeeming. These saved preview rows do not include Cognism redeem IDs.");
      return;
    }

    setRedeemStatus("loading");
    setRedeemDiagnostics(null);
    setRedeemDiagnosticsCopyStatus("");
    setError("");

    try {
      const response = await fetch("/api/cognism/redeem", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({
          leads: redeemEntries.map(({ result, resultId }) => ({
            ...result,
            rowId: resultId,
            redeemId: result.cognismRedeemId,
          })),
          debug: true,
        }),
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error || "Redeem request failed");

      const rawCognismRecords = payload.diagnostics?.rawRecords || [];
      const redeemedRows = correctRedeemedRowsFromRawRecords(Array.isArray(payload.redeemed) ? payload.redeemed : [], rawCognismRecords);
      const redeemedByKey = new Map();
      redeemedRows.forEach(lead => {
        [lead.rowId, lead.cognismRedeemId, lead.cognismContactId].map(normalizeLookupValue).filter(Boolean).forEach(key => redeemedByKey.set(key, lead));
      });

      const nextSelectedIds = redeemEntries.map(({ resultId }) => resultId);
      const nextResults = results.map((result, index) => {
        const rowId = leadResultId(result, index);
        const redeemedLead = redeemedByKey.get(normalizeLookupValue(rowId))
          || redeemedByKey.get(normalizeLookupValue(result.cognismRedeemId))
          || redeemedByKey.get(normalizeLookupValue(result.cognismContactId));
        return redeemedLead ? hydrateLeadWithContactDatabase({ ...result, ...redeemedLead, rowId }, contactDatabase) : result;
      });

      setResults(nextResults);

      const savedContacts = [];
      for (const redeemedLead of redeemedRows) {
        const matchingLead = nextResults.find((result, index) => leadResultId(result, index) === redeemedLead.rowId)
          || hydrateLeadWithContactDatabase(redeemedLead, contactDatabase);
        try {
          const savedContact = await onSaveLeadContact(matchingLead, { allowPreviewOnly: true, skipConflictPrompt: true });
          savedContacts.push(savedContact);
        } catch {
          // Keep redeemed values visible even if local persistence is unavailable.
        }
      }

      if (savedContacts.length) {
        setResults(current => hydrateLeadsWithContactDatabase(current, savedContacts));
      }

      const nextRedeemDiagnostics = {
        requestedAt: new Date().toISOString(),
        requested: redeemEntries.map(({ result, resultId }) => ({
          rowId: resultId,
          contactName: result.contactName,
          company: result.company,
          jobTitle: result.jobTitle,
          cognismContactId: result.cognismContactId,
          cognismRedeemId: result.cognismRedeemId,
          currentManualEmail: result.manualEmail || "",
          currentManualMobile: result.manualMobile || "",
          currentManualDirectDial: result.manualDirectDial || "",
        })),
        mappedRedeemed: redeemedRows,
        rawCognismRecords,
      };
      setRedeemDiagnostics(nextRedeemDiagnostics);
      try {
        await navigator.clipboard.writeText(JSON.stringify(nextRedeemDiagnostics, null, 2));
        setRedeemDiagnosticsCopyStatus("Copied to clipboard");
      } catch {
        setRedeemDiagnosticsCopyStatus("Clipboard copy failed. Use the JSON below.");
      }

      setSelectedResultIds(current => current.filter(resultId => nextSelectedIds.includes(resultId)));
      setRedeemReviewActive(true);
      setMeta(current => ({
        ...current,
        mode: payload.mode || "redeem",
        estimatedCreditsUsed: payload.estimatedCreditsUsed ?? redeemedRows.length,
        maxPerCompany: Math.max(Number(maxPerCompany) || DEFAULT_MAX_CONTACTS_PER_COMPANY, 1),
        requireMobileAvailable,
        requireDirectDialAvailable,
        countries: selectedCountries,
        warning: [
          payload.warning,
          savedContacts.length < redeemedRows.length ? "Redeemed values are shown, but some rows were not saved to the PaceOps lead database in this local session." : "",
        ].filter(Boolean).join(" "),
      }));
      setRedeemConfirmOpen(false);
      setRedeemStatus("done");
    } catch (redeemError) {
      setError(redeemError.message || "Redeem request failed");
      setRedeemStatus("error");
    }
  }

  function updateResultField(resultId, field, value) {
    setResults(current => current.map((result, index) => {
      if (leadResultId(result, index) !== resultId) return result;
      const nextResult = {
        ...result,
        [field]: value,
      };
      if (["manualEmail", "manualMobile", "manualDirectDial", "linkedinProfileUrl", "notes"].includes(field)) {
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

  function closeConfirmation() {
    setPendingConfirmation(null);
  }

  function confirmLeadFinderAction(action) {
    setPendingConfirmation(action);
  }

  function requestSaveLeadList() {
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
    confirmLeadFinderAction({
      title: "Save lead list",
      message: `Save ${selectedResults.length} selected lead${selectedResults.length === 1 ? "" : "s"} to "${leadListName.trim()}"?`,
      confirmLabel: "Save lead list",
      onConfirm: saveLeadList,
    });
  }

  function requestSaveCompanyLeadList() {
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
    confirmLeadFinderAction({
      title: "Save company list",
      message: `Save ${displayedResults.length} visible lead${displayedResults.length === 1 ? "" : "s"} for ${resultCompanyFilter} as a lead list?`,
      confirmLabel: "Save company list",
      onConfirm: saveFilteredCompanyLeadList,
    });
  }

  function requestExportResults(format) {
    if (!selectedResults.length) return;
    confirmLeadFinderAction({
      title: "Export selected leads",
      message: `Export ${selectedResults.length} selected lead${selectedResults.length === 1 ? "" : "s"} as ${format.toUpperCase()}?`,
      filenameLabel: "Export file name",
      defaultFilename: defaultLeadExportFilename("lead-finder-selected", format),
      confirmLabel: "Export",
      onConfirm: filename => exportCognismResults(selectedResults, format, selectedUsers, filename),
    });
  }

  function requestHubSpotExport() {
    if (!selectedResults.length) return;
    confirmLeadFinderAction({
      title: "Export to HubSpot",
      message: `Export ${selectedResults.length} selected lead${selectedResults.length === 1 ? "" : "s"} to HubSpot?`,
      confirmLabel: "Export to HubSpot",
      onConfirm: exportSelectedToHubSpot,
    });
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
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error || "Role suggestion failed");
      const roles = Array.isArray(payload.roles) ? payload.roles : [];
      if (!roles.length) throw new Error("Role taxonomy returned no role options.");
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
    if (!cognismPreviewEnabled) {
      setError("Cognism preview is disabled by an administrator.");
      return;
    }

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
    setRedeemStatus("idle");
    setRedeemDiagnostics(null);
    setRedeemDiagnosticsCopyStatus("");
    setRedeemReviewActive(false);
    setStatus("loading");
    setSelectedUserIds(defaultAssignedUserIds);
    setResultCompanyFilter("");
    setCompanyListSaveStatus("idle");

    try {
      const response = await fetch("/api/cognism/preview", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({ companies, targetTitles, maxPerCompany: requestedMax, requireMobileAvailable, requireDirectDialAvailable, countries: selectedCountries }),
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error || "Preview request failed");
      setMeta({
        mode: payload.mode,
        estimatedCreditsUsed: payload.estimatedCreditsUsed,
        maxPerCompany: payload.maxPerCompany,
        requireMobileAvailable: Boolean(payload.requireMobileAvailable),
        requireDirectDialAvailable: Boolean(payload.requireDirectDialAvailable),
        countries: Array.isArray(payload.countries) ? payload.countries : [],
        warning: payload.warning || "",
      });
      const incomingResults = hydrateLeadsWithContactDatabase(Array.isArray(payload.results) ? payload.results : [], contactDatabase);
      const mergedResults = mergeLeadResults(results, incomingResults);
      setResults(mergedResults);
      setSelectedResultIds(mergedResults
        .map((result, index) => ({ result, index }))
        .filter(({ result }) => leadNeedsSavedPhoneData(result, contactDatabase))
        .map(({ result, index }) => leadResultId(result, index)));
      try {
        const savedContacts = await onPersistSearchResults(mergedResults);
        const hydratedResults = hydrateLeadsWithContactDatabase(mergedResults, [...contactDatabase, ...savedContacts]);
        setResults(hydratedResults);
        setSelectedResultIds(hydratedResults
          .map((result, index) => ({ result, index }))
          .filter(({ result }) => leadNeedsSavedPhoneData(result, [...contactDatabase, ...savedContacts]))
          .map(({ result, index }) => leadResultId(result, index)));
      } catch (persistError) {
        setMeta(current => ({
          ...current,
          warning: [current.warning, "Preview results are shown, but they were not saved to the PaceOps lead database in this local session."].filter(Boolean).join(" "),
        }));
      }
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
          requireDirectDialAvailable,
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
          requireDirectDialAvailable,
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
      const payload = await readJsonResponse(response);
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
          Full data disabled in test mode
        </button>
      </PageHeader>

      <div className="cognism-layout">
        <section className="panel cognism-controls">
          <div className="panel-header">
            <div>
            <span className="eyebrow">Search inputs</span>
            <h2>Any client account or target account list</h2>
          </div>
          <StatusBadge tone="accent">Configurable max</StatusBadge>
        </div>
          <div className="finder-input-section filter-section lead-filter-panel">
            <div className="finder-section-heading unnumbered">
              <div>
                <strong>Lead filters</strong>
                <small>Control volume and contact availability.</small>
              </div>
            </div>
            <div className="finder-priority-controls">
              <div className="finder-availability-filters">
                <label className={`role-choice mobile-filter-choice ${requireMobileAvailable ? "selected" : ""}`}>
                  <input type="checkbox" checked={requireMobileAvailable} onChange={event => setRequireMobileAvailable(event.target.checked)} />
                  <span>
                    <strong>Must include mobile</strong>
                    <small>Only return leads with mobile numbers.</small>
                  </span>
                </label>
                <label className={`role-choice mobile-filter-choice ${requireDirectDialAvailable ? "selected" : ""}`}>
                  <input type="checkbox" checked={requireDirectDialAvailable} onChange={event => setRequireDirectDialAvailable(event.target.checked)} />
                  <span>
                    <strong>Must include direct dial</strong>
                    <small>Only return leads with direct numbers.</small>
                  </span>
                </label>
              </div>
              <label className="form-field max-contacts-field">
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
            </div>
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
              {roleStatus === "loading" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <ListFilter size={16} />}
              {roleStatus === "loading" ? "Loading roles" : "Load role options"}
            </button>
            {roleStatus === "loading" ? (
              <span className="inline-loading-status" role="status" aria-live="polite">
                Matching persona to role taxonomy...
              </span>
            ) : null}
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
              <StatusBadge>{targetCompanyCount} target{targetCompanyCount === 1 ? "" : "s"}</StatusBadge>
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
          <div className="finder-input-section geography-section country-picker">
            <div className="finder-section-heading">
              <span>3</span>
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
              <EmptyState icon={Users} title="No users found" text="PaceOps users will appear here after they sign in to the analytics workspace." />
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
            {roleMode ? <StatusBadge>{roleMode === "taxonomy" ? "Taxonomy suggested" : "Fallback suggested"}</StatusBadge> : null}
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
        <button className="primary-button" type="button" onClick={() => previewContacts()} disabled={status === "loading" || !cognismPreviewEnabled} aria-busy={status === "loading"}>
          {status === "loading" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <Search size={16} />}
          {status === "loading" ? "Retrieving" : "Retrieve preview"}
        </button>
        {canOfferRedeemReview ? (
          <button className="secondary-button success-button" type="button" onClick={requestRedeemSelectedMissingData} disabled={redeemStatus === "loading" || !selectedLeadsNeedingSavedPhoneData.length}>
            {redeemStatus === "loading" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <LockKeyhole size={16} />}
            {redeemStatus === "loading" ? "Redeeming" : selectedLeadsNeedingSavedPhoneData.length ? `Redeem ${selectedLeadsNeedingSavedPhoneData.length} missing` : "Redeem missing data"}
          </button>
        ) : null}
        <button className="secondary-button danger-button" type="button" onClick={clearSearch}>
          <Circle size={16} />
          Clear search
        </button>
        {status === "loading" ? (
          <span className="retrieve-loading-status" role="status" aria-live="polite">
            Searching lead data. Results will appear below.
          </span>
        ) : null}
        {!cognismPreviewEnabled ? (
          <span className="retrieve-loading-status warning" role="status">
            Cognism preview is disabled by an administrator.
          </span>
        ) : null}
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Preview results</span>
            <h2>Lead matches</h2>
          </div>
          <div className="cognism-meta">
            <StatusBadge tone="success">{displayModeLabel}</StatusBadge>
            <StatusBadge>{displayCreditsLabel}</StatusBadge>
            <StatusBadge>Max: {displayMaxPerCompany}</StatusBadge>
            {requireMobileAvailable ? <StatusBadge>Mobile required</StatusBadge> : null}
            {requireDirectDialAvailable ? <StatusBadge>Direct required</StatusBadge> : null}
            {selectedCountries.length ? <StatusBadge>{selectedCountries.join(", ")}</StatusBadge> : null}
          </div>
        </div>
        {meta.warning ? <div className="form-success warning">{meta.warning}</div> : null}
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
            <button className="primary-button" type="button" onClick={requestSaveCompanyLeadList} disabled={companyListSaveStatus === "saving" || !displayedResults.length}>
              {companyListSaveStatus === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <ListFilter size={16} />}
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
          <button className="primary-button" type="button" onClick={requestSaveLeadList} disabled={saveStatus === "saving" || !selectedResults.length}>
            {saveStatus === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <ListFilter size={16} />}
            {saveStatus === "saving" ? "Saving" : saveStatus === "saved" ? "Saved" : "Save lead list"}
          </button>
          <button className="secondary-button" type="button" disabled={!selectedResults.length} onClick={() => requestExportResults("csv")}>
            <FileText size={16} />
            Export selected CSV
          </button>
          <button className="secondary-button" type="button" disabled={!selectedResults.length} onClick={() => requestExportResults("xls")}>
            <FileText size={16} />
            Export selected Excel
          </button>
          <button className="secondary-button" type="button" disabled={!selectedResults.length} onClick={() => requestExportResults("json")}>
            <FileText size={16} />
            Export selected JSON
          </button>
          <button className="secondary-button" type="button" onClick={requestHubSpotExport} disabled={hubspotExportStatus === "exporting" || !selectedResults.length}>
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
          <div className="role-actions">
            <button className="secondary-button success-button" type="button" onClick={() => selectRedeemableRows(displayedRedeemableEntries)} disabled={!displayedRedeemableEntries.length}>
              <LockKeyhole size={16} />
              Select missing visible
            </button>
            <button className="secondary-button" type="button" onClick={() => {
              const visibleIds = displayedResultEntries.map(({ result, index }) => leadResultId(result, index));
              if (selectedDisplayedResults.length === displayedResults.length) {
                const visibleIdSet = new Set(visibleIds);
                setSelectedResultIds(current => current.filter(resultId => !visibleIdSet.has(resultId)));
                return;
              }
              setSelectedResultIds(current => [...new Set([...current, ...visibleIds])]);
            }} disabled={!displayedResultEntries.length}>
              {selectedDisplayedResults.length === displayedResults.length ? <Circle size={16} /> : <CheckCircle2 size={16} />}
              {selectedDisplayedResults.length === displayedResults.length ? "Deselect visible" : "Select visible"}
            </button>
          </div>
          <div className="result-selection-summary">
            <span className="eyebrow">Generated rows</span>
            <strong>{selectedDisplayedResults.length} of {displayedResults.length} visible selected, {selectedResults.length} total selected</strong>
            {canOfferRedeemReview ? <small>{selectedLeadsNeedingSavedPhoneData.length} selected need redeem. Complete phone rows are skipped automatically.</small> : null}
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
                <th>Direct dial</th>
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
                    <input
                      className="table-input"
                      value={result.manualDirectDial || ""}
                      onChange={event => updateResultField(resultId, "manualDirectDial", event.target.value)}
                      onBlur={() => leadHasPaceOpsData(result) && saveContactResult(resultId)}
                      placeholder="+353 direct"
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
                  <td colSpan="13" className="empty-table-cell">
                    {status === "done" ? "No preview matches returned for this company filter." : "Run a preview to see lead metadata."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {redeemConfirmOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setRedeemConfirmOpen(false);
        }}>
          <section className="workflow-modal confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="redeem-confirm-title">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Lead Finder</span>
                <h2 id="redeem-confirm-title">Missing phone details</h2>
              </div>
              <button className="icon-action" type="button" onClick={() => setRedeemConfirmOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="redeem-choice-summary">
              <strong>{redeemConfirmCount} selected lead{redeemConfirmCount === 1 ? " needs" : "s need"} phone data</strong>
              <div className="redeem-missing-grid">
                {selectedMissingPhoneSummary.missingMobile ? (
                  <div>
                    <span>{selectedMissingPhoneSummary.missingMobile}</span>
                    <small>missing mobile</small>
                  </div>
                ) : null}
                {selectedMissingPhoneSummary.missingDirectDial ? (
                  <div>
                    <span>{selectedMissingPhoneSummary.missingDirectDial}</span>
                    <small>missing direct dial</small>
                  </div>
                ) : null}
                {selectedMissingPhoneSummary.missingBoth ? (
                  <div>
                    <span>{selectedMissingPhoneSummary.missingBoth}</span>
                    <small>missing both</small>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="redeem-choice-options">
              <div>
                <Pencil size={16} />
                <span><strong>Review manually</strong><small>Stay on the results table and add the missing number yourself.</small></span>
              </div>
              <div>
                <LockKeyhole size={16} />
                <span><strong>Redeem from Cognism</strong><small>Use Cognism redeem to fetch missing phone data for these selected leads.</small></span>
              </div>
            </div>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setRedeemConfirmOpen(false)} disabled={redeemStatus === "loading"}>Review manually</button>
              <button className="primary-button success-button" type="button" onClick={confirmRedeemSelectedMissingData} disabled={redeemStatus === "loading"}>
                {redeemStatus === "loading" ? "Redeeming" : "Redeem missing data"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {/*
        Redeem diagnostics modal intentionally disabled after phone-mapping validation.
        Keep redeemDiagnostics state available for the raw-record repair path.
      */}
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
                {companyImportStatus === "loading" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <Upload size={16} />}
                {companyImportStatus === "loading" ? "Reading files" : companyImportRows.length ? "Add files" : "Choose files"}
              </button>
              <StatusBadge>{companyImportFileCount ? `${companyImportFileCount} files` : "No files selected"}</StatusBadge>
              <StatusBadge>{companyImportRows.length ? `${companyImportRows.length} unique companies` : "0 companies"}</StatusBadge>
              <StatusBadge tone="success">{selectedCompanyImportNewCompanyCount} selected new targets</StatusBadge>
            </div>
            {companyImportError ? <div className="form-error">{companyImportError}</div> : null}
            <div className="company-import-selection-actions">
              <div>
                <span className="eyebrow">Import selection</span>
                <strong>{selectedCompanyImportKeys.length} of {companyImportRows.length} selected</strong>
              </div>
              <div className="role-actions">
                <button className="secondary-button" type="button" onClick={selectAllCompanyImportRows} disabled={!companyImportRows.length || selectedCompanyImportKeys.length === companyImportRows.length}>
                  <CheckCircle2 size={16} />
                  Select all
                </button>
                <button className="secondary-button" type="button" onClick={deselectAllCompanyImportRows} disabled={!selectedCompanyImportKeys.length}>
                  <Circle size={16} />
                  Deselect all
                </button>
              </div>
            </div>
            <div className="table-wrap company-import-preview">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Company name</th>
                    <th>Source file</th>
                    <th>Source sheet</th>
                  </tr>
                </thead>
                <tbody>
                  {companyImportRows.length ? companyImportRows.map(row => (
                    <tr key={companyImportRowKey(row)}>
                      <td className="table-select-cell">
                        <input
                          type="checkbox"
                          checked={selectedCompanyImportKeys.includes(companyImportRowKey(row))}
                          onChange={() => toggleCompanyImportRow(row)}
                          aria-label={`Select ${row.companyName}`}
                        />
                      </td>
                      <td>{row.companyName}</td>
                      <td>{row.sourceFile}</td>
                      <td>{row.sourceSheet || "CSV"}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="empty-table-cell">Choose one or more CSV or Excel files with a company column.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={closeCompanyImport}>Cancel</button>
              <button className="primary-button" type="button" onClick={confirmCompanyImport} disabled={!selectedCompanyImportNewCompanyCount}>
                <CheckCircle2 size={16} />
                Confirm import ({selectedCompanyImportNewCompanyCount})
              </button>
            </div>
          </section>
        </div>
      ) : null}
      <HubSpotExportResultModal result={hubspotExportDialog} onClose={() => setHubspotExportDialog(null)} />
      {pendingConfirmation ? (
        <ConfirmationModal
          eyebrow="Lead Finder"
          title={pendingConfirmation.title}
          message={pendingConfirmation.message}
          filenameLabel={pendingConfirmation.filenameLabel}
          defaultFilename={pendingConfirmation.defaultFilename}
          confirmLabel={pendingConfirmation.confirmLabel}
          onCancel={closeConfirmation}
          onConfirm={filename => {
            const action = pendingConfirmation.onConfirm;
            closeConfirmation();
            action?.(filename);
          }}
        />
      ) : null}
    </>
  );
}

function IntegrationsPage({ onNavigate, onOpenWorkflow, integrationCredentials, onSaveIntegrationCredentials }) {
  const { integrations } = useCrmData();
  const [credentialProvider, setCredentialProvider] = useState("");
  const [credentialValues, setCredentialValues] = useState({});
  const [credentialVisibleFields, setCredentialVisibleFields] = useState({});
  const [credentialStatus, setCredentialStatus] = useState("idle");
  const [credentialError, setCredentialError] = useState("");

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

function SettingsPage({
  isDark,
  onThemeToggle,
  onInviteTeamMember,
  user,
  onUpdateProfile,
  currencyCode,
  onCurrencyChange,
  adminSettingsState,
  onUpdateAdminSettings,
  onUpdateWorkspaceUserRole,
  cognismRedeemEnabled,
  onUpdateIntegration,
}) {
  const { teamMembers, workspaceUsers } = useCrmData();
  const { currencyOptions: availableCurrencies } = useCurrency();
  const visibleTeamMembers = workspaceUsers?.length ? workspaceUsers : teamMembers;
  const metadata = user?.user_metadata || {};
  const nameParts = String(metadata.full_name || "").trim().split(" ").filter(Boolean);
  const [profileValues, setProfileValues] = useState({
    firstName: metadata.first_name || nameParts[0] || "",
    lastName: metadata.last_name || nameParts.slice(1).join(" ") || "",
  });
  const [profileStatus, setProfileStatus] = useState("idle");
  const [profileError, setProfileError] = useState("");
  const [adminSettingsStatus, setAdminSettingsStatus] = useState("idle");
  const [adminSettingsError, setAdminSettingsError] = useState("");
  const [roleUpdateStatus, setRoleUpdateStatus] = useState({ userId: "", state: "idle" });
  const [roleUpdateError, setRoleUpdateError] = useState("");
  const [cognismRedeemCode, setCognismRedeemCode] = useState("");
  const [cognismRedeemError, setCognismRedeemError] = useState("");
  const [cognismRedeemModalOpen, setCognismRedeemModalOpen] = useState(false);
  const adminSettings = normalizeAdminSettings(adminSettingsState?.settings);
  const currentRole = adminSettingsState?.role || "member";
  const currentUserIsAdmin = Boolean(adminSettingsState?.isAdmin);
  const adminAccessMembers = visibleTeamMembers.map(member => {
    const roleKey = member.roleKey || String(member.role || "member").toLowerCase().replaceAll(" ", "_");
    const isProtectedRole = ["platform_admin", "org_owner"].includes(roleKey);
    const isSelf = member.id === user?.id;
    const isMemberAdmin = ADMIN_ROLES.has(roleKey);
    const canChangeRole = currentUserIsAdmin && member.id && !isProtectedRole && !isSelf;
    const busy = roleUpdateStatus.userId === member.id && roleUpdateStatus.state === "saving";
    return {
      member,
      roleKey,
      isProtectedRole,
      isSelf,
      isMemberAdmin,
      canChangeRole,
      busy,
      actionLabel: isProtectedRole ? "Protected" : isSelf ? "Your access" : isMemberAdmin ? "Remove admin" : "Make admin",
    };
  });
  const adminAccessCount = adminAccessMembers.filter(({ isMemberAdmin }) => isMemberAdmin).length;
  const standardMemberCount = adminAccessMembers.length - adminAccessCount;

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

  async function toggleAdminSetting(key, value) {
    setAdminSettingsStatus("saving");
    setAdminSettingsError("");
    try {
      await onUpdateAdminSettings?.({ [key]: value });
      setAdminSettingsStatus("saved");
    } catch (error) {
      setAdminSettingsStatus("idle");
      setAdminSettingsError(error?.message || "Could not update admin settings.");
    }
  }

  async function updateMemberAdminRole(member, role) {
    setRoleUpdateStatus({ userId: member.id, state: "saving" });
    setRoleUpdateError("");
    try {
      await onUpdateWorkspaceUserRole?.(member.id, role);
      setRoleUpdateStatus({ userId: member.id, state: "saved" });
    } catch (error) {
      setRoleUpdateStatus({ userId: "", state: "idle" });
      setRoleUpdateError(error?.message || "Could not update member admin access.");
    }
  }

  function enableCognismRedeem() {
    if (cognismRedeemCode.trim() !== COGNISM_REDEEM_CONFIRMATION) {
      setCognismRedeemError(`Type ${COGNISM_REDEEM_CONFIRMATION} to enable redeem mode.`);
      return;
    }
    setCognismRedeemError("");
    setCognismRedeemCode("");
    setCognismRedeemModalOpen(false);
    onUpdateIntegration?.("Cognism", { redeemEnabled: true });
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Tenant, team, and preference settings for the analytics workspace."
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
              {profileStatus === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <UserRound size={16} />}
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
                <div className="team-row-meta">
                  <StatusBadge>{formatRole(member.roleKey || member.role)}</StatusBadge>
                  <TeamStatusBadge status={member.status} />
                </div>
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
              <span>Currency</span>
              <select value={currencyCode} onChange={event => onCurrencyChange(event.target.value)}>
                {availableCurrencies.map(option => (
                  <option key={option.code} value={option.code}>{option.label} ({option.code})</option>
                ))}
              </select>
            </div>
          </div>
        </section>
        <section className="panel admin-controls-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Admin Settings</span>
              <h2>Admin controls</h2>
            </div>
            <StatusBadge>{formatRole(currentRole)}</StatusBadge>
          </div>
          {currentUserIsAdmin ? (
            <div className="settings-list admin-settings-list">
              <AdminSettingToggle
                title="Cognism preview mode"
                description="Allow users to run Cognism preview searches."
                checked={adminSettings.cognism_preview_enabled}
                disabled={adminSettingsStatus === "saving"}
                onChange={checked => toggleAdminSetting("cognism_preview_enabled", checked)}
              />
              <AdminSettingToggle
                title="Contact deletion"
                description="Allow admins to archive/delete CRM contacts."
                checked={adminSettings.contact_deletion_enabled}
                disabled={adminSettingsStatus === "saving"}
                onChange={checked => toggleAdminSetting("contact_deletion_enabled", checked)}
              />
              <div className="admin-redeem-control">
                <div>
                  <strong>Cognism redeem mode</strong>
                  <small>Allow organization admins to use redeem mode in Lead Finder.</small>
                </div>
                <StatusBadge tone={cognismRedeemEnabled ? "warning" : "success"}>{cognismRedeemEnabled ? "Redeem enabled" : "Preview only"}</StatusBadge>
                <button className="secondary-button" type="button" onClick={() => cognismRedeemEnabled ? onUpdateIntegration?.("Cognism", { redeemEnabled: false }) : setCognismRedeemModalOpen(true)}>
                  {cognismRedeemEnabled ? "Use preview only" : "Enable redeem"}
                </button>
              </div>
              <div className="admin-settings-feedback">
                {adminSettingsStatus === "saved" ? <div className="form-success">Admin controls saved.</div> : null}
                {adminSettingsError ? <div className="form-error">{adminSettingsError}</div> : null}
              </div>
            </div>
          ) : (
            <p className="modal-helper-text">Admin controls are available to organization admins only.</p>
          )}
        </section>
        <section className="panel admin-members-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Access Control</span>
              <h2>Member permissions</h2>
            </div>
            <StatusBadge>{visibleTeamMembers.length} member{visibleTeamMembers.length === 1 ? "" : "s"}</StatusBadge>
          </div>
          <div className="admin-access-summary">
            <div>
              <ShieldCheck size={18} />
              <span>Admins</span>
              <strong>{adminAccessCount}</strong>
            </div>
            <div>
              <Users size={18} />
              <span>Members</span>
              <strong>{standardMemberCount}</strong>
            </div>
          </div>
          <p className="admin-panel-intro">Manage who can use admin controls. Account membership and campaign assignment stay separate: adding someone to an account does not automatically put them in every campaign.</p>
          {currentUserIsAdmin ? (
            <>
              <div className="admin-access-grid" aria-label="Workspace admin access">
                {adminAccessMembers.map(({ member, roleKey, isProtectedRole, isSelf, isMemberAdmin, canChangeRole, busy, actionLabel }) => {
                  return (
                    <article key={member.id || member.email || member.name} className={`admin-access-card ${isMemberAdmin ? "admin" : ""} ${isSelf ? "self" : ""}`}>
                      <div className="admin-access-person">
                        <span>{member.initials || accountInitial(member.name || member.email || "Member")}</span>
                        <div>
                          <strong>{member.name}</strong>
                          <small>{member.email || "No email"}</small>
                        </div>
                      </div>
                      <div className="admin-access-card-meta">
                        <StatusBadge tone={isMemberAdmin || isProtectedRole ? "warning" : "neutral"}>{formatRole(roleKey)}</StatusBadge>
                        {isSelf ? <StatusBadge tone="success">You</StatusBadge> : null}
                      </div>
                      <div className="admin-access-card-actions">
                        <small>{isMemberAdmin ? "Can use enabled admin controls." : "Standard workspace member."}</small>
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => updateMemberAdminRole(member, isMemberAdmin ? "member" : "org_admin")}
                          disabled={!canChangeRole || busy}
                        >
                          {busy ? "Saving" : actionLabel}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="admin-member-feedback">
                {roleUpdateStatus.state === "saved" ? <div className="form-success">Member admin access updated.</div> : null}
                {roleUpdateError ? <div className="form-error">{roleUpdateError}</div> : null}
              </div>
            </>
          ) : (
            <p className="modal-helper-text">Only organization admins can change member admin access.</p>
          )}
        </section>
      </div>
      {cognismRedeemModalOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setCognismRedeemModalOpen(false);
        }}>
          <section className="workflow-modal cognism-redeem-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Cognism</span>
                <h2>Enable redeem mode</h2>
              </div>
              <button className="icon-action" type="button" onClick={() => setCognismRedeemModalOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <p className="modal-helper-text">Redeem mode can consume Cognism credits. Type ENABLE to turn it on.</p>
            <FormField label="Type ENABLE">
              <input
                type="text"
                value={cognismRedeemCode}
                onChange={event => {
                  setCognismRedeemCode(event.target.value);
                  setCognismRedeemError("");
                }}
                autoComplete="off"
              />
            </FormField>
            {cognismRedeemError ? <div className="form-error">{cognismRedeemError}</div> : null}
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setCognismRedeemModalOpen(false)}>Cancel</button>
              <button className="primary-button" type="button" onClick={enableCognismRedeem}>Enable redeem</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function AdminSettingToggle({ title, description, checked, disabled, onChange }) {
  return (
    <label className="admin-setting-toggle">
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
    </label>
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
          text="CSV import and file summariser workflows will attach source files to client accounts, target accounts, and campaigns."
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

function ConfirmationModal({ title, eyebrow = "Confirm", message, filenameLabel = "", defaultFilename = "", confirmLabel = "Confirm", onConfirm, onCancel }) {
  const [filenameDraft, setFilenameDraft] = useState(defaultFilename);

  useEffect(() => {
    setFilenameDraft(defaultFilename);
  }, [defaultFilename]);

  return (
    <section className="modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onCancel?.();
    }}>
      <div className="workflow-modal confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="confirmation-modal-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h2 id="confirmation-modal-title">{title}</h2>
          </div>
          <button className="icon-action" type="button" onClick={onCancel} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <p className="modal-helper-text">{message}</p>
        {filenameLabel ? (
          <label className="form-field confirmation-filename-field">
            <span>{filenameLabel}</span>
            <input
              type="text"
              value={filenameDraft}
              onChange={event => setFilenameDraft(event.target.value)}
              placeholder={defaultFilename || "lead-finder-export.csv"}
              autoFocus
            />
          </label>
        ) : null}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>
          <button className="primary-button" type="button" onClick={() => onConfirm?.(filenameDraft)}>{confirmLabel}</button>
        </div>
      </div>
    </section>
  );
}

async function ensureWorkspace(user) {
  if (!supabase || !user) return;
  if (!isAllowedEmail(user.email)) {
    throw new Error(`Only @${ALLOWED_EMAIL_DOMAIN} email addresses can access this analytics workspace.`);
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
      setError(`Use your @${ALLOWED_EMAIL_DOMAIN} email address to access PaceOps Data Analytics.`);
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
              <strong>PaceOps Data Analytics</strong>
              <span>Analytics workspace</span>
            </div>
          </div>

          <div className="auth-copy">
            <span className="eyebrow">Workspace access</span>
            <h1>{mode === "signin" ? "Open your workspace" : "Create a workspace"}</h1>
            <p>Manage client accounts, campaigns, target accounts, contacts, calls, and research from one PaceOps operating system.</p>
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
              {loading ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <LogIn size={16} />}
              {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
    </section>
  );
}

function HomePage({ isDark, onThemeToggle, onAuthenticate, user, onBackToWorkspace }) {
  const [authMode, setAuthMode] = useState("signin");

  return (
    <div className={`auth-app marketing-app ${isDark ? "dark" : "light"}`}>
      <header className="marketing-nav">
        <a className="marketing-brand" href="#top">
          <img src={logoUrl} alt="PaceOps" />
          <span>PaceOps Data Analytics</span>
        </a>
        <div>
          <button className="secondary-button" type="button" onClick={onThemeToggle}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user ? (
            <button className="primary-button" type="button" onClick={onBackToWorkspace}>Back to workspace</button>
          ) : (
            <a className="primary-button" href="#auth" onClick={() => setAuthMode("signin")}>Sign in</a>
          )}
        </div>
      </header>

      <main id="top" className="marketing-shell">
        <section className="home-single-page">
          <div id="about" className="company-summary">
            <span className="eyebrow">PaceOps Data Analytics</span>
            <h1>Client data analytics for PaceOps teams.</h1>
            <p>PaceOps is a professional services prospecting hub focused on human-personalised outreach, data-driven insight, and sales development operations.</p>
            <p>PaceOps Data Analytics is the internal workspace for managing client accounts, campaigns, target accounts, contacts, calls, research, and pipeline activity.</p>

            <div id="contact" className="contact-card">
              <h2>Contact</h2>
              <div className="regional-contact-list">
                <article>
                  <span className="flag-mark" aria-hidden="true">🇬🇧</span>
                  <div>
                    <strong>United Kingdom</strong>
                    <a href="tel:+448438092108">+44 (0) 843 809 2108</a>
                    <p>The Bradfield Centre, Cambridge Science Park, Cambridge, CB4 0GA</p>
                  </div>
                </article>
                <article>
                  <span className="flag-mark" aria-hidden="true">🇮🇪</span>
                  <div>
                    <strong>Ireland</strong>
                    <a href="tel:+3530216017406">+353 (0) 21 601 7406</a>
                    <p>The Guinness Enterprise Centre, Taylor's Lane, Dublin, D08 ET2R</p>
                  </div>
                </article>
                <article>
                  <span className="flag-mark" aria-hidden="true">🇺🇸</span>
                  <div>
                    <strong>United States</strong>
                    <a href="tel:+12159953839">+1 215 995 3839</a>
                    <p>1442 Pottstown Pike, Unit 3242, West Chester, PA 19380</p>
                  </div>
                </article>
              </div>
              <div className="contact-email-row">
                <Mail size={16} />
                <a href="mailto:enquiries@paceops.com">enquiries@paceops.com</a>
              </div>
            </div>
          </div>

          <div id="auth" className="home-auth">
            {user ? (
              <section className="auth-panel auth-card home-return-card">
                <div className="auth-brand">
                  <img src={logoUrl} alt="PaceOps" />
                  <div>
                    <strong>PaceOps Data Analytics</strong>
                    <span>{user.email}</span>
                  </div>
                </div>
                <div className="auth-copy">
                  <span className="eyebrow">Signed in</span>
                  <h1>Return to your workspace</h1>
                  <p>Open the analytics dashboard to continue managing client accounts, campaigns, calls, and research.</p>
                </div>
                <button className="primary-button" type="button" onClick={onBackToWorkspace}>Open workspace</button>
              </section>
            ) : (
              <AuthPanel key={authMode} initialMode={authMode} onAuthenticate={onAuthenticate} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function RightDrawer({ open, activeView, selectedAccount, activeCampaign, isDark, onThemeToggle, onOpenHome, onLogout, loggingOut }) {
  if (!open) return null;

  return (
    <aside className="right-drawer">
      <div className="drawer-head">
        <span className="assistant-mark"><FileText size={15} /></span>
        <div>
          <strong>Workflow panel</strong>
          <small>Workflow guidance</small>
        </div>
      </div>
      <section>
        <span className="eyebrow">Workspace menu</span>
        <div className="drawer-actions">
          <button className="secondary-button" type="button" onClick={onOpenHome}>
            <LayoutDashboard size={16} />
            Home page
          </button>
          <button className="secondary-button" type="button" onClick={onThemeToggle}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? "Light mode" : "Dark mode"}
          </button>
          <button className="secondary-button logout-action" type="button" onClick={onLogout} disabled={loggingOut}>
            <LogOut size={16} />
            {loggingOut ? "Signing out" : "Log out"}
          </button>
        </div>
      </section>
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
  "Client account workspace",
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
      return { clientId, name: "", channel: "Research-led outbound", status: "draft", nextAction: "Define target account focus and first call block", memberIds: [] };
    case "account":
      return { clientId, name: "", domain: "", industry: "", location: "", employees: "", value: "0", stage: data.pipelineStages?.[0]?.name || "Lead In", status: "New", nextAction: "Map buying committee", insight: "" };
    case "contact":
      return { accountId, accountName: data.accounts.find(account => account.id === accountId)?.name || "", name: "", role: "", email: "", mobile: "", directDial: "", status: "New" };
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
  client: "New client account",
    campaign: "New campaign",
  account: "Add target account",
    contact: "Add contact",
    deal: "New deal",
    call: "Log call outcome",
    research: "Queue research",
    file: "Add source file",
    team: "Invite teammate",
    audit: "Audit model",
  }[type] || "CRM workflow";
}

function getWorkflowPrerequisite(type, data) {
  if (["campaign", "account"].includes(type) && !data.clients.length) {
    return { message: "Create a client account first. Campaigns and target accounts belong inside a client account.", nextType: "client", nextLabel: "Create client account" };
  }
  if (["contact", "deal", "research"].includes(type) && !data.accounts.length) {
    return { message: "Add a target account first. Contacts, deals, and research need a target account to attach to.", nextType: data.clients.length ? "account" : "client", nextLabel: data.clients.length ? "Add target account" : "Create client account" };
  }
  if (type === "call" && !data.contacts.length) {
    return { message: "Add a contact first. Calls need a contact record.", nextType: data.accounts.length ? "contact" : data.clients.length ? "account" : "client", nextLabel: data.accounts.length ? "Add contact" : data.clients.length ? "Add target account" : "Create client account" };
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
  const [companyLookupMessage, setCompanyLookupMessage] = useState("");
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
    setCompanyLookupMessage("");
    try {
      const response = await fetch("/api/client-suggestions", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({ name: values.name }),
      });
      const suggestions = await readJsonResponse(response);
      if (!response.ok) throw new Error(suggestions.error || "Company lookup failed");

      if (suggestions.source === "not_found") {
        setCompanyLookupStatus("failed");
        setCompanyLookupMessage(suggestions.warning || `Could not confidently identify "${values.name}" from web results.`);
        return;
      }

      setValues(current => ({
        ...current,
        workspace: clientTouchedFields.workspace ? current.workspace : suggestions.workspace || current.workspace,
        industry: clientTouchedFields.industry ? current.industry : suggestions.industry || current.industry,
        website: clientTouchedFields.website ? current.website : suggestions.website || current.website,
      }));
      setCompanyLookupStatus(suggestions.source === "web_search" ? "found" : "fallback");
      setCompanyLookupMessage(suggestions.warning || "");
    } catch (error) {
      setCompanyLookupStatus("failed");
      setCompanyLookupMessage(error.message || "Lookup service unavailable.");
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
      const suggestions = await readJsonResponse(response);
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
      setAccountLookupStatus(suggestions.source === "web_search" ? "found" : "fallback");
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
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error || "Script generation failed");
      setValues(current => ({ ...current, scripts: payload.scripts || current.scripts }));
      setAccountScriptStatus(payload.mode === "template" ? "found" : "fallback");
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
            <FormField label="Client account name">
              <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="Company name" />
            </FormField>
            <label className="company-lookup-toggle">
              <span>
                <Search size={16} />
                Company lookup disabled
              </span>
              <input
                type="checkbox"
                checked={companyLookupEnabled}
                disabled
                onChange={event => {
                  setCompanyLookupEnabled(event.target.checked);
                  setCompanyLookupStatus("idle");
                  setCompanyLookupMessage("");
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
                {companyLookupStatus === "fallback" && (companyLookupMessage ? `Used a local fallback suggestion. ${companyLookupMessage}` : "Used a local fallback suggestion.")}
                {companyLookupStatus === "failed" && (companyLookupMessage || "Could not confidently identify this company from web results.")}
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
            <FormField label="Client account">
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
            <FormField label="Client account">
              <select value={values.clientId} onChange={event => update("clientId", event.target.value)}>
                {data.clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </FormField>
            <FormField label="Account name">
              <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="Account name" />
            </FormField>
            <label className="company-lookup-toggle">
              <span>
                <Search size={16} />
                Account lookup disabled
              </span>
              <input
                type="checkbox"
                checked={accountLookupEnabled}
                disabled
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
                {accountScriptStatus === "found" && "Scripts generated."}
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
            <datalist id="contact-account-options">
              {data.accounts.map(account => <option key={account.id} value={account.name} />)}
            </datalist>
            <FormField label="Account">
              <input list="contact-account-options" required value={values.accountName} onChange={event => {
                const accountName = event.target.value;
                const matchedAccount = data.accounts.find(account => normalizeLookupValue(account.name).toLowerCase() === normalizeLookupValue(accountName).toLowerCase());
                setValues(current => ({
                  ...current,
                  accountName,
                  accountId: matchedAccount?.id || "",
                }));
              }} placeholder="Type or select account" />
            </FormField>
            <FormField label="Contact name">
              <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="Contact name" />
            </FormField>
            <FormField label="Role">
              <input value={values.role} onChange={event => update("role", event.target.value)} placeholder="Head of Product" />
            </FormField>
            <FormField label="Email">
              <input type="email" value={values.email} onChange={event => update("email", event.target.value)} placeholder="name@company.com" />
            </FormField>
            <FormField label="Mobile">
              <input value={values.mobile} onChange={event => update("mobile", event.target.value)} placeholder="+44 mobile" />
            </FormField>
            <FormField label="Direct dial">
              <input value={values.directDial} onChange={event => update("directDial", event.target.value)} placeholder="+44 direct" />
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
                <option value="accounts">Target accounts</option>
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
          <button className="icon-action" type="button" onClick={onClose} aria-label="Close workflow">
            <X size={16} />
          </button>
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
  const [privateContactNotes, setPrivateContactNotes] = useState({});
  const [integrationCredentials, setIntegrationCredentials] = useState({ providers: {} });
  const [adminSettingsState, setAdminSettingsState] = useState({
    settings: DEFAULT_ADMIN_SETTINGS,
    role: "member",
    isAdmin: false,
  });
  const [activeView, setActiveView] = useState("dashboard");
  const [showHomePage, setShowHomePage] = useState(false);
  const [activeClientId, setActiveClientId] = useState("each-other");
  const [activeCampaignId, setActiveCampaignId] = useState("priority-targeting");
  const [selectedAccountId, setSelectedAccountId] = useState("account-01");
  const [selectedContactId, setSelectedContactId] = useState("contact-01");
  const [currencyCode, setCurrencyCode] = useState(() => normalizeCurrencyCode(localStorage.getItem(CURRENCY_STORAGE_KEY)));
  const [viewHistory, setViewHistory] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(() => localStorage.getItem("paceops.drawerOpen") === "true");
  const [search, setSearch] = useState("");
  const [workflow, setWorkflow] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const lastSyncedCrmJsonRef = useRef("");
  const authLoadRef = useRef({ userId: "", promise: null });

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
      setPrivateContactNotes({});
      setIntegrationCredentials({ providers: {} });
      setAdminSettingsState({ settings: DEFAULT_ADMIN_SETTINGS, role: "member", isAdmin: false });
      setUser(null);
      setShowHomePage(false);
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
          if (payload.new?.metadata?.admin_settings) {
            setAdminSettingsState(current => ({
              ...current,
              settings: normalizeAdminSettings(payload.new.metadata.admin_settings),
            }));
          }
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

  useEffect(() => {
    if (!user?.id) return undefined;

    const applyBrowserNavigation = event => {
      const navigation = event.state?.workspaceNavigation;
      if (navigation?.activeView) {
        setActiveView(navigation.activeView);
        if (navigation.activeClientId) setActiveClientId(navigation.activeClientId);
        if (navigation.activeCampaignId) setActiveCampaignId(navigation.activeCampaignId);
        if (navigation.selectedAccountId) setSelectedAccountId(navigation.selectedAccountId);
        if (navigation.selectedContactId) setSelectedContactId(navigation.selectedContactId);
        return;
      }

      setActiveView(readWorkspaceViewFromUrl() || "dashboard");
    };

    window.addEventListener("popstate", applyBrowserNavigation);
    return () => window.removeEventListener("popstate", applyBrowserNavigation);
  }, [user?.id]);

  async function handleAuthenticatedUser(nextUser) {
    if (authLoadRef.current.userId === nextUser.id && authLoadRef.current.promise) {
      await authLoadRef.current.promise;
      return;
    }

    const loadPromise = loadAuthenticatedUser(nextUser);
    authLoadRef.current = { userId: nextUser.id, promise: loadPromise };
    try {
      await loadPromise;
    } finally {
      if (authLoadRef.current.promise === loadPromise) {
        authLoadRef.current = { userId: "", promise: null };
      }
    }
  }

  async function loadAuthenticatedUser(nextUser) {
    setCrmSyncReady(false);
    try {
      const organizationId = await ensureWorkspace(nextUser);
      const currentWorkspaceUser = mapAuthUserToWorkspaceUser(nextUser);
      const [syncedCrmData, workspaceUsers, nextLeadLists, nextLeadContactDatabase, nextPrivateContactNotes, nextAdminSettings] = await Promise.all([
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
        loadPrivateContactNotes(organizationId, nextUser.id).catch(error => {
          console.error("Could not load private contact notes", error);
          return {};
        }),
        loadAdminSettings(organizationId, nextUser.id).catch(error => {
          console.error("Could not load admin settings", error);
          return { settings: DEFAULT_ADMIN_SETTINGS, role: "member", isAdmin: false };
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
      setPrivateContactNotes(nextPrivateContactNotes);
      setAdminSettingsState({
        settings: normalizeAdminSettings(nextAdminSettings.settings),
        role: nextAdminSettings.role || "member",
        isAdmin: Boolean(nextAdminSettings.isAdmin),
      });
      loadIntegrationCredentialsStatus().catch(error => {
        console.error("Could not load integration credential status", error);
      });
      const isFirstAuthenticatedLoad = !hasSavedUiState(nextUser.id);
      if (isFirstAuthenticatedLoad) {
        setActiveView(readWorkspaceViewFromUrl() || "dashboard");
        setSelectedAccountId(null);
        setSelectedContactId(null);
      } else {
        const uiState = loadUiState(nextUser.id);
        const urlView = readWorkspaceViewFromUrl();
        if (urlView || uiState.activeView) setActiveView(urlView || uiState.activeView);
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
      setPrivateContactNotes({});
      setIntegrationCredentials({ providers: {} });
      setAdminSettingsState({ settings: DEFAULT_ADMIN_SETTINGS, role: "member", isAdmin: false });
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
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload.error || "Could not load integration settings.");
    setIntegrationCredentials(payload);
    return payload;
  }

  async function loadAdminSettings(organizationId, currentUserId) {
    if (supabase && organizationId && currentUserId) {
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("id", currentUserId)
        .single();
      if (userError) throw userError;

      const { data: rpcSettings, error: rpcError } = await supabase.rpc("get_admin_settings", {
        target_organization_id: organizationId,
      });

      if (!rpcError) {
        return {
          settings: normalizeAdminSettings(rpcSettings),
          role: userRecord?.role || "member",
          isAdmin: ADMIN_ROLES.has(userRecord?.role),
        };
      }

      const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("metadata")
        .eq("id", organizationId)
        .single();
      if (organizationError) throw organizationError;

      return {
        settings: normalizeAdminSettings(organization?.metadata?.admin_settings),
        role: userRecord?.role || "member",
        isAdmin: ADMIN_ROLES.has(userRecord?.role),
      };
    }

    const response = await fetch("/api/admin-settings", {
      method: "GET",
      headers: await buildApiHeaders(),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload.error || "Could not load admin settings.");
    return payload;
  }

  async function handleUpdateAdminSettings(values) {
    if (supabase && dataOrgId) {
      const { data, error } = await supabase.rpc("update_admin_settings", {
        target_organization_id: dataOrgId,
        cognism_preview_enabled: typeof values.cognism_preview_enabled === "boolean" ? values.cognism_preview_enabled : null,
        contact_deletion_enabled: typeof values.contact_deletion_enabled === "boolean" ? values.contact_deletion_enabled : null,
      });
      if (!error) {
        const nextState = {
          settings: normalizeAdminSettings(data),
          role: adminSettingsState.role,
          isAdmin: ADMIN_ROLES.has(adminSettingsState.role),
        };
        setAdminSettingsState(nextState);
        return nextState;
      }
    }

    const response = await fetch("/api/admin-settings", {
      method: "POST",
      headers: await buildApiHeaders(),
      body: JSON.stringify(values),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload.error || "Could not update admin settings.");
    setAdminSettingsState({
      settings: normalizeAdminSettings(payload.settings),
      role: payload.role || adminSettingsState.role,
      isAdmin: Boolean(payload.isAdmin),
    });
    return payload;
  }

  async function handleUpdateWorkspaceUserRole(userId, role) {
    const response = await fetch("/api/workspace-users/role", {
      method: "POST",
      headers: await buildApiHeaders(),
      body: JSON.stringify({ userId, role }),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload.error || "Could not update member admin access.");

    const updatedUser = payload.user || {};
    setCrmData(current => ({
      ...current,
      workspaceUsers: (current.workspaceUsers || []).map(workspaceUser => {
        if (workspaceUser.id !== updatedUser.id) return workspaceUser;
        const name = updatedUser.displayName || updatedUser.fullName || workspaceUser.name || updatedUser.email?.split("@")[0] || "Workspace user";
        return {
          ...workspaceUser,
          email: updatedUser.email || workspaceUser.email,
          name,
          role: formatRole(updatedUser.role),
          roleKey: updatedUser.role || "member",
          status: titleCase(updatedUser.status || workspaceUser.status || "active"),
          initials: accountInitial(name),
        };
      }),
    }));

    if (updatedUser.id === user?.id) {
      setAdminSettingsState(current => ({
        ...current,
        role: updatedUser.role || "member",
        isAdmin: ADMIN_ROLES.has(updatedUser.role),
      }));
    }

    return payload;
  }

  async function handleSaveIntegrationCredentials(provider, values) {
    const response = await fetch("/api/integration-settings", {
      method: "POST",
      headers: await buildApiHeaders(),
      body: JSON.stringify({ provider, values }),
    });
    const payload = await readJsonResponse(response);
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

  if (showHomePage) {
    return (
      <HomePage
        isDark={isDark}
        onThemeToggle={() => setIsDark(value => !value)}
        onAuthenticate={handleAuthenticatedUser}
        user={user}
        onBackToWorkspace={() => setShowHomePage(false)}
      />
    );
  }

  const { clients, campaigns, accounts, contacts, workspaceUsers = [] } = crmData;
  const activeClient = clients.find(client => client.id === activeClientId) || clients[0] || emptyClient;
  const activeClientCampaigns = activeClient.id !== "none" ? campaigns.filter(campaign => campaign.clientId === activeClient.id) : campaigns;
  const activeCampaign = activeClientCampaigns.find(campaign => campaign.id === activeCampaignId) || activeClientCampaigns[0] || emptyCampaign;
  const selectedAccount = accounts.find(account => account.id === selectedAccountId) || accounts[0] || null;
  const selectedContact = contacts.find(contact => contact.id === selectedContactId) || contacts[0] || null;
  const currencyFormatter = createCurrencyFormatter(currencyCode);
  const currencyContextValue = {
    currencyCode,
    currencyOptions,
    formatCurrency: value => currencyFormatter.format(Number(value) || 0),
  };

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
    if (options.browserHistory !== false) {
      writeWorkspaceHistory({
        ...currentNavigationState(),
        ...updates,
        activeView: view,
      });
    }
    setActiveView(view);
  }

  function navigatePrimary(view) {
    setViewHistory([]);
    writeWorkspaceHistory({
      ...currentNavigationState(),
      activeView: view,
      selectedAccountId,
      selectedContactId,
    });
    setActiveView(view);
  }

  function goBack() {
    setViewHistory(current => {
      const previous = current[current.length - 1];
      if (!previous) return current;
      writeWorkspaceHistory(previous);
      setActiveClientId(previous.activeClientId);
      setActiveCampaignId(previous.activeCampaignId);
      setSelectedAccountId(previous.selectedAccountId);
      setSelectedContactId(previous.selectedContactId);
      setActiveView(previous.activeView);
      return current.slice(0, -1);
    });
  }

  function handleCurrencyChange(nextCurrencyCode) {
    const normalizedCode = normalizeCurrencyCode(nextCurrencyCode);
    setCurrencyCode(normalizedCode);
    localStorage.setItem(CURRENCY_STORAGE_KEY, normalizedCode);
  }

  function handleActiveClientChange(clientId) {
    setActiveClientId(clientId);
    const nextCampaign = campaigns.find(campaign => campaign.clientId === clientId);
    setActiveCampaignId(nextCampaign?.id || "none");
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

  function handleUpdateContact(values) {
    updateData(current => {
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
            email: values.email,
            phone: values.directDial,
            mobile: values.mobile,
            directDial: values.directDial,
            phoneNumber: undefined,
            redeemed: undefined,
            lastTouch: "Updated just now",
          }
          : contact),
        activities: [makeActivity("Contact", `Contact updated: ${values.name || "Untitled contact"}`, account?.name || "Workspace"), ...current.activities],
      };
    });
  }

  async function handleSavePrivateContactNote(contactId, note) {
    if (!contactId || !user?.id) return;
    const { currentUser, organizationId } = await getLeadContactSaveContext();
    const body = normalizeLookupValue(note);

    if (!body) {
      const { error } = await supabase
        .from("contact_private_notes")
        .delete()
        .eq("organization_id", organizationId)
        .eq("created_by", currentUser.id)
        .eq("crm_contact_id", contactId);

      if (error) throw error;
      setPrivateContactNotes(current => {
        const next = { ...current };
        delete next[contactId];
        return next;
      });
      return;
    }

    const { data, error } = await supabase
      .from("contact_private_notes")
      .upsert({
        organization_id: organizationId,
        crm_contact_id: contactId,
        body,
        created_by: currentUser.id,
      }, { onConflict: "organization_id,crm_contact_id,created_by" })
      .select("crm_contact_id,body")
      .single();

    if (error) throw error;
    setPrivateContactNotes(current => ({
      ...current,
      [data.crm_contact_id]: data.body || "",
    }));
  }

  async function handleRemoveContact(contact) {
    if (!contact?.id) return;

    const response = await fetch("/api/contacts/archive", {
      method: "POST",
      headers: await buildApiHeaders(),
      body: JSON.stringify({ contactId: contact.id }),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload.error || "Could not archive contact.");

    if (payload.crmData && typeof payload.crmData === "object") {
      setCrmData(current => ({
        ...refreshCrmData(normalizeCrmData(payload.crmData)),
        workspaceUsers: current.workspaceUsers || [],
      }));
      lastSyncedCrmJsonRef.current = JSON.stringify(serializeCrmData(normalizeCrmData(payload.crmData)));
    } else {
      updateData(current => ({
        ...current,
        contacts: current.contacts.filter(item => item.id !== contact.id),
        deals: current.deals.map(deal => deal.contactId === contact.id
          ? { ...deal, contactId: "", contact: "No primary contact" }
          : deal),
        activities: [makeActivity("Contact", `Contact archived: ${contact.name || "Untitled contact"}`, contact.account || "Workspace"), ...current.activities],
      }));
    }
    setSelectedContactId(current => current === contact.id ? null : current);
    setActiveView("contacts");
  }

  function handleRemoveClient(client) {
    if (!client?.id || client.id === "none") return;

    const removedAccountIds = new Set(crmData.accounts.filter(account => account.clientId === client.id).map(account => account.id));
    const removedContactIds = new Set(crmData.contacts.filter(contact => contact.clientId === client.id || removedAccountIds.has(contact.accountId)).map(contact => contact.id));
    const removedCampaignIds = new Set(crmData.campaigns.filter(campaign => campaign.clientId === client.id).map(campaign => campaign.id));
    const remainingClients = crmData.clients.filter(item => item.id !== client.id);
    const remainingCampaign = crmData.campaigns.find(campaign => campaign.clientId !== client.id);
    const remainingAccount = crmData.accounts.find(account => account.clientId !== client.id);
    const remainingContact = crmData.contacts.find(contact => contact.clientId !== client.id && !removedAccountIds.has(contact.accountId));

    updateData(current => {
      const accountIds = new Set(current.accounts.filter(account => account.clientId === client.id).map(account => account.id));
      const accountNames = new Set(current.accounts.filter(account => account.clientId === client.id).map(account => account.name));
      const contactIds = new Set(current.contacts.filter(contact => contact.clientId === client.id || accountIds.has(contact.accountId)).map(contact => contact.id));
      const contactNames = new Set(current.contacts.filter(contact => contact.clientId === client.id || accountIds.has(contact.accountId)).map(contact => contact.name));
      const campaignIds = new Set(current.campaigns.filter(campaign => campaign.clientId === client.id).map(campaign => campaign.id));

      return {
        ...current,
        clients: current.clients.filter(item => item.id !== client.id),
        campaigns: current.campaigns.filter(campaign => campaign.clientId !== client.id),
        accounts: current.accounts.filter(account => account.clientId !== client.id),
        contacts: current.contacts.filter(contact => contact.clientId !== client.id && !accountIds.has(contact.accountId)),
        deals: current.deals.filter(deal => (
          !accountIds.has(deal.accountId)
          && !contactIds.has(deal.contactId)
          && !accountNames.has(deal.account)
          && !contactNames.has(deal.contact)
        )),
        activities: [
          makeActivity("Client", `Client removed: ${client.name || "Untitled client"}`),
          ...current.activities.filter(activity => (
            !accountNames.has(activity.account)
            && !contactIds.has(activity.contactId)
            && !campaignIds.has(activity.campaignId)
          )),
        ],
        researchItems: current.researchItems.filter(item => item.clientId !== client.id && !accountIds.has(item.accountId)),
        scriptItems: (current.scriptItems || []).filter(item => item.clientId !== client.id && !accountIds.has(item.accountId) && !campaignIds.has(item.campaignId)),
        callInsights: (current.callInsights || []).filter(insight => !contactIds.has(insight.contactId)),
        weeklyReports: (current.weeklyReports || []).filter(report => report.clientId !== client.id && !campaignIds.has(report.campaignId)),
      };
    });

    if (activeClientId === client.id) setActiveClientId(remainingClients[0]?.id || "none");
    if (removedCampaignIds.has(activeCampaignId)) setActiveCampaignId(remainingCampaign?.id || "none");
    if (removedAccountIds.has(selectedAccountId)) setSelectedAccountId(remainingAccount?.id || null);
    if (removedContactIds.has(selectedContactId)) setSelectedContactId(remainingContact?.id || null);
    if (activeView === "client-detail") setActiveView("clients");
  }

  function handleImportContacts(rows = [], files = []) {
    let addedCount = 0;
    let skippedCount = 0;

    updateData(current => {
      const clients = current.clients.length ? current.clients : [{
        id: makeId("client"),
        name: "Imported contacts",
        workspace: "Prospecting workspace",
        status: "Active",
        owner: "Workspace user",
        accounts: 0,
        contacts: 0,
        health: "Active",
        industry: "",
        website: "",
      }];
      const defaultClient = clients[0];
      const accounts = [...current.accounts];
      const contacts = [...current.contacts];

      for (const row of rows) {
        const contactName = normalizeLookupValue(row.name);
        const accountName = normalizeLookupValue(row.account);
        if (!contactName || !accountName) {
          skippedCount += 1;
          continue;
        }

        const mobile = normalizeLookupValue(row.mobile);
        const directDial = normalizeLookupValue(row.directDial);
        const email = normalizeEmail(row.email);
        const duplicate = contacts.some(contact => {
          const sameEmail = email && normalizeEmail(contact.email) === email;
          const sameMobile = mobile && normalizePhone(getContactMobileNumber(contact)) === normalizePhone(mobile);
          const sameDirectDial = directDial && normalizePhone(getContactDirectDialNumber(contact)) === normalizePhone(directDial);
          const samePersonAtAccount = normalizeLookupValue(contact.name).toLowerCase() === contactName.toLowerCase()
            && normalizeLookupValue(contact.account).toLowerCase() === accountName.toLowerCase();
          return sameEmail || sameMobile || sameDirectDial || samePersonAtAccount;
        });

        if (duplicate) {
          skippedCount += 1;
          continue;
        }

        let account = accounts.find(item => normalizeLookupValue(item.name).toLowerCase() === accountName.toLowerCase());
        if (!account) {
          account = {
            id: makeId("account"),
            clientId: defaultClient.id,
            name: accountName,
            domain: "No domain",
            owner: "Workspace user",
            stage: current.pipelineStages?.[0]?.name || "Lead In",
            status: "New",
            industry: "Unspecified",
            location: "Unspecified",
            employees: "Unknown",
            value: 0,
            lastActivity: "Imported with contacts",
            nextAction: "Review imported contact",
            insight: "Created from contact import.",
            scripts: null,
          };
          accounts.unshift(account);
        }

        contacts.unshift({
          id: makeId("contact"),
          clientId: account.clientId,
          accountId: account.id,
          account: account.name,
          name: contactName,
          role: normalizeLookupValue(row.role) || "Stakeholder",
          email,
          phone: directDial,
          mobile,
          directDial,
          owner: "Workspace user",
          status: "New",
          lastTouch: "Imported",
        });
        addedCount += 1;
      }

      const fileRecords = files.map(file => ({
        id: makeId("file"),
        name: file.name || "contacts-import",
        source: "CSV import",
        objectType: "contacts",
        rows: rows.length,
        status: "Imported",
        added: "Just now",
      }));

      return {
        ...current,
        clients,
        accounts,
        contacts,
        files: [...fileRecords, ...current.files],
        activities: [makeActivity("Import", `Imported ${addedCount} contacts${skippedCount ? `, skipped ${skippedCount}` : ""}`, "Workspace"), ...current.activities],
      };
    });

    return { addedCount, skippedCount };
  }

  function handleLogCall({ contactId, outcome }) {
    if (!contactId) return;
    updateData(current => {
      const contact = current.contacts.find(item => item.id === contactId);
      if (!contact) return current;
      const activity = makeActivity("Call", `${outcome} logged for ${contact.name}`, contact.account, "Workspace user", {
        contactId,
        outcome,
      });
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
        activities: [makeActivity("Script", `Generated scripts for ${contextName}`, account?.name || "Workspace"), ...current.activities],
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
        const sameMobile = leadMobile && normalizePhone(contact.mobile || contact.directDial || contact.phone) === leadMobile;
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
      const mobileNumber = normalizeLookupValue(lead.manualMobile);
      const directDialNumber = normalizeLookupValue(lead.manualDirectDial);
      const contact = {
        id: makeId("contact"),
        clientId: account.clientId,
        accountId: account.id,
        account: account.name,
        name: leadName,
        role: normalizeLookupValue(lead.jobTitle) || "Stakeholder",
        persona: "Lead Finder",
        email: leadEmail,
        phone: directDialNumber,
        mobile: mobileNumber,
        directDial: directDialNumber,
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
              email: values.email,
              phone: values.directDial,
              mobile: values.mobile,
              directDial: values.directDial,
              phoneNumber: undefined,
              redeemed: undefined,
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
            nextAction: values.nextAction || "Define target account focus and next action",
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
          const accountName = normalizeLookupValue(values.accountName) || "Untitled account";
          const fallbackClient = current.clients[0] || {
            id: makeId("client"),
            name: "Imported contacts",
            workspace: "Prospecting workspace",
            status: "Active",
            owner: "Workspace user",
            accounts: 0,
            contacts: 0,
            health: "Active",
            industry: "",
            website: "",
          };
          const existingAccount = current.accounts.find(item => (
            item.id === values.accountId
            || normalizeLookupValue(item.name).toLowerCase() === accountName.toLowerCase()
          ));
          const account = existingAccount || {
            id: makeId("account"),
            clientId: fallbackClient.id,
            name: accountName,
            domain: "No domain",
            owner: "Workspace user",
            stage: current.pipelineStages?.[0]?.name || "Lead In",
            status: "New",
            industry: "Unspecified",
            location: "Unspecified",
            employees: "Unknown",
            value: 0,
            lastActivity: "Created with contact",
            nextAction: "Review new contact",
            insight: "Created from contact form.",
            scripts: null,
          };
          const contact = {
            id: makeId("contact"),
            clientId: account.clientId,
            accountId: account.id,
            account: account.name,
            name: values.name.trim() || "Untitled contact",
            role: values.role || "Stakeholder",
            email: values.email,
            phone: values.directDial,
            mobile: values.mobile,
            directDial: values.directDial,
            owner: "Workspace user",
            status: values.status || "New",
            lastTouch: "Created just now",
          };
          setSelectedAccountId(account.id);
          setSelectedContactId(contact.id);
          setActiveView("contact-detail");
          return {
            ...current,
            clients: current.clients.length ? current.clients : [fallbackClient],
            accounts: existingAccount ? current.accounts : [account, ...current.accounts],
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
            clientId: account.clientId,
            campaignId: activeCampaignId !== "none" ? activeCampaignId : "",
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
    const canDeleteContacts = Boolean(adminSettingsState.isAdmin && normalizeAdminSettings(adminSettingsState.settings).contact_deletion_enabled);
    const cognismRedeemEnabled = Boolean(crmData.integrations?.find(integration => integration.name === "Cognism")?.redeemEnabled);
    const canUseCognismRedeemMode = Boolean(adminSettingsState.isAdmin && cognismRedeemEnabled);
    switch (activeView) {
      case "clients":
        return <ClientsPage onOpenClient={openClient} onEditClient={editClient} onRemoveClient={handleRemoveClient} onNewClient={() => openWorkflow("client")} />;
      case "client-detail":
        return (
          <ClientDetailPage
            client={activeClient}
            onOpenCampaign={openCampaign}
            onOpenAccount={openAccount}
            onEditClient={editClient}
            onEditAccount={editAccount}
            onRemoveClient={handleRemoveClient}
            onNewCampaign={() => openWorkflow("campaign", { clientId: activeClient.id })}
            onNewAccount={() => openWorkflow("account", { clientId: activeClient.id })}
          />
        );
      case "campaigns":
        return <CampaignsPage activeClient={activeClient} onOpenCampaign={openCampaign} onEditCampaign={editCampaign} onNewCampaign={() => openWorkflow("campaign", { clientId: activeClient.id })} onImport={() => openWorkflow("file", { returnTo: "campaigns" })} />;
      case "campaign-detail":
        return <CampaignDetailPage campaign={activeCampaign} onNavigate={openView} onOpenAccount={openAccount} onEditCampaign={editCampaign} />;
      case "accounts":
        return <ClientsPage onOpenClient={openClient} onEditClient={editClient} onRemoveClient={handleRemoveClient} onNewClient={() => openWorkflow("client")} />;
      case "account-detail":
        return selectedAccount
          ? <AccountDetailPage account={selectedAccount} onOpenContact={openContact} onEditAccount={editAccount} onQueueResearch={(accountId) => openWorkflow("research", { accountId })} onNewContact={(accountId) => openWorkflow("contact", { accountId })} onNewDeal={(accountId) => openWorkflow("deal", { accountId })} />
          : <ClientsPage onOpenClient={openClient} onEditClient={editClient} onRemoveClient={handleRemoveClient} onNewClient={() => openWorkflow("client")} />;
      case "contacts":
        return <ContactsPage onOpenContact={openContact} onNewContact={(accountId) => openWorkflow("contact", accountId ? { accountId } : {})} onImportContacts={handleImportContacts} onRemoveContact={handleRemoveContact} canDeleteContacts={canDeleteContacts} />;
      case "contact-detail":
        return selectedContact
          ? <ContactDetailPage key={selectedContact.id} contact={selectedContact} privateNote={privateContactNotes[selectedContact.id] || ""} onUpdateContact={handleUpdateContact} onSavePrivateNote={handleSavePrivateContactNote} onLogCall={handleLogCall} onRemoveContact={handleRemoveContact} canDeleteContacts={canDeleteContacts} />
          : <ContactsPage onOpenContact={openContact} onNewContact={() => openWorkflow("contact")} onImportContacts={handleImportContacts} onRemoveContact={handleRemoveContact} canDeleteContacts={canDeleteContacts} />;
      case "cognism":
        return <CognismContactFinder contactDatabase={leadContactDatabase} onSaveLeadList={handleSaveLeadList} onSaveLeadContact={handleUpsertLeadContact} onPersistSearchResults={handlePersistSearchResults} cognismPreviewEnabled={normalizeAdminSettings(adminSettingsState.settings).cognism_preview_enabled} canUseRedeemMode={canUseCognismRedeemMode} currentUserId={user?.id || ""} />;
      case "lead-lists":
        return <LeadListsPage leadLists={leadLists} workspaceUsers={workspaceUsers} contactDatabase={leadContactDatabase} error={leadListsError} onSaveLeadList={handleSaveLeadList} onAppendToLeadList={handleAppendToLeadList} onUpdateLeadList={handleUpdateLeadList} onDeleteLeadList={handleDeleteLeadList} onSaveLeadContact={handleUpsertLeadContact} />;
      case "lead-lookup":
        return <LeadDatabasePage leadLists={leadLists} contactDatabase={leadContactDatabase} onSaveLeadContact={handleUpsertLeadContact} onAddToCrmContacts={handleAddLeadToCrmContacts} />;
      case "pipeline":
        return <PipelinePage activeClient={activeClient} activeCampaign={activeCampaign} onOpenAccount={openAccount} onMoveDeal={handleMoveDeal} onNewDeal={(accountId) => openWorkflow("deal", accountId ? { accountId } : {})} onUpdateStages={handleUpdatePipelineStages} />;
      case "research":
        return <ResearchPage activeClient={activeClient} activeCampaign={activeCampaign} onOpenAccount={openAccount} onAddSource={() => openWorkflow("file", { returnTo: "research" })} onQueueResearch={(accountId) => openWorkflow("research", accountId ? { accountId } : {})} onGenerateScripts={handleGenerateResearchScripts} onMoveScript={handleMoveScript} onGenerateReport={handleGenerateReport} />;
      // Calls workspace disabled:
      // case "calls":
      //   return <CallsPage onOpenContact={openContact} onLogCall={handleLogCall} onStartCallBlock={() => openWorkflow("call")} />;
      case "files":
        return <FilesPage onUploadFile={() => openWorkflow("file", { returnTo: "files" })} />;
      case "integrations":
        return <IntegrationsPage onNavigate={openView} onOpenWorkflow={(type) => openWorkflow(type)} integrationCredentials={integrationCredentials} onSaveIntegrationCredentials={handleSaveIntegrationCredentials} />;
      case "settings":
        return <SettingsPage
          isDark={isDark}
          onThemeToggle={() => setIsDark(value => !value)}
          onInviteTeamMember={() => openWorkflow("team")}
          user={user}
          onUpdateProfile={handleUpdateProfile}
          currencyCode={currencyCode}
          onCurrencyChange={handleCurrencyChange}
          adminSettingsState={adminSettingsState}
          onUpdateAdminSettings={handleUpdateAdminSettings}
          onUpdateWorkspaceUserRole={handleUpdateWorkspaceUserRole}
          cognismRedeemEnabled={cognismRedeemEnabled}
          onUpdateIntegration={updateIntegration}
        />;
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
      <CurrencyContext.Provider value={currencyContextValue}>
        <div className={`crm-app ${isDark ? "dark" : "light"}`}>
        <Sidebar activeView={activeView} onNavigate={navigatePrimary} />
        <div className="workspace">
          <TopBar
            canGoBack={viewHistory.length > 0}
            onBack={goBack}
            activeClient={activeClient}
            activeCampaign={activeCampaign}
            onClientChange={handleActiveClientChange}
            onCampaignChange={setActiveCampaignId}
            drawerOpen={drawerOpen}
            onDrawerToggle={() => setDrawerOpen(value => !value)}
            search={search}
            onSearchChange={setSearch}
            searchResults={searchResults}
            onSearchSelect={handleSearchSelect}
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
              isDark={isDark}
              onThemeToggle={() => setIsDark(value => !value)}
              onOpenHome={() => setShowHomePage(true)}
              onLogout={handleLogout}
              loggingOut={loggingOut}
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
      </CurrencyContext.Provider>
    </CrmDataContext.Provider>
  );
}
