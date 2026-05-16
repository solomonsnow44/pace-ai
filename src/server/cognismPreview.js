export const COGNISM_PREVIEW_MODE = "preview_only";
export const FORBIDDEN_COGNISM_URL_PARTS = ["redeem", "reveal", "export", "enrich"];
export const COGNISM_CONTACT_SEARCH_URL = "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=100";
export const DEFAULT_MAX_CONTACTS_PER_COMPANY = 10;

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

function normalizeCountry(value) {
  const country = compactString(value);
  if (!country) return "";
  const aliases = {
    uk: "United Kingdom",
    "u.k.": "United Kingdom",
    britain: "United Kingdom",
    england: "United Kingdom",
    usa: "United States",
    us: "United States",
    "u.s.": "United States",
    "united states of america": "United States",
  };
  return aliases[country.toLowerCase()] || country;
}

export function expandTargetTitles(targetTitles) {
  const titles = uniqueValues(targetTitles);
  const titleText = titles.join(" ").toLowerCase();
  const shouldAddProductExperienceTitles = /\b(ux|user experience|experience|product design|product)\b/i.test(titleText);

  if (!shouldAddProductExperienceTitles) return titles;

  return uniqueValues([
    ...titles,
    "Chief Product Officer",
    "VP Product",
    "VP Product Management",
    "Head of Product",
    "Product Director",
    "Director of Product Management",
    "Head of Product Support",
    "Director of Product Support",
    "VP Product Support",
    "Product Support Director",
    "Product Support Lead",
    "Head of Product Operations",
    "Director of Product Operations",
    "Product Operations Director",
    "Head of Customer Experience",
    "Director of Customer Experience",
    "Head of Customer Support",
    "Director of Customer Support",
    "Head of Customer Operations",
  ]);
}

function isDomain(value) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value) && !/\s/.test(value);
}

function normalizeCompanyMatchValue(value) {
  return compactString(value).replace(/\s+/g, " ").toLowerCase();
}

function normalizeDomainMatchValue(value) {
  return compactString(value)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

function accountMatchesCompany(company, account = {}) {
  if (isDomain(company)) {
    const requestedDomain = normalizeDomainMatchValue(company);
    const candidateDomains = [
      account.domain,
      account.website,
      account.url,
      ...(Array.isArray(account.domains) ? account.domains : []),
    ].map(normalizeDomainMatchValue).filter(Boolean);

    return candidateDomains.includes(requestedDomain);
  }

  return normalizeCompanyMatchValue(account.name) === normalizeCompanyMatchValue(company);
}

export function assertSafeCognismPreviewUrl(url) {
  const lowerUrl = String(url || "").toLowerCase();
  const blockedPart = FORBIDDEN_COGNISM_URL_PARTS.find(part => lowerUrl.includes(part));
  if (blockedPart) {
    throw new Error(`Blocked unsafe lead preview URL containing "${blockedPart}"`);
  }
}

function buildSearchPageUrl(searchUrl, lastReturnedKey = "") {
  const url = new URL(searchUrl);
  url.searchParams.set("lastReturnedKey", lastReturnedKey);
  return url.toString();
}

function extractLastReturnedKey(data = {}) {
  return compactString(
    data.lastReturnedKey
    || data.nextLastReturnedKey
    || data.pagination?.lastReturnedKey
    || data.pagination?.nextLastReturnedKey
    || data.page?.lastReturnedKey
    || data.page?.nextLastReturnedKey
  );
}

export function normalizePreviewInput(input = {}) {
  const companies = uniqueValues(Array.isArray(input.companies) ? input.companies : []);
  const targetTitles = uniqueValues(Array.isArray(input.targetTitles) ? input.targetTitles : []);
  const requestedMax = Number.parseInt(input.maxPerCompany, 10);
  const requireEmail = Boolean(input.requireEmail);
  const requireMobile = Boolean(input.requireMobile);
  const requireMobileAvailable = Boolean(input.requireMobileAvailable ?? input.requireEmailOrMobile);
  const countries = uniqueValues(Array.isArray(input.countries) ? input.countries.map(normalizeCountry) : []);

  return {
    companies,
    targetTitles,
    maxPerCompany: Number.isFinite(requestedMax) ? Math.max(requestedMax, 1) : DEFAULT_MAX_CONTACTS_PER_COMPANY,
    requireEmail,
    requireMobile,
    requireMobileAvailable,
    countries,
  };
}

export function buildCognismSearchBody(company, targetTitles, countries = []) {
  const account = isDomain(company) ? { domains: [company] } : { names: [company] };
  const selectedCountries = uniqueValues(countries.map(normalizeCountry));

  const body = {
    jobTitles: expandTargetTitles(targetTitles),
    excludeJobTitles: DEFAULT_EXCLUDED_TITLES,
    account,
  };

  if (selectedCountries.length) {
    body.countries = selectedCountries;
    body.locations = selectedCountries;
  }

  return body;
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
    linkedinProfileUrl: compactString(contact.linkedinUrl || contact.linkedInUrl || contact.linkedinProfileUrl),
    emailAvailable: Boolean(contact.hasEmail),
    mobileAvailable: Boolean(contact.hasMobilePhoneNumbers),
    directDialAvailable: Boolean(contact.hasDirectPhoneNumbers),
    matchScore: scoreContact(contact, targetTitles),
    cognismContactId: compactString(contact.id || contact.contactId || contact.redeemId),
    dataSource: "cognism_preview",
  };
}

export async function createCognismPreview(input, options = {}) {
  const { companies, targetTitles, maxPerCompany, requireEmail, requireMobile, requireMobileAvailable, countries } = normalizePreviewInput(input);
  const expandedTargetTitles = expandTargetTitles(targetTitles);
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
    const error = new Error("At least one target title is required for lead preview");
    error.statusCode = 400;
    throw error;
  }

  const results = [];

  for (const company of companies) {
    const contacts = [];
    const seenPageKeys = new Set();
    let lastReturnedKey = "";

    while (true) {
      const pageUrl = buildSearchPageUrl(searchUrl, lastReturnedKey);
      assertSafeCognismPreviewUrl(pageUrl);

      const response = await fetcher(pageUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildCognismSearchBody(company, expandedTargetTitles, countries)),
      });

      if (!response.ok) {
        const error = new Error(`Lead preview search failed for ${company}`);
        error.statusCode = response.status;
        throw error;
      }

      const data = await response.json();
      const pageContacts = Array.isArray(data.results) ? data.results : [];
      contacts.push(...pageContacts);

      const nextLastReturnedKey = extractLastReturnedKey(data);
      if (!nextLastReturnedKey || seenPageKeys.has(nextLastReturnedKey) || !pageContacts.length) break;

      seenPageKeys.add(nextLastReturnedKey);
      lastReturnedKey = nextLastReturnedKey;
    }

    const bestContacts = contacts
      .filter(contact => accountMatchesCompany(company, contact.account || {}))
      .map(contact => mapCognismPreviewContact(company, contact, expandedTargetTitles))
      .filter(contact => !requireMobileAvailable || contact.mobileAvailable)
      .filter(contact => !requireEmail || contact.emailAvailable)
      .filter(contact => !requireMobile || contact.mobileAvailable)
      .filter(contact => !countries.length || countries.some(country => contact.location.toLowerCase().includes(country.toLowerCase())))
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
    requireMobileAvailable,
    countries,
    results,
  };
}
