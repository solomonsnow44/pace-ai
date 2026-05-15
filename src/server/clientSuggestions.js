const SEARCH_URL = "https://html.duckduckgo.com/html/";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_ACCOUNT_LOOKUP_MODEL = "gpt-4.1-mini";

export const INDUSTRY_RULES = [
  { keywords: ["payment", "payments", "fintech", "banking", "financial technology"], industry: "Financial technology", workspace: "Strategic account workspace" },
  { keywords: ["cloud", "infrastructure", "platform", "software", "technology", "developer"], industry: "Technology", workspace: "Strategic account workspace" },
  { keywords: ["saas", "crm", "analytics", "automation"], industry: "SaaS", workspace: "Sales workspace" },
  { keywords: ["advertising", "marketing", "media", "growth"], industry: "Advertising technology", workspace: "Sales workspace" },
  { keywords: ["ux", "user experience", "product design", "design agency", "design consultancy", "design studio"], industry: "UX consultancy", workspace: "Agency workspace" },
  { keywords: ["consultancy", "consulting", "professional services"], industry: "Professional services", workspace: "Professional services workspace" },
  { keywords: ["healthcare", "health", "medical", "clinic", "pharma"], industry: "Healthcare", workspace: "Strategic account workspace" },
];

const BLOCKED_DOMAINS = [
  "duckduckgo.com",
  "google.com",
  "bing.com",
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "x.com",
  "twitter.com",
  "crunchbase.com",
  "wikipedia.org",
  "glassdoor.com",
  "indeed.com",
  "youtube.com",
];

export function cleanText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function makeCompanySlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^(the|a|an)/, "");
}

export function normalizeUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (BLOCKED_DOMAINS.some(domain => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`))) return "";
    return `${parsed.protocol}//${parsed.hostname.replace(/^m\./, "")}`;
  } catch {
    return "";
  }
}

function decodeDuckDuckGoUrl(value) {
  try {
    const parsed = new URL(value);
    const uddg = parsed.searchParams.get("uddg");
    return uddg ? decodeURIComponent(uddg) : value;
  } catch {
    return value;
  }
}

export function extractSearchResults(html) {
  const results = [];
  const resultPattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
  let match = resultPattern.exec(html);

  while (match && results.length < 6) {
    const url = normalizeUrl(decodeDuckDuckGoUrl(match[1]));
    if (url) {
      results.push({
        title: cleanText(match[2]),
        snippet: cleanText(match[3]),
        url,
      });
    }
    match = resultPattern.exec(html);
  }

  return results;
}

export function inferFromText(companyName, text) {
  const lowerText = `${companyName} ${text}`.toLowerCase();
  const matchedRule = INDUSTRY_RULES.find(rule => rule.keywords.some(keyword => lowerText.includes(keyword)));
  const isEnterprise = ["enterprise", "corporation", "global", "group", "international"].some(keyword => lowerText.includes(keyword));

  return {
    workspace: isEnterprise ? "Enterprise account workspace" : matchedRule?.workspace || "Prospecting workspace",
    industry: matchedRule?.industry || "B2B services",
  };
}

export function fallbackSuggestion(companyName) {
  const slug = makeCompanySlug(companyName);
  const inferred = inferFromText(companyName, companyName);
  return {
    ...inferred,
    website: slug ? `https://www.${slug}.com` : "",
    source: "local_fallback",
  };
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;

  return (payload.output || [])
    .flatMap(item => item.content || [])
    .map(content => content.text || "")
    .join("");
}

function extractCitations(payload) {
  return (payload.output || [])
    .flatMap(item => item.content || [])
    .flatMap(content => content.annotations || [])
    .filter(annotation => annotation.type === "url_citation")
    .map(annotation => ({
      title: annotation.title || annotation.url,
      snippet: "",
      url: annotation.url,
    }))
    .filter(source => source.url)
    .slice(0, 3);
}

export async function suggestClientFieldsFromWeb(input = {}, options = {}) {
  const companyName = String(input.name || "").trim();
  if (companyName.length < 2) {
    const error = new Error("Client name is required");
    error.statusCode = 400;
    throw error;
  }

  const fetcher = options.fetcher ?? fetch;
  const params = new URLSearchParams({ q: `${companyName} company official website industry` });

  try {
    const response = await fetcher(`${SEARCH_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 PaceOpsCRM/1.0",
        Accept: "text/html",
      },
    });

    if (!response.ok) throw new Error(`Search failed with ${response.status}`);

    const html = await response.text();
    const results = extractSearchResults(html);
    if (!results.length) {
      const fallback = fallbackSuggestion(companyName);
      return {
        name: companyName,
        domain: fallback.website.replace(/^https?:\/\//, "").replace(/^www\./, ""),
        industry: "",
        location: "",
        employees: "",
        nextAction: "Map buying committee",
        insight: "",
        source: "local_fallback",
        evidence: [],
      };
    }

    const combinedText = results.map(result => `${result.title} ${result.snippet}`).join(" ");
    const inferred = inferFromText(companyName, combinedText);
    const website = results[0]?.url || fallbackSuggestion(companyName).website;

    return {
      ...inferred,
      website,
      source: results.length ? "web_search" : "local_fallback",
      evidence: results.slice(0, 3),
    };
  } catch {
    return fallbackSuggestion(companyName);
  }
}

function extractEmployeeRange(text) {
  const compactText = String(text || "").replace(/\s+/g, " ");
  const rangeMatch = compactText.match(/(\d{1,3}(?:,\d{3})?|\d{1,3}k)\s*(?:-|to)\s*(\d{1,3}(?:,\d{3})?|\d{1,3}k)\s+employees/i);
  if (rangeMatch) return `${rangeMatch[1]}-${rangeMatch[2]}`;
  const countMatch = compactText.match(/(\d{1,3}(?:,\d{3})?|\d{1,3}k)\+?\s+employees/i);
  return countMatch ? countMatch[1] : "";
}

function extractLocation(text) {
  const lowerText = String(text || "").toLowerCase();
  const locations = [
    "United Kingdom",
    "Ireland",
    "United States",
    "Germany",
    "France",
    "Netherlands",
    "Spain",
    "Canada",
    "Australia",
  ];
  return locations.find(location => lowerText.includes(location.toLowerCase())) || "";
}

export async function suggestAccountFieldsFromWeb(input = {}, options = {}) {
  const accountName = String(input.name || "").trim();
  const clientName = String(input.clientName || "").trim();
  if (accountName.length < 2) {
    const error = new Error("Account name is required");
    error.statusCode = 400;
    throw error;
  }

  const fetcher = options.fetcher ?? fetch;
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const model = options.model ?? process.env.OPENAI_ACCOUNT_LOOKUP_MODEL ?? DEFAULT_ACCOUNT_LOOKUP_MODEL;

  if (apiKey) {
    try {
      const response = await fetcher(OPENAI_RESPONSES_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          tools: [{ type: "web_search" }],
          tool_choice: "auto",
          input: [
            {
              role: "system",
              content: [
                "Find current public company information for CRM account setup.",
                "Use web search when needed.",
                "Return JSON only.",
                "Do not guess unknown employee counts.",
                "Use an employee range only if a source clearly supports it.",
                "Keep researchSignal concise and useful for B2B outreach.",
              ].join(" "),
            },
            {
              role: "user",
              content: `Account name: ${accountName}\nClient context: ${clientName || "None"}\nReturn fields: domain, industry, location, employees, nextAction, insight.`,
            },
          ],
          text: {
            format: {
              type: "json_schema",
              name: "account_enrichment",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  domain: { type: "string" },
                  industry: { type: "string" },
                  location: { type: "string" },
                  employees: { type: "string" },
                  nextAction: { type: "string" },
                  insight: { type: "string" },
                },
                required: ["domain", "industry", "location", "employees", "nextAction", "insight"],
              },
            },
          },
        }),
      });

      if (response.ok) {
        const payload = await response.json();
        const parsed = JSON.parse(extractOutputText(payload));
        return {
          name: accountName,
          domain: String(parsed.domain || "").replace(/^https?:\/\//, "").replace(/^www\./, ""),
          industry: parsed.industry || "",
          location: parsed.location || "",
          employees: parsed.employees || "",
          nextAction: parsed.nextAction || "Map buying committee",
          insight: parsed.insight || "",
          source: "openai_web",
          evidence: extractCitations(payload),
        };
      }
    } catch {
      // Fall through to basic web search and then conservative fallback.
    }
  }

  const params = new URLSearchParams({
    q: `${accountName} ${clientName} company official website industry employees location`,
  });

  try {
    const response = await fetcher(`${SEARCH_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 PaceOpsCRM/1.0",
        Accept: "text/html",
      },
    });

    if (!response.ok) throw new Error(`Search failed with ${response.status}`);

    const html = await response.text();
    const results = extractSearchResults(html);
    if (!results.length) {
      const fallback = fallbackSuggestion(accountName);
      return {
        name: accountName,
        domain: fallback.website.replace(/^https?:\/\//, "").replace(/^www\./, ""),
        industry: "",
        location: "",
        employees: "",
        nextAction: "Map buying committee",
        insight: "",
        source: "local_fallback",
        evidence: [],
      };
    }

    const combinedText = results.map(result => `${result.title} ${result.snippet}`).join(" ");
    const inferred = inferFromText(accountName, combinedText);
    const website = results[0]?.url || fallbackSuggestion(accountName).website;

    return {
      name: accountName,
      domain: website.replace(/^https?:\/\//, "").replace(/^www\./, ""),
      industry: inferred.industry,
      location: extractLocation(combinedText) || "United Kingdom",
      employees: extractEmployeeRange(combinedText) || "",
      nextAction: "Map buying committee",
      insight: combinedText ? results[0]?.snippet || `Research ${accountName} before outreach.` : `Research ${accountName} before outreach.`,
      source: results.length ? "web_search" : "local_fallback",
      evidence: results.slice(0, 3),
    };
  } catch {
    const fallback = fallbackSuggestion(accountName);
    return {
      name: accountName,
      domain: fallback.website.replace(/^https?:\/\//, "").replace(/^www\./, ""),
      industry: "",
      location: "",
      employees: "",
      nextAction: "Map buying committee",
      insight: "",
      source: "local_fallback",
      evidence: [],
    };
  }
}
