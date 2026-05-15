export const AIRCALL_API_BASE_URL = "https://api.aircall.io/v1";
export const E164_PHONE_REGEX = /^\+[1-9]\d{7,14}$/;

export const aircallAuditLog = [];

export function maskPhoneNumber(phoneNumber) {
  const value = String(phoneNumber || "");
  if (value.length <= 4) return "****";
  return `${"*".repeat(Math.max(value.length - 4, 4))}${value.slice(-4)}`;
}

export function validateE164PhoneNumber(phoneNumber) {
  return E164_PHONE_REGEX.test(String(phoneNumber || ""));
}

function createBasicAuthHeader(apiId, apiToken) {
  return `Basic ${Buffer.from(`${apiId}:${apiToken}`).toString("base64")}`;
}

function createDialError(message, statusCode = 400, status = "rejected") {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.auditStatus = status;
  return error;
}

function normalizePhone(value) {
  return String(value || "").trim();
}

function getContactPhoneNumbers(contact = {}) {
  return [contact.phoneNumber, contact.phone, contact.mobile].map(normalizePhone).filter(Boolean);
}

export async function dialAircall(input = {}, options = {}) {
  const phoneNumber = normalizePhone(input.phoneNumber);
  const contactId = String(input.contactId || "").trim();
  const userId = options.userId || input.userId;
  const aircallUserId = options.aircallUserId || input.aircallUserId || process.env.AIRCALL_USER_ID;
  const apiId = options.apiId ?? process.env.AIRCALL_API_ID;
  const apiToken = options.apiToken ?? process.env.AIRCALL_API_TOKEN;
  const fetcher = options.fetcher ?? fetch;
  const now = options.now ?? (() => new Date());
  const getContactById = options.getContactById ?? (async () => null);
  const auditLogger = options.auditLogger ?? ((entry) => {
    aircallAuditLog.push(entry);
    console.info("Aircall dial audit", entry);
  });

  const auditEntry = {
    userId: userId || null,
    contactId: contactId || null,
    phoneNumber: maskPhoneNumber(phoneNumber),
    timestamp: now().toISOString(),
    status: "started",
  };

  try {
    if (!userId) throw createDialError("Authenticated CRM user is required", 401, "unauthenticated");
    if (!phoneNumber) throw createDialError("phoneNumber is required");
    if (!validateE164PhoneNumber(phoneNumber)) throw createDialError("phoneNumber must be in E.164 format");
    if (!contactId) throw createDialError("contactId is required");
    if (!apiId || !apiToken) throw createDialError("Aircall API credentials are required on the server", 500, "configuration_error");
    if (!aircallUserId) throw createDialError("Aircall user id is not mapped for this CRM user", 400, "configuration_error");

    const contact = await getContactById(contactId);
    if (!contact?.redeemed) throw createDialError("Preview-only contacts cannot be dialed", 403, "blocked_preview_contact");

    const redeemedPhoneNumbers = getContactPhoneNumbers(contact);
    if (!redeemedPhoneNumbers.includes(phoneNumber)) {
      throw createDialError("Phone number does not match the redeemed contact", 403, "blocked_phone_mismatch");
    }

    const response = await fetcher(`${AIRCALL_API_BASE_URL}/users/${encodeURIComponent(aircallUserId)}/dial`, {
      method: "POST",
      headers: {
        Authorization: createBasicAuthHeader(apiId, apiToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: phoneNumber }),
    });

    if (response.status === 204) {
      auditEntry.status = "sent_to_aircall";
      auditLogger(auditEntry);
      return { status: "sent_to_aircall", message: "Number sent to Aircall." };
    }

    if (response.status === 405) {
      throw createDialError("Aircall user is unavailable or already on a call", 409, "aircall_user_unavailable");
    }

    if (response.status === 400) {
      throw createDialError("Aircall rejected the phone number", 400, "aircall_invalid_number");
    }

    throw createDialError("Aircall dial request failed", response.status || 502, "aircall_error");
  } catch (error) {
    auditEntry.status = error.auditStatus || "error";
    auditLogger(auditEntry);
    throw error;
  }
}

