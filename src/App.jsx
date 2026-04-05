import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── SUPABASE ────────────────────────────────────────────────────────────────
// Replace with your actual values from supabase.com → project settings → API
const SUPABASE_URL = "https://YOUR_PROJECT_REF.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── CLAUDE ──────────────────────────────────────────────────────────────────
const CLAUDE_MODEL = "claude-sonnet-4-20250514";

async function callClaude(messages, systemPrompt, maxTokens = 1200) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: maxTokens, system: systemPrompt, messages }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.map(b => b.text || "").join("") || "";
}

// ─── PROSPECTMASTERY CORE SYSTEM PROMPT ─────────────────────────────────────
// Baked in from both PDFs: M1_BDR_TRAINING_OVERVIEW + Key_Discovery_Questions
const PM_CORE = `You are an AI sales copilot built on PaceOps' ProspectMastery® methodology.

PROSPECTING OPERATING SYSTEM (POS) — 6 stages every rep must follow:
1. PROFILE: Ideal Customer Profile, Industry/Market Position, Decision Making Process
2. SEARCH: Defined Preparation, Timed Research, Advanced Curiosity
3. CONNECT: Extensive Outreach, MultiTouch Cadence, Professional Position
4. ENGAGE: Capture Attention, Develop Conversation, Journey of Discovery
5. ASSESS: Role/Ownership Clarity, Journey of Qualification, Shared Valuable Insights
6. INFLUENCE: Build Trust, Inspire Change, Gain Commitment

10 STEPS TO PROSPECTING SUCCESS (ProspectMastery modules):
1. Essential Prospecting   2. Power of Persuasion   3. Planning & Preparation
4. Script to Success       5. Insightful Questioning  6. Principal of Research
7. Decision-Based Mapping  8. Objection Handling      9. Winning Formula   10. Social Media Edge

PROSPECTING FUNNEL STAGES:
- Discovering: Search and find, create awareness, identify problems
- Sharing: Create consideration, share insights, highlight possible future
- Cultivating: Planned re-engagement, build confidence, time to influence
- Hand Over: Quality transfer to expert, detailed notes, expected pipeline value

EMPLOYEE CORE COMPETENCIES (weighted): Resilience (19%), Curiosity (19%), Persistence (18%), Coachable (17%), Active Listener (14%), Organised (13%)

CORE VALUES: Accountability, Control, Passion, Curiosity, Innovation

DISCOVERY QUESTION CATEGORIES & PURPOSE:
Growth & Expansion — qualifies intent, tests appetite, identifies strain, creates urgency
Customer Experience — strategic framing, identifies friction, quantifies impact, finds DM
Capability Building — assesses maturity, highlights fragility/risk, tests for next-step

CALL COACHING FRAMEWORK: Score hook, bridge, permission ask, pain probe, value statement, soft close, listening. Coach using ProspectMastery Lewin Force Field — address restraining forces (lack of confidence, comfort zones, resistance) while building driving forces (resilience, curiosity, persistence).

Always be direct, specific, and actionable. Avoid corporate fluff. Think like a top 1% B2B SDR.`;

// ─── STYLES ──────────────────────────────────────────────────────────────────
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #07080d;
  --bg2:      #0d0f18;
  --surface:  #111520;
  --surface2: #171c2e;
  --card:     #131828;
  --border:   rgba(99,120,255,0.12);
  --border2:  rgba(255,255,255,0.06);
  --border3:  rgba(255,255,255,0.03);
  --accent:   #6378ff;
  --accent2:  #a78bfa;
  --teal:     #2dd4bf;
  --green:    #34d399;
  --amber:    #fbbf24;
  --rose:     #fb7185;
  --text:     #e2e8ff;
  --text2:    #7a85a8;
  --text3:    #3d4560;
  --mono:     'JetBrains Mono', monospace;
  --sans:     'Outfit', sans-serif;
  --r:        10px;
  --r2:       16px;
}

body { background: var(--bg); color: var(--text); font-family: var(--sans); font-size: 14px; overflow: hidden; }
button { font-family: var(--sans); cursor: pointer; border: none; background: none; }
input, textarea, select { font-family: var(--sans); }
a { color: var(--accent2); text-decoration: none; }
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

@keyframes fadeIn  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@keyframes spin    { to { transform: rotate(360deg); } }
@keyframes pulse2  { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }

.fade-in  { animation: fadeIn 0.25s ease both; }
.spin     { animation: spin 0.7s linear infinite; }

/* ─── LAYOUT ─────────────────── */
.shell {
  display: grid;
  grid-template-columns: 56px 240px 1fr;
  grid-template-rows: 100vh;
  height: 100vh;
  overflow: hidden;
}

/* ─── ICON RAIL ──────────────── */
.rail {
  background: var(--bg);
  border-right: 1px solid var(--border3);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 0;
  gap: 6px;
  z-index: 10;
}

.rail-logo {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 800; color: #fff;
  font-family: var(--sans);
  margin-bottom: 10px;
  flex-shrink: 0;
}

.rail-btn {
  width: 36px; height: 36px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; color: var(--text3);
  transition: all 0.15s; cursor: pointer;
  position: relative;
}
.rail-btn:hover { background: var(--surface); color: var(--text2); }
.rail-btn.active { background: rgba(99,120,255,0.15); color: var(--accent); }
.rail-btn.active::before {
  content: ''; position: absolute; left: 0; top: 50%;
  transform: translateY(-50%);
  width: 2px; height: 60%; background: var(--accent);
  border-radius: 0 2px 2px 0;
}

.rail-spacer { flex: 1; }

/* ─── SIDEBAR ────────────────── */
.sidebar {
  background: var(--bg2);
  border-right: 1px solid var(--border3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px 14px 10px;
  border-bottom: 1px solid var(--border3);
}

.sidebar-title {
  font-size: 11px; font-weight: 600;
  color: var(--text3);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px;
}

.sidebar-section-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text3);
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 10px 8px 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.12s;
  font-size: 13px;
  color: var(--text2);
  font-weight: 400;
}
.nav-item:hover { background: var(--surface); color: var(--text); }
.nav-item.active { background: rgba(99,120,255,0.1); color: var(--text); }
.nav-item.active .nav-dot { background: var(--accent); }
.nav-item .nav-icon { font-size: 13px; width: 18px; text-align: center; flex-shrink: 0; }
.nav-item .nav-label { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nav-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); flex-shrink: 0; transition: background 0.15s; }

.new-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 12px;
  color: var(--text3);
  border: 1px dashed var(--border);
  transition: all 0.15s;
  margin-top: 4px;
}
.new-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(99,120,255,0.04); }

/* ─── MAIN ───────────────────── */
.main {
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  background: var(--bg);
}

.topbar {
  padding: 14px 24px;
  border-bottom: 1px solid var(--border3);
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg);
}

.topbar-title { font-size: 15px; font-weight: 600; color: var(--text); }
.topbar-sub   { font-size: 12px; color: var(--text3); margin-left: 2px; }

.topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }

.status-pill {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid var(--border);
  font-size: 11px; font-weight: 500;
  color: var(--teal);
  font-family: var(--mono);
}
.status-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--teal); animation: pulse2 2s infinite; }

.content-area { overflow-y: auto; padding: 24px; }

/* ─── CARDS ──────────────────── */
.card {
  background: var(--card);
  border: 1px solid var(--border2);
  border-radius: var(--r2);
  padding: 18px 20px;
  margin-bottom: 14px;
}

.card-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text3);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title   { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.page-sub     { font-size: 13px; color: var(--text2); margin-bottom: 20px; line-height: 1.6; }

/* ─── INPUTS ─────────────────── */
label  { display: block; font-size: 12px; font-weight: 500; color: var(--text2); margin-bottom: 5px; }

input[type="text"],
input[type="email"],
input[type="tel"],
textarea,
select {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border2);
  border-radius: var(--r);
  padding: 9px 12px;
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  margin-bottom: 12px;
}
input:focus, textarea:focus, select:focus { border-color: rgba(99,120,255,0.5); }
input::placeholder, textarea::placeholder { color: var(--text3); }
textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
select { cursor: pointer; appearance: none; }

/* ─── BUTTONS ────────────────── */
.btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 9px 18px;
  border-radius: var(--r);
  font-size: 13px; font-weight: 500;
  transition: all 0.15s; cursor: pointer;
}
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: #7a8fff; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-ghost { border: 1px solid var(--border2); color: var(--text2); }
.btn-ghost:hover { border-color: rgba(99,120,255,0.4); color: var(--text); }
.btn-danger { border: 1px solid rgba(251,113,133,0.3); color: var(--rose); }
.btn-danger:hover { background: rgba(251,113,133,0.08); }

.icon-btn {
  width: 28px; height: 28px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--text3);
  border: 1px solid var(--border2);
  transition: all 0.15s; cursor: pointer;
}
.icon-btn:hover { color: var(--text); border-color: var(--border); }

/* ─── GRID ───────────────────── */
.g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }

/* ─── RESULT ─────────────────── */
.result-box {
  background: var(--bg);
  border: 1px solid var(--border2);
  border-radius: var(--r);
  padding: 16px;
  font-size: 13px;
  line-height: 1.85;
  color: var(--text);
  white-space: pre-wrap;
  font-family: var(--sans);
}

.loading-row {
  display: flex; align-items: center; gap: 10px;
  font-size: 12px; color: var(--text3);
  font-family: var(--mono);
  padding: 14px 0;
}
.spinner-sm {
  width: 13px; height: 13px;
  border: 1.5px solid var(--border2);
  border-top-color: var(--accent);
  border-radius: 50%;
}

/* ─── SCORE BARS ─────────────── */
.score-row { margin-bottom: 11px; }
.score-row-header { display: flex; justify-content: space-between; font-size: 12px; color: var(--text2); margin-bottom: 5px; }
.score-track { height: 5px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
.score-fill  { height: 100%; border-radius: 3px; transition: width 0.5s ease; }

/* ─── TAGS ───────────────────── */
.tag {
  display: inline-flex; align-items: center;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px; font-weight: 600;
  font-family: var(--mono);
  letter-spacing: 0.3px;
}
.tag-accent { background: rgba(99,120,255,0.1); color: var(--accent2); border: 1px solid rgba(99,120,255,0.2); }
.tag-green  { background: rgba(52,211,153,0.1); color: var(--green); border: 1px solid rgba(52,211,153,0.2); }
.tag-amber  { background: rgba(251,191,36,0.1); color: var(--amber); border: 1px solid rgba(251,191,36,0.2); }
.tag-rose   { background: rgba(251,113,133,0.1); color: var(--rose); border: 1px solid rgba(251,113,133,0.2); }
.tag-teal   { background: rgba(45,212,191,0.1); color: var(--teal); border: 1px solid rgba(45,212,191,0.2); }

/* ─── METRIC CARDS ───────────── */
.metric-card {
  background: var(--bg);
  border: 1px solid var(--border2);
  border-radius: var(--r);
  padding: 14px 16px;
}
.metric-val   { font-size: 24px; font-weight: 700; color: var(--text); font-family: var(--sans); }
.metric-label { font-size: 11px; color: var(--text3); margin-top: 3px; }

/* ─── COPY BTN ───────────────── */
.copy-btn {
  font-size: 10px; font-family: var(--mono);
  color: var(--text3); padding: 2px 0;
  display: inline-flex; align-items: center; gap: 4px;
  cursor: pointer; transition: color 0.15s;
}
.copy-btn:hover { color: var(--accent2); }

/* ─── RANGE ──────────────────── */
.range-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.range-row label { margin: 0; min-width: 130px; font-size: 12px; }
input[type="range"] {
  flex: 1; accent-color: var(--accent);
  margin-bottom: 0; background: none; border: none; padding: 0;
}
.range-val { font-family: var(--mono); font-size: 12px; color: var(--accent2); min-width: 36px; text-align: right; }

/* ─── AUTH ───────────────────── */
.auth-wrap {
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg);
  padding: 20px;
}
.auth-card {
  background: var(--card);
  border: 1px solid var(--border2);
  border-radius: 20px;
  padding: 40px 36px;
  width: 100%; max-width: 400px;
}
.auth-logo {
  font-size: 26px; font-weight: 800;
  color: var(--text); margin-bottom: 6px;
}
.auth-logo span { color: var(--accent2); }

/* ─── PROJECT SELECTOR ───────── */
.project-pill {
  display: flex; align-items: center; gap: 6px;
  padding: 5px 10px; border-radius: 8px;
  background: var(--surface2); border: 1px solid var(--border2);
  font-size: 12px; color: var(--text2); cursor: pointer;
  transition: all 0.15s; max-width: 180px;
}
.project-pill:hover { border-color: var(--accent); color: var(--text); }
.project-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

.dropdown {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 200;
  background: var(--surface);
  border: 1px solid var(--border2);
  border-radius: 12px;
  padding: 6px;
  min-width: 220px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.6);
}
.dropdown-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 7px;
  cursor: pointer; font-size: 13px; color: var(--text2);
  transition: all 0.12s;
}
.dropdown-item:hover { background: var(--surface2); color: var(--text); }

/* ─── HISTORY LIST ───────────── */
.history-item {
  padding: 8px 10px; border-radius: 8px;
  cursor: pointer; transition: all 0.12s;
  font-size: 12px; color: var(--text2);
  border: 1px solid transparent;
}
.history-item:hover { background: var(--surface); color: var(--text); }
.history-item.active { background: var(--surface); border-color: var(--border2); color: var(--text); }
.history-date { font-size: 10px; color: var(--text3); font-family: var(--mono); margin-top: 2px; }

/* ─── DIVIDER ────────────────── */
.divider { height: 1px; background: var(--border3); margin: 14px 0; }

/* ─── TABS ───────────────────── */
.tab-strip { display: flex; gap: 2px; margin-bottom: 18px; }
.tab-pill {
  padding: 6px 14px; border-radius: 7px;
  font-size: 12px; font-weight: 500;
  color: var(--text3); cursor: pointer; transition: all 0.12s;
}
.tab-pill:hover { color: var(--text2); background: var(--surface); }
.tab-pill.active { background: rgba(99,120,255,0.12); color: var(--accent2); }

/* ─── QUESTION BANK ──────────── */
.q-card {
  background: var(--bg);
  border: 1px solid var(--border2);
  border-radius: var(--r);
  padding: 12px 14px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.12s;
}
.q-card:hover { border-color: rgba(99,120,255,0.3); background: var(--surface); }
.q-text { font-size: 13px; color: var(--text); line-height: 1.6; margin-bottom: 6px; }
.q-meta { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }

/* ─── CALL HISTORY MODAL ──────── */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 300;
  background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal {
  background: var(--card);
  border: 1px solid var(--border2);
  border-radius: 18px;
  padding: 28px;
  width: 100%; max-width: 600px;
  max-height: 85vh; overflow-y: auto;
  box-shadow: 0 32px 80px rgba(0,0,0,0.7);
}
.modal-title { font-size: 17px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.modal-sub   { font-size: 12px; color: var(--text3); margin-bottom: 20px; }

/* ─── TOAST ──────────────────── */
.toast-wrap {
  position: fixed; top: 14px; right: 14px; z-index: 999;
  display: flex; flex-direction: column; gap: 8px; pointer-events: none;
}
.toast {
  background: var(--surface);
  border: 1px solid var(--border2);
  border-left: 3px solid var(--teal);
  border-radius: 10px; padding: 10px 14px;
  font-size: 12px; color: var(--text2);
  animation: fadeIn 0.2s ease;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  max-width: 280px;
}
`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const timeAgo = (iso) => {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" }) : "";

const scoreColor = (s) => s >= 75 ? "var(--green)" : s >= 50 ? "var(--amber)" : "var(--rose)";

function Spinner() {
  return <div className="spinner-sm spin" />;
}

function Toast({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
    </div>
  );
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button className="copy-btn" onClick={() => {
      navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }}>
      {copied ? "✓ copied" : "⊕ copy"}
    </button>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr(""); setLoading(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name, display_name: name.split(" ")[0] } }
        });
        if (error) throw error;
        if (data.user) onAuth(data.user);
        else setErr("Check your email to confirm your account.");
      }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card fade-in">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,var(--accent),var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, margin: "0 auto 14px" }}>⚡</div>
          <div className="auth-logo">Pace<span>AI</span></div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>ProspectMastery® Intelligence Platform</div>
        </div>

        <div className="tab-strip" style={{ justifyContent: "center" }}>
          {["login", "signup"].map(m => (
            <button key={m} className={`tab-pill ${mode === m ? "active" : ""}`} onClick={() => setMode(m)}>
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {mode === "signup" && <>
          <label>Full name</label>
          <input type="text" placeholder="e.g. Solomon Snow" value={name} onChange={e => setName(e.target.value)} />
        </>}

        <label>Email</label>
        <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()} />

        <label>Password</label>
        <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()} />

        {err && <div style={{ fontSize: 12, color: "var(--rose)", marginBottom: 10 }}>{err}</div>}

        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
          onClick={submit} disabled={loading}>
          {loading ? <><Spinner /> Working...</> : mode === "login" ? "Sign in →" : "Create account →"}
        </button>
      </div>
    </div>
  );
}

// ─── PROJECT SELECTOR ─────────────────────────────────────────────────────────
function ProjectSelector({ projects, activeProject, onSelect, onNew, user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div className="project-pill" onClick={() => setOpen(o => !o)}>
        {activeProject ? <>
          <div className="project-dot" style={{ background: activeProject.colour || "var(--accent)" }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeProject.name}</span>
        </> : <span>Select project</span>}
        <span style={{ color: "var(--text3)", fontSize: 10, marginLeft: "auto" }}>▾</span>
      </div>
      {open && (
        <div className="dropdown">
          <div style={{ fontSize: 10, color: "var(--text3)", padding: "4px 10px 6px", letterSpacing: 1, fontWeight: 600, textTransform: "uppercase" }}>Projects</div>
          {projects.map(p => (
            <div key={p.id} className="dropdown-item" onClick={() => { onSelect(p); setOpen(false); }}>
              <div className="project-dot" style={{ background: p.colour || "var(--accent)" }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              {activeProject?.id === p.id && <span style={{ color: "var(--accent2)", fontSize: 10 }}>✓</span>}
            </div>
          ))}
          <div className="divider" style={{ margin: "4px 0" }} />
          <div className="dropdown-item" onClick={() => { onNew(); setOpen(false); }}>
            <span style={{ color: "var(--accent2)" }}>+</span>
            <span>New project</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── NEW PROJECT MODAL ────────────────────────────────────────────────────────
function NewProjectModal({ user, onSave, onClose }) {
  const [form, setForm] = useState({ name: "", company_name: "", industry: "", company_size: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.name.trim() || !form.company_name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from("projects").insert({
      owner_id: user.id, ...form,
      colour: ["#6378ff","#2dd4bf","#a78bfa","#34d399","#fbbf24"][Math.floor(Math.random() * 5)],
    }).select().single();
    if (!error && data) {
      await supabase.from("project_members").insert({ project_id: data.id, user_id: user.id, role: "owner" });
      onSave(data);
    }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        <div className="modal-title">New project</div>
        <div className="modal-sub">Each project is one target company — Stripe, Santander, Philips etc.</div>
        <div className="g2">
          <div><label>Project name *</label><input type="text" placeholder="e.g. Stripe — Pipeline Build" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label>Company name *</label><input type="text" placeholder="e.g. Stripe" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>Industry</label><input type="text" placeholder="e.g. Fintech" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
          <div><label>Company size</label>
            <select value={form.company_size} onChange={e => setForm({ ...form, company_size: e.target.value })}>
              <option value="">Unknown</option>
              {["1-10","11-50","51-200","201-500","501-1000","1000+"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={submit} disabled={loading || !form.name || !form.company_name}>
            {loading ? <><Spinner /> Creating...</> : "Create project →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PROSPECT ENRICHMENT ──────────────────────────────────────────────────────
function ProspectEnrichment({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ name: "", company: "", role: "", industry: "" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const run = async () => {
    if (!form.name || !form.company) return;
    setLoading(true); setResult("");

    const sys = `${PM_CORE}

TASK: Prospect Enrichment Report
Generate a structured pre-call research brief. Use the ProspectMastery SEARCH stage framework (Defined Preparation, Timed Research, Advanced Curiosity).

FORMAT:
COMPANY SNAPSHOT: (size estimate, likely revenue band, what they do)
ROLE INTELLIGENCE: (what this person likely owns, their KPIs, their pain points)
TRIGGER SIGNALS: (3 things that might make them receptive right now)
SMART OPENING ANGLES: (3 specific conversation openers tied to their world)
OBJECTIONS TO EXPECT: (2-3 likely pushbacks and how to flip them)
POS STAGE RECOMMENDATION: (which POS stage to open at and why)

Be specific. No generics. Think like you've spent 15 minutes researching this person.`;

    try {
      // Create AI session in Supabase
      const { data: sess } = await supabase.from("ai_sessions").insert({
        user_id: user.id,
        project_id: activeProject?.id || null,
        session_type: "prospect_research",
        title: `Research: ${form.name} @ ${form.company}`,
        context_snapshot: { form },
      }).select().single();
      if (sess) setSessionId(sess.id);

      const userMsg = `Prospect: ${form.name}\nCompany: ${form.company}\nRole: ${form.role || "Unknown"}\nIndustry: ${form.industry || "Unknown"}`;
      const text = await callClaude([{ role: "user", content: userMsg }], sys);
      setResult(text);

      // Save messages
      if (sess) {
        await supabase.from("ai_messages").insert([
          { session_id: sess.id, role: "user", content: userMsg, tool_used: "prospect_enrichment" },
          { session_id: sess.id, role: "assistant", content: text, tool_used: "prospect_enrichment" },
        ]);
      }

      // If project active, log activity
      if (activeProject) {
        await supabase.from("activity_log").insert({
          user_id: user.id, project_id: activeProject.id,
          action_type: "enrichment_run", entity_type: "contact",
          entity_name: `${form.name} @ ${form.company}`,
          description: `Prospect enrichment run for ${form.name}`,
        });
      }
      addToast("Enrichment saved to session history");
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-title">Prospect Enrichment</div>
      <div className="page-sub">Research brief built on the ProspectMastery SEARCH stage — Defined Preparation, Timed Research, Advanced Curiosity.</div>

      <div className="card">
        <div className="card-label">Prospect details</div>
        <div className="g2">
          <div><label>Full name *</label><input type="text" placeholder="e.g. Sarah Mitchell" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label>Company *</label><input type="text" placeholder="e.g. Stripe" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>Job title</label><input type="text" placeholder="e.g. VP of Sales" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
          <div><label>Industry</label><input type="text" placeholder="e.g. Fintech" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !form.name || !form.company}>
          {loading ? <><Spinner /> Researching...</> : "◈ Enrich prospect"}
        </button>
      </div>

      {loading && <div className="loading-row"><Spinner /> Running ProspectMastery research protocol...</div>}

      {result && (
        <div className="card">
          <div className="card-label">
            Research brief — {form.name} @ {form.company}
            <CopyBtn text={result} />
          </div>
          <div className="result-box">{result}</div>
        </div>
      )}
    </div>
  );
}

// ─── CALL BRIEF ───────────────────────────────────────────────────────────────
function CallBrief({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ prospect: "", company: "", product: "", objective: "book_meeting", context: "", pos_stage: "engage" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const objectives = [
    { value: "book_meeting", label: "Book discovery meeting" },
    { value: "qualify", label: "Qualify the lead" },
    { value: "reactivate", label: "Re-activate cold lead" },
    { value: "referral", label: "Get a referral / intro" },
    { value: "permission_to_operate", label: "Permission to Operate" },
  ];

  const posStages = [
    { value: "profile", label: "Profile — ICP research call" },
    { value: "search", label: "Search — first outreach" },
    { value: "connect", label: "Connect — outreach sequence" },
    { value: "engage", label: "Engage — live discovery" },
    { value: "assess", label: "Assess — qualification" },
    { value: "influence", label: "Influence — building trust" },
  ];

  const run = async () => {
    if (!form.prospect || !form.company) return;
    setLoading(true); setResult("");
    const sys = `${PM_CORE}

TASK: Pre-Call Brief (60-second read format)
Build a ProspectMastery-aligned call brief. Reference the POS stage selected.

FORMAT:
OBJECTIVE: (one sentence, what success looks like)
PROSPECT SNAPSHOT: (3 bullet points — company, role, likely situation)
OPENING LINE: (word-for-word 15-second opener — natural, human, not salesy)
[PAUSE] markers where silence is strategic
KEY DISCOVERY QUESTIONS: (2-3 ProspectMastery-style questions for this call stage)
TOP VALUE PROPS: (2 specific, no buzzwords)
LIKELY OBJECTIONS: (2 with snappy flip responses)
CALL CLOSE: (exact words to ask for the next step)

POS stage for this call: ${form.pos_stage}`;

    const content = `Prospect: ${form.prospect}\nCompany: ${form.company}\nProduct/Service: ${form.product || "outsourced SDR services"}\nObjective: ${objectives.find(o => o.value === form.objective)?.label}\nPOS Stage: ${form.pos_stage}\nContext: ${form.context || "None"}`;
    try {
      const text = await callClaude([{ role: "user", content }], sys);
      setResult(text);

      const { data: sess } = await supabase.from("ai_sessions").insert({
        user_id: user.id, project_id: activeProject?.id || null,
        session_type: "call_brief",
        title: `Call brief: ${form.prospect} @ ${form.company}`,
        context_snapshot: { form },
      }).select().single();
      if (sess) {
        await supabase.from("ai_messages").insert([
          { session_id: sess.id, role: "user", content, tool_used: "call_brief" },
          { session_id: sess.id, role: "assistant", content: text, tool_used: "call_brief" },
        ]);
      }
      addToast("Call brief saved");
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-title">Call Brief Generator</div>
      <div className="page-sub">60-second pre-call brief aligned to your POS stage — opening line, discovery questions, objection handlers, and close script.</div>

      <div className="card">
        <div className="card-label">Call setup</div>
        <div className="g2">
          <div><label>Prospect name *</label><input type="text" placeholder="e.g. James O'Brien" value={form.prospect} onChange={e => setForm({ ...form, prospect: e.target.value })} /></div>
          <div><label>Company *</label><input type="text" placeholder="e.g. Santander" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>What are you selling?</label><input type="text" placeholder="e.g. Outsourced SDR team" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} /></div>
          <div><label>Call objective</label>
            <select value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })}>
              {objectives.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="g2">
          <div><label>POS stage (ProspectMastery)</label>
            <select value={form.pos_stage} onChange={e => setForm({ ...form, pos_stage: e.target.value })}>
              {posStages.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div><label>Extra context</label><input type="text" placeholder="Trigger event, previous interaction..." value={form.context} onChange={e => setForm({ ...form, context: e.target.value })} /></div>
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !form.prospect || !form.company}>
          {loading ? <><Spinner /> Building...</> : "◉ Generate call brief"}
        </button>
      </div>

      {loading && <div className="loading-row"><Spinner /> Applying ProspectMastery framework...</div>}
      {result && (
        <div className="card">
          <div className="card-label">Call brief — {form.prospect}<CopyBtn text={result} /></div>
          <div className="result-box">{result}</div>
        </div>
      )}
    </div>
  );
}

// ─── ICP SCORER ───────────────────────────────────────────────────────────────
function ICPScorer({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ company: "", industry: "", size: "51-200", role: "", budget: "unknown", pain: "", techStack: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!form.company) return;
    setLoading(true); setResult(null);
    const sys = `${PM_CORE}

TASK: ICP Scoring Engine
Score this prospect against PaceOps' Ideal Customer Profile. Use ProspectMastery PROFILE stage criteria.
Return ONLY valid JSON, no markdown, no preamble.

Format: {"overall":85,"dimensions":{"companyFit":80,"roleAuthority":90,"budgetSignal":70,"painAlignment":95,"timingSignal":75,"icpMatch":80},"priority":"HIGH","funnel_stage":"discovering","pos_recommendation":"engage","verdict":"One clear sentence verdict","strengths":["specific strength 1","specific strength 2"],"risks":["specific risk 1"],"nextAction":"Specific ProspectMastery-aligned first move","pm_approach":"Which ProspectMastery module or technique to lead with"}

Priority: HIGH (75+), MEDIUM (50-74), LOW (<50)
Funnel stage: discovering | sharing | cultivating | handover
POS recommendation: profile | search | connect | engage | assess | influence`;

    const content = `Company: ${form.company}\nIndustry: ${form.industry}\nSize: ${form.size}\nDecision Maker Role: ${form.role}\nBudget: ${form.budget}\nPain points: ${form.pain}\nTech stack: ${form.techStack}`;
    try {
      const text = await callClaude([{ role: "user", content }], sys);
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);

      // Save to Supabase — update contact ICP score if contact matches
      const { data: sess } = await supabase.from("ai_sessions").insert({
        user_id: user.id, project_id: activeProject?.id || null,
        session_type: "icp_scoring",
        title: `ICP Score: ${form.company}`,
        context_snapshot: { form, result: parsed },
      }).select().single();
      if (sess) {
        await supabase.from("ai_messages").insert([
          { session_id: sess.id, role: "user", content, tool_used: "icp_scoring" },
          { session_id: sess.id, role: "assistant", content: text, tool_used: "icp_scoring" },
        ]);
      }
      if (activeProject) {
        await supabase.from("activity_log").insert({
          user_id: user.id, project_id: activeProject.id,
          action_type: "icp_scored", entity_name: form.company,
          description: `ICP scored ${parsed.overall}/100 — ${parsed.priority}`,
        });
      }
      addToast(`${form.company}: ${parsed.priority} priority (${parsed.overall}/100)`);
    } catch (e) { setResult({ error: text || e.message }); }
    setLoading(false);
  };

  const priorityTag = p => p === "HIGH" ? "tag-green" : p === "MEDIUM" ? "tag-amber" : "tag-rose";

  return (
    <div className="fade-in">
      <div className="page-title">ICP Scorer</div>
      <div className="page-sub">Score any prospect using the ProspectMastery PROFILE stage — ICP fit, role authority, budget signal, pain alignment, timing.</div>

      <div className="card">
        <div className="card-label">Prospect profile</div>
        <div className="g2">
          <div><label>Company *</label><input type="text" placeholder="Company name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          <div><label>Industry</label><input type="text" placeholder="e.g. Fintech" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>Company size</label>
            <select value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
              {["1-10","11-50","51-200","201-500","501-1000","1000+"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div><label>Decision maker's role</label><input type="text" placeholder="e.g. Chief Revenue Officer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>Budget signal</label>
            <select value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })}>
              <option value="unknown">Unknown</option>
              <option value="confirmed">Confirmed budget</option>
              <option value="likely">Likely has budget</option>
              <option value="tight">Budget constrained</option>
            </select>
          </div>
          <div><label>Tech stack</label><input type="text" placeholder="e.g. Salesforce, Outreach" value={form.techStack} onChange={e => setForm({ ...form, techStack: e.target.value })} /></div>
        </div>
        <label>Known pain points / trigger events</label>
        <textarea placeholder="Hiring freezes, missed targets, new CRO, funding round..." value={form.pain} onChange={e => setForm({ ...form, pain: e.target.value })} style={{ minHeight: 64 }} />
        <button className="btn btn-primary" onClick={run} disabled={loading || !form.company}>
          {loading ? <><Spinner /> Scoring...</> : "◆ Score this prospect"}
        </button>
      </div>

      {loading && <div className="loading-row"><Spinner /> Running ProspectMastery ICP analysis...</div>}

      {result && !result.error && (
        <div className="card fade-in">
          <div className="card-label">ICP Score — {form.company}</div>
          <div className="g3" style={{ marginBottom: 16 }}>
            <div className="metric-card">
              <div className="metric-val" style={{ color: scoreColor(result.overall) }}>{result.overall}</div>
              <div className="metric-label">Overall ICP score</div>
            </div>
            <div className="metric-card">
              <span className={`tag ${priorityTag(result.priority)}`}>{result.priority}</span>
              <div className="metric-label" style={{ marginTop: 8 }}>Priority tier</div>
            </div>
            <div className="metric-card">
              <span className="tag tag-teal">{result.funnel_stage}</span>
              <div className="metric-label" style={{ marginTop: 8 }}>Funnel stage</div>
            </div>
          </div>

          {Object.entries(result.dimensions || {}).map(([key, val]) => {
            const labels = { companyFit: "Company Fit", roleAuthority: "Role Authority", budgetSignal: "Budget Signal", painAlignment: "Pain Alignment", timingSignal: "Timing Signal", icpMatch: "ICP Match" };
            return (
              <div className="score-row" key={key}>
                <div className="score-row-header"><span>{labels[key] || key}</span><span style={{ color: scoreColor(val) }}>{val}/100</span></div>
                <div className="score-track"><div className="score-fill" style={{ width: val + "%", background: scoreColor(val) }} /></div>
              </div>
            );
          })}

          <div className="divider" />
          <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--teal)" }}>Verdict: </strong>{result.verdict}<br /><br />
            <strong>Recommended POS stage: </strong><span className="tag tag-accent">{result.pos_recommendation}</span><br /><br />
            <strong>ProspectMastery approach: </strong>{result.pm_approach}<br /><br />
            <strong>Next action: </strong>{result.nextAction}
            {result.strengths?.length > 0 && <><br /><br /><strong>Strengths: </strong>{result.strengths.join(" · ")}</>}
            {result.risks?.length > 0 && <><br /><strong>Watch out for: </strong>{result.risks.join(" · ")}</>}
          </div>
        </div>
      )}
      {result?.error && <div className="result-box">{result.error}</div>}
    </div>
  );
}

// ─── SCRIPT BUILDER ───────────────────────────────────────────────────────────
function ScriptBuilder({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ prospect: "", company: "", role: "", product: "", tone: "consultative", trigger: "", pos_stage: "engage" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const tones = [
    { value: "consultative", label: "Consultative & curious" },
    { value: "confident", label: "Confident & direct" },
    { value: "challenger", label: "Challenger — provoke thinking" },
    { value: "brief", label: "Hyper-brief (30 sec)" },
  ];

  const run = async () => {
    if (!form.prospect || !form.company) return;
    setLoading(true); setResult("");
    const sys = `${PM_CORE}

TASK: Cold Call Script (Script to Success — ProspectMastery Module 4)
Write a personalised word-for-word script in ${form.tone} style.
Apply the 10-step ProspectMastery framework as appropriate for POS stage: ${form.pos_stage}

MANDATORY STRUCTURE:
HOOK: (references something specific — their LinkedIn post, news, role change, company milestone)
[PAUSE] — let it land
BRIDGE: (one sentence connecting their world to what you offer)
PERMISSION ASK: (low-friction — "Does that make sense to talk about for 2 minutes?")
PAIN PROBE: (one sharp insightful question from the ProspectMastery discovery bank)
[PAUSE]
VALUE STATEMENT: (specific, commercial, no buzzwords — what you've done for similar companies)
SOFT CLOSE: (clear ask, one specific next step)

Use [PAUSE] markers strategically. Write the way a top performer actually speaks — direct, respectful, curious. Never corporate.`;

    const content = `Prospect: ${form.prospect}, ${form.role || "decision maker"} at ${form.company}\nProduct: ${form.product || "outsourced SDR / prospecting services"}\nTone: ${form.tone}\nPOS stage: ${form.pos_stage}\nPersonalisation trigger: ${form.trigger || "Use their role and company type to infer context"}`;
    try {
      const text = await callClaude([{ role: "user", content }], sys);
      setResult(text);
      const { data: sess } = await supabase.from("ai_sessions").insert({
        user_id: user.id, project_id: activeProject?.id || null,
        session_type: "script_builder", title: `Script: ${form.prospect} @ ${form.company}`,
        context_snapshot: { form },
      }).select().single();
      if (sess) {
        await supabase.from("ai_messages").insert([
          { session_id: sess.id, role: "user", content, tool_used: "script_builder" },
          { session_id: sess.id, role: "assistant", content: text, tool_used: "script_builder" },
        ]);
      }
      addToast("Script saved to session history");
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-title">Script Builder</div>
      <div className="page-sub">Personalised word-for-word script using ProspectMastery Module 4 (Script to Success) — not a template, built for your specific prospect.</div>

      <div className="card">
        <div className="card-label">Script parameters</div>
        <div className="g2">
          <div><label>Prospect name *</label><input type="text" placeholder="e.g. Claire Dunne" value={form.prospect} onChange={e => setForm({ ...form, prospect: e.target.value })} /></div>
          <div><label>Company *</label><input type="text" placeholder="e.g. Philips" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>Their role</label><input type="text" placeholder="e.g. Head of Sales Operations" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
          <div><label>What are you selling?</label><input type="text" placeholder="e.g. Outsourced SDR team" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>Script tone</label>
            <select value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })}>
              {tones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><label>POS stage</label>
            <select value={form.pos_stage} onChange={e => setForm({ ...form, pos_stage: e.target.value })}>
              {["profile","search","connect","engage","assess","influence"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <label>Personalisation trigger (optional)</label>
        <input type="text" placeholder="e.g. Posted about hiring 4 new AEs, won a contract, company just rebranded..." value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} />
        <button className="btn btn-primary" onClick={run} disabled={loading || !form.prospect || !form.company}>
          {loading ? <><Spinner /> Writing...</> : "◇ Generate script"}
        </button>
      </div>

      {loading && <div className="loading-row"><Spinner /> Crafting personalised ProspectMastery script...</div>}
      {result && (
        <div className="card">
          <div className="card-label">Script — {form.prospect} @ {form.company}<CopyBtn text={result} /></div>
          <div className="result-box">{result}</div>
        </div>
      )}
    </div>
  );
}

// ─── CALL COACH ───────────────────────────────────────────────────────────────
function CallCoach({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ transcript: "", outcome: "voicemail", talkRatio: 65, duration: 3, objections: 1, pos_stage: "engage" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [callReviewId, setCallReviewId] = useState(null);

  const outcomes = [
    { value: "meeting_booked", label: "Meeting booked ✓" },
    { value: "callback_requested", label: "Callback requested" },
    { value: "not_interested", label: "Not interested" },
    { value: "voicemail", label: "Left voicemail" },
    { value: "gatekeeper", label: "Blocked by gatekeeper" },
    { value: "no_answer", label: "No answer" },
  ];

  const run = async () => {
    setLoading(true); setResult("");
    const sys = `${PM_CORE}

TASK: Call Coaching Review (ProspectMastery Coaching Framework)
You are an elite PaceOps call coach. Apply the Lewin Force Field — identify restraining forces holding this rep back and driving forces to build on.

STRUCTURE:
CALL RATING: X/10

COMPETENCY SCORES (ProspectMastery framework — score each 0-10):
• Organised (prep & structure): X/10
• Curiosity (depth of questioning): X/10
• Active Listening (prospect talk time): X/10
• Persistence (handling objections): X/10
• Resilience (recovery from pushback): X/10

WHAT WORKED: (2-3 specifics — find positives even in a bad call)

BIGGEST MISS: (the single most impactful thing that hurt outcome)

LINE-BY-LINE MOMENTS: (2-3 specific moments with word-for-word better alternatives)

DRILL THIS (ProspectMastery exercise): (one specific practice drill)

LEWIN FORCE FIELD — RESTRAINING FORCES: (what held this rep back today)

ONE CHANGE FOR NEXT CALL: (most impactful single change)

Be direct. Real coaches tell the truth. Reference ProspectMastery methodology.`;

    const content = `Call outcome: ${form.outcome}\nPOS stage: ${form.pos_stage}\nRep talk ratio: ${form.talkRatio}% (prospect: ${100 - form.talkRatio}%)\nDuration: ${form.duration} minutes\nObjections handled: ${form.objections}\nTranscript/notes: ${form.transcript || "None — coach on metrics only"}`;
    try {
      const text = await callClaude([{ role: "user", content }], sys, 1400);
      setResult(text);

      // Save call review to Supabase
      const { data: review } = await supabase.from("call_reviews").insert({
        user_id: user.id,
        project_id: activeProject?.id || null,
        called_at: new Date().toISOString(),
        duration_minutes: parseFloat(form.duration) || null,
        call_outcome: form.outcome,
        rep_talk_ratio: form.talkRatio,
        objection_count: form.objections,
        pos_stage: form.pos_stage,
        transcript: form.transcript || null,
        coaching_feedback: text,
        post_call_notes: form.transcript,
      }).select().single();

      if (review) {
        setCallReviewId(review.id);
        // AI session
        const { data: sess } = await supabase.from("ai_sessions").insert({
          user_id: user.id, project_id: activeProject?.id || null,
          session_type: "call_coach", title: `Call review ${fmt(new Date())}`,
          context_snapshot: { form, call_review_id: review.id },
        }).select().single();
        if (sess) {
          await supabase.from("ai_messages").insert([
            { session_id: sess.id, role: "user", content, tool_used: "call_coach" },
            { session_id: sess.id, role: "assistant", content: text, tool_used: "call_coach" },
          ]);
        }
      }
      addToast("Call review saved to history");
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-title">Call Coach</div>
      <div className="page-sub">ProspectMastery call review — competency scoring, Lewin Force Field analysis, line-by-line feedback, and a specific drill to improve.</div>

      <div className="card">
        <div className="card-label">Call data</div>
        <div className="g2">
          <div><label>Call outcome</label>
            <select value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>
              {outcomes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div><label>POS stage</label>
            <select value={form.pos_stage} onChange={e => setForm({ ...form, pos_stage: e.target.value })}>
              {["profile","search","connect","engage","assess","influence"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div className="range-row">
          <label>Rep talk ratio</label>
          <input type="range" min={20} max={90} step={5} value={form.talkRatio} onChange={e => setForm({ ...form, talkRatio: +e.target.value })} />
          <span className="range-val">{form.talkRatio}%</span>
        </div>
        <div className="range-row">
          <label>Duration (mins)</label>
          <input type="range" min={1} max={30} step={1} value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })} />
          <span className="range-val">{form.duration}m</span>
        </div>
        <div className="range-row">
          <label>Objections handled</label>
          <input type="range" min={0} max={8} step={1} value={form.objections} onChange={e => setForm({ ...form, objections: +e.target.value })} />
          <span className="range-val">{form.objections}</span>
        </div>

        <label>Transcript or call notes (paste here — the more detail, the better the coaching)</label>
        <textarea placeholder="Paste full transcript or write what was said on the call..." value={form.transcript} onChange={e => setForm({ ...form, transcript: e.target.value })} style={{ minHeight: 120 }} />

        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? <><Spinner /> Analysing...</> : "◎ Get coaching feedback"}
        </button>
      </div>

      {loading && <div className="loading-row"><Spinner /> ProspectMastery coach reviewing your call...</div>}
      {result && (
        <div className="card">
          <div className="card-label">Coaching report — {fmt(new Date())}<CopyBtn text={result} /></div>
          <div className="result-box">{result}</div>
          {callReviewId && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 10, fontFamily: "var(--mono)" }}>✓ Saved to call history · ID {callReviewId.slice(0, 8)}</div>}
        </div>
      )}
    </div>
  );
}

// ─── FOLLOW-UP DRAFTER ────────────────────────────────────────────────────────
function FollowupDrafter({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ prospect: "", company: "", outcome: "meeting_booked", summary: "", format: "email", pos_stage: "engage" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const outcomes = [
    { value: "meeting_booked", label: "Meeting was booked" },
    { value: "send_info", label: "Sending info first" },
    { value: "callback_requested", label: "Promised callback" },
    { value: "not_interested", label: "Not now — nurture" },
    { value: "referral", label: "Referred to someone else" },
  ];

  const run = async () => {
    if (!form.prospect) return;
    setLoading(true); setResult("");
    const sys = `${PM_CORE}

TASK: Post-Call Follow-up (ProspectMastery MultiTouch Cadence — POS Connect/Influence stage)
Write a follow-up ${form.format} that moves the prospect forward in the funnel.

Rules:
- Under 120 words for email, under 70 for LinkedIn/WhatsApp
- Reference something specific from the call
- One clear next step only
- No "I hope this finds you well"
- No corporate fluff
- Write like a real person who genuinely wants to help
- Reference the appropriate ProspectMastery funnel stage (Sharing → Cultivating → Hand Over)
- If meeting booked: confirm details, build excitement, reduce friction
- If not yet booked: create gentle urgency around their specific pain`;

    const content = `Prospect: ${form.prospect} at ${form.company || "their company"}\nOutcome: ${form.outcome}\nPOS stage: ${form.pos_stage}\nCall highlights: ${form.summary || "General prospecting call"}\nFormat: ${form.format}`;
    try {
      const text = await callClaude([{ role: "user", content }], sys);
      setResult(text);
      const { data: sess } = await supabase.from("ai_sessions").insert({
        user_id: user.id, project_id: activeProject?.id || null,
        session_type: "follow_up", title: `Follow-up: ${form.prospect}`,
        context_snapshot: { form },
      }).select().single();
      if (sess) {
        await supabase.from("ai_messages").insert([
          { session_id: sess.id, role: "user", content, tool_used: "follow_up" },
          { session_id: sess.id, role: "assistant", content: text, tool_used: "follow_up" },
        ]);
      }
      addToast("Follow-up saved");
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-title">Follow-up Drafter</div>
      <div className="page-sub">Human-sounding follow-up using ProspectMastery MultiTouch Cadence — aligned to your POS stage and funnel position.</div>

      <div className="card">
        <div className="card-label">Call summary</div>
        <div className="g2">
          <div><label>Prospect name *</label><input type="text" placeholder="e.g. Tom Walsh" value={form.prospect} onChange={e => setForm({ ...form, prospect: e.target.value })} /></div>
          <div><label>Company</label><input type="text" placeholder="e.g. Kodak Alaris" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>Call outcome</label>
            <select value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>
              {outcomes.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div><label>Format</label>
            <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}>
              <option value="email">Email</option>
              <option value="LinkedIn message">LinkedIn message</option>
              <option value="WhatsApp message">WhatsApp</option>
            </select>
          </div>
        </div>
        <label>What was discussed / key moments from the call</label>
        <textarea placeholder="e.g. Struggling to hit pipeline targets, 3 new AEs starting Q3, interested in training programme..." value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
        <button className="btn btn-primary" onClick={run} disabled={loading || !form.prospect}>
          {loading ? <><Spinner /> Drafting...</> : "◐ Draft follow-up"}
        </button>
      </div>

      {loading && <div className="loading-row"><Spinner /> Writing your ProspectMastery follow-up...</div>}
      {result && (
        <div className="card">
          <div className="card-label">Follow-up {form.format} — {form.prospect}<CopyBtn text={result} /></div>
          <div className="result-box">{result}</div>
        </div>
      )}
    </div>
  );
}

// ─── DISCOVERY QUESTIONS ──────────────────────────────────────────────────────
function DiscoveryQuestions({ user, activeProject, addToast }) {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genContext, setGenContext] = useState({ industry: "", role: "", pos_stage: "engage" });
  const [aiQuestions, setAiQuestions] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: cats }, { data: qs }] = await Promise.all([
      supabase.from("discovery_question_categories").select("*").order("position"),
      supabase.from("discovery_questions").select("*, discovery_question_categories(name, colour)").order("usage_count", { ascending: false }),
    ]);
    setCategories(cats || []);
    setQuestions(qs || []);
    if (cats?.length) setActiveCategory(cats[0].id);
    setLoading(false);
  };

  const filtered = activeCategory ? questions.filter(q => q.category_id === activeCategory) : questions;

  const generateSituational = async () => {
    if (!genContext.industry && !genContext.role) return;
    setGenerating(true); setAiQuestions("");
    const sys = `${PM_CORE}

TASK: Generate situational discovery questions (ProspectMastery Module 5 — Insightful Questioning)
Generate 6 sharp, specific discovery questions for this prospect profile.
Questions must be insightful — not surface level. They should make the prospect think.
Format: numbered list with purpose in brackets after each question. 
Apply the ProspectMastery question framework: strategic framing → forces focus → identifies weakness → creates urgency → identifies DM → next step`;

    const content = `Industry: ${genContext.industry || "Unknown"}\nRole: ${genContext.role || "Senior leader"}\nPOS Stage: ${genContext.pos_stage}\nProject context: ${activeProject?.company_name || "General B2B"}`;
    try {
      const text = await callClaude([{ role: "user", content }], sys);
      setAiQuestions(text);
      addToast("Situational questions generated");
    } catch (e) { setAiQuestions("Error: " + e.message); }
    setGenerating(false);
  };

  const catColors = { "Growth & Expansion": "var(--accent2)", "Customer Experience": "var(--teal)", "Capability Building": "var(--green)", "Objection Handling": "var(--amber)", "Decision Mapping": "var(--rose)", "Urgency & Risk": "var(--accent)" };

  return (
    <div className="fade-in">
      <div className="page-title">Discovery Questions</div>
      <div className="page-sub">ProspectMastery Module 5 — Insightful Questioning. 30+ questions from the Key Discovery Questions framework, plus AI-generated situational questions.</div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-label">Generate situational questions</div>
        <div className="g2" style={{ marginBottom: 10 }}>
          <div><label>Industry / sector</label><input type="text" placeholder="e.g. Document Management, Fintech" value={genContext.industry} onChange={e => setGenContext({ ...genContext, industry: e.target.value })} /></div>
          <div><label>Decision maker role</label><input type="text" placeholder="e.g. VP of Sales, CRO" value={genContext.role} onChange={e => setGenContext({ ...genContext, role: e.target.value })} /></div>
        </div>
        <button className="btn btn-primary" onClick={generateSituational} disabled={generating || (!genContext.industry && !genContext.role)}>
          {generating ? <><Spinner /> Generating...</> : "⚡ Generate situational questions"}
        </button>
        {aiQuestions && (
          <div className="result-box" style={{ marginTop: 12 }}>
            <CopyBtn text={aiQuestions} />
            <div style={{ marginTop: 4 }}>{aiQuestions}</div>
          </div>
        )}
      </div>

      <div className="tab-strip" style={{ flexWrap: "wrap" }}>
        <button className={`tab-pill ${!activeCategory ? "active" : ""}`} onClick={() => setActiveCategory(null)}>All ({questions.length})</button>
        {categories.map(c => (
          <button key={c.id} className={`tab-pill ${activeCategory === c.id ? "active" : ""}`} onClick={() => setActiveCategory(c.id)}>
            {c.name} ({questions.filter(q => q.category_id === c.id).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-row"><Spinner /> Loading question bank...</div>
      ) : (
        filtered.map(q => (
          <div key={q.id} className="q-card" onClick={() => navigator.clipboard?.writeText(q.question_text).then(() => addToast("Copied to clipboard"))}>
            <div className="q-text">{q.question_text}</div>
            <div className="q-meta">
              {q.purpose && <span style={{ fontSize: 11, color: "var(--text3)", fontStyle: "italic" }}>{q.purpose}</span>}
              <span className="tag tag-accent">{q.call_stage}</span>
              {q.pos_stage && <span className="tag tag-teal">{q.pos_stage}</span>}
              {q.usage_count > 0 && <span style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginLeft: "auto" }}>used {q.usage_count}×</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── CALL HISTORY ─────────────────────────────────────────────────────────────
function CallHistory({ user, activeProject }) {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadReviews(); }, [activeProject]);

  const loadReviews = async () => {
    setLoading(true);
    let query = supabase.from("call_reviews").select("*").eq("user_id", user.id).order("called_at", { ascending: false }).limit(100);
    if (activeProject) query = query.eq("project_id", activeProject.id);
    const { data } = await query;
    setReviews(data || []);
    setLoading(false);
  };

  const searchResults = reviews.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return [r.transcript, r.post_call_notes, r.coaching_feedback, r.call_outcome].join(" ").toLowerCase().includes(q);
  });

  const outcomeColors = { meeting_booked: "var(--green)", callback_requested: "var(--teal)", not_interested: "var(--rose)", voicemail: "var(--text3)", gatekeeper: "var(--amber)", no_answer: "var(--text3)" };

  return (
    <div className="fade-in">
      <div className="page-title">Call History</div>
      <div className="page-sub">Search past call reviews by date, outcome, or transcript content. Every coaching session is persisted and searchable.</div>

      <div style={{ position: "relative", marginBottom: 14 }}>
        <input type="text" placeholder="Search by transcript content, date, outcome..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-60%)", color: "var(--text3)", fontSize: 14, pointerEvents: "none" }}>⌕</span>
      </div>

      {loading ? (
        <div className="loading-row"><Spinner /> Loading call history...</div>
      ) : searchResults.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)", fontSize: 13 }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>📞</div>
          {search ? "No calls match your search" : "No call reviews yet — run the Call Coach to start"}
        </div>
      ) : (
        searchResults.map(r => (
          <div key={r.id} className="card" style={{ cursor: "pointer", marginBottom: 10 }} onClick={() => setSelected(r)}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className="tag" style={{ background: `${outcomeColors[r.call_outcome] || "var(--text3)"}15`, color: outcomeColors[r.call_outcome] || "var(--text3)", border: `1px solid ${outcomeColors[r.call_outcome] || "var(--text3)"}30` }}>
                    {r.call_outcome?.replace(/_/g, " ")}
                  </span>
                  {r.pos_stage && <span className="tag tag-accent">{r.pos_stage}</span>}
                  <span style={{ fontSize: 11, color: "var(--text3)", fontFamily: "var(--mono)", marginLeft: "auto" }}>{timeAgo(r.called_at)}</span>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text2)" }}>
                  {r.duration_minutes && <span>⏱ {r.duration_minutes}m</span>}
                  {r.rep_talk_ratio && <span>🎙 {r.rep_talk_ratio}% rep</span>}
                  {r.objection_count > 0 && <span>🛡 {r.objection_count} objections</span>}
                </div>
                {r.coaching_feedback && (
                  <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6, lineHeight: 1.5 }}>
                    {r.coaching_feedback.slice(0, 120)}...
                  </div>
                )}
              </div>
              <div style={{ fontSize: 18, color: "var(--text3)" }}>›</div>
            </div>
          </div>
        ))
      )}

      {selected && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div className="modal-title">Call Review</div>
              <CopyBtn text={[selected.transcript, selected.coaching_feedback].filter(Boolean).join("\n\n---\n\n")} />
            </div>
            <div className="modal-sub">{fmt(selected.called_at)} · {selected.call_outcome?.replace(/_/g, " ")} · {selected.duration_minutes}m · {selected.rep_talk_ratio}% rep talk</div>

            {selected.transcript && <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Transcript</div>
              <div className="result-box" style={{ marginBottom: 14, maxHeight: 200, overflowY: "auto", fontSize: 12 }}>{selected.transcript}</div>
            </>}

            {selected.coaching_feedback && <>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Coaching feedback</div>
              <div className="result-box" style={{ maxHeight: 300, overflowY: "auto" }}>{selected.coaching_feedback}</div>
            </>}

            <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 14 }} onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SESSION HISTORY (sidebar) ────────────────────────────────────────────────
function SessionHistory({ user, sessions, activeTool }) {
  const filtered = sessions.filter(s => {
    const toolMap = { enrich: "prospect_research", brief: "call_brief", score: "icp_scoring", script: "script_builder", coach: "call_coach", followup: "follow_up", questions: "discovery_questions" };
    return !activeTool || s.session_type === toolMap[activeTool];
  }).slice(0, 12);

  if (!filtered.length) return (
    <div style={{ padding: "12px 10px", fontSize: 12, color: "var(--text3)" }}>No sessions yet</div>
  );

  return (
    <div>
      {filtered.map(s => (
        <div key={s.id} className="history-item">
          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title || "Untitled session"}</div>
          <div className="history-date">{timeAgo(s.last_message_at)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const TOOLS = [
  { id: "enrich",    label: "Enrichment",    icon: "◈", rail: "🔍" },
  { id: "brief",     label: "Call Brief",    icon: "◉", rail: "📋" },
  { id: "score",     label: "ICP Score",     icon: "◆", rail: "◆" },
  { id: "script",    label: "Script",        icon: "◇", rail: "✍" },
  { id: "coach",     label: "Call Coach",    icon: "◎", rail: "🎙" },
  { id: "followup",  label: "Follow-up",     icon: "◐", rail: "✉" },
  { id: "questions", label: "Questions",     icon: "❓", rail: "❓" },
  { id: "history",   label: "Call History",  icon: "📞", rail: "📞" },
];

const PANELS = {
  enrich: ProspectEnrichment,
  brief: CallBrief,
  score: ICPScorer,
  script: ScriptBuilder,
  coach: CallCoach,
  followup: FollowupDrafter,
  questions: DiscoveryQuestions,
  history: CallHistory,
};

export default function App() {
  const [user, setUser] = useState(undefined);
  const [activeTool, setActiveTool] = useState("enrich");
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // Load projects
  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => {
        setProjects(data || []);
        if (data?.length && !activeProject) setActiveProject(data[0]);
      });
  }, [user]);

  // Load sessions
  useEffect(() => {
    if (!user) return;
    supabase.from("ai_sessions").select("*").eq("user_id", user.id).order("last_message_at", { ascending: false }).limit(30)
      .then(({ data }) => setSessions(data || []));
  }, [user, activeTool]);

  const addToast = useCallback((msg) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (user === undefined) return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid var(--border2)", borderTopColor: "var(--accent)" }} className="spin" />
    </div>
  );

  if (!user) return (
    <>
      <style>{STYLES}</style>
      <AuthScreen onAuth={u => setUser(u)} />
      <Toast toasts={toasts} />
    </>
  );

  const Panel = PANELS[activeTool];
  const activeTool_ = TOOLS.find(t => t.id === activeTool);

  return (
    <>
      <style>{STYLES}</style>
      <div className="shell">

        {/* ─── ICON RAIL ─── */}
        <div className="rail">
          <div className="rail-logo">P</div>
          {TOOLS.map(t => (
            <button key={t.id} className={`rail-btn ${activeTool === t.id ? "active" : ""}`} title={t.label} onClick={() => setActiveTool(t.id)}>
              {t.rail}
            </button>
          ))}
          <div className="rail-spacer" />
          <button className="rail-btn" title="Sign out" onClick={signOut} style={{ marginBottom: 4 }}>⎋</button>
        </div>

        {/* ─── SIDEBAR ─── */}
        <div className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-title">PaceAI</div>
            <ProjectSelector projects={projects} activeProject={activeProject} onSelect={setActiveProject} onNew={() => setShowNewProject(true)} user={user} />
          </div>
          <div className="sidebar-scroll">
            <div className="sidebar-section-label">Recent sessions</div>
            <SessionHistory user={user} sessions={sessions} activeTool={activeTool} />

            <div className="divider" />
            <div className="sidebar-section-label">Tools</div>
            {TOOLS.map(t => (
              <div key={t.id} className={`nav-item ${activeTool === t.id ? "active" : ""}`} onClick={() => setActiveTool(t.id)}>
                <span className="nav-icon">{t.rail}</span>
                <span className="nav-label">{t.label}</span>
                <div className="nav-dot" />
              </div>
            ))}
          </div>
        </div>

        {/* ─── MAIN ─── */}
        <div className="main">
          <div className="topbar">
            <span style={{ fontSize: 16 }}>{activeTool_?.rail}</span>
            <span className="topbar-title">{activeTool_?.label}</span>
            {activeProject && (
              <span className="topbar-sub">· {activeProject.company_name}</span>
            )}
            <div className="topbar-right">
              {activeProject && (
                <div className="status-pill">
                  <div className="status-dot" />
                  {activeProject.pos_stage || "profile"}
                </div>
              )}
              <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--mono)" }}>
                {user.email?.split("@")[0]}
              </div>
            </div>
          </div>

          <div className="content-area">
            <Panel key={activeTool} user={user} activeProject={activeProject} addToast={addToast} />
          </div>
        </div>
      </div>

      {showNewProject && (
        <NewProjectModal user={user} onClose={() => setShowNewProject(false)} onSave={(p) => {
          setProjects(prev => [p, ...prev]);
          setActiveProject(p);
          setShowNewProject(false);
          addToast(`Project "${p.name}" created`);
        }} />
      )}

      <Toast toasts={toasts} />
    </>
  );
}