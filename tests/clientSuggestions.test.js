import assert from "node:assert/strict";
import test from "node:test";
import { suggestClientFieldsFromWeb } from "../src/server/clientSuggestions.js";

test("client suggestions fail clearly when OpenAI API key is missing", async () => {
  await assert.rejects(
    () => suggestClientFieldsFromWeb({ name: "Stripe" }, { fetcher: async () => { throw new Error("should not fetch"); } }),
    /OpenAI API key is not configured/,
  );
});

test("client suggestions use OpenAI web lookup when an API key is configured", async () => {
  const fetcher = async (url, options) => {
    const body = JSON.parse(options.body);

    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(body.text.format.name, "client_enrichment");
    assert.deepEqual(body.tools, [{ type: "web_search" }]);
    assert.equal(body.tool_choice, "required");

    return {
      ok: true,
      async json() {
        return {
          output: [
            {
              content: [
                {
                  text: JSON.stringify({
                    workspace: "Agency workspace",
                    industry: "UX consultancy",
                    website: "https://www.example-ux.com",
                    source: "web_search",
                    evidence: ["https://www.example-ux.com/about"],
                    warning: "",
                  }),
                  annotations: [
                    { type: "url_citation", title: "Example UX", url: "https://www.example-ux.com" },
                  ],
                },
              ],
            },
          ],
        };
      },
    };
  };

  const payload = await suggestClientFieldsFromWeb(
    { name: "Example UX" },
    { apiKey: "test-key", fetcher, model: "gpt-test" },
  );

  assert.equal(payload.source, "web_search");
  assert.equal(payload.workspace, "Agency workspace");
  assert.equal(payload.industry, "UX consultancy");
  assert.equal(payload.website, "https://www.example-ux.com");
  assert.deepEqual(payload.evidence, ["https://www.example-ux.com"]);
});

test("client suggestions return blanks when OpenAI cannot identify the company", async () => {
  const fetcher = async () => ({
    ok: true,
    async json() {
      return {
        output: [
          {
            content: [
              {
                text: JSON.stringify({
                  workspace: "",
                  industry: "",
                  website: "",
                  source: "not_found",
                  evidence: [],
                  warning: "No matching official company source found.",
                }),
                annotations: [],
              },
            ],
          },
        ],
      };
    },
  });

  const payload = await suggestClientFieldsFromWeb(
    { name: "Definitely Not A Company 12345" },
    { apiKey: "test-key", fetcher, model: "gpt-test" },
  );

  assert.equal(payload.source, "not_found");
  assert.equal(payload.workspace, "");
  assert.equal(payload.industry, "");
  assert.equal(payload.website, "");
  assert.deepEqual(payload.evidence, []);
  assert.match(payload.warning, /official company source/);
});

test("client suggestions reject web results without official website evidence", async () => {
  const fetcher = async () => ({
    ok: true,
    async json() {
      return {
        output: [
          {
            content: [
              {
                text: JSON.stringify({
                  workspace: "Unknown workspace",
                  industry: "unknown",
                  website: "https://notareal.site",
                  source: "web_search",
                  evidence: ["https://www.scamadviser.com/check-website/notareal.site"],
                  warning: "The website appears to be a placeholder.",
                }),
                annotations: [],
              },
            ],
          },
        ],
      };
    },
  });

  const payload = await suggestClientFieldsFromWeb(
    { name: "Definitely Not A Company 12345" },
    { apiKey: "test-key", fetcher, model: "gpt-test" },
  );

  assert.equal(payload.source, "not_found");
  assert.equal(payload.workspace, "");
  assert.equal(payload.industry, "");
  assert.equal(payload.website, "");
  assert.deepEqual(payload.evidence, []);
});
