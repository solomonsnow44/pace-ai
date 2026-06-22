import assert from "node:assert/strict";
import test from "node:test";
import { resolvePersonalAircallUserRows } from "../src/server/apiHandler.js";

test("Aircall personal resolver matches linked user, explicit id, email, and unique name", () => {
  const user = {
    id: "usr_amer",
    email: "amer@example.com",
    displayName: "Amer Khan",
    aircallUserId: "",
  };
  const rows = [
    { aircall_user_id: "101", linked_user_id: "usr_amer", email: "other@example.com", name: "Other" },
    { aircall_user_id: "102", linked_user_id: null, email: "amer@example.com", name: "A. Khan" },
    { aircall_user_id: "103", linked_user_id: null, email: "name@example.com", name: "Amer Khan" },
    { aircall_user_id: "104", linked_user_id: null, email: "duplicate-one@example.com", name: "Duplicate Name" },
    { aircall_user_id: "105", linked_user_id: null, email: "duplicate-two@example.com", name: "Duplicate Name" },
  ];

  assert.deepEqual(resolvePersonalAircallUserRows(user, rows).map(row => row.aircall_user_id), ["101", "102", "103"]);
});

test("Aircall personal resolver does not grant ambiguous name matches", () => {
  const user = {
    id: "usr_duplicate",
    email: "duplicate@example.com",
    displayName: "Duplicate Name",
    aircallUserId: "",
  };
  const rows = [
    { aircall_user_id: "104", linked_user_id: null, email: "duplicate-one@example.com", name: "Duplicate Name" },
    { aircall_user_id: "105", linked_user_id: null, email: "duplicate-two@example.com", name: "Duplicate Name" },
  ];

  assert.deepEqual(resolvePersonalAircallUserRows(user, rows), []);
});
