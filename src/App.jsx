import { createContext, createElement, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
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

const collaborativeActivityTypes = new Set([
  "Call",
  "Email",
  "Import",
  "Meeting",
  "Research",
  "Team",
]);

const baseIntegrations = [
  { name: "Cognism", icon: Target, status: "Available", note: "Use Contact Finder to preview target contacts and export results.", action: "Open Contact Finder", view: "cognism" },
  { name: "Aircall", icon: Phone, status: "Partial", note: "Click-to-call is available for contacts with redeemed phone numbers.", action: "Open Calls", view: "calls" },
  { name: "OpenAI", icon: Bot, status: "Available", note: "Used in account intelligence and script generation when an API key is configured.", action: "Add account", workflow: "account" },
  { name: "CSV Import", icon: Upload, status: "Planned", note: "CSV source tracking exists. Full import mapping is not connected yet.", action: "Open Files", view: "files" },
  { name: "HubSpot", icon: Database, status: "Not connected", note: "HubSpot sync is not implemented in this workspace yet.", action: "", view: "" },
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clients", label: "Clients", icon: Building2 },
  { id: "campaigns", label: "Campaigns", icon: Megaphone },
  { id: "accounts", label: "Accounts", icon: BriefcaseBusiness },
  { id: "contacts", label: "Contacts", icon: Contact },
  { id: "cognism", label: "Cognism", icon: Target },
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
    return { ...integration, ...saved, icon: integration.icon };
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
    const parsed = JSON.parse(window.localStorage.getItem(getUiStateKey(userId)) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
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

function AircallDialButton({ contact, label = "Call" }) {
  const phoneNumber = getRedeemedPhoneNumber(contact);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const canDial = Boolean(phoneNumber && contact?.id);

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
        body: JSON.stringify({ phoneNumber, contactId: contact.id }),
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
    <div className="aircall-dial">
      <span>{phoneNumber || "Redeem required"}</span>
      <button className="secondary-button" type="button" disabled={!canDial || status === "loading"} onClick={dialContact}>
        <Phone size={16} />
        {status === "loading" ? "Dialing" : label}
      </button>
      {message ? <small className={status === "error" ? "dial-error" : "dial-success"}>{message}</small> : null}
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
      <div className="sidebar-logo">
        <img src={logoUrl} alt="PaceOps" />
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-button ${activeView === item.id ? "active" : ""}`}
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
          placeholder="Search accounts, contacts, campaigns"
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
                <StatusBadge>{member.status}</StatusBadge>
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
            <div><span>Cognism status</span><strong>{contact.redeemed ? "Redeemed" : "Preview-only or not redeemed"}</strong></div>
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
  const { contacts } = useCrmData();
  const [outcome, setOutcome] = useState("Connected");
  const [contactId, setContactId] = useState("");
  const [notes, setNotes] = useState("");

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
            <button className="primary-button" type="button" disabled={!contacts.length} onClick={() => {
              onLogCall({ contactId: contactId || contacts[0]?.id, outcome, notes });
              setNotes("");
            }}>Save outcome</button>
          </div>
        </section>
      </div>
    </>
  );
}

function ResearchPage({ onOpenAccount, onAddSource, onQueueResearch }) {
  const { accounts, researchItems } = useCrmData();

  return (
    <>
      <PageHeader
        eyebrow="Research"
        title="Account intelligence"
        description="Research cards stay linked to accounts. AI actions will become audited jobs later."
      >
        <button className="secondary-button" type="button" onClick={onAddSource}>
          <Upload size={16} />
          Add source
        </button>
        <button className="primary-button" type="button" onClick={() => onQueueResearch()}>
          <Sparkles size={16} />
          Queue research
        </button>
      </PageHeader>
      {researchItems.length > 0 && (
        <section className="panel research-queue-panel">
          <div className="panel-header"><h2>Research queue</h2></div>
          <div className="detail-list">
            {researchItems.map(item => (
              <div key={item.id}>
                <span>{item.account}</span>
                <strong>{item.title}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="research-grid">
        {accounts.length ? accounts.map(account => (
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
    </>
  );
}

function parseLines(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function AvailabilityValue({ value }) {
  return (
    <span className={`availability-value ${value ? "available" : ""}`}>
      {value ? <CheckCircle2 size={14} /> : <Circle size={14} />}
      {value ? "Available" : "Not available"}
    </span>
  );
}

const cognismExportColumns = [
  ["company", "Company"],
  ["contactName", "Contact name"],
  ["jobTitle", "Job title"],
  ["seniority", "Seniority"],
  ["department", "Department"],
  ["location", "Location"],
  ["linkedinAvailable", "LinkedIn available"],
  ["emailAvailable", "Email available"],
  ["mobileAvailable", "Mobile available"],
  ["directDialAvailable", "Direct dial available"],
  ["matchScore", "Match score"],
  ["cognismContactId", "Cognism preview/contact ID"],
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
      `cognism-preview-${timestamp}.json`,
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
      `cognism-preview-${timestamp}.xls`,
      "application/vnd.ms-excel;charset=utf-8",
      `<table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>`,
    );
    return;
  }

  const header = cognismExportColumns.map(([, label]) => csvEscape(label)).join(",");
  const rows = exportResults.map(result => cognismExportColumns.map(([key]) => csvEscape(result[key])).join(","));
  downloadTextFile(
    `cognism-preview-${timestamp}.csv`,
    "text/csv;charset=utf-8",
    [header, ...rows].join("\n"),
  );
}

function CognismContactFinder() {
  const { workspaceUsers = [] } = useCrmData();
  const [companiesText, setCompaniesText] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const [suggestedRoles, setSuggestedRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [maxPerCompany, setMaxPerCompany] = useState(1);
  const [requireEmailOrMobile, setRequireEmailOrMobile] = useState(false);
  const [customRolesText, setCustomRolesText] = useState("");
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState({ mode: "preview_only", estimatedCreditsUsed: 0, maxPerCompany: 1, requireEmailOrMobile: false });
  const [status, setStatus] = useState("idle");
  const [roleStatus, setRoleStatus] = useState("idle");
  const [roleMode, setRoleMode] = useState("");
  const [error, setError] = useState("");
  const roleOptions = suggestedRoles;
  const selectedUsers = workspaceUsers.filter(user => selectedUserIds.includes(user.id));

  function toggleRole(role) {
    setSelectedRoles(current => current.includes(role)
      ? current.filter(item => item !== role)
      : [...current, role]);
  }

  function toggleUser(userId) {
    setSelectedUserIds(current => current.includes(userId)
      ? current.filter(id => id !== userId)
      : [...current, userId]);
  }

  async function loadRoleSuggestions() {
    setError("");
    setRoleStatus("loading");

    try {
      const response = await fetch("/api/cognism/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    try {
      const response = await fetch("/api/cognism/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies, targetTitles, maxPerCompany: requestedMax, requireEmailOrMobile }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Preview request failed");
      setMeta({
        mode: payload.mode,
        estimatedCreditsUsed: payload.estimatedCreditsUsed,
        maxPerCompany: payload.maxPerCompany,
        requireEmailOrMobile: Boolean(payload.requireEmailOrMobile),
      });
      setResults(Array.isArray(payload.results) ? payload.results : []);
      setStatus("done");
    } catch (previewError) {
      setError(previewError.message || "Preview request failed");
      setStatus("error");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Cognism preview"
        title="Contact finder"
        description="Search preview contacts per company using server-side Cognism search only."
      >
        <button className="secondary-button" type="button" disabled>
          <LockKeyhole size={16} />
          Redeem disabled in test mode
        </button>
        <button className="primary-button" type="button" onClick={previewContacts} disabled={status === "loading"}>
          <Search size={16} />
          {status === "loading" ? "Previewing" : "Preview contacts"}
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
          <label className="form-field">
            <span>Companies or domains</span>
            <textarea
              value={companiesText}
              onChange={event => setCompaniesText(event.target.value)}
              placeholder={"Microsoft\nadobe.com\nAtlassian"}
            />
          </label>
          <label className="form-field">
            <span>Max contacts per company</span>
            <input
              type="number"
              min="1"
              value={maxPerCompany}
              onChange={event => setMaxPerCompany(event.target.value)}
              onBlur={() => setMaxPerCompany(current => Math.max(Number(current) || 1, 1))}
              aria-label="Max contacts per company"
            />
          </label>
          <div className="finder-availability-filters">
            <label className={`role-choice ${requireEmailOrMobile ? "selected" : ""}`}>
              <input type="checkbox" checked={requireEmailOrMobile} onChange={event => setRequireEmailOrMobile(event.target.checked)} />
              <span>Must include email or mobile</span>
            </label>
          </div>
          <div className="finder-user-select">
            <div className="panel-header compact-header">
              <div>
                <span className="eyebrow">Users</span>
                <h2>Assign results</h2>
              </div>
              <StatusBadge>{selectedUserIds.length} selected</StatusBadge>
            </div>
            <div className="role-actions">
              <button className="secondary-button" type="button" onClick={() => setSelectedUserIds(workspaceUsers.map(user => user.id))} disabled={!workspaceUsers.length}>
                <CheckCircle2 size={16} />
                Select all
              </button>
              <button className="secondary-button" type="button" onClick={() => setSelectedUserIds([])} disabled={!selectedUserIds.length}>
                <Circle size={16} />
                Deselect all
              </button>
            </div>
            {workspaceUsers.length ? (
              <div className="role-choice-grid compact-choice-grid">
                {workspaceUsers.map(user => (
                  <label key={user.id} className={`role-choice ${selectedUserIds.includes(user.id) ? "selected" : ""}`}>
                    <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => toggleUser(user.id)} />
                    <span>{user.name}<small>{user.email}</small></span>
                  </label>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title="No users found" text="PaceOps users will appear here after they sign in to the CRM." />
            )}
          </div>
          <label className="form-field">
            <span>Optional manual role titles, one per line or comma-separated</span>
            <textarea
              value={customRolesText}
              onChange={event => setCustomRolesText(event.target.value)}
              placeholder={"Use this only if the generated options miss a title.\nChief Information Security Officer\nVP Engineering, Head of Procurement"}
            />
          </label>
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
        </section>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">Preview results</span>
            <h2>Cognism matches</h2>
          </div>
          <div className="cognism-meta">
            <StatusBadge tone="success">{meta.mode}</StatusBadge>
            <StatusBadge>Credits: {meta.estimatedCreditsUsed}</StatusBadge>
            <StatusBadge>Max: {meta.maxPerCompany}</StatusBadge>
            {meta.requireEmailOrMobile ? <StatusBadge>Email or mobile required</StatusBadge> : null}
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
        <div className="export-actions">
          <button className="secondary-button" type="button" disabled={!results.length} onClick={() => exportCognismResults(results, "csv", selectedUsers)}>
            <FileText size={16} />
            Export CSV
          </button>
          <button className="secondary-button" type="button" disabled={!results.length} onClick={() => exportCognismResults(results, "xls", selectedUsers)}>
            <FileText size={16} />
            Export Excel
          </button>
          <button className="secondary-button" type="button" disabled={!results.length} onClick={() => exportCognismResults(results, "json", selectedUsers)}>
            <FileText size={16} />
            Export JSON
          </button>
        </div>
        {error ? <div className="form-error">{error}</div> : null}
        <div className="table-wrap">
          <table className="data-table cognism-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact name</th>
                <th>Job title</th>
                <th>Seniority</th>
                <th>Department</th>
                <th>Location</th>
                <th>LinkedIn available</th>
                <th>Email available</th>
                <th>Mobile available</th>
                <th>Direct dial available</th>
                <th>Match score</th>
                <th>Cognism preview/contact ID</th>
              </tr>
            </thead>
            <tbody>
              {results.length ? results.map(result => (
                <tr key={`${result.company}-${result.cognismContactId || result.contactName}`}>
                  <td>{result.company || "Not available"}</td>
                  <td>{result.contactName || "Not available"}</td>
                  <td>{result.jobTitle || "Not available"}</td>
                  <td>{result.seniority || "Not available"}</td>
                  <td>{result.department || "Not available"}</td>
                  <td>{result.location || "Not available"}</td>
                  <td><AvailabilityValue value={result.linkedinAvailable} /></td>
                  <td><AvailabilityValue value={result.emailAvailable} /></td>
                  <td><AvailabilityValue value={result.mobileAvailable} /></td>
                  <td><AvailabilityValue value={result.directDialAvailable} /></td>
                  <td>{result.matchScore}</td>
                  <td>{result.cognismContactId || "Not available"}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="13" className="empty-table-cell">
                    {status === "done" ? "No preview matches returned." : "Run a preview to see Cognism contact metadata."}
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

function IntegrationsPage({ onNavigate, onOpenWorkflow }) {
  const { integrations } = useCrmData();

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
          return (
            <article key={integration.name} className="integration-card">
              <div>
                <span className="integration-icon"><Icon size={20} /></span>
                <StatusBadge tone={["Available", "Partial"].includes(integration.status) ? "success" : "neutral"}>{integration.status}</StatusBadge>
              </div>
              <h2>{integration.name}</h2>
              <p>{integration.note}</p>
              {isAvailable ? (
                <button className="secondary-button" type="button" onClick={() => integration.workflow ? onOpenWorkflow(integration.workflow) : onNavigate(integration.view)}>
                  {integration.action}
                </button>
              ) : (
                <StatusBadge>Not actionable yet</StatusBadge>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

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
                <StatusBadge>{member.status}</StatusBadge>
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
  const [user, setUser] = useState(null);
  const [crmData, setCrmData] = useState(() => createInitialCrmData());
  const [dataUserId, setDataUserId] = useState(null);
  const [dataOrgId, setDataOrgId] = useState(null);
  const [crmSyncReady, setCrmSyncReady] = useState(false);
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
      }
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
      setUser(null);
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
      const [syncedCrmData, workspaceUsers] = await Promise.all([
        loadSyncedCrmData(nextUser.id, organizationId),
        loadWorkspaceUsers(organizationId),
      ]);
      const nextCrmData = {
        ...refreshCrmData(syncedCrmData),
        workspaceUsers,
      };
      lastSyncedCrmJsonRef.current = JSON.stringify(serializeCrmData(nextCrmData));
      setCrmData(nextCrmData);
      const uiState = loadUiState(nextUser.id);
      if (uiState.activeView) setActiveView(uiState.activeView);
      if (uiState.activeClientId) setActiveClientId(uiState.activeClientId);
      if (uiState.activeCampaignId) setActiveCampaignId(uiState.activeCampaignId);
      if (uiState.selectedAccountId) setSelectedAccountId(uiState.selectedAccountId);
      if (uiState.selectedContactId) setSelectedContactId(uiState.selectedContactId);
      setDataOrgId(organizationId);
      setDataUserId(nextUser.id);
      setUser(nextUser);
      setCrmSyncReady(true);
    } catch (error) {
      console.error("Could not load synced CRM data", error);
      const localData = refreshCrmData(loadCrmData(nextUser.id));
      lastSyncedCrmJsonRef.current = JSON.stringify(serializeCrmData(localData));
      setCrmData({ ...localData, workspaceUsers: [] });
      setDataOrgId(null);
      setDataUserId(nextUser.id);
      setUser(nextUser);
    } finally {
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

  async function handleLogout() {
    if (!supabase || loggingOut) return;
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setLoggingOut(false);
      window.alert(error.message || "Could not log out.");
    }
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

  function handleLogCall({ contactId, outcome, notes }) {
    if (!contactId) return;
    updateData(current => {
      const contact = current.contacts.find(item => item.id === contactId);
      if (!contact) return current;
      const activity = makeActivity("Call", `${outcome} logged for ${contact.name}`, contact.account, "Workspace user", {
        contactId,
        outcome,
        notes,
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
        return <CognismContactFinder />;
      case "pipeline":
        return <PipelinePage onOpenAccount={openAccount} onMoveDeal={handleMoveDeal} onNewDeal={(accountId) => openWorkflow("deal", accountId ? { accountId } : {})} onUpdateStages={handleUpdatePipelineStages} />;
      case "calls":
        return <CallsPage onOpenContact={openContact} onLogCall={handleLogCall} onStartCallBlock={() => openWorkflow("call")} />;
      case "research":
        return <ResearchPage onOpenAccount={openAccount} onAddSource={() => openWorkflow("file", { returnTo: "research" })} onQueueResearch={(accountId) => openWorkflow("research", accountId ? { accountId } : {})} />;
      case "files":
        return <FilesPage onUploadFile={() => openWorkflow("file", { returnTo: "files" })} />;
      case "integrations":
        return <IntegrationsPage onNavigate={openView} onOpenWorkflow={(type) => openWorkflow(type)} />;
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
