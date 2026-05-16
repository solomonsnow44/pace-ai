const HUBSPOT_API_BASE_URL = "https://api.hubapi.com";

function compactString(value) {
  return String(value || "").trim();
}

function splitName(contactName = "") {
  const parts = compactString(contactName).split(/\s+/).filter(Boolean);
  return {
    firstname: parts[0] || "",
    lastname: parts.length > 1 ? parts.slice(1).join(" ") : "",
  };
}

function buildHubSpotProperties(row = {}) {
  const nameParts = splitName(row.contactName);
  const phoneNumber = compactString(row.manualMobile) || compactString(row.manualDirectDial);
  const properties = {
    email: compactString(row.manualEmail),
    firstname: compactString(row.firstName) || nameParts.firstname,
    lastname: compactString(row.lastName) || nameParts.lastname,
    company: compactString(row.company),
    jobtitle: compactString(row.jobTitle),
    phone: phoneNumber,
    mobilephone: phoneNumber,
    lifecyclestage: "lead",
    hs_lead_status: "NEW",
  };

  return Object.fromEntries(Object.entries(properties).filter(([, value]) => value));
}

async function hubspotRequest(path, { method = "GET", token, body, fetcher }) {
  const response = await fetcher(`${HUBSPOT_API_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(payload.message || "HubSpot request failed");
    error.statusCode = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function findCompanyByName(companyName, options) {
  const payload = await hubspotRequest("/crm/v3/objects/companies/search", {
    method: "POST",
    token: options.token,
    fetcher: options.fetcher,
    body: {
      filterGroups: [
        {
          filters: [
            {
              propertyName: "name",
              operator: "EQ",
              value: companyName,
            },
          ],
        },
      ],
      properties: ["name"],
      limit: 1,
    },
  });

  return payload.results?.[0] || null;
}

async function findOrCreateCompany(companyName, options) {
  const cleanCompanyName = compactString(companyName);
  if (!cleanCompanyName) return null;

  const existingCompany = await findCompanyByName(cleanCompanyName, options);
  if (existingCompany?.id) return existingCompany;

  return hubspotRequest("/crm/v3/objects/companies", {
    method: "POST",
    token: options.token,
    fetcher: options.fetcher,
    body: {
      properties: {
        name: cleanCompanyName,
      },
    },
  });
}

async function associateContactToCompany(contactId, companyId, options) {
  if (!contactId || !companyId) return;
  await hubspotRequest(`/crm/v3/objects/contacts/${encodeURIComponent(contactId)}/associations/companies/${encodeURIComponent(companyId)}/279`, {
    method: "PUT",
    token: options.token,
    fetcher: options.fetcher,
  });
}

async function associateCompanyBestEffort(contactId, row, options) {
  try {
    const company = await findOrCreateCompany(row.company, options);
    await associateContactToCompany(contactId, company?.id, options);
    return "";
  } catch (error) {
    return `Contact exported, but company association was skipped: ${error.message || "HubSpot company sync failed"}`;
  }
}

async function exportOneContact(row, options) {
  const token = options.token;
  const fetcher = options.fetcher || fetch;
  const properties = buildHubSpotProperties(row);
  const email = compactString(row.manualEmail).toLowerCase();
  let hubspotContactId = compactString(row.hubspotContactId);
  let action = "created";

  if (email) {
    try {
      const updated = await hubspotRequest(`/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email`, {
        method: "PATCH",
        token,
        fetcher,
        body: { properties },
      });
      const warning = await associateCompanyBestEffort(updated.id, row, { token, fetcher });
      return { hubspotContactId: updated.id, status: "exported", action: "updated", warning };
    } catch (error) {
      if (error.statusCode !== 404) throw error;
    }
  }

  if (hubspotContactId) {
    try {
      const updated = await hubspotRequest(`/crm/v3/objects/contacts/${encodeURIComponent(hubspotContactId)}`, {
        method: "PATCH",
        token,
        fetcher,
        body: { properties },
      });
      const warning = await associateCompanyBestEffort(updated.id, row, { token, fetcher });
      return { hubspotContactId: updated.id, status: "exported", action: "updated", warning };
    } catch (error) {
      if (error.statusCode !== 404) throw error;
      hubspotContactId = "";
    }
  }

  const created = await hubspotRequest("/crm/v3/objects/contacts", {
    method: "POST",
    token,
    fetcher,
    body: { properties },
  });
  hubspotContactId = created.id;
  const warning = await associateCompanyBestEffort(hubspotContactId, row, { token, fetcher });
  return { hubspotContactId, status: "exported", action, warning };
}

export async function exportContactsToHubSpot(input = {}, options = {}) {
  const token = options.token ?? process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  const rows = Array.isArray(input.rows) ? input.rows : [];
  if (!token) {
    const error = new Error("HubSpot private app token is not configured.");
    error.statusCode = 500;
    throw error;
  }
  if (!rows.length) {
    const error = new Error("Select at least one lead to export.");
    error.statusCode = 400;
    throw error;
  }

  const exportedAt = new Date().toISOString();
  const results = [];
  for (const row of rows) {
    try {
      const result = await exportOneContact(row, { ...options, token });
      results.push({
        rowId: row.rowId,
        dbContactId: row.dbContactId,
        hubspotContactId: result.hubspotContactId,
        hubspotExportedAt: exportedAt,
        hubspotExportStatus: result.status,
        hubspotExportError: result.warning || "",
        action: result.action,
      });
    } catch (error) {
      results.push({
        rowId: row.rowId,
        dbContactId: row.dbContactId,
        hubspotContactId: row.hubspotContactId || "",
        hubspotExportedAt: exportedAt,
        hubspotExportStatus: "error",
        hubspotExportError: error.message || "HubSpot export failed",
        action: "error",
      });
    }
  }

  return { exportedAt, results };
}
