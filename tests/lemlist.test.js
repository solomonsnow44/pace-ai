import assert from "node:assert/strict";
import test from "node:test";
import { buildLemlistAuthorizationHeader, createLemlistOverview } from "../src/server/lemlist.js";

function jsonResponse(payload, headers = {}, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}

test("Lemlist auth uses empty username basic auth", () => {
  assert.equal(buildLemlistAuthorizationHeader("abc123"), `Basic ${Buffer.from(":abc123").toString("base64")}`);
});

test("Lemlist overview loads campaigns, stats, leads, people profiles, companies, and credits", async () => {
  const requestedUrls = [];
  const requestedBodies = [];
  const fetcher = async (url, options = {}) => {
    requestedUrls.push(url);
    if (options.body) requestedBodies.push(JSON.parse(options.body));
    if (url.includes("/campaigns?")) {
      return jsonResponse([{ _id: "cam_1", name: "Outbound", status: "running" }], { "x-ratelimit-remaining": "18" });
    }
    if (url.includes("/team/credits")) {
      return jsonResponse({ credits: 42, details: { remaining: { total: 42 } } });
    }
    if (url.includes("/contacts/lists")) {
      return jsonResponse([{ _id: "clt_1", name: "Prospects", dynamic: false }]);
    }
    if (url.includes("/contacts?")) {
      return jsonResponse({ data: [{ _id: "ctc_1", fullName: "Jane Smith", email: "jane@example.com", linkedinUrl: "https://www.linkedin.com/in/jane-smith" }], total: 1, limit: 100, offset: 0 });
    }
    if (url.includes("/companies?")) {
      return jsonResponse({ data: [{ _id: "cpn_1", domain: "example.com", fields: { name: "Example Co" } }], total: 1, limit: 100, offset: 0 });
    }
    if (url.includes("/database/people")) {
      return jsonResponse({ results: [{ _id: "ppl_1", full_name: "Jane Smith", lead_linkedin_url: "https://www.linkedin.com/in/jane-smith", summary: "Outbound leader", skills: [{ name: "Sales" }], location: "Dublin" }], total: 1, page: 1, size: 1 });
    }
    if (url.includes("/v2/campaigns/cam_1/stats")) {
      return jsonResponse({ nbLeads: 10, messagesSent: 8, delivered: 7, replied: 2, steps: [] });
    }
    if (url.includes("/campaigns/cam_1/leads/")) {
      return jsonResponse([{ _id: "lea_1", contactId: "ctc_1", state: "scanned" }]);
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const overview = await createLemlistOverview({
    startDate: "2026-06-01T00:00:00.000Z",
    endDate: "2026-06-20T00:00:00.000Z",
  }, {
    apiKey: "test-key",
    fetcher,
  });

  assert.equal(overview.campaigns.length, 1);
  assert.equal(overview.selectedCampaignId, "cam_1");
  assert.equal(overview.credits.credits, 42);
  assert.equal(overview.contacts[0].email, "jane@example.com");
  assert.equal(overview.contactPagination.total, 1);
  assert.equal(overview.companies[0].domain, "example.com");
  assert.equal(overview.companyPagination.total, 1);
  assert.equal(overview.peopleProfiles[0].summary, "Outbound leader");
  assert.equal(overview.peopleProfilePagination.total, 1);
  assert.equal(overview.contactLists[0].name, "Prospects");
  assert.equal(overview.stats.nbLeads, 10);
  assert.equal(overview.leads[0].state, "scanned");
  assert.equal(overview.rateLimit.remaining, "18");
  assert.ok(requestedUrls.some(url => url.includes("/v2/campaigns/cam_1/stats")));
  assert.ok(!requestedUrls.find(url => url.includes("/campaigns?"))?.includes("version=v2"));
  assert.ok(requestedUrls.some(url => url.includes("/database/people")));
  assert.ok(!requestedUrls.some(url => url.includes("/tasks")));
  assert.ok(!requestedUrls.some(url => url.includes("/activities")));
  assert.equal(requestedBodies.find(body => body.filters?.[0]?.filterId === "leadLinkedInUrl")?.filters[0].in[0], "https://www.linkedin.com/in/jane-smith");
});

test("Lemlist overview retries campaign leads without trailing slash after 404", async () => {
  const requestedUrls = [];
  const fetcher = async (url) => {
    requestedUrls.push(url);
    if (url.includes("/campaigns?")) {
      return jsonResponse([{ _id: "cam_1", name: "Outbound", status: "running" }]);
    }
    if (url.includes("/team/credits")) return jsonResponse({ credits: 0 });
    if (url.includes("/contacts/lists")) return jsonResponse([]);
    if (url.includes("/contacts?")) return jsonResponse({ data: [], total: 0, limit: 100, offset: 0 });
    if (url.includes("/companies?")) return jsonResponse({ data: [], total: 0, limit: 100, offset: 0 });
    if (url.includes("/v2/campaigns/cam_1/stats")) return jsonResponse({ nbLeads: 1, steps: [] });
    if (url.includes("/campaigns/cam_1/leads/?")) return jsonResponse({ error: "Not found" }, {}, 404);
    if (url.includes("/campaigns/cam_1/leads?")) return jsonResponse([{ _id: "lea_1", contactId: "ctc_1", state: "scanned" }]);
    throw new Error(`Unexpected URL: ${url}`);
  };

  const overview = await createLemlistOverview({
    includePeopleProfiles: false,
  }, {
    apiKey: "test-key",
    fetcher,
  });

  assert.equal(overview.leads.length, 1);
  assert.ok(requestedUrls.some(url => url.includes("/campaigns/cam_1/leads/?")));
  assert.ok(requestedUrls.some(url => url.includes("/campaigns/cam_1/leads?")));
  assert.deepEqual(overview.errors, {});
});

test("Lemlist overview uses stored contact profile enrichments before people search", async () => {
  const requestedUrls = [];
  const fetcher = async (url) => {
    requestedUrls.push(url);
    if (url.includes("/campaigns?")) {
      return jsonResponse([{ _id: "cam_1", name: "Outbound", status: "running" }]);
    }
    if (url.includes("/team/credits")) return jsonResponse({ credits: 0 });
    if (url.includes("/contacts/lists")) return jsonResponse([]);
    if (url.includes("/contacts?")) {
      return jsonResponse({ data: [{ _id: "ctc_1", fullName: "Jane Smith", linkedinUrl: "https://www.linkedin.com/in/jane-smith" }], total: 1, limit: 100, offset: 0 });
    }
    if (url.includes("/companies?")) return jsonResponse({ data: [], total: 0, limit: 100, offset: 0 });
    if (url.includes("/v2/campaigns/cam_1/stats")) return jsonResponse({ nbLeads: 0, steps: [] });
    if (url.includes("/campaigns/cam_1/leads/")) return jsonResponse([]);
    if (url.includes("/database/people")) throw new Error("People profile search should not run for stored profiles");
    throw new Error(`Unexpected URL: ${url}`);
  };

  const overview = await createLemlistOverview({}, {
    apiKey: "test-key",
    fetcher,
    storedPeopleProfiles: [{
      lead_linkedin_url: "https://www.linkedin.com/in/jane-smith",
      summary: "Stored profile summary",
      skills: [{ name: "Outbound" }],
    }],
  });

  assert.equal(overview.peopleProfiles.length, 1);
  assert.equal(overview.peopleProfiles[0].summary, "Stored profile summary");
  assert.equal(overview.contactProfileEnrichment.stored, 1);
  assert.equal(overview.contactProfileEnrichment.fetched, 0);
  assert.ok(!requestedUrls.some(url => url.includes("/database/people")));
});
