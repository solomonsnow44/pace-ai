const EVENT_TYPES = new Set(['funding', 'hiring', 'expansion', 'leadership_change', 'acquisition', 'partnership', 'product_launch', 'other']);

function clean(value = '') {
  return String(value || '').trim();
}

function normalizeName(value = '') {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(ltd|limited|inc|incorporated|llc|plc|corp|corporation|gmbh|sa|sas|bv)\b\.?/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeDomain(value = '') {
  const raw = clean(value);
  if (!raw) return '';
  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].toLowerCase();
  }
}

function normalizeDate(value = '') {
  const raw = clean(value);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function fingerprintPart(value = '') {
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
}

export function createCompanyFingerprint(event = {}) {
  const domain = normalizeDomain(event.company_domain || event.company_website);
  return domain ? `domain:${domain}` : `name:${fingerprintPart(normalizeName(event.company_name))}`;
}

export function createEventFingerprint(event = {}) {
  const company = createCompanyFingerprint(event);
  const eventType = EVENT_TYPES.has(clean(event.event_type)) ? clean(event.event_type) : 'other';
  const eventDate = normalizeDate(event.event_date) || 'unknown-date';
  const sourceOrTitle = fingerprintPart(event.source_url || event.title || event.summary);
  return [company, eventType, eventDate, sourceOrTitle || 'unknown-source'].join('|');
}

function normalizeEvent(event = {}, runId = null) {
  const eventType = EVENT_TYPES.has(clean(event.event_type)) ? clean(event.event_type) : 'other';
  const companyDomain = normalizeDomain(event.company_domain || event.company_website);
  const normalized = {
    run_id: runId,
    company_name: clean(event.company_name),
    company_domain: companyDomain || null,
    company_website: clean(event.company_website) || (companyDomain ? `https://${companyDomain}` : null),
    company_linkedin_url: clean(event.company_linkedin_url) || null,
    event_type: eventType,
    event_date: normalizeDate(event.event_date),
    title: clean(event.title) || null,
    summary: clean(event.summary) || null,
    funding_amount: clean(event.funding_amount) || null,
    funding_currency: clean(event.funding_currency) || null,
    funding_round: clean(event.funding_round) || null,
    investors: Array.isArray(event.investors) ? event.investors.map(clean).filter(Boolean) : [],
    source_name: clean(event.source_name) || null,
    source_url: clean(event.source_url) || null,
    confidence_score: Number.isFinite(Number(event.confidence_score)) ? Number(event.confidence_score) : null,
    raw_data: event && typeof event === 'object' ? event : {},
    status: 'new',
  };
  normalized.company_fingerprint = createCompanyFingerprint(normalized);
  normalized.event_fingerprint = createEventFingerprint(normalized);
  return normalized;
}

async function findExistingCompany(client, organizationId, event) {
  const domain = normalizeDomain(event.company_domain || event.company_website);
  const name = normalizeName(event.company_name);
  if (!domain && !name) return null;
  const { data } = await client
    .from('companies')
    .select('id,name,domain,website')
    .eq('organization_id', organizationId)
    .or([
      domain ? `domain.ilike.${domain}` : '',
      domain ? `website.ilike.%${domain}%` : '',
      name ? `name.ilike.${event.company_name}` : '',
    ].filter(Boolean).join(','))
    .limit(1);
  return data?.[0] || null;
}

async function isDuplicateEvent(client, organizationId, event) {
  const sourceUrl = clean(event.source_url);
  const eventDate = event.event_date;
  const similarStart = eventDate ? new Date(eventDate) : null;
  const similarEnd = eventDate ? new Date(eventDate) : null;
  if (similarStart && similarEnd) {
    similarStart.setDate(similarStart.getDate() - 7);
    similarEnd.setDate(similarEnd.getDate() + 7);
  }

  const exact = await client
    .from('intent_events')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('event_fingerprint', event.event_fingerprint)
    .maybeSingle();
  if (exact.data?.id) return true;

  if (sourceUrl) {
    const byUrl = await client
      .from('intent_events')
      .select('id')
      .eq('organization_id', organizationId)
      .ilike('source_url', sourceUrl)
      .limit(1);
    if (byUrl.data?.length) return true;
  }

  if (similarStart && similarEnd) {
    const similar = await client
      .from('intent_events')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('company_fingerprint', event.company_fingerprint)
      .eq('event_type', event.event_type)
      .gte('event_date', similarStart.toISOString().slice(0, 10))
      .lte('event_date', similarEnd.toISOString().slice(0, 10))
      .limit(1);
    if (similar.data?.length) return true;
  }

  return false;
}

export async function runIntentResearch({ client, organizationId, input = {} }) {
  const now = new Date().toISOString();
  const runPayload = {
    organization_id: organizationId,
    query: clean(input.query),
    date_range_start: normalizeDate(input.dateRangeStart),
    date_range_end: normalizeDate(input.dateRangeEnd),
    event_types: Array.isArray(input.eventTypes) ? input.eventTypes.filter(type => EVENT_TYPES.has(type)) : [],
    geography: clean(input.geography) || null,
    industry: clean(input.industry) || null,
    source_filter: Array.isArray(input.sourceFilter) ? input.sourceFilter.map(clean).filter(Boolean) : [],
    status: 'running',
  };

  const { data: run, error: runError } = await client
    .from('intent_research_runs')
    .insert(runPayload)
    .select('*')
    .single();
  if (runError) throw runError;

  const extractedEvents = Array.isArray(input.events) ? input.events : [];
  let newInserted = 0;
  let duplicatesSkipped = 0;
  const insertedEvents = [];

  try {
    for (const candidate of extractedEvents) {
      const event = normalizeEvent(candidate, run.id);
      if (!event.company_name) {
        duplicatesSkipped += 1;
        continue;
      }
      const duplicate = await isDuplicateEvent(client, organizationId, event);
      if (duplicate) {
        duplicatesSkipped += 1;
        continue;
      }
      const existingCompany = await findExistingCompany(client, organizationId, event);
      const { data: inserted, error } = await client
        .from('intent_events')
        .insert({
          organization_id: organizationId,
          ...event,
          existing_company_id: existingCompany?.id || null,
        })
        .select('*')
        .single();
      if (error) throw error;
      insertedEvents.push(inserted);
      newInserted += 1;

      const people = Array.isArray(candidate.people) ? candidate.people : [];
      if (people.length) {
        const peopleRows = people.map(person => ({
          organization_id: organizationId,
          intent_event_id: inserted.id,
          company_name: inserted.company_name,
          company_domain: inserted.company_domain,
          name: clean(person.name) || null,
          title: clean(person.title) || null,
          linkedin_url: clean(person.linkedin_url) || null,
          email: clean(person.email).toLowerCase() || null,
          phone: clean(person.phone) || null,
          department: clean(person.department) || null,
          seniority: clean(person.seniority) || null,
          source: clean(person.source || inserted.source_name) || null,
          raw_data: person,
          status: 'new',
        })).filter(person => person.name || person.email || person.linkedin_url || person.phone);
        if (peopleRows.length) {
          const { error: peopleError } = await client.from('intent_people').insert(peopleRows);
          if (peopleError) throw peopleError;
        }
      }
    }

    const { data: completedRun, error: completeError } = await client
      .from('intent_research_runs')
      .update({
        status: 'completed',
        total_found: extractedEvents.length,
        new_inserted: newInserted,
        duplicates_skipped: duplicatesSkipped,
        completed_at: now,
      })
      .eq('organization_id', organizationId)
      .eq('id', run.id)
      .select('*')
      .single();
    if (completeError) throw completeError;
    return { run: completedRun, events: insertedEvents, totalFound: extractedEvents.length, newInserted, duplicatesSkipped };
  } catch (error) {
    await client
      .from('intent_research_runs')
      .update({ status: 'failed', error_message: error.message || 'Intent research failed', completed_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .eq('id', run.id);
    throw error;
  }
}
