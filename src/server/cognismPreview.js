export const COGNISM_PREVIEW_MODE = "preview_only";
export const FORBIDDEN_COGNISM_URL_PARTS = ["redeem", "reveal", "export", "enrich"];
export const COGNISM_CONTACT_SEARCH_URL = "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=20";

export const DEFAULT_TARGET_TITLES = [
  "Chief Product Officer",
  "Chief Experience Officer",
  "Chief Design Officer",
  "VP Product",
  "VP Design",
  "VP Product Design",
  "VP User Experience",
  "Head of Product",
  "Head of UX",
  "Head of User Experience",
  "Head of Design",
  "Head of Product Design",
  "Head of Customer Experience",
  "Director of UX",
  "Director of User Experience",
  "Director of Product Design",
  "Design Director",
  "Product Director",
  "CX Director",
  "Head of Digital Experience",
  "Director of Digital Experience",
  "Head of Service Design",
  "Service Design Director",
  "Head of Experience Design",
  "Experience Design Director",
];

export const DEFAULT_EXCLUDED_TITLES = [
  "Marketing",
  "Sales",
  "HR",
  "Recruitment",
  "Talent Acquisition",
  "Finance",
  "Legal",
  "Operations",
  "Intern",
  "Assistant",
  "Administrator",
];

function compactString(value) {
  return String(value || "").trim();
}

function uniqueValues(values) {
  return [...new Set(values.map(compactString).filter(Boolean))];
}

function isDomain(value) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value) && !/\s/.test(value);
}

export function assertSafeCognismPreviewUrl(url) {
  const lowerUrl = String(url || "").toLowerCase();
  const blockedPart = FORBIDDEN_COGNISM_URL_PARTS.find(part => lowerUrl.includes(part));
  if (blockedPart) {
    throw new Error(`Blocked unsafe Cognism preview URL containing "${blockedPart}"`);
  }
}

export function normalizePreviewInput(input = {}) {
  const companies = uniqueValues(Array.isArray(input.companies) ? input.companies : []);
  const targetTitles = uniqueValues(Array.isArray(input.targetTitles) ? input.targetTitles : []);
  const requestedMax = Number.parseInt(input.maxPerCompany, 10);
  const requireEmail = Boolean(input.requireEmail);
  const requireMobile = Boolean(input.requireMobile);
  const requireEmailOrMobile = Boolean(input.requireEmailOrMobile);

  return {
    companies,
    targetTitles,
    maxPerCompany: Number.isFinite(requestedMax) ? Math.max(requestedMax, 1) : 1,
    requireEmail,
    requireMobile,
    requireEmailOrMobile,
  };
}

export function buildCognismSearchBody(company, targetTitles) {
  const account = isDomain(company) ? { domains: [company] } : { names: [company] };

  return {
    jobTitles: targetTitles,
    excludeJobTitles: DEFAULT_EXCLUDED_TITLES,
    account,
  };
}

function textIncludesAny(value, needles) {
  const lowerValue = compactString(value).toLowerCase();
  return needles.some(needle => lowerValue.includes(needle.toLowerCase()));
}

function scoreContact(contact, targetTitles) {
  const title = compactString(contact.jobTitle);
  let score = 45;

  if (targetTitles.some(target => title.toLowerCase() === target.toLowerCase())) score += 35;
  else if (textIncludesAny(title, targetTitles)) score += 24;

  if (contact.hasEmail) score += 6;
  if (contact.hasMobilePhoneNumbers) score += 5;
  if (contact.hasDirectPhoneNumbers) score += 4;
  if (contact.hasLinkedinUrl || contact.hasLinkedInUrl) score += 3;
  if (contact.hasSeniority || contact.seniority) score += 3;

  return Math.min(score, 100);
}

export function mapCognismPreviewContact(company, contact, targetTitles) {
  const account = contact.account || {};
  const location = [contact.city, contact.state, contact.country].map(compactString).filter(Boolean).join(", ");

  return {
    company: compactString(account.name) || company,
    contactName: compactString(contact.fullName) || [contact.firstName, contact.lastName].map(compactString).filter(Boolean).join(" "),
    jobTitle: compactString(contact.jobTitle),
    seniority: compactString(contact.seniority || contact.managementLevel) || (contact.hasSeniority ? "Available" : "Not available"),
    department: compactString(contact.department || contact.jobFunction) || (contact.hasJobFunction ? "Available" : "Not available"),
    location: location || (contact.hasCity || contact.hasState || contact.hasCountry ? "Available" : "Not available"),
    linkedinAvailable: Boolean(contact.hasLinkedinUrl || contact.hasLinkedInUrl),
    emailAvailable: Boolean(contact.hasEmail),
    mobileAvailable: Boolean(contact.hasMobilePhoneNumbers),
    directDialAvailable: Boolean(contact.hasDirectPhoneNumbers),
    matchScore: scoreContact(contact, targetTitles),
    cognismContactId: compactString(contact.id || contact.contactId || contact.redeemId),
  };
}

export async function createCognismPreview(input, options = {}) {
  const { companies, targetTitles, maxPerCompany, requireEmail, requireMobile, requireEmailOrMobile } = normalizePreviewInput(input);
  const apiKey = options.apiKey ?? process.env.COGNISM_API_KEY;
  const fetcher = options.fetcher ?? fetch;
  const searchUrl = options.searchUrl ?? COGNISM_CONTACT_SEARCH_URL;

  assertSafeCognismPreviewUrl(searchUrl);

  if (!apiKey) {
    const error = new Error("COGNISM_API_KEY is required on the server");
    error.statusCode = 500;
    throw error;
  }

  if (!targetTitles.length) {
    const error = new Error("At least one target title is required for Cognism preview");
    error.statusCode = 400;
    throw error;
  }

  const results = [];

  for (const company of companies) {
    const response = await fetcher(searchUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildCognismSearchBody(company, targetTitles)),
    });

    if (!response.ok) {
      const error = new Error(`Cognism preview search failed for ${company}`);
      error.statusCode = response.status;
      throw error;
    }

    const data = await response.json();
    const contacts = Array.isArray(data.results) ? data.results : [];
    const bestContacts = contacts
      .map(contact => mapCognismPreviewContact(company, contact, targetTitles))
      .filter(contact => !requireEmailOrMobile || contact.emailAvailable || contact.mobileAvailable)
      .filter(contact => !requireEmail || contact.emailAvailable)
      .filter(contact => !requireMobile || contact.mobileAvailable)
      .sort((left, right) => right.matchScore - left.matchScore)
      .slice(0, maxPerCompany);

    results.push(...bestContacts);
  }

  return {
    mode: COGNISM_PREVIEW_MODE,
    estimatedCreditsUsed: 0,
    maxPerCompany,
    requireEmail,
    requireMobile,
    requireEmailOrMobile,
    results,
  };
}
