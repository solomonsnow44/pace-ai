import assert from "node:assert/strict";
import test from "node:test";
import { suggestTargetRoles } from "../src/server/roleSuggestions.js";

test("role suggestions use fallback when OPENAI_API_KEY is not configured", async () => {
  const payload = await suggestTargetRoles({ query: "ux" }, { apiKey: "" });

  assert.equal(payload.mode, "fallback");
  assert.ok(payload.roles.includes("Head of UX"));
  assert.ok(payload.roles.includes("Head of Product Support"));
});

test("role suggestions parse OpenAI structured output", async () => {
  const fetcher = async (url, options) => {
    const body = JSON.parse(options.body);

    assert.equal(url, "https://api.openai.com/v1/responses");
    assert.equal(body.text.format.type, "json_schema");

    return {
      ok: true,
      async json() {
        return {
          output: [
            {
              content: [
                {
                  text: JSON.stringify({
                    roles: ["Chief Information Security Officer", "Head of Cyber Security"],
                  }),
                },
              ],
            },
          ],
        };
      },
    };
  };

  const payload = await suggestTargetRoles(
    { query: "security" },
    { apiKey: "test-key", fetcher, model: "gpt-test" },
  );

  assert.equal(payload.mode, "openai");
  assert.deepEqual(payload.roles, ["Chief Information Security Officer", "Head of Cyber Security"]);
});
