import assert from "node:assert/strict";
import test from "node:test";
import { suggestTargetRoles } from "../src/server/roleSuggestions.js";

const taxonomyCases = [
  ["engineering", ["engineering"], ["Chief Technology Officer", "VP Engineering", "Head of Engineering", "Engineering Manager"]],
  ["sales", ["sales"], ["Chief Revenue Officer", "VP Sales", "Head of Sales", "Sales Manager"]],
  ["finance", ["finance"], ["Chief Financial Officer", "VP Finance", "Head of Finance", "Finance Manager"]],
  ["cyber security", ["cyber_security"], ["Chief Information Security Officer", "VP Information Security", "Head of Information Security", "Cyber Security Manager"]],
  ["HR", ["hr"], ["Chief People Officer", "VP People", "Head of People", "HR Manager"]],
  ["legal", ["legal"], ["Chief Legal Officer", "General Counsel", "Head of Legal", "Legal Manager"]],
  ["procurement", ["procurement"], ["Chief Procurement Officer", "VP Procurement", "Head of Procurement", "Procurement Manager"]],
  ["product", ["product"], ["Chief Product Officer", "VP Product", "Head of Product", "Product Manager"]],
  ["data", ["data"], ["Chief Data Officer", "VP Data", "Head of Data", "Data Manager"]],
  ["IT", ["it"], ["Chief Information Officer", "VP IT", "Head of IT", "IT Manager"]],
  ["operations", ["operations"], ["Chief Operating Officer", "VP Operations", "Head of Operations", "Operations Manager"]],
  ["customer success", ["customer_success"], ["Chief Customer Officer", "VP Customer Success", "Head of Customer Success", "Customer Success Manager"]],
  ["marketing", ["marketing"], ["Chief Marketing Officer", "VP Marketing", "Head of Marketing", "Marketing Manager"]],
  ["compliance", ["compliance"], ["Chief Compliance Officer", "VP Compliance", "Head of Compliance", "Compliance Manager"]],
  ["sales operations", ["sales", "operations"], ["VP Sales", "VP Sales Operations", "Director of Sales Operations", "Sales Operations Manager"]],
  ["security engineering", ["engineering", "cyber_security"], ["VP Engineering", "VP Information Security", "Director of Security Engineering", "Security Engineering Lead"]],
  ["product marketing", ["product", "marketing"], ["VP Product", "VP Product Marketing", "Head of Product Marketing", "Product Marketing Manager"]],
];

for (const [query, expectedDepartments, expectedRoles] of taxonomyCases) {
  test(`role taxonomy suggests ${query}`, async () => {
    const payload = await suggestTargetRoles({ query });

    assert.equal(payload.query, query);
    assert.equal(payload.mode, "taxonomy");
    assert.equal(payload.warning, "");
    assert.ok(payload.roles.length >= 5);
    assert.ok(payload.roles.length <= 45);

    for (const department of expectedDepartments) {
      assert.ok(payload.matchedDepartments.includes(department), `expected ${department} in ${payload.matchedDepartments.join(", ")}`);
    }

    for (const role of expectedRoles) {
      assert.ok(payload.roles.includes(role), `expected ${role}`);
    }
  });
}

test("role taxonomy deduplicates roles case-insensitively", async () => {
  const payload = await suggestTargetRoles({ query: "operations sales ops" });
  const normalizedRoles = payload.roles.map(role => role.toLowerCase());

  assert.equal(normalizedRoles.length, new Set(normalizedRoles).size);
});

test("role taxonomy uses safe fallback for unknown personas", async () => {
  const payload = await suggestTargetRoles({ query: "moonshot wrangler" });

  assert.equal(payload.mode, "fallback");
  assert.deepEqual(payload.matchedDepartments, []);
  assert.deepEqual(payload.roles, [
    "Head of moonshot wrangler",
    "Director of moonshot wrangler",
    "VP moonshot wrangler",
    "moonshot wrangler Manager",
    "moonshot wrangler Lead",
  ]);
  assert.match(payload.warning, /No known department taxonomy/);
});
