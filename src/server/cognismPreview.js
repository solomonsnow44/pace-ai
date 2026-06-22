export const COGNISM_PREVIEW_MODE = "preview_only";
export const FORBIDDEN_COGNISM_URL_PARTS = ["redeem", "reveal", "export", "enrich"];
export const COGNISM_CONTACT_SEARCH_URL = "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=100";
export const COGNISM_CONTACT_REDEEM_URL = "https://app.cognism.com/api/search/contact/redeem";
export const DEFAULT_MAX_CONTACTS_PER_COMPANY = 1;
export const MAX_COGNISM_REDEEM_IDS = 20;

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

function compactLower(value) {
  return compactString(value).toLowerCase();
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

export function assertSafeCognismRedeemUrl(url) {
  const targetUrl = new URL(String(url || ""));
  if (targetUrl.origin !== "https://app.cognism.com" || targetUrl.pathname !== "/api/search/contact/redeem") {
    throw new Error("Blocked unsafe Cognism redeem URL");
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
  const requireDirectDialAvailable = Boolean(input.requireDirectDialAvailable);
  const countries = uniqueValues(Array.isArray(input.countries) ? input.countries.map(normalizeCountry) : []);

  return {
    companies,
    targetTitles,
    maxPerCompany: Number.isFinite(requestedMax) ? Math.max(requestedMax, 1) : DEFAULT_MAX_CONTACTS_PER_COMPANY,
    requireEmail,
    requireMobile,
    requireMobileAvailable,
    requireDirectDialAvailable,
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
  const redeemId = compactString(contact.redeemId || contact.redeemID || contact.redeem_id || contact.id || contact.contactId);

  return {
    company: compactString(account.name) || company,
    contactName: compactString(contact.fullName) || [contact.firstName, contact.lastName].map(compactString).filter(Boolean).join(" "),
    jobTitle: compactString(contact.jobTitle),
    seniority: compactString(contact.seniority || contact.managementLevel) || (contact.hasSeniority ? "Available" : "Not available"),
    department: compactString(contact.department || contact.jobFunction) || (contact.hasJobFunction ? "Available" : "Not available"),
    location: location || (contact.hasCity || contact.hasState || contact.hasCountry ? "Available" : "Not available"),
    linkedinAvailable: Boolean(contact.hasLinkedinUrl || contact.hasLinkedInUrl),
    linkedinProfileUrl: compactString(contact.linkedinUrl || contact.linkedInUrl || contact.linkedinProfileUrl),
    profilePictureUrl: extractProfilePictureUrl(contact),
    emailAvailable: Boolean(contact.hasEmail),
    mobileAvailable: Boolean(contact.hasMobilePhoneNumbers),
    directDialAvailable: Boolean(contact.hasDirectPhoneNumbers),
    matchScore: scoreContact(contact, targetTitles),
    cognismContactId: compactString(contact.id || contact.contactId || contact.redeemId),
    cognismRedeemId: redeemId,
    dataSource: "cognism",
  };
}

function createLocalPreviewResults(companies, targetTitles, maxPerCompany, requireMobileAvailable, requireDirectDialAvailable) {
  return companies.flatMap(company => {
    const safeCompany = compactString(company) || "Target account";
    return Array.from({ length: maxPerCompany }, (_, index) => {
      const title = targetTitles[index % targetTitles.length] || "Target contact";
      return {
        company: safeCompany,
        contactName: `${safeCompany} ${title} ${index + 1}`,
        jobTitle: title,
        location: "",
        emailAvailable: true,
        mobileAvailable: requireMobileAvailable ? true : index % 2 === 0,
        directDialAvailable: requireDirectDialAvailable ? true : index % 3 === 0,
        confidence: 0.5,
        matchScore: 0.5,
        cognismContactId: `local-preview:${safeCompany.toLowerCase()}:${index + 1}`,
        cognismRedeemId: `local-preview:${safeCompany.toLowerCase()}:${index + 1}`,
        dataSource: "cognism",
      };
    });
  });
}

function normalizeRedeemInput(input = {}) {
  const requestedLeads = Array.isArray(input.leads) ? input.leads : [];
  const requestedIds = Array.isArray(input.redeemIds) ? input.redeemIds : [];
  const seen = new Set();
  const leads = [];

  for (const lead of requestedLeads) {
    const redeemId = compactString(lead?.redeemId || lead?.cognismRedeemId || lead?.cognismContactId || lead?.id);
    if (!redeemId || seen.has(redeemId)) continue;
    seen.add(redeemId);
    leads.push({ ...lead, redeemId, rowId: compactString(lead?.rowId) || redeemId });
  }

  for (const redeemIdValue of requestedIds) {
    const redeemId = compactString(redeemIdValue);
    if (!redeemId || seen.has(redeemId)) continue;
    seen.add(redeemId);
    leads.push({ redeemId, rowId: redeemId });
  }

  if (!leads.length) {
    const error = new Error("At least one Cognism redeem ID is required");
    error.statusCode = 400;
    throw error;
  }

  if (leads.length > MAX_COGNISM_REDEEM_IDS) {
    const error = new Error(`Redeem up to ${MAX_COGNISM_REDEEM_IDS} contacts at a time`);
    error.statusCode = 400;
    throw error;
  }

  return {
    leads,
    redeemIds: leads.map(lead => lead.redeemId),
  };
}

function extractRecords(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.contacts)) return data.contacts;
  if (Array.isArray(data?.redeemedContacts)) return data.redeemedContacts;
  if (Array.isArray(data?.data?.results)) return data.data.results;
  if (Array.isArray(data?.data?.result)) return data.data.result;
  if (Array.isArray(data?.data?.contacts)) return data.data.contacts;
  return [];
}

async function responseErrorDetail(response) {
  try {
    const data = await response.clone().json();
    return compactString(
      data?.message
      || data?.error
      || data?.errors?.[0]?.message
      || data?.errors?.[0]
      || data?.detail
    );
  } catch {
    try {
      return compactString(await response.text());
    } catch {
      return "";
    }
  }
}

function extractEmail(record = {}) {
  const candidates = [
    record.email?.address,
    record.email?.value,
    record.emailAddress,
    typeof record.email === "string" ? record.email : "",
    ...(Array.isArray(record.emails) ? record.emails.map(email => email?.address || email?.value || email) : []),
  ];
  return compactString(candidates.find(Boolean));
}

function extractProfilePictureUrl(record = {}) {
  const candidates = [
    record.profilePictureUrl,
    record.profile_picture_url,
    record.profileImageUrl,
    record.profile_image_url,
    record.photoUrl,
    record.photo_url,
    record.pictureUrl,
    record.picture_url,
    record.avatarUrl,
    record.avatar_url,
    record.imageUrl,
    record.image_url,
    record.linkedinProfilePictureUrl,
    record.linkedin_profile_picture_url,
    record.linkedinImageUrl,
    record.linkedin_image_url,
    record.person?.profilePictureUrl,
    record.person?.profileImageUrl,
    record.person?.photoUrl,
  ];
  return compactString(candidates.find(Boolean));
}

function phoneNumberValue(phone) {
  if (!phone) return "";
  if (typeof phone === "string") return compactString(phone);
  return compactString(phone.number || phone.phoneNumber || phone.value || phone.rawNumber);
}

function phoneLabelValue(phone) {
  if (!phone || typeof phone === "string") return "";
  return compactLower([phone.label, phone.type, phone.phoneType, phone.numberType, phone.category].filter(Boolean).join(" "));
}

function phoneEntries(record = {}) {
  const sourceLists = [
    ["mobile", record.mobilePhoneNumbers],
    ["mobile", record.mobilePhones],
    ["mobile", record.mobileNumbers],
    ["mobile", record.mobiles],
    ["direct", record.directPhoneNumbers],
    ["direct", record.directPhones],
    ["direct", record.directNumbers],
    ["direct", record.directDials],
    ["generic", record.phoneNumbers],
    ["generic", record.phones],
  ];

  return sourceLists.flatMap(([source, list]) => Array.isArray(list)
    ? list.map(phone => ({ phone, source, label: phoneLabelValue(phone), number: phoneNumberValue(phone) })).filter(entry => entry.number && entry.number.toLowerCase() !== "dnc" && entry.phone?.dnc !== true)
    : []);
}

function labelledPhoneKind(entry) {
  if (entry.label.includes("mobile") || entry.label.includes("cell")) return "mobile";
  if (entry.label.includes("direct")) return "direct";
  return "";
}

function extractPhoneNumbers(record = {}) {
  const entries = phoneEntries(record);
  const mobileEntries = entries.filter(entry => entry.source === "mobile");
  const directEntries = entries.filter(entry => entry.source === "direct");
  const genericEntries = entries.filter(entry => entry.source === "generic");
  const sourceMobile = mobileEntries.find(entry => labelledPhoneKind(entry) === "mobile")?.number || mobileEntries[0]?.number || "";
  const sourceDirect = directEntries.find(entry => labelledPhoneKind(entry) === "direct")?.number || directEntries[0]?.number || "";
  const genericMobile = genericEntries.find(entry => labelledPhoneKind(entry) === "mobile")?.number || "";
  const genericDirect = genericEntries.find(entry => labelledPhoneKind(entry) === "direct")?.number || "";

  return {
    mobile: sourceMobile || genericMobile,
    directDial: sourceDirect || genericDirect,
  };
}

function recordRedeemId(record = {}) {
  return compactString(record.redeemId || record.redeemID || record.redeem_id || record.id || record.contactId);
}

function normalizePhoneValue(value) {
  return compactString(value).replace(/[^\d+]/g, "");
}

function mapCognismRedeemedContact(record = {}, requestedLead = {}) {
  const account = record.account || {};
  const firstName = compactString(record.firstName);
  const lastName = compactString(record.lastName);
  const { mobile, directDial } = extractPhoneNumbers(record);
  const requestedDirectDial = compactString(requestedLead.manualDirectDial);
  const shouldKeepRequestedDirectDial = requestedDirectDial && normalizePhoneValue(requestedDirectDial) !== normalizePhoneValue(mobile);

  return {
    ...requestedLead,
    rowId: compactString(requestedLead.rowId) || recordRedeemId(record),
    cognismContactId: requestedLead.cognismContactId || compactString(record.id || record.contactId || requestedLead.redeemId),
    cognismRedeemId: recordRedeemId(record) || requestedLead.redeemId,
    company: compactString(account.name) || compactString(record.companyName) || requestedLead.company || "",
    contactName: compactString(record.fullName) || [firstName, lastName].filter(Boolean).join(" ") || requestedLead.contactName || "",
    jobTitle: compactString(record.jobTitle) || requestedLead.jobTitle || "",
    location: [record.city, record.state, record.country].map(compactString).filter(Boolean).join(", ") || requestedLead.location || "",
    linkedinProfileUrl: compactString(record.linkedinUrl || record.linkedInUrl || record.linkedinURL || record.linkedInURL || record.linkedinProfileUrl) || requestedLead.linkedinProfileUrl || "",
    profilePictureUrl: extractProfilePictureUrl(record) || requestedLead.profilePictureUrl || "",
    manualEmail: extractEmail(record) || requestedLead.manualEmail || "",
    manualMobile: mobile || requestedLead.manualMobile || "",
    manualDirectDial: directDial || (shouldKeepRequestedDirectDial ? requestedDirectDial : ""),
    emailAvailable: Boolean(extractEmail(record) || requestedLead.emailAvailable),
    mobileAvailable: Boolean(mobile || requestedLead.mobileAvailable),
    directDialAvailable: Boolean(directDial || requestedLead.directDialAvailable),
    redeemed: true,
    redeemedAt: new Date().toISOString(),
    dataSource: "cognism",
  };
}

function createLocalRedeemResults(leads) {
  return leads.map((lead, index) => {
    const nameParts = compactString(lead.contactName)
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    const first = nameParts[0] || "lead";
    const last = nameParts[1] || String(index + 1);
    const companySlug = compactString(lead.company).toLowerCase().replace(/[^a-z0-9]+/g, "") || "company";
    return {
      ...lead,
      manualEmail: lead.manualEmail || `${first}.${last}@${companySlug}.example`,
      manualMobile: lead.manualMobile || `+15550001${String(index + 1).padStart(3, "0")}`,
      manualDirectDial: lead.manualDirectDial || `+15550002${String(index + 1).padStart(3, "0")}`,
      mobileAvailable: true,
      directDialAvailable: true,
      redeemed: true,
      redeemedAt: new Date().toISOString(),
      dataSource: "cognism",
    };
  });
}

export async function redeemCognismContacts(input, options = {}) {
  const { leads, redeemIds } = normalizeRedeemInput(input);
  const apiKey = options.apiKey ?? process.env.COGNISM_API_KEY;
  const fetcher = options.fetcher ?? fetch;
  const redeemUrl = options.redeemUrl ?? COGNISM_CONTACT_REDEEM_URL;

  assertSafeCognismRedeemUrl(redeemUrl);

  if (!apiKey) {
    if (options.allowLocalRedeemWithoutApiKey) {
      return {
        mode: "redeem",
        estimatedCreditsUsed: leads.length,
        redeemed: createLocalRedeemResults(leads),
        diagnostics: input.debug ? { requested: leads, rawRecords: [] } : null,
        warning: "Using local redeem data because COGNISM_API_KEY is not available in this local server.",
      };
    }
    const error = new Error("COGNISM_API_KEY is required on the server");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetcher(redeemUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ redeemIds }),
  });

  if (!response.ok) {
    const detail = await responseErrorDetail(response);
    const error = new Error(detail ? `Lead redeem request failed: ${detail}` : `Lead redeem request failed with status ${response.status}`);
    error.statusCode = response.status;
    error.provider = "cognism";
    error.providerStatus = response.status;
    error.providerUrl = redeemUrl;
    throw error;
  }

  const data = await response.json();
  const requestedByRedeemId = new Map(leads.map(lead => [lead.redeemId, lead]));
  const records = extractRecords(data);
  const redeemed = records.map((record, index) => {
    const requestedLead = requestedByRedeemId.get(recordRedeemId(record)) || leads[index] || {};
    return mapCognismRedeemedContact(record, requestedLead);
  });

  return {
    mode: "redeem",
    estimatedCreditsUsed: redeemed.length,
    redeemed,
    diagnostics: input.debug ? { requested: leads, rawRecords: records } : null,
  };
}

export async function createCognismPreview(input, options = {}) {
  const { companies, targetTitles, maxPerCompany, requireEmail, requireMobile, requireMobileAvailable, requireDirectDialAvailable, countries } = normalizePreviewInput(input);
  const expandedTargetTitles = expandTargetTitles(targetTitles);
  const apiKey = options.apiKey ?? process.env.COGNISM_API_KEY;
  const fetcher = options.fetcher ?? fetch;
  const searchUrl = options.searchUrl ?? COGNISM_CONTACT_SEARCH_URL;

  assertSafeCognismPreviewUrl(searchUrl);

  if (!apiKey) {
    if (options.allowLocalPreviewWithoutApiKey) {
      const localResults = createLocalPreviewResults(companies, expandedTargetTitles, maxPerCompany, requireMobileAvailable, requireDirectDialAvailable);
      const debugLocalResults = input.debug
        ? localResults.map(result => ({ ...result, _debugRawPreviewRecord: result, _debugRequestedCompany: result.company }))
        : localResults;
      return {
        mode: COGNISM_PREVIEW_MODE,
        estimatedCreditsUsed: 0,
        maxPerCompany,
        requireEmail,
        requireMobile,
        requireMobileAvailable,
        requireDirectDialAvailable,
        countries,
        results: debugLocalResults,
        diagnostics: input.debug ? {
          rawPreviewRecords: localResults.map(result => ({
            company: result.company,
            cognismContactId: result.cognismContactId,
            cognismRedeemId: result.cognismRedeemId,
            rawRecord: result,
          })),
        } : null,
        warning: "Using local preview data because COGNISM_API_KEY is not available in this local server.",
      };
    }
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
  const rawPreviewRecords = [];

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
      .map(contact => ({ mapped: mapCognismPreviewContact(company, contact, expandedTargetTitles), rawRecord: contact }))
      .filter(({ mapped }) => !requireMobileAvailable || mapped.mobileAvailable)
      .filter(({ mapped }) => !requireDirectDialAvailable || mapped.directDialAvailable)
      .filter(({ mapped }) => !requireEmail || mapped.emailAvailable)
      .filter(({ mapped }) => !requireMobile || mapped.mobileAvailable)
      .filter(({ mapped }) => !countries.length || countries.some(country => mapped.location.toLowerCase().includes(country.toLowerCase())))
      .sort((left, right) => right.mapped.matchScore - left.mapped.matchScore)
      .slice(0, maxPerCompany);

    results.push(...bestContacts.map(({ mapped, rawRecord }) => input.debug
      ? ({ ...mapped, _debugRawPreviewRecord: rawRecord, _debugRequestedCompany: company })
      : mapped));
    rawPreviewRecords.push(...bestContacts.map(({ mapped, rawRecord }) => ({
      company,
      cognismContactId: mapped.cognismContactId,
      cognismRedeemId: mapped.cognismRedeemId,
      rawRecord,
    })));
  }

  return {
    mode: COGNISM_PREVIEW_MODE,
    estimatedCreditsUsed: 0,
    maxPerCompany,
    requireEmail,
    requireMobile,
    requireMobileAvailable,
    requireDirectDialAvailable,
    countries,
    results,
    diagnostics: input.debug ? { rawPreviewRecords } : null,
  };
}
