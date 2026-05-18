import { suggestRolesFromTaxonomy } from "./roleTaxonomy.js";

// Remote model integrations are intentionally disabled.
// Lead Finder relies on deterministic taxonomy matches.
export async function suggestTargetRoles(input = {}) {
  return suggestRolesFromTaxonomy(input);
}
