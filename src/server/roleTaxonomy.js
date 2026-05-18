const DEFAULT_ROLE_LIMIT = 45;

const roleTaxonomy = [
  {
    id: "executive",
    keywords: ["executive", "c-suite", "c suite", "leadership", "board", "founder", "cofounder", "owner", "managing director", "general manager", "ceo", "coo", "cfo", "cto", "cio", "cmo", "cro", "chro", "cpo"],
    abbreviations: ["ceo", "coo", "cfo", "cto", "cio", "cmo", "cro", "chro", "cpo", "md"],
    titles: {
      cSuite: ["Chief Executive Officer", "Chief Operating Officer", "Chief Financial Officer", "Chief Technology Officer", "Chief Information Officer", "Chief Marketing Officer", "Chief Revenue Officer", "Chief People Officer", "Managing Director", "General Manager"],
      vp: ["Executive Vice President", "Senior Vice President", "VP Strategy", "VP Operations"],
      director: ["Executive Director", "Strategy Director", "Director of Business Operations", "Director of Corporate Development"],
      manager: ["Business Manager", "Strategy Manager", "Executive Operations Manager"],
      specialist: ["Chief of Staff", "Executive Assistant", "Strategy Lead"],
    },
  },
  {
    id: "engineering",
    keywords: ["engineering", "software engineering", "software", "development", "developer", "dev", "technology", "platform", "backend", "frontend", "devops", "sre", "infrastructure", "architecture"],
    abbreviations: ["cto", "vp eng", "devops", "sre"],
    titles: {
      cSuite: ["Chief Technology Officer"],
      vp: ["VP Engineering", "VP Technology", "VP Software Engineering", "VP Platform Engineering"],
      director: ["Head of Engineering", "Director of Engineering", "Director of Software Engineering", "Head of Platform Engineering", "Director of Platform Engineering", "Head of DevOps"],
      manager: ["Engineering Manager", "Software Engineering Manager", "Platform Engineering Manager", "DevOps Manager", "Infrastructure Manager"],
      specialist: ["Principal Engineer", "Staff Engineer", "Lead Software Engineer", "Technical Lead", "DevOps Lead", "Site Reliability Engineer"],
    },
  },
  {
    id: "product",
    keywords: ["product", "product management", "product owner", "product strategy", "roadmap", "platform product"],
    abbreviations: ["cpo", "pm", "po"],
    titles: {
      cSuite: ["Chief Product Officer"],
      vp: ["VP Product", "VP Product Management", "VP Product Strategy"],
      director: ["Head of Product", "Product Director", "Director of Product Management", "Head of Product Operations"],
      manager: ["Product Manager", "Senior Product Manager", "Group Product Manager", "Product Operations Manager"],
      specialist: ["Product Lead", "Product Owner", "Product Operations Lead", "Technical Product Owner"],
    },
  },
  {
    id: "design",
    keywords: ["design", "ux", "user experience", "ui", "research", "user research", "product design", "service design", "experience design"],
    abbreviations: ["ux", "ui", "cx", "uxr"],
    titles: {
      cSuite: ["Chief Experience Officer", "Chief Design Officer"],
      vp: ["VP Design", "VP User Experience", "VP Product Design", "VP Customer Experience"],
      director: ["Head of UX", "Head of User Experience", "Director of UX", "Director of User Experience", "Head of Product Design", "Director of Product Design", "UX Research Director", "Head of UX Research"],
      manager: ["UX Manager", "Product Design Manager", "UX Research Manager", "Design Operations Manager"],
      specialist: ["Lead Product Designer", "Lead UX Designer", "UX Research Lead", "Service Design Lead", "Design Lead"],
    },
  },
  {
    id: "sales",
    keywords: ["sales", "revenue", "commercial", "new business", "inside sales", "field sales", "account executive", "sales development", "bdr", "sdr"],
    abbreviations: ["cro", "cso", "vp sales", "ae", "bdr", "sdr"],
    titles: {
      cSuite: ["Chief Revenue Officer", "Chief Sales Officer", "Chief Commercial Officer"],
      vp: ["VP Sales", "VP Revenue", "VP Commercial", "VP Sales Development"],
      director: ["Head of Sales", "Sales Director", "Director of Sales", "Head of Revenue", "Commercial Director", "Director of Sales Development"],
      manager: ["Sales Manager", "Revenue Manager", "Commercial Manager", "Sales Development Manager", "Inside Sales Manager"],
      specialist: ["Sales Lead", "Senior Account Executive", "Account Executive", "Business Development Representative", "Sales Development Representative"],
    },
  },
  {
    id: "business_development",
    keywords: ["business development", "bd", "growth", "new markets", "market development", "sales partnerships"],
    abbreviations: ["bd", "bdr"],
    titles: {
      cSuite: ["Chief Growth Officer", "Chief Commercial Officer"],
      vp: ["VP Business Development", "VP Growth", "VP Market Development"],
      director: ["Head of Business Development", "Business Development Director", "Director of Growth", "Director of Market Development"],
      manager: ["Business Development Manager", "Growth Manager", "Market Development Manager"],
      specialist: ["Business Development Lead", "Growth Lead", "Business Development Representative", "Market Development Representative"],
    },
  },
  {
    id: "marketing",
    keywords: ["marketing", "demand generation", "growth marketing", "brand", "communications", "content", "digital marketing", "product marketing", "field marketing", "performance marketing"],
    abbreviations: ["cmo", "pmm"],
    titles: {
      cSuite: ["Chief Marketing Officer", "Chief Growth Officer"],
      vp: ["VP Marketing", "VP Demand Generation", "VP Growth Marketing", "VP Product Marketing"],
      director: ["Head of Marketing", "Marketing Director", "Director of Demand Generation", "Head of Product Marketing", "Director of Product Marketing", "Head of Growth Marketing"],
      manager: ["Marketing Manager", "Demand Generation Manager", "Growth Marketing Manager", "Product Marketing Manager", "Digital Marketing Manager"],
      specialist: ["Marketing Lead", "Demand Generation Lead", "Product Marketing Lead", "Content Lead", "Campaigns Lead"],
    },
  },
  {
    id: "finance",
    keywords: ["finance", "financial", "accounting", "accounts", "fp&a", "fpa", "planning and analysis", "controller", "treasury", "payroll", "billing"],
    abbreviations: ["cfo", "fp&a", "fpa"],
    titles: {
      cSuite: ["Chief Financial Officer"],
      vp: ["VP Finance", "VP Financial Planning", "VP Accounting"],
      director: ["Finance Director", "Head of Finance", "Director of Finance", "Head of FP&A", "Director of FP&A", "Financial Controller"],
      manager: ["Finance Manager", "FP&A Manager", "Accounting Manager", "Accounts Payable Manager", "Accounts Receivable Manager"],
      specialist: ["Finance Lead", "FP&A Lead", "Senior Financial Analyst", "Management Accountant", "Payroll Lead"],
    },
  },
  {
    id: "procurement",
    keywords: ["procurement", "purchasing", "buying", "sourcing", "supplier", "vendor management", "category management", "contracts purchasing"],
    abbreviations: ["cpo"],
    titles: {
      cSuite: ["Chief Procurement Officer"],
      vp: ["VP Procurement", "VP Sourcing", "VP Supply Management"],
      director: ["Head of Procurement", "Procurement Director", "Director of Procurement", "Head of Purchasing", "Sourcing Director", "Director of Vendor Management"],
      manager: ["Procurement Manager", "Purchasing Manager", "Sourcing Manager", "Vendor Manager", "Category Manager"],
      specialist: ["Procurement Lead", "Purchasing Lead", "Sourcing Lead", "Vendor Management Lead", "Senior Buyer"],
    },
  },
  {
    id: "operations",
    keywords: ["operations", "ops", "business operations", "revenue operations", "sales operations", "marketing operations", "commercial operations", "operational excellence", "coo"],
    abbreviations: ["ops", "coo", "revops", "sales ops", "bizops"],
    titles: {
      cSuite: ["Chief Operating Officer"],
      vp: ["VP Operations", "VP Business Operations", "VP Revenue Operations", "VP Sales Operations"],
      director: ["Head of Operations", "Operations Director", "Director of Operations", "Head of Business Operations", "Director of Revenue Operations", "Director of Sales Operations"],
      manager: ["Operations Manager", "Business Operations Manager", "Revenue Operations Manager", "Sales Operations Manager", "Marketing Operations Manager"],
      specialist: ["Operations Lead", "Business Operations Lead", "Revenue Operations Lead", "Sales Operations Lead", "Process Improvement Lead"],
    },
  },
  {
    id: "customer_success",
    keywords: ["customer success", "account management", "customer experience", "client success", "client services", "renewals", "customer retention", "customer operations"],
    abbreviations: ["cs", "cx", "csm"],
    titles: {
      cSuite: ["Chief Customer Officer", "Chief Experience Officer"],
      vp: ["VP Customer Success", "VP Account Management", "VP Customer Experience", "VP Client Services"],
      director: ["Head of Customer Success", "Customer Success Director", "Director of Customer Success", "Head of Account Management", "Director of Account Management"],
      manager: ["Customer Success Manager", "Account Manager", "Client Success Manager", "Renewals Manager", "Customer Operations Manager"],
      specialist: ["Customer Success Lead", "Account Management Lead", "Client Success Lead", "Renewals Lead", "Customer Onboarding Lead"],
    },
  },
  {
    id: "support",
    keywords: ["support", "service desk", "help desk", "helpdesk", "customer support", "technical support", "customer service", "support operations"],
    abbreviations: ["it helpdesk", "cs"],
    titles: {
      cSuite: ["Chief Customer Officer"],
      vp: ["VP Support", "VP Customer Support", "VP Customer Service"],
      director: ["Head of Support", "Support Director", "Director of Customer Support", "Head of Service Desk", "Director of Technical Support"],
      manager: ["Support Manager", "Customer Support Manager", "Service Desk Manager", "Help Desk Manager", "Technical Support Manager"],
      specialist: ["Support Lead", "Service Desk Lead", "Technical Support Lead", "Customer Service Lead", "Support Specialist"],
    },
  },
  {
    id: "hr",
    keywords: ["hr", "people", "human resources", "talent", "recruitment", "recruiting", "people operations", "employee experience", "learning and development", "ld", "l&d"],
    abbreviations: ["hr", "chro", "cpo", "l&d", "ld"],
    titles: {
      cSuite: ["Chief People Officer", "Chief Human Resources Officer"],
      vp: ["VP People", "VP Human Resources", "VP Talent", "VP People Operations"],
      director: ["Head of People", "HR Director", "Director of Human Resources", "Head of Talent", "Talent Acquisition Director", "People Operations Director"],
      manager: ["HR Manager", "People Manager", "Talent Acquisition Manager", "Recruitment Manager", "People Operations Manager"],
      specialist: ["HR Lead", "People Operations Lead", "Talent Acquisition Lead", "Recruitment Lead", "Employee Experience Lead"],
    },
  },
  {
    id: "it",
    keywords: ["it", "information technology", "technology operations", "systems", "infrastructure", "network", "workplace technology", "enterprise applications", "helpdesk"],
    abbreviations: ["it", "cio"],
    titles: {
      cSuite: ["Chief Information Officer", "Chief Technology Officer"],
      vp: ["VP IT", "VP Information Technology", "VP Technology Operations"],
      director: ["Head of IT", "IT Director", "Director of Information Technology", "Head of Infrastructure", "Director of Enterprise Applications"],
      manager: ["IT Manager", "Information Technology Manager", "Infrastructure Manager", "Network Manager", "Systems Manager"],
      specialist: ["IT Lead", "Systems Lead", "Network Lead", "Infrastructure Lead", "Enterprise Applications Lead"],
    },
  },
  {
    id: "cyber_security",
    keywords: ["cyber security", "cybersecurity", "security", "information security", "infosec", "application security", "cloud security", "security operations", "risk and security", "ciso"],
    abbreviations: ["ciso", "infosec", "soc", "appsec"],
    titles: {
      cSuite: ["Chief Information Security Officer", "Chief Security Officer"],
      vp: ["VP Information Security", "VP Cyber Security", "VP Security"],
      director: ["Head of Information Security", "Director of Information Security", "Head of Cyber Security", "Security Operations Director", "Director of Security Engineering"],
      manager: ["Information Security Manager", "Cyber Security Manager", "Security Operations Manager", "Application Security Manager", "Cloud Security Manager"],
      specialist: ["Security Lead", "Security Engineering Lead", "Application Security Lead", "Cloud Security Lead", "Security Architect"],
    },
  },
  {
    id: "data",
    keywords: ["data", "analytics", "business intelligence", "bi", "reporting", "insights", "data science", "machine learning", "data engineering"],
    abbreviations: ["cdo", "bi", "ml"],
    titles: {
      cSuite: ["Chief Data Officer", "Chief Analytics Officer"],
      vp: ["VP Data", "VP Analytics", "VP Business Intelligence", "VP Data Science"],
      director: ["Head of Data", "Data Director", "Director of Analytics", "Head of Business Intelligence", "Director of Data Science", "Head of Data Engineering"],
      manager: ["Data Manager", "Analytics Manager", "BI Manager", "Data Science Manager", "Data Engineering Manager"],
      specialist: ["Data Lead", "Analytics Lead", "BI Lead", "Data Engineering Lead", "Senior Data Analyst"],
    },
  },
  {
    id: "legal",
    keywords: ["legal", "law", "general counsel", "counsel", "contracts", "privacy", "commercial legal", "legal operations"],
    abbreviations: ["gc", "dpo"],
    titles: {
      cSuite: ["Chief Legal Officer", "General Counsel", "Chief Privacy Officer"],
      vp: ["VP Legal", "VP Legal Operations", "VP Privacy"],
      director: ["Head of Legal", "Legal Director", "Director of Legal", "Head of Contracts", "Privacy Director", "Director of Legal Operations"],
      manager: ["Legal Manager", "Contracts Manager", "Privacy Manager", "Legal Operations Manager"],
      specialist: ["Legal Lead", "Contracts Lead", "Privacy Lead", "Legal Counsel", "Commercial Counsel"],
    },
  },
  {
    id: "compliance",
    keywords: ["compliance", "risk", "governance", "audit", "regulatory", "grc", "internal controls", "assurance", "data protection"],
    abbreviations: ["grc", "dpo", "cro"],
    titles: {
      cSuite: ["Chief Compliance Officer", "Chief Risk Officer", "Chief Governance Officer"],
      vp: ["VP Compliance", "VP Risk", "VP Governance", "VP Internal Audit"],
      director: ["Head of Compliance", "Compliance Director", "Director of Risk", "Head of Risk", "Director of Governance", "Internal Audit Director"],
      manager: ["Compliance Manager", "Risk Manager", "Governance Manager", "Internal Controls Manager", "Audit Manager"],
      specialist: ["Compliance Lead", "Risk Lead", "Governance Lead", "GRC Lead", "Data Protection Lead"],
    },
  },
  {
    id: "facilities",
    keywords: ["facilities", "workplace", "real estate", "office management", "property", "building services", "estate management"],
    abbreviations: ["fm"],
    titles: {
      cSuite: ["Chief Operating Officer"],
      vp: ["VP Facilities", "VP Workplace", "VP Real Estate"],
      director: ["Head of Facilities", "Facilities Director", "Director of Workplace", "Head of Workplace", "Real Estate Director"],
      manager: ["Facilities Manager", "Workplace Manager", "Office Manager", "Property Manager", "Building Services Manager"],
      specialist: ["Facilities Lead", "Workplace Lead", "Office Operations Lead", "Property Lead"],
    },
  },
  {
    id: "supply_chain",
    keywords: ["supply chain", "logistics", "distribution", "fulfilment", "fulfillment", "warehouse", "inventory", "transport", "shipping"],
    abbreviations: ["scm"],
    titles: {
      cSuite: ["Chief Supply Chain Officer", "Chief Operating Officer"],
      vp: ["VP Supply Chain", "VP Logistics", "VP Distribution", "VP Fulfilment"],
      director: ["Head of Supply Chain", "Supply Chain Director", "Logistics Director", "Director of Distribution", "Head of Fulfilment"],
      manager: ["Supply Chain Manager", "Logistics Manager", "Distribution Manager", "Warehouse Manager", "Inventory Manager"],
      specialist: ["Supply Chain Lead", "Logistics Lead", "Inventory Lead", "Warehouse Operations Lead", "Transport Lead"],
    },
  },
  {
    id: "manufacturing",
    keywords: ["manufacturing", "production", "plant", "factory", "industrial", "operations manufacturing", "process engineering"],
    abbreviations: ["vp mfg"],
    titles: {
      cSuite: ["Chief Operating Officer"],
      vp: ["VP Manufacturing", "VP Production", "VP Plant Operations"],
      director: ["Head of Manufacturing", "Manufacturing Director", "Production Director", "Plant Director", "Director of Process Engineering"],
      manager: ["Manufacturing Manager", "Production Manager", "Plant Manager", "Process Engineering Manager"],
      specialist: ["Manufacturing Lead", "Production Lead", "Process Lead", "Plant Operations Lead"],
    },
  },
  {
    id: "quality",
    keywords: ["quality", "qa", "quality assurance", "quality control", "testing", "test", "validation"],
    abbreviations: ["qa", "qc"],
    titles: {
      cSuite: ["Chief Quality Officer"],
      vp: ["VP Quality", "VP Quality Assurance", "VP Quality Control"],
      director: ["Head of Quality", "Quality Director", "Director of Quality Assurance", "Head of QA", "Director of Testing"],
      manager: ["Quality Manager", "QA Manager", "Quality Assurance Manager", "Quality Control Manager", "Test Manager"],
      specialist: ["Quality Lead", "QA Lead", "Test Lead", "Quality Assurance Lead", "Validation Lead"],
    },
  },
  {
    id: "project_management",
    keywords: ["project", "programme", "program", "pmo", "delivery", "portfolio", "project management", "programme management"],
    abbreviations: ["pmo", "ppm"],
    titles: {
      cSuite: ["Chief Operating Officer"],
      vp: ["VP Delivery", "VP Program Management", "VP Portfolio Management"],
      director: ["Head of PMO", "PMO Director", "Director of Project Management", "Programme Director", "Delivery Director"],
      manager: ["Project Manager", "Programme Manager", "Program Manager", "Portfolio Manager", "Delivery Manager"],
      specialist: ["Project Lead", "Programme Lead", "Delivery Lead", "PMO Lead", "Project Coordinator"],
    },
  },
  {
    id: "transformation",
    keywords: ["transformation", "change", "business change", "digital transformation", "continuous improvement", "process improvement", "change management"],
    abbreviations: ["bpr"],
    titles: {
      cSuite: ["Chief Transformation Officer", "Chief Operating Officer"],
      vp: ["VP Transformation", "VP Change", "VP Digital Transformation"],
      director: ["Head of Transformation", "Transformation Director", "Director of Change", "Head of Business Change", "Digital Transformation Director"],
      manager: ["Transformation Manager", "Change Manager", "Business Change Manager", "Continuous Improvement Manager"],
      specialist: ["Transformation Lead", "Change Lead", "Business Change Lead", "Process Improvement Lead"],
    },
  },
  {
    id: "partnerships",
    keywords: ["partnerships", "partner", "alliances", "channels", "channel sales", "ecosystem", "strategic alliances"],
    abbreviations: ["vp partners"],
    titles: {
      cSuite: ["Chief Commercial Officer", "Chief Revenue Officer"],
      vp: ["VP Partnerships", "VP Alliances", "VP Channels", "VP Partner Sales"],
      director: ["Head of Partnerships", "Partnerships Director", "Director of Alliances", "Head of Channels", "Director of Partner Sales"],
      manager: ["Partnerships Manager", "Partner Manager", "Alliances Manager", "Channel Manager"],
      specialist: ["Partnerships Lead", "Partner Lead", "Alliances Lead", "Channel Lead", "Partner Success Lead"],
    },
  },
  {
    id: "admin",
    keywords: ["admin", "administration", "office", "office management", "executive support", "business support", "administrative"],
    abbreviations: ["ea", "pa"],
    titles: {
      cSuite: ["Chief Operating Officer"],
      vp: ["VP Administration", "VP Business Support"],
      director: ["Head of Administration", "Administration Director", "Head of Office Management", "Business Support Director"],
      manager: ["Office Manager", "Administration Manager", "Business Support Manager", "Executive Support Manager"],
      specialist: ["Office Management Lead", "Administration Lead", "Executive Assistant", "Personal Assistant", "Business Support Lead"],
    },
  },
];

function compactString(value) {
  return String(value || "").trim();
}

function normalize(value) {
  return compactString(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9+#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phraseMatches(query, phrase) {
  const cleanQuery = normalize(query);
  const cleanPhrase = normalize(phrase);
  if (!cleanQuery || !cleanPhrase) return false;
  if (cleanQuery === cleanPhrase) return true;

  const queryPattern = new RegExp(`(^|\\s)${escapeRegExp(cleanPhrase)}(\\s|$)`);
  if (queryPattern.test(cleanQuery)) return true;

  return false;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function allDepartmentTerms(department) {
  return [...department.keywords, ...department.abbreviations];
}

function uniqueCaseInsensitive(values) {
  const seen = new Set();
  const result = [];
  for (const value of values.map(compactString).filter(Boolean)) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function fallbackRoles(query) {
  const cleanQuery = compactString(query);
  if (!cleanQuery) return [];
  return uniqueCaseInsensitive([
    `Head of ${cleanQuery}`,
    `Director of ${cleanQuery}`,
    `VP ${cleanQuery}`,
    `${cleanQuery} Manager`,
    `${cleanQuery} Lead`,
  ]);
}

export function findMatchingDepartments(query) {
  return roleTaxonomy.filter(department => allDepartmentTerms(department).some(term => phraseMatches(query, term)));
}

export function suggestRolesFromTaxonomy(input = {}) {
  const query = compactString(typeof input === "string" ? input : input.query);
  const limit = Math.max(Number(input.limit || DEFAULT_ROLE_LIMIT) || DEFAULT_ROLE_LIMIT, 1);
  const matchedDepartments = findMatchingDepartments(query);

  if (!query) {
    return { query, mode: "fallback", matchedDepartments: [], roles: [], warning: "Enter a target persona to load role suggestions." };
  }

  if (!matchedDepartments.length) {
    return {
      query,
      mode: "fallback",
      matchedDepartments: [],
      roles: fallbackRoles(query),
      warning: "No known department taxonomy matched this persona. Returned safe generic titles.",
    };
  }

  const rankOrder = ["cSuite", "vp", "director", "manager", "specialist"];
  const roles = uniqueCaseInsensitive(rankOrder.flatMap(rank => matchedDepartments.flatMap(department => department.titles[rank] || [])))
    .slice(0, limit);

  return {
    query,
    mode: "taxonomy",
    matchedDepartments: matchedDepartments.map(department => department.id),
    roles,
    warning: "",
  };
}

export { roleTaxonomy };
