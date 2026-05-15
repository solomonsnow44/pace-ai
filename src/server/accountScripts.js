const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_SCRIPT_MODEL = "gpt-4.1-mini";

function compactString(value) {
  return String(value || "").trim();
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;

  return (payload.output || [])
    .flatMap(item => item.content || [])
    .map(content => content.text || "")
    .join("");
}

function removeDashes(value) {
  return compactString(value)
    .replace(/[—–-]/g, ",")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,+/g, ",")
    .replace(/\s+/g, " ");
}

function sanitizeScripts(scripts = {}) {
  return {
    callOpener: removeDashes(scripts.callOpener),
    voicemail: removeDashes(scripts.voicemail),
    emailSubject: removeDashes(scripts.emailSubject),
    emailBody: removeDashes(scripts.emailBody),
    linkedinNote: removeDashes(scripts.linkedinNote),
    discoveryQuestion: removeDashes(scripts.discoveryQuestion),
  };
}

function fallbackScripts(input = {}) {
  const account = compactString(input.name) || "the account";
  const industry = compactString(input.industry) || "your market";
  const signal = compactString(input.insight) || `I noticed ${account} may be reviewing how teams handle growth and customer experience.`;

  return sanitizeScripts({
    callOpener: `Hi, this is PaceOps. I saw ${account} is active in ${industry}. I had a quick thought linked to ${signal}. Is now a bad time for thirty seconds?`,
    voicemail: `Hi, this is PaceOps. I had a relevant thought for ${account} based on ${signal}. I will send a short note as well.`,
    emailSubject: `${account} research idea`,
    emailBody: `Hi, I was looking at ${account} and noticed ${signal}. It made me wonder whether the right team is already reviewing this, or whether it is still sitting between functions. If useful, I can share the short angle we would test before any wider outreach.`,
    linkedinNote: `I came across ${account} while researching ${industry}. Thought it could be useful to connect.`,
    discoveryQuestion: `How are you currently deciding which accounts or teams are worth deeper research before outreach?`,
  });
}

export async function generateAccountScripts(input = {}, options = {}) {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const fetcher = options.fetcher ?? fetch;
  const model = options.model ?? process.env.OPENAI_SCRIPT_MODEL ?? DEFAULT_SCRIPT_MODEL;
  const accountName = compactString(input.name);

  if (!accountName) {
    const error = new Error("Account name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!apiKey) {
    return { mode: "fallback", scripts: fallbackScripts(input) };
  }

  try {
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
            content: [
              "You write B2B sales development copy for PaceOps.",
              "Return JSON only.",
              "Sound human, specific, calm, and conversational.",
              "Avoid hype, jargon, fake familiarity, and pushy language.",
              "Never use dash characters of any kind.",
              "Do not invent named facts that are not in the account intelligence.",
              "Use the research signal as a hypothesis, not as a proven fact.",
              "Keep copy concise enough for real outreach.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              accountName,
              domain: compactString(input.domain),
              industry: compactString(input.industry),
              location: compactString(input.location),
              employees: compactString(input.employees),
              stage: compactString(input.stage),
              nextAction: compactString(input.nextAction),
              researchSignal: compactString(input.insight),
              evidence: Array.isArray(input.evidence) ? input.evidence.slice(0, 3) : [],
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "account_outreach_scripts",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                callOpener: { type: "string" },
                voicemail: { type: "string" },
                emailSubject: { type: "string" },
                emailBody: { type: "string" },
                linkedinNote: { type: "string" },
                discoveryQuestion: { type: "string" },
              },
              required: ["callOpener", "voicemail", "emailSubject", "emailBody", "linkedinNote", "discoveryQuestion"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      return { mode: "fallback", scripts: fallbackScripts(input) };
    }

    const payload = await response.json();
    const outputText = extractOutputText(payload);

    return { mode: "openai", scripts: sanitizeScripts(JSON.parse(outputText)) };
  } catch {
    return { mode: "fallback", scripts: fallbackScripts(input) };
  }
}
