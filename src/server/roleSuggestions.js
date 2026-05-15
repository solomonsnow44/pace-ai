const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_ROLE_MODEL = "gpt-4.1-mini";

const fallbackRoleSets = {
  ux: [
    "Chief Experience Officer",
    "VP User Experience",
    "Head of UX",
    "Head of User Experience",
    "Director of UX",
    "Director of User Experience",
    "Head of Product Design",
    "Director of Product Design",
    "UX Research Director",
    "Head of UX Research",
  ],
  security: [
    "Chief Information Security Officer",
    "VP Information Security",
    "Head of Information Security",
    "Director of Information Security",
    "Head of Cyber Security",
    "Security Operations Director",
    "VP Security",
    "Head of Risk and Security",
  ],
  finance: [
    "Chief Financial Officer",
    "VP Finance",
    "Finance Director",
    "Head of Finance",
    "Financial Controller",
    "Head of FP&A",
    "Procurement Director",
    "Head of Procurement",
  ],
  product: [
    "Chief Product Officer",
    "VP Product",
    "Head of Product",
    "Product Director",
    "Director of Product Management",
    "Head of Product Operations",
    "VP Product Management",
  ],
  engineering: [
    "Chief Technology Officer",
    "VP Engineering",
    "Head of Engineering",
    "Engineering Director",
    "Director of Software Engineering",
    "Head of Platform Engineering",
    "VP Technology",
  ],
};

function compactString(value) {
  return String(value || "").trim();
}

function uniqueValues(values) {
  return [...new Set(values.map(compactString).filter(Boolean))];
}

function fallbackSuggestions(query) {
  const lowerQuery = compactString(query).toLowerCase();
  const matchedKey = Object.keys(fallbackRoleSets).find(key => lowerQuery.includes(key));
  if (matchedKey) return fallbackRoleSets[matchedKey];

  const title = compactString(query);
  if (!title) return [];
  return uniqueValues([
    title,
    `Chief ${title} Officer`,
    `VP ${title}`,
    `Head of ${title}`,
    `Director of ${title}`,
  ]);
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;

  return (payload.output || [])
    .flatMap(item => item.content || [])
    .map(content => content.text || "")
    .join("");
}

function sanitizeSuggestions(roles) {
  return uniqueValues(roles)
    .filter(role => role.length <= 80)
    .slice(0, 20);
}

export async function suggestTargetRoles(input = {}, options = {}) {
  const query = compactString(input.query);
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const fetcher = options.fetcher ?? fetch;
  const model = options.model ?? process.env.OPENAI_ROLE_MODEL ?? DEFAULT_ROLE_MODEL;

  if (!query) return { mode: "fallback", query, roles: [] };
  if (!apiKey) return { mode: "fallback", query, roles: fallbackSuggestions(query) };

  const response = await fetcher(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: "Return JSON only. Expand a rough B2B buying persona into common job titles. Keep titles industry-neutral unless the user provides an industry. Do not include emails, phone numbers, or people.",
        },
        {
          role: "user",
          content: `Persona or role search: ${query}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "target_role_suggestions",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              roles: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["roles"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    return { mode: "fallback", query, roles: fallbackSuggestions(query) };
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);

  try {
    const parsed = JSON.parse(outputText);
    return { mode: "openai", query, roles: sanitizeSuggestions(parsed.roles || []) };
  } catch {
    return { mode: "fallback", query, roles: fallbackSuggestions(query) };
  }
}

