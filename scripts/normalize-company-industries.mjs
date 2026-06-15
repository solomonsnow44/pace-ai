import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const path of [".env", ".env.local"]) {
  if (!fs.existsSync(path)) continue;
  for (const line of fs.readFileSync(path, "utf8").split(/\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const shouldApply = process.argv.includes("--apply");

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase URL or service role key.");
}

const supabase = createClient(supabaseUrl, serviceKey);

function hasAny(text, terms) {
  return terms.some(term => text.includes(term));
}

function canonicalIndustry(company) {
  const rawIndustry = String(company.industry || "");
  const fields = [
    company.name,
    rawIndustry,
    company.domain,
    company.website,
    company.notes,
    company.custom_fields?.company_description,
    company.custom_fields?.source_sheet,
    company.custom_fields?.source_file,
  ].filter(Boolean).join(" ").toLowerCase();

  if (hasAny(fields, ["nhs", "hospital", "health board", "healthcare", "health care", "ambulance", "mental health", "medical", "orthopaedic", "cancer centre"])) {
    return "Healthcare";
  }
  if (hasAny(fields, ["housing association", "housing group", "clarion", "wheatley", "livewest"])) {
    return "Housing";
  }
  if (hasAny(fields, ["barratt", "bellway", "berkeley", "canary wharf", "countryside", "mccarthy stone", "taylor wimpey", "vistry", "real estate", "property", "development"])) {
    return "Real estate";
  }
  if (hasAny(fields, [
    "building materials",
    "glass, ceramics",
    "aggregate",
    "wienerberger",
    "wickes",
    "travis perkins",
    "plumbing supplies",
    "mkm",
    "kingspan",
    "knauf",
    "hilti",
    "tarmac",
    "topps tiles",
    "velux",
    "jeld-wen",
    "ibmg",
    "bmi group",
    "marshalls",
    "crh",
  ])) {
    return "Building materials";
  }
  if (hasAny(fields, ["sunbelt", "speedy hire", "brandon hire", "equipment rental", "hire station"])) {
    return "Equipment rental";
  }
  if (hasAny(fields, ["facilities services", "fm contract", "facilities management", "facilities"])) {
    return "Facilities";
  }
  if (hasAny(fields, ["utilities", "water", "energy", "power", "gas", "bechtel", "clancy", "amcogiffen", "constructel"])) {
    return "Utilities";
  }
  if (hasAny(fields, ["transportation", "trucking", "railroad", "warehousing", "logistics", "havi"])) {
    return "Logistics";
  }
  if (hasAny(fields, ["architecture", "planning", "design", "interior architects"])) {
    return "Architecture";
  }
  if (hasAny(fields, ["civil engineering", "infrastructure", "rail", "highways", "colas", "strabag", "volker", "keltbray", "balfour beatty", "bam uk", "bell group", "carey group", "sisk", "kier", "laing", "wates"])) {
    return "Civil engineering";
  }
  if (hasAny(fields, ["mechanical or industrial engineering", "industrial automation", "electrical/electronic", "engineering", "altrad", "jones engineering", "kaefer", "kone", "lucy group", "mercury"])) {
    return "Engineering";
  }
  if (hasAny(fields, ["management consulting", "consultancy", "consulting", "advisory", "turner & townsend", "buro happold", "cundall", "hoare lea", "sweco", "waterman", "linesight", "currie & brown", "cumming group", "wt"])) {
    return "Consultancy";
  }
  if (hasAny(fields, ["manufacturing", "machinery", "automotive", "chemicals", "plastics", "packaging", "mining", "metals"])) {
    return "Manufacturing";
  }
  if (hasAny(fields, ["government", "public policy", "government relations", "legislative office"])) {
    return "Public sector";
  }
  if (hasAny(fields, ["nonprofit", "non-profit", "civic", "membership organizations"])) {
    return "Nonprofit";
  }
  if (hasAny(fields, ["security and investigations"])) {
    return "Security";
  }
  if (hasAny(fields, ["information technology", "technology", "software"])) {
    return "Technology";
  }
  if (hasAny(fields, ["construction"])) {
    return "Construction";
  }
  return rawIndustry.trim() || "Unspecified";
}

const { data: companies, error } = await supabase
  .from("companies")
  .select("id,name,industry,domain,website,notes,custom_fields")
  .order("name", { ascending: true })
  .limit(10000);

if (error) throw error;

const changes = (companies || [])
  .map(company => {
    const nextIndustry = canonicalIndustry(company);
    return {
      ...company,
      nextIndustry,
      changed: String(company.industry || "") !== nextIndustry,
    };
  })
  .filter(company => company.changed);

const summary = changes.reduce((counts, company) => {
  counts[company.nextIndustry] = (counts[company.nextIndustry] || 0) + 1;
  return counts;
}, {});

console.log(JSON.stringify({
  mode: shouldApply ? "apply" : "dry-run",
  totalCompanies: companies?.length || 0,
  changes: changes.length,
  summary,
  preview: changes.slice(0, 80).map(company => ({
    name: company.name,
    from: company.industry || "",
    to: company.nextIndustry,
  })),
}, null, 2));

if (!shouldApply) process.exit(0);

for (const company of changes) {
  const nextCustomFields = {
    ...(company.custom_fields || {}),
    raw_industry: company.custom_fields?.raw_industry || company.industry || null,
    industry_normalized_at: new Date().toISOString(),
  };
  const { error: updateError } = await supabase
    .from("companies")
    .update({
      industry: company.nextIndustry,
      custom_fields: nextCustomFields,
    })
    .eq("id", company.id);
  if (updateError) throw updateError;
}

console.log(`Updated ${changes.length} company industries.`);
