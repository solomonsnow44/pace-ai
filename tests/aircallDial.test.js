import assert from "node:assert/strict";
import test from "node:test";
import { dialAircall, maskPhoneNumber, validateE164PhoneNumber } from "../src/server/aircallDial.js";

const redeemedContact = {
  id: "crm_contact_1",
  redeemed: true,
  phoneNumber: "+441234567890",
};

test("preview contacts cannot be dialed", async () => {
  const logs = [];

  await assert.rejects(
    () => dialAircall(
      { phoneNumber: "+441234567890", contactId: "crm_contact_1" },
      {
        userId: "user_1",
        aircallUserId: "123",
        apiId: "api-id",
        apiToken: "api-token",
        getContactById: async () => ({ id: "crm_contact_1", redeemed: false, phoneNumber: "+441234567890" }),
        auditLogger: entry => logs.push(entry),
      },
    ),
    /Preview-only contacts cannot be dialed/,
  );

  assert.equal(logs[0].status, "blocked_preview_contact");
});

test("redeemed contacts with valid phone numbers can call Aircall dial", async () => {
  const requests = [];
  const logs = [];

  const payload = await dialAircall(
    { phoneNumber: "+441234567890", contactId: "crm_contact_1" },
    {
      userId: "user_1",
      aircallUserId: "123",
      apiId: "api-id",
      apiToken: "api-token",
      getContactById: async () => redeemedContact,
      auditLogger: entry => logs.push(entry),
      fetcher: async (url, options) => {
        requests.push({ url, options });
        return { status: 204 };
      },
    },
  );

  assert.equal(payload.message, "Number sent to Aircall.");
  assert.equal(requests[0].url, "https://api.aircall.io/v1/users/123/dial");
  assert.equal(JSON.parse(requests[0].options.body).to, "+441234567890");
  assert.equal(logs[0].status, "sent_to_aircall");
});

test("invalid phone numbers are rejected", async () => {
  assert.equal(validateE164PhoneNumber("01234567890"), false);

  await assert.rejects(
    () => dialAircall(
      { phoneNumber: "01234567890", contactId: "crm_contact_1" },
      {
        userId: "user_1",
        aircallUserId: "123",
        apiId: "api-id",
        apiToken: "api-token",
        getContactById: async () => redeemedContact,
        auditLogger: () => {},
      },
    ),
    /E.164/,
  );
});

test("phone numbers are masked in logs", async () => {
  const logs = [];

  assert.equal(maskPhoneNumber("+441234567890"), "*********7890");

  await dialAircall(
    { phoneNumber: "+441234567890", contactId: "crm_contact_1" },
    {
      userId: "user_1",
      aircallUserId: "123",
      apiId: "api-id",
      apiToken: "api-token",
      getContactById: async () => redeemedContact,
      auditLogger: entry => logs.push(entry),
      fetcher: async () => ({ status: 204 }),
    },
  );

  assert.equal(logs[0].phoneNumber, "*********7890");
  assert.equal(logs[0].phoneNumber.includes("123456"), false);
});
