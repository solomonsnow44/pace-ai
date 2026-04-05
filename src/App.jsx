import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

// ─── FULL PM_CORE INCLUDING MODULE 1 ─────────────────────────────────────────
const PM_CORE = `You are an AI sales copilot built on PaceOps' ProspectMastery® methodology.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 1 — ESSENTIAL PROSPECTING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODERN SELLING — 4 KEY CHARACTERISTICS:
1. BUYER-CENTRIC ENGAGEMENT: Buyers are more informed and empowered than ever. They don't want to be sold to — they want help making better decisions. Map the buying committee (who influences, who decides, who blocks). Understand trigger events that signal real interest. Adapt messaging to the buyer's journey (awareness → evaluation → decision). Build credibility early by helping buyers gain clarity, not just pushing demos.
2. VALUE-LED PERSONALISATION AT SCALE: Spray-and-pray is dead. Use intent data, CRM insights, and LinkedIn signals to shape outreach. Craft messaging that focuses on business problems, not product features. Tap into persona-based pain points while layering in relevant context (funding, job changes, growth). Balance automation with human touch.
3. MULTI-CHANNEL, MULTI-TOUCH STRATEGY: It takes 8–12+ touches to engage a decision-maker. Build a structured cadence across email, phone, LinkedIn, video, and text. Vary touch types (value drops, social engagement, voice notes, referrals). Align messages around a central narrative that evolves over time. Each interaction should build recognition, reinforce credibility, and invite conversation — not just chase meetings.
4. QUALIFICATION AS A SERVICE: BDRs are the first step in a consultative sales process. The goal is to guide, not push. Qualify for true fit, urgency, and mutual value — not just budget or timing. Frame qualification to help the buyer self-discover fit. Focus on quality of conversations, not just quantity of meetings booked.

PROSPECTING ACKNOWLEDGEMENT — REALITY CHECK:
- You are interrupting people. They are not expecting you.
- It can be difficult and awkward. You cannot control their response.
- Accept this reality and use the methodology to stack the odds in your favour.

NEUROSCIENCE IN PROSPECTING — THE CROC BRAIN:
The brain has three parts: CROC BRAIN (primal/instinctive — survival, fight-or-flight), MID-BRAIN (social/emotional — meaning, motivation), NEOCORTEX (logical/intellectual — reasoning, decision-making).
THE CRITICAL DISCONNECT: You go outbound using your Neocortex brain (logical, detailed, value-rich). But your message is received by the prospect's CROC brain (primal, threat-scanning, short attention span). This is a serious concern.
CROC BRAIN FILTERING SYSTEM: The croc brain asks two questions — "Is this an emergency?" and "Can this be ignored?" If your opening doesn't pass this filter, it gets discarded.
CROC BRAIN RECEIVER ESSENTIALS: They will ignore you if possible. They only focus on the bigger picture. They respond with emotion. They are focused on the here and now. They need concrete facts. They have a very short attention span.
HOW TO FILTER TO THE CROC BRAIN: Make messaging Simple, Clear, Non-threatening, and Intriguing. Start by addressing a fundamental need or pain point they will recognise immediately, triggering curiosity or urgency. Incorporate social proof or authority signals to reduce perceived risk. Keep your message concise — avoid overwhelming with too many options or details at once.

BUYER DECISION MAKING JOURNEY — 5 STAGES (Gates in the funnel):
1. OBLIVIOUS — No knowledge of who you are or how you can support them. Your job: create awareness.
2. CREDIBLE — They now appreciate who you are and what you represent. Your job: establish trust.
3. RELEVANT — They recognise how your offerings could potentially address a need or pain point. Your job: make it personal.
4. INTERESTING — They admit interest in exploring and evaluating further. Your job: deepen the conversation.
5. PREFERENCE — They acknowledge that an appointment is a valuable use of their time. Your job: gain the commitment.
Always calibrate your outreach and calls to the buyer's current gate. Don't try to jump from Oblivious to Preference in one call.

PACEOPS PROSPECTING FUNNEL:
Top (red) — Prospect Intel + Resource Excellence (your preparation and research layer)
Middle (blue, narrowing) — Credible → Relevant → Interesting → Preference (buyer journey through gates)
Bottom — Intent to Buy → VALUE £ + CONV % → ROI
Left side = Buying Behaviour | Right side = Selling Behaviour
This funnel is OUTCOME BASED. Every action drives toward ROI.

ICP — IDEAL CUSTOMER PROFILE:
Your ICP is a comprehensive description of your perfect customer. Components: Industry, Company Size, Geography, Revenues, Buying Process, Decision Makers, Business Goals, Pain Points, Technology Stack, Attributes. Always qualify against ICP before investing time in a prospect.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROSPECTING OPERATING SYSTEM (POS) — 6 STAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. PROFILE: Ideal Customer Profile, Industry/Market Position, Decision Making Process
   — Fit with ICP, Key Stakeholders, Market Standing
2. SEARCH: Defined Preparation, Timed Research, Advanced Curiosity
   — Clearly understand target client characteristics, use advanced search filters, monitor LinkedIn, use AI tools
3. CONNECT: Extensive Outreach, MultiTouch Cadence, Professional Position
   — First impressions matter. Personalised, well-thought-out approach. Adapt based on prospect preferences.
4. ENGAGE: Capture Attention, Develop Conversation, Journey of Discovery
   — Critical step. Build trust. Earn the right for more time. Create a holding position.
5. ASSESS: Role/Ownership Clarity, Journey of Qualification, Shared Valuable Insights
   — Understand job function relevance. Determine if prospect is aware of problem. Position as credible advisor.
6. INFLUENCE: Build Trust, Inspire Change, Gain Commitment
   — Share success stories. Build intrigue and urgency. Guide decision-makers toward change. Transform passive buyer into active one.

10 PROSPECTMASTERY MODULES:
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

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 5 — INSIGHTFUL QUESTIONING (OctaQ Framework)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

QUESTION TYPES: Open (gather insights), Closed (confirm facts), Clarifying (remove ambiguity), Probing (dig deeper), Leading (guide thinking), Prioritising (identify most critical), Hypothetical (future-focused), Confirmation (verify details).

ACTIVE LISTENING STYLE: Paraphrasing ("What I hear you saying is…"), Precision ("Help me better understand…"), Reflective (mirror emotions/concerns), Summarising ("To recap, your main concerns are…").

OCTAQ FRAMEWORK — 8-stage question sequence every call should follow:
1. BUSINESS BACKGROUND — Role, org structure, team size, tech stack, recent changes
2. DECISION MAKING — Who owns the decision? Who else is involved? What's the process? Past obstacles?
3. DISCOVERY — Current pain points, inefficiencies, goals for next 6-12 months, satisfaction with current solution
4. QUALIFICATION — What happens if unresolved? Consequences of inaction? Risk to business goals?
5. CHALLENGE — What benefits if solved? What would resolution mean for team productivity/customer satisfaction?
6. BUDGET — How does budgeting work? Typical range? Approval process? Constraints?
7. TIMEFRAMES — Decision timeline? Contract renewal? Steps before final decision? External factors?
8. NEXT ACTIONS — Specific ask for next step with day/time — never leave a call without a committed next action

KEY PRINCIPLE: A strategic question sequence builds naturally toward a close. By the time you ask for commitment, the conversation has led there organically. Ask ONE sharp insightful question at a time — never fire a list of surface-level questions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODULE 7 — DECISION BASED MAPPING (DMU Framework)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CORE INSIGHT: Around 86% of B2B purchases stall. The average buying group includes 10–11 stakeholders (15+ for multinationals). 84% of B2B decisions are influenced by peer recommendations. The org chart shows formal structure — but deals are shaped by INFORMAL influence (trusted inner circle, political dynamics, hidden risks).

DECISION MAKING UNIT (DMU) — 6 roles to identify and map:
- DECISION MAKER: Has ultimate authority and budget sign-off. Can say YES and fund it.
- PROFESSIONAL BUYER (Procurement): Controls purchase process, ensures value. Can block or delay.
- RECOMMENDER: Evaluates options and makes formal recommendation for/against.
- INFLUENCER: Opinions matter to the decision maker regardless of title.
- END USER: Will use the solution — active in evaluation, champions internally.
- DETRACTOR: Wants a different outcome. Delays, discourages, restricts information, highlights flaws.

CENTRALISED vs DECENTRALISED:
- Centralised (Startups, SMBs, regulated industries): Fewer DMs, faster decisions, clear authority
- Decentralised (Enterprises, matrix orgs): Many stakeholders, consensus-driven, slower, more complex

FORMAL vs INFORMAL INFLUENCE: Deals close with formal buy-in — but are often shaped by informal influence. Always map both. The person who actually decides is often NOT the most senior person in the room.

PROBLEM OWNER vs BUDGET OWNER: These are often different people. The problem owner experiences the pain. The budget owner controls the spend and may have completely different priorities. You need both.

POWER BUYERS (Finance & IT): Research shows IT and Finance departments are most influential across ALL buying decisions. Always consider who in IT and Finance needs to be part of your DMU map.

PROCUREMENT & FRAMEWORK AGREEMENTS: Many organisations operate framework agreements (umbrella contracts, typically 4-year max). If procurement is involved, understand the framework — being on framework or not can be a deal-maker/breaker.

DIRECTION OF TRAVEL PRINCIPLE: Always understand which direction an organisation is moving strategically before positioning your solution. Link what you offer to where they're going, not just where they are.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCOVERY QUESTION CATEGORIES:
Growth & Expansion — qualifies intent, tests appetite, identifies strain, creates urgency
Customer Experience — strategic framing, identifies friction, quantifies impact, finds DM
Capability Building — assesses maturity, highlights fragility/risk, tests for next-step

CALL COACHING FRAMEWORK: Score hook, bridge, permission ask, pain probe, value statement, soft close, listening. Coach using ProspectMastery Lewin Force Field — address restraining forces (lack of confidence, comfort zones, resistance) while building driving forces (resilience, curiosity, persistence).

CROC BRAIN FILTER FOR ALL OUTPUTS: Every hook, opening line, and outreach message must pass the Croc Brain test — Is it Simple? Is it Clear? Is it Non-threatening? Is it Intriguing? If it doesn't pass, rewrite it.

Always be direct, specific, and actionable. Avoid corporate fluff. Think like a top 1% B2B SDR. Apply OctaQ sequencing and DMU awareness in every output.`;

// ─── THEME ───────────────────────────────────────────────────────────────────
const LIGHT = {
  mode: "light",
  bg: "#F4F6F9",
  bgCard: "#FFFFFF",
  bgAlt: "#F0F2F5",
  bgElevated: "#FFFFFF",
  sidebar: "#FFFFFF",
  rail: "#F8F9FB",
  border: "rgba(15,23,42,0.08)",
  borderMed: "rgba(15,23,42,0.13)",
  accent: "#0C69C8",
  accentHover: "#0A58A8",
  accentSub: "rgba(12,105,200,0.07)",
  accentBorder: "rgba(12,105,200,0.18)",
  text: "#0F172A",
  textSec: "#475569",
  textMuted: "#94A3B8",
  green: "#059669",
  greenBg: "rgba(5,150,105,0.07)",
  amber: "#D97706",
  amberBg: "rgba(217,119,6,0.07)",
  rose: "#DC2626",
  roseBg: "rgba(220,38,38,0.07)",
  teal: "#0284C7",
  tealBg: "rgba(2,132,199,0.07)",
  shadow: "0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.06)",
  shadowLg: "0 8px 32px rgba(15,23,42,0.10)",
  scrollbar: "rgba(15,23,42,0.10)",
};

const DARK = {
  mode: "dark",
  bg: "#060C1A",
  bgCard: "#0D1526",
  bgAlt: "#111D30",
  bgElevated: "#0D1526",
  sidebar: "#0A1020",
  rail: "#080E1C",
  border: "rgba(255,255,255,0.07)",
  borderMed: "rgba(255,255,255,0.12)",
  accent: "#1A7AFF",
  accentHover: "#4D9FFF",
  accentSub: "rgba(26,122,255,0.10)",
  accentBorder: "rgba(26,122,255,0.20)",
  text: "#F1F5F9",
  textSec: "#8FA8CC",
  textMuted: "#3D5475",
  green: "#00D68F",
  greenBg: "rgba(0,214,143,0.08)",
  amber: "#FFAA00",
  amberBg: "rgba(255,170,0,0.08)",
  rose: "#FF4D6D",
  roseBg: "rgba(255,77,109,0.08)",
  teal: "#00C2E0",
  tealBg: "rgba(0,194,224,0.08)",
  shadow: "0 1px 3px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.25)",
  shadowLg: "0 8px 32px rgba(0,0,0,0.45)",
  scrollbar: "rgba(255,255,255,0.08)",
};

const makeStyles = (C) => `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }

  html, body, #root { width: 100%; height: 100%; min-height: 100vh; }

  :root {
    --bg: ${C.bg}; --bg-card: ${C.bgCard}; --bg-alt: ${C.bgAlt}; --bg-elevated: ${C.bgElevated};
    --sidebar: ${C.sidebar}; --rail: ${C.rail}; --border: ${C.border}; --border-med: ${C.borderMed};
    --accent: ${C.accent}; --accent-hover: ${C.accentHover}; --accent-sub: ${C.accentSub}; --accent-border: ${C.accentBorder};
    --text: ${C.text}; --text-sec: ${C.textSec}; --text-muted: ${C.textMuted};
    --green: ${C.green}; --green-bg: ${C.greenBg}; --amber: ${C.amber}; --amber-bg: ${C.amberBg};
    --rose: ${C.rose}; --rose-bg: ${C.roseBg}; --teal: ${C.teal}; --teal-bg: ${C.tealBg};
    --shadow: ${C.shadow}; --shadow-lg: ${C.shadowLg}; --scrollbar: ${C.scrollbar};
    --sans: 'DM Sans', sans-serif; --display: 'Sora', sans-serif; --mono: 'JetBrains Mono', monospace;
    --r: 10px; --r-lg: 16px;
  }

  body { font-family: var(--sans); background: var(--bg); color: var(--text); font-size: 14px; transition: background 0.2s ease, color 0.2s ease; }
  button { font-family: var(--sans); cursor: pointer; border: none; background: none; color: inherit; }
  input, textarea, select { font-family: var(--sans); }
  a { color: var(--accent); text-decoration: none; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: var(--scrollbar); border-radius: 4px; }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }

  .fade-in { animation: fadeIn 0.25s ease both; }
  .spin { animation: spin 0.7s linear infinite; }

  .shell { display: grid; grid-template-columns: 240px 1fr; grid-template-rows: 100vh; height: 100vh; width: 100vw; overflow: hidden; position: fixed; top: 0; left: 0; right: 0; bottom: 0; }

  .sidebar { background: var(--sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; transition: background 0.2s ease; }
  .sidebar-top { padding: 20px 16px 16px; border-bottom: 1px solid var(--border); }
  .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
  .brand-mark { width: 32px; height: 32px; border-radius: 9px; background: var(--accent); display: flex; align-items: center; justify-content: center; font-family: var(--display); font-size: 14px; font-weight: 800; color: #fff; flex-shrink: 0; box-shadow: 0 4px 12px rgba(12,105,200,0.30); }
  .brand-name { font-family: var(--display); font-size: 16px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; }
  .brand-name em { color: var(--accent); font-style: normal; }

  .project-btn { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: var(--r); background: var(--bg-alt); border: 1px solid var(--border); font-size: 12px; font-weight: 500; color: var(--text-sec); cursor: pointer; transition: all 0.15s; text-align: left; }
  .project-btn:hover { border-color: var(--accent-border); color: var(--text); }
  .project-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

  .sidebar-scroll { flex: 1; overflow-y: auto; padding: 12px 8px; }
  .nav-section { font-size: 10px; font-weight: 700; color: var(--text-muted); letter-spacing: 1.2px; text-transform: uppercase; padding: 10px 8px 5px; }
  .nav-item { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-sec); transition: all 0.13s; animation: slideIn 0.2s ease both; }
  .nav-item:hover { background: var(--bg-alt); color: var(--text); }
  .nav-item.active { background: var(--accent-sub); color: var(--accent); font-weight: 600; }
  .nav-item .nav-icon { font-size: 14px; width: 20px; text-align: center; flex-shrink: 0; }
  .nav-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--border); flex-shrink: 0; margin-left: auto; transition: background 0.15s; }
  .nav-item.active .nav-dot { background: var(--accent); }

  .sidebar-bottom { padding: 12px 8px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 2px; }
  .user-row { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 8px; font-size: 12px; color: var(--text-sec); }
  .user-avatar { width: 26px; height: 26px; border-radius: 50%; background: var(--accent-sub); border: 1px solid var(--accent-border); display: flex; align-items: center; justify-content: center; font-family: var(--display); font-size: 10px; font-weight: 700; color: var(--accent); flex-shrink: 0; }

  .main { display: grid; grid-template-rows: 56px 1fr; overflow: hidden; background: var(--bg); min-width: 0; width: 100%; }
  .topbar { padding: 0 28px; display: flex; align-items: center; gap: 12px; background: var(--bg-card); border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .topbar-title { font-family: var(--display); font-size: 15px; font-weight: 700; color: var(--text); }
  .topbar-sub { font-size: 12px; color: var(--text-muted); }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }

  .icon-btn { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; background: var(--bg-alt); border: 1px solid var(--border); color: var(--text-sec); font-size: 13px; cursor: pointer; transition: all 0.15s; }
  .icon-btn:hover { border-color: var(--accent-border); color: var(--accent); }

  .pill-status { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; background: var(--accent-sub); border: 1px solid var(--accent-border); font-size: 11px; font-weight: 600; color: var(--accent); font-family: var(--mono); }
  .pulse-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; }

.content-area { overflow-y: auto; padding: 28px 36px; width: 100%; }
  .page-header { margin-bottom: 22px; }
  .page-title { font-family: var(--display); font-size: 20px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; margin-bottom: 4px; display: flex; align-items: center; gap: 10px; }
  .page-accent { display: inline-block; width: 3px; height: 20px; background: var(--accent); border-radius: 2px; flex-shrink: 0; }
  .page-sub { font-size: 13px; color: var(--text-sec); line-height: 1.6; }

  .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 22px 24px; box-shadow: var(--shadow); margin-bottom: 16px; }
  .card-label { font-size: 10px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }

  label { display: block; font-size: 12px; font-weight: 600; color: var(--text-sec); margin-bottom: 5px; }
  input[type="text"], input[type="email"], input[type="tel"], input[type="password"], textarea, select { width: 100%; background: var(--bg); border: 1px solid var(--border-med); border-radius: var(--r); padding: 10px 13px; color: var(--text); font-size: 13px; outline: none; transition: border-color 0.15s, box-shadow 0.15s; margin-bottom: 14px; }
  input:focus, textarea:focus, select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-sub); }
  input::placeholder, textarea::placeholder { color: var(--text-muted); }
  textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
  select { cursor: pointer; appearance: none; }
  select option { background: var(--bg-card); color: var(--text); }
  input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus { -webkit-box-shadow: 0 0 0 30px var(--bg) inset !important; -webkit-text-fill-color: var(--text) !important; }

  .btn { display: inline-flex; align-items: center; gap: 7px; padding: 10px 20px; border-radius: var(--r); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .btn-primary { background: var(--accent); color: #fff; box-shadow: 0 2px 10px rgba(12,105,200,0.25); }
  .btn-primary:hover:not(:disabled) { background: var(--accent-hover); box-shadow: 0 4px 18px rgba(12,105,200,0.35); }
  .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: none; }
  .btn-outline { border: 1px solid var(--border-med); color: var(--text-sec); background: var(--bg-card); }
  .btn-outline:hover { border-color: var(--accent-border); color: var(--text); }
  .btn-danger { border: 1px solid var(--roseBg); color: var(--rose); background: var(--rose-bg); }
  .btn-danger:hover { opacity: 0.85; }
  .btn-sm { padding: 7px 14px; font-size: 12px; }

  .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

  .result-box { background: var(--bg); border: 1px solid var(--border); border-radius: var(--r); padding: 18px 20px; font-size: 13px; line-height: 1.85; color: var(--text); white-space: pre-wrap; }

  .loading-row { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-muted); font-family: var(--mono); padding: 14px 0; }
  .spinner { width: 14px; height: 14px; border: 2px solid var(--border-med); border-top-color: var(--accent); border-radius: 50%; flex-shrink: 0; }

  .score-row { margin-bottom: 13px; }
  .score-header { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-sec); margin-bottom: 6px; font-weight: 500; }
  .score-track { height: 5px; background: var(--bg-alt); border-radius: 3px; overflow: hidden; }
  .score-fill { height: 100%; border-radius: 3px; transition: width 0.7s ease; }

  .tag { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 5px; font-size: 10px; font-weight: 700; font-family: var(--mono); letter-spacing: 0.2px; }
  .tag-blue  { background: var(--accent-sub); color: var(--accent); border: 1px solid var(--accent-border); }
  .tag-green { background: var(--green-bg); color: var(--green); border: 1px solid rgba(5,150,105,0.20); }
  .tag-amber { background: var(--amber-bg); color: var(--amber); border: 1px solid rgba(217,119,6,0.20); }
  .tag-rose  { background: var(--rose-bg); color: var(--rose); border: 1px solid rgba(220,38,38,0.20); }
  .tag-teal  { background: var(--teal-bg); color: var(--teal); border: 1px solid rgba(2,132,199,0.20); }

  .metric-card { background: var(--bg); border: 1px solid var(--border); border-radius: var(--r); padding: 16px 18px; }
  .metric-val { font-family: var(--display); font-size: 28px; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
  .metric-lbl { font-size: 11px; color: var(--text-muted); margin-top: 3px; font-weight: 500; }

  .copy-btn { font-size: 10px; font-family: var(--mono); color: var(--text-muted); display: inline-flex; align-items: center; gap: 4px; cursor: pointer; transition: color 0.15s; padding: 2px 0; }
  .copy-btn:hover { color: var(--accent); }

  .range-row { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .range-row label { margin: 0; min-width: 140px; font-size: 12px; }
  input[type="range"] { flex: 1; accent-color: var(--accent); margin-bottom: 0; background: none; border: none; padding: 0; box-shadow: none; }
  .range-val { font-family: var(--mono); font-size: 12px; color: var(--accent); min-width: 38px; text-align: right; font-weight: 600; }

  .auth-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 20px; }
  .auth-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 40px 36px; width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); }

  .dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200; background: var(--bg-elevated); border: 1px solid var(--border-med); border-radius: 12px; padding: 5px; box-shadow: var(--shadow-lg); }
  .dropdown-item { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 7px; cursor: pointer; font-size: 13px; color: var(--text-sec); transition: all 0.12s; }
  .dropdown-item:hover { background: var(--bg-alt); color: var(--text); }
  .divider { height: 1px; background: var(--border); margin: 4px 0; }

  .modal-backdrop { position: fixed; inset: 0; z-index: 300; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 28px 30px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
  .modal-title { font-family: var(--display); font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .modal-sub { font-size: 12px; color: var(--text-muted); margin-bottom: 22px; }

  .toast-wrap { position: fixed; top: 16px; right: 16px; z-index: 999; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
  .toast { background: var(--bg-card); border: 1px solid var(--border-med); border-left: 3px solid var(--accent); border-radius: 10px; padding: 10px 14px; font-size: 12px; color: var(--text-sec); animation: fadeIn 0.2s ease; box-shadow: var(--shadow-lg); max-width: 280px; font-weight: 500; }

  .recent-item { padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 12px; color: var(--text-sec); transition: all 0.12s; border: 1px solid transparent; }
  .recent-item:hover { background: var(--bg-alt); color: var(--text); border-color: var(--border); }
  .recent-tool-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-family: var(--mono); color: var(--text-muted); margin-bottom: 3px; }
  .recent-title { font-size: 12px; font-weight: 500; color: var(--text-sec); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .recent-time { font-size: 10px; color: var(--text-muted); font-family: var(--mono); margin-top: 2px; }

  .call-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 16px 18px; margin-bottom: 10px; cursor: pointer; transition: all 0.13s; }
  .call-card:hover { border-color: var(--accent-border); box-shadow: var(--shadow); }

  .settings-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--r-lg); padding: 22px 24px; margin-bottom: 16px; box-shadow: var(--shadow); }
  .settings-title { font-family: var(--display); font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .settings-sub { font-size: 12px; color: var(--text-muted); margin-bottom: 18px; }

  .mobile-topbar { display: none; height: 52px; background: var(--bg-card); border-bottom: 1px solid var(--border); padding: 0 16px; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0; }
  .drawer-overlay { display: none; position: fixed; inset: 0; z-index: 98; background: rgba(0,0,0,0.4); }
  .drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; z-index: 99; background: var(--sidebar); border-right: 1px solid var(--border); display: flex; flex-direction: column; overflow: hidden; transform: translateX(-100%); transition: transform 0.25s ease; }
  .drawer.open { transform: translateX(0); }

  @media (max-width: 768px) {
    .shell { grid-template-columns: 1fr; grid-template-rows: 100vh; position: fixed; inset: 0; }
    .sidebar { display: none; }
    .mobile-topbar { display: flex; }
    .drawer-overlay { display: block; }
    .main { grid-template-rows: 52px 1fr; }
    .topbar { display: none; }
    .content-area { padding: 16px 16px 24px; }
    .g2 { grid-template-columns: 1fr; gap: 10px; }
    .g3 { grid-template-columns: 1fr; gap: 10px; }
    .range-row { flex-wrap: wrap; }
    .range-row label { min-width: 100%; }
  }

  @media (max-width: 480px) {
    .auth-card { padding: 28px 20px; }
    .card { padding: 16px; }
    .content-area { padding: 12px 12px 20px; }
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

// Tool metadata — single source of truth for labels, icons, descriptions
const TOOLS = [
  {
    id: "enrich",
    label: "Prospect Research",
    shortLabel: "Research",
    icon: "🔍",
    desc: "Pre-call intelligence brief — company snapshot, DMU map, trigger signals, smart opening angles.",
    sessionType: "prospect_research",
  },
  {
    id: "brief",
    label: "Call Planner",
    shortLabel: "Call Plan",
    icon: "📋",
    desc: "60-second pre-call brief with OctaQ-sequenced questions, DMU awareness, and word-for-word opener.",
    sessionType: "call_brief",
  },
  {
    id: "score",
    label: "ICP Fit Score",
    shortLabel: "ICP Score",
    icon: "◆",
    desc: "Score any prospect across 6 ICP dimensions plus DMU complexity and decision structure.",
    sessionType: "icp_scoring",
  },
  {
    id: "script",
    label: "Call Script",
    shortLabel: "Script",
    icon: "✍️",
    desc: "Word-for-word personalised script — Croc Brain filtered opener, OctaQ question, DMU-aware close.",
    sessionType: "script_builder",
  },
  {
    id: "coach",
    label: "Call Review & Coach",
    shortLabel: "Coaching",
    icon: "🎙️",
    desc: "Post-call coaching report — competency scores, OctaQ compliance, DMU progress, Lewin Force Field.",
    sessionType: "call_coach",
  },
  {
    id: "followup",
    label: "Follow-up Writer",
    shortLabel: "Follow-up",
    icon: "✉️",
    desc: "Human-sounding follow-up email or message — references specific call moments, one clear next step.",
    sessionType: "follow_up",
  },
  {
    id: "history",
    label: "Call History",
    shortLabel: "History",
    icon: "📞",
    desc: "Search and review all past call coaching reports.",
    sessionType: "call_history",
  },
];

const getToolMeta = (id) => TOOLS.find(t => t.id === id) || { label: id, icon: "○", shortLabel: id };
const getToolBySessionType = (type) => TOOLS.find(t => t.sessionType === type);

function Spinner() { return <div className="spinner spin" />; }
function Toast({ toasts }) { return <div className="toast-wrap">{toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}</div>; }
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button className="copy-btn" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
      {copied ? "✓ copied" : "⊕ copy"}
    </button>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function AuthScreen({ onAuth, isDark, onToggleTheme }) {
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
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name, display_name: name.split(" ")[0] } } });
        if (error) throw error;
        if (data.user) onAuth(data.user);
        else setErr("Check your email to confirm your account.");
      }
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <button className="icon-btn" onClick={onToggleTheme}>{isDark ? "☀️" : "🌙"}</button>
      </div>
      <div className="auth-card fade-in">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 13, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: "0 8px 20px rgba(12,105,200,0.35)" }}>
            <span style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 800, color: "#fff" }}>P</span>
          </div>
          <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>Pace<em style={{ color: "var(--accent)", fontStyle: "normal" }}>AI</em></div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>ProspectMastery® Intelligence Platform</div>
        </div>
        <div style={{ display: "flex", background: "var(--bg)", borderRadius: "var(--r)", padding: 3, marginBottom: 20, border: "1px solid var(--border)" }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "7px 12px", borderRadius: "7px", fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", background: mode === m ? "var(--accent)" : "none", color: mode === m ? "#fff" : "var(--text-sec)", transition: "all 0.15s" }}>
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        {mode === "signup" && <><label>Full name</label><input type="text" placeholder="e.g. Solomon Snow" value={name} onChange={e => setName(e.target.value)} /></>}
        <label>Email address</label>
        <input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
        <label>Password</label>
        <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
        {err && <div style={{ fontSize: 12, color: "var(--rose)", marginBottom: 10, padding: "8px 10px", background: "var(--rose-bg)", borderRadius: 7, border: "1px solid rgba(220,38,38,0.20)" }}>{err}</div>}
        <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={submit} disabled={loading}>
          {loading ? <><Spinner /> Working...</> : mode === "login" ? "Sign in →" : "Create account →"}
        </button>
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "var(--text-muted)" }}>Powered by PaceOps® ProspectMastery</div>
      </div>
    </div>
  );
}

// ─── PROJECT SELECTOR ─────────────────────────────────────────────────────────
function ProjectSelector({ projects, activeProject, onSelect, onNew }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div className="project-btn" onClick={() => setOpen(o => !o)}>
        {activeProject ? <>
          <div className="project-dot" style={{ background: activeProject.colour || "var(--accent)" }} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeProject.name}</span>
        </> : <span>Select project</span>}
        <span style={{ color: "var(--text-muted)", fontSize: 9, marginLeft: "auto" }}>▾</span>
      </div>
      {open && (
        <div className="dropdown">
          <div style={{ fontSize: 10, color: "var(--text-muted)", padding: "4px 10px 6px", letterSpacing: 1, fontWeight: 700, textTransform: "uppercase" }}>Projects</div>
          {projects.map(p => (
            <div key={p.id} className="dropdown-item" onClick={() => { onSelect(p); setOpen(false); }}>
              <div className="project-dot" style={{ background: p.colour || "var(--accent)" }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
              {activeProject?.id === p.id && <span style={{ color: "var(--accent)", fontSize: 11 }}>✓</span>}
            </div>
          ))}
          <div className="divider" />
          <div className="dropdown-item" onClick={() => { onNew(); setOpen(false); }}>
            <span style={{ color: "var(--accent)" }}>+</span><span>New project</span>
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
      colour: ["#0C69C8","#00C2E0","#059669","#D97706","#7C3AED"][Math.floor(Math.random() * 5)],
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
        <div className="modal-title">New Project</div>
        <div className="modal-sub">Each project targets one company — Stripe, Santander, Philips etc.</div>
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
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="btn btn-outline" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 2, justifyContent: "center" }} onClick={submit} disabled={loading || !form.name || !form.company_name}>
            {loading ? <><Spinner /> Creating...</> : "Create project →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── RECENT SESSIONS — smart labels based on tool type ───────────────────────
function RecentSessions({ sessions, onSelect, activeTool }) {
  const toolSessions = sessions.filter(s => {
    const tool = getToolBySessionType(s.session_type);
    return tool ? tool.id === activeTool : false;
  });
  const otherSessions = sessions.filter(s => {
    const tool = getToolBySessionType(s.session_type);
    return tool ? tool.id !== activeTool : true;
  });
  const displayed = [...toolSessions, ...otherSessions].slice(0, 12);

  if (!displayed.length) return (
    <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--text-muted)" }}>No recent activity</div>
  );

  return (
    <div>
      {displayed.map(s => {
        const tool = getToolBySessionType(s.session_type);
        const isCurrentTool = tool?.id === activeTool;
        return (
          <div key={s.id} className="recent-item" onClick={() => onSelect && onSelect(s)}>
            <div className="recent-tool-badge">
              <span style={{ fontSize: 10 }}>{tool?.icon || "○"}</span>
              <span style={{ color: isCurrentTool ? "var(--accent)" : "var(--text-muted)" }}>
                {tool?.shortLabel || s.session_type}
              </span>
            </div>
            <div className="recent-title">{s.title || "Untitled session"}</div>
            <div className="recent-time">{timeAgo(s.last_message_at)}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PROSPECT RESEARCH (was Enrichment) ──────────────────────────────────────
function ProspectEnrichment({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ name: "", company: "", role: "", industry: "" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!form.name || !form.company) return;
    setLoading(true); setResult("");
    const sys = `${PM_CORE}

TASK: Prospect Research Brief. Use ProspectMastery SEARCH stage framework.

Apply Module 7 DMU thinking — identify likely decision-making structure, who the problem owner vs budget owner might be, and what informal influence dynamics are likely at this company size/industry.

Apply Module 5 OctaQ thinking — which discovery categories are most relevant for this prospect, what question angles will resonate.

Apply Module 1 Buyer Journey thinking — identify which gate this prospect is likely at (Oblivious/Credible/Relevant/Interesting/Preference) and what that means for how you open.

Apply Croc Brain filtering — all suggested hooks and openers must pass the Simple, Clear, Non-threatening, Intriguing test.

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

COMPANY SNAPSHOT
(size estimate, revenue band, what they do, centralised vs decentralised decision-making, direction of travel)

ROLE INTELLIGENCE
(what this person likely owns, their KPIs, their pain points, their likely position in the DMU — are they the DM, recommender, influencer, or end user?)

DMU MAP
(who else is likely in the decision — probable Decision Maker, likely Procurement/Professional Buyer angle, key Influencers to identify, potential Detractors to watch for)

BUYER JOURNEY GATE
(which gate are they likely at and why — Oblivious/Credible/Relevant/Interesting/Preference — and what this means for your approach)

TRIGGER SIGNALS
(3 specific things that might make them receptive right now — company news, role change, industry trend, etc.)

CROC BRAIN OPENER
(One Croc Brain–filtered opening statement or question — Simple, Clear, Non-threatening, Intriguing — that will pass their filter and buy you 60 seconds)

SMART OCTAQ QUESTIONS
(3 sharp questions sequenced from Business Background → Decision Making → Discovery categories, specific to this prospect's world)

OBJECTIONS TO EXPECT
(2-3 likely pushbacks with ProspectMastery flip responses)

POS STAGE RECOMMENDATION
(which POS stage to open at and why — Profile/Search/Connect/Engage/Assess/Influence)

Be specific. No generic advice. Think like a top 1% SDR who has done their homework.`;
    try {
      const userMsg = `Prospect: ${form.name}\nCompany: ${form.company}\nRole: ${form.role || "Unknown"}\nIndustry: ${form.industry || "Unknown"}`;
      const text = await callClaude([{ role: "user", content: userMsg }], sys);
      setResult(text);
      const { data: sess } = await supabase.from("ai_sessions").insert({ user_id: user.id, project_id: activeProject?.id || null, session_type: "prospect_research", title: `Research: ${form.name} @ ${form.company}`, context_snapshot: { form } }).select().single();
      if (sess) await supabase.from("ai_messages").insert([{ session_id: sess.id, role: "user", content: userMsg, tool_used: "prospect_research" }, { session_id: sess.id, role: "assistant", content: text, tool_used: "prospect_research" }]);
      addToast("Research brief saved");
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title"><span className="page-accent" />Prospect Research</div>
        <div className="page-sub">Full pre-call intelligence brief — SEARCH stage prep with DMU map, Buyer Journey gate, Croc Brain–filtered opener, and OctaQ question sequence built in.</div>
      </div>
      <div className="card">
        <div className="card-label">Who are you researching?</div>
        <div className="g2">
          <div><label>Full name *</label><input type="text" placeholder="e.g. Sarah Mitchell" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label>Company *</label><input type="text" placeholder="e.g. Stripe" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>Their job title</label><input type="text" placeholder="e.g. VP of Sales" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
          <div><label>Industry</label><input type="text" placeholder="e.g. Fintech" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading || !form.name || !form.company}>
          {loading ? <><Spinner /> Researching...</> : "◈ Build research brief"}
        </button>
      </div>
      {loading && <div className="loading-row"><Spinner /> Running ProspectMastery research protocol...</div>}
      {result && (
        <div className="card">
          <div className="card-label">Research brief — {form.name} @ {form.company}<CopyBtn text={result} /></div>
          <div className="result-box">{result}</div>
        </div>
      )}
    </div>
  );
}

// ─── CALL PLANNER (was Call Brief) ───────────────────────────────────────────
function CallBrief({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ prospect: "", company: "", product: "", objective: "book_meeting", context: "", pos_stage: "engage", buyer_gate: "oblivious" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!form.prospect || !form.company) return;
    setLoading(true); setResult("");
    const sys = `${PM_CORE}

TASK: Pre-Call Planner (60-second read format). Build a ProspectMastery-aligned call plan.

Apply Module 1 — the Croc Brain test. The opening line MUST be Simple, Clear, Non-threatening, and Intriguing. It must pass the croc brain filter — "Is this an emergency? Can this be ignored?"

Apply OctaQ Module 5 — sequence questions naturally so the call flows from Business Background → Decision Making → Discovery → Qualification → Challenge → Next Actions. Ask ONE sharp question at a time, never a list.

Apply DMU Module 7 — flag who this person likely is in the buying unit and what that means for how to open and what to uncover.

Calibrate to Buyer Gate: ${form.buyer_gate} — adjust the objective and approach accordingly.

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

OBJECTIVE
(one sentence — what success looks like on this call)

PROSPECT SNAPSHOT
• [DMU role this person likely plays]
• [Their likely top priority right now]
• [One thing that makes them receptive]

CROC BRAIN OPENER
(word-for-word 15-second opener that passes Simple/Clear/Non-threatening/Intriguing — then [PAUSE])

PERMISSION ASK
(low-friction — "Does that make sense to talk about for 2 minutes?")

KEY OCTAQ QUESTION
(ONE sharp question from Business Background or Discovery category — specific to this company/role — then [PAUSE] and listen fully)

QUALIFICATION ANGLE
(ONE follow-up question to test urgency or cost of inaction)

TOP VALUE PROPS
1. [Specific, commercial, no buzzwords]
2. [Specific, commercial, no buzzwords]

LIKELY OBJECTIONS
• [Objection] → [Flip response]
• [Objection] → [Flip response]

CALL CLOSE
(exact words to ask for the next step — specific day/time ask, never leave without a committed next action)

POS STAGE: ${form.pos_stage}`;

    const content = `Prospect: ${form.prospect}\nCompany: ${form.company}\nProduct/Service: ${form.product || "outsourced SDR services"}\nObjective: ${form.objective}\nPOS Stage: ${form.pos_stage}\nBuyer Gate: ${form.buyer_gate}\nContext: ${form.context || "None"}`;
    try {
      const text = await callClaude([{ role: "user", content }], sys);
      setResult(text);
      const { data: sess } = await supabase.from("ai_sessions").insert({ user_id: user.id, project_id: activeProject?.id || null, session_type: "call_brief", title: `Call plan: ${form.prospect} @ ${form.company}`, context_snapshot: { form } }).select().single();
      if (sess) await supabase.from("ai_messages").insert([{ session_id: sess.id, role: "user", content, tool_used: "call_brief" }, { session_id: sess.id, role: "assistant", content: text, tool_used: "call_brief" }]);
      addToast("Call plan saved");
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  const objectives = [
    { value: "book_meeting", label: "Book a discovery meeting" },
    { value: "qualify", label: "Qualify the lead" },
    { value: "reactivate", label: "Re-activate a cold lead" },
    { value: "referral", label: "Get a referral or intro" },
    { value: "permission_to_operate", label: "Permission to Operate" },
  ];
  const posStages = ["profile","search","connect","engage","assess","influence"];
  const buyerGates = [
    { value: "oblivious", label: "Oblivious — no awareness of us" },
    { value: "credible", label: "Credible — knows who we are" },
    { value: "relevant", label: "Relevant — sees potential fit" },
    { value: "interesting", label: "Interesting — open to exploring" },
    { value: "preference", label: "Preference — ready to commit" },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title"><span className="page-accent" />Call Planner</div>
        <div className="page-sub">60-second pre-call plan — Croc Brain opener, OctaQ-sequenced questions, DMU awareness, and buyer gate calibration built in.</div>
      </div>
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
          <div><label>POS stage</label>
            <select value={form.pos_stage} onChange={e => setForm({ ...form, pos_stage: e.target.value })}>
              {posStages.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div><label>Where is this buyer? (buyer gate)</label>
            <select value={form.buyer_gate} onChange={e => setForm({ ...form, buyer_gate: e.target.value })}>
              {buyerGates.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        </div>
        <label>Extra context (trigger event, previous interaction, LinkedIn insight...)</label>
        <input type="text" placeholder="e.g. Just hired 3 new AEs, saw their LinkedIn post about pipeline..." value={form.context} onChange={e => setForm({ ...form, context: e.target.value })} />
        <button className="btn btn-primary" onClick={run} disabled={loading || !form.prospect || !form.company}>
          {loading ? <><Spinner /> Building...</> : "◉ Build call plan"}
        </button>
      </div>
      {loading && <div className="loading-row"><Spinner /> Applying ProspectMastery framework...</div>}
      {result && (
        <div className="card">
          <div className="card-label">Call plan — {form.prospect} @ {form.company}<CopyBtn text={result} /></div>
          <div className="result-box">{result}</div>
        </div>
      )}
    </div>
  );
}

// ─── ICP FIT SCORE (was ICP Scorer) ──────────────────────────────────────────
function ICPScorer({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ company: "", industry: "", size: "51-200", role: "", budget: "unknown", pain: "", techStack: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!form.company) return;
    setLoading(true); setResult(null);
    const sys = `${PM_CORE}

TASK: ICP Fit Scoring Engine. Score this prospect against PaceOps' Ideal Customer Profile using all 10 ICP components from Module 1 (Industry, Company Size, Geography, Revenues, Buying Process, Decision Makers, Business Goals, Pain Points, Technology Stack, Attributes).

Apply Module 7 DMU thinking — assess how complex the decision-making unit is likely to be, whether this is centralised or decentralised, and whether a professional buyer/procurement layer is likely.

Apply Module 1 Buyer Journey thinking — which gate is this prospect likely at?

Return ONLY valid JSON, no markdown, no preamble, no explanation outside the JSON.
Format: {
  "overall": 85,
  "dimensions": {
    "companyFit": 80,
    "roleAuthority": 90,
    "budgetSignal": 70,
    "painAlignment": 95,
    "timingSignal": 75,
    "icpMatch": 80
  },
  "priority": "HIGH",
  "buyer_gate": "oblivious",
  "funnel_stage": "discovering",
  "pos_recommendation": "engage",
  "dmu_complexity": "medium",
  "decision_structure": "centralised",
  "verdict": "One clear sentence verdict",
  "strengths": ["strength 1", "strength 2"],
  "risks": ["risk 1"],
  "croc_brain_hook": "One Croc Brain–filtered opening hook for this prospect — Simple, Clear, Non-threatening, Intriguing",
  "nextAction": "Specific first move with OctaQ opening question angle",
  "pm_approach": "Which ProspectMastery module and buyer gate strategy to lead with"
}
Priority: HIGH (75+), MEDIUM (50-74), LOW (<50)
DMU complexity: low / medium / high
Decision structure: centralised / decentralised / unknown
Buyer gate: oblivious / credible / relevant / interesting / preference`;

    const content = `Company: ${form.company}\nIndustry: ${form.industry}\nSize: ${form.size}\nDecision Maker Role: ${form.role}\nBudget: ${form.budget}\nPain points: ${form.pain}\nTech stack: ${form.techStack}`;
    try {
      const text = await callClaude([{ role: "user", content }], sys);
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setResult(parsed);
      const { data: sess } = await supabase.from("ai_sessions").insert({ user_id: user.id, project_id: activeProject?.id || null, session_type: "icp_scoring", title: `ICP score: ${form.company}`, context_snapshot: { form, result: parsed } }).select().single();
      if (sess) await supabase.from("ai_messages").insert([{ session_id: sess.id, role: "user", content, tool_used: "icp_scoring" }, { session_id: sess.id, role: "assistant", content: text, tool_used: "icp_scoring" }]);
      addToast(`${form.company}: ${parsed.priority} priority (${parsed.overall}/100)`);
    } catch (e) { setResult({ error: e.message }); }
    setLoading(false);
  };

  const priorityTag = p => p === "HIGH" ? "tag-green" : p === "MEDIUM" ? "tag-amber" : "tag-rose";
  const complexityTag = c => c === "low" ? "tag-green" : c === "medium" ? "tag-amber" : "tag-rose";
  const gateColor = g => ({ oblivious: "var(--text-muted)", credible: "var(--teal)", relevant: "var(--amber)", interesting: "var(--green)", preference: "var(--accent)" }[g] || "var(--text-muted)");

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title"><span className="page-accent" />ICP Fit Score</div>
        <div className="page-sub">Score any prospect across 6 dimensions — ICP fit, role authority, pain alignment, plus DMU complexity, buyer gate, and a Croc Brain opener.</div>
      </div>
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
          <div><label>Decision maker role</label><input type="text" placeholder="e.g. Chief Revenue Officer" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
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
        <label>Known pain points or trigger events</label>
        <textarea placeholder="Hiring freezes, missed targets, new CRO, funding round, company rebrand..." value={form.pain} onChange={e => setForm({ ...form, pain: e.target.value })} style={{ minHeight: 64 }} />
        <button className="btn btn-primary" onClick={run} disabled={loading || !form.company}>
          {loading ? <><Spinner /> Scoring...</> : "◆ Score this prospect"}
        </button>
      </div>
      {loading && <div className="loading-row"><Spinner /> Running ProspectMastery ICP analysis...</div>}
      {result && !result.error && (
        <div className="card fade-in">
          <div className="card-label">ICP Fit Score — {form.company}</div>
          <div className="g3" style={{ marginBottom: 20 }}>
            <div className="metric-card">
              <div className="metric-val" style={{ color: scoreColor(result.overall) }}>{result.overall}</div>
              <div className="metric-lbl">Overall score</div>
            </div>
            <div className="metric-card">
              <span className={`tag ${priorityTag(result.priority)}`}>{result.priority}</span>
              <div className="metric-lbl" style={{ marginTop: 10 }}>Priority tier</div>
            </div>
            <div className="metric-card">
              <span className="tag tag-teal" style={{ color: gateColor(result.buyer_gate), borderColor: gateColor(result.buyer_gate) + "40", background: gateColor(result.buyer_gate) + "12" }}>{result.buyer_gate}</span>
              <div className="metric-lbl" style={{ marginTop: 10 }}>Buyer gate</div>
            </div>
          </div>
          {Object.entries(result.dimensions || {}).map(([key, val]) => {
            const labels = { companyFit: "Company Fit", roleAuthority: "Role Authority", budgetSignal: "Budget Signal", painAlignment: "Pain Alignment", timingSignal: "Timing Signal", icpMatch: "ICP Match" };
            return (
              <div className="score-row" key={key}>
                <div className="score-header"><span>{labels[key] || key}</span><span style={{ color: scoreColor(val), fontWeight: 600 }}>{val}/100</span></div>
                <div className="score-track"><div className="score-fill" style={{ width: val + "%", background: scoreColor(val) }} /></div>
              </div>
            );
          })}
          <div className="divider" style={{ margin: "16px 0" }} />
          <div style={{ fontSize: 13, color: "var(--text-sec)", lineHeight: 1.9 }}>
            <strong style={{ color: "var(--teal)" }}>Verdict: </strong>{result.verdict}<br /><br />
            <strong>DMU complexity: </strong><span className={`tag ${complexityTag(result.dmu_complexity)}`}>{result.dmu_complexity || "unknown"}</span>
            {result.decision_structure && <> &nbsp;<span className="tag tag-blue">{result.decision_structure}</span></>}<br /><br />
            <strong>Recommended POS stage: </strong><span className="tag tag-blue">{result.pos_recommendation}</span><br /><br />
            {result.croc_brain_hook && <><strong style={{ color: "var(--amber)" }}>Croc Brain opener: </strong>{result.croc_brain_hook}<br /><br /></>}
            <strong>PM approach: </strong>{result.pm_approach}<br /><br />
            <strong>Next action: </strong>{result.nextAction}
            {result.strengths?.length > 0 && <><br /><br /><strong>Strengths: </strong>{result.strengths.join(" · ")}</>}
            {result.risks?.length > 0 && <><br /><strong>Risks: </strong>{result.risks.join(" · ")}</>}
          </div>
        </div>
      )}
      {result?.error && <div className="result-box" style={{ color: "var(--rose)" }}>{result.error}</div>}
    </div>
  );
}

// ─── CALL SCRIPT ──────────────────────────────────────────────────────────────
function ScriptBuilder({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ prospect: "", company: "", role: "", product: "", tone: "consultative", trigger: "", pos_stage: "engage", buyer_gate: "oblivious" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!form.prospect || !form.company) return;
    setLoading(true); setResult("");
    const sys = `${PM_CORE}

TASK: Cold Call Script (ProspectMastery Module 4 — Script to Success)

Write a personalised word-for-word script in ${form.tone} style for POS stage: ${form.pos_stage}

CRITICAL — MODULE 1 CROC BRAIN RULES:
The prospect is receiving this call with their Croc Brain, not their Neocortex. The HOOK must be Simple, Clear, Non-threatening, and Intriguing. It must immediately answer "Why should I not hang up?" before the croc brain decides to ignore you. Do NOT open with a feature dump or company pitch.

Apply OctaQ Module 5 — the discovery question must be ONE sharp question from the most relevant OctaQ category for this prospect's buyer gate (${form.buyer_gate}) and POS stage. Never ask multiple questions at once.

Apply DMU Module 7 — the permission ask and pain probe should be calibrated to where this person sits in the likely decision-making unit.

MANDATORY STRUCTURE — use EXACTLY these labels:

HOOK
(Specific, Croc Brain–filtered — reference something from their world: LinkedIn post, company news, role change, industry trend. Make them think "how do they know that?" — then [PAUSE])

BRIDGE
(One sentence connecting their world to what you offer — focus on the problem you solve, not what you sell)

PERMISSION ASK
(Low-friction — "Does that make sense to talk about for 90 seconds?" — [PAUSE])

PAIN PROBE
(ONE sharp OctaQ-aligned insightful question for this specific role/company — then [PAUSE] and LISTEN. Do not ask two questions.)

VALUE STATEMENT
(Specific, commercial, no buzzwords — one sentence with a real outcome)

SOFT CLOSE
(Clear ask for a specific next step — "Are you free Thursday at 10am for 20 minutes?" Never "let me know when works")

Use [PAUSE] markers strategically. Write like a top performer actually speaks. Keep it human.`;

    const content = `Prospect: ${form.prospect}, ${form.role || "decision maker"} at ${form.company}\nProduct: ${form.product || "outsourced SDR / prospecting services"}\nTone: ${form.tone}\nPOS stage: ${form.pos_stage}\nBuyer gate: ${form.buyer_gate}\nPersonalisation trigger: ${form.trigger || "Use their role and company type"}`;
    try {
      const text = await callClaude([{ role: "user", content }], sys);
      setResult(text);
      const { data: sess } = await supabase.from("ai_sessions").insert({ user_id: user.id, project_id: activeProject?.id || null, session_type: "script_builder", title: `Script: ${form.prospect} @ ${form.company}`, context_snapshot: { form } }).select().single();
      if (sess) await supabase.from("ai_messages").insert([{ session_id: sess.id, role: "user", content, tool_used: "script_builder" }, { session_id: sess.id, role: "assistant", content: text, tool_used: "script_builder" }]);
      addToast("Script saved");
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  const buyerGates = [
    { value: "oblivious", label: "Oblivious — no awareness of us" },
    { value: "credible", label: "Credible — knows who we are" },
    { value: "relevant", label: "Relevant — sees potential fit" },
    { value: "interesting", label: "Interesting — open to exploring" },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title"><span className="page-accent" />Call Script</div>
        <div className="page-sub">Word-for-word script — Croc Brain filtered hook, OctaQ-sequenced single question, DMU-aware positioning, clear close with specific ask.</div>
      </div>
      <div className="card">
        <div className="card-label">Script parameters</div>
        <div className="g2">
          <div><label>Prospect name *</label><input type="text" placeholder="e.g. Claire Dunne" value={form.prospect} onChange={e => setForm({ ...form, prospect: e.target.value })} /></div>
          <div><label>Company *</label><input type="text" placeholder="e.g. Philips" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>Their job title</label><input type="text" placeholder="e.g. Head of Sales Operations" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
          <div><label>What are you selling?</label><input type="text" placeholder="e.g. Outsourced SDR team" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>Script tone</label>
            <select value={form.tone} onChange={e => setForm({ ...form, tone: e.target.value })}>
              <option value="consultative">Consultative & curious</option>
              <option value="confident">Confident & direct</option>
              <option value="challenger">Challenger — provoke thinking</option>
              <option value="brief">Hyper-brief (30 seconds)</option>
            </select>
          </div>
          <div><label>Where is this buyer?</label>
            <select value={form.buyer_gate} onChange={e => setForm({ ...form, buyer_gate: e.target.value })}>
              {buyerGates.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        </div>
        <div><label>POS stage</label>
          <select value={form.pos_stage} onChange={e => setForm({ ...form, pos_stage: e.target.value })} style={{ maxWidth: 260 }}>
            {["profile","search","connect","engage","assess","influence"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
        <label>Personalisation trigger (LinkedIn post, company news, role change, hiring activity...)</label>
        <input type="text" placeholder="e.g. Posted about hiring 4 new AEs, won a major contract, just rebranded..." value={form.trigger} onChange={e => setForm({ ...form, trigger: e.target.value })} />
        <button className="btn btn-primary" onClick={run} disabled={loading || !form.prospect || !form.company}>
          {loading ? <><Spinner /> Writing...</> : "◇ Generate script"}
        </button>
      </div>
      {loading && <div className="loading-row"><Spinner /> Crafting Croc Brain–filtered ProspectMastery script...</div>}
      {result && (
        <div className="card">
          <div className="card-label">Script — {form.prospect} @ {form.company}<CopyBtn text={result} /></div>
          <div className="result-box">{result}</div>
        </div>
      )}
    </div>
  );
}

// ─── CALL REVIEW & COACH ──────────────────────────────────────────────────────
function CallCoach({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ transcript: "", outcome: "voicemail", talkRatio: 65, duration: 3, objections: 1, pos_stage: "engage" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true); setResult("");
    const sys = `${PM_CORE}

TASK: Call Review & Coaching Report (ProspectMastery Coaching Framework)

You are an elite PaceOps call coach. Be direct. Real coaches tell the truth.

Apply the Lewin Force Field — identify restraining forces (what held the rep back) and driving forces (what to build on).

CROC BRAIN CHECK: Did the rep open with a Croc Brain–filtered hook? Was the opener Simple, Clear, Non-threatening, Intriguing? Or did they lead with a product dump that the croc brain immediately filtered out?

OctaQ COMPLIANCE: Did the rep move through Business Background → Decision Making → Discovery → Qualification stages? Did they ask ONE sharp question and then actually listen, or did they fire multiple surface-level questions?

DMU PROGRESS: Did the rep uncover who else is involved in the decision? Did they identify the decision structure (centralised/decentralised)?

BUYER GATE MOVEMENT: Did the rep move the buyer along the gate journey (Oblivious → Credible → Relevant → Interesting → Preference)?

FORMAT YOUR RESPONSE EXACTLY AS FOLLOWS:

CALL RATING: [X/10]

COMPETENCY SCORES
• Organised (prep & structure): X/10
• Curiosity (depth of questioning): X/10
• Active Listening (prospect talk time & response quality): X/10
• Persistence (handling objections): X/10
• Resilience (recovery from pushback): X/10

CROC BRAIN ASSESSMENT
(Did the opener pass the filter? Simple/Clear/Non-threatening/Intriguing — what worked, what should change)

OCTAQ COMPLIANCE
(Which stages were covered: Business Background / Decision Making / Discovery / Qualification / Challenge / Budget / Timeframes / Next Actions — which were missed)

DMU PROGRESS
(Did rep uncover decision structure? Yes / Partial / No — what was found and what was missed)

BUYER GATE MOVEMENT
(Which gate did the prospect start at, which gate did they end at — did the rep earn progression?)

WHAT WORKED
• [Specific moment 1]
• [Specific moment 2]

BIGGEST MISS
(The single most impactful issue — be direct)

LINE-BY-LINE MOMENTS
• "[What was said]" → Better: "[Improved version]"
• "[What was said]" → Better: "[Improved version]"

LEWIN FORCE FIELD — RESTRAINING FORCES
(What psychological or behavioural forces held this rep back)

DRILL THIS WEEK
(One specific practice exercise to fix the biggest miss)

ONE CHANGE FOR NEXT CALL
(The single most impactful change — make it specific and actionable)`;

    const content = `Call outcome: ${form.outcome}\nPOS stage: ${form.pos_stage}\nRep talk ratio: ${form.talkRatio}%\nDuration: ${form.duration} minutes\nObjections handled: ${form.objections}\nTranscript/notes: ${form.transcript || "None — coach on metrics only"}`;
    try {
      const text = await callClaude([{ role: "user", content }], sys, 1600);
      setResult(text);
      const { data: review } = await supabase.from("call_reviews").insert({ user_id: user.id, project_id: activeProject?.id || null, called_at: new Date().toISOString(), duration_minutes: parseFloat(form.duration) || null, call_outcome: form.outcome, rep_talk_ratio: form.talkRatio, objection_count: form.objections, pos_stage: form.pos_stage, transcript: form.transcript || null, coaching_feedback: text, post_call_notes: form.transcript }).select().single();
      if (review) {
        const { data: sess } = await supabase.from("ai_sessions").insert({ user_id: user.id, project_id: activeProject?.id || null, session_type: "call_coach", title: `Call review — ${fmt(new Date())} (${form.outcome.replace(/_/g," ")})`, context_snapshot: { form, call_review_id: review.id } }).select().single();
        if (sess) await supabase.from("ai_messages").insert([{ session_id: sess.id, role: "user", content, tool_used: "call_coach" }, { session_id: sess.id, role: "assistant", content: text, tool_used: "call_coach" }]);
      }
      addToast("Call review saved");
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  const outcomes = [
    { value: "meeting_booked", label: "✓ Meeting booked" },
    { value: "callback_requested", label: "Callback requested" },
    { value: "not_interested", label: "Not interested" },
    { value: "voicemail", label: "Left voicemail" },
    { value: "gatekeeper", label: "Blocked by gatekeeper" },
    { value: "no_answer", label: "No answer" },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title"><span className="page-accent" />Call Review & Coach</div>
        <div className="page-sub">ProspectMastery coaching report — competency scores, Croc Brain assessment, OctaQ compliance, buyer gate movement, Lewin Force Field, and one change for next call.</div>
      </div>
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
        <div className="range-row"><label>Rep talk ratio</label><input type="range" min={20} max={90} step={5} value={form.talkRatio} onChange={e => setForm({ ...form, talkRatio: +e.target.value })} /><span className="range-val">{form.talkRatio}%</span></div>
        <div className="range-row"><label>Duration (minutes)</label><input type="range" min={1} max={30} step={1} value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })} /><span className="range-val">{form.duration}m</span></div>
        <div className="range-row"><label>Objections handled</label><input type="range" min={0} max={8} step={1} value={form.objections} onChange={e => setForm({ ...form, objections: +e.target.value })} /><span className="range-val">{form.objections}</span></div>
        <label>Paste transcript or write what happened on the call</label>
        <textarea placeholder="Paste full transcript or write key moments, what was said, how prospect responded..." value={form.transcript} onChange={e => setForm({ ...form, transcript: e.target.value })} style={{ minHeight: 120 }} />
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? <><Spinner /> Reviewing...</> : "◎ Get coaching feedback"}
        </button>
      </div>
      {loading && <div className="loading-row"><Spinner /> ProspectMastery coach reviewing your call...</div>}
      {result && (
        <div className="card">
          <div className="card-label">Coaching report — {fmt(new Date())}<CopyBtn text={result} /></div>
          <div className="result-box">{result}</div>
        </div>
      )}
    </div>
  );
}

// ─── FOLLOW-UP WRITER ─────────────────────────────────────────────────────────
function FollowupDrafter({ user, activeProject, addToast }) {
  const [form, setForm] = useState({ prospect: "", company: "", outcome: "meeting_booked", summary: "", format: "email", pos_stage: "engage" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!form.prospect) return;
    setLoading(true); setResult("");
    const sys = `${PM_CORE}

TASK: Post-Call Follow-up (ProspectMastery MultiTouch Cadence — CONNECT stage)

Apply Croc Brain rules — the subject line or opening sentence must pass the Simple, Clear, Non-threatening, Intriguing test. No "Hope this finds you well." No corporate fluff. Write like a human who genuinely wants to help.

Apply OctaQ — if a discovery insight emerged on the call (pain point, timeline, DMU member mentioned), reference it specifically to show you were listening.

Apply DMU awareness — if another stakeholder was mentioned, subtly acknowledge that where appropriate.

RULES:
- Under 120 words for email, under 70 for LinkedIn/WhatsApp
- Reference at least one specific thing from the call
- One clear next step only — with specific day/time if meeting was booked (e.g. "Looking forward to speaking on Thursday at 10am")
- No "I hope this finds you well" — ever
- No "just following up" — ever
- No corporate buzzwords
- Write like a real person`;

    const content = `Prospect: ${form.prospect} at ${form.company || "their company"}\nOutcome: ${form.outcome}\nPOS stage: ${form.pos_stage}\nCall highlights: ${form.summary || "General prospecting call"}\nFormat: ${form.format}`;
    try {
      const text = await callClaude([{ role: "user", content }], sys);
      setResult(text);
      const { data: sess } = await supabase.from("ai_sessions").insert({ user_id: user.id, project_id: activeProject?.id || null, session_type: "follow_up", title: `Follow-up: ${form.prospect} @ ${form.company || "unknown"}`, context_snapshot: { form } }).select().single();
      if (sess) await supabase.from("ai_messages").insert([{ session_id: sess.id, role: "user", content, tool_used: "follow_up" }, { session_id: sess.id, role: "assistant", content: text, tool_used: "follow_up" }]);
      addToast("Follow-up saved");
    } catch (e) { setResult("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title"><span className="page-accent" />Follow-up Writer</div>
        <div className="page-sub">Human-sounding follow-up — Croc Brain filtered subject/opener, references specific call moments, one clear next step, no corporate fluff.</div>
      </div>
      <div className="card">
        <div className="card-label">Call summary</div>
        <div className="g2">
          <div><label>Prospect name *</label><input type="text" placeholder="e.g. Tom Walsh" value={form.prospect} onChange={e => setForm({ ...form, prospect: e.target.value })} /></div>
          <div><label>Company</label><input type="text" placeholder="e.g. Kodak Alaris" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
        </div>
        <div className="g2">
          <div><label>What happened on the call?</label>
            <select value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>
              <option value="meeting_booked">Meeting was booked ✓</option>
              <option value="send_info">Send info first, then follow up</option>
              <option value="callback_requested">They promised a callback</option>
              <option value="not_interested">Not now — move to nurture</option>
              <option value="referral">Referred to someone else</option>
            </select>
          </div>
          <div><label>Send via</label>
            <select value={form.format} onChange={e => setForm({ ...form, format: e.target.value })}>
              <option value="email">Email</option>
              <option value="LinkedIn message">LinkedIn message</option>
              <option value="WhatsApp message">WhatsApp</option>
            </select>
          </div>
        </div>
        <label>Key moments from the call (pain points mentioned, who else was mentioned, what they said about timing...)</label>
        <textarea placeholder="e.g. Struggling to hit pipeline targets, 3 new AEs starting Q3, CFO needs to sign off, mentioned they're reviewing their tools in Jan..." value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
        <button className="btn btn-primary" onClick={run} disabled={loading || !form.prospect}>
          {loading ? <><Spinner /> Writing...</> : "◐ Write follow-up"}
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
    return [r.transcript, r.post_call_notes, r.coaching_feedback, r.call_outcome].join(" ").toLowerCase().includes(search.toLowerCase());
  });

  const outcomeColor = (o) => ({ meeting_booked: "var(--green)", callback_requested: "var(--teal)", not_interested: "var(--rose)", voicemail: "var(--text-muted)", gatekeeper: "var(--amber)", no_answer: "var(--text-muted)" }[o] || "var(--text-muted)");

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-title"><span className="page-accent" />Call History</div>
        <div className="page-sub">All past call coaching reports — search by transcript content, outcome, or date.</div>
      </div>
      <div style={{ position: "relative", marginBottom: 16 }}>
        <input type="text" placeholder="Search by transcript content, outcome, notes..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-60%)", color: "var(--text-muted)", fontSize: 14, pointerEvents: "none" }}>⌕</span>
      </div>
      {loading ? <div className="loading-row"><Spinner /> Loading call history...</div> :
        searchResults.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)", fontSize: 13 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📞</div>
            {search ? "No calls match your search" : "No call reviews yet — use Call Review & Coach to get started"}
          </div>
        ) : searchResults.map(r => (
          <div key={r.id} className="call-card" onClick={() => setSelected(r)}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span className="tag" style={{ background: `${outcomeColor(r.call_outcome)}12`, color: outcomeColor(r.call_outcome), border: `1px solid ${outcomeColor(r.call_outcome)}30` }}>
                    {r.call_outcome?.replace(/_/g, " ")}
                  </span>
                  {r.pos_stage && <span className="tag tag-blue">{r.pos_stage}</span>}
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--mono)", marginLeft: "auto" }}>{timeAgo(r.called_at)}</span>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-sec)" }}>
                  {r.duration_minutes && <span>⏱ {r.duration_minutes}m</span>}
                  {r.rep_talk_ratio && <span>🎙 {r.rep_talk_ratio}% rep</span>}
                  {r.objection_count > 0 && <span>🛡 {r.objection_count} objections</span>}
                </div>
                {r.coaching_feedback && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.5 }}>{r.coaching_feedback.slice(0, 120)}...</div>}
              </div>
              <div style={{ fontSize: 16, color: "var(--text-muted)" }}>›</div>
            </div>
          </div>
        ))
      }
      {selected && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <div className="modal-title">Call Review</div>
              <CopyBtn text={[selected.transcript, selected.coaching_feedback].filter(Boolean).join("\n\n---\n\n")} />
            </div>
            <div className="modal-sub">{fmt(selected.called_at)} · {selected.call_outcome?.replace(/_/g, " ")} · {selected.duration_minutes}m · {selected.rep_talk_ratio}% rep talk</div>
            {selected.transcript && <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Transcript / Notes</div>
              <div className="result-box" style={{ marginBottom: 14, maxHeight: 200, overflowY: "auto", fontSize: 12 }}>{selected.transcript}</div>
            </>}
            {selected.coaching_feedback && <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Coaching Feedback</div>
              <div className="result-box" style={{ maxHeight: 300, overflowY: "auto" }}>{selected.coaching_feedback}</div>
            </>}
            <button className="btn btn-outline" style={{ width: "100%", justifyContent: "center", marginTop: 16 }} onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ACCOUNT SETTINGS ─────────────────────────────────────────────────────────
function AccountSettings({ user, addToast, isDark, onToggleTheme }) {
  const [email, setEmail] = useState(user.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [err, setErr] = useState("");

  const updateEmail = async () => {
    if (!email || email === user.email) return;
    setEmailLoading(true); setErr("");
    const { error } = await supabase.auth.updateUser({ email });
    if (error) setErr(error.message);
    else addToast("Confirmation sent to new email address");
    setEmailLoading(false);
  };

  const updatePassword = async () => {
    if (!newPassword) return;
    if (newPassword !== confirmPassword) { setErr("Passwords don't match"); return; }
    if (newPassword.length < 6) { setErr("Password must be at least 6 characters"); return; }
    setPassLoading(true); setErr("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setErr(error.message);
    else { addToast("Password updated successfully"); setNewPassword(""); setConfirmPassword(""); }
    setPassLoading(false);
  };

  return (
<div className="fade-in">
  <div className="page-header" style={{ textAlign: "center" }}>
    <div className="page-title" style={{ justifyContent: "center" }}>
      Account Settings
    </div>
    <div className="page-sub">Manage your email, password, and display preferences.</div>
  </div>

  {err && <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--rose-bg)", border: "1px solid rgba(220,38,38,0.20)", borderRadius: 10, fontSize: 13, color: "var(--rose)" }}>{err}</div>}

  <div className="settings-section">
    <div className="settings-title" style={{ textAlign: "center" }}>Profile</div>
    <div className="settings-sub" style={{ textAlign: "center" }}>Your account information</div>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "24px 16px", background: "var(--bg)", borderRadius: 10, border: "1px solid var(--border)" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-sub)", border: "2px solid var(--accent-border)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: "var(--accent)" }}>
        {(user.email || "?")[0].toUpperCase()}
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 3 }}>{user.user_metadata?.full_name || user.email?.split("@")[0]}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{user.email}</div>
      </div>
    </div>
  </div>

  <div className="settings-section">
    <div className="settings-title">Change email address</div>
    <div className="settings-sub">A confirmation link will be sent to your new email</div>
    <label>New email address</label>
    <input type="email" placeholder="new@email.com" value={email} onChange={e => setEmail(e.target.value)} />
    <button className="btn btn-primary btn-sm" onClick={updateEmail} disabled={emailLoading || email === user.email || !email}>
      {emailLoading ? <><Spinner /> Updating...</> : "Update email"}
    </button>
  </div>

  <div className="settings-section">
    <div className="settings-title">Change password</div>
    <div className="settings-sub">Must be at least 6 characters</div>
    <label>New password</label>
    <input type="password" placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
    <label>Confirm new password</label>
    <input type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
    <button className="btn btn-primary btn-sm" onClick={updatePassword} disabled={passLoading || !newPassword}>
      {passLoading ? <><Spinner /> Updating...</> : "Update password"}
    </button>
  </div>

  <div className="settings-section">
    <div className="settings-title" style={{ textAlign: "center" }}>Appearance</div>
    <div className="settings-sub" style={{ textAlign: "center" }}>Choose your preferred theme</div>
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {[{ label: "☀️ Light", val: false }, { label: "🌙 Dark", val: true }].map(t => (
        <button key={t.label} onClick={() => isDark !== t.val && onToggleTheme()} style={{ padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid", borderColor: isDark === t.val ? "var(--accent)" : "var(--border-med)", background: isDark === t.val ? "var(--accent-sub)" : "var(--bg)", color: isDark === t.val ? "var(--accent)" : "var(--text-sec)", transition: "all 0.15s" }}>
          {t.label}
        </button>
      ))}
    </div>
  </div>
</div>
  );
}

// ─── PANELS MAP ───────────────────────────────────────────────────────────────
const PANELS = {
  enrich:   ProspectEnrichment,
  brief:    CallBrief,
  score:    ICPScorer,
  script:   ScriptBuilder,
  coach:    CallCoach,
  followup: FollowupDrafter,
  history:  CallHistory,
};

// ─── SIDEBAR CONTENT ──────────────────────────────────────────────────────────
function SidebarContent({ user, activeTool, setActiveTool, projects, activeProject, setActiveProject, setShowNewProject, sessions, onSignOut }) {
  return (
    <>
      <div className="sidebar-top">
        <div className="brand">
          <div className="brand-mark">P</div>
          <div className="brand-name">Pace<em>AI</em></div>
        </div>
        <ProjectSelector projects={projects} activeProject={activeProject} onSelect={setActiveProject} onNew={() => setShowNewProject(true)} />
      </div>
      <div className="sidebar-scroll">
        <div className="nav-section">Recent Activity</div>
        <RecentSessions sessions={sessions} activeTool={activeTool} />
        <div className="nav-section" style={{ marginTop: 8 }}>Tools</div>
        {TOOLS.map((t, i) => (
          <div key={t.id} className={`nav-item ${activeTool === t.id ? "active" : ""}`} style={{ animationDelay: `${i * 0.03}s` }} onClick={() => setActiveTool(t.id)} title={t.desc}>
            <span className="nav-icon">{t.icon}</span>
            <span style={{ flex: 1 }}>{t.label}</span>
            <div className="nav-dot" />
          </div>
        ))}
        <div className="divider" style={{ margin: "12px 0" }} />
        <div className={`nav-item ${activeTool === "settings" ? "active" : ""}`} onClick={() => setActiveTool("settings")}>
          <span className="nav-icon">⚙️</span>
          <span style={{ flex: 1 }}>Settings</span>
        </div>
      </div>
      <div className="sidebar-bottom">
        <div className="user-row">
          <div className="user-avatar">{(user.email || "?")[0].toUpperCase()}</div>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
            {user.user_metadata?.display_name || user.email?.split("@")[0]}
          </span>
        </div>
        <div className="nav-item" onClick={onSignOut} style={{ cursor: "pointer" }}>
          <span className="nav-icon">⎋</span>
          <span>Sign out</span>
        </div>
      </div>
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined);
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem("pace-theme") !== "light"; } catch { return true; }
  });
  const C = isDark ? DARK : LIGHT;

  const toggleTheme = useCallback(() => {
    setIsDark(v => {
      const next = !v;
      try { localStorage.setItem("pace-theme", next ? "dark" : "light"); } catch {}
      return next;
    });
  }, []);

  const [activeTool, setActiveTool] = useState("enrich");
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("projects").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => { setProjects(data || []); if (data?.length && !activeProject) setActiveProject(data[0]); });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    supabase.from("ai_sessions").select("*").eq("user_id", user.id).order("last_message_at", { ascending: false }).limit(20)
      .then(({ data }) => setSessions(data || []));
  }, [user, activeTool]);

  const addToast = useCallback((msg) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); };

  const handleSetActiveTool = (id) => {
    setActiveTool(id);
    setDrawerOpen(false);
  };

  if (user === undefined) return (
    <>
      <style>{makeStyles(C)}</style>
      <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner spin" style={{ width: 32, height: 32, borderWidth: 3 }} />
      </div>
    </>
  );

  if (!user) return (
    <>
      <style>{makeStyles(C)}</style>
      <AuthScreen onAuth={u => setUser(u)} isDark={isDark} onToggleTheme={toggleTheme} />
      <Toast toasts={toasts} />
    </>
  );

  const Panel = activeTool === "settings" ? AccountSettings : PANELS[activeTool];
  const activeToolMeta = getToolMeta(activeTool);

  const sidebarProps = {
    user, activeTool, setActiveTool: handleSetActiveTool,
    projects, activeProject, setActiveProject,
    setShowNewProject, sessions, onSignOut: signOut,
  };

  return (
    <>
      <style>{makeStyles(C)}</style>

      {drawerOpen && <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />}
      <div className={`drawer ${drawerOpen ? "open" : ""}`}>
        <SidebarContent {...sidebarProps} />
      </div>

      <div className="shell">
        <div className="sidebar">
          <SidebarContent {...sidebarProps} />
        </div>
        <div className="main">
          <div className="mobile-topbar">
            <button className="icon-btn" onClick={() => setDrawerOpen(true)}>☰</button>
            <div className="brand">
              <div className="brand-mark" style={{ width: 26, height: 26, fontSize: 11 }}>P</div>
              <div className="brand-name" style={{ fontSize: 14 }}>Pace<em>AI</em></div>
            </div>
            <button className="icon-btn" onClick={toggleTheme}>{isDark ? "☀️" : "🌙"}</button>
          </div>
          <div className="topbar">
            {activeToolMeta && <span style={{ fontSize: 15 }}>{activeToolMeta.icon}</span>}
            <span className="topbar-title">
              {activeTool === "settings" ? "Account Settings" : activeToolMeta?.label}
            </span>
            {activeProject && <span className="topbar-sub">· {activeProject.company_name}</span>}
            <div className="topbar-right">
              {activeProject && (
                <div className="pill-status">
                  <div className="pulse-dot" />
                  {activeProject.pos_stage || "profile"}
                </div>
              )}
              <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
                {isDark ? "☀️" : "🌙"}
              </button>
            </div>
          </div>
          <div className="content-area">
            {activeTool === "settings"
              ? <AccountSettings user={user} addToast={addToast} isDark={isDark} onToggleTheme={toggleTheme} />
              : <Panel key={activeTool} user={user} activeProject={activeProject} addToast={addToast} />
            }
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