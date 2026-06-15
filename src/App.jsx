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
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Contact,
  Copy,
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
  PlayCircle,
  Plug,
  Plus,
  RefreshCw,
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
import aircallLogoUrl from "./assets/aircall.png";
import cognismLogoUrl from "./assets/cognism.png";
import hubspotLogoUrl from "./assets/hubspot.png";
import logoUrl from "../images/paceops-logo.jpeg";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const BRAND_IMAGE_BUCKET = "client-campaign-images";
const BRAND_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_EMAIL_DOMAIN = "paceops.com";
const LEAD_FINDER_SEARCH_STATE_VERSION = 4;
const LEAD_FINDER_DEBUG_CACHE_MAX_RECORDS = 250;
const LEAD_FINDER_DEBUG_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_MAX_CONTACTS_PER_COMPANY = 1;
const DEFAULT_ADMIN_SETTINGS = {
  cognism_preview_enabled: true,
  contact_deletion_enabled: false,
  test_account_enabled: false,
};
const TEST_WORKSPACE_USER = {
  id: "00000000-0000-4000-8000-000000700707",
  email: "james.bond@paceops.com",
  name: "James Bond",
  firstName: "James",
  lastName: "Bond",
  role: "Member",
  roleKey: "member",
  initials: "JB",
  status: "Test",
  aircallUserId: "7007007",
  currencyCode: "GBP",
  isTestAccount: true,
};
const ORG_ADMIN_ROLES = new Set(["platform_admin", "org_owner", "org_admin"]);
const ADMIN_ROLES = new Set(["platform_admin", "org_owner", "org_admin", "admin"]);
const CRM_MANAGEMENT_WORKFLOWS = new Set([
  "client",
  "edit-client",
  "campaign",
  "edit-campaign",
  "campaign-company",
  "account",
  "edit-account",
  "contact",
  "edit-contact",
  "deal",
  "research",
  "file",
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function AircallLogoIcon({ size = 16, className = "", ...props }) {
  return (
    <img
      className={`aircall-logo-icon ${className}`.trim()}
      src={aircallLogoUrl}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      {...props}
    />
  );
}

function ProductLogoIcon({ src, size = 16, className = "", ...props }) {
  return (
    <img
      className={`product-logo-icon ${className}`.trim()}
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      {...props}
    />
  );
}

function CognismLogoIcon(props) {
  return <ProductLogoIcon src={cognismLogoUrl} {...props} />;
}

function HubSpotLogoIcon(props) {
  return <ProductLogoIcon src={hubspotLogoUrl} {...props} />;
}

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
  { name: "Lead Finder (Cognism)", key: "Cognism", icon: CognismLogoIcon, status: "Connected", note: "Search Cognism preview lead records and save selected rows.", action: "Open Lead Finder", view: "cognism", redeemEnabled: false },
  { name: "Aircall", icon: AircallLogoIcon, status: "Partial", note: "Click-to-call, call history, transcripts, sentiment, and user call reporting.", action: "Open Aircall", view: "aircall" },
  { name: "HubSpot", icon: HubSpotLogoIcon, status: "Connected", note: "Lead Finder contacts can be exported to HubSpot contacts. Company association depends on HubSpot app scopes.", action: "Open Lead Finder", view: "cognism" },
];
const connectedIntegrationStatuses = new Set(["Available", "Connected", "Partial"]);
const SHOW_INTEGRATION_KEY_CONTROLS = false;

const navItems = [
  { id: "aircall", label: "Aircall", icon: AircallLogoIcon, logo: aircallLogoUrl, highlight: true },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients", label: "Client Accounts", icon: Building2 },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "contacts", label: "Contacts", icon: Contact, highlight: true },
  { id: "cognism", label: "Lead Finder", icon: CognismLogoIcon, logo: cognismLogoUrl, highlight: true },
  { id: "lead-lists", label: "Lead Lists", icon: ListFilter, highlight: true },
  { id: "pipeline", label: "Pipeline", icon: KanbanSquare },
  { id: "research", label: "Research", icon: FileText },
  { id: "integrations", label: "Integrations", icon: Plug, highlight: true },
  { id: "settings", label: "Settings", icon: Settings, highlight: true },
];

const workspaceViewIds = new Set(navItems.map(item => item.id).concat([
  "client-detail",
  "campaign-detail",
  "account-detail",
  "contact-detail",
  "lead-lookup",
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

const currencyOptions = [
  { code: "EUR", label: "Euro", locale: "en-IE" },
  { code: "GBP", label: "Pounds", locale: "en-GB" },
  { code: "USD", label: "USD", locale: "en-US" },
];

function normalizeCurrencyCode(code) {
  const value = String(code || "").toUpperCase();
  return currencyOptions.some(option => option.code === value) ? value : "GBP";
}

function makeSlug(value = "record") {
  const slug = String(value || "record")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "record";
}

function parsePositiveInteger(value) {
  const numeric = Number(String(value || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
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

function sanitizeStorageName(value = "image") {
  return String(value || "image")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}

function extensionForImageFile(file) {
  const nameExtension = String(file?.name || "").split(".").pop();
  if (nameExtension && nameExtension !== file?.name) return nameExtension.toLowerCase();
  return {
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/svg+xml": "svg",
    "image/webp": "webp",
  }[file?.type] || "png";
}

async function uploadBrandImage({ file, organizationId, entityType, recordId }) {
  if (!supabase) throw new Error("Supabase is not configured for uploads.");
  if (!organizationId) throw new Error("Workspace organization is not ready yet.");
  if (!file) throw new Error("Choose an image file first.");
  if (!String(file.type || "").startsWith("image/")) throw new Error("Choose a PNG, JPG, WebP, GIF, or SVG image.");
  if (file.size > BRAND_IMAGE_MAX_BYTES) throw new Error("Choose an image under 5 MB.");

  const safeEntityType = entityType === "campaign" ? "campaigns" : "clients";
  const safeRecordId = sanitizeStorageName(recordId || "draft");
  const baseName = sanitizeStorageName(String(file.name || "image").replace(/\.[^.]+$/, ""));
  const extension = extensionForImageFile(file);
  const path = `${organizationId}/${safeEntityType}/${safeRecordId}/${Date.now()}-${baseName}.${extension}`;
  const { error } = await supabase.storage
    .from(BRAND_IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || "image/png",
      upsert: true,
    });

  if (error) throw error;
  const { data } = supabase.storage.from(BRAND_IMAGE_BUCKET).getPublicUrl(path);
  return {
    imageUrl: data.publicUrl,
    imagePath: path,
    imageName: file.name || "Brand image",
  };
}

function cloneRecords(records) {
  return records.map(record => ({ ...record }));
}

function hydrateIntegrations(savedIntegrations = []) {
  return baseIntegrations.map(integration => {
    const saved = savedIntegrations.find(item => item.name === integration.name || item.name === integration.key || item.key === integration.key) || {};
    return {
      ...saved,
      ...integration,
      redeemEnabled: typeof saved.redeemEnabled === "boolean" ? saved.redeemEnabled : integration.redeemEnabled,
      icon: integration.icon,
    };
  });
}

function createInitialCrmData() {
  const clientAccounts = cloneRecords(initialClients);
  const companies = cloneRecords(initialAccounts);
  return {
    clientAccounts,
    clients: clientAccounts,
    teamMembers: cloneRecords(initialTeamMembers),
    campaigns: cloneRecords(initialCampaigns),
    companies,
    accounts: companies,
    contacts: cloneRecords(initialContacts),
    deals: cloneRecords(initialDeals),
    activities: cloneRecords(initialActivities),
    researchItems: cloneRecords(initialResearchItems),
    files: cloneRecords(initialFiles),
    scriptItems: cloneRecords(initialScriptItems),
    callInsights: cloneRecords(initialCallInsights),
    meetings: [],
    weeklyReports: cloneRecords(initialWeeklyReports),
    integrations: hydrateIntegrations(),
    pipelineStages: cloneRecords(pipelineColumns),
  };
}

function normalizeCrmData(data) {
  const initial = createInitialCrmData();
  if (!data || typeof data !== "object") return initial;
  const clientAccounts = Array.isArray(data.clientAccounts)
    ? data.clientAccounts
    : Array.isArray(data.clients)
      ? data.clients
      : initial.clientAccounts;
  const companies = Array.isArray(data.companies)
    ? data.companies
    : Array.isArray(data.accounts)
      ? data.accounts
      : initial.companies;
  return {
    ...initial,
    ...data,
    clientAccounts,
    clients: clientAccounts,
    teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : initial.teamMembers,
    campaigns: Array.isArray(data.campaigns) ? data.campaigns : initial.campaigns,
    companies,
    accounts: companies,
    contacts: Array.isArray(data.contacts) ? data.contacts : initial.contacts,
    deals: Array.isArray(data.deals) ? data.deals : initial.deals,
    activities: Array.isArray(data.activities) ? data.activities : initial.activities,
    researchItems: Array.isArray(data.researchItems) ? data.researchItems : initial.researchItems,
    files: Array.isArray(data.files) ? data.files : initial.files,
    scriptItems: Array.isArray(data.scriptItems) ? data.scriptItems : initial.scriptItems,
    callInsights: Array.isArray(data.callInsights) ? data.callInsights : initial.callInsights,
    meetings: Array.isArray(data.meetings) ? data.meetings : initial.meetings,
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

function isAllowedEmail(email) {
  return String(email || "").trim().toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`);
}

function loadUiState() {
  return {};
}

function hasSavedUiState() {
  return false;
}

function saveUiState() {
  return undefined;
}

async function loadRelationalCrmData(organizationId) {
  if (!supabase || !organizationId) return null;

  const [
    clientsResult,
    campaignsResult,
    companiesResult,
    contactsResult,
    campaignTargetsResult,
    clientMembersResult,
    campaignMembersResult,
    meetingsResult,
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id,name,status,industry,website,metadata")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("campaigns")
      .select("id,client_id,name,status,channel,settings")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("companies")
      .select("id,client_id,name,domain,website,industry,employee_count,annual_revenue,status,notes,custom_fields")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("contacts")
      .select("id,client_id,company_id,first_name,last_name,full_name,email,phone,mobile,direct_dial,job_title,linkedin_url,status,custom_fields")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("campaign_targets")
      .select("campaign_id,company_id,contact_id")
      .eq("organization_id", organizationId),
    supabase
      .from("client_members")
      .select("client_id,user_id")
      .eq("organization_id", organizationId),
    supabase
      .from("campaign_members")
      .select("campaign_id,user_id")
      .eq("organization_id", organizationId),
    supabase
      .from("meetings")
      .select("id,organization_id,client_id,campaign_id,company_id,contact_id,user_id,owner_user_id,booked_by_user_id,aircall_call_id,aircall_user_record_id,aircall_user_id,agent_name,title,meeting_at,status,notes,transcript,phone_number,created_at")
      .eq("organization_id", organizationId)
      .order("meeting_at", { ascending: false, nullsFirst: false }),
  ]);

  const results = [clientsResult, campaignsResult, companiesResult, contactsResult, campaignTargetsResult, clientMembersResult, campaignMembersResult, meetingsResult];
  const failedResult = results.find(result => result.error);
  if (failedResult?.error) throw failedResult.error;

  const clients = clientsResult.data || [];
  const campaigns = campaignsResult.data || [];
  const companies = companiesResult.data || [];
  const contacts = contactsResult.data || [];
  const campaignTargets = campaignTargetsResult.data || [];
  const clientMembers = clientMembersResult.data || [];
  const campaignMembers = campaignMembersResult.data || [];
  const meetings = meetingsResult.data || [];

  if (!clients.length && !campaigns.length && !companies.length && !contacts.length) return null;

  const companyById = new Map(companies.map(company => [company.id, company]));

  return normalizeCrmData({
    clientAccounts: clients.map(client => {
      const clientCompanies = companies.filter(company => company.client_id === client.id);
      const clientContacts = contacts.filter(contact => contact.client_id === client.id);
      return {
        id: client.id,
        name: client.name,
        workspace: client.metadata?.workspace || client.name,
        status: titleCase(client.status || "active"),
        owner: client.metadata?.owner || "Workspace Admin",
        metadata: client.metadata || {},
        memberIds: clientMembers.filter(member => member.client_id === client.id).map(member => member.user_id),
        industry: client.industry || "",
        website: client.website || "",
        imageUrl: client.metadata?.imageUrl || "",
        imagePath: client.metadata?.imagePath || "",
        imageName: client.metadata?.imageName || "",
        companies: clientCompanies.length,
        contacts: clientContacts.length,
        health: clientCompanies.length || clientContacts.length ? "Active" : "Needs setup",
      };
    }),
    companies: companies.map(company => ({
      id: company.id,
      clientId: company.client_id,
      name: company.name,
      domain: company.domain || "",
      website: company.website || "",
      owner: "Workspace Admin",
      stage: company.custom_fields?.ui_stage || "Imported",
      status: company.custom_fields?.ui_status || titleCase(company.status || "active"),
      industry: company.industry || "",
      employees: company.employee_count || "",
      value: Number(company.annual_revenue) || 0,
      location: company.custom_fields?.company_hq_location || "",
      lastActivity: "Imported from CRM database",
      nextAction: company.custom_fields?.next_action || "Review company",
      insight: company.notes || "",
      scripts: company.custom_fields?.scripts || null,
    })),
    campaigns: campaigns.map(campaign => {
      const campaignCompanies = new Set(campaignTargets
        .filter(member => member.campaign_id === campaign.id && member.company_id)
        .map(member => member.company_id));
      const campaignContacts = new Set(campaignTargets
        .filter(member => member.campaign_id === campaign.id && member.contact_id)
        .map(member => member.contact_id));
      return {
        id: campaign.id,
        clientId: campaign.client_id,
        name: campaign.name,
        status: titleCase(campaign.status || "active"),
        owner: "Workspace Admin",
        channel: campaign.channel || "Outbound",
        settings: campaign.settings || {},
        memberIds: campaignMembers.filter(member => member.campaign_id === campaign.id).map(member => member.user_id),
        imageUrl: campaign.settings?.imageUrl || "",
        imagePath: campaign.settings?.imagePath || "",
        imageName: campaign.settings?.imageName || "",
        companies: campaignCompanies.size,
        accounts: campaignCompanies.size,
        contacts: campaignContacts.size,
        companyIds: [...campaignCompanies],
        contactIds: [...campaignContacts],
        meetings: 0,
        nextAction: campaign.settings?.next_action || "Review imported company list",
      };
    }),
    meetings: meetings.map(meeting => ({
      id: meeting.id,
      organizationId: meeting.organization_id,
      clientId: meeting.client_id || "",
      campaignId: meeting.campaign_id || "",
      companyId: meeting.company_id || "",
      contactId: meeting.contact_id || "",
      userId: meeting.user_id || "",
      ownerUserId: meeting.owner_user_id || "",
      bookedByUserId: meeting.booked_by_user_id || "",
      aircallCallId: meeting.aircall_call_id || "",
      aircallUserRecordId: meeting.aircall_user_record_id || "",
      aircallUserId: meeting.aircall_user_id || "",
      agentName: meeting.agent_name || "",
      title: meeting.title || "Booked meeting",
      meetingAt: meeting.meeting_at || "",
      status: titleCase(meeting.status || "booked"),
      notes: meeting.notes || "",
      transcript: meeting.transcript || "",
      phoneNumber: meeting.phone_number || "",
      createdAt: meeting.created_at || "",
    })),
    contacts: contacts.map(contact => {
      const company = companyById.get(contact.company_id);
      const name = contact.full_name || [contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email || "Unnamed contact";
      return {
        id: contact.id,
        clientId: contact.client_id,
        companyId: contact.company_id,
        accountId: contact.company_id,
        company: company?.name || "",
        account: company?.name || "",
        name,
        firstName: contact.first_name || "",
        lastName: contact.last_name || "",
        email: contact.email || "",
        phone: contact.direct_dial || contact.phone || "",
        mobile: contact.mobile || "",
        directDial: contact.direct_dial || contact.phone || "",
        title: contact.job_title || "",
        role: contact.job_title || "",
        linkedin: contact.linkedin_url || "",
        status: contact.custom_fields?.ui_status || titleCase(contact.status || "active"),
        owner: "Workspace Admin",
        lastTouch: "Imported from CRM database",
      };
    }),
  });
}

async function loadSyncedCrmData(_userId, organizationId) {
  if (!supabase || !organizationId) return createInitialCrmData();
  const relationalData = await loadRelationalCrmData(organizationId);
  return relationalData || createInitialCrmData();
}

async function saveRelationalCampaign(organizationId, campaign) {
  if (!supabase || !organizationId || !UUID_PATTERN.test(String(campaign?.id || ""))) return;
  const payload = {
    name: campaign.name,
    status: normalizeCampaignStatus(campaign.status || "active"),
    channel: campaign.channel || "Outbound",
    settings: {
      ...(campaign.settings || {}),
      next_action: campaign.nextAction || "",
      imageUrl: campaign.imageUrl || "",
      imagePath: campaign.imagePath || "",
      imageName: campaign.imageName || "",
    },
  };
  const { error } = await supabase
    .from("campaigns")
    .update(payload)
    .eq("id", campaign.id)
    .eq("organization_id", organizationId);

  if (error) throw error;
}

async function saveRelationalClient(organizationId, client) {
  if (!supabase || !organizationId || !UUID_PATTERN.test(String(client?.id || ""))) return;
  const normalizedStatus = String(client.status || "active").trim().toLowerCase();
  const payload = {
    name: client.name,
    status: ["active", "inactive", "archived"].includes(normalizedStatus) ? normalizedStatus : "active",
    website: client.website || null,
    industry: client.industry || null,
    metadata: {
      ...(client.metadata || {}),
      workspace: client.workspace || "",
      owner: client.owner || "",
      imageUrl: client.imageUrl || "",
      imagePath: client.imagePath || "",
      imageName: client.imageName || "",
    },
  };
  const { error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", client.id)
    .eq("organization_id", organizationId);

  if (error) throw error;
}

async function createRelationalClient(organizationId, userId, client) {
  if (!supabase || !organizationId) return null;
  const payload = {
    organization_id: organizationId,
    name: client.name,
    slug: `${makeSlug(client.name)}-${Date.now().toString(36)}`,
    status: "active",
    owner_id: UUID_PATTERN.test(String(userId || "")) ? userId : null,
    website: client.website || null,
    industry: client.industry || null,
    metadata: {
      workspace: client.workspace || "",
      owner: client.owner || "",
      imageUrl: client.imageUrl || "",
      imagePath: client.imagePath || "",
      imageName: client.imageName || "",
    },
  };
  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select("id,name,status,industry,website,metadata")
    .single();

  if (error) throw error;
  return data;
}

async function createRelationalCampaign(organizationId, campaign) {
  if (!supabase || !organizationId) return null;
  const payload = {
    organization_id: organizationId,
    client_id: campaign.clientId,
    name: campaign.name,
    status: normalizeCampaignStatus(campaign.status || "active"),
    channel: campaign.channel || "Outbound",
    settings: {
      next_action: campaign.nextAction || "",
      imageUrl: campaign.imageUrl || "",
      imagePath: campaign.imagePath || "",
      imageName: campaign.imageName || "",
    },
  };
  const { data, error } = await supabase
    .from("campaigns")
    .insert(payload)
    .select("id,client_id,name,status,channel,settings")
    .single();

  if (error) throw error;
  return data;
}

function sanitizeRelationalMemberIds(memberIds = [], allowedUserIds = []) {
  const allowed = new Set(allowedUserIds.filter(id => UUID_PATTERN.test(String(id || ""))));
  return [...new Set(memberIds)]
    .filter(id => UUID_PATTERN.test(String(id || "")))
    .filter(id => !allowed.size || allowed.has(id));
}

async function replaceRelationalClientMembers(organizationId, clientId, memberIds = [], allowedUserIds = []) {
  if (!supabase || !organizationId || !UUID_PATTERN.test(String(clientId || ""))) return;
  const nextMemberIds = sanitizeRelationalMemberIds(memberIds, allowedUserIds);
  const { error: deleteError } = await supabase
    .from("client_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("client_id", clientId);

  if (deleteError) throw deleteError;
  if (!nextMemberIds.length) return;

  const rows = nextMemberIds.map(userId => ({
    organization_id: organizationId,
    client_id: clientId,
    user_id: userId,
    role: "member",
  }));
  const { error } = await supabase.from("client_members").insert(rows);
  if (error) throw error;
}

async function replaceRelationalCampaignMembers(organizationId, campaign, memberIds = [], allowedUserIds = []) {
  if (!supabase || !organizationId || !UUID_PATTERN.test(String(campaign?.id || "")) || !UUID_PATTERN.test(String(campaign?.clientId || ""))) return;
  const nextMemberIds = sanitizeRelationalMemberIds(memberIds, allowedUserIds);
  const { error: deleteError } = await supabase
    .from("campaign_members")
    .delete()
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaign.id);

  if (deleteError) throw deleteError;
  if (!nextMemberIds.length) return;

  const rows = nextMemberIds.map(userId => ({
    organization_id: organizationId,
    client_id: campaign.clientId,
    campaign_id: campaign.id,
    user_id: userId,
    role: "member",
  }));
  const { error } = await supabase.from("campaign_members").insert(rows);
  if (error) throw error;
}

async function createRelationalMeeting(organizationId, meeting) {
  if (!supabase || !organizationId) return null;
  const payload = {
    organization_id: organizationId,
    client_id: meeting.clientId,
    campaign_id: UUID_PATTERN.test(String(meeting.campaignId || "")) ? meeting.campaignId : null,
    company_id: UUID_PATTERN.test(String(meeting.companyId || "")) ? meeting.companyId : null,
    contact_id: UUID_PATTERN.test(String(meeting.contactId || "")) ? meeting.contactId : null,
    user_id: meeting.userId,
    owner_user_id: UUID_PATTERN.test(String(meeting.ownerUserId || "")) ? meeting.ownerUserId : null,
    booked_by_user_id: UUID_PATTERN.test(String(meeting.bookedByUserId || "")) ? meeting.bookedByUserId : null,
    aircall_call_id: UUID_PATTERN.test(String(meeting.aircallCallId || "")) ? meeting.aircallCallId : null,
    aircall_user_record_id: UUID_PATTERN.test(String(meeting.aircallUserRecordId || "")) ? meeting.aircallUserRecordId : null,
    aircall_user_id: meeting.aircallUserId || null,
    agent_name: meeting.agentName || null,
    title: meeting.title || "Booked meeting",
    meeting_at: dateTimeLocalInputToIso(meeting.meetingAt) || meeting.meetingAt || null,
    status: normalizeLookupValue(meeting.status || "booked").toLowerCase() || "booked",
    notes: meeting.notes || null,
    transcript: meeting.transcript || null,
    phone_number: meeting.phoneNumber || null,
  };
  const { data, error } = await supabase
    .from("meetings")
    .insert(payload)
    .select("id,organization_id,client_id,campaign_id,company_id,contact_id,user_id,owner_user_id,booked_by_user_id,aircall_call_id,aircall_user_record_id,aircall_user_id,agent_name,title,meeting_at,status,notes,transcript,phone_number,created_at")
    .single();

  if (error) throw error;
  return {
    id: data.id,
    organizationId: data.organization_id,
    clientId: data.client_id || "",
    campaignId: data.campaign_id || "",
    companyId: data.company_id || "",
    contactId: data.contact_id || "",
    userId: data.user_id || "",
    ownerUserId: data.owner_user_id || "",
    bookedByUserId: data.booked_by_user_id || "",
    aircallCallId: data.aircall_call_id || "",
    aircallUserRecordId: data.aircall_user_record_id || "",
    aircallUserId: data.aircall_user_id || "",
    agentName: data.agent_name || "",
    title: data.title || "Booked meeting",
    meetingAt: data.meeting_at || "",
    status: titleCase(data.status || "booked"),
    notes: data.notes || "",
    transcript: data.transcript || "",
    phoneNumber: data.phone_number || "",
    createdAt: data.created_at || "",
  };
}

async function deleteRelationalMeeting(organizationId, meetingId) {
  if (!supabase || !organizationId || !UUID_PATTERN.test(String(meetingId || ""))) return;
  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("organization_id", organizationId)
    .eq("id", meetingId);

  if (error) throw error;
}

function buildCompanyPayload(organizationId, company) {
  return {
    organization_id: organizationId,
    client_id: UUID_PATTERN.test(String(company.clientId || "")) ? company.clientId : null,
    name: company.name,
    slug: `${makeSlug(company.name)}-${Date.now().toString(36)}`,
    domain: company.domain && company.domain !== "No domain" ? company.domain : null,
    website: company.website || null,
    industry: company.industry && company.industry !== "Unspecified" ? company.industry : null,
    employee_count: parsePositiveInteger(company.employees),
    annual_revenue: Number(company.value) || null,
    status: "active",
    notes: company.insight || null,
    custom_fields: {
      company_hq_location: company.location && company.location !== "Unspecified" ? company.location : "",
      ui_stage: company.stage || "",
      ui_status: company.status || "",
      next_action: company.nextAction || "",
      scripts: company.scripts || null,
    },
  };
}

async function saveRelationalCompany(organizationId, company) {
  if (!supabase || !organizationId || !UUID_PATTERN.test(String(company?.id || ""))) return null;
  const payload = buildCompanyPayload(organizationId, company);
  delete payload.organization_id;
  delete payload.slug;
  const { data, error } = await supabase
    .from("companies")
    .update(payload)
    .eq("id", company.id)
    .eq("organization_id", organizationId)
    .select("id,client_id,name,domain,website,industry,employee_count,annual_revenue,status,notes,custom_fields")
    .single();

  if (error) throw error;
  return data;
}

async function createRelationalCompany(organizationId, company) {
  if (!supabase || !organizationId) return null;
  const { data, error } = await supabase
    .from("companies")
    .insert(buildCompanyPayload(organizationId, company))
    .select("id,client_id,name,domain,website,industry,employee_count,annual_revenue,status,notes,custom_fields")
    .single();

  if (error) throw error;
  return data;
}

function buildContactPayload(organizationId, contact) {
  const { firstName, lastName } = splitContactName(contact.name);
  return {
    organization_id: organizationId,
    client_id: UUID_PATTERN.test(String(contact.clientId || "")) ? contact.clientId : null,
    company_id: contact.accountId || contact.companyId,
    contact_name: contact.name,
    first_name: firstName || null,
    last_name: lastName || null,
    full_name: contact.name,
    company: contact.account || contact.company || null,
    email: normalizeEmail(contact.email) || null,
    phone: contact.directDial || null,
    mobile: contact.mobile || null,
    direct_dial: contact.directDial || null,
    manual_email: normalizeEmail(contact.email) || null,
    manual_mobile: contact.mobile || null,
    manual_direct_dial: contact.directDial || null,
    job_title: contact.role || contact.title || null,
    data_source: "manual",
    normalized_identity_key: `person:${normalizeLookupValue(contact.name).toLowerCase()}|${normalizeLookupValue(contact.account || contact.company).toLowerCase()}`,
    status: "active",
    custom_fields: {
      ui_status: contact.status || "",
    },
  };
}

async function createRelationalContact(organizationId, contact) {
  if (!supabase || !organizationId) return null;
  const { data, error } = await supabase
    .from("contacts")
    .insert(buildContactPayload(organizationId, contact))
    .select("id,client_id,company_id,first_name,last_name,full_name,email,phone,mobile,direct_dial,job_title,linkedin_url,status,custom_fields")
    .single();

  if (error) throw error;
  return data;
}

async function saveRelationalContact(organizationId, contact) {
  if (!supabase || !organizationId || !UUID_PATTERN.test(String(contact?.id || ""))) return null;
  const payload = buildContactPayload(organizationId, contact);
  delete payload.organization_id;
  const { data, error } = await supabase
    .from("contacts")
    .update(payload)
    .eq("id", contact.id)
    .eq("organization_id", organizationId)
    .select("id,client_id,company_id,first_name,last_name,full_name,email,phone,mobile,direct_dial,job_title,linkedin_url,status,custom_fields")
    .single();

  if (error) throw error;
  return data;
}

async function saveRelationalCampaignCompanyTarget(organizationId, campaign, companyId) {
  if (!supabase || !organizationId || !UUID_PATTERN.test(String(campaign?.id || "")) || !UUID_PATTERN.test(String(companyId || ""))) return;
  const payload = {
    organization_id: organizationId,
    client_id: campaign.clientId,
    campaign_id: campaign.id,
    company_id: companyId,
    status: "queued",
    metadata: { source: "manual_campaign_company_add" },
  };
  const { error } = await supabase
    .from("campaign_targets")
    .insert(payload);

  if (error && error.code !== "23505") throw error;
}

async function loadWorkspaceUsers(organizationId) {
  if (!supabase || !organizationId) return [];
  const { data, error } = await supabase
    .from("users")
    .select("id,email,first_name,last_name,display_name,role,status,aircall_user_id,currency_code")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("display_name", { ascending: true });

  if (error) throw error;

  return (data || []).map(workspaceUser => {
    const displayName = workspaceUser.display_name || [workspaceUser.first_name, workspaceUser.last_name].filter(Boolean).join(" ");
    const name = displayName || workspaceUser.email?.split("@")[0] || "Workspace user";
    return {
      id: workspaceUser.id,
      email: workspaceUser.email,
      name,
      firstName: workspaceUser.first_name || "",
      lastName: workspaceUser.last_name || "",
      role: titleCase(workspaceUser.role || "member"),
      roleKey: workspaceUser.role || "member",
      initials: accountInitial(name),
      status: "Active",
      aircallUserId: workspaceUser.aircall_user_id || "",
      currencyCode: normalizeCurrencyCode(workspaceUser.currency_code),
    };
  });
}

function mapAuthUserToWorkspaceUser(user) {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  const profile = user.crm_profile || {};
  const name = profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(" ") || metadata.display_name || [metadata.first_name, metadata.last_name].filter(Boolean).join(" ") || user.email?.split("@")[0] || "Workspace user";
  return {
    id: user.id,
    email: user.email,
    name,
    firstName: profile.firstName || metadata.first_name || "",
    lastName: profile.lastName || metadata.last_name || "",
    role: "Current user",
    roleKey: "member",
    initials: accountInitial(name),
    status: "Active",
    aircallUserId: profile.aircallUserId || metadata.aircallUserId || "",
    currencyCode: normalizeCurrencyCode(profile.currencyCode),
  };
}

function titleCaseNamePart(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\b[a-z]/g, letter => letter.toUpperCase());
}

function deriveUserProfileFromEmail(email = "") {
  const localPart = String(email || "").split("@")[0] || "";
  const parts = localPart.split(/[._-]+/).map(titleCaseNamePart).filter(Boolean);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ");
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || localPart || "Workspace user";
  return { firstName, lastName, displayName };
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
    test_account_enabled: settings?.test_account_enabled === true,
  };
}

function stripTestWorkspaceAccount(workspaceUsers = []) {
  return (workspaceUsers || []).filter(user => user?.id !== TEST_WORKSPACE_USER.id);
}

function workspaceUsersForTestMode(workspaceUsers = [], settings = {}) {
  const normalizedSettings = normalizeAdminSettings(settings);
  const realUsers = stripTestWorkspaceAccount(workspaceUsers);
  return normalizedSettings.test_account_enabled
    ? [...realUsers, { ...TEST_WORKSPACE_USER }]
    : realUsers;
}

function effectiveWorkspaceUserForSession(authUser, workspaceUsers = [], settings = {}) {
  const normalizedSettings = normalizeAdminSettings(settings);
  if (normalizedSettings.test_account_enabled) return { ...TEST_WORKSPACE_USER };
  return (workspaceUsers || []).find(workspaceUser => workspaceUser.id === authUser?.id)
    || mapAuthUserToWorkspaceUser(authUser);
}

function effectiveAccessStateForSession(adminSettingsState = {}, settings = {}) {
  const normalizedSettings = normalizeAdminSettings(settings);
  if (normalizedSettings.test_account_enabled) {
    return {
      role: TEST_WORKSPACE_USER.roleKey,
      isAdmin: false,
      isOrgAdmin: false,
      isTestAccount: true,
    };
  }
  return {
    role: adminSettingsState.role || "member",
    isAdmin: Boolean(adminSettingsState.isAdmin),
    isOrgAdmin: Boolean(adminSettingsState.isOrgAdmin),
    isTestAccount: false,
  };
}

function aircallCallBelongsToWorkspaceUser(call = {}, workspaceUser = {}) {
  return Boolean(
    (call.userId && workspaceUser.id && call.userId === workspaceUser.id)
    || (call.aircallUserId && workspaceUser.aircallUserId && String(call.aircallUserId) === String(workspaceUser.aircallUserId)),
  );
}

function recordHasMember(record = {}, userId = "") {
  return Boolean(userId && Array.isArray(record.memberIds) && record.memberIds.includes(userId));
}

function scopeCrmDataForWorkspaceUser(data, workspaceUser = {}, accessState = {}) {
  if (accessState.isAdmin) return data;
  const userId = workspaceUser?.id || "";
  if (!userId) {
    return {
      ...data,
      clientAccounts: [],
      clients: [],
      campaigns: [],
      companies: [],
      accounts: [],
      contacts: [],
      deals: [],
      activities: [],
      meetings: [],
      researchItems: [],
      scriptItems: [],
      weeklyReports: [],
    };
  }

  const campaignIds = new Set((data.campaigns || [])
    .filter(campaign => normalizeCampaignStatus(campaign.status) === "active" && recordHasMember(campaign, userId))
    .map(campaign => campaign.id));
  const directClientIds = new Set((data.clients || []).filter(client => recordHasMember(client, userId)).map(client => client.id));
  const clientIds = new Set([
    ...directClientIds,
    ...(data.campaigns || []).filter(campaign => campaignIds.has(campaign.id)).map(campaign => campaign.clientId),
  ]);
  const campaignAccountIds = new Set((data.campaigns || [])
    .filter(campaign => campaignIds.has(campaign.id))
    .flatMap(campaign => Array.isArray(campaign.companyIds) ? campaign.companyIds : []));
  const campaignContactIds = new Set((data.campaigns || [])
    .filter(campaign => campaignIds.has(campaign.id))
    .flatMap(campaign => Array.isArray(campaign.contactIds) ? campaign.contactIds : []));
  const accountIds = new Set((data.accounts || [])
    .filter(account => directClientIds.has(account.clientId) || campaignAccountIds.has(account.id))
    .map(account => account.id));
  const contactIds = new Set((data.contacts || [])
    .filter(contact => directClientIds.has(contact.clientId) || campaignContactIds.has(contact.id) || accountIds.has(contact.accountId) || accountIds.has(contact.companyId))
    .map(contact => contact.id));

  return refreshCrmData({
    ...data,
    clientAccounts: (data.clients || []).filter(client => clientIds.has(client.id)),
    clients: (data.clients || []).filter(client => clientIds.has(client.id)),
    campaigns: (data.campaigns || []).filter(campaign => campaignIds.has(campaign.id)),
    companies: (data.accounts || []).filter(account => accountIds.has(account.id)),
    accounts: (data.accounts || []).filter(account => accountIds.has(account.id)),
    contacts: (data.contacts || []).filter(contact => contactIds.has(contact.id)),
    deals: (data.deals || []).filter(deal => clientIds.has(deal.clientId) || accountIds.has(deal.accountId) || contactIds.has(deal.contactId) || campaignIds.has(deal.campaignId)),
    activities: (data.activities || []).filter(activity => (
      !activity.clientId || clientIds.has(activity.clientId) || !activity.campaignId || campaignIds.has(activity.campaignId) || !activity.contactId || contactIds.has(activity.contactId)
    )),
    meetings: (data.meetings || []).filter(meeting => clientIds.has(meeting.clientId) || campaignIds.has(meeting.campaignId)),
    researchItems: (data.researchItems || []).filter(item => clientIds.has(item.clientId) || accountIds.has(item.accountId) || campaignIds.has(item.campaignId)),
    scriptItems: (data.scriptItems || []).filter(item => clientIds.has(item.clientId) || accountIds.has(item.accountId) || campaignIds.has(item.campaignId)),
    weeklyReports: (data.weeklyReports || []).filter(report => clientIds.has(report.clientId) || campaignIds.has(report.campaignId)),
  });
}

function formatRole(role) {
  const normalizedRole = String(role || "member").toLowerCase().replaceAll(" ", "_");
  if (normalizedRole === "org_admin") return "org admin";
  if (normalizedRole === "org_owner") return "Owner";
  return titleCase(normalizedRole.replaceAll("_", " "));
}

function formatDateTime(value) {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function startOfLocalDay(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function toLocalDateKey(value = new Date()) {
  const date = startOfLocalDay(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizeDateKey(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? "" : toLocalDateKey(date);
}

function localDateFromKey(key) {
  const normalized = normalizeDateKey(key);
  if (!normalized) return startOfLocalDay(new Date());
  const [year, month, day] = normalized.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function monthKeyFromDateKey(key) {
  const date = localDateFromKey(key);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getAircallDateRange(rangeMode, selectedDateKey) {
  const today = startOfLocalDay(new Date());
  if (rangeMode === "yesterday") {
    const start = addDays(today, -1);
    return { start, end: today, days: 1 };
  }
  if (rangeMode === "7") {
    const start = addDays(today, -6);
    return { start, end: addDays(today, 1), days: 7 };
  }
  if (rangeMode === "date") {
    const start = localDateFromKey(selectedDateKey);
    return { start, end: addDays(start, 1), days: 1 };
  }
  return { start: today, end: addDays(today, 1), days: 1 };
}

function formatAircallDateLabel(key) {
  const date = localDateFromKey(key);
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "2-digit", month: "short" }).format(date);
}

function describeAircallDateRange(rangeMode, selectedDateKey, dateRange) {
  if (rangeMode === "today") return `Today · ${formatAircallDateLabel(toLocalDateKey(dateRange.start))}`;
  if (rangeMode === "yesterday") return `Yesterday · ${formatAircallDateLabel(toLocalDateKey(dateRange.start))}`;
  if (rangeMode === "7") {
    return `${formatAircallDateLabel(toLocalDateKey(dateRange.start))} - ${formatAircallDateLabel(toLocalDateKey(addDays(dateRange.end, -1)))}`;
  }
  return formatAircallDateLabel(selectedDateKey);
}

function formatAircallTrendLabel(key, dayCount) {
  const date = localDateFromKey(key);
  if (dayCount === 1) return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
  return new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(date);
}

function formatAircallTrendSubLabel(key, dayCount) {
  const date = localDateFromKey(key);
  return new Intl.DateTimeFormat(undefined, dayCount === 1 ? { day: "2-digit", month: "short" } : { day: "2-digit" }).format(date);
}

function formatCalendarMonth(monthKey) {
  const [year, month] = String(monthKey || "").split("-").map(Number);
  const date = new Date(year || new Date().getFullYear(), (month || 1) - 1, 1);
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);
}

function toDateTimeLocalInputValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

function dateTimeLocalInputToIso(value = "") {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function buildCalendarDays(monthKey) {
  const [year, month] = String(monthKey || monthKeyFromDateKey(toLocalDateKey(new Date()))).split("-").map(Number);
  const firstOfMonth = new Date(year, month - 1, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = addDays(firstOfMonth, -startOffset);
  return [...Array(42)].map((_, index) => {
    const date = addDays(gridStart, index);
    return {
      date,
      key: toLocalDateKey(date),
      inMonth: date.getMonth() === firstOfMonth.getMonth(),
    };
  });
}

function formatDuration(seconds) {
  const totalSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = Math.round(totalSeconds % 60);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    return `${hours}h ${restMinutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

function sentimentTone(label = "", score) {
  const normalized = String(label || "").toLowerCase();
  const numericScore = Number(score);
  if (normalized.includes("positive") || numericScore > 0.25) return "positive";
  if (normalized.includes("negative") || numericScore < -0.25) return "negative";
  return "neutral";
}

function getAircallTagLabel(tag) {
  if (!tag) return "";
  if (typeof tag === "string") return tag.trim();
  return String(tag.name || tag.label || tag.value || tag.tag || "").trim();
}

function deriveAircallCallSentiment(call = {}) {
  const hasNativeSentiment = Boolean(call.sentimentLabel) || call.sentimentScore !== null;
  if (hasNativeSentiment) {
    const tone = sentimentTone(call.sentimentLabel, call.sentimentScore);
    const numericScore = Number(call.sentimentScore);
    return {
      tone,
      label: call.sentimentLabel || titleCase(tone),
      score: Number.isFinite(numericScore) ? numericScore : tone === "positive" ? 1 : tone === "negative" ? -1 : 0,
      source: "aircall",
    };
  }

  const tagLabels = (call.tags || []).map(getAircallTagLabel).filter(Boolean);
  const tagText = tagLabels.join(" | ").toLowerCase();
  const outcomeText = String(call.myOutcome || "").toLowerCase();
  const combinedText = [tagText, outcomeText].filter(Boolean).join(" | ");
  if (!combinedText) return null;

  if (combinedText.includes("appointment booked")) {
    return { tone: "positive", label: "Appointment booked", score: 1, source: "aircall-tags" };
  }
  if (combinedText.includes("deal closed")) {
    return { tone: "positive", label: "Deal closed", score: 1, source: "aircall-tags" };
  }
  if (combinedText.includes("no interest")) {
    return { tone: "negative", label: "No interest", score: -1, source: "aircall-tags" };
  }
  if (combinedText.includes("wrong number") || combinedText.includes("invalid number") || combinedText.includes("not connected")) {
    return { tone: "negative", label: "Bad number", score: -1, source: "aircall-tags" };
  }

  const isNegative = [
    "bad",
    "disqualified",
    "do not call",
  ].some(term => combinedText.includes(term));
  if (isNegative) {
    return { tone: "negative", label: "Bad outcome", score: -1, source: "aircall-tags" };
  }

  const isPositive = [
    "good",
    "information gained",
    "info gained",
    "lead nurture",
    "callback",
    "follow up",
    "appointment reminder",
    "gatekeeper",
  ].some(term => combinedText.includes(term));
  if (isPositive) {
    return { tone: "positive", label: "Good outcome", score: 1, source: "aircall-tags" };
  }

  const isNeutral = [
    "no answer",
    "voicemail",
    "dial out",
    "other",
    "connected call",
  ].some(term => combinedText.includes(term));
  if (isNeutral) {
    return { tone: "neutral", label: "Neutral outcome", score: 0, source: "aircall-tags" };
  }

  return null;
}

function buildAircallAppCallUrl(callId) {
  const normalizedCallId = String(callId || "").trim();
  return normalizedCallId ? `https://phone.aircall.io/calls/${normalizedCallId}` : "";
}

function normalizeAircallCallLink(value, callId) {
  const url = String(value || "").trim();
  if (/^https:\/\/api\.aircall\.io\/v1\/calls\//i.test(url)) return buildAircallAppCallUrl(callId);
  return url || buildAircallAppCallUrl(callId);
}

function getTranscriptUtteranceText(utterance) {
  return String(utterance?.text || utterance?.content || utterance?.transcript || "").trim();
}

function getTranscriptSpeakerLabel(utterance, call, agentName, otherParty) {
  const explicitSpeaker = utterance?.speaker_name
    || utterance?.speakerName
    || utterance?.participant_name
    || utterance?.participantName
    || utterance?.user_name
    || utterance?.userName
    || utterance?.name;
  if (explicitSpeaker) return String(explicitSpeaker).trim();

  const userId = String(utterance?.user_id || utterance?.userId || utterance?.aircall_user_id || utterance?.aircallUserId || "").trim();
  if (userId && userId === String(call.aircallUserId || "").trim()) return agentName;

  const role = String(utterance?.role || utterance?.participant_type || utterance?.participantType || utterance?.speaker_type || utterance?.speakerType || "").toLowerCase();
  if (["agent", "user", "teammate", "internal"].some(value => role.includes(value))) return agentName;
  if (["customer", "contact", "external", "callee", "caller"].some(value => role.includes(value))) return otherParty;

  const speaker = utterance?.speaker ?? utterance?.speaker_id ?? utterance?.speakerId ?? utterance?.channel;
  if (speaker !== null && speaker !== undefined && speaker !== "") return `Speaker ${String(speaker).trim()}`;
  return "Speaker";
}

function formatTranscriptOffset(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value < 0) return "";
  const minutes = Math.floor(value / 60);
  const restSeconds = Math.floor(value % 60);
  return `${minutes}:${String(restSeconds).padStart(2, "0")}`;
}

function getTranscriptSpeakerRole(utterance, call) {
  const role = String(utterance?.participant_type || utterance?.participantType || utterance?.role || utterance?.speaker_type || utterance?.speakerType || "").toLowerCase();
  if (["agent", "user", "teammate", "internal"].some(value => role.includes(value))) return "agent";
  if (["customer", "contact", "external", "callee", "caller"].some(value => role.includes(value))) return "other";

  const userId = String(utterance?.user_id || utterance?.userId || utterance?.aircall_user_id || utterance?.aircallUserId || "").trim();
  if (userId && userId === String(call.aircallUserId || "").trim()) return "agent";
  return "unknown";
}

function getTranscriptTurns(call, agentName, otherParty) {
  const utterances = Array.isArray(call.transcriptUtterances) ? call.transcriptUtterances : [];
  if (!utterances.length && call.transcriptText) {
    return String(call.transcriptText)
      .split(/\n+/)
      .map(text => text.trim())
      .filter(Boolean)
      .map((text, index) => ({
        id: `fallback:${index}`,
        role: "unknown",
        speaker: "Transcript",
        time: "",
        text,
      }));
  }

  return utterances
    .map((utterance, index) => {
      const text = getTranscriptUtteranceText(utterance);
      if (!text) return null;
      const role = getTranscriptSpeakerRole(utterance, call);
      const speaker = role === "agent"
        ? agentName
        : role === "other"
          ? otherParty
          : getTranscriptSpeakerLabel(utterance, call, agentName, otherParty);
      return {
        id: `${role}:${utterance?.start_time ?? utterance?.startTime ?? index}`,
        role,
        speaker,
        time: formatTranscriptOffset(utterance?.start_time ?? utterance?.startTime),
        text,
      };
    })
    .filter(Boolean);
}

function cleanAircallNumberOwnerName(value = "", aircallUsers = []) {
  const rawName = String(value || "").trim();
  if (!rawName) return "Unknown";
  if (/mainline/i.test(rawName)) return rawName.replace(/\s+Number$/i, "").trim();

  const baseName = rawName
    .replace(/\s+(UK|IE|US)\s+Mobile\s+Number$/i, "")
    .replace(/\s+(UK|IE|US)\s+Mobile$/i, "")
    .replace(/\s+Mobile\s+Number$/i, "")
    .replace(/\s+Mobile$/i, "")
    .replace(/\s+Number$/i, "")
    .trim();

  const normalizedBase = baseName.toLowerCase();
  const matchedUser = aircallUsers.find(user => {
    const normalizedName = String(user.name || "").toLowerCase();
    const firstName = normalizedName.split(/\s+/)[0] || "";
    const baseFirstName = normalizedBase.split(/\s+/)[0] || "";
    return normalizedName === normalizedBase
      || normalizedName.startsWith(`${normalizedBase} `)
      || (baseFirstName.length >= 3 && firstName.startsWith(baseFirstName));
  });

  return matchedUser?.name || baseName || rawName;
}

function roleAccessState(role) {
  return {
    isAdmin: ADMIN_ROLES.has(role),
    isOrgAdmin: ORG_ADMIN_ROLES.has(role),
  };
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

function mapAircallUserRecord(record = {}) {
  return {
    id: record.id,
    organizationId: record.organization_id,
    aircallUserId: record.aircall_user_id || "",
    linkedUserId: record.linked_user_id || "",
    email: record.email || "",
    name: record.name || [record.first_name, record.last_name].filter(Boolean).join(" ") || record.email || "Aircall user",
    availabilityStatus: record.availability_status || "",
    matchStatus: record.match_status || "unmatched",
    matchReason: record.match_reason || "",
    matchConfidence: Number(record.match_confidence) || 0,
    lastSeenAt: record.last_seen_at || "",
  };
}

function mapAircallCallRecord(record = {}) {
  return {
    id: record.id,
    organizationId: record.organization_id,
    clientId: record.client_id || "",
    campaignId: record.campaign_id || "",
    companyId: record.company_id || "",
    contactId: record.contact_id || "",
    userId: record.user_id || "",
    userName: record.user_name || "",
    userEmail: record.user_email || "",
    aircallUserId: record.aircall_user_id || "",
    aircallCallId: record.aircall_call_id,
    callUuid: record.aircall_call_uuid || "",
    direction: record.direction || "",
    status: record.status || "",
    missedCallReason: record.missed_call_reason || "",
    startedAt: record.started_at || "",
    answeredAt: record.answered_at || "",
    endedAt: record.ended_at || "",
    durationSeconds: Number(record.duration_seconds) || 0,
    externalPhoneNumber: record.external_phone_number || record.raw_digits || "",
    recordingUrl: record.recording_url || record.recording_short_url || "",
    directLink: normalizeAircallCallLink(record.direct_link, record.aircall_call_id),
    summary: record.summary || "",
    sentimentLabel: record.sentiment_label || "",
    sentimentScore: record.sentiment_score === null || record.sentiment_score === undefined ? null : Number(record.sentiment_score),
    transcriptText: record.transcript_text || "",
    transcriptUtterances: Array.isArray(record.transcript_utterances) ? record.transcript_utterances : [],
    myOutcome: record.my_outcome || "",
    tags: Array.isArray(record.tags) ? record.tags : [],
    comments: Array.isArray(record.comments) ? record.comments : [],
    aircallNumberName: record.aircall_number_name || "",
    aircallNumberDigits: record.aircall_number_digits || "",
  };
}

async function loadAircallDashboardData(organizationId) {
  if (!supabase || !organizationId) return { users: [], calls: [], dailyStats: [] };

  const [usersResult, callsResult, statsResult] = await Promise.all([
    supabase
      .from("aircall_users")
      .select("id,organization_id,aircall_user_id,linked_user_id,email,name,first_name,last_name,availability_status,match_status,match_reason,match_confidence,last_seen_at")
      .eq("organization_id", organizationId)
      .order("name", { ascending: true }),
    supabase
      .from("aircall_contact_call_timeline")
      .select("*")
      .eq("organization_id", organizationId)
      .order("started_at", { ascending: false })
      .limit(500),
    supabase
      .from("aircall_user_daily_stats")
      .select("*")
      .eq("organization_id", organizationId)
      .order("call_date", { ascending: false })
      .limit(180),
  ]);

  const missingAircallTables = [usersResult, callsResult, statsResult].some(result => ["42P01", "42703"].includes(result.error?.code));
  if (missingAircallTables) return { users: [], calls: [], dailyStats: [], unavailable: true };

  const failedResult = [usersResult, callsResult, statsResult].find(result => result.error);
  if (failedResult?.error) throw failedResult.error;

  return {
    users: (usersResult.data || []).map(mapAircallUserRecord),
    calls: (callsResult.data || []).map(mapAircallCallRecord),
    dailyStats: (statsResult.data || []).map(record => ({
      organizationId: record.organization_id,
      userId: record.user_id || "",
      aircallUserId: record.aircall_user_id || "",
      callDate: record.call_date,
      callsTotal: Number(record.calls_total) || 0,
      outboundCalls: Number(record.outbound_calls) || 0,
      inboundCalls: Number(record.inbound_calls) || 0,
      answeredCalls: Number(record.answered_calls) || 0,
      recordedCalls: Number(record.recorded_calls) || 0,
      durationSecondsTotal: Number(record.duration_seconds_total) || 0,
      averageDurationSeconds: Number(record.average_duration_seconds) || 0,
    })),
  };
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

function getDisplayPhoneNumber(value) {
  const rawValue = normalizeLookupValue(value);
  const normalizedValue = normalizePhone(rawValue);
  const digitCount = normalizedValue.replace(/\D/g, "").length;
  return digitCount >= 7 ? rawValue : "";
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

function makeCompanySlug(value) {
  return normalizeLookupValue(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "company";
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
    companyId: record.company_id || "",
    contactName: record.contact_name || record.full_name || "",
    firstName: record.first_name || "",
    lastName: record.last_name || "",
    company: record.company || "",
    jobTitle: record.job_title || "",
    location: record.location || "",
    linkedinProfileUrl: record.linkedin_profile_url || record.linkedin_url || "",
    manualEmail: record.manual_email || record.email || "",
    manualMobile: record.manual_mobile || record.mobile || "",
    manualDirectDial: record.manual_direct_dial || record.direct_dial || record.phone || "",
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
    .from("contacts")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data || []).map(mapContactDatabaseRecord);
}

async function ensureLeadCompanyRecord(organizationId, companyName) {
  const cleanName = normalizeLookupValue(companyName);
  if (!supabase || !organizationId || !cleanName) throw new Error("Add a company before saving this contact.");

  const { data: existing, error: findError } = await supabase
    .from("companies")
    .select("id,name")
    .eq("organization_id", organizationId)
    .ilike("name", cleanName)
    .maybeSingle();

  if (findError) throw findError;
  if (existing?.id) return existing;

  const { data, error } = await supabase
    .from("companies")
    .insert({
      organization_id: organizationId,
      name: cleanName,
      slug: makeCompanySlug(cleanName),
      status: "active",
    })
    .select("id,name")
    .single();

  if (error) throw error;
  return data;
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
  return null;
}

function saveLeadFinderSearchState() {
  return undefined;
}

function clearLeadFinderSearchState() {
  return undefined;
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
  const leadMobile = getDisplayPhoneNumber(lead.manualMobile);
  const leadDirectDial = getDisplayPhoneNumber(lead.manualDirectDial);
  const match = findLeadDatabaseMatch(lead, contactDatabase);
  return {
    mobile: leadMobile || getDisplayPhoneNumber(match?.manualMobile),
    directDial: leadDirectDial || getDisplayPhoneNumber(match?.manualDirectDial),
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

const leadDebugFields = [
  ["contactName", "Name"],
  ["company", "Company"],
  ["jobTitle", "Job title"],
  ["seniority", "Seniority"],
  ["department", "Department"],
  ["location", "Location"],
  ["linkedinProfileUrl", "LinkedIn"],
  ["manualEmail", "Email"],
  ["manualMobile", "Mobile"],
  ["manualDirectDial", "Direct dial"],
  ["emailAvailable", "Email available"],
  ["mobileAvailable", "Mobile available"],
  ["directDialAvailable", "Direct available"],
  ["matchScore", "Match score"],
  ["cognismContactId", "Contact ID"],
  ["cognismRedeemId", "Redeem ID"],
  ["dataSource", "Data source"],
];

const appDebugFields = [
  ["dbContactId", "PaceOps DB contact ID"],
  ["dataSource", "Data source"],
  ["sourceNote", "Source note"],
  ["notes", "Notes"],
  ["hubspotContactId", "HubSpot contact ID"],
  ["hubspotExportedAt", "HubSpot exported at"],
  ["hubspotExportStatus", "HubSpot export status"],
  ["hubspotExportError", "HubSpot export error"],
];

function leadDebugKeys(lead = {}) {
  return [
    lead.rowId,
    lead.cognismRedeemId,
    lead.cognismContactId,
    lead.redeemId,
    lead.id,
  ].map(normalizeLookupValue).filter(Boolean);
}

function addLeadDebugRecord(current, lead, record) {
  const keys = leadDebugKeys(lead);
  if (!keys.length) return current;
  return keys.reduce((next, key) => ({ ...next, [key]: record }), current);
}

function findLeadDebugRecord(recordsByKey = {}, lead = {}) {
  for (const key of leadDebugKeys(lead)) {
    if (recordsByKey[key]) return recordsByKey[key];
  }
  return null;
}

function pruneDebugRecordsByKey(recordsByKey = {}, now = Date.now()) {
  const entriesByRecord = new Map();
  Object.entries(recordsByKey).forEach(([key, record]) => {
    if (!record || typeof record !== "object") return;
    const updatedAt = Number(record.cachedAt || record.requestedAt || now);
    if (now - updatedAt > LEAD_FINDER_DEBUG_CACHE_TTL_MS) return;
    const identity = leadDebugKeys(record.mappedLead || record).join("|") || key;
    const entry = entriesByRecord.get(identity) || { record: { ...record, cachedAt: updatedAt }, keys: new Set(), updatedAt };
    entry.keys.add(key);
    entry.updatedAt = Math.max(entry.updatedAt, updatedAt);
    entriesByRecord.set(identity, entry);
  });

  const pruned = {};
  [...entriesByRecord.values()]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, LEAD_FINDER_DEBUG_CACHE_MAX_RECORDS)
    .forEach(entry => {
      entry.keys.forEach(key => {
        pruned[key] = entry.record;
      });
    });
  return pruned;
}

function loadLeadFinderDebugCache() {
  return { preview: {}, redeem: {} };
}

function saveLeadFinderDebugCache() {
  return undefined;
}

function formatDebugValue(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  if (value === null || value === undefined || value === "") return "Not available";
  if (Array.isArray(value)) return value.length ? value.map(item => typeof item === "object" ? JSON.stringify(item) : String(item)).join(", ") : "Not available";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

function normalizeDebugValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

function buildLeadDebugDiff(previewLead = {}, redeemedLead = {}) {
  return leadDebugFields
    .map(([key, label]) => ({
      key,
      label,
      previewValue: previewLead?.[key],
      redeemedValue: redeemedLead?.[key],
    }))
    .filter(item => normalizeDebugValue(item.previewValue) !== normalizeDebugValue(item.redeemedValue));
}

function stripLeadDebugPayload(lead = {}) {
  const { _debugRawPreviewRecord, _debugRequestedCompany, ...cleanLead } = lead;
  return cleanLead;
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
  const contactName = normalizeLookupValue(lead.contactName);
  const companyName = normalizeLookupValue(lead.company);
  const manualEmail = normalizeEmail(lead.manualEmail) || null;
  const manualMobile = normalizeLookupValue(lead.manualMobile) || null;
  const manualDirectDial = normalizeLookupValue(lead.manualDirectDial) || null;
  const linkedinProfileUrl = normalizeLinkedinUrl(lead.linkedinProfileUrl) || null;
  const hasManualData = leadHasManualData(lead) || lead.dataSource === "manual";
  const isCognismPreviewLead = Boolean(normalizeLookupValue(lead.cognismContactId));
  const sourceNote = hasManualData
    ? (isCognismPreviewLead ? "Cognism preview row edited by PaceOps user" : "Added manually by PaceOps user")
    : "Cognism preview search result";
  const dataSource = isCognismPreviewLead ? "cognism_preview" : hasManualData ? "manual" : "cognism_preview";

  const payload = {
    organization_id: organizationId,
    company_id: lead.companyId,
    contact_name: contactName,
    first_name: firstName,
    last_name: lastName,
    full_name: contactName,
    company: companyName,
    job_title: normalizeLookupValue(lead.jobTitle),
    location: normalizeLookupValue(lead.location),
    linkedin_url: linkedinProfileUrl,
    linkedin_profile_url: linkedinProfileUrl,
    email: manualEmail,
    manual_email: manualEmail,
    mobile: manualMobile,
    manual_mobile: manualMobile,
    phone: manualDirectDial || manualMobile,
    direct_dial: manualDirectDial,
    manual_direct_dial: manualDirectDial,
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
  const contactName = existingContact?.contactName || normalizeLookupValue(lead.contactName);
  const companyName = existingContact?.company || normalizeLookupValue(lead.company);
  const manualEmail = normalizeEmail(lead.manualEmail) || existingContact?.manualEmail || null;
  const manualMobile = normalizeLookupValue(lead.manualMobile) || existingContact?.manualMobile || null;
  const manualDirectDial = normalizeLookupValue(lead.manualDirectDial) || existingContact?.manualDirectDial || null;
  const linkedinProfileUrl = existingContact?.linkedinProfileUrl || normalizeLinkedinUrl(lead.linkedinProfileUrl) || null;
  const payload = {
    organization_id: organizationId,
    company_id: lead.companyId || existingContact?.companyId,
    contact_name: contactName,
    first_name: existingContact?.firstName || firstName,
    last_name: existingContact?.lastName || lastName,
    full_name: contactName,
    company: companyName,
    job_title: existingContact?.jobTitle || normalizeLookupValue(lead.jobTitle),
    location: existingContact?.location || normalizeLookupValue(lead.location),
    linkedin_url: linkedinProfileUrl,
    linkedin_profile_url: linkedinProfileUrl,
    email: manualEmail,
    manual_email: manualEmail,
    mobile: manualMobile,
    manual_mobile: manualMobile,
    phone: manualDirectDial || manualMobile,
    direct_dial: manualDirectDial,
    manual_direct_dial: manualDirectDial,
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
  const sourceCompanies = Array.isArray(data.companies) ? data.companies : data.accounts;
  const clientsWithCounts = data.clients.map(client => {
    const clientCompanies = data.accounts.filter(account => account.clientId === client.id);
    const clientContacts = data.contacts.filter(contact => contact.clientId === client.id);
    const clientMeetings = (data.meetings || []).filter(meeting => meeting.clientId === client.id);
    return {
      ...client,
      accounts: clientCompanies.length,
      companies: clientCompanies.length,
      contacts: clientContacts.length,
      meetings: clientMeetings.length,
      health: clientCompanies.length || clientContacts.length ? "Active" : "Needs setup",
    };
  });

  const campaignsWithCounts = data.campaigns.map(campaign => {
    const hasCampaignCompanyIds = Array.isArray(campaign.companyIds);
    const hasCampaignContactIds = Array.isArray(campaign.contactIds);
    const campaignCompanyIds = hasCampaignCompanyIds ? campaign.companyIds : [];
    const campaignContactIds = hasCampaignContactIds ? campaign.contactIds : [];
    const campaignCompanyCount = hasCampaignCompanyIds
      ? campaignCompanyIds.length
      : data.accounts.filter(account => account.clientId === campaign.clientId).length;
    const campaignContactCount = hasCampaignContactIds
      ? campaignContactIds.length
      : data.contacts.filter(contact => contact.clientId === campaign.clientId).length;
    const campaignMeetingCount = (data.meetings || []).filter(meeting => meeting.campaignId === campaign.id).length;
    return {
      ...campaign,
      accounts: campaignCompanyCount,
      companies: campaignCompanyCount,
      contacts: campaignContactCount,
      meetings: campaignMeetingCount || Number(campaign.meetings || 0),
    };
  });

  return {
    ...data,
    workspaceUsers,
    clientAccounts: clientsWithCounts,
    clients: clientsWithCounts,
    companies: sourceCompanies,
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

function meetingStatusTone(status = "") {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("booked") || normalized.includes("held")) return "success";
  if (normalized.includes("cancel") || normalized.includes("no show")) return "warning";
  return "accent";
}

function normalizeCampaignStatus(status = "active") {
  const normalized = String(status || "active").trim().toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "paused" || normalized === "draft") return "paused";
  return "active";
}

function campaignStatusLabel(status = "active") {
  return titleCase(normalizeCampaignStatus(status));
}

function campaignStatusTone(status = "active") {
  const normalized = normalizeCampaignStatus(status);
  if (normalized === "active") return "success";
  if (normalized === "paused") return "warning";
  return "neutral";
}

function PhoneLink({ number, label = "Call" }) {
  const dialPhoneNumber = normalizePhone(number);
  if (!dialPhoneNumber) return <span className="muted-inline">No number</span>;
  return (
    <a className="call-link" href={`tel:${dialPhoneNumber}`}>
      <AircallLogoIcon size={14} />
      <span>{label}</span>
    </a>
  );
}

function getRedeemedPhoneNumber(contact) {
  return contact?.redeemed === true && contact?.phoneNumber ? String(contact.phoneNumber) : "";
}

function getContactPhoneNumber(contact) {
  return getDisplayPhoneNumber(getRedeemedPhoneNumber(contact))
    || getDisplayPhoneNumber(contact?.phoneNumber)
    || getDisplayPhoneNumber(contact?.mobile)
    || getDisplayPhoneNumber(contact?.directDial)
    || getDisplayPhoneNumber(contact?.phone)
    || "";
}

function getContactMobileNumber(contact) {
  return getDisplayPhoneNumber(contact?.mobile);
}

function getContactDirectDialNumber(contact) {
  return getDisplayPhoneNumber(contact?.directDial) || getDisplayPhoneNumber(contact?.phone);
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
    const isHtml = /^\s*</.test(text);
    const error = new Error(isHtml
      ? `API route returned ${response.status || "an"} HTML response. The deployment is not routing /api requests to the app server.`
      : `Server returned ${response.status || "an"} invalid response`);
    error.statusCode = response.status;
    throw error;
  }
}

async function assertApiServerAvailable() {
  const response = await fetch("/api/health", { headers: await buildApiHeaders() });
  const payload = await readJsonResponse(response);
  if (!response.ok || payload.ok !== true) {
    throw new Error(payload.error || "API server is not available.");
  }
  return payload;
}

function AircallDialButton({ contact, phoneNumber: phoneNumberOverride = "", label = "Call", compact = false }) {
  const phoneNumber = phoneNumberOverride || getContactPhoneNumber(contact);
  const dialPhoneNumber = normalizePhone(phoneNumber);
  const canDial = Boolean(dialPhoneNumber);
  const buttonTitle = phoneNumber ? `Open ${phoneNumber} in Aircall` : "Phone number needed";

  if (!canDial) {
    return (
      <div className={`aircall-dial ${compact ? "compact" : ""}`}>
        {!compact ? <span>Phone number needed</span> : null}
        <button className="secondary-button" type="button" disabled title={buttonTitle} aria-label={buttonTitle}>
          <AircallLogoIcon size={16} />
          {!compact ? label : null}
        </button>
      </div>
    );
  }

  return (
    <div className={`aircall-dial ${compact ? "compact" : ""}`}>
      {!compact ? <span>{phoneNumber || "Phone number needed"}</span> : null}
      <a className="secondary-button" href={`tel:${dialPhoneNumber}`} title={buttonTitle} aria-label={buttonTitle}>
        <AircallLogoIcon size={16} />
        {!compact ? label : null}
      </a>
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
      <div className="sidebar-brand">
        <button className="sidebar-logo" type="button" onClick={() => onNavigate("dashboard")} aria-label="Go to dashboard">
          <img src={logoUrl} alt="PaceOps" />
        </button>
      </div>
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
              {item.logo ? <img className="sidebar-button-logo" src={item.logo} alt="" aria-hidden="true" /> : <Icon size={20} />}
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
  effectiveUser,
  effectiveAccess,
}) {
  const { clients, campaigns } = useCrmData();
  const activeClientCampaigns = activeClient?.id && activeClient.id !== "none"
    ? campaigns.filter(campaign => campaign.clientId === activeClient.id)
    : [];
  const campaignSelectValue = activeClientCampaigns.some(campaign => campaign.id === activeCampaign.id)
    ? activeCampaign.id
    : "none";

  return (
    <header className="topbar">
      <div className="topbar-leading">
        <div className="topbar-brand" aria-label="ProspectIQ">
          <img src={logoUrl} alt="" aria-hidden="true" />
          <span>ProspectIQ</span>
        </div>
        {canGoBack && (
          <button className="back-button" type="button" onClick={onBack} aria-label="Go back">
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="switchers">
          <label>
            <span>Client account</span>
            <select value={activeClient.id} onChange={event => onClientChange(event.target.value)}>
              <option value="none">No client account selected</option>
              {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
            <ChevronDown size={14} />
          </label>
          <label>
            <span>Campaign</span>
            <select value={campaignSelectValue} onChange={event => onCampaignChange(event.target.value)}>
              <option value="none">No campaign selected</option>
              {activeClientCampaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
              {activeClient.id !== "none" && !activeClientCampaigns.length ? <option value="none" disabled>No campaigns yet</option> : null}
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
        {effectiveUser ? (
          <div className="topbar-user-chip" title={effectiveAccess?.isTestAccount ? "Test member context" : "Workspace user"}>
            <span className="record-avatar">{effectiveUser.initials || accountInitial(effectiveUser.name || effectiveUser.email)}</span>
            <strong>{effectiveUser.name || effectiveUser.email}</strong>
            <small>{formatRole(effectiveAccess?.role || effectiveUser.roleKey || effectiveUser.role)}</small>
          </div>
        ) : null}
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

function DashboardPage({ activeClient, activeCampaign, onNavigate }) {
  const { deals, campaigns, accounts, teamMembers } = useCrmData();
  const { formatCurrency } = useCurrency();
  if (activeClient?.id === "none" || activeCampaign?.id === "none") {
    return <ScopeSelectionPrompt />;
  }
  const clientAccounts = activeClient?.id && activeClient.id !== "none"
    ? accounts.filter(account => account.clientId === activeClient.id)
    : [];
  const campaignCompanyIds = new Set(Array.isArray(activeCampaign?.companyIds) ? activeCampaign.companyIds : []);
  const scopedAccounts = campaignCompanyIds.size
    ? clientAccounts.filter(account => campaignCompanyIds.has(account.id))
    : clientAccounts;
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
        <MetricCard label="Companies" value={scopedAccounts.length} detail={campaignCompanyIds.size ? "In selected campaign" : "Ready for review"} icon={BriefcaseBusiness} />
        <MetricCard label="Open pipeline" value={formatCurrency(pipelineValue)} detail={campaignCompanyIds.size ? "Across the active campaign" : "Across the active client account"} icon={KanbanSquare} />
        <MetricCard label="Meetings booked" value={bookedMeetings} detail={bookedMeetings ? "From active campaigns" : "No meetings logged yet"} icon={CalendarDays} />
      </div>

      <div className="content-grid two">
        <section className="panel aircall-activity-panel">
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

function ClientsPage({ onOpenClient, onNewClient, onEditClient, onRemoveClient, canManageCrmRecords = false }) {
  const { clients } = useCrmData();
  const [pendingRemoval, setPendingRemoval] = useState(null);

  return (
    <>
      <PageHeader
        eyebrow="Client accounts"
        title="Client accounts"
        description="Manage each client account before moving into its campaigns, companies, contacts, pipeline, and research."
      >
        {canManageCrmRecords ? (
          <button className="primary-button" type="button" onClick={onNewClient}>
            <Plus size={16} />
            New client account
          </button>
        ) : null}
      </PageHeader>
      <section className="panel">
        {clients.length ? <DataTable
          columns={["Client account", "Workspace", "Industry", "Website", "Owner", "Companies", "Contacts", ""]}
          rows={clients.map(client => [
            <RecordName key="client" name={client.name} meta={client.status} imageUrl={client.imageUrl} />,
            client.workspace,
            client.industry || "Not set",
            client.website ? <a key="website" href={client.website} target="_blank" rel="noreferrer">{client.website}</a> : "Not set",
            client.owner,
            client.accounts,
            client.contacts,
            <div key="actions" className="row-actions">
              {canManageCrmRecords ? (
                <button className="icon-action" type="button" onClick={event => {
                  event.stopPropagation();
                  onEditClient(client);
                }} title={`Edit ${client.name}`} aria-label={`Edit ${client.name}`}>
                  <Pencil size={16} />
                </button>
              ) : null}
              <button className="icon-action" type="button" onClick={event => {
                event.stopPropagation();
                onOpenClient(client.id);
              }} title={`Open ${client.name}`} aria-label={`Open ${client.name}`}>
                <Eye size={16} />
              </button>
              {canManageCrmRecords ? (
                <button className="icon-action danger-button" type="button" onClick={event => {
                  event.stopPropagation();
                  setPendingRemoval(client);
                }} title={`Remove ${client.name}`} aria-label={`Remove ${client.name}`}>
                  <Trash2 size={16} />
                </button>
              ) : null}
            </div>,
          ])}
          rowActions={clients.map(client => () => onOpenClient(client.id))}
        /> : <EmptyState icon={Building2} title="No client accounts yet" text="Create your first client account to manage campaigns, companies, contacts, research, and pipeline." />}
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
        <p className="modal-helper-text">This removes the client account and its campaigns, companies, contacts, deals, research, scripts, and reports from the CRM.</p>
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

function ClientMembershipModal({ client, campaigns, workspaceUsers, currentUserId = "", onClose, onSave }) {
  const [query, setQuery] = useState("");
  const [clientMemberIds, setClientMemberIds] = useState(() => {
    const ids = Array.isArray(client.memberIds) ? client.memberIds : [];
    return ids.length || !currentUserId ? ids : [currentUserId];
  });
  const [campaignMemberIds, setCampaignMemberIds] = useState(() => Object.fromEntries(
    campaigns.map(campaign => {
      const ids = Array.isArray(campaign.memberIds) ? campaign.memberIds : [];
      return [campaign.id, ids.length || !currentUserId ? ids : [currentUserId]];
    }),
  ));
  const searchTerms = normalizeLookupValue(query).toLowerCase().split(/\s+/).filter(Boolean);
  const filteredUsers = (workspaceUsers || []).filter(user => {
    if (!searchTerms.length) return true;
    const text = [user.name, user.email, user.role, user.aircallUserId].map(value => normalizeLookupValue(value).toLowerCase()).join(" ");
    return searchTerms.every(term => text.includes(term));
  });

  function toggleClientMember(userId) {
    setClientMemberIds(current => current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId]);
  }

  function toggleCampaignMember(campaignId, userId) {
    setCampaignMemberIds(current => {
      const selected = current[campaignId] || [];
      return {
        ...current,
        [campaignId]: selected.includes(userId)
          ? selected.filter(id => id !== userId)
          : [...selected, userId],
      };
    });
  }

  const totalCampaignAssignments = Object.values(campaignMemberIds).reduce((total, ids) => total + (Array.isArray(ids) ? ids.length : 0), 0);

  return (
    <section className="modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="workflow-modal membership-modal" role="dialog" aria-modal="true" aria-labelledby="client-members-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Access</span>
            <h2 id="client-members-title">{client.name}</h2>
          </div>
          <button className="icon-action" type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="membership-summary-strip">
          <div>
            <span>People with client access</span>
            <strong>{clientMemberIds.length}</strong>
          </div>
          <div>
            <span>Campaign seats assigned</span>
            <strong>{totalCampaignAssignments}</strong>
          </div>
          <div>
            <span>Campaigns</span>
            <strong>{campaigns.length}</strong>
          </div>
        </div>
        <div className="membership-toolbar">
          <label className="membership-search">
            <Search size={16} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, email, role, Aircall ID" />
          </label>
          <StatusBadge>{filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}</StatusBadge>
        </div>
        <div className="membership-matrix">
          <div className="membership-matrix-body">
            {filteredUsers.map(user => {
              return (
                <article key={user.id} className="membership-member-row">
                  <div className="membership-person">
                    <span className="record-avatar">{user.initials || accountInitial(user.name)}</span>
                    <div>
                      <strong>{user.name}</strong>
                      <small>{user.email || formatRole(user.roleKey || user.role)}</small>
                    </div>
                    <StatusBadge>{user.aircallUserId ? `Aircall ${user.aircallUserId}` : formatRole(user.roleKey || user.role)}</StatusBadge>
                  </div>
                  <div className="membership-access-controls">
                    <div className="membership-control-row">
                      <div>
                        <strong>Can access this client account</strong>
                        <small>{client.name}</small>
                      </div>
                      <button
                        className={`membership-toggle ${clientMemberIds.includes(user.id) ? "selected" : ""}`}
                        type="button"
                        aria-pressed={clientMemberIds.includes(user.id)}
                        onClick={() => toggleClientMember(user.id)}
                      >
                        {clientMemberIds.includes(user.id) ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        {clientMemberIds.includes(user.id) ? "Yes" : "No"}
                      </button>
                    </div>
                    <div className="membership-campaign-section">
                      <span>Can work on these campaigns</span>
                      <div className="membership-campaign-chips" aria-label={`Campaign access for ${user.name}`}>
                        {campaigns.map(campaign => {
                          const selected = (campaignMemberIds[campaign.id] || []).includes(user.id);
                          return (
                            <button
                              key={campaign.id}
                              className={`membership-chip ${selected ? "selected" : ""}`}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => toggleCampaignMember(campaign.id, user.id)}
                            >
                              {selected ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                              <span>{campaign.name}</span>
                            </button>
                          );
                        })}
                        {!campaigns.length ? <span className="membership-muted">No campaigns yet</span> : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
            {!filteredUsers.length ? (
              <EmptyState icon={Users} title="No users found" text="Try a different search." />
            ) : null}
            </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-button" type="button" onClick={() => onSave({ clientMemberIds, campaignMemberIds })}>
            Save members
          </button>
        </div>
      </div>
    </section>
  );
}

function CampaignMembershipModal({ campaign, workspaceUsers, currentUserId = "", onClose, onSave }) {
  const [query, setQuery] = useState("");
  const [campaignMemberIds, setCampaignMemberIds] = useState(() => {
    const ids = Array.isArray(campaign.memberIds) ? campaign.memberIds : [];
    return ids.length || !currentUserId ? ids : [currentUserId];
  });
  const searchTerms = normalizeLookupValue(query).toLowerCase().split(/\s+/).filter(Boolean);
  const filteredUsers = (workspaceUsers || []).filter(user => {
    if (!searchTerms.length) return true;
    const text = [user.name, user.email, user.role, user.aircallUserId].map(value => normalizeLookupValue(value).toLowerCase()).join(" ");
    return searchTerms.every(term => text.includes(term));
  });

  function toggleCampaignMember(userId) {
    setCampaignMemberIds(current => current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId]);
  }

  return (
    <section className="modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="workflow-modal membership-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-members-title">
        <div className="modal-header">
          <div>
            <span className="eyebrow">Campaign access</span>
            <h2 id="campaign-members-title">{campaign.name}</h2>
          </div>
          <button className="icon-action" type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="membership-summary-strip">
          <div>
            <span>Campaign members</span>
            <strong>{campaignMemberIds.length}</strong>
          </div>
          <div>
            <span>Workspace users</span>
            <strong>{workspaceUsers.length}</strong>
          </div>
          <div>
            <span>Scope</span>
            <strong>Campaign</strong>
          </div>
        </div>
        <div className="membership-toolbar">
          <label className="membership-search">
            <Search size={16} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, email, role, Aircall ID" />
          </label>
          <StatusBadge>{filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}</StatusBadge>
        </div>
        <div className="membership-matrix">
          <div className="membership-matrix-body">
            {filteredUsers.map(user => {
              const selected = campaignMemberIds.includes(user.id);
              return (
                <article key={user.id} className="membership-member-row">
                  <div className="membership-person">
                    <span className="record-avatar">{user.initials || accountInitial(user.name)}</span>
                    <div>
                      <strong>{user.name}</strong>
                      <small>{user.email || formatRole(user.roleKey || user.role)}</small>
                    </div>
                    <StatusBadge>{user.aircallUserId ? `Aircall ${user.aircallUserId}` : formatRole(user.roleKey || user.role)}</StatusBadge>
                  </div>
                  <div className="membership-access-controls">
                    <div className="membership-control-row">
                      <div>
                        <strong>Can work on this campaign</strong>
                        <small>{campaign.name}</small>
                      </div>
                      <button
                        className={`membership-toggle ${selected ? "selected" : ""}`}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => toggleCampaignMember(user.id)}
                      >
                        {selected ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                        {selected ? "Yes" : "No"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            {!filteredUsers.length ? (
              <EmptyState icon={Users} title="No users found" text="Try a different search." />
            ) : null}
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
          <button className="primary-button" type="button" onClick={() => onSave({ memberIds: campaignMemberIds })}>
            Save members
          </button>
        </div>
      </div>
    </section>
  );
}

function callsForDate(calls = [], dateKey = toLocalDateKey(new Date())) {
  return calls.filter(call => {
    const startedAt = call.startedAt ? new Date(call.startedAt) : null;
    return startedAt && !Number.isNaN(startedAt.getTime()) && toLocalDateKey(startedAt) === dateKey;
  });
}

function callBelongsToUser(call = {}, user = {}) {
  return Boolean(
    (call.userId && user.id && call.userId === user.id)
    || (call.aircallUserId && user.aircallUserId && String(call.aircallUserId) === String(user.aircallUserId)),
  );
}

function normalizePersonName(value = "") {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findWorkspaceUserForCall(call = {}, workspaceUsers = []) {
  return (workspaceUsers || []).find(user => callBelongsToUser(call, user))
    || (workspaceUsers || []).find(user => (
      normalizePersonName(user.name) && normalizePersonName(user.name) === normalizePersonName(call.userName)
    ))
    || (workspaceUsers || []).find(user => (
      normalizeEmail(user.email) && normalizeEmail(user.email) === normalizeEmail(call.userEmail)
    ));
}

function buildUserCallSummaries(calls = [], workspaceUsers = []) {
  return (workspaceUsers || [])
    .map(user => {
      const userCalls = calls.filter(call => findWorkspaceUserForCall(call, workspaceUsers)?.id === user.id);
      return {
        id: user.id,
        name: user.name || user.email || "Workspace user",
        email: user.email || "",
        initials: user.initials || accountInitial(user.name || user.email),
        aircallUserId: user.aircallUserId || "",
        calls: userCalls.length,
        connected: userCalls.filter(call => call.answeredAt).length,
      };
    })
    .filter(row => row.calls > 0)
    .sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name));
}

function UserCallSummaryList({ rows = [], onOpenUser }) {
  if (!rows.length) {
    return <EmptyState icon={Phone} title="No calls today" text="Calls linked to this scope will appear by user here." />;
  }
  return (
    <div className="user-call-list compact">
      {rows.map(row => (
        <button className="user-call-row" key={row.id} type="button" onClick={() => onOpenUser?.(row.id)}>
          <span className="record-avatar">{row.initials}</span>
          <div>
            <strong>{row.name}</strong>
            <small>{row.aircallUserId ? `Aircall ID ${row.aircallUserId}` : row.email}</small>
          </div>
          <div className="call-count-stack">
            <strong>{row.calls}</strong>
            <small>{row.connected} connected</small>
          </div>
        </button>
      ))}
    </div>
  );
}

function MeetingList({ meetings = [], campaigns = [], workspaceUsers = [], calls = [], onDeleteMeeting }) {
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState("");
  const [pendingDeleteMeeting, setPendingDeleteMeeting] = useState(null);
  if (!meetings.length) {
    return <EmptyState icon={CalendarDays} title="No meetings booked" text="Booked meetings from Aircall will appear here with campaign, owner, notes, and transcript context." />;
  }
  const campaignById = new Map(campaigns.map(campaign => [campaign.id, campaign]));
  const userById = new Map(workspaceUsers.map(user => [user.id, user]));
  const callById = new Map(calls.map(call => [call.id, call]));

  async function deleteMeeting(meeting) {
    setDeletingMeetingId(meeting.id);
    try {
      await onDeleteMeeting?.(meeting);
      setPendingDeleteMeeting(null);
    } finally {
      setDeletingMeetingId("");
    }
  }
  function renderMeetingTranscriptModal() {
    if (!activeMeeting) return null;
    const owner = userById.get(activeMeeting.ownerUserId);
    const call = callById.get(activeMeeting.aircallCallId) || {};
    const agentName = owner?.name || activeMeeting.agentName || call.userName || "Aircall user";
    const otherParty = activeMeeting.phoneNumber || call.externalPhoneNumber || "Other party";
    const transcriptTurns = getTranscriptTurns({
      ...call,
      transcriptText: activeMeeting.transcript,
    }, agentName, otherParty);
    return (
      <section className="modal-backdrop" role="presentation" onMouseDown={event => {
        if (event.target === event.currentTarget) setActiveMeeting(null);
      }}>
        <div className="workflow-modal transcript-modal" role="dialog" aria-modal="true" aria-labelledby="meeting-transcript-title">
          <div className="modal-header">
            <div>
              <span className="eyebrow">Meeting transcript</span>
              <h2 id="meeting-transcript-title">{activeMeeting.title}</h2>
              <p>{formatDateTime(activeMeeting.meetingAt || activeMeeting.createdAt)} · {activeMeeting.phoneNumber || "No number recorded"}</p>
            </div>
            <button className="icon-action" type="button" onClick={() => setActiveMeeting(null)} aria-label="Close meeting transcript">
              <X size={16} />
            </button>
          </div>
          <div className="transcript-party-grid" aria-label="Meeting call context">
            <div>
              <span>Agent</span>
              <strong>{agentName}</strong>
            </div>
            <div>
              <span>Number</span>
              <strong>{activeMeeting.phoneNumber || call.externalPhoneNumber || "Not recorded"}</strong>
            </div>
          </div>
          {activeMeeting.notes ? (
            <section className="transcript-modal-summary">
              <span>Meeting notes</span>
              <p>{activeMeeting.notes}</p>
            </section>
          ) : null}
          <div className="transcript-modal-body">
            {transcriptTurns.length
              ? transcriptTurns.map((turn, index) => (
                <article className={`transcript-turn ${turn.role}`} key={`${turn.id}:${index}`}>
                  <header>
                    <strong>{turn.speaker}</strong>
                    {turn.time ? <span>{turn.time}</span> : null}
                  </header>
                  <p>{turn.text}</p>
                </article>
              ))
              : <p>{activeMeeting.transcript || "No transcript attached."}</p>}
          </div>
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={() => setActiveMeeting(null)}>Close</button>
            {activeMeeting.transcript ? (
              <button className="secondary-button" type="button" onClick={() => navigator.clipboard?.writeText(activeMeeting.transcript)}>
                <Copy size={16} />
                Copy transcript
              </button>
            ) : null}
            {call?.directLink ? <a className="secondary-button" href={call.directLink} target="_blank" rel="noreferrer"><ExternalLink size={16} />Open in Aircall</a> : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="meeting-list">
        {meetings.map(meeting => {
          const campaign = campaignById.get(meeting.campaignId);
          const owner = userById.get(meeting.ownerUserId);
          const call = callById.get(meeting.aircallCallId);
          const meetingOwnerName = owner?.name || meeting.agentName || call?.userName || "Aircall user";
          return (
            <article className="meeting-row" key={meeting.id}>
              <div>
                <strong>{meeting.title}</strong>
                <span>{campaign?.name || "No campaign"} · {meetingOwnerName}</span>
                <small>{formatDateTime(meeting.meetingAt || meeting.createdAt)} · {meeting.phoneNumber || call?.externalPhoneNumber || "No number recorded"}</small>
                {meeting.notes ? <p>{meeting.notes}</p> : null}
              </div>
              <div className="meeting-row-meta">
                <StatusBadge tone={meetingStatusTone(meeting.status)}>{meeting.status}</StatusBadge>
                {meeting.transcript ? <button className="secondary-button small-button" type="button" onClick={() => setActiveMeeting(meeting)}><FileText size={15} />Transcript</button> : null}
                {call?.directLink ? <a className="icon-button" href={call.directLink} target="_blank" rel="noreferrer" title="Open source call"><ExternalLink size={16} /></a> : null}
                {onDeleteMeeting ? (
                  <button className="icon-button danger-icon" type="button" onClick={() => setPendingDeleteMeeting(meeting)} disabled={deletingMeetingId === meeting.id} title="Delete meeting" aria-label="Delete meeting">
                    {deletingMeetingId === meeting.id ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <Trash2 size={16} />}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {renderMeetingTranscriptModal()}
      {pendingDeleteMeeting ? (
        <section className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setPendingDeleteMeeting(null);
        }}>
          <div className="workflow-modal delete-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-meeting-title">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Delete meeting</span>
                <h2 id="delete-meeting-title">{pendingDeleteMeeting.title}</h2>
              </div>
              <button className="icon-action" type="button" onClick={() => setPendingDeleteMeeting(null)} aria-label="Close delete meeting confirmation">
                <X size={16} />
              </button>
            </div>
            <p className="modal-helper-text">This removes the meeting from the client account and campaign. It does not delete the Aircall call.</p>
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setPendingDeleteMeeting(null)} disabled={deletingMeetingId === pendingDeleteMeeting.id}>Cancel</button>
              <button className="secondary-button danger-button" type="button" onClick={() => deleteMeeting(pendingDeleteMeeting)} disabled={deletingMeetingId === pendingDeleteMeeting.id}>
                {deletingMeetingId === pendingDeleteMeeting.id ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <Trash2 size={16} />}
                {deletingMeetingId === pendingDeleteMeeting.id ? "Deleting" : "Delete meeting"}
              </button>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function MeetingBookingModal({ call, campaigns = [], contacts = [], workspaceUsers = [], aircallUsers = [], onClose, onSave }) {
  const { clients = [] } = useCrmData();
  const contact = contacts.find(item => item.id === call?.contactId);
  const callCampaigns = campaigns.filter(campaign => (
    !call?.clientId
    || campaign.clientId === call.clientId
    || campaign.id === call.campaignId
    || campaign.clientId === contact?.clientId
  ));
  const defaultCampaign = callCampaigns.find(campaign => campaign.id === call?.campaignId) || callCampaigns[0] || campaigns[0];
  const callOwner = findWorkspaceUserForCall(call, workspaceUsers);
  const matchedAircallUser = (aircallUsers || []).find(user => user.aircallUserId && call?.aircallUserId && String(user.aircallUserId) === String(call.aircallUserId));
  const agentName = callOwner?.name || call?.userName || matchedAircallUser?.name || matchedAircallUser?.email || "Aircall user";
  const transcriptText = call?.transcriptText || "";
  const sourcePhoneNumber = call?.externalPhoneNumber || "";
  const transcriptTurns = getTranscriptTurns(call || {}, agentName, sourcePhoneNumber || "Other party");
  const [values, setValues] = useState(() => ({
    title: `Meeting with ${contact?.name || sourcePhoneNumber || "prospect"}`,
    campaignId: defaultCampaign?.id || "",
    meetingAt: toDateTimeLocalInputValue(new Date()),
    notes: call?.summary || "",
    attachTranscript: Boolean(transcriptText),
    transcript: transcriptText,
    phoneNumber: sourcePhoneNumber,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedCampaign = campaigns.find(campaign => campaign.id === values.campaignId) || defaultCampaign;
  const selectedClient = clients.find(client => client.id === selectedCampaign?.clientId || client.id === call?.clientId || client.id === contact?.clientId);
  const clientById = new Map(clients.map(client => [client.id, client]));

  function update(key, value) {
    setValues(current => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave?.({
        ...values,
        clientId: selectedCampaign?.clientId || call?.clientId || contact?.clientId || "",
        companyId: call?.companyId || contact?.companyId || contact?.accountId || "",
        contactId: call?.contactId || "",
        userId: callOwner?.id || matchedAircallUser?.linkedUserId || "",
        ownerUserId: callOwner?.id || matchedAircallUser?.linkedUserId || "",
        aircallUserRecordId: matchedAircallUser?.id || "",
        aircallUserId: call?.aircallUserId || matchedAircallUser?.aircallUserId || "",
        agentName,
        aircallCallId: call?.id || "",
        transcript: values.attachTranscript ? values.transcript : "",
        phoneNumber: values.phoneNumber || sourcePhoneNumber,
      });
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Could not book meeting.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <form className="workflow-modal meeting-booking-modal" onSubmit={submit}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Aircall</span>
            <h2>Book meeting</h2>
          </div>
          <button className="icon-action" type="button" onClick={onClose} aria-label="Close meeting booking">
            <X size={16} />
          </button>
        </div>
        <div className="modal-fields">
          <FormField label="Title">
            <input value={values.title} onChange={event => update("title", event.target.value)} required />
          </FormField>
          <FormField label="Campaign">
            <select value={values.campaignId} onChange={event => update("campaignId", event.target.value)} required>
              {(callCampaigns.length ? callCampaigns : campaigns).map(campaign => (
                <option key={campaign.id} value={campaign.id}>{clientById.get(campaign.clientId)?.name || "Client account"} - {campaign.name}</option>
              ))}
            </select>
            <span className="form-help-text">Client account: {selectedClient?.name || "Not selected"}</span>
          </FormField>
          <FormField label="Meeting time">
            <input type="datetime-local" value={values.meetingAt} onChange={event => update("meetingAt", event.target.value)} />
          </FormField>
          <FormField label="Source number">
            <input value={values.phoneNumber} onChange={event => update("phoneNumber", event.target.value)} placeholder="+44..." />
          </FormField>
          <FormField label="Notes">
            <textarea value={values.notes} onChange={event => update("notes", event.target.value)} placeholder="Context, agenda, next steps" />
          </FormField>
          <label className="checkbox-field meeting-transcript-toggle">
            <input type="checkbox" checked={values.attachTranscript} onChange={event => update("attachTranscript", event.target.checked)} disabled={!transcriptText} />
            <span>Attach transcript from this call</span>
          </label>
          {values.attachTranscript ? (
            <FormField label="Transcript">
              <div className="meeting-transcript-editor">
                {transcriptTurns.length ? (
                  <div className="transcript-modal-body inline-transcript-preview">
                    {transcriptTurns.map((turn, index) => (
                      <article className={`transcript-turn ${turn.role}`} key={`${turn.id}:${index}`}>
                        <header>
                          <strong>{turn.speaker}</strong>
                          {turn.time ? <span>{turn.time}</span> : null}
                        </header>
                        <p>{turn.text}</p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="transcript-modal-body inline-transcript-preview">
                    <p>{values.transcript}</p>
                  </div>
                )}
              </div>
            </FormField>
          ) : null}
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="primary-button" type="submit" disabled={saving || !values.campaignId || !values.title.trim()}>
            {saving ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <CalendarDays size={16} />}
            {saving ? "Saving" : "Book meeting"}
          </button>
        </div>
      </form>
    </section>
  );
}

function ClientDetailPage({ client, aircallData, onOpenCampaign, onOpenAccount, onEditClient, onEditAccount, onNewCampaign, onManageClientAccount, onOpenAircallUser, onDeleteMeeting, currentUserId = "", canManageCrmRecords = false }) {
  const { campaigns, accounts, contacts, activities, workspaceUsers, meetings } = useCrmData();
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [companiesExpanded, setCompaniesExpanded] = useState(false);
  if (client?.id === "none") {
    return <ScopeSelectionPrompt requireCampaign={false} />;
  }
  const clientCampaigns = campaigns.filter(campaign => campaign.clientId === client.id);
  const clientAccounts = accounts.filter(account => account.clientId === client.id);
  const clientContacts = contacts.filter(contact => contact.clientId === client.id);
  const clientCalls = activities.filter(activity => activity.type === "Call" && clientAccounts.some(account => account.name === activity.account));
  const syncedClientCalls = (aircallData?.calls || []).filter(call => (
    call.clientId === client.id
    || clientAccounts.some(account => account.id === call.companyId)
    || clientContacts.some(contact => contact.id === call.contactId)
  ));
  const todaysClientCalls = callsForDate(syncedClientCalls);
  const userCallRows = buildUserCallSummaries(todaysClientCalls, workspaceUsers || []);
  const clientMeetings = (meetings || []).filter(meeting => meeting.clientId === client.id);

  return (
    <>
      <PageHeader
        eyebrow="Client account"
        title={client.name}
        description="The parent record for this client account, its campaigns, companies, contacts, pipeline, and research."
      >
        {canManageCrmRecords ? (
          <button className="primary-button" type="button" onClick={onNewCampaign}>
            <Plus size={16} />
            New campaign
          </button>
        ) : null}
        {canManageCrmRecords ? (
          <button className="secondary-button" type="button" onClick={() => setMembershipOpen(true)}>
            <Users size={16} />
            Manage client account
          </button>
        ) : null}
        {canManageCrmRecords ? (
          <button className="secondary-button" type="button" onClick={() => onEditClient(client)}>
            <Pencil size={16} />
            Edit client account
          </button>
        ) : null}
      </PageHeader>
      {client.imageUrl ? (
        <section className="panel client-identity-panel">
          <div>
            <span className="eyebrow">Client</span>
            <strong>{client.name}</strong>
            <small>{client.workspace || "Client account"}</small>
          </div>
        </section>
      ) : null}
      <div className="metrics-grid client-metrics-grid">
        <MetricCard label="Campaigns" value={clientCampaigns.length} detail={clientCampaigns.length ? "Campaigns in this client account" : "Create the first campaign"} icon={Megaphone} />
        <MetricCard label="Companies" value={clientAccounts.length} detail={clientAccounts.length ? "Companies assigned" : "Add companies"} icon={BriefcaseBusiness} />
        <MetricCard label="Meetings" value={clientMeetings.length} detail={clientMeetings.length ? "Booked across this client account" : "No meetings booked yet"} icon={CalendarDays} />
        <MetricCard label="Calls today" value={todaysClientCalls.length || clientCalls.length} detail={todaysClientCalls.length ? "Synced from Aircall today" : "No synced calls today"} icon={Phone} />
      </div>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Today</span>
              <h2>Calls by user</h2>
            </div>
          </div>
          <UserCallSummaryList rows={userCallRows} onOpenUser={onOpenAircallUser} />
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Meetings</span>
              <h2>Booked meetings</h2>
            </div>
            <strong>{clientMeetings.length}</strong>
          </div>
          <MeetingList meetings={clientMeetings} campaigns={clientCampaigns} workspaceUsers={workspaceUsers || []} calls={aircallData?.calls || []} onDeleteMeeting={onDeleteMeeting} />
        </section>
      </div>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header"><h2>Campaigns</h2></div>
          <CampaignList campaigns={clientCampaigns} compact onOpenCampaign={onOpenCampaign} />
        </section>
        <section className={`panel client-companies-panel${companiesExpanded ? " expanded" : ""}`}>
          <div className="panel-header">
            <h2>Companies</h2>
            {clientAccounts.length ? (
              <button
                className="secondary-button small-button"
                type="button"
                onClick={() => setCompaniesExpanded(current => !current)}
                aria-expanded={companiesExpanded}
              >
                <ChevronDown className={companiesExpanded ? "chevron-open" : ""} size={15} />
                {companiesExpanded ? "Show less" : "View more"}
              </button>
            ) : null}
          </div>
          <div className={`client-companies-frame${companiesExpanded ? " expanded" : ""}`}>
            {clientAccounts.length
              ? <AccountTable accounts={clientAccounts} onOpenAccount={onOpenAccount} onEditAccount={canManageCrmRecords ? onEditAccount : undefined} />
              : <EmptyState icon={BriefcaseBusiness} title="No companies yet" text="Add companies inside this client account before building contacts, research, and pipeline." />}
          </div>
        </section>
      </div>
      {membershipOpen ? (
        <ClientMembershipModal
          client={client}
          campaigns={clientCampaigns}
          workspaceUsers={workspaceUsers || []}
          currentUserId={currentUserId}
          onClose={() => setMembershipOpen(false)}
          onSave={values => {
            onManageClientAccount?.(client, values);
            setMembershipOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function CampaignsPage({ activeClient, onOpenCampaign, onEditCampaign, onNewCampaign, onImport, canManageCrmRecords = false }) {
  const { campaigns } = useCrmData();
  if (activeClient?.id === "none") {
    return <ScopeSelectionPrompt requireCampaign={false} />;
  }
  const scopedCampaigns = activeClient?.id && activeClient.id !== "none"
    ? campaigns.filter(campaign => campaign.clientId === activeClient.id)
    : [];

  return (
    <>
      <PageHeader
        eyebrow="Campaigns"
        title="Campaigns"
        description={`Manage outreach campaigns for ${activeClient?.name || "the active client account"}: target companies, assigned contacts, booked meetings, and campaign status.`}
      >
        {canManageCrmRecords ? (
          <>
            <button className="secondary-button" type="button" onClick={onImport}>
              <Upload size={16} />
              CSV import
            </button>
            <button className="primary-button" type="button" onClick={onNewCampaign}>
              <Plus size={16} />
              New campaign
            </button>
          </>
        ) : null}
      </PageHeader>
      <CampaignList campaigns={scopedCampaigns} onOpenCampaign={onOpenCampaign} onEditCampaign={canManageCrmRecords ? onEditCampaign : undefined} />
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
              {campaign.imageUrl
                ? <img className="campaign-card-image" src={campaign.imageUrl} alt="" />
                : <span className="record-avatar">{campaign.name.slice(0, 2).toUpperCase()}</span>}
              <div>
                <h2>{campaign.name}</h2>
                <p>{campaign.channel}</p>
              </div>
            </div>
            <div className="campaign-card-meta">
              <span className={`campaign-status-text ${campaignStatusTone(campaign.status)}`}>
                <span aria-hidden="true" />
                Status: {campaignStatusLabel(campaign.status)}
              </span>
              <span>{campaign.nextAction}</span>
            </div>
            <div className="mini-stats">
              <span><strong>{campaign.accounts}</strong><small>Target companies</small></span>
              <span><strong>{campaign.contacts}</strong><small>Assigned contacts</small></span>
              <span><strong>{campaign.meetings}</strong><small>Booked meetings</small></span>
            </div>
            <div className="campaign-card-actions">
              <button className={compact ? "icon-action" : "secondary-button"} type="button" onClick={event => {
                event.stopPropagation();
                onOpenCampaign?.(campaign.id);
              }} aria-label={`View ${campaign.name}`}>
                {compact ? <ArrowRight size={16} /> : <>View campaign <ArrowRight size={14} /></>}
              </button>
              {!compact && onEditCampaign && (
                <button className="secondary-button" type="button" onClick={event => {
                  event.stopPropagation();
                  onEditCampaign?.(campaign);
                }}>Edit</button>
              )}
            </div>
          </article>
        ))}
      </div> : <EmptyState icon={Megaphone} title="No campaigns yet" text="Create a campaign inside the client account when you are ready to run outreach, call blocks, or research workflows." />}
    </section>
  );
}

function CampaignDetailPage({ campaign, aircallData, onNavigate, onOpenClient, onOpenAccount, onOpenContact, onEditCampaign, onManageCampaignMembers, onAddCompany, onOpenAircallUser, onDeleteMeeting, currentUserId = "", canManageCrmRecords = false }) {
  const { clients, accounts, contacts, workspaceUsers, meetings } = useCrmData();
  const [expandedCampaignSection, setExpandedCampaignSection] = useState("");
  const [membershipOpen, setMembershipOpen] = useState(false);
  if (campaign?.id === "none") {
    return <ScopeSelectionPrompt requireClient={false} />;
  }
  const campaignClient = clients.find(client => client.id === campaign.clientId);
  const campaignCompanyIds = new Set(Array.isArray(campaign.companyIds) ? campaign.companyIds : []);
  const campaignContactIds = new Set(Array.isArray(campaign.contactIds) ? campaign.contactIds : []);
  const campaignAccounts = accounts.filter(account => campaignCompanyIds.has(account.id));
  const campaignContacts = campaignContactIds.size
    ? contacts.filter(contact => campaignContactIds.has(contact.id))
    : contacts.filter(contact => campaignAccounts.some(account => account.id === contact.accountId || account.id === contact.companyId));
  const companiesExpanded = expandedCampaignSection === "companies";
  const contactsExpanded = expandedCampaignSection === "contacts";
  const visibleCampaignContacts = contactsExpanded ? campaignContacts : campaignContacts.slice(0, 8);
  const rawAssignedUserIds = Array.isArray(campaign.memberIds) ? campaign.memberIds : [];
  const assignedUserIds = rawAssignedUserIds.length || !currentUserId ? rawAssignedUserIds : [currentUserId];
  const assignedUsers = (workspaceUsers || []).filter(workspaceUser => assignedUserIds.includes(workspaceUser.id));
  const campaignCalls = (aircallData?.calls || []).filter(call => (
    call.campaignId === campaign.id
    || campaignCompanyIds.has(call.companyId)
    || campaignContactIds.has(call.contactId)
  ));
  const todaysCampaignCalls = callsForDate(campaignCalls);
  const userCallRows = buildUserCallSummaries(todaysCampaignCalls, workspaceUsers || []);
  const campaignMeetings = (meetings || []).filter(meeting => meeting.campaignId === campaign.id);

  return (
    <>
      <PageHeader
        eyebrow="Campaign detail"
        title={campaign.name}
        description={campaign.nextAction}
      >
        {campaignClient ? (
          <button className="secondary-button" type="button" onClick={() => onOpenClient?.(campaignClient.id)}>
            <Building2 size={16} />
            Client account
          </button>
        ) : null}
        {canManageCrmRecords ? <button className="secondary-button" type="button" onClick={() => onEditCampaign(campaign)}>Edit campaign</button> : null}
        <button className="secondary-button" type="button" onClick={() => onNavigate("contacts")}>Contacts</button>
        {canManageCrmRecords ? (
          <button className="primary-button" type="button" onClick={() => onAddCompany(campaign)}>
            <Plus size={16} />
            Add company
          </button>
        ) : null}
        {/* Calls workspace disabled: <button className="primary-button" type="button" onClick={() => onNavigate("calls")}>Call queue</button> */}
      </PageHeader>
      {campaign.imageUrl ? (
        <section className="panel client-brand-panel">
          <img src={campaign.imageUrl} alt="" />
          <div>
            <span className="eyebrow">Campaign image</span>
            <strong>{campaign.imageName || campaign.name}</strong>
          </div>
        </section>
      ) : null}
      <div className="metrics-grid">
        <MetricCard label="Companies" value={campaign.accounts} detail="In campaign scope" icon={BriefcaseBusiness} />
        <MetricCard label="Contacts" value={campaign.contacts} detail="Mapped to personas" icon={Users} />
        <MetricCard label="Meetings" value={campaignMeetings.length || campaign.meetings} detail="Booked so far" icon={CalendarDays} />
        <MetricCard label="Owner" value={campaign.owner} detail={campaign.channel} icon={UserRound} />
      </div>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Today</span>
              <h2>Calls by user</h2>
            </div>
          </div>
          <UserCallSummaryList rows={userCallRows} onOpenUser={onOpenAircallUser} />
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Meetings</span>
              <h2>Campaign meetings</h2>
            </div>
            <strong>{campaignMeetings.length}</strong>
          </div>
          <MeetingList meetings={campaignMeetings} campaigns={[campaign]} workspaceUsers={workspaceUsers || []} calls={aircallData?.calls || []} onDeleteMeeting={onDeleteMeeting} />
        </section>
      </div>
      <section className="panel campaign-setup-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Focus</span>
            <h2>Companies</h2>
          </div>
          <div className="panel-header-actions campaign-setup-actions">
            {canManageCrmRecords ? (
              <button className="secondary-button small-button" type="button" onClick={() => onAddCompany(campaign)}>
                <Plus size={15} />
                Add company
              </button>
            ) : null}
            {canManageCrmRecords ? (
              <button className="secondary-button small-button" type="button" onClick={() => setMembershipOpen(true)}>
                <Users size={15} />
                Manage users
              </button>
            ) : null}
            {campaignAccounts.length ? (
              <button
                className="secondary-button small-button"
                type="button"
                onClick={() => setExpandedCampaignSection(companiesExpanded ? "" : "companies")}
                aria-expanded={companiesExpanded}
              >
                <ChevronDown className={companiesExpanded ? "chevron-open" : ""} size={15} />
                {companiesExpanded ? "Show less" : "View more"}
              </button>
            ) : null}
          </div>
        </div>
        <div className={`campaign-focus-section${companiesExpanded ? " expanded" : ""}`}>
          <div className="setup-section-header">
            <span>{campaignAccounts.length} compan{campaignAccounts.length === 1 ? "y" : "ies"} in campaign scope</span>
          </div>
          {campaignAccounts.length ? (
            <AccountTable accounts={campaignAccounts} onOpenAccount={onOpenAccount} />
          ) : (
            <div className="setup-empty-state">
              <BriefcaseBusiness size={22} />
              <strong>No companies yet</strong>
              <span>Add companies to define the campaign account list.</span>
            </div>
          )}
        </div>
      </section>
      <section className="panel campaign-setup-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Setup</span>
            <h2>People and users</h2>
          </div>
        </div>
        <div className="campaign-setup-grid">
          <section className={`campaign-setup-section${contactsExpanded ? " expanded" : ""}`}>
            <div className="setup-section-header">
              <div>
                <span className="eyebrow">People</span>
                <h3>Contacts</h3>
              </div>
              <div className="setup-section-actions">
                <span>{visibleCampaignContacts.length} of {campaignContacts.length}</span>
                {campaignContacts.length > 8 ? (
                  <button
                    className="secondary-button small-button"
                    type="button"
                    onClick={() => setExpandedCampaignSection(contactsExpanded ? "" : "contacts")}
                    aria-expanded={contactsExpanded}
                  >
                    <ChevronDown className={contactsExpanded ? "chevron-open" : ""} size={15} />
                    {contactsExpanded ? "Show less" : "View more"}
                  </button>
                ) : null}
              </div>
            </div>
            {campaignContacts.length ? (
              <div className="compact-list">
                {visibleCampaignContacts.map(contact => (
                  <div className="compact-list-row contact-scope-row" key={contact.id}>
                    <button className="compact-list-main" type="button" onClick={() => contact.accountId ? onOpenAccount(contact.accountId) : undefined}>
                      <span>
                        <strong>{contact.name}</strong>
                        <small>{contact.company || contact.account || contact.role || "Campaign contact"}</small>
                      </span>
                      <span className="muted-inline">{contact.mobile || contact.phone || contact.directDial || "No phone"}</span>
                    </button>
                    <button
                      className="icon-action contact-direct-action"
                      type="button"
                      onClick={() => onOpenContact?.(contact.id)}
                      aria-label={`Open ${contact.name} contact`}
                      title="Open contact"
                    >
                      <Contact size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="setup-empty-state">
                <Users size={22} />
                <strong>No contacts in scope</strong>
                <span>Contacts appear when campaign companies have mapped people.</span>
              </div>
            )}
          </section>
          <section className="campaign-setup-section">
            <div className="setup-section-header">
              <div>
                <span className="eyebrow">Team</span>
                <h3>Users</h3>
              </div>
              <strong>{assignedUsers.length}</strong>
            </div>
            {assignedUsers.length ? (
              <div className="team-list compact-team-list">
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
            ) : (
              <div className="setup-empty-state">
                <UserRound size={22} />
                <strong>No users assigned</strong>
                <span>Add users to make this campaign visible to members.</span>
              </div>
            )}
          </section>
        </div>
      </section>
      {membershipOpen ? (
        <CampaignMembershipModal
          campaign={campaign}
          workspaceUsers={workspaceUsers || []}
          currentUserId={currentUserId}
          onClose={() => setMembershipOpen(false)}
          onSave={values => {
            onManageCampaignMembers?.(campaign, values);
            setMembershipOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function AccountTable({ accounts: providedAccounts, onOpenAccount, onEditAccount }) {
  const { accounts: allAccounts } = useCrmData();
  const accounts = providedAccounts || allAccounts;
  const { formatCurrency } = useCurrency();

  return (
    <DataTable
      columns={["Company", "Owner", "Stage", "Value", "Last activity", "Next action", ""]}
      rows={accounts.map(account => [
        <RecordName key="account" name={account.name} meta={`${account.industry} - ${account.domain}`} />,
        account.owner,
        <StatusBadge key="stage" tone={account.status === "Priority" ? "accent" : "neutral"}>{account.stage}</StatusBadge>,
        formatCurrency(account.value),
        account.lastActivity,
        account.nextAction,
        <div key="actions" className="row-actions">
          {onEditAccount ? (
            <button className="icon-action" type="button" onClick={event => {
              event.stopPropagation();
              onEditAccount?.(account);
            }} title={`Edit ${account.name}`} aria-label={`Edit ${account.name}`}>
              <Pencil size={16} />
            </button>
          ) : null}
          <button className="icon-action" type="button" onClick={event => {
            event.stopPropagation();
            onOpenAccount(account.id);
          }} title={`Open ${account.name}`} aria-label={`Open ${account.name}`}>
            <Eye size={16} />
          </button>
        </div>,
      ])}
      rowActions={accounts.map(account => () => onOpenAccount(account.id))}
    />
  );
}

function AccountDetailPage({ account, onOpenContact, onEditAccount, onQueueResearch, onNewContact, onNewDeal, canManageCrmRecords = false }) {
  const { contacts, deals } = useCrmData();
  const { formatCurrency } = useCurrency();
  const accountContacts = contacts.filter(contact => contact.accountId === account.id);
  const accountDeals = deals.filter(deal => deal.account === account.name);

  return (
    <>
      <PageHeader
        eyebrow="Company"
        title={account.name}
        description={account.insight}
      >
        {canManageCrmRecords ? <button className="secondary-button" type="button" onClick={() => onEditAccount(account)}>Edit company</button> : null}
        <button className="secondary-button" type="button">
          <ExternalLink size={16} />
          {account.domain}
        </button>
        {canManageCrmRecords ? (
          <button className="primary-button" type="button" onClick={() => onQueueResearch(account.id)}>
            <Sparkles size={16} />
            Research brief
          </button>
        ) : null}
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
            {canManageCrmRecords ? <button className="text-button" type="button" onClick={() => onNewContact(account.id)}>Add contact</button> : null}
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
          </div> : <EmptyState icon={Contact} title="No contacts at this company" text="Add contacts to map stakeholders and build the call queue." />}
        </section>
        <section className="panel">
          <div className="panel-header">
            <h2>Deals</h2>
            {canManageCrmRecords ? <button className="text-button" type="button" onClick={() => onNewDeal(account.id)}>New deal</button> : null}
          </div>
          {accountDeals.length ? <div className="detail-list">
            {accountDeals.map(deal => (
              <div key={deal.id}>
                <span>{deal.stage}</span>
                <strong>{formatCurrency(deal.value)} with {deal.contact}</strong>
              </div>
            ))}
          </div> : <EmptyState icon={KanbanSquare} title="No deals for this company" text="Create a deal when there is a qualified opportunity to track." />}
        </section>
      </div>
      {account.scripts && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Company intelligence</span>
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
      if (!importedRows.length) throw new Error("No contact rows found. Include contact name and company columns.");
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
        title="Contact database"
        description="A lead-list CRM view for contactability, ownership, persona mapping, and quick access to saved details."
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
      <div className="contact-workflow-strip" aria-label="Contact workflow">
        <div>
          <Users size={16} aria-hidden="true" />
          <span>Lead database</span>
          <strong>{contacts.length} contacts</strong>
        </div>
        <div>
          <Database size={16} aria-hidden="true" />
          <span>Verified details</span>
          <strong>{contacts.filter(contact => getContactPhoneNumber(contact) && contact.email).length} ready</strong>
        </div>
        <div>
          <Target size={16} aria-hidden="true" />
          <span>Prioritise personas</span>
          <strong>{new Set(contacts.map(contact => contact.persona || contact.role).filter(Boolean)).size} signals</strong>
        </div>
        <div>
          <Phone size={16} aria-hidden="true" />
          <span>Call queue</span>
          <strong>{contacts.filter(contact => getContactPhoneNumber(contact)).length} callable</strong>
        </div>
      </div>
      <div className="contact-search-bar">
        <Search size={16} />
        <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search contacts by name, email, phone, role, or company" />
        <span>{filteredContacts.length} of {contacts.length}</span>
      </div>
      {importMessage ? <div className={importStatus === "error" ? "form-error" : "form-success"}>{importMessage}</div> : null}
      <section className="panel">
        {contacts.length ? (
          filteredContacts.length
            ? <ContactTable contacts={filteredContacts} onOpenContact={onOpenContact} onRemoveContact={onRemoveContact} canDeleteContacts={canDeleteContacts} />
            : <EmptyState icon={Search} title="No matching contacts" text="Try a different name, email, phone number, role, or company." />
        ) : <EmptyState icon={Contact} title="No contacts yet" text="Add contacts after creating companies, or import a contact list." />}
      </section>
    </>
  );
}

function contactStatusTone(status = "") {
  const normalized = String(status).toLowerCase();
  if (normalized.includes("call") || normalized.includes("warm") || normalized.includes("meeting")) return "success";
  if (normalized.includes("research") || normalized.includes("new")) return "accent";
  if (normalized.includes("hold") || normalized.includes("missing")) return "warning";
  return "neutral";
}

function ContactDataCell({ icon: DataIcon, label, value, tone = "neutral", copied = false, onCopy }) {
  return (
    <span className={`contact-data-cell ${tone}`} title={value || label}>
      {createElement(DataIcon, { size: 14, "aria-hidden": "true" })}
      <span>{value || label}</span>
      {value ? (
        <button
          className="copy-inline-button"
          type="button"
          onClick={onCopy}
          title={`Copy ${label.toLowerCase()}`}
          aria-label={`Copy ${label.toLowerCase()}`}
        >
          {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
        </button>
      ) : null}
    </span>
  );
}

function ContactTable({ contacts, onOpenContact, onRemoveContact, canDeleteContacts }) {
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [confirmationValue, setConfirmationValue] = useState("");
  const [removalStatus, setRemovalStatus] = useState("idle");
  const [removalError, setRemovalError] = useState("");
  const [copiedCell, setCopiedCell] = useState("");

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

  async function copyContactValue(event, key, value) {
    event.stopPropagation();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedCell(key);
      window.setTimeout(() => setCopiedCell(current => current === key ? "" : current), 1600);
    } catch {
      setCopiedCell("");
    }
  }

  return (
    <>
      <div className="contact-list-table">
        <table className="contact-crm-table">
          <thead>
            <tr>
              <th className="contact-select-column" aria-label="Select contacts"></th>
              <th><Users size={13} aria-hidden="true" /> Full name</th>
              <th><Building2 size={13} aria-hidden="true" /> Company</th>
              <th><BriefcaseBusiness size={13} aria-hidden="true" /> Position</th>
              <th><Mail size={13} aria-hidden="true" /> Email</th>
              <th><Phone size={13} aria-hidden="true" /> Mobile</th>
              <th><Phone size={13} aria-hidden="true" /> Direct dial</th>
              <th><ExternalLink size={13} aria-hidden="true" /> LinkedIn</th>
              <th><Circle size={13} aria-hidden="true" /> Status</th>
              <th><UserRound size={13} aria-hidden="true" /> Owner</th>
              <th aria-label="Actions"></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map(contact => {
              const mobileNumber = getContactMobileNumber(contact);
              const directDialNumber = getContactDirectDialNumber(contact);
              const phoneNumber = getContactPhoneNumber(contact);
              const emailTone = contact.email ? "success" : "missing";
              const mobileTone = mobileNumber ? "success" : "missing";
              const directDialTone = directDialNumber ? "success" : "missing";
              const companyName = contact.account || contact.company || "Company needed";
              const jobTitle = contact.role || contact.title || contact.persona || "Role needed";
              const linkedinUrl = contact.linkedin || contact.linkedinUrl || contact.linkedinProfileUrl || "";
              return (
                <tr
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
                  <td className="contact-select-column">
                    <input
                      type="checkbox"
                      aria-label={`Select ${contact.name}`}
                      onClick={event => event.stopPropagation()}
                      onChange={() => {}}
                    />
                  </td>
                  <td>
                    <div className="contact-list-person">
                      <span className="record-avatar">{accountInitial(contact.name)}</span>
                      <div title={contact.name}>
                        <strong>{contact.name}</strong>
                        <small>{contact.lastTouch || "No activity logged"}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-list-account" title={companyName}>
                      <strong>{companyName}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="contact-list-role" title={jobTitle}>
                      <strong>{jobTitle}</strong>
                    </div>
                  </td>
                  <td>
                    <ContactDataCell
                      icon={Mail}
                      label="Email missing"
                      value={contact.email}
                      tone={emailTone}
                      copied={copiedCell === `${contact.id}:email`}
                      onCopy={event => copyContactValue(event, `${contact.id}:email`, contact.email)}
                    />
                  </td>
                  <td>
                    <ContactDataCell
                      icon={Phone}
                      label="Mobile missing"
                      value={mobileNumber}
                      tone={mobileTone}
                      copied={copiedCell === `${contact.id}:mobile`}
                      onCopy={event => copyContactValue(event, `${contact.id}:mobile`, mobileNumber)}
                    />
                  </td>
                  <td>
                    <ContactDataCell
                      icon={Phone}
                      label="Direct missing"
                      value={directDialNumber}
                      tone={directDialTone}
                      copied={copiedCell === `${contact.id}:direct`}
                      onCopy={event => copyContactValue(event, `${contact.id}:direct`, directDialNumber)}
                    />
                  </td>
                  <td>
                    {linkedinUrl ? (
                      <a
                        className="contact-linkedin-cell"
                        href={linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={event => event.stopPropagation()}
                        title={linkedinUrl}
                      >
                        LinkedIn
                      </a>
                    ) : (
                      <span className="contact-muted-cell">Missing</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge tone={contactStatusTone(contact.status)}>{contact.status || "New"}</StatusBadge>
                  </td>
                  <td>
                    <div className="contact-owner-cell">
                      <span>{accountInitial(contact.owner)}</span>
                      <strong>{contact.owner || "Unassigned"}</strong>
                    </div>
                  </td>
                  <td>
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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

function AircallDashboardPage({ aircallData, workspaceUsers = [], contacts = [], onOpenContact, canSync = false, onSyncAircall, onBookMeeting, currentUserId = "", currentAircallUserId = "", selectedAircallUserId = "", isAdmin = false }) {
  const { campaigns: crmCampaigns = [] } = useCrmData();
  const todayKey = toLocalDateKey(new Date());
  const [rangeMode, setRangeMode] = useState("today");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => monthKeyFromDateKey(todayKey));
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [activeAircallPanel, setActiveAircallPanel] = useState("activity");
  const [transcriptModalCall, setTranscriptModalCall] = useState(null);
  const [meetingBookingCall, setMeetingBookingCall] = useState(null);
  const [freshRecordingStatus, setFreshRecordingStatus] = useState("");
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncError, setSyncError] = useState("");
  const rawCalls = Array.isArray(aircallData?.calls) ? aircallData.calls : [];
  const rawAircallUsers = Array.isArray(aircallData?.users) ? aircallData.users : [];
  const visibleWorkspaceUsers = isAdmin ? workspaceUsers : workspaceUsers.filter(item => item.id === currentUserId);
  const currentAircallUserIds = new Set([
    currentAircallUserId,
    ...visibleWorkspaceUsers.map(user => user.aircallUserId),
  ].filter(Boolean).map(String));
  const visibleAircallUsers = isAdmin
    ? rawAircallUsers
    : rawAircallUsers.filter(item => item.linkedUserId === currentUserId || (item.aircallUserId && currentAircallUserIds.has(String(item.aircallUserId))));
  const calls = isAdmin ? rawCalls : rawCalls.filter(call => (
    call.userId === currentUserId
    || (call.aircallUserId && currentAircallUserIds.has(String(call.aircallUserId)))
  ));
  const aircallUsers = visibleAircallUsers;
  const selectedDateKey = normalizeDateKey(selectedDate) || todayKey;
  const dateRange = getAircallDateRange(rangeMode, selectedDateKey);
  const dateRangeLabel = describeAircallDateRange(rangeMode, selectedDateKey, dateRange);
  const userById = new Map(visibleWorkspaceUsers.map(item => [item.id, item]));
  const contactById = new Map(contacts.map(item => [item.id, item]));
  const rangeCalls = calls.filter(call => {
    const startedAt = call.startedAt ? new Date(call.startedAt) : null;
    return !startedAt || Number.isNaN(startedAt.getTime()) || (startedAt >= dateRange.start && startedAt < dateRange.end);
  });
  const aircallUserByLinkedUserId = new Map(aircallUsers.filter(item => item.linkedUserId).map(item => [item.linkedUserId, item]));
  const workspaceUserRows = visibleWorkspaceUsers.map(workspaceUser => {
    const mirroredAircallUser = aircallUserByLinkedUserId.get(workspaceUser.id) || aircallUsers.find(item => item.aircallUserId === workspaceUser.aircallUserId);
    const rowAircallUserId = workspaceUser.aircallUserId || mirroredAircallUser?.aircallUserId || "";
    const userCalls = rangeCalls.filter(call => call.userId === workspaceUser.id || (rowAircallUserId && call.aircallUserId === rowAircallUserId));
    const userSentiments = userCalls.map(deriveAircallCallSentiment).filter(Boolean);
    return {
      ...workspaceUser,
      rowId: workspaceUser.id,
      aircallUserId: rowAircallUserId,
      matchStatus: mirroredAircallUser?.matchStatus || (workspaceUser.aircallUserId ? "manual" : "unmatched"),
      calls: userCalls.length,
      connected: userCalls.filter(call => call.answeredAt).length,
      recorded: userCalls.filter(call => call.recordingUrl).length,
      duration: userCalls.reduce((total, call) => total + (Number(call.durationSeconds) || 0), 0),
      sentiment: userSentiments.length
        ? Math.round((userSentiments.reduce((total, item) => total + item.score, 0) / userSentiments.length) * 100) / 100
        : null,
    };
  });
  const workspaceAircallIds = new Set(workspaceUserRows.map(row => row.aircallUserId).filter(Boolean));
  const unlinkedAircallUserRows = aircallUsers
    .filter(item => !item.linkedUserId && !workspaceAircallIds.has(item.aircallUserId))
    .map(item => {
      const userCalls = rangeCalls.filter(call => call.aircallUserId === item.aircallUserId);
      const userSentiments = userCalls.map(deriveAircallCallSentiment).filter(Boolean);
      return {
        id: item.aircallUserId,
        rowId: item.aircallUserId,
        email: item.email,
        name: item.name || item.email || `Aircall user ${item.aircallUserId}`,
        initials: accountInitial(item.name || item.email || item.aircallUserId),
        aircallUserId: item.aircallUserId,
        matchStatus: item.matchStatus || "unmatched",
        calls: userCalls.length,
        connected: userCalls.filter(call => call.answeredAt).length,
        recorded: userCalls.filter(call => call.recordingUrl).length,
        duration: userCalls.reduce((total, call) => total + (Number(call.durationSeconds) || 0), 0),
        sentiment: userSentiments.length
          ? Math.round((userSentiments.reduce((total, sentiment) => total + sentiment.score, 0) / userSentiments.length) * 100) / 100
        : null,
      };
    });
  const unassignedCalls = rangeCalls.filter(call => !call.userId && !call.aircallUserId);
  const missedInboundGroups = new Map();
  for (const call of unassignedCalls) {
    const targetName = call.aircallNumberName || "Target not synced";
    const displayTargetName = cleanAircallNumberOwnerName(targetName, rawAircallUsers);
    const targetNumber = call.aircallNumberDigits || "";
    const callerNumber = call.externalPhoneNumber || "";
    const groupKey = `${targetName}::${targetNumber}::${callerNumber}`;
    const existingGroup = missedInboundGroups.get(groupKey);
    const nextStartedAt = call.startedAt ? new Date(call.startedAt).getTime() : 0;
    const existingStartedAt = existingGroup?.startedAt ? new Date(existingGroup.startedAt).getTime() : 0;
    if (existingGroup) {
      existingGroup.count += 1;
      existingGroup.durationSeconds += Number(call.durationSeconds) || 0;
      existingGroup.callIds.push(call.aircallCallId);
      if (nextStartedAt >= existingStartedAt) {
        existingGroup.startedAt = call.startedAt;
        existingGroup.missedCallReason = call.missedCallReason;
        existingGroup.status = call.status;
        existingGroup.directLink = call.directLink;
      }
    } else {
      missedInboundGroups.set(groupKey, {
        id: groupKey,
        targetName,
        displayTargetName,
        targetNumber,
        callerNumber,
        count: 1,
        durationSeconds: Number(call.durationSeconds) || 0,
        startedAt: call.startedAt,
        missedCallReason: call.missedCallReason,
        status: call.status,
        directLink: call.directLink,
        callIds: [call.aircallCallId],
      });
    }
  }
  const missedInboundRows = [...missedInboundGroups.values()].sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0));
  const userRows = [...workspaceUserRows, ...unlinkedAircallUserRows].sort((a, b) => b.calls - a.calls || String(a.name).localeCompare(String(b.name)));
  const selectedUserRow = userRows.find(row => row.rowId === selectedUserId);
  const filteredCalls = rangeCalls.filter(call => {
    if (selectedUserId === "all") return true;
    return call.userId === selectedUserId
      || call.aircallUserId === selectedUserId
      || (selectedUserRow?.aircallUserId && call.aircallUserId === selectedUserRow.aircallUserId);
  });
  const connectedCalls = filteredCalls.filter(call => call.answeredAt);
  const recordedCalls = filteredCalls.filter(call => call.recordingUrl);
  const transcriptCalls = filteredCalls.filter(call => call.transcriptText || (Array.isArray(call.transcriptUtterances) && call.transcriptUtterances.length));
  const totalDuration = filteredCalls.reduce((total, call) => total + (Number(call.durationSeconds) || 0), 0);
  const sentimentCalls = filteredCalls
    .map(call => ({ call, sentiment: deriveAircallCallSentiment(call) }))
    .filter(item => item.sentiment);
  const averageSentiment = sentimentCalls.length
    ? Math.round((sentimentCalls.reduce((total, item) => total + item.sentiment.score, 0) / sentimentCalls.length) * 100) / 100
    : null;
  const sentimentCounts = sentimentCalls.reduce((acc, item) => {
    acc[item.sentiment.tone] = (acc[item.sentiment.tone] || 0) + 1;
    return acc;
  }, { positive: 0, neutral: 0, negative: 0 });
  const tagDerivedSentimentCount = sentimentCalls.filter(item => item.sentiment.source === "aircall-tags").length;
  const sentimentTotal = Math.max(1, sentimentCounts.positive + sentimentCounts.neutral + sentimentCounts.negative);
  const maxUserCalls = Math.max(1, ...userRows.map(row => row.calls));
  const dailyRows = [...Array(dateRange.days)].map((_, index) => {
    const date = addDays(dateRange.start, index);
    const key = toLocalDateKey(date);
    return {
      key,
      label: formatAircallTrendLabel(key, dateRange.days),
      subLabel: formatAircallTrendSubLabel(key, dateRange.days),
      calls: rangeCalls.filter(call => {
        const startedAt = call.startedAt ? new Date(call.startedAt) : null;
        return startedAt && !Number.isNaN(startedAt.getTime()) && toLocalDateKey(startedAt) === key;
      }).length,
    };
  });
  const maxDailyCalls = Math.max(1, ...dailyRows.map(row => row.calls));
  const calendarDays = buildCalendarDays(calendarMonth);
  const selectableUsers = [
    ...userRows.map(item => ({ id: item.rowId, label: item.name || item.email || item.aircallUserId || "Aircall user" })),
  ];

  useEffect(() => {
    if (selectedAircallUserId) setSelectedUserId(selectedAircallUserId);
  }, [selectedAircallUserId]);

  function chooseRangeMode(nextRangeMode) {
    setRangeMode(nextRangeMode);
    if (nextRangeMode === "today") setSelectedDate(todayKey);
    if (nextRangeMode === "yesterday") setSelectedDate(toLocalDateKey(addDays(startOfLocalDay(new Date()), -1)));
    setCalendarOpen(false);
  }

  function chooseCalendarDate(dateKey) {
    setSelectedDate(dateKey);
    setRangeMode("date");
    setCalendarMonth(monthKeyFromDateKey(dateKey));
    setCalendarOpen(false);
  }

  function moveCalendarMonth(offset) {
    const [year, month] = calendarMonth.split("-").map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    setCalendarMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  }

  function getCallDisplayData(call) {
    const contact = contactById.get(call.contactId);
    const linkedAircallUser = aircallUsers.find(user => user.aircallUserId === call.aircallUserId);
    const agentName = userById.get(call.userId)?.name || call.userName || linkedAircallUser?.name || "Unassigned";
    const otherParty = contact?.name || call.externalPhoneNumber || "Unknown caller";
    const tags = (call.tags || []).map(getAircallTagLabel).filter(Boolean);
    const transcriptTurns = getTranscriptTurns(call, agentName, otherParty);
    const transcriptText = transcriptTurns.length
      ? transcriptTurns.map(turn => `${turn.speaker}: ${turn.text}`).join("\n\n")
      : call.transcriptText || "";
    return { contact, agentName, otherParty, tags, transcriptTurns, transcriptText };
  }

  function buildTranscriptCopyText(call, contact, agentName, tags, transcriptText) {
    const derivedSentiment = deriveAircallCallSentiment(call);
    return [
      `Call: ${contact?.name || call.externalPhoneNumber || call.aircallCallId}`,
      `Time: ${formatDateTime(call.startedAt)}`,
      `Agent: ${agentName}`,
      `Outcome: ${call.myOutcome || call.status || "No outcome"}`,
      tags.length ? `Tags: ${tags.join(", ")}` : "",
      `Outcome signal: ${derivedSentiment?.label || "No scored outcome"}`,
      call.summary ? `Summary: ${call.summary}` : "",
      `Transcript:\n${transcriptText}`,
    ].filter(Boolean).join("\n");
  }

  async function copyCall(call) {
    const { contact, agentName, tags, transcriptText } = getCallDisplayData(call);
    if (!transcriptText) return;
    await navigator.clipboard?.writeText(buildTranscriptCopyText(call, contact, agentName, tags, transcriptText));
  }

  async function openFreshRecording(call) {
    if (!call?.aircallCallId) return;
    const statusKey = String(call.aircallCallId);
    setFreshRecordingStatus(statusKey);
    setSyncError("");
    try {
      const response = await fetch("/api/aircall/recording-link", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({ callId: call.aircallCallId }),
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error || "Could not create a temporary recording link.");
      if (payload.recordingUrl) window.open(payload.recordingUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setSyncError(error.message || "Could not create a temporary recording link.");
    } finally {
      setFreshRecordingStatus("");
    }
  }

  function renderTranscriptModal() {
    if (!transcriptModalCall) return null;
    const { contact, agentName, otherParty, tags, transcriptTurns, transcriptText } = getCallDisplayData(transcriptModalCall);
    if (!transcriptText) return null;
    const isInbound = String(transcriptModalCall.direction || "").toLowerCase() === "inbound";
    return (
      <section className="modal-backdrop" role="presentation" onMouseDown={event => {
        if (event.target === event.currentTarget) setTranscriptModalCall(null);
      }}>
        <div className="workflow-modal transcript-modal" role="dialog" aria-modal="true" aria-labelledby="aircall-transcript-title">
          <div className="modal-header">
            <div>
              <span className="eyebrow">Aircall transcript</span>
              <h2 id="aircall-transcript-title">{isInbound ? `${otherParty} called ${agentName}` : `${agentName} called ${otherParty}`}</h2>
              <p>{formatDateTime(transcriptModalCall.startedAt)} · {formatDuration(transcriptModalCall.durationSeconds)}</p>
            </div>
            <button className="icon-action" type="button" onClick={() => setTranscriptModalCall(null)} aria-label="Close transcript">
              <X size={16} />
            </button>
          </div>
          <div className="transcript-party-grid" aria-label="Call participants">
            <div>
              <span>{isInbound ? "Caller" : "Agent"}</span>
              <strong>{isInbound ? otherParty : agentName}</strong>
            </div>
            <div>
              <span>{isInbound ? "Agent" : "Other person"}</span>
              <strong>{isInbound ? agentName : otherParty}</strong>
            </div>
          </div>
          {tags.length ? (
            <div className="call-chip-row transcript-modal-tags">
              {tags.map(tag => <span key={`transcript-tag:${tag}`} className="sentiment-chip neutral">{tag}</span>)}
            </div>
          ) : null}
          {transcriptModalCall.summary ? (
            <section className="transcript-modal-summary">
              <span>Summary</span>
              <p>{transcriptModalCall.summary}</p>
            </section>
          ) : null}
          <div className="transcript-modal-body">
            {transcriptTurns.length
              ? transcriptTurns.map((turn, index) => (
                <article className={`transcript-turn ${turn.role}`} key={`${turn.id}:${index}`}>
                  <header>
                    <strong>{turn.speaker}</strong>
                    {turn.time ? <span>{turn.time}</span> : null}
                  </header>
                  <p>{turn.text}</p>
                </article>
              ))
              : <p>{transcriptText}</p>}
          </div>
          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={() => setTranscriptModalCall(null)}>Close</button>
            <button className="secondary-button" type="button" onClick={() => navigator.clipboard?.writeText(buildTranscriptCopyText(transcriptModalCall, contact, agentName, tags, transcriptText))}>
              <Copy size={16} />
              Copy transcript
            </button>
            {transcriptModalCall.recordingUrl ? <a className="secondary-button" href={transcriptModalCall.recordingUrl} target="_blank" rel="noreferrer"><PlayCircle size={16} />Listen to recording</a> : null}
            {transcriptModalCall.recordingUrl ? (
              <button className="secondary-button" type="button" onClick={() => openFreshRecording(transcriptModalCall)} disabled={freshRecordingStatus === String(transcriptModalCall.aircallCallId)}>
                {freshRecordingStatus === String(transcriptModalCall.aircallCallId) ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <RefreshCw size={16} />}
                Temporary link
              </button>
            ) : null}
            {transcriptModalCall.directLink ? <a className="secondary-button" href={transcriptModalCall.directLink} target="_blank" rel="noreferrer"><ExternalLink size={16} />Open in Aircall</a> : null}
          </div>
        </div>
      </section>
    );
  }

  async function syncCalls() {
    if (!onSyncAircall) return;
    setSyncStatus("syncing");
    setSyncError("");
    try {
      await onSyncAircall();
      setSyncStatus("synced");
    } catch (error) {
      setSyncError(error.message || "Could not sync Aircall.");
      setSyncStatus("idle");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Aircall"
        title="Call dashboard"
      description={isAdmin ? "Track agent call volume, connected calls, recordings, transcripts, summaries, and outcome sentiment across the workspace." : "Track your synced calls, recordings, transcripts, summaries, and outcome sentiment."}
      >
        {canSync ? (
          <button className="secondary-button" type="button" onClick={syncCalls} disabled={syncStatus === "syncing"}>
            {syncStatus === "syncing" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <AircallLogoIcon size={16} />}
            {syncStatus === "syncing" ? "Syncing" : "Sync"}
          </button>
        ) : null}
      </PageHeader>
      {syncError ? <div className="form-error">{syncError}</div> : null}
      {syncStatus === "synced" ? <div className="form-success">Aircall calls synced.</div> : null}
      {aircallData?.unavailable ? (
        <section className="panel">
          <EmptyState icon={Phone} title="Aircall tables not applied yet" text="Run the Aircall migration, then synced users and calls will appear here." />
        </section>
      ) : null}
      <div className="aircall-filter-panel">
        <div className="aircall-filter-summary">
          <span><ListFilter size={16} /> Filters</span>
          <strong>{dateRangeLabel}</strong>
        </div>
        <div className="aircall-quick-filters" aria-label="Date range">
          {[
            ["today", "Today"],
            ["yesterday", "Yesterday"],
            ["7", "Last 7 days"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={rangeMode === value ? "active" : ""}
              onClick={() => chooseRangeMode(value)}
            >
              {label}
            </button>
          ))}
          <div className="aircall-calendar-control">
            <button
              type="button"
              className={rangeMode === "date" ? "active" : ""}
              onClick={() => setCalendarOpen(open => !open)}
              aria-expanded={calendarOpen}
            >
              <CalendarDays size={16} />
              {rangeMode === "date" ? formatAircallDateLabel(selectedDateKey) : "Calendar"}
            </button>
            {calendarOpen ? (
              <div className="aircall-calendar-popover">
                <div className="aircall-calendar-header">
                  <button type="button" onClick={() => moveCalendarMonth(-1)} aria-label="Previous month">
                    <ChevronLeft size={16} />
                  </button>
                  <strong>{formatCalendarMonth(calendarMonth)}</strong>
                  <button type="button" onClick={() => moveCalendarMonth(1)} aria-label="Next month">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="aircall-calendar-weekdays" aria-hidden="true">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => <span key={day}>{day}</span>)}
                </div>
                <div className="aircall-calendar-grid">
                  {calendarDays.map(day => (
                    <button
                      key={day.key}
                      type="button"
                      className={[
                        day.inMonth ? "" : "muted",
                        day.key === selectedDateKey && rangeMode === "date" ? "selected" : "",
                        day.key === todayKey ? "today" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => chooseCalendarDate(day.key)}
                    >
                      {day.date.getDate()}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
        <label className="aircall-user-filter">
          <span>{isAdmin ? "User" : "Scope"}</span>
          <select value={selectedUserId} onChange={event => setSelectedUserId(event.target.value)}>
            <option value="all">{isAdmin ? "All users" : "My calls"}</option>
            {selectableUsers.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>
      <div className="metrics-grid">
        <MetricCard label="Calls made" value={filteredCalls.length} detail={`${connectedCalls.length} connected`} icon={AircallLogoIcon} />
        <MetricCard label="Calls with recordings" value={recordedCalls.length} detail="Aircall recording link synced" icon={FileText} />
        <MetricCard label="Talk time" value={formatDuration(totalDuration)} detail={`${formatDuration(totalDuration / Math.max(filteredCalls.length, 1))} avg`} icon={Clock} />
        <MetricCard label="Outcome sentiment" value={averageSentiment === null ? "N/A" : averageSentiment > 0 ? `+${averageSentiment}` : averageSentiment} detail={`${sentimentCalls.length} calls scored${tagDerivedSentimentCount ? `, ${tagDerivedSentimentCount} from tags` : ""}`} icon={Sparkles} />
      </div>
      <div className="content-grid two aircall-dashboard-grid">
        <section className="panel aircall-sentiment-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Charts</span>
              <h2>Outcome sentiment</h2>
            </div>
          </div>
          <div className="sentiment-chart">
            {["positive", "neutral", "negative"].map(tone => (
              <div className="sentiment-row" key={tone}>
                <span>{titleCase(tone)}</span>
                <div className="chart-track">
                  <div className={`chart-fill ${tone}`} style={{ width: `${Math.round((sentimentCounts[tone] / sentimentTotal) * 100)}%` }} />
                </div>
                <strong>{sentimentCounts[tone]}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="panel aircall-trend-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Charts</span>
              <h2>Daily trend</h2>
            </div>
          </div>
          <div className={`daily-chart ${dailyRows.length === 1 ? "single-day" : ""}`} aria-label="Daily calls">
            {dailyRows.map(row => (
              <div className="daily-bar" key={row.key} title={`${row.label}: ${row.calls} calls`}>
                <strong>{row.calls}</strong>
                <span style={{ height: `${Math.max(4, Math.round((row.calls / maxDailyCalls) * 100))}%` }} />
                <small>{row.label}</small>
                {row.subLabel ? <em>{row.subLabel}</em> : null}
              </div>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Users</span>
              <h2>Aircall users</h2>
            </div>
            <strong>{userRows.length}</strong>
          </div>
          <div className="user-call-list">
            {userRows.map(row => (
              <button className={`user-call-row ${selectedUserId === row.rowId ? "selected" : ""}`} key={row.rowId} type="button" onClick={() => setSelectedUserId(row.rowId)}>
                <span className="record-avatar">{accountInitial(row.name || row.email)}</span>
                <div>
                  <strong>{row.name || row.email}</strong>
                  <small>{row.aircallUserId ? `Aircall ID ${row.aircallUserId}` : row.matchStatus === "unassigned" ? "No Aircall user" : "Aircall ID missing"}</small>
                  <div className="chart-track small">
                    <div className="chart-fill calls" style={{ width: `${Math.round((row.calls / maxUserCalls) * 100)}%` }} />
                  </div>
                </div>
                <div className="call-count-stack">
                  <strong>{row.calls}</strong>
                  <small>{row.connected} connected</small>
                </div>
              </button>
            ))}
            {!userRows.length ? <EmptyState icon={Users} title="No users yet" text="Workspace users and Aircall matches will appear here." /> : null}
          </div>
        </section>
        <section className="panel aircall-detail-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Details</span>
              <h2>{activeAircallPanel === "missed" ? "Missed calls" : activeAircallPanel === "transcripts" ? "Transcripts" : "Call activity"}</h2>
            </div>
          </div>
          <div className="aircall-panel-switcher" role="tablist" aria-label="Aircall detail view">
            <button type="button" className={activeAircallPanel === "activity" ? "active" : ""} onClick={() => setActiveAircallPanel("activity")} role="tab" aria-selected={activeAircallPanel === "activity"}>
              <span>Call activity</span>
              <strong>{filteredCalls.length}</strong>
            </button>
            <button type="button" className={activeAircallPanel === "transcripts" ? "active" : ""} onClick={() => setActiveAircallPanel("transcripts")} role="tab" aria-selected={activeAircallPanel === "transcripts"}>
              <span>Transcripts</span>
              <strong>{transcriptCalls.length}</strong>
            </button>
            <button type="button" className={activeAircallPanel === "missed" ? "active" : ""} onClick={() => setActiveAircallPanel("missed")} role="tab" aria-selected={activeAircallPanel === "missed"}>
              <span>Missed calls</span>
              <strong>{missedInboundRows.length}</strong>
            </button>
          </div>
          {activeAircallPanel === "activity" || activeAircallPanel === "transcripts" ? (
            <div className="call-timeline-list">
              {(activeAircallPanel === "transcripts" ? transcriptCalls : filteredCalls).map(call => {
                const { contact, agentName, otherParty, tags, transcriptTurns, transcriptText } = getCallDisplayData(call);
                const isInbound = String(call.direction || "").toLowerCase() === "inbound";
                const derivedSentiment = deriveAircallCallSentiment(call);
                return (
                  <article className="call-timeline-item" key={call.id || call.aircallCallId}>
                    <span className="record-avatar">{accountInitial(agentName)}</span>
                    <div>
                      <strong>{agentName}</strong>
                      <span>{isInbound ? `${otherParty} called ${agentName}` : `${agentName} called ${otherParty}`}</span>
                      <span>{formatDateTime(call.startedAt)} · {formatDuration(call.durationSeconds)}</span>
                      {activeAircallPanel === "transcripts" && transcriptTurns.length ? (
                        <div className="call-transcript-preview">
                          {transcriptTurns.slice(0, 4).map((turn, index) => (
                            <span key={`${call.id || call.aircallCallId}:line:${index}`}>
                              <strong>{turn.speaker}</strong>
                              {turn.text}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>{call.summary || call.transcriptText || "No summary or transcript synced yet."}</p>
                      )}
                      <div className="call-chip-row">
                        {derivedSentiment ? <span className={`sentiment-chip ${derivedSentiment.tone}`}>{derivedSentiment.label}</span> : null}
                        {call.recordingUrl ? <span className="sentiment-chip neutral">Recording</span> : null}
                        {call.myOutcome ? <span className="sentiment-chip neutral">{call.myOutcome}</span> : null}
                        {tags.slice(0, 4).map(tag => <span key={`${call.id || call.aircallCallId}:tag:${tag}`} className="sentiment-chip neutral">{tag}</span>)}
                      </div>
                    </div>
                    <div className="row-actions">
                      {contact ? <button className="icon-button" type="button" title="Open contact" onClick={() => onOpenContact(contact.id)}><Contact size={16} /></button> : null}
                      {transcriptText ? <button className="icon-button" type="button" title="Open transcript" onClick={() => setTranscriptModalCall(call)}><FileText size={16} /></button> : null}
                      <button className="icon-button" type="button" title="Book meeting" onClick={() => setMeetingBookingCall({ ...call, transcriptText })}><CalendarDays size={16} /></button>
                      {transcriptText ? <button className="icon-button" type="button" title="Copy transcript" onClick={() => copyCall(call)}><Copy size={16} /></button> : null}
                      {call.recordingUrl ? <a className="icon-button" href={call.recordingUrl} target="_blank" rel="noreferrer" title="Listen to recording" aria-label="Listen to recording"><PlayCircle size={16} /></a> : null}
                      {call.recordingUrl ? <button className="icon-button" type="button" title="Create temporary recording link" aria-label="Create temporary recording link" onClick={() => openFreshRecording(call)} disabled={freshRecordingStatus === String(call.aircallCallId)}>{freshRecordingStatus === String(call.aircallCallId) ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <RefreshCw size={16} />}</button> : null}
                      {call.directLink ? <a className="icon-button" href={call.directLink} target="_blank" rel="noreferrer" title="Open in Aircall"><ExternalLink size={16} /></a> : null}
                    </div>
                  </article>
                );
              })}
              {activeAircallPanel === "activity" && !filteredCalls.length ? <EmptyState icon={AircallLogoIcon} title="No Aircall calls yet" text="Synced calls will show agent, contact, transcript, summary, recording, and sentiment here." /> : null}
              {activeAircallPanel === "transcripts" && !transcriptCalls.length ? <EmptyState icon={FileText} title="No transcripts synced yet" text="Aircall transcripts will appear here when generated for recorded calls." /> : null}
            </div>
          ) : null}
          {activeAircallPanel === "missed" ? (
            <div className="call-timeline-list missed-inbound-list">
              {missedInboundRows.map(call => (
                <article className="missed-inbound-item" key={call.id}>
                  <span className="record-avatar">{accountInitial(call.displayTargetName)}</span>
                  <div>
                    <strong>{call.displayTargetName}</strong>
                    <span>
                      {call.callerNumber || "Unknown caller"}
                      {call.count > 1 ? <b className="repeat-count">x{call.count}</b> : null}
                    </span>
                  </div>
                  {call.directLink ? <a className="icon-button" href={call.directLink} target="_blank" rel="noreferrer" title="Open in Aircall"><ExternalLink size={16} /></a> : null}
                </article>
              ))}
              {!missedInboundRows.length ? <EmptyState icon={Phone} title="No missed inbound calls" text="Inbound calls with no attached agent will appear here." /> : null}
            </div>
          ) : null}
        </section>
      </div>
      {renderTranscriptModal()}
      {meetingBookingCall ? (
        <MeetingBookingModal
          call={meetingBookingCall}
          campaigns={crmCampaigns}
          contacts={contacts}
          workspaceUsers={workspaceUsers}
          aircallUsers={rawAircallUsers}
          onClose={() => setMeetingBookingCall(null)}
          onSave={onBookMeeting}
        />
      ) : null}
    </>
  );
}

function ContactDetailPage({ contact, privateNote = "", contactCalls = [], onUpdateContact, onSavePrivateNote, onLogCall, onRemoveContact, canDeleteContacts, canManageCrmRecords = false }) {
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
          <div><span>Company</span><strong>{contact.account}</strong></div>
          <div><span>Role</span><strong>{contact.role || "Role needed"}</strong></div>
        </div>
      </div>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header">
            <h2>Contact details</h2>
            {canManageCrmRecords && editing ? (
              <div className="row-actions">
                <button className="text-button" type="button" onClick={() => setEditing(false)}>Cancel</button>
                <button className="secondary-button" type="button" onClick={saveContactChanges}>Save</button>
              </div>
            ) : canManageCrmRecords ? (
              <button className="secondary-button" type="button" onClick={() => setEditing(true)}>Edit</button>
            ) : null}
          </div>
          {editing ? (
            <div className="detail-edit-grid">
              <FormField label="Company">
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
              <h2>Call history</h2>
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
          <div className="contact-call-history">
            {contactCalls.slice(0, 6).map(call => {
              const derivedSentiment = deriveAircallCallSentiment(call);
              const copyText = [
                `Call with ${contact.name}`,
                `Time: ${formatDateTime(call.startedAt)}`,
                `Outcome: ${call.myOutcome || call.status || "No outcome"}`,
                `Outcome signal: ${derivedSentiment?.label || "No scored outcome"}`,
                call.summary ? `Summary: ${call.summary}` : "",
                call.transcriptText ? `Transcript: ${call.transcriptText}` : "",
              ].filter(Boolean).join("\n");
              return (
                <article className="contact-call-card" key={call.id || call.aircallCallId}>
                  <div>
                    <strong>{formatDateTime(call.startedAt)}</strong>
                    <span>{call.direction || "call"} · {formatDuration(call.durationSeconds)}</span>
                    <p>{call.summary || call.transcriptText || "No summary or transcript synced yet."}</p>
                    <div className="call-chip-row">
                      {derivedSentiment ? <span className={`sentiment-chip ${derivedSentiment.tone}`}>{derivedSentiment.label}</span> : null}
                      {call.recordingUrl ? <span className="sentiment-chip neutral">Recording</span> : null}
                    </div>
                  </div>
                  <button className="icon-button" type="button" title="Copy call summary" onClick={() => navigator.clipboard?.writeText(copyText)}>
                    <Copy size={16} />
                  </button>
                </article>
              );
            })}
            {!contactCalls.length ? <p className="muted-inline">No synced Aircall calls for this contact yet.</p> : null}
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
  if (activeClient?.id === "none" || activeCampaign?.id === "none") {
    return <ScopeSelectionPrompt />;
  }
  const scopedAccounts = activeClient?.id && activeClient.id !== "none"
    ? accounts.filter(account => account.clientId === activeClient.id)
    : [];
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
          <EmptyState icon={KanbanSquare} title="No deals in this pipeline yet" text="Create companies and contacts inside the client account, then add deals to track pipeline." />
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
            columns={["Contact", "Company", "Phone"]}
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
  if (activeClient?.id === "none" || activeCampaign?.id === "none") {
    return <ScopeSelectionPrompt />;
  }
  const scopedAccounts = activeClient?.id && activeClient.id !== "none" ? accounts.filter(account => account.clientId === activeClient.id) : [];
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
        title="Company intelligence"
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
              Open company <ArrowRight size={14} />
            </button>
          </article>
        )) : <section className="panel"><EmptyState icon={FileText} title="No research records yet" text="Research summaries will appear after companies are added and research jobs are created." /></section>}
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
  return lead.dbContactId ? <StatusBadge>Data portal</StatusBadge> : <StatusBadge>Not saved</StatusBadge>;
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

function LeadLookupCopyCell({ icon: CopyIcon, label, value, copied = false, onCopy }) {
  const displayValue = normalizeLookupValue(value);
  return (
    <div className={`lead-lookup-copy-cell ${displayValue ? "available" : "missing"}`} title={displayValue || "Not available"}>
      {createElement(CopyIcon, { size: 14, "aria-hidden": "true" })}
      <span>{displayValue || "Not available"}</span>
      {displayValue ? (
        <button
          className="copy-inline-button"
          type="button"
          onClick={onCopy}
          title={`Copy ${label}`}
          aria-label={`Copy ${label}`}
        >
          {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
        </button>
      ) : null}
    </div>
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

function LeadDatabasePage({ leadLists, contactDatabase = [], onSaveLeadContact, onAddToCrmContacts, onSaveLeadList, currentUserId = "", isAdmin = false }) {
  const { contacts: crmContacts, accounts = [], workspaceUsers = [], campaigns = [] } = useCrmData();
  const [leadLookupQuery, setLeadLookupQuery] = useState("");
  const [leadLookupCompany, setLeadLookupCompany] = useState("");
  const [leadLookupIndustry, setLeadLookupIndustry] = useState("");
  const [leadLookupTitle, setLeadLookupTitle] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [leadLookupDrafts, setLeadLookupDrafts] = useState({});
  const [leadLookupSaveStatuses, setLeadLookupSaveStatuses] = useState({});
  const [leadLookupPageSize, setLeadLookupPageSize] = useState("10");
  const [leadLookupPage, setLeadLookupPage] = useState(1);
  const [copiedLookupCell, setCopiedLookupCell] = useState("");
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [saveListOpen, setSaveListOpen] = useState(false);
  const [contactListName, setContactListName] = useState("");
  const [contactListAssignedUserIds, setContactListAssignedUserIds] = useState(() => currentUserId ? [currentUserId] : []);
  const [contactListCampaignIds, setContactListCampaignIds] = useState([]);
  const [contactListStatus, setContactListStatus] = useState("idle");
  const [contactListError, setContactListError] = useState("");
  const leadLookupCompanyOptions = [...new Set(contactDatabase.map(contact => normalizeLookupValue(contact.company)).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const industryByCompany = new Map(accounts.map(account => [normalizeLookupValue(account.name).toLowerCase(), normalizeLookupValue(account.industry)]));
  const leadLookupIndustryOptions = [...new Set(contactDatabase
    .map(contact => industryByCompany.get(normalizeLookupValue(contact.company).toLowerCase()))
    .filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const leadLookupTitleOptions = [...new Set(contactDatabase.map(contact => normalizeLookupValue(contact.jobTitle)).filter(Boolean))].sort((a, b) => a.localeCompare(b)).slice(0, 120);
  const leadListMembershipByIdentity = new Map();
  const savedEmailCount = contactDatabase.filter(contact => normalizeLookupValue(contact.manualEmail)).length;
  const savedMobileCount = contactDatabase.filter(contact => getDisplayPhoneNumber(contact.manualMobile)).length;
  const savedDirectDialCount = contactDatabase.filter(contact => getDisplayPhoneNumber(contact.manualDirectDial)).length;

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
    const contactIndustry = industryByCompany.get(normalizeLookupValue(contact.company).toLowerCase()) || "";
    if (leadLookupCompany && !normalizeLookupValue(contact.company).toLowerCase().includes(normalizeLookupValue(leadLookupCompany).toLowerCase())) return false;
    if (leadLookupIndustry && !contactIndustry.toLowerCase().includes(normalizeLookupValue(leadLookupIndustry).toLowerCase())) return false;
    if (leadLookupTitle && !normalizeLookupValue(contact.jobTitle).toLowerCase().includes(normalizeLookupValue(leadLookupTitle).toLowerCase())) return false;
    if (!leadLookupTerms.length) return true;
    const searchableText = [
      contact.contactName,
      contact.firstName,
      contact.lastName,
      contact.manualEmail,
      contact.manualMobile,
      contact.manualDirectDial,
      contact.company,
      contactIndustry,
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
  const availableContactIds = new Set(contactDatabase.map(contact => contact.id));
  const validSelectedContactIds = selectedContactIds.filter(id => availableContactIds.has(id));
  const selectedContacts = contactDatabase.filter(contact => validSelectedContactIds.includes(contact.id));
  const selectedCampaigns = campaigns.filter(campaign => contactListCampaignIds.includes(campaign.id));
  const selectedCampaignUserIds = selectedCampaigns.flatMap(campaign => Array.isArray(campaign.memberIds) ? campaign.memberIds : []);
  const contactListEffectiveAssignedUserIds = [...new Set([...contactListAssignedUserIds, ...selectedCampaignUserIds].filter(Boolean))];

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

  function contactToLead(contact) {
    return {
      ...contact,
      dbContactId: contact.id,
      contactName: normalizeLookupValue(contact.contactName || [contact.firstName, contact.lastName].filter(Boolean).join(" ")),
      company: normalizeLookupValue(contact.company),
      jobTitle: normalizeLookupValue(contact.jobTitle),
      location: normalizeLookupValue(contact.location),
      linkedinProfileUrl: normalizeLinkedinUrl(contact.linkedinProfileUrl),
      manualEmail: normalizeEmail(contact.manualEmail),
      manualMobile: normalizeLookupValue(contact.manualMobile),
      manualDirectDial: normalizeLookupValue(contact.manualDirectDial),
      notes: normalizeLookupValue(contact.notes),
      dataSource: contact.dataSource || "manual",
      sourceNote: contact.sourceNote || "Saved from Contacts",
    };
  }

  function toggleSelectedContact(contactId) {
    setSelectedContactIds(current => current.includes(contactId)
      ? current.filter(id => id !== contactId)
      : [...current, contactId]);
  }

  function openContactListSave() {
    setContactListName("");
    setContactListAssignedUserIds(current => current.length ? current : currentUserId ? [currentUserId] : []);
    setContactListCampaignIds([]);
    setContactListStatus("idle");
    setContactListError("");
    setSaveListOpen(true);
  }

  async function saveSelectedContactsAsList() {
    if (!contactListName.trim()) {
      setContactListError("Name this lead list before saving.");
      return;
    }
    if (!selectedContacts.length) {
      setContactListError("Select at least one contact before saving.");
      return;
    }
    if (!contactListEffectiveAssignedUserIds.length) {
      setContactListError("Assign the lead list to at least one user.");
      return;
    }

    setContactListStatus("saving");
    setContactListError("");
    try {
      await onSaveLeadList?.({
        name: contactListName.trim(),
        assignedUserIds: contactListEffectiveAssignedUserIds,
        leads: selectedContacts.map(contactToLead),
        filters: {
          source: "contacts",
          query: leadLookupQuery,
          company: leadLookupCompany,
          industry: leadLookupIndustry,
          jobTitle: leadLookupTitle,
          campaignIds: contactListCampaignIds,
          campaignNames: selectedCampaigns.map(campaign => campaign.name),
        },
      });
      setContactListStatus("saved");
      setSaveListOpen(false);
      setSelectedContactIds([]);
    } catch (saveError) {
      setContactListStatus("error");
      setContactListError(saveError.message || "Could not save lead list.");
    }
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
      sourceNote: draft.sourceNote || "Edited in Contacts",
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

  async function copyLookupValue(key, value) {
    const copyValue = normalizeLookupValue(value);
    if (!copyValue) return;
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopiedLookupCell(key);
      window.setTimeout(() => setCopiedLookupCell(current => current === key ? "" : current), 1600);
    } catch {
      setCopiedLookupCell("");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Contact database"
        title="Contacts"
        description="Search, filter, copy, and open saved contacts from a spreadsheet-style CRM contact list."
      >
        <button className="primary-button" type="button" onClick={openContactListSave} disabled={!selectedContacts.length}>
          <ListFilter size={16} />
          Save lead list
        </button>
        <button className="secondary-button" type="button" onClick={() => setEditMode(current => !current)}>
          <Database size={16} />
          {editMode ? "Done editing" : "Edit mode"}
        </button>
      </PageHeader>
      <div className="lead-database-strip" aria-label="Saved contact health">
        <div>
          <Users size={16} aria-hidden="true" />
          <span>Saved data</span>
          <strong>{contactDatabase.length} contacts</strong>
        </div>
        <div className="active">
          <Mail size={16} aria-hidden="true" />
          <span>Email coverage</span>
          <strong>{savedEmailCount} saved</strong>
        </div>
        <div>
          <Phone size={16} aria-hidden="true" />
          <span>Mobile coverage</span>
          <strong>{savedMobileCount} saved</strong>
        </div>
        <div>
          <Phone size={16} aria-hidden="true" />
          <span>Direct dial</span>
          <strong>{savedDirectDialCount} saved</strong>
        </div>
      </div>
      <section className="panel lead-lookup-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Saved data</span>
            <h2>Find contacts</h2>
          </div>
          <div className="cognism-meta">
            <StatusBadge>{contactDatabase.length} saved</StatusBadge>
            <StatusBadge>{filteredLeadLookupResults.length} matching</StatusBadge>
            <StatusBadge>{leadLookupResults.length} shown</StatusBadge>
            <StatusBadge>{selectedContacts.length} selected</StatusBadge>
          </div>
        </div>
        <div className="lead-lookup-controls">
          <datalist id="contact-company-options">
            {leadLookupCompanyOptions.map(company => <option key={company} value={company} />)}
          </datalist>
          <datalist id="contact-industry-options">
            {leadLookupIndustryOptions.map(industry => <option key={industry} value={industry} />)}
          </datalist>
          <datalist id="contact-position-options">
            {leadLookupTitleOptions.map(title => <option key={title} value={title} />)}
          </datalist>
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
            <input
              list="contact-company-options"
              value={leadLookupCompany}
              onChange={event => {
              setLeadLookupCompany(event.target.value);
              setLeadLookupPage(1);
            }}
              placeholder="Type or choose company"
            />
          </label>
          <label className="save-list-inline">
            <span>Industry</span>
            <input
              list="contact-industry-options"
              value={leadLookupIndustry}
              onChange={event => {
              setLeadLookupIndustry(event.target.value);
              setLeadLookupPage(1);
            }}
              placeholder="Type or choose industry"
            />
          </label>
          <label className="save-list-inline">
            <span>Position</span>
            <input
              list="contact-position-options"
              value={leadLookupTitle}
              onChange={event => {
              setLeadLookupTitle(event.target.value);
              setLeadLookupPage(1);
            }}
              placeholder="Type or choose position"
            />
          </label>
          <button className="secondary-button" type="button" onClick={() => {
            setLeadLookupQuery("");
            setLeadLookupCompany("");
            setLeadLookupIndustry("");
            setLeadLookupTitle("");
            setLeadLookupPage(1);
          }} disabled={!leadLookupQuery && !leadLookupCompany && !leadLookupIndustry && !leadLookupTitle}>
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
            <button className="secondary-button" type="button" onClick={() => setSelectedContactIds(current => [...new Set([...current, ...leadLookupResults.map(contact => contact.id)])])} disabled={!leadLookupResults.length || leadLookupResults.every(contact => validSelectedContactIds.includes(contact.id))}>
              <CheckCircle2 size={16} />
              Select shown
            </button>
            <button className="secondary-button" type="button" onClick={() => setSelectedContactIds([])} disabled={!validSelectedContactIds.length}>
              <Circle size={16} />
              Deselect
            </button>
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
                <th>Select</th>
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
                const manualMobile = getDisplayPhoneNumber(contact.manualMobile);
                const manualDirectDial = getDisplayPhoneNumber(contact.manualDirectDial);
                const phoneNumber = manualMobile || manualDirectDial || "";
                const draft = getLookupDraft(contact);
                const crmContact = findCrmContactMatch(contact);
                return (
                  <tr key={contact.id}>
                    <td className="table-select-cell">
                      <input
                        type="checkbox"
                        checked={validSelectedContactIds.includes(contact.id)}
                        onChange={() => toggleSelectedContact(contact.id)}
                        aria-label={`Select ${contact.contactName || contact.company || "contact"}`}
                      />
                    </td>
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
                              <strong>{contact.contactName || [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Unknown contact"}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{editMode ? <input className="table-input" value={draft.company || ""} onChange={event => updateLookupDraft(contact, "company", event.target.value)} placeholder="Company" /> : contact.company || "Not available"}</td>
                    <td>{editMode ? <input className="table-input" value={draft.jobTitle || ""} onChange={event => updateLookupDraft(contact, "jobTitle", event.target.value)} placeholder="Position" /> : contact.jobTitle || "Not available"}</td>
                    <td className="lead-lookup-email">
                      {editMode ? <input className="table-input" value={draft.manualEmail || ""} onChange={event => updateLookupDraft(contact, "manualEmail", event.target.value)} placeholder="name@company.com" /> : (
                        <LeadLookupCopyCell
                          icon={Mail}
                          label="email"
                          value={contact.manualEmail}
                          copied={copiedLookupCell === `${contact.id}:email`}
                          onCopy={() => copyLookupValue(`${contact.id}:email`, contact.manualEmail)}
                        />
                      )}
                    </td>
                    <td className="lead-lookup-mobile">
                      {editMode ? <input className="table-input" value={draft.manualMobile || ""} onChange={event => updateLookupDraft(contact, "manualMobile", event.target.value)} placeholder="+353 mobile" /> : (
                        <LeadLookupCopyCell
                          icon={Phone}
                          label="mobile"
                          value={manualMobile}
                          copied={copiedLookupCell === `${contact.id}:mobile`}
                          onCopy={() => copyLookupValue(`${contact.id}:mobile`, manualMobile)}
                        />
                      )}
                    </td>
                    <td className="lead-lookup-mobile">
                      {editMode ? <input className="table-input" value={draft.manualDirectDial || ""} onChange={event => updateLookupDraft(contact, "manualDirectDial", event.target.value)} placeholder="+353 direct" /> : (
                        <LeadLookupCopyCell
                          icon={Phone}
                          label="direct dial"
                          value={manualDirectDial}
                          copied={copiedLookupCell === `${contact.id}:direct`}
                          onCopy={() => copyLookupValue(`${contact.id}:direct`, manualDirectDial)}
                        />
                      )}
                    </td>
                    <td>{editMode ? <input className="table-input" value={draft.location || ""} onChange={event => updateLookupDraft(contact, "location", event.target.value)} placeholder="Location" /> : contact.location || "Not available"}</td>
                    <td>{memberships.length ? memberships.map(item => item.name).join(", ") : "No active list"}</td>
                    <td>
                      <button className="secondary-button lead-contact-action-button" type="button" onClick={() => onAddToCrmContacts?.(contact)}>
                        {crmContact ? "Open contact" : "Add contact"}
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
                  <td colSpan={editMode ? 12 : 11} className="empty-table-cell">
                    {contactDatabase.length ? "No saved contacts match those filters." : "Saved contacts will appear here."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {saveListOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setSaveListOpen(false);
        }}>
          <section className="workflow-modal contact-list-save-modal" role="dialog" aria-modal="true">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Contacts</span>
                <h2>Save lead list</h2>
              </div>
              <button className="icon-action" type="button" onClick={() => setSaveListOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="contact-list-save-grid">
              <section className="contact-list-save-main">
                <label className="save-list-inline">
                  <span>Lead list name</span>
                  <input value={contactListName} onChange={event => setContactListName(event.target.value)} placeholder="Finance directors in construction" />
                </label>
                <div className="contact-list-save-summary">
                  <div>
                    <span>Selected contacts</span>
                    <strong>{selectedContacts.length}</strong>
                  </div>
                  <div>
                    <span>Visible filters</span>
                    <strong>{[leadLookupQuery, leadLookupCompany, leadLookupIndustry, leadLookupTitle].filter(Boolean).length || "None"}</strong>
                  </div>
                  <div>
                    <span>People who can see it</span>
                    <strong>{contactListEffectiveAssignedUserIds.length}</strong>
                  </div>
                </div>
                {isAdmin && campaigns.length ? (
                  <div className="contact-list-save-section">
                    <div className="panel-header compact-header">
                      <div>
                        <span className="eyebrow">Campaigns</span>
                        <h2>Add to campaign visibility</h2>
                      </div>
                      <StatusBadge>{contactListCampaignIds.length} selected</StatusBadge>
                    </div>
                    <div className="role-choice-grid compact-choice-grid">
                      {campaigns.map(campaign => (
                        <label key={campaign.id} className={`role-choice ${contactListCampaignIds.includes(campaign.id) ? "selected" : ""}`}>
                          <input
                            type="checkbox"
                            checked={contactListCampaignIds.includes(campaign.id)}
                            onChange={() => setContactListCampaignIds(current => current.includes(campaign.id) ? current.filter(id => id !== campaign.id) : [...current, campaign.id])}
                          />
                          <span>{campaign.name}<small>{campaign.memberIds?.length || 0} campaign member{campaign.memberIds?.length === 1 ? "" : "s"}</small></span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
              <section className="contact-list-save-section">
                <div className="panel-header compact-header">
                  <div>
                    <span className="eyebrow">Members</span>
                    <h2>Share with users</h2>
                  </div>
                  <StatusBadge>{contactListAssignedUserIds.length} selected</StatusBadge>
                </div>
                <div className="role-actions">
                  <button className="secondary-button" type="button" onClick={() => setContactListAssignedUserIds(workspaceUsers.map(user => user.id))} disabled={!workspaceUsers.length}>
                    <CheckCircle2 size={16} />
                    Select all
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setContactListAssignedUserIds([])} disabled={!contactListAssignedUserIds.length}>
                    <Circle size={16} />
                    Deselect
                  </button>
                </div>
                <div className="role-choice-grid compact-choice-grid">
                  {workspaceUsers.map(user => (
                    <label key={user.id} className={`role-choice ${contactListAssignedUserIds.includes(user.id) ? "selected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={contactListAssignedUserIds.includes(user.id)}
                        onChange={() => setContactListAssignedUserIds(current => current.includes(user.id) ? current.filter(id => id !== user.id) : [...current, user.id])}
                      />
                      <span>{user.name}<small>{user.email}</small></span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
            {contactListError ? <div className="form-error">{contactListError}</div> : null}
            <div className="modal-actions">
              <button className="secondary-button" type="button" onClick={() => setSaveListOpen(false)}>Cancel</button>
              <button className="primary-button" type="button" onClick={saveSelectedContactsAsList} disabled={contactListStatus === "saving"}>
                {contactListStatus === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <ListFilter size={16} />}
                {contactListStatus === "saving" ? "Saving" : "Save lead list"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
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

  function requestDeleteSelectedList() {
    if (!selectedList) return;
    confirmListAction({
      title: "Delete lead list",
      message: `Delete "${selectedList.name}"? This removes the saved list, but does not delete lead records from the database.`,
      confirmLabel: "Delete list",
      danger: true,
      onConfirm: deleteSelectedList,
    });
  }

  function requestRemoveLeadFromList(lead) {
    if (!selectedList) return;
    confirmListAction({
      title: "Remove lead",
      message: `Remove ${lead.contactName || lead.company || "this lead"} from "${selectedList.name}"? This does not delete the saved lead record.`,
      confirmLabel: "Remove lead",
      danger: true,
      onConfirm: () => removeLeadFromList(lead),
    });
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
                    <HubSpotLogoIcon size={16} />
                    {listHubspotExportStatus === "exporting" ? "Exporting" : listHubspotExportStatus === "exported" ? "Exported" : selectedLeads.length ? "Export selected to HubSpot" : "Export to HubSpot"}
                  </button>
                  <button className="secondary-button" type="button" onClick={() => setShareOpen(true)}>
                    <Users size={16} />
                    Share
                  </button>
                  <button className="secondary-button danger-button" type="button" onClick={requestDeleteSelectedList} disabled={deleteStatus === "deleting"}>
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
                            <button className="secondary-button danger-button" type="button" onClick={() => requestRemoveLeadFromList(lead)} disabled={leadEditStatuses[key] === "removing"}>
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
          danger={pendingConfirmation.danger}
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
  const savedDebugCache = loadLeadFinderDebugCache();
  const companyImportInputRef = useRef(null);
  const previewDebugByKeyRef = useRef(savedDebugCache.preview || {});
  const redeemDebugByKeyRef = useRef(savedDebugCache.redeem || {});
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
  const [previewDebugByKey, setPreviewDebugByKeyState] = useState(savedDebugCache.preview || {});
  const [redeemDebugByKey, setRedeemDebugByKeyState] = useState(savedDebugCache.redeem || {});
  const [leadDebugModal, setLeadDebugModal] = useState({ open: false, resultId: "", tab: "summary" });
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
  const debugLeadEntry = leadDebugModal.open
    ? results.map((result, index) => ({ result, index, resultId: leadResultId(result, index) })).find(({ resultId }) => resultId === leadDebugModal.resultId)
    : null;
  const debugPreviewRecord = debugLeadEntry ? findLeadDebugRecord(previewDebugByKey, debugLeadEntry.result) : null;
  const debugRedeemRecord = debugLeadEntry ? findLeadDebugRecord(redeemDebugByKey, debugLeadEntry.result) : null;
  const debugDifferences = buildLeadDebugDiff(debugPreviewRecord?.mappedLead || debugLeadEntry?.result || {}, debugRedeemRecord?.mappedLead || {});

  function updateLeadDebugCache(updater) {
    const nextCache = updater({
      preview: previewDebugByKeyRef.current,
      redeem: redeemDebugByKeyRef.current,
    });
    const nextPreview = pruneDebugRecordsByKey(nextCache.preview || {});
    const nextRedeem = pruneDebugRecordsByKey(nextCache.redeem || {});
    previewDebugByKeyRef.current = nextPreview;
    redeemDebugByKeyRef.current = nextRedeem;
    setPreviewDebugByKeyState(nextPreview);
    setRedeemDebugByKeyState(nextRedeem);
    saveLeadFinderDebugCache(nextPreview, nextRedeem);
  }

  function replacePreviewDebugRecords(recordsByKey) {
    updateLeadDebugCache(current => ({ ...current, preview: recordsByKey }));
  }

  function clearRedeemDebugRecords() {
    updateLeadDebugCache(current => ({ ...current, redeem: {} }));
  }

  function mergeRedeemDebugRecords(recordsByKey) {
    updateLeadDebugCache(current => ({ ...current, redeem: { ...current.redeem, ...recordsByKey } }));
  }

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

  function openLeadDebugModal(resultId, tab = "summary") {
    setLeadDebugModal({ open: true, resultId, tab });
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
    replacePreviewDebugRecords({});
    clearRedeemDebugRecords();
    setLeadDebugModal({ open: false, resultId: "", tab: "summary" });
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
      await assertApiServerAvailable();
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
      if (!response.ok) {
        const providerHint = payload.provider === "cognism" && payload.providerStatus
          ? ` Cognism returned ${payload.providerStatus}.`
          : "";
        throw new Error(`${payload.error || "Redeem request failed"}${providerHint}`);
      }

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
      mergeRedeemDebugRecords(redeemedRows.reduce((next, redeemedLead) => {
        const rawRecord = rawCognismRecords.find(record => leadDebugKeys({
          rowId: redeemedLead.rowId,
          cognismRedeemId: redeemedLead.cognismRedeemId,
          cognismContactId: redeemedLead.cognismContactId,
        }).some(key => [
          rawCognismRedeemId(record),
          record?.id,
          record?.contactId,
          record?.redeemId,
        ].map(normalizeLookupValue).includes(key)));
        return addLeadDebugRecord(next, redeemedLead, { mappedLead: redeemedLead, rawRecord, cachedAt: Date.now() });
      }, {}));
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
      if (nextSelectedIds.length) {
        setLeadDebugModal({ open: true, resultId: nextSelectedIds[0], tab: "diff" });
      }
      setRedeemStatus("done");
    } catch (redeemError) {
      setError(redeemError.message || "Redeem request failed");
      setRedeemStatus("error");
    }
  }

  async function redeemDebugLead(resultId) {
    const entry = results
      .map((result, index) => ({ result, index, resultId: leadResultId(result, index) }))
      .find(item => item.resultId === resultId);
    if (!entry) return;
    if (!canUseRedeemMode) {
      setError("Redeem access is not enabled for this workspace.");
      return;
    }
    if (!normalizeLookupValue(entry.result.cognismRedeemId)) {
      setError("Run a fresh preview before redeeming. This row does not include a Cognism redeem ID.");
      return;
    }

    setRedeemStatus("loading");
    setError("");

    try {
      await assertApiServerAvailable();
      const response = await fetch("/api/cognism/redeem", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({
          leads: [{
            ...entry.result,
            rowId: resultId,
            redeemId: entry.result.cognismRedeemId,
          }],
          debug: true,
        }),
      });
      const payload = await readJsonResponse(response);
      if (!response.ok) {
        const providerHint = payload.provider === "cognism" && payload.providerStatus
          ? ` Cognism returned ${payload.providerStatus}.`
          : "";
        throw new Error(`${payload.error || "Redeem request failed"}${providerHint}`);
      }

      const rawCognismRecords = payload.diagnostics?.rawRecords || [];
      const redeemedRows = correctRedeemedRowsFromRawRecords(Array.isArray(payload.redeemed) ? payload.redeemed : [], rawCognismRecords);
      const redeemedLead = redeemedRows[0];
      if (!redeemedLead) throw new Error("Redeem returned no contact data for this row.");

      const nextLead = hydrateLeadWithContactDatabase({ ...entry.result, ...redeemedLead, rowId: resultId }, contactDatabase);
      setResults(current => current.map((result, index) => leadResultId(result, index) === resultId ? nextLead : result));

      try {
        const savedContact = await onSaveLeadContact(nextLead, { allowPreviewOnly: true, skipConflictPrompt: true });
        setResults(current => hydrateLeadsWithContactDatabase(current, [savedContact]));
      } catch {
        // Keep redeemed values visible even if local persistence is unavailable.
      }

      mergeRedeemDebugRecords(redeemedRows.reduce((next, lead) => {
        const rawRecord = rawCognismRecords.find(record => leadDebugKeys(lead).some(key => [
          rawCognismRedeemId(record),
          record?.id,
          record?.contactId,
          record?.redeemId,
        ].map(normalizeLookupValue).includes(key)));
        return addLeadDebugRecord(next, lead, { mappedLead: lead, rawRecord, cachedAt: Date.now() });
      }, {}));
      setRedeemReviewActive(true);
      setMeta(current => ({
        ...current,
        mode: payload.mode || "redeem",
        estimatedCreditsUsed: (current.estimatedCreditsUsed || 0) + (payload.estimatedCreditsUsed ?? redeemedRows.length),
        warning: [current.warning, payload.warning].filter(Boolean).join(" "),
      }));
      setLeadDebugModal({ open: true, resultId, tab: "diff" });
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
    clearRedeemDebugRecords();
    setLeadDebugModal({ open: false, resultId: "", tab: "summary" });
    setRedeemReviewActive(false);
    setStatus("loading");
    setSelectedUserIds(defaultAssignedUserIds);
    setResultCompanyFilter("");
    setCompanyListSaveStatus("idle");

    try {
      const response = await fetch("/api/cognism/preview", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({ companies, targetTitles, maxPerCompany: requestedMax, requireMobileAvailable, requireDirectDialAvailable, countries: selectedCountries, debug: true }),
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
      const payloadResults = Array.isArray(payload.results) ? payload.results : [];
      const incomingResults = hydrateLeadsWithContactDatabase(payloadResults.map(stripLeadDebugPayload), contactDatabase);
      const mergedResults = mergeLeadResults(results, incomingResults);
      const diagnosticPreviewRecords = Array.isArray(payload.diagnostics?.rawPreviewRecords) ? payload.diagnostics.rawPreviewRecords : [];
      const embeddedPreviewRecords = payloadResults
        .filter(result => result?._debugRawPreviewRecord)
        .map(result => ({
          company: result._debugRequestedCompany || result.company,
          cognismContactId: result.cognismContactId,
          cognismRedeemId: result.cognismRedeemId,
          rawRecord: result._debugRawPreviewRecord,
        }));
      const rawPreviewRecords = diagnosticPreviewRecords.length ? diagnosticPreviewRecords : embeddedPreviewRecords;
      replacePreviewDebugRecords(rawPreviewRecords.reduce((current, record) => {
        const mappedLead = incomingResults.find(lead => leadDebugKeys(lead).some(key => key === normalizeLookupValue(record.cognismRedeemId) || key === normalizeLookupValue(record.cognismContactId))) || {};
        return addLeadDebugRecord(current, { ...mappedLead, cognismRedeemId: record.cognismRedeemId, cognismContactId: record.cognismContactId }, {
          mappedLead,
          rawRecord: record.rawRecord,
          requestedCompany: record.company,
          cachedAt: Date.now(),
        });
      }, {}));
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
      } catch {
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
        setError(`Another PaceOps DB contact already has the same LinkedIn URL, email, or mobile: ${conflictNames}. Edit the existing contact or change the duplicate value before saving.`);
        return false;
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
            <h2>Any client account or company list</h2>
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
            <HubSpotLogoIcon size={16} />
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
                      <button className="secondary-button" type="button" onClick={() => openLeadDebugModal(resultId)}>
                        <Eye size={16} />
                        Inspect
                      </button>
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
      {leadDebugModal.open && debugLeadEntry ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) setLeadDebugModal({ open: false, resultId: "", tab: "summary" });
        }}>
          <section className="workflow-modal lead-debug-modal" role="dialog" aria-modal="true" aria-labelledby="lead-debug-title">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Lead debug</span>
                <h2 id="lead-debug-title">{debugLeadEntry.result.contactName || "Preview row"}</h2>
              </div>
              <button className="icon-action" type="button" onClick={() => setLeadDebugModal({ open: false, resultId: "", tab: "summary" })} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="lead-debug-toolbar">
              <div className="segmented-control" role="tablist" aria-label="Lead debug view">
                {[
                  ["summary", "Cognism"],
                  ["diff", "Differences"],
                  ["app", "App data"],
                  ["raw", "Raw JSON"],
                ].map(([tab, label]) => (
                  <button
                    key={tab}
                    className={leadDebugModal.tab === tab ? "active" : ""}
                    type="button"
                    onClick={() => setLeadDebugModal(current => ({ ...current, tab }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {canUseRedeemMode ? (
                <button className="primary-button success-button" type="button" onClick={() => redeemDebugLead(leadDebugModal.resultId)} disabled={redeemStatus === "loading" || !normalizeLookupValue(debugLeadEntry.result.cognismRedeemId)}>
                  {redeemStatus === "loading" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : <LockKeyhole size={16} />}
                  {debugRedeemRecord ? "Redeem again" : "Redeem this lead"}
                </button>
              ) : null}
            </div>
            {leadDebugModal.tab === "summary" ? (
              <div className="lead-debug-grid">
                <div className="lead-debug-panel">
                  <h3>Cognism preview raw payload</h3>
                  {debugPreviewRecord?.rawRecord ? (
                    <pre className="lead-debug-json">{JSON.stringify(debugPreviewRecord.rawRecord, null, 2)}</pre>
                  ) : (
                    <EmptyState icon={Search} title="Raw preview unavailable" text="Run a fresh preview, then inspect this row to see the original Cognism preview payload." />
                  )}
                </div>
                <div className="lead-debug-panel">
                  <h3>Cognism redeem raw payload</h3>
                  {debugRedeemRecord ? (
                    <pre className="lead-debug-json">{JSON.stringify(debugRedeemRecord.rawRecord || debugRedeemRecord.mappedLead || null, null, 2)}</pre>
                  ) : (
                    <EmptyState icon={LockKeyhole} title="Not redeemed in this session" text="Redeem this lead to see the original Cognism redeem payload." />
                  )}
                </div>
              </div>
            ) : null}
            {leadDebugModal.tab === "diff" ? (
              <div className="lead-debug-panel">
                <h3>Key differences</h3>
                {debugRedeemRecord ? (
                  debugDifferences.length ? (
                    <table className="data-table lead-debug-diff-table">
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Preview</th>
                          <th>Redeem</th>
                        </tr>
                      </thead>
                      <tbody>
                        {debugDifferences.map(item => (
                          <tr key={item.key}>
                            <td>{item.label}</td>
                            <td>{formatDebugValue(item.previewValue)}</td>
                            <td>{formatDebugValue(item.redeemedValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <EmptyState icon={CheckCircle2} title="No mapped differences" text="The tracked preview and redeem fields currently match." />
                ) : (
                  <EmptyState icon={LockKeyhole} title="Redeem data needed" text="Redeem this lead to see field-level differences." />
                )}
              </div>
            ) : null}
            {leadDebugModal.tab === "app" ? (
              <div className="lead-debug-grid">
                <div className="lead-debug-panel">
                  <h3>Mapped lead fields</h3>
                  <dl>
                    {leadDebugFields.map(([key, label]) => (
                      <div key={key}>
                        <dt>{label}</dt>
                        <dd>{formatDebugValue((debugPreviewRecord?.mappedLead || debugLeadEntry.result)?.[key])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="lead-debug-panel">
                  <h3>PaceOps and HubSpot fields</h3>
                  <dl>
                    {appDebugFields.map(([key, label]) => (
                      <div key={key}>
                        <dt>{label}</dt>
                        <dd>{formatDebugValue(debugLeadEntry.result?.[key])}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            ) : null}
            {leadDebugModal.tab === "raw" ? (
              <div className="lead-debug-grid">
                <div className="lead-debug-panel">
                  <h3>Raw preview record</h3>
                  <pre className="lead-debug-json">{JSON.stringify(debugPreviewRecord?.rawRecord || null, null, 2)}</pre>
                </div>
                <div className="lead-debug-panel">
                  <h3>Raw redeem record</h3>
                  <pre className="lead-debug-json">{JSON.stringify(debugRedeemRecord?.rawRecord || null, null, 2)}</pre>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
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

  const credentialFormByName = new Map(integrationCredentialForms.flatMap(form => [[form.integrationName, form], [form.integrationKey || form.integrationName, form]]));
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
        description="Active and planned external services for contact search, calling, company intelligence, and imports."
      />
      <div className="integration-grid">
        {integrations.map(integration => {
          const Icon = integration.icon;
          const isAvailable = Boolean(integration.view || integration.workflow);
          const credentialForm = credentialFormByName.get(integration.key || integration.name);
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
    integrationKey: "Cognism",
    integrationName: "Cognism",
    title: "Cognism",
    description: "Used by Lead Finder preview search.",
    fields: [{ name: "apiKey", label: "Cognism API key", placeholder: "Bearer token" }],
  },
  {
    provider: "aircall",
    integrationName: "Aircall",
    title: "Aircall",
    description: "Shared API credentials for click-to-call. Each user sets their own Aircall user ID in Settings.",
    fields: [
      { name: "apiId", label: "API ID", placeholder: "Aircall API ID" },
      { name: "apiToken", label: "API token", placeholder: "Aircall API token" },
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
  const metadata = user?.user_metadata || {};
  const profile = user?.crm_profile || {};
  const [profileValues, setProfileValues] = useState({
    firstName: profile.firstName || metadata.first_name || "",
    lastName: profile.lastName || metadata.last_name || "",
    displayName: profile.displayName || metadata.display_name || "",
    aircallUserId: profile.aircallUserId || metadata.aircallUserId || "",
  });
  const [profileStatus, setProfileStatus] = useState("idle");
  const [profileError, setProfileError] = useState("");
  const [adminSettingsStatus, setAdminSettingsStatus] = useState("idle");
  const [adminSettingsError, setAdminSettingsError] = useState("");
  const [adminSettingsLastKey, setAdminSettingsLastKey] = useState("");
  const [roleUpdateStatus, setRoleUpdateStatus] = useState({ userId: "", state: "idle" });
  const [roleUpdateError, setRoleUpdateError] = useState("");
  const [roleOverrides, setRoleOverrides] = useState({});
  const [adminAccessFilter, setAdminAccessFilter] = useState("all");
  const [cognismRedeemCode, setCognismRedeemCode] = useState("");
  const [cognismRedeemError, setCognismRedeemError] = useState("");
  const [cognismRedeemModalOpen, setCognismRedeemModalOpen] = useState(false);
  const adminSettings = normalizeAdminSettings(adminSettingsState?.settings);
  const testAccountActive = adminSettings.test_account_enabled;
  const visibleTeamMembers = workspaceUsers?.length
    ? workspaceUsersForTestMode(workspaceUsers, adminSettings)
    : workspaceUsersForTestMode(teamMembers, adminSettings);
  const currentRole = testAccountActive ? TEST_WORKSPACE_USER.roleKey : adminSettingsState?.role || "member";
  const currentUserIsAdmin = !testAccountActive && Boolean(adminSettingsState?.isAdmin);
  const currentUserIsOrgAdmin = !testAccountActive && Boolean(adminSettingsState?.isOrgAdmin);
  const teamMembersWithEffectiveRoles = visibleTeamMembers.map(member => {
    const roleKey = roleOverrides[member.id] || member.roleKey || String(member.role || "member").toLowerCase().replaceAll(" ", "_");
    return {
      ...member,
      role: formatRole(roleKey),
      roleKey,
    };
  });
  const sortedVisibleTeamMembers = [...teamMembersWithEffectiveRoles].sort((first, second) => {
    const firstRole = first.roleKey || String(first.role || "member").toLowerCase().replaceAll(" ", "_");
    const secondRole = second.roleKey || String(second.role || "member").toLowerCase().replaceAll(" ", "_");
    const roleRank = role => ORG_ADMIN_ROLES.has(role) ? 0 : role === "admin" ? 1 : 2;
    const firstRank = roleRank(firstRole);
    const secondRank = roleRank(secondRole);
    if (firstRank !== secondRank) return firstRank - secondRank;
    return String(first.name || first.email || "").localeCompare(String(second.name || second.email || ""), undefined, { sensitivity: "base" });
  });
  const adminAccessMembers = sortedVisibleTeamMembers.map(member => {
    const roleKey = member.roleKey || String(member.role || "member").toLowerCase().replaceAll(" ", "_");
    const isProtectedRole = ["platform_admin", "org_owner"].includes(roleKey);
    const isSelf = member.id === user?.id;
    const isTestAccount = member.isTestAccount === true;
    const isOrgAdmin = ORG_ADMIN_ROLES.has(roleKey);
    const isMemberAdmin = roleKey === "admin";
    const canChangeRole = currentUserIsOrgAdmin
      ? Boolean(member.id && !isProtectedRole && !isSelf && !isTestAccount)
      : Boolean(currentUserIsAdmin && member.id && !isProtectedRole && !isSelf && !isOrgAdmin && !isTestAccount);
    const canSelectOrgAdmin = currentUserIsOrgAdmin;
    const busy = roleUpdateStatus.userId === member.id && roleUpdateStatus.state === "saving";
    return {
      member,
      roleKey,
      isProtectedRole,
      isSelf,
      isTestAccount,
      isOrgAdmin,
      isMemberAdmin,
      canChangeRole,
      canSelectOrgAdmin,
      busy,
      actionLabel: isTestAccount ? "Test member" : isProtectedRole ? "Protected" : isSelf ? "Your access" : "Update access",
    };
  });
  const orgAdminAccessCount = adminAccessMembers.filter(({ isOrgAdmin }) => isOrgAdmin).length;
  const adminAccessCount = adminAccessMembers.filter(({ isMemberAdmin }) => isMemberAdmin).length;
  const standardMemberCount = adminAccessMembers.length - orgAdminAccessCount - adminAccessCount;
  const filteredAdminAccessMembers = adminAccessMembers.filter(({ isOrgAdmin, isMemberAdmin }) => {
    if (adminAccessFilter === "org_admin") return isOrgAdmin;
    if (adminAccessFilter === "admin") return isMemberAdmin;
    if (adminAccessFilter === "member") return !isOrgAdmin && !isMemberAdmin;
    return true;
  });

  async function submitProfile(event) {
    event.preventDefault();
    setProfileStatus("saving");
    setProfileError("");
    try {
      await onUpdateProfile({
        firstName: profileValues.firstName.trim(),
        lastName: profileValues.lastName.trim(),
        displayName: profileValues.displayName.trim(),
        aircallUserId: profileValues.aircallUserId.trim(),
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
    setAdminSettingsLastKey(key);
    try {
      await onUpdateAdminSettings?.({ [key]: value });
      setAdminSettingsStatus("saved");
    } catch (error) {
      setAdminSettingsStatus("idle");
      setAdminSettingsError(error?.message || "Could not update admin settings.");
    }
  }

  async function updateMemberAdminRole(member, role) {
    const previousRole = member.roleKey || String(member.role || "member").toLowerCase().replaceAll(" ", "_");
    setRoleUpdateStatus({ userId: member.id, state: "saving" });
    setRoleUpdateError("");
    try {
      await onUpdateWorkspaceUserRole?.(member.id, role);
      setRoleOverrides(current => ({
        ...current,
        [member.id]: role,
      }));
      setRoleUpdateStatus({ userId: member.id, state: "saved" });
    } catch (error) {
      setRoleOverrides(current => ({
        ...current,
        [member.id]: previousRole,
      }));
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
        {currentUserIsAdmin ? <button className="primary-button" type="button" onClick={onInviteTeamMember}>
          <Plus size={16} />
          Invite teammate
        </button> : null}
      </PageHeader>
      <div className="content-grid two">
        <section className="panel">
          <div className="panel-header"><h2>Client account profile</h2></div>
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
            <FormField label="Display name">
              <input
                value={profileValues.displayName}
                onChange={event => {
                  setProfileStatus("idle");
                  setProfileValues(current => ({ ...current, displayName: event.target.value }));
                }}
                placeholder="Display name"
              />
            </FormField>
            <FormField label="Aircall user ID">
              <input
                value={profileValues.aircallUserId}
                onChange={event => {
                  setProfileStatus("idle");
                  setProfileValues(current => ({ ...current, aircallUserId: event.target.value }));
                }}
                placeholder="Numeric Aircall user ID"
                inputMode="numeric"
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
          {testAccountActive ? (
            <div className="settings-list admin-settings-list team-test-settings">
              <div className="admin-setting-toggle admin-action-control">
                <span className="admin-setting-icon"><UserRound size={18} /></span>
                <div>
                  <strong>James Bond test member is active</strong>
                  <small>Viewing the workspace as a standard member test account.</small>
                </div>
                <div className="admin-control-meta">
                  <StatusBadge>Member view</StatusBadge>
                  <button className="secondary-button" type="button" onClick={() => toggleAdminSetting("test_account_enabled", false)} disabled={adminSettingsStatus === "saving"}>
                    Return to admin
                  </button>
                </div>
              </div>
            </div>
          ) : currentUserIsOrgAdmin ? (
            <div className="settings-list admin-settings-list team-test-settings">
              <AdminSettingToggle
                icon={UserRound}
                title="Test mode"
                description="View the workspace as James Bond, a member test user with Aircall ID 7007007."
                checked={adminSettings.test_account_enabled}
                disabled={adminSettingsStatus === "saving"}
                status="Off"
                onChange={checked => toggleAdminSetting("test_account_enabled", checked)}
              />
            </div>
          ) : null}
          {adminSettingsLastKey === "test_account_enabled" && adminSettingsStatus === "saved" ? <div className="form-success">Team settings saved.</div> : null}
          {adminSettingsLastKey === "test_account_enabled" && adminSettingsError ? <div className="form-error">{adminSettingsError}</div> : null}
          {visibleTeamMembers.length ? <div className="team-list">
            {sortedVisibleTeamMembers.map(member => (
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
          </div> : <EmptyState icon={Users} title="No teammates yet" text="Invite a teammate to start assigning companies, calls, and research." />}
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
          {testAccountActive ? (
            <p className="modal-helper-text">Admin controls are hidden while test mode is active.</p>
          ) : currentUserIsOrgAdmin ? (
            <div className="settings-list admin-settings-list">
              <AdminSettingToggle
                icon={CognismLogoIcon}
                title="Cognism preview"
                description="Preview lead data without consuming redeem credits."
                checked={adminSettings.cognism_preview_enabled}
                disabled={adminSettingsStatus === "saving"}
                status={adminSettings.cognism_preview_enabled ? "Enabled" : "Off"}
                onChange={checked => toggleAdminSetting("cognism_preview_enabled", checked)}
              />
              <AdminSettingToggle
                icon={Trash2}
                title="Contact deletion"
                description="Permit admins to archive or delete CRM contacts."
                checked={adminSettings.contact_deletion_enabled}
                disabled={adminSettingsStatus === "saving"}
                status={adminSettings.contact_deletion_enabled ? "Enabled" : "Off"}
                onChange={checked => toggleAdminSetting("contact_deletion_enabled", checked)}
              />
              <div className="admin-setting-toggle admin-action-control">
                <span className="admin-setting-icon"><CognismLogoIcon size={18} /></span>
                <div>
                  <strong>Cognism redeem</strong>
                  <small>Allow admins to reveal full Cognism contact data.</small>
                </div>
                <div className="admin-control-meta">
                  <StatusBadge tone={cognismRedeemEnabled ? "warning" : "success"}>{cognismRedeemEnabled ? "Enabled" : "Preview only"}</StatusBadge>
                  <button className="secondary-button" type="button" onClick={() => cognismRedeemEnabled ? onUpdateIntegration?.("Cognism", { redeemEnabled: false }) : setCognismRedeemModalOpen(true)}>
                    {cognismRedeemEnabled ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
              <div className="admin-settings-feedback">
                {adminSettingsLastKey !== "test_account_enabled" && adminSettingsStatus === "saved" ? <div className="form-success">Admin controls saved.</div> : null}
                {adminSettingsLastKey !== "test_account_enabled" && adminSettingsError ? <div className="form-error">{adminSettingsError}</div> : null}
              </div>
            </div>
          ) : (
            <p className="modal-helper-text">Admin controls are available to org admins only.</p>
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
              <span>org admins</span>
              <strong>{orgAdminAccessCount}</strong>
            </div>
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
          <p className="admin-panel-intro">Manage who can use admin controls. Client account membership and campaign assignment stay separate, so adding someone to a client account does not automatically put them in every campaign.</p>
          <div className="admin-access-tabs" role="tablist" aria-label="Filter member permissions">
            {[
              ["all", "All"],
              ["org_admin", "org admins"],
              ["admin", "Admins"],
              ["member", "Members"],
            ].map(([filterKey, label]) => (
              <button
                key={filterKey}
                className={adminAccessFilter === filterKey ? "active" : ""}
                type="button"
                role="tab"
                aria-selected={adminAccessFilter === filterKey}
                onClick={() => setAdminAccessFilter(filterKey)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="admin-access-grid" aria-label="Workspace admin access">
            {filteredAdminAccessMembers.map(({ member, roleKey, isProtectedRole, isSelf, isOrgAdmin, isMemberAdmin, canChangeRole, canSelectOrgAdmin, busy, actionLabel }) => {
              return (
                <article key={member.id || member.email || member.name} className={`admin-access-card ${isOrgAdmin || isMemberAdmin ? "admin" : ""}`}>
                  <div className="admin-access-person">
                    <span>{member.initials || accountInitial(member.name || member.email || "Member")}</span>
                    <div>
                      <strong>{member.name}</strong>
                      <small>{member.email || "No email"}</small>
                    </div>
                  </div>
                  <div className="admin-access-card-meta">
                    <StatusBadge tone={isOrgAdmin || isMemberAdmin || isProtectedRole ? "warning" : "neutral"}>{formatRole(roleKey)}</StatusBadge>
                    {isSelf ? <StatusBadge tone="success">You</StatusBadge> : null}
                  </div>
                  <div className="admin-access-card-actions">
                    <small>{isOrgAdmin ? "Can manage admin settings and member access." : isMemberAdmin ? "Can use redeem mode and delete contacts when enabled." : "Can edit workspace data, but cannot redeem or delete contacts."}</small>
                    {currentUserIsAdmin ? (
                      <label className="admin-access-select">
                        <span>{busy ? "Saving access" : actionLabel}</span>
                        <select
                          value={roleKey}
                          onChange={event => updateMemberAdminRole(member, event.target.value)}
                          disabled={!canChangeRole || busy}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                          {canSelectOrgAdmin || roleKey === "org_admin" ? <option value="org_admin">org admin</option> : null}
                        </select>
                      </label>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="admin-member-feedback">
            {roleUpdateStatus.state === "saved" ? <div className="form-success">Member admin access updated.</div> : null}
            {roleUpdateError ? <div className="form-error">{roleUpdateError}</div> : null}
          </div>
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

function AdminSettingToggle({ icon: Icon, title, description, checked, disabled, status, onChange }) {
  return (
    <label className="admin-setting-toggle">
      {Icon ? <span className="admin-setting-icon"><Icon size={18} /></span> : null}
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <div className="admin-control-meta">
        <StatusBadge tone={checked ? "success" : "neutral"}>{status || (checked ? "Enabled" : "Off")}</StatusBadge>
        <input type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
      </div>
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
          text="CSV import and file summariser workflows will attach source files to client accounts, companies, and campaigns."
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

function RecordName({ name, meta, imageUrl = "" }) {
  return (
    <div className="record-name">
      {imageUrl
        ? <img className="record-avatar record-avatar-image" src={imageUrl} alt="" />
        : <span className="record-avatar">{accountInitial(name)}</span>}
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

function ScopeSelectionPrompt({ requireClient = true, requireCampaign = true }) {
  const title = requireClient && requireCampaign
    ? "Choose a client account and campaign"
    : requireClient
      ? "Choose a client account"
      : "Choose a campaign";
  const text = requireClient && requireCampaign
    ? "Select a client account and campaign from the top bar to show workspace data."
    : requireClient
      ? "Select a client account from the top bar to show workspace data."
      : "Select a campaign from the top bar to show workspace data.";

  return (
    <section className="panel empty-board-panel">
      <EmptyState icon={Target} title={title} text={text} />
    </section>
  );
}

function ConfirmationModal({ title, eyebrow = "Confirm", message, filenameLabel = "", defaultFilename = "", confirmLabel = "Confirm", danger = false, onConfirm, onCancel }) {
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
          <button className={danger ? "secondary-button danger-button" : "primary-button"} type="button" onClick={() => onConfirm?.(filenameDraft)}>{confirmLabel}</button>
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
  const derivedProfile = deriveUserProfileFromEmail(user.email);
  const { data, error } = await supabase.rpc("bootstrap_current_user", {
    user_email: user.email,
    user_display_name: user.user_metadata?.display_name || derivedProfile.displayName,
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
      setError(`Use your @${ALLOWED_EMAIL_DOMAIN} email address to access ProspectIQ.`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (!supabase) throw new Error("Authentication is not configured yet.");
      const derivedProfile = deriveUserProfileFromEmail(normalizedEmail);
      const credentials = { email: normalizedEmail, password };
      const { data, error: authError } = mode === "signin"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp({
          ...credentials,
          options: {
            data: {
              first_name: derivedProfile.firstName,
              last_name: derivedProfile.lastName,
              display_name: derivedProfile.displayName,
            },
          },
        });
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
              <strong>ProspectIQ</strong>
              <span>CRM lead workspace</span>
            </div>
          </div>

          <div className="auth-copy">
            <span className="eyebrow">Workspace access</span>
            <h1>{mode === "signin" ? "Open your workspace" : "Create a workspace"}</h1>
            <p>Manage client accounts, campaigns, contacts, calls, and research from one CRM lead operating system.</p>
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
          <span>ProspectIQ</span>
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
            <span className="eyebrow">ProspectIQ</span>
            <h1>CRM lead intelligence for prospecting teams.</h1>
            <p>ProspectIQ is a lead website and CRM workspace for account research, contact management, calling, sentiment tracking, and outbound pipeline operations.</p>
            <p>Use ProspectIQ to manage client accounts, campaigns, companies, contacts, Aircall activity, research, and pipeline from one focused workspace.</p>

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
                    <strong>ProspectIQ</strong>
                    <span>{user.email}</span>
                  </div>
                </div>
                <div className="auth-copy">
                  <span className="eyebrow">Signed in</span>
                  <h1>Return to your workspace</h1>
                  <p>Open the CRM dashboard to continue managing client accounts, campaigns, calls, and research.</p>
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
          <span>{selectedAccount?.nextAction || "Review campaign companies before the next call block"}</span>
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

const campaignStatusOptions = [
  {
    value: "active",
    label: "Active",
    detail: "Visible and ready for live outreach.",
    icon: CheckCircle2,
  },
  {
    value: "paused",
    label: "Paused",
    detail: "Temporarily stop work without archiving.",
    icon: Clock,
  },
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
      return { name: "", workspace: "Prospecting workspace", owner: "Workspace user", industry: "", website: "", imageUrl: "", imagePath: "", imageName: "" };
    case "campaign":
      return { clientId, name: "", channel: "Research-led outbound", status: "active", nextAction: "Define company focus and first call block", memberIds: [], imageUrl: "", imagePath: "", imageName: "" };
    case "campaign-company":
      return { clientId, campaignId: context.campaignId || "", mode: "existing", search: "", selectedCompanyIds: [], name: "", domain: "", industry: "", location: "", employees: "", value: "0", stage: data.pipelineStages?.[0]?.name || "Lead In", status: "New", nextAction: "Map buying committee", insight: "" };
    case "account":
      return { clientId, name: "", domain: "", industry: "", location: "", employees: "", value: "0", stage: data.pipelineStages?.[0]?.name || "Lead In", status: "New", nextAction: "Map buying committee", insight: "" };
    case "contact":
      return { accountId, accountName: data.accounts.find(account => account.id === accountId)?.name || "", name: "", role: "", email: "", mobile: "", directDial: "", status: "New" };
    case "deal":
      return { accountId, contactId, stage: "lead", value: "0", due: "Today", owner: "Workspace user" };
    case "call":
      return { contactId, outcome: "Connected", notes: "" };
    case "research":
      return { accountId, title: "Company research brief", summary: "", dataGap: "Buying committee validation" };
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
    "campaign-company": "Add company",
  account: "Add company",
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
  if (["campaign", "account", "campaign-company"].includes(type) && !data.clients.length) {
    return { message: "Create a client account first. Campaigns and companies belong inside a client account.", nextType: "client", nextLabel: "Create client account" };
  }
  if (type === "campaign-company" && !data.campaigns.length) {
    return { message: "Create a campaign first. Companies are added from inside a campaign.", nextType: "campaign", nextLabel: "Create campaign" };
  }
  if (["contact", "deal", "research"].includes(type) && !data.accounts.length) {
    return { message: "Add a company first. Contacts, deals, and research need a company to attach to.", nextType: data.clients.length ? "account" : "client", nextLabel: data.clients.length ? "Add company" : "Create client account" };
  }
  if (type === "call" && !data.contacts.length) {
    return { message: "Add a contact first. Calls need a contact record.", nextType: data.accounts.length ? "contact" : data.clients.length ? "account" : "client", nextLabel: data.accounts.length ? "Add contact" : data.clients.length ? "Add company" : "Create client account" };
  }
  return null;
}

function WorkflowModal({
  workflow,
  activeClientId,
  selectedAccountId,
  selectedContactId,
  organizationId,
  onClose,
  onSubmit,
  onRemoveClient,
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
  const [imageUploadStatus, setImageUploadStatus] = useState("idle");
  const [imageUploadError, setImageUploadError] = useState("");
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitError, setSubmitError] = useState("");
  const [pendingClientRemoval, setPendingClientRemoval] = useState(null);
  const draftImageRecordIdRef = useRef(makeId("image-record"));
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
      if (!response.ok) throw new Error(suggestions.error || "Company lookup failed");
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

  async function submit(event) {
    event.preventDefault();
    if (prerequisite) return;
    setSubmitStatus("saving");
    setSubmitError("");
    try {
      await onSubmit(workflow.type, values, workflow.context || {});
      setSubmitStatus("idle");
    } catch (error) {
      setSubmitStatus("idle");
      setSubmitError(error?.message || "Could not save this record.");
    }
  }

  async function handleBrandImageChange(entityType, file) {
    if (!file) return;
    setImageUploadStatus("uploading");
    setImageUploadError("");
    try {
      const uploadedImage = await uploadBrandImage({
        file,
        organizationId,
        entityType,
        recordId: values.id || draftImageRecordIdRef.current,
      });
      setValues(current => ({ ...current, ...uploadedImage }));
      setImageUploadStatus("uploaded");
    } catch (error) {
      setImageUploadStatus("failed");
      setImageUploadError(error.message || "Could not upload image.");
    }
  }

  function renderBrandImageField(entityType) {
    const label = entityType === "campaign" ? "Campaign image (optional)" : "Client logo";
    return (
      <div className="form-field brand-image-field">
        <span>{label}</span>
        <div className="brand-image-uploader">
          <div className="brand-image-preview">
            {values.imageUrl ? <img src={values.imageUrl} alt="" /> : <Upload size={20} />}
          </div>
          <div>
            <label className="secondary-button brand-image-upload-button">
              <Upload size={16} />
              {imageUploadStatus === "uploading" ? "Uploading" : values.imageUrl ? "Replace image" : "Upload image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                onChange={event => handleBrandImageChange(entityType, event.target.files?.[0])}
              />
            </label>
            <small>{values.imageName || "PNG, JPG, WebP, GIF, or SVG up to 5 MB"}</small>
            {imageUploadError ? <small className="form-error-text">{imageUploadError}</small> : null}
          </div>
        </div>
      </div>
    );
  }

  function accountOptions() {
    return data.accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>);
  }

  function contactOptions() {
    const filtered = values.accountId ? data.contacts.filter(contact => contact.accountId === values.accountId) : data.contacts;
    const options = filtered.length ? filtered : data.contacts;
    return options.map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>);
  }

  function toggleCampaignUser(userId) {
    const selectedIds = new Set(Array.isArray(values.memberIds) ? values.memberIds : []);
    if (selectedIds.has(userId)) {
      selectedIds.delete(userId);
    } else {
      selectedIds.add(userId);
    }
    update("memberIds", Array.from(selectedIds));
  }

  function toggleCampaignCompany(companyId) {
    const selectedIds = new Set(Array.isArray(values.selectedCompanyIds) ? values.selectedCompanyIds : []);
    if (selectedIds.has(companyId)) {
      selectedIds.delete(companyId);
    } else {
      selectedIds.add(companyId);
    }
    update("selectedCompanyIds", Array.from(selectedIds));
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
            {renderBrandImageField("client")}
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
            {renderBrandImageField("campaign")}
            <FormField label="Channel">
              <input value={values.channel} onChange={event => update("channel", event.target.value)} placeholder="Email and calls" />
            </FormField>
            <div className="form-field campaign-status-field">
              <span>Campaign status</span>
              <div className="campaign-status-options" role="radiogroup" aria-label="Campaign status">
                {campaignStatusOptions.map(option => {
                  const Icon = option.icon;
                  const checked = normalizeCampaignStatus(values.status) === option.value;
                  return (
                    <label key={option.value} className={`campaign-status-option ${checked ? "selected" : ""}`}>
                      <input
                        type="radio"
                        name="campaign-status"
                        value={option.value}
                        checked={checked}
                        onChange={() => update("status", option.value)}
                      />
                      <span className="campaign-status-icon"><Icon size={16} /></span>
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.detail}</small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <FormField label="Action plan">
              <textarea rows={3} value={values.nextAction} onChange={event => update("nextAction", event.target.value)} placeholder="Define company focus, owner responsibilities, and first call block" />
            </FormField>
            <div className="form-field campaign-users-field">
              <span>Campaign users</span>
              <div className="campaign-user-picker">
                {(data.workspaceUsers || []).map(workspaceUser => {
                  const selected = Array.isArray(values.memberIds) && values.memberIds.includes(workspaceUser.id);
                  return (
                    <label key={workspaceUser.id} className={`campaign-user-option ${selected ? "selected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCampaignUser(workspaceUser.id)}
                      />
                      <span className="record-avatar">{workspaceUser.initials}</span>
                      <span>
                        <strong>{workspaceUser.name}</strong>
                        <small>{workspaceUser.email || workspaceUser.role}</small>
                      </span>
                      <StatusBadge>{workspaceUser.role}</StatusBadge>
                    </label>
                  );
                })}
              </div>
            </div>
          </>
        );
      case "campaign-company": {
        const campaign = data.campaigns.find(item => item.id === values.campaignId) || data.campaigns.find(item => item.clientId === values.clientId) || data.campaigns[0];
        const campaignCompanyIds = new Set(Array.isArray(campaign?.companyIds) ? campaign.companyIds : []);
        const searchQuery = normalizeLookupValue(values.search).toLowerCase();
        const matchingCompanies = data.accounts
          .filter(account => !campaignCompanyIds.has(account.id))
          .filter(account => {
            if (!searchQuery) return true;
            return [
              account.name,
              account.domain,
              account.industry,
              account.location,
            ].some(value => normalizeLookupValue(value).toLowerCase().includes(searchQuery));
          })
          .slice(0, 12);
        const selectedCompanyIds = Array.isArray(values.selectedCompanyIds) ? values.selectedCompanyIds : [];

        return (
          <>
            <div className="segmented-control" role="tablist" aria-label="Company add mode">
              <button
                className={values.mode !== "new" ? "active" : ""}
                type="button"
                role="tab"
                aria-selected={values.mode !== "new"}
                onClick={() => update("mode", "existing")}
              >
                Existing CRM
              </button>
              <button
                className={values.mode === "new" ? "active" : ""}
                type="button"
                role="tab"
                aria-selected={values.mode === "new"}
                onClick={() => update("mode", "new")}
              >
                New company
              </button>
            </div>
            {values.mode !== "new" ? (
              <>
                <FormField label="Search CRM companies">
                  <input value={values.search} onChange={event => update("search", event.target.value)} placeholder="Search by company, domain, industry, or location" autoFocus />
                </FormField>
                <div className="campaign-user-picker">
                  {matchingCompanies.length ? matchingCompanies.map(company => {
                    const selected = selectedCompanyIds.includes(company.id);
                    return (
                      <label key={company.id} className={`campaign-user-option ${selected ? "selected" : ""}`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCampaignCompany(company.id)}
                        />
                        <span className="record-avatar">{accountInitial(company.name)}</span>
                        <span>
                          <strong>{company.name}</strong>
                          <small>{[company.domain, company.industry, company.location].filter(Boolean).join(" - ") || "CRM company"}</small>
                        </span>
                        <StatusBadge>{company.clientId === campaign?.clientId ? "Client" : "CRM"}</StatusBadge>
                      </label>
                    );
                  }) : <EmptyState icon={BriefcaseBusiness} title="No matching companies" text="Try another search or add a new company." />}
                </div>
              </>
            ) : (
              <>
                <FormField label="Company name">
                  <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="Company name" autoFocus />
                </FormField>
                <FormField label="Domain">
                  <input value={values.domain} onChange={event => update("domain", event.target.value)} placeholder="company.com" />
                </FormField>
                <FormField label="Industry">
                  <input value={values.industry} onChange={event => update("industry", event.target.value)} placeholder="Technology" />
                </FormField>
                <FormField label="Location">
                  <input value={values.location} onChange={event => update("location", event.target.value)} placeholder="United Kingdom" />
                </FormField>
                <FormField label="Employees">
                  <input value={values.employees} onChange={event => update("employees", event.target.value)} placeholder="Employee range" />
                </FormField>
                <FormField label="Pipeline value">
                  <input type="number" min="0" value={values.value} onChange={event => update("value", event.target.value)} />
                </FormField>
                <FormField label="Stage">
                  <select value={values.stage} onChange={event => update("stage", event.target.value)}>
                    {pipelineStages.map(column => <option key={column.id} value={column.name}>{column.name}</option>)}
                  </select>
                </FormField>
              </>
            )}
          </>
        );
      }
      case "account":
        return (
          <>
            <FormField label="Client account">
              <select value={values.clientId} onChange={event => update("clientId", event.target.value)}>
                {data.clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </FormField>
            <FormField label="Company name">
              <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="Company name" />
            </FormField>
            <label className="company-lookup-toggle">
              <span>
                <Search size={16} />
                Company lookup disabled
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
            <FormField label="Company">
              <input list="contact-account-options" required value={values.accountName} onChange={event => {
                const accountName = event.target.value;
                const matchedAccount = data.accounts.find(account => normalizeLookupValue(account.name).toLowerCase() === normalizeLookupValue(accountName).toLowerCase());
                setValues(current => ({
                  ...current,
                  accountName,
                  accountId: matchedAccount?.id || "",
                }));
              }} placeholder="Type or select company" />
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
            <FormField label="Company">
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
            <FormField label="Company">
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
              <input required value={values.name} onChange={event => update("name", event.target.value)} placeholder="companies.csv" />
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
                <option value="accounts">Companies</option>
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
              <input value={values.role} onChange={event => update("role", event.target.value)} placeholder="Client account lead" />
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
    <>
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

          {submitError ? <div className="form-error">{submitError}</div> : null}
          <div className="modal-actions">
            {workflow.type === "edit-client" && onRemoveClient ? (
              <button className="secondary-button danger-button" type="button" onClick={() => setPendingClientRemoval(values)} disabled={submitStatus === "saving"}>
                <Trash2 size={16} />
                Remove client account
              </button>
            ) : null}
            <button className="secondary-button" type="button" onClick={onClose} disabled={submitStatus === "saving"}>Cancel</button>
            <button className="primary-button" type="submit" disabled={Boolean(prerequisite) || submitStatus === "saving"}>
              {submitStatus === "saving" ? <LoaderCircle className="button-spinner" size={16} aria-hidden="true" /> : null}
              {submitStatus === "saving" ? "Saving" : "Save"}
            </button>
          </div>
        </form>
      </div>
      {pendingClientRemoval ? (
        <ClientRemovalDialog
          client={pendingClientRemoval}
          onCancel={() => setPendingClientRemoval(null)}
          onConfirm={() => {
            onRemoveClient?.(pendingClientRemoval);
            setPendingClientRemoval(null);
            onClose();
          }}
        />
      ) : null}
    </>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [authReady, setAuthReady] = useState(() => !supabase);
  const [user, setUser] = useState(null);
  const [crmData, setCrmData] = useState(() => createInitialCrmData());
  const [dataUserId, setDataUserId] = useState(null);
  const [dataOrgId, setDataOrgId] = useState(null);
  const [leadLists, setLeadLists] = useState([]);
  const [leadListsError, setLeadListsError] = useState("");
  const [leadContactDatabase, setLeadContactDatabase] = useState([]);
  const [privateContactNotes, setPrivateContactNotes] = useState({});
  const [aircallData, setAircallData] = useState({ users: [], calls: [], dailyStats: [] });
  const [integrationCredentials, setIntegrationCredentials] = useState({ providers: {} });
  const [adminSettingsState, setAdminSettingsState] = useState({
    settings: DEFAULT_ADMIN_SETTINGS,
    role: "member",
    isAdmin: false,
    isOrgAdmin: false,
  });
  const [activeView, setActiveView] = useState("dashboard");
  const [showHomePage, setShowHomePage] = useState(false);
  const [activeClientId, setActiveClientId] = useState("each-other");
  const [activeCampaignId, setActiveCampaignId] = useState("priority-targeting");
  const [selectedAccountId, setSelectedAccountId] = useState("account-01");
  const [selectedContactId, setSelectedContactId] = useState("contact-01");
  const [currencyCode, setCurrencyCode] = useState("GBP");
  const [viewHistory, setViewHistory] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [workflow, setWorkflow] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedAircallUserId, setSelectedAircallUserId] = useState("");
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
      setCrmData(createInitialCrmData());
      setDataUserId(null);
      setDataOrgId(null);
      setLeadLists([]);
      setLeadListsError("");
      setLeadContactDatabase([]);
      setPrivateContactNotes({});
      setAircallData({ users: [], calls: [], dailyStats: [] });
      setIntegrationCredentials({ providers: {} });
      setAdminSettingsState({ settings: DEFAULT_ADMIN_SETTINGS, role: "member", isAdmin: false, isOrgAdmin: false });
      setUser(null);
      setShowHomePage(false);
      setAuthReady(true);
      setLoggingOut(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

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
    try {
      const organizationId = await ensureWorkspace(nextUser);
      const currentWorkspaceUser = mapAuthUserToWorkspaceUser(nextUser);
      const [syncedCrmData, workspaceUsers, nextLeadLists, nextLeadContactDatabase, nextPrivateContactNotes, nextAircallData, nextAdminSettings] = await Promise.all([
        loadSyncedCrmData(nextUser.id, organizationId),
        loadWorkspaceUsers(organizationId),
        loadLeadLists(organizationId).catch(error => {
          console.error("Could not load lead lists", error);
          setLeadListsError(error.message || "Could not load lead lists.");
          return [];
        }),
        loadLeadContactDatabase(organizationId).catch(error => {
          console.error("Could not load contacts", error);
          setLeadListsError(error.message || "Could not load contacts.");
          return [];
        }),
        loadPrivateContactNotes(organizationId, nextUser.id).catch(error => {
          console.error("Could not load private contact notes", error);
          return {};
        }),
        loadAircallDashboardData(organizationId).catch(error => {
          console.error("Could not load Aircall dashboard", error);
          return { users: [], calls: [], dailyStats: [], error: error.message || "Could not load Aircall dashboard." };
        }),
        loadAdminSettings(organizationId, nextUser.id).catch(error => {
          console.error("Could not load admin settings", error);
          return { settings: DEFAULT_ADMIN_SETTINGS, role: "member", isAdmin: false, isOrgAdmin: false };
        }),
      ]);
      const normalizedAdminSettings = normalizeAdminSettings(nextAdminSettings.settings);
      const nextCrmData = {
        ...refreshCrmData(syncedCrmData),
        workspaceUsers: stripTestWorkspaceAccount(mergeWorkspaceUsers(workspaceUsers, currentWorkspaceUser)),
      };
      const currentWorkspaceRecord = workspaceUsers.find(workspaceUser => workspaceUser.id === nextUser.id) || currentWorkspaceUser;
      const nextUserWithProfile = {
        ...nextUser,
        crm_profile: {
          firstName: currentWorkspaceRecord?.firstName || nextUser.user_metadata?.first_name || "",
          lastName: currentWorkspaceRecord?.lastName || nextUser.user_metadata?.last_name || "",
          displayName: currentWorkspaceRecord?.name || nextUser.user_metadata?.display_name || "",
          aircallUserId: currentWorkspaceRecord?.aircallUserId || nextUser.user_metadata?.aircallUserId || "",
          currencyCode: normalizeCurrencyCode(currentWorkspaceRecord?.currencyCode),
        },
      };
      setCrmData(nextCrmData);
      setLeadLists(nextLeadLists);
      setLeadContactDatabase(nextLeadContactDatabase);
      setPrivateContactNotes(nextPrivateContactNotes);
      setAircallData(nextAircallData);
      setAdminSettingsState({
        settings: normalizedAdminSettings,
        role: nextAdminSettings.role || "member",
        isAdmin: Boolean(nextAdminSettings.isAdmin),
        isOrgAdmin: Boolean(nextAdminSettings.isOrgAdmin),
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
      setUser(nextUserWithProfile);
      setCurrencyCode(nextUserWithProfile.crm_profile.currencyCode || "GBP");
      setLeadListsError("");
    } catch (error) {
      console.error("Could not load synced CRM data", error);
      const emptyData = refreshCrmData(createInitialCrmData());
      setCrmData({
        ...emptyData,
        workspaceUsers: stripTestWorkspaceAccount(mergeWorkspaceUsers([], mapAuthUserToWorkspaceUser(nextUser))),
      });
      setDataOrgId(null);
      setLeadLists([]);
      setLeadContactDatabase([]);
      setPrivateContactNotes({});
      setAircallData({ users: [], calls: [], dailyStats: [] });
      setIntegrationCredentials({ providers: {} });
      setAdminSettingsState({ settings: DEFAULT_ADMIN_SETTINGS, role: "member", isAdmin: false, isOrgAdmin: false });
      setDataUserId(nextUser.id);
      setUser({
        ...nextUser,
        crm_profile: {
          firstName: nextUser.user_metadata?.first_name || "",
          lastName: nextUser.user_metadata?.last_name || "",
          displayName: nextUser.user_metadata?.display_name || "",
          aircallUserId: nextUser.user_metadata?.aircallUserId || "",
          currencyCode: "GBP",
        },
      });
      setCurrencyCode("GBP");
    } finally {
      setAuthReady(true);
      setLoggingOut(false);
    }
  }

  async function handleUpdateProfile({ firstName, lastName, displayName, aircallUserId, currencyCode: nextCurrencyCode }) {
    if (!user?.id) throw new Error("Authentication is not configured yet.");
    const derivedDisplayName = displayName || [firstName, lastName].filter(Boolean).join(" ");
    const normalizedCurrencyCode = normalizeCurrencyCode(nextCurrencyCode || user.crm_profile?.currencyCode || currencyCode);
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: await buildApiHeaders(),
      body: JSON.stringify({ firstName, lastName, displayName: derivedDisplayName, aircallUserId, currencyCode: normalizedCurrencyCode }),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload.error || "Could not update profile.");
    const nextProfile = payload.profile || {
      displayName: derivedDisplayName,
      firstName,
      lastName,
      aircallUserId,
      currencyCode: normalizedCurrencyCode,
    };
    setUser(current => current ? {
      ...current,
      user_metadata: {
        ...(current.user_metadata || {}),
        first_name: firstName,
        last_name: lastName,
        display_name: nextProfile.displayName || derivedDisplayName,
      },
      crm_profile: {
        firstName: nextProfile.firstName || firstName,
        lastName: nextProfile.lastName || lastName,
        displayName: nextProfile.displayName || derivedDisplayName,
        aircallUserId: nextProfile.aircallUserId || "",
        currencyCode: nextProfile.currencyCode || normalizedCurrencyCode,
      },
    } : current);
    setCurrencyCode(nextProfile.currencyCode || normalizedCurrencyCode);
    setCrmData(current => ({
      ...current,
      workspaceUsers: (current.workspaceUsers || []).map(workspaceUser => workspaceUser.id === user.id
        ? {
          ...workspaceUser,
          name: nextProfile.displayName || derivedDisplayName || workspaceUser.name,
          firstName: nextProfile.firstName || firstName,
          lastName: nextProfile.lastName || lastName,
          initials: accountInitial(nextProfile.displayName || derivedDisplayName || workspaceUser.name),
          aircallUserId: nextProfile.aircallUserId || "",
        }
        : workspaceUser),
    }));
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
          ...roleAccessState(userRecord?.role),
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
        ...roleAccessState(userRecord?.role),
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
        test_account_enabled: typeof values.test_account_enabled === "boolean" ? values.test_account_enabled : null,
      });
      if (!error) {
        const nextState = {
          settings: normalizeAdminSettings(data),
          role: adminSettingsState.role,
          ...roleAccessState(adminSettingsState.role),
        };
        setAdminSettingsState(nextState);
        setCrmData(current => ({
          ...current,
          workspaceUsers: stripTestWorkspaceAccount(current.workspaceUsers || []),
        }));
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
    const nextState = {
      settings: normalizeAdminSettings(payload.settings),
      role: payload.role || adminSettingsState.role,
      isAdmin: Boolean(payload.isAdmin),
      isOrgAdmin: Boolean(payload.isOrgAdmin),
    };
    setAdminSettingsState(nextState);
    setCrmData(current => ({
      ...current,
      workspaceUsers: stripTestWorkspaceAccount(current.workspaceUsers || []),
    }));
    return payload;
  }

  async function handleSyncAircall() {
    const response = await fetch("/api/aircall/sync", {
      method: "POST",
      headers: await buildApiHeaders(),
      body: JSON.stringify({ perPage: 100, maxCallPages: 1, maxUserPages: 10 }),
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) throw new Error(payload.error || "Could not sync Aircall.");

    if (dataOrgId) {
      const nextAircallData = await loadAircallDashboardData(dataOrgId);
      setAircallData(nextAircallData);
    }
    return payload;
  }

  async function handleUpdateWorkspaceUserRole(userId, role) {
    let payload;
    try {
      const response = await fetch("/api/workspace-users/role", {
        method: "POST",
        headers: await buildApiHeaders(),
        body: JSON.stringify({ userId, role }),
      });
      payload = await readJsonResponse(response);
      if (!response.ok) throw new Error(payload.error || "Could not update member admin access.");
    } catch (apiError) {
      if (!supabase || !dataOrgId) throw apiError;
      if (userId === user?.id) throw new Error("You cannot change your own admin access.");
      if (!["member", "admin", "org_admin"].includes(role)) throw new Error("Workspace role must be member, admin, or org admin.");
      if (!adminSettingsState.isOrgAdmin && role === "org_admin") throw new Error("Only org admins can assign org admin access.");

      const { data: updatedUser, error } = await supabase
        .from("users")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .eq("organization_id", dataOrgId)
        .select("id,email,first_name,last_name,display_name,role,status")
        .single();

      if (error) throw new Error(error.message || "Could not update member admin access.");
      payload = {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          displayName: updatedUser.display_name,
          role: updatedUser.role || "member",
          status: updatedUser.status || "active",
        },
        role: adminSettingsState.role,
        ...roleAccessState(adminSettingsState.role),
      };
    }

    const updatedUser = payload.user || {};
    setCrmData(current => ({
      ...current,
      workspaceUsers: (current.workspaceUsers || []).map(workspaceUser => {
        if (workspaceUser.id !== updatedUser.id) return workspaceUser;
        const name = updatedUser.displayName || [updatedUser.firstName, updatedUser.lastName].filter(Boolean).join(" ") || workspaceUser.name || updatedUser.email?.split("@")[0] || "Workspace user";
        return {
          ...workspaceUser,
          email: updatedUser.email || workspaceUser.email,
          name,
          firstName: updatedUser.firstName || workspaceUser.firstName || "",
          lastName: updatedUser.lastName || workspaceUser.lastName || "",
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
        ...roleAccessState(updatedUser.role),
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
      throw new Error(`Another PaceOps DB contact already has the same LinkedIn URL, email, or mobile: ${conflictNames}. Edit the existing contact or change the duplicate value before saving.`);
    }

    const { currentUser, organizationId } = await getLeadContactSaveContext();
    const company = await ensureLeadCompanyRecord(organizationId, lead.company);
    const leadWithCompany = { ...lead, companyId: company.id, company: company.name || lead.company };
    const payload = buildLeadContactDatabasePayload(leadWithCompany, organizationId, currentUser.id);
    const updatePayload = { ...payload };
    delete updatePayload.id;
    delete updatePayload.created_by;
    const query = lead.dbContactId
      ? supabase
        .from("contacts")
        .update(updatePayload)
        .eq("id", lead.dbContactId)
        .eq("organization_id", organizationId)
      : supabase
        .from("contacts")
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
    const companyByName = new Map();

    for (const lead of previewLeads) {
      const existingContact = findLeadDatabaseMatch(lead, leadContactDatabase);
      const companyName = normalizeLookupValue(existingContact?.company || lead.company);
      if (!companyName) continue;
      if (!companyByName.has(companyName.toLowerCase())) {
        companyByName.set(companyName.toLowerCase(), await ensureLeadCompanyRecord(organizationId, companyName));
      }
      const company = companyByName.get(companyName.toLowerCase());
      const leadWithCompany = { ...lead, companyId: company.id, company: company.name || companyName };
      const payload = buildPreviewContactDatabasePayload(leadWithCompany, organizationId, currentUser.id, existingContact);
      payloadsByIdentity.set(payload.normalized_identity_key, payload);
    }

    const payloads = [...payloadsByIdentity.values()];
    if (!payloads.length) return [];
    const { data, error } = await supabase
      .from("contacts")
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
          <strong>ProspectIQ</strong>
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

  const normalizedAdminSettings = normalizeAdminSettings(adminSettingsState.settings);
  const realWorkspaceUsers = stripTestWorkspaceAccount(crmData.workspaceUsers || []);
  const workspaceUsers = workspaceUsersForTestMode(realWorkspaceUsers, normalizedAdminSettings);
  const crmDataWithoutTestAccount = {
    ...crmData,
    workspaceUsers: realWorkspaceUsers,
  };
  const effectiveWorkspaceUser = effectiveWorkspaceUserForSession(user, realWorkspaceUsers, normalizedAdminSettings);
  const effectiveAccessState = effectiveAccessStateForSession(adminSettingsState, normalizedAdminSettings);
  const visibleCrmData = {
    ...scopeCrmDataForWorkspaceUser(crmDataWithoutTestAccount, effectiveWorkspaceUser, effectiveAccessState),
    workspaceUsers,
  };
  const { clients, campaigns, accounts, contacts } = visibleCrmData;
  const activeClient = activeClientId === "none"
    ? emptyClient
    : clients.find(client => client.id === activeClientId) || clients[0] || emptyClient;
  const activeClientCampaigns = activeClient.id !== "none" ? campaigns.filter(campaign => campaign.clientId === activeClient.id) : [];
  const activeCampaign = activeCampaignId === "none"
    ? emptyCampaign
    : activeClientCampaigns.find(campaign => campaign.id === activeCampaignId) || activeClientCampaigns[0] || emptyCampaign;
  const selectedAccount = selectedAccountId
    ? accounts.find(account => account.id === selectedAccountId) || null
    : null;
  const selectedContact = selectedContactId
    ? contacts.find(contact => contact.id === selectedContactId) || null
    : null;
  const currencyFormatter = createCurrencyFormatter(currencyCode);
  const currencyContextValue = {
    currencyCode,
    currencyOptions,
    formatCurrency: value => currencyFormatter.format(Number(value) || 0),
  };

  const searchQuery = search.trim().toLowerCase();
  const searchResults = searchQuery.length < 2 ? [] : [
    ...accounts.map(account => ({ type: "Company", id: account.id, title: account.name, meta: account.nextAction })),
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

  async function handleCurrencyChange(nextCurrencyCode) {
    const normalizedCode = normalizeCurrencyCode(nextCurrencyCode);
    setCurrencyCode(normalizedCode);
    setUser(current => current ? {
      ...current,
      user_metadata: {
        ...(current.user_metadata || {}),
      },
      crm_profile: {
        ...(current.crm_profile || {}),
        currencyCode: normalizedCode,
      },
    } : current);
    if (!user?.id) return;
    try {
      await handleUpdateProfile({
        firstName: user.crm_profile?.firstName || user.user_metadata?.first_name || "",
        lastName: user.crm_profile?.lastName || user.user_metadata?.last_name || "",
        displayName: user.crm_profile?.displayName || user.user_metadata?.display_name || "",
        aircallUserId: user.crm_profile?.aircallUserId || user.user_metadata?.aircallUserId || "",
        currencyCode: normalizedCode,
      });
    } catch (error) {
      console.error("Could not save currency preference", error);
    }
  }

  function handleActiveClientChange(clientId) {
    setActiveClientId(clientId);
    if (clientId === "none") {
      setActiveCampaignId("none");
      setSelectedAccountId(null);
      setSelectedContactId(null);
      return;
    }
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
    if (CRM_MANAGEMENT_WORKFLOWS.has(type) && !effectiveAccessState.isAdmin) return;
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
    setCrmData(current => refreshCrmData(updater(current)));
  }

  function updateIntegration(name, updates) {
    updateData(current => ({
      ...current,
      integrations: current.integrations.map(integration => integration.name === name || integration.key === name
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

    updateData(current => ({
      ...current,
      contacts: current.contacts.filter(item => item.id !== contact.id),
      deals: current.deals.map(deal => deal.contactId === contact.id
        ? { ...deal, contactId: "", contact: "No primary contact" }
        : deal),
      activities: [makeActivity("Contact", `Contact archived: ${contact.name || "Untitled contact"}`, contact.account || "Workspace"), ...current.activities],
    }));
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

  async function handleUpdateClientMembership(client, values = {}) {
    if (!client?.id) return;
    const nextClientMemberIds = Array.isArray(values.clientMemberIds) ? values.clientMemberIds : [];
    const nextCampaignMemberIds = values.campaignMemberIds && typeof values.campaignMemberIds === "object" ? values.campaignMemberIds : {};
    const clientCampaigns = crmData.campaigns.filter(campaign => campaign.clientId === client.id);
    const persistableUserIds = (crmData.workspaceUsers || [])
      .filter(workspaceUser => !workspaceUser.isTestAccount)
      .map(workspaceUser => workspaceUser.id)
      .filter(id => UUID_PATTERN.test(String(id || "")));
    const nextClient = {
      ...client,
      memberIds: nextClientMemberIds,
    };
    const nextCampaigns = clientCampaigns.map(campaign => ({
      ...campaign,
      memberIds: Array.isArray(nextCampaignMemberIds[campaign.id]) ? nextCampaignMemberIds[campaign.id] : [],
    }));

    updateData(current => ({
      ...current,
      clients: current.clients.map(item => item.id === client.id ? nextClient : item),
      clientAccounts: current.clientAccounts?.map(item => item.id === client.id ? nextClient : item) || current.clientAccounts,
      campaigns: current.campaigns.map(campaign => {
        const updatedCampaign = nextCampaigns.find(item => item.id === campaign.id);
        return updatedCampaign || campaign;
      }),
      activities: [makeActivity("Client", `Client membership updated: ${client.name}`, client.name), ...current.activities],
    }));

    await Promise.all([
      replaceRelationalClientMembers(dataOrgId, client.id, nextClientMemberIds, persistableUserIds).catch(error => console.error("Could not save client members to Supabase", error)),
      ...nextCampaigns.map(campaign => replaceRelationalCampaignMembers(dataOrgId, campaign, campaign.memberIds, persistableUserIds).catch(error => console.error("Could not save campaign members to Supabase", error))),
    ]);
  }

  async function handleUpdateCampaignMembership(campaign, values = {}) {
    if (!campaign?.id) return;
    const nextMemberIds = Array.isArray(values.memberIds) ? values.memberIds : [];
    const persistableUserIds = (crmData.workspaceUsers || [])
      .filter(workspaceUser => !workspaceUser.isTestAccount)
      .map(workspaceUser => workspaceUser.id)
      .filter(id => UUID_PATTERN.test(String(id || "")));
    const nextCampaign = {
      ...campaign,
      memberIds: nextMemberIds,
    };

    updateData(current => ({
      ...current,
      campaigns: current.campaigns.map(item => item.id === campaign.id ? nextCampaign : item),
      activities: [makeActivity("Campaign", `Campaign members updated: ${campaign.name}`, campaign.name), ...current.activities],
    }));

    await replaceRelationalCampaignMembers(dataOrgId, nextCampaign, nextMemberIds, persistableUserIds)
      .catch(error => console.error("Could not save campaign members to Supabase", error));
  }

  function openAircallForUser(userId) {
    setSelectedAircallUserId(userId || "all");
    navigateTo("aircall");
  }

  async function handleBookMeeting(values = {}) {
    const effectiveUser = effectiveWorkspaceUserForSession(user, stripTestWorkspaceAccount(crmData.workspaceUsers || []), normalizeAdminSettings(adminSettingsState.settings));
    if (!UUID_PATTERN.test(String(effectiveUser?.id || "")) || effectiveUser.isTestAccount) {
      throw new Error("Use a real workspace member account to save meetings.");
    }
    const campaign = crmData.campaigns.find(item => item.id === values.campaignId);
    const clientId = values.clientId || campaign?.clientId || "";
    const requestedOwnerUserId = UUID_PATTERN.test(String(values.ownerUserId || values.userId || "")) ? (values.ownerUserId || values.userId) : "";
    const meetingOwnerUserId = effectiveAccessState.isAdmin ? requestedOwnerUserId : effectiveUser.id;
    const meetingUserId = meetingOwnerUserId || effectiveUser.id;
    const meetingOwner = (crmData.workspaceUsers || []).find(workspaceUser => workspaceUser.id === meetingOwnerUserId) || null;
    if (!UUID_PATTERN.test(String(clientId))) throw new Error("Choose a database-backed client account for this meeting.");
    const savedMeeting = await createRelationalMeeting(dataOrgId, {
      ...values,
      clientId,
      userId: meetingUserId,
      ownerUserId: meetingOwnerUserId,
      bookedByUserId: effectiveUser.id,
      agentName: meetingOwner?.name || values.agentName || "",
      status: "booked",
    });
    updateData(current => refreshCrmData({
      ...current,
      meetings: [savedMeeting, ...(current.meetings || [])],
      activities: [
        makeActivity("Meeting", `Meeting booked: ${savedMeeting.title}`, campaign?.name || "Campaign", meetingOwner?.name || savedMeeting.agentName || effectiveUser.name, {
          clientId: savedMeeting.clientId,
          campaignId: savedMeeting.campaignId,
        }),
        ...current.activities,
      ],
    }));
    return savedMeeting;
  }

  async function handleDeleteMeeting(meeting) {
    if (!meeting?.id) return;
    await deleteRelationalMeeting(dataOrgId, meeting.id);
    updateData(current => refreshCrmData({
      ...current,
      meetings: (current.meetings || []).filter(item => item.id !== meeting.id),
      activities: [
        makeActivity("Meeting", `Meeting deleted: ${meeting.title}`, "Campaign", effectiveWorkspaceUser?.name || "Workspace user", {
          clientId: meeting.clientId,
          campaignId: meeting.campaignId,
        }),
        ...current.activities,
      ],
    }));
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
        lastActivity: "Added from Contacts",
        nextAction: "Map buying committee",
        insight: "Created from a saved contact.",
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
        lastTouch: "Added from Contacts",
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
        activities: [makeActivity("Contact", `Contact added from Contacts: ${contact.name}`, account.name), ...current.activities],
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

  async function handleWorkflowSubmit(type, values, context = {}) {
    if (CRM_MANAGEMENT_WORKFLOWS.has(type) && !effectiveAccessState.isAdmin) {
      closeWorkflow();
      return;
    }

    if (type === "call") {
      handleLogCall(values);
      closeWorkflow();
      return;
    }

    const databaseTypes = new Set(["client", "campaign", "account", "contact", "campaign-company", "edit-client", "edit-campaign", "edit-account", "edit-contact"]);
    if (databaseTypes.has(type) && (!supabase || !dataOrgId)) {
      throw new Error("Database connection is required to save CRM records.");
    }

    if (type === "campaign-company") {
      const campaign = crmData.campaigns.find(item => item.id === (values.campaignId || context.campaignId)) || activeCampaign;
      if (!UUID_PATTERN.test(String(campaign?.id || ""))) throw new Error("Open a database-backed campaign before adding companies.");

      const campaignCompanyIds = new Set(Array.isArray(campaign.companyIds) ? campaign.companyIds : []);
      const selectedCompanyIds = (Array.isArray(values.selectedCompanyIds) ? values.selectedCompanyIds : [])
        .filter(companyId => UUID_PATTERN.test(String(companyId)) && !campaignCompanyIds.has(companyId));
      let newAccount = null;

      if (values.mode === "new") {
        const accountName = normalizeLookupValue(values.name);
        if (!accountName) throw new Error("Enter a company name before saving.");
        const duplicate = crmData.accounts.find(account => normalizeLookupValue(account.name).toLowerCase() === accountName.toLowerCase());
        if (duplicate) {
          if (!UUID_PATTERN.test(String(duplicate.id))) throw new Error("That company is not database-backed. Recreate it before adding it to a campaign.");
          selectedCompanyIds.push(duplicate.id);
        } else {
          const persistedCompany = await createRelationalCompany(dataOrgId, {
            clientId: campaign.clientId,
            name: accountName,
            domain: values.domain || "No domain",
            industry: values.industry || "Unspecified",
            location: values.location || "Unspecified",
            employees: values.employees || "Unknown",
            value: Number(values.value) || 0,
            stage: values.stage || "Lead In",
            status: values.status || "New",
            nextAction: values.nextAction || "Map buying committee",
            insight: values.insight || "Research signal will be added by the team.",
            scripts: null,
          });
          newAccount = {
            id: persistedCompany.id,
            clientId: campaign.clientId,
            name: accountName,
            domain: values.domain || "No domain",
            owner: "Workspace user",
            stage: values.stage || "Lead In",
            status: values.status || "New",
            industry: values.industry || "Unspecified",
            location: values.location || "Unspecified",
            employees: values.employees || "Unknown",
            value: Number(values.value) || 0,
            lastActivity: "Created from campaign",
            nextAction: values.nextAction || "Map buying committee",
            insight: values.insight || "Research signal will be added by the team.",
            scripts: null,
          };
          selectedCompanyIds.push(newAccount.id);
        }
      }

      const uniqueCompanyIds = [...new Set(selectedCompanyIds)].filter(Boolean);
      if (!uniqueCompanyIds.length) throw new Error("Select an existing CRM company or add a new company.");
      await Promise.all(uniqueCompanyIds.map(companyId => saveRelationalCampaignCompanyTarget(dataOrgId, campaign, companyId)));

      updateData(current => ({
        ...current,
        accounts: newAccount ? [newAccount, ...current.accounts] : current.accounts,
        campaigns: current.campaigns.map(item => {
          if (item.id !== campaign.id) return item;
          const companyIds = [...new Set([...(Array.isArray(item.companyIds) ? item.companyIds : []), ...uniqueCompanyIds])];
          return {
            ...item,
            companyIds,
            accounts: companyIds.length,
            companies: companyIds.length,
            nextAction: item.nextAction || "Review campaign company focus",
          };
        }),
        activities: [makeActivity("Campaign", `${uniqueCompanyIds.length} compan${uniqueCompanyIds.length === 1 ? "y" : "ies"} added to ${campaign.name}`, "Workspace"), ...current.activities],
      }));
      setActiveClientId(campaign.clientId);
      setActiveCampaignId(campaign.id);
      setActiveView("campaign-detail");
      closeWorkflow();
      return;
    }

    if (type === "client") {
      const creatorMemberIds = effectiveWorkspaceUser?.id && UUID_PATTERN.test(String(effectiveWorkspaceUser.id)) && !effectiveWorkspaceUser.isTestAccount
        ? [effectiveWorkspaceUser.id]
        : [];
      const persistedClient = await createRelationalClient(dataOrgId, user?.id, {
        name: values.name.trim() || "Untitled client",
        workspace: values.workspace.trim() || "Prospecting workspace",
        owner: values.owner || "Workspace user",
        industry: values.industry,
        website: values.website,
        imageUrl: values.imageUrl || "",
        imagePath: values.imagePath || "",
        imageName: values.imageName || "",
      });
      await replaceRelationalClientMembers(dataOrgId, persistedClient.id, creatorMemberIds, creatorMemberIds);
      values = { ...values, id: persistedClient.id, memberIds: creatorMemberIds };
    }

    if (type === "campaign") {
      const clientId = values.clientId || crmData.clients[0]?.id || "";
      if (!UUID_PATTERN.test(String(clientId))) throw new Error("Create or select a database-backed client account before saving a campaign.");
      const persistableUserIds = (crmData.workspaceUsers || [])
        .filter(workspaceUser => !workspaceUser.isTestAccount)
        .map(workspaceUser => workspaceUser.id)
        .filter(id => UUID_PATTERN.test(String(id || "")));
      const creatorMemberIds = effectiveWorkspaceUser?.id && UUID_PATTERN.test(String(effectiveWorkspaceUser.id)) && !effectiveWorkspaceUser.isTestAccount
        ? [effectiveWorkspaceUser.id]
        : [];
      const campaignMemberIds = [...new Set([...(Array.isArray(values.memberIds) ? values.memberIds : []), ...creatorMemberIds])];
      const persistedCampaign = await createRelationalCampaign(dataOrgId, {
        clientId,
        name: values.name.trim() || "Untitled campaign",
        status: values.status || "active",
        channel: values.channel || "Research-led outbound",
        nextAction: values.nextAction || "Define company focus and next action",
        memberIds: campaignMemberIds,
        imageUrl: values.imageUrl || "",
        imagePath: values.imagePath || "",
        imageName: values.imageName || "",
      });
      await replaceRelationalCampaignMembers(dataOrgId, {
        id: persistedCampaign.id,
        clientId,
      }, campaignMemberIds, persistableUserIds);
      values = { ...values, clientId, id: persistedCampaign.id, memberIds: campaignMemberIds };
    }

    if (type === "account") {
      const clientId = values.clientId || crmData.clients[0]?.id || "";
      if (!UUID_PATTERN.test(String(clientId))) throw new Error("Create or select a database-backed client account before saving a company.");
      const persistedCompany = await createRelationalCompany(dataOrgId, {
        clientId,
        name: values.name.trim() || "Untitled company",
        domain: values.domain || "No domain",
        industry: values.industry || "Unspecified",
        location: values.location || "Unspecified",
        employees: values.employees || "Unknown",
        value: Number(values.value) || 0,
        stage: values.stage || "Lead In",
        status: values.status || "New",
        nextAction: values.nextAction || "Map buying committee",
        insight: values.insight || "Research signal will be added by the team.",
        scripts: values.scripts || null,
      });
      values = { ...values, clientId, id: persistedCompany.id };
    }

    if (type === "contact") {
      const accountName = normalizeLookupValue(values.accountName) || "Untitled company";
      const existingAccount = crmData.accounts.find(item => item.id === values.accountId || normalizeLookupValue(item.name).toLowerCase() === accountName.toLowerCase());
      let account = existingAccount || null;
      if (!account) {
        const fallbackClient = crmData.clients[0];
        if (!UUID_PATTERN.test(String(fallbackClient?.id || ""))) throw new Error("Create a database-backed client account before saving this contact.");
        const persistedCompany = await createRelationalCompany(dataOrgId, {
          clientId: fallbackClient.id,
          name: accountName,
          domain: "No domain",
          industry: "Unspecified",
          location: "Unspecified",
          employees: "Unknown",
          value: 0,
          stage: crmData.pipelineStages?.[0]?.name || "Lead In",
          status: "New",
          nextAction: "Review new contact",
          insight: "Created from contact form.",
          scripts: null,
        });
        account = {
          id: persistedCompany.id,
          clientId: fallbackClient.id,
          name: accountName,
          domain: "No domain",
          owner: "Workspace user",
          stage: crmData.pipelineStages?.[0]?.name || "Lead In",
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
      }
      if (!UUID_PATTERN.test(String(account.id))) throw new Error("Create or select a database-backed company before saving this contact.");
      const persistedContact = await createRelationalContact(dataOrgId, {
        clientId: account.clientId,
        accountId: account.id,
        account: account.name,
        name: values.name.trim() || "Untitled contact",
        role: values.role || "Stakeholder",
        email: values.email,
        mobile: values.mobile,
        directDial: values.directDial,
        status: values.status || "New",
      });
      values = { ...values, id: persistedContact.id, accountId: account.id, accountName: account.name, createdAccount: existingAccount ? null : account };
    }

    if (type === "edit-campaign") {
      const campaign = crmData.campaigns.find(item => item.id === values.id);
      if (campaign) {
        const persistableUserIds = (crmData.workspaceUsers || [])
          .filter(workspaceUser => !workspaceUser.isTestAccount)
          .map(workspaceUser => workspaceUser.id)
          .filter(id => UUID_PATTERN.test(String(id || "")));
        await saveRelationalCampaign(dataOrgId, {
          ...campaign,
          clientId: values.clientId || campaign.clientId,
          name: values.name.trim() || campaign.name,
          channel: values.channel || campaign.channel,
          status: values.status || campaign.status,
          nextAction: values.nextAction || campaign.nextAction,
          memberIds: Array.isArray(values.memberIds) ? values.memberIds : [],
          imageUrl: values.imageUrl || campaign.imageUrl || "",
          imagePath: values.imagePath || campaign.imagePath || "",
          imageName: values.imageName || campaign.imageName || "",
        });
        await replaceRelationalCampaignMembers(dataOrgId, {
          id: campaign.id,
          clientId: values.clientId || campaign.clientId,
        }, values.memberIds || [], persistableUserIds);
      }
    }

    if (type === "edit-client") {
      const client = crmData.clients.find(item => item.id === values.id);
      if (client) {
        await saveRelationalClient(dataOrgId, {
          ...client,
          name: values.name.trim() || client.name,
          workspace: values.workspace || client.workspace,
          owner: values.owner || client.owner,
          industry: values.industry,
          website: values.website,
          imageUrl: values.imageUrl || client.imageUrl || "",
          imagePath: values.imagePath || client.imagePath || "",
          imageName: values.imageName || client.imageName || "",
        });
      }
    }

    if (type === "edit-account") {
      const previous = crmData.accounts.find(account => account.id === values.id);
      if (previous) {
        await saveRelationalCompany(dataOrgId, {
          ...previous,
          clientId: values.clientId || previous.clientId,
          name: values.name.trim() || previous.name,
          domain: values.domain || "No domain",
          stage: values.stage || previous.stage,
          status: values.status || previous.status,
          industry: values.industry || "Unspecified",
          location: values.location || "Unspecified",
          employees: values.employees || "Unknown",
          value: Number(values.value) || 0,
          nextAction: values.nextAction || "Map buying committee",
          insight: values.insight || "Research signal will be added by the team.",
          scripts: values.scripts || previous.scripts || null,
        });
      }
    }

    if (type === "edit-contact") {
      const previous = crmData.contacts.find(contact => contact.id === values.id);
      const account = crmData.accounts.find(item => item.id === values.accountId);
      if (previous && account) {
        await saveRelationalContact(dataOrgId, {
          ...previous,
          clientId: account.clientId || previous.clientId,
          accountId: account.id,
          account: account.name,
          name: values.name.trim() || previous.name,
          role: values.role || "Stakeholder",
          email: values.email,
          mobile: values.mobile,
          directDial: values.directDial,
          status: values.status || previous.status,
        });
      }
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
              imageUrl: values.imageUrl || client.imageUrl || "",
              imagePath: values.imagePath || client.imagePath || "",
              imageName: values.imageName || client.imageName || "",
              metadata: {
                ...(client.metadata || {}),
                workspace: values.workspace || client.workspace,
                owner: values.owner || client.owner,
                imageUrl: values.imageUrl || client.imageUrl || "",
                imagePath: values.imagePath || client.imagePath || "",
                imageName: values.imageName || client.imageName || "",
              },
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
              status: campaignStatusLabel(values.status || campaign.status),
              nextAction: values.nextAction || campaign.nextAction,
              memberIds: Array.isArray(values.memberIds) ? values.memberIds : [],
              imageUrl: values.imageUrl || campaign.imageUrl || "",
              imagePath: values.imagePath || campaign.imagePath || "",
              imageName: values.imageName || campaign.imageName || "",
              settings: {
                ...(campaign.settings || {}),
                next_action: values.nextAction || campaign.nextAction,
                imageUrl: values.imageUrl || campaign.imageUrl || "",
                imagePath: values.imagePath || campaign.imagePath || "",
                imageName: values.imageName || campaign.imageName || "",
              },
            }
            : campaign),
          activities: [makeActivity("Campaign", `Campaign updated: ${values.name || "Untitled campaign"}`), ...current.activities],
        };
      }

      if (type === "edit-account") {
        const previous = current.accounts.find(account => account.id === values.id);
          const accountName = values.name.trim() || previous?.name || "Untitled company";
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
          activities: [makeActivity("Company", `Company updated: ${accountName}`, accountName), ...current.activities],
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
            id: values.id,
            name: values.name.trim() || "Untitled client",
            workspace: values.workspace.trim() || "Prospecting workspace",
            status: "Active",
            owner: "Workspace user",
            accounts: 0,
            contacts: 0,
            health: "Needs setup",
            industry: values.industry,
            website: values.website,
            imageUrl: values.imageUrl || "",
            imagePath: values.imagePath || "",
            imageName: values.imageName || "",
            memberIds: Array.isArray(values.memberIds) ? values.memberIds : [],
            metadata: {
              workspace: values.workspace || "Prospecting workspace",
              owner: values.owner || "Workspace user",
              imageUrl: values.imageUrl || "",
              imagePath: values.imagePath || "",
              imageName: values.imageName || "",
            },
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
            id: values.id,
            clientId,
            name: values.name.trim() || "Untitled campaign",
            status: campaignStatusLabel(values.status || "active"),
            owner: "Workspace user",
            channel: values.channel || "Research-led outbound",
            accounts: 0,
            companies: 0,
            contacts: 0,
            meetings: 0,
            nextAction: values.nextAction || "Define company focus and next action",
            memberIds: Array.isArray(values.memberIds) ? values.memberIds : [],
            imageUrl: values.imageUrl || "",
            imagePath: values.imagePath || "",
            imageName: values.imageName || "",
            companyIds: [],
            contactIds: [],
            settings: {
              next_action: values.nextAction || "Define company focus and next action",
              imageUrl: values.imageUrl || "",
              imagePath: values.imagePath || "",
              imageName: values.imageName || "",
            },
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
            id: values.id,
            clientId,
            name: values.name.trim() || "Untitled company",
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
            activities: [makeActivity("Company", `Company added: ${account.name}`, account.name), ...current.activities],
          };
        }
        case "contact": {
          const accountName = normalizeLookupValue(values.accountName) || "Untitled company";
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
          const existingAccount = values.createdAccount ? null : current.accounts.find(item => (
            item.id === values.accountId
            || normalizeLookupValue(item.name).toLowerCase() === accountName.toLowerCase()
          ));
          const account = values.createdAccount || existingAccount || {
            id: values.accountId,
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
            id: values.id,
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
            title: values.title || "Company research brief",
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
    if (result.type === "Company") openAccount(result.id);
    if (result.type === "Contact") openContact(result.id);
    if (result.type === "Campaign") openCampaign(result.id);
    if (result.type === "User") openView("settings");
  }

  function openView(view) {
    navigateTo(view);
  }

  function renderPage() {
    const canManageCrmRecords = Boolean(effectiveAccessState.isAdmin);
    const canDeleteContacts = Boolean(effectiveAccessState.isAdmin && normalizedAdminSettings.contact_deletion_enabled);
    const cognismRedeemEnabled = Boolean(crmData.integrations?.find(integration => integration.name === "Cognism" || integration.key === "Cognism")?.redeemEnabled);
    const canUseCognismRedeemMode = Boolean(effectiveAccessState.isAdmin && cognismRedeemEnabled);
    switch (activeView) {
      case "clients":
        return <ClientsPage onOpenClient={openClient} onEditClient={editClient} onRemoveClient={handleRemoveClient} onNewClient={() => openWorkflow("client")} canManageCrmRecords={canManageCrmRecords} />;
      case "client-detail":
        return (
          <ClientDetailPage
            client={activeClient}
            aircallData={aircallData}
            onOpenCampaign={openCampaign}
            onOpenAccount={openAccount}
            onEditClient={editClient}
            onEditAccount={editAccount}
            onNewCampaign={() => openWorkflow("campaign", { clientId: activeClient.id })}
            onManageClientAccount={handleUpdateClientMembership}
            onOpenAircallUser={openAircallForUser}
            onDeleteMeeting={handleDeleteMeeting}
            currentUserId={effectiveWorkspaceUser?.id || ""}
            canManageCrmRecords={canManageCrmRecords}
          />
        );
      case "campaigns":
        return <CampaignsPage activeClient={activeClient} onOpenCampaign={openCampaign} onEditCampaign={editCampaign} onNewCampaign={() => openWorkflow("campaign", { clientId: activeClient.id })} onImport={() => openWorkflow("file", { returnTo: "campaigns" })} canManageCrmRecords={canManageCrmRecords} />;
      case "campaign-detail":
        return <CampaignDetailPage campaign={activeCampaign} aircallData={aircallData} onNavigate={openView} onOpenClient={openClient} onOpenAccount={openAccount} onOpenContact={openContact} onEditCampaign={editCampaign} onManageCampaignMembers={handleUpdateCampaignMembership} onAddCompany={(campaign) => openWorkflow("campaign-company", { clientId: campaign.clientId, campaignId: campaign.id })} onOpenAircallUser={openAircallForUser} onDeleteMeeting={handleDeleteMeeting} currentUserId={effectiveWorkspaceUser?.id || ""} canManageCrmRecords={canManageCrmRecords} />;
      case "accounts":
        return <ClientsPage onOpenClient={openClient} onEditClient={editClient} onRemoveClient={handleRemoveClient} onNewClient={() => openWorkflow("client")} canManageCrmRecords={canManageCrmRecords} />;
      case "account-detail":
        return selectedAccount
          ? <AccountDetailPage account={selectedAccount} onOpenContact={openContact} onEditAccount={editAccount} onQueueResearch={(accountId) => openWorkflow("research", { accountId })} onNewContact={(accountId) => openWorkflow("contact", { accountId })} onNewDeal={(accountId) => openWorkflow("deal", { accountId })} canManageCrmRecords={canManageCrmRecords} />
          : <ClientsPage onOpenClient={openClient} onEditClient={editClient} onRemoveClient={handleRemoveClient} onNewClient={() => openWorkflow("client")} canManageCrmRecords={canManageCrmRecords} />;
      case "contacts":
      case "lead-lookup":
        return <LeadDatabasePage leadLists={leadLists} contactDatabase={leadContactDatabase} onSaveLeadContact={handleUpsertLeadContact} onAddToCrmContacts={handleAddLeadToCrmContacts} onSaveLeadList={handleSaveLeadList} currentUserId={effectiveWorkspaceUser?.id || ""} isAdmin={effectiveAccessState.isAdmin} />;
      case "contact-detail":
        return selectedContact
          ? <ContactDetailPage
            key={selectedContact.id}
            contact={selectedContact}
            privateNote={privateContactNotes[selectedContact.id] || ""}
            contactCalls={(aircallData.calls || []).filter(call => (
              call.contactId === selectedContact.id
              && (effectiveAccessState.isAdmin || aircallCallBelongsToWorkspaceUser(call, effectiveWorkspaceUser))
            ))}
            onUpdateContact={handleUpdateContact}
            onSavePrivateNote={handleSavePrivateContactNote}
            onLogCall={handleLogCall}
            onRemoveContact={handleRemoveContact}
            canDeleteContacts={canDeleteContacts}
            canManageCrmRecords={canManageCrmRecords}
          />
          : <LeadDatabasePage leadLists={leadLists} contactDatabase={leadContactDatabase} onSaveLeadContact={handleUpsertLeadContact} onAddToCrmContacts={handleAddLeadToCrmContacts} onSaveLeadList={handleSaveLeadList} currentUserId={effectiveWorkspaceUser?.id || ""} isAdmin={effectiveAccessState.isAdmin} />;
      case "cognism":
        return <CognismContactFinder contactDatabase={leadContactDatabase} onSaveLeadList={handleSaveLeadList} onSaveLeadContact={handleUpsertLeadContact} onPersistSearchResults={handlePersistSearchResults} cognismPreviewEnabled={normalizedAdminSettings.cognism_preview_enabled} canUseRedeemMode={canUseCognismRedeemMode} currentUserId={effectiveWorkspaceUser?.id || ""} />;
      case "lead-lists":
        return <LeadListsPage leadLists={leadLists} workspaceUsers={workspaceUsers} contactDatabase={leadContactDatabase} error={leadListsError} onSaveLeadList={handleSaveLeadList} onAppendToLeadList={handleAppendToLeadList} onUpdateLeadList={handleUpdateLeadList} onDeleteLeadList={handleDeleteLeadList} onSaveLeadContact={handleUpsertLeadContact} />;
      case "aircall":
        return <AircallDashboardPage aircallData={aircallData} workspaceUsers={workspaceUsers} contacts={contacts} onOpenContact={openContact} canSync={effectiveAccessState.isAdmin} onSyncAircall={handleSyncAircall} onBookMeeting={handleBookMeeting} currentUserId={effectiveWorkspaceUser?.id || ""} currentAircallUserId={effectiveWorkspaceUser?.aircallUserId || ""} selectedAircallUserId={selectedAircallUserId} isAdmin={effectiveAccessState.isAdmin} />;
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
          />
        );
    }
  }

  return (
    <CrmDataContext.Provider value={visibleCrmData}>
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
            effectiveUser={effectiveWorkspaceUser}
            effectiveAccess={effectiveAccessState}
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
            key={`${workflow.type}-${workflow.context?.record?.id || workflow.context?.campaignId || workflow.context?.accountId || workflow.context?.contactId || ""}`}
            workflow={workflow}
            activeClientId={activeClientId}
            selectedAccountId={selectedAccountId}
            selectedContactId={selectedContactId}
            organizationId={dataOrgId}
            onClose={closeWorkflow}
            onSubmit={handleWorkflowSubmit}
            onRemoveClient={handleRemoveClient}
            onSwitchWorkflow={(type) => openWorkflow(type)}
          />
        )}
        </div>
      </CurrencyContext.Provider>
    </CrmDataContext.Provider>
  );
}
