import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSafeCognismPreviewUrl,
  createCognismPreview,
} from "../src/server/cognismPreview.js";

test("preview route helper blocks redeem URLs", () => {
  assert.throws(
    () => assertSafeCognismPreviewUrl("https://app.cognism.com/api/search/contact/redeem"),
    /Blocked unsafe Cognism preview URL/,
  );
});

test("preview route helper caps maxPerCompany and estimated credits stay 0", async () => {
  const calledUrls = [];
  const fetcher = async (url, options) => {
    calledUrls.push(url);
    const body = JSON.parse(options.body);

    assert.equal(body.jobTitles[0], "Chief Information Security Officer");
    assert.equal(body.account.names[0], "Microsoft");

    return {
      ok: true,
      status: 200,
      async json() {
        return {
          results: [
            {
              id: "contact-preview-1",
              fullName: "Preview Contact",
              jobTitle: "Chief Information Security Officer",
              hasSeniority: true,
              hasJobFunction: true,
              hasCountry: true,
              hasLinkedinUrl: true,
              hasEmail: true,
              hasMobilePhoneNumbers: false,
              hasDirectPhoneNumbers: true,
              account: { name: "Microsoft" },
            },
            {
              id: "contact-preview-2",
              fullName: "Second Contact",
              jobTitle: "Security Analyst",
              account: { name: "Microsoft" },
            },
          ],
        };
      },
    };
  };

  const payload = await createCognismPreview(
    {
      companies: ["Microsoft"],
      targetTitles: ["Chief Information Security Officer"],
      maxPerCompany: 2,
    },
    {
      apiKey: "test-key",
      fetcher,
      searchUrl: "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=20",
    },
  );

  assert.equal(payload.maxPerCompany, 2);
  assert.equal(payload.estimatedCreditsUsed, 0);
  assert.equal(payload.results.length, 2);
  assert.equal(payload.results[0].emailAvailable, true);
  assert.equal(payload.results[0].directDialAvailable, true);
  assert.ok(calledUrls.every(url => !/redeem|reveal|export|enrich/i.test(url)));
});

test("preview route helper keeps requested maxPerCompany without an upper cap", async () => {
  const payload = await createCognismPreview(
    {
      companies: ["Microsoft"],
      targetTitles: ["Chief Information Security Officer"],
      maxPerCompany: 50,
    },
    {
      apiKey: "test-key",
      fetcher: async () => ({
        ok: true,
        status: 200,
        async json() {
          return { results: [] };
        },
      }),
      searchUrl: "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=20",
    },
  );

  assert.equal(payload.maxPerCompany, 50);
});

test("preview route helper filters contacts by required email or mobile", async () => {
  const payload = await createCognismPreview(
    {
      companies: ["Santander"],
      targetTitles: ["Head of User Experience"],
      maxPerCompany: 10,
      requireEmailOrMobile: true,
    },
    {
      apiKey: "test-key",
      fetcher: async () => ({
        ok: true,
        status: 200,
        async json() {
          return {
            results: [
              {
                id: "email-only",
                fullName: "Email Only",
                jobTitle: "Head of User Experience",
                hasEmail: true,
                hasMobilePhoneNumbers: false,
                account: { name: "Santander" },
              },
              {
                id: "no-method",
                fullName: "No Method",
                jobTitle: "Head of User Experience",
                hasEmail: false,
                hasMobilePhoneNumbers: false,
                account: { name: "Santander" },
              },
            ],
          };
        },
      }),
      searchUrl: "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=20",
    },
  );

  assert.equal(payload.requireEmailOrMobile, true);
  assert.equal(payload.results.length, 1);
  assert.equal(payload.results[0].contactName, "Email Only");
});

test("preview route helper requires explicit target titles", async () => {
  await assert.rejects(
    () => createCognismPreview(
      { companies: ["Microsoft"], targetTitles: [], maxPerCompany: 1 },
      { apiKey: "test-key", fetcher: async () => ({ ok: true, json: async () => ({ results: [] }) }) },
    ),
    /At least one target title is required/,
  );
});
