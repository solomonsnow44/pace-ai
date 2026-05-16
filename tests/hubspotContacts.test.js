import assert from "node:assert/strict";
import test from "node:test";
import { exportContactsToHubSpot } from "../src/server/hubspotContacts.js";

function jsonResponse(status, payload = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(payload);
    },
  };
}

test("HubSpot export updates by email when a contact exists", async () => {
  const requests = [];
  const payload = await exportContactsToHubSpot({
    rows: [{ rowId: "row-1", contactName: "Jane Smith", manualEmail: "jane@example.com", company: "Example Co" }],
  }, {
    token: "test-token",
    fetcher: async (url, options) => {
      requests.push({ url, options });
      if (url.endsWith("/crm/v3/objects/companies/search")) return jsonResponse(200, { results: [{ id: "company-1" }] });
      if (url.includes("/associations/companies/")) return jsonResponse(200, {});
      return jsonResponse(200, { id: "123" });
    },
  });

  assert.equal(requests.length, 3);
  assert.match(requests[0].url, /\/crm\/v3\/objects\/contacts\/jane%40example\.com\?idProperty=email$/);
  assert.equal(requests[0].options.method, "PATCH");
  const properties = JSON.parse(requests[0].options.body).properties;
  assert.equal(properties.company, "Example Co");
  assert.equal(properties.lifecyclestage, "lead");
  assert.equal(properties.hs_lead_status, "NEW");
  assert.match(requests[1].url, /\/crm\/v3\/objects\/companies\/search$/);
  assert.match(requests[2].url, /\/crm\/v3\/objects\/contacts\/123\/associations\/companies\/company-1\/279$/);
  assert.equal(payload.results[0].hubspotContactId, "123");
  assert.equal(payload.results[0].hubspotExportStatus, "exported");
});

test("HubSpot export creates when update by email returns not found", async () => {
  const requests = [];
  const payload = await exportContactsToHubSpot({
    rows: [{ rowId: "row-1", contactName: "Jane Smith", manualEmail: "jane@example.com", company: "Example Co" }],
  }, {
    token: "test-token",
    fetcher: async (url, options) => {
      requests.push({ url, options });
      if (requests.length === 1) return jsonResponse(404, { message: "not found" });
      if (url.endsWith("/crm/v3/objects/contacts")) return jsonResponse(201, { id: "456" });
      if (url.endsWith("/crm/v3/objects/companies/search")) return jsonResponse(200, { results: [] });
      if (url.endsWith("/crm/v3/objects/companies")) return jsonResponse(201, { id: "company-2" });
      if (url.includes("/associations/companies/")) return jsonResponse(200, {});
      return jsonResponse(200, {});
    },
  });

  assert.equal(requests.length, 5);
  assert.match(requests[1].url, /\/crm\/v3\/objects\/contacts$/);
  assert.equal(requests[1].options.method, "POST");
  assert.match(requests[3].url, /\/crm\/v3\/objects\/companies$/);
  assert.match(requests[4].url, /\/crm\/v3\/objects\/contacts\/456\/associations\/companies\/company-2\/279$/);
  assert.equal(payload.results[0].hubspotContactId, "456");
});

test("HubSpot export creates when saved HubSpot contact ID is stale", async () => {
  const requests = [];
  const payload = await exportContactsToHubSpot({
    rows: [{ rowId: "row-1", contactName: "Claire Whelan", hubspotContactId: "stale-123", company: "Stripe" }],
  }, {
    token: "test-token",
    fetcher: async (url, options) => {
      requests.push({ url, options });
      if (url.endsWith("/crm/v3/objects/contacts/stale-123")) return jsonResponse(404, { message: "resource not found" });
      if (url.endsWith("/crm/v3/objects/contacts")) return jsonResponse(201, { id: "new-789" });
      if (url.endsWith("/crm/v3/objects/companies/search")) return jsonResponse(200, { results: [{ id: "company-3" }] });
      if (url.includes("/associations/companies/")) return jsonResponse(200, {});
      return jsonResponse(200, {});
    },
  });

  assert.equal(requests.length, 4);
  assert.match(requests[0].url, /\/crm\/v3\/objects\/contacts\/stale-123$/);
  assert.equal(requests[0].options.method, "PATCH");
  assert.match(requests[1].url, /\/crm\/v3\/objects\/contacts$/);
  assert.equal(requests[1].options.method, "POST");
  assert.match(requests[3].url, /\/crm\/v3\/objects\/contacts\/new-789\/associations\/companies\/company-3\/279$/);
  assert.equal(payload.results[0].hubspotContactId, "new-789");
  assert.equal(payload.results[0].hubspotExportStatus, "exported");
});

test("HubSpot export does not fail contacts when company scopes are missing", async () => {
  const requests = [];
  const payload = await exportContactsToHubSpot({
    rows: [{ rowId: "row-1", contactName: "David Bowen", company: "Kainos" }],
  }, {
    token: "test-token",
    fetcher: async (url, options) => {
      requests.push({ url, options });
      if (url.endsWith("/crm/v3/objects/contacts")) return jsonResponse(201, { id: "contact-1" });
      if (url.endsWith("/crm/v3/objects/companies/search")) {
        return jsonResponse(403, { message: "This app hasn't been granted all required scopes to make this call." });
      }
      return jsonResponse(200, {});
    },
  });

  assert.equal(requests.length, 2);
  assert.match(requests[0].url, /\/crm\/v3\/objects\/contacts$/);
  assert.match(requests[1].url, /\/crm\/v3\/objects\/companies\/search$/);
  assert.equal(payload.results[0].hubspotContactId, "contact-1");
  assert.equal(payload.results[0].hubspotExportStatus, "exported");
  assert.match(payload.results[0].hubspotExportError, /company association was skipped/);
  assert.match(payload.results[0].hubspotExportError, /required scopes/);
});

test("HubSpot export requires a private app token", async () => {
  await assert.rejects(
    () => exportContactsToHubSpot({ rows: [{ rowId: "row-1" }] }, { token: "" }),
    /HubSpot private app token is not configured/,
  );
});
