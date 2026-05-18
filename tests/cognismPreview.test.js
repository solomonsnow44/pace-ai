import assert from "node:assert/strict";
import test from "node:test";
import {
  assertSafeCognismPreviewUrl,
  COGNISM_CONTACT_SEARCH_URL,
  createCognismPreview,
  redeemCognismContacts,
} from "../src/server/cognismPreview.js";

test("preview route helper blocks redeem URLs", () => {
  assert.throws(
    () => assertSafeCognismPreviewUrl("https://app.cognism.com/api/search/contact/redeem"),
    /Blocked unsafe lead preview URL/,
  );
});

test("preview route helper requests a wider candidate page", () => {
  assert.match(COGNISM_CONTACT_SEARCH_URL, /indexSize=100/);
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

test("preview route helper defaults to a usable company result count", async () => {
  const payload = await createCognismPreview(
    {
      companies: ["Microsoft"],
      targetTitles: ["Chief Information Security Officer"],
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

  assert.equal(payload.maxPerCompany, 1);
});

test("preview route helper can use local fallback without an API key", async () => {
  const payload = await createCognismPreview(
    {
      companies: ["Microsoft"],
      targetTitles: ["Head of User Experience"],
      maxPerCompany: 2,
      requireMobileAvailable: true,
    },
    { allowLocalPreviewWithoutApiKey: true },
  );

  assert.equal(payload.maxPerCompany, 2);
  assert.equal(payload.estimatedCreditsUsed, 0);
  assert.equal(payload.results.length, 2);
  assert.equal(payload.results.every(result => result.company === "Microsoft"), true);
  assert.equal(payload.results.every(result => result.mobileAvailable), true);
  assert.match(payload.warning, /local preview data/);
});

test("redeem helper posts redeem IDs and maps returned contact data", async () => {
  let calledUrl = "";
  let calledBody = null;
  const payload = await redeemCognismContacts(
    {
      leads: [
        {
          rowId: "row-1",
          redeemId: "redeem-1",
          company: "Stripe",
          contactName: "Megan Arora",
        },
      ],
    },
    {
      apiKey: "test-key",
      fetcher: async (url, options) => {
        calledUrl = url;
        calledBody = JSON.parse(options.body);
        assert.equal(options.method, "POST");
        assert.equal(options.headers.Authorization, "Bearer test-key");

        return {
          ok: true,
          status: 200,
          async json() {
            return {
              results: [
                {
                  redeemId: "redeem-1",
                  id: "contact-1",
                  fullName: "Megan Arora",
                  jobTitle: "Head Of Procurement",
                  email: { address: "megan@example.com" },
                  mobilePhoneNumbers: [
                    { number: "+1 630-542-1120", label: "MOBILE" },
                  ],
                  directPhoneNumbers: [
                    { number: "+1 508-434-4950", label: "DIRECT_DIAL" },
                  ],
                  account: { name: "Stripe" },
                },
              ],
            };
          },
        };
      },
    },
  );

  assert.match(calledUrl, /\/api\/search\/contact\/redeem$/);
  assert.deepEqual(calledBody, { redeemIds: ["redeem-1"] });
  assert.equal(payload.mode, "redeem");
  assert.equal(payload.estimatedCreditsUsed, 1);
  assert.equal(payload.redeemed[0].rowId, "row-1");
  assert.equal(payload.redeemed[0].manualEmail, "megan@example.com");
  assert.equal(payload.redeemed[0].manualMobile, "+1 630-542-1120");
  assert.equal(payload.redeemed[0].manualDirectDial, "+1 508-434-4950");
});

test("redeem helper reads Cognism result arrays and surfaces response errors", async () => {
  const payload = await redeemCognismContacts(
    { redeemIds: ["redeem-1"] },
    {
      apiKey: "test-key",
      fetcher: async () => ({
        ok: true,
        status: 200,
        async json() {
          return {
            result: [
              {
                redeemId: "redeem-1",
                email: { address: "result@example.com" },
                mobilePhoneNumbers: [{ number: "+1 508-434-4950", label: "DIRECT_DIAL", numberType: "MOBILE" }],
              },
            ],
          };
        },
      }),
    },
  );

  assert.equal(payload.redeemed.length, 1);
  assert.equal(payload.redeemed[0].manualEmail, "result@example.com");
  assert.equal(payload.redeemed[0].manualMobile, "+1 508-434-4950");
  assert.equal(payload.redeemed[0].manualDirectDial, "");

  await assert.rejects(
    () => redeemCognismContacts(
      { redeemIds: ["bad-redeem-id"] },
      {
        apiKey: "test-key",
        fetcher: async () => ({
          ok: false,
          status: 400,
          clone() {
            return this;
          },
          async json() {
            return { message: "Invalid redeemId" };
          },
          async text() {
            return "";
          },
        }),
      },
    ),
    /Invalid redeemId/,
  );
});

test("redeem helper keeps mobilePhoneNumbers out of direct dial when Cognism labels them direct dial", async () => {
  const payload = await redeemCognismContacts(
    { redeemIds: ["redeem-1"] },
    {
      apiKey: "test-key",
      fetcher: async () => ({
        ok: true,
        status: 200,
        async json() {
          return {
            results: [
              {
                redeemId: "redeem-1",
                email: { address: "result@example.com" },
                mobilePhoneNumbers: [
                  { number: "+18475081752", label: "DIRECT_DIAL", numberType: "MOBILE", dnc: false },
                  { number: "DNC", label: "DIRECT_DIAL", numberType: "MOBILE", dnc: true },
                ],
                directPhoneNumbers: [
                  { number: "+12122604201", label: "DIRECT_DIAL", numberType: "FIXED_LINE_OR_MOBILE", dnc: false },
                ],
              },
            ],
          };
        },
      }),
    },
  );

  assert.equal(payload.redeemed[0].manualMobile, "+18475081752");
  assert.equal(payload.redeemed[0].manualDirectDial, "+12122604201");
});

test("redeem helper does not preserve a stale direct dial when Cognism returns the same number as mobile", async () => {
  const payload = await redeemCognismContacts(
    {
      leads: [
        {
          rowId: "row-1",
          redeemId: "redeem-1",
          manualDirectDial: "+18475081752",
        },
      ],
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
                redeemId: "redeem-1",
                mobilePhoneNumbers: [
                  { number: "+18475081752", label: "DIRECT_DIAL", numberType: "MOBILE", dnc: false },
                ],
              },
            ],
          };
        },
      }),
    },
  );

  assert.equal(payload.redeemed[0].manualMobile, "+18475081752");
  assert.equal(payload.redeemed[0].manualDirectDial, "");
});

test("redeem helper limits each request to twenty contacts", async () => {
  await assert.rejects(
    () => redeemCognismContacts(
      { redeemIds: Array.from({ length: 21 }, (_, index) => `redeem-${index}`) },
      { apiKey: "test-key", fetcher: async () => ({ ok: true, json: async () => ({ results: [] }) }) },
    ),
    /Redeem up to 20 contacts at a time/,
  );
});

test("redeem helper can use local fallback without an API key", async () => {
  const payload = await redeemCognismContacts(
    {
      leads: [
        {
          rowId: "row-1",
          redeemId: "local-preview:stripe:1",
          company: "Stripe",
          contactName: "Megan Arora",
        },
      ],
    },
    { allowLocalRedeemWithoutApiKey: true },
  );

  assert.equal(payload.mode, "redeem");
  assert.equal(payload.estimatedCreditsUsed, 1);
  assert.equal(payload.redeemed[0].rowId, "row-1");
  assert.match(payload.redeemed[0].manualEmail, /@stripe\.example$/);
  assert.match(payload.redeemed[0].manualMobile, /^\+15550001/);
  assert.match(payload.warning, /local redeem data/);
});

test("preview route helper filters contacts by required mobile", async () => {
  const payload = await createCognismPreview(
    {
      companies: ["Santander"],
      targetTitles: ["Head of User Experience"],
      maxPerCompany: 10,
      requireMobileAvailable: true,
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
                id: "mobile",
                fullName: "Has Mobile",
                jobTitle: "Head of User Experience",
                hasEmail: false,
                hasMobilePhoneNumbers: true,
                account: { name: "Santander" },
              },
              {
                id: "email-only",
                fullName: "Email Only",
                jobTitle: "Head of User Experience",
                hasEmail: true,
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

  assert.equal(payload.requireMobileAvailable, true);
  assert.equal(payload.results.length, 1);
  assert.equal(payload.results[0].contactName, "Has Mobile");
});

test("preview route helper filters contacts by required direct dial", async () => {
  const payload = await createCognismPreview(
    {
      companies: ["Santander"],
      targetTitles: ["Head of User Experience"],
      maxPerCompany: 10,
      requireDirectDialAvailable: true,
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
                id: "direct",
                fullName: "Has Direct",
                jobTitle: "Head of User Experience",
                hasDirectPhoneNumbers: true,
                account: { name: "Santander" },
              },
              {
                id: "mobile-only",
                fullName: "Mobile Only",
                jobTitle: "Head of User Experience",
                hasMobilePhoneNumbers: true,
                hasDirectPhoneNumbers: false,
                account: { name: "Santander" },
              },
            ],
          };
        },
      }),
      searchUrl: "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=20",
    },
  );

  assert.equal(payload.requireDirectDialAvailable, true);
  assert.equal(payload.results.length, 1);
  assert.equal(payload.results[0].contactName, "Has Direct");
});

test("preview route helper only keeps exact company name matches", async () => {
  const payload = await createCognismPreview(
    {
      companies: ["Stripe"],
      targetTitles: ["Head of UX"],
      maxPerCompany: 10,
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
                id: "wrong-company",
                fullName: "Wrong Company",
                jobTitle: "Head of UX",
                account: { name: "Colour & Stripe" },
              },
              {
                id: "right-company",
                fullName: "Right Company",
                jobTitle: "Head of UX",
                account: { name: "Stripe" },
              },
            ],
          };
        },
      }),
      searchUrl: "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=20",
    },
  );

  assert.equal(payload.results.length, 1);
  assert.equal(payload.results[0].contactName, "Right Company");
  assert.equal(payload.results[0].company, "Stripe");
});

test("preview route helper only keeps exact company domain matches", async () => {
  const payload = await createCognismPreview(
    {
      companies: ["stripe.com"],
      targetTitles: ["Head of UX"],
      maxPerCompany: 10,
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
                id: "wrong-domain",
                fullName: "Wrong Domain",
                jobTitle: "Head of UX",
                account: { name: "Stripe Partner", domain: "partner-stripe.com" },
              },
              {
                id: "right-domain",
                fullName: "Right Domain",
                jobTitle: "Head of UX",
                account: { name: "Stripe", website: "https://www.stripe.com/about" },
              },
            ],
          };
        },
      }),
      searchUrl: "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=20",
    },
  );

  assert.equal(payload.results.length, 1);
  assert.equal(payload.results[0].contactName, "Right Domain");
});

test("preview route helper paginates search results without redeeming contacts", async () => {
  const calledUrls = [];
  const payload = await createCognismPreview(
    {
      companies: ["Stripe"],
      targetTitles: ["Head of UX"],
      maxPerCompany: 10,
    },
    {
      apiKey: "test-key",
      fetcher: async (url) => {
        calledUrls.push(url);
        const lastReturnedKey = new URL(url).searchParams.get("lastReturnedKey");

        return {
          ok: true,
          status: 200,
          async json() {
            if (!lastReturnedKey) {
              return {
                lastReturnedKey: "page-2",
                results: [
                  {
                    id: "first-page-contact",
                    fullName: "First Page Contact",
                    jobTitle: "Director of UX",
                    account: { name: "Stripe" },
                  },
                ],
              };
            }

            return {
              results: [
                {
                  id: "claire-whelan",
                  fullName: "Claire Whelan",
                  jobTitle: "Head Of Product Support",
                  country: "Ireland",
                  hasMobilePhoneNumbers: true,
                  account: { name: "Stripe" },
                },
              ],
            };
          },
        };
      },
      searchUrl: "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=100",
    },
  );

  assert.equal(calledUrls.length, 2);
  assert.ok(calledUrls.every(url => !/redeem|reveal|export|enrich/i.test(url)));
  assert.equal(new URL(calledUrls[1]).searchParams.get("lastReturnedKey"), "page-2");
  assert.equal(payload.results.length, 2);
  assert.equal(payload.results.some(result => result.contactName === "Claire Whelan"), true);
});

test("preview route helper expands UX searches to product support titles", async () => {
  const fetcher = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.ok(body.jobTitles.includes("Head of UX"));
    assert.ok(body.jobTitles.includes("Head of Product Support"));

    return {
      ok: true,
      status: 200,
      async json() {
        return {
          results: [
            {
              id: "product-support",
              fullName: "Product Support Lead",
              jobTitle: "Head of Product Support",
              hasMobilePhoneNumbers: true,
              account: { name: "Stripe" },
            },
          ],
        };
      },
    };
  };

  const payload = await createCognismPreview(
    {
      companies: ["Stripe"],
      targetTitles: ["Head of UX"],
      maxPerCompany: 10,
      requireMobileAvailable: true,
    },
    {
      apiKey: "test-key",
      fetcher,
      searchUrl: "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=20",
    },
  );

  assert.equal(payload.results.length, 1);
  assert.equal(payload.results[0].jobTitle, "Head of Product Support");
});

test("preview route helper passes and filters selected countries", async () => {
  const fetcher = async (_url, options) => {
    const body = JSON.parse(options.body);
    assert.deepEqual(body.countries, ["Ireland"]);
    assert.deepEqual(body.locations, ["Ireland"]);

    return {
      ok: true,
      status: 200,
      async json() {
        return {
          results: [
            {
              id: "ireland-contact",
              fullName: "Ireland Lead",
              jobTitle: "Head of Product Support",
              city: "Dublin",
              country: "Ireland",
              hasMobilePhoneNumbers: true,
              account: { name: "Stripe" },
            },
            {
              id: "us-contact",
              fullName: "US Lead",
              jobTitle: "Head of Product Support",
              city: "New York",
              country: "United States",
              hasMobilePhoneNumbers: true,
              account: { name: "Stripe" },
            },
          ],
        };
      },
    };
  };

  const payload = await createCognismPreview(
    {
      companies: ["Stripe"],
      targetTitles: ["Head of Product Support"],
      countries: ["Ireland"],
      maxPerCompany: 10,
    },
    {
      apiKey: "test-key",
      fetcher,
      searchUrl: "https://app.cognism.com/api/search/contact/search?lastReturnedKey=&indexSize=20",
    },
  );

  assert.deepEqual(payload.countries, ["Ireland"]);
  assert.equal(payload.results.length, 1);
  assert.equal(payload.results[0].contactName, "Ireland Lead");
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
