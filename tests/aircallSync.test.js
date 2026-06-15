import assert from "node:assert/strict";
import test from "node:test";
import { createTemporaryAircallRecordingLink, syncAircallData } from "../src/server/aircallSync.js";

function createQuery(table, state) {
  const query = {
    select(columns) {
      state.selects.push({ table, columns });
      return query;
    },
    eq(column, value) {
      state.filters.push({ table, column, value });
      return query;
    },
    in(column, values) {
      state.filters.push({ table, column, values });
      return query;
    },
    limit(value) {
      state.limits.push({ table, value });
      return query;
    },
    then(resolve) {
      if (table === "users") {
        resolve({ data: [{ id: "user-1", aircall_user_id: "1825018" }], error: null });
        return;
      }
      if (table === "contacts") {
        resolve({
          data: [{
            id: "contact-1",
            client_id: "client-1",
            company_id: "company-1",
            phone: null,
            mobile: "+353892144638",
            direct_dial: null,
            manual_mobile: null,
            manual_direct_dial: null,
          }],
          error: null,
        });
        return;
      }
      if (table === "aircall_calls") {
        resolve({ data: [{ id: "call-row-1", aircall_call_id: 3865862294 }], error: null });
        return;
      }
      resolve({ data: [], error: null });
    },
  };
  return query;
}

test("Aircall sync upserts users and calls with CRM links", async () => {
  const state = { upserts: [], selects: [], filters: [], limits: [] };
  const serviceClient = {
    from(table) {
      return {
        ...createQuery(table, state),
        upsert(rows, options) {
          state.upserts.push({ table, rows, options });
          return Promise.resolve({ error: null });
        },
      };
    },
  };

  const fetcher = async url => {
    if (url.includes("/users?")) {
      return {
        ok: true,
        json: async () => ({
          users: [{ id: 1825018, name: "Solomon Sonowo", email: "solomon.sonowo@paceops.com", availability_status: "available" }],
          meta: {},
        }),
      };
    }

    if (url.includes("/calls?")) {
      return {
        ok: true,
        json: async () => ({
          calls: [{
            id: 3865862294,
            sid: "CA-test",
            direct_link: "https://api.aircall.io/v1/calls/3865862294",
            direction: "outbound",
            status: "done",
            started_at: 1781528860,
            answered_at: 1781528862,
            ended_at: 1781528880,
            duration: 20,
            raw_digits: "+353 89 214 4638",
            recording: "https://expired.example.com/recording.mp3",
            asset: "https://assets.aircall.io/calls/3865862294/recording",
            user: { id: 1825018, name: "Solomon Sonowo", email: "solomon.sonowo@paceops.com" },
            number: { id: 1249606 },
            tags: [],
            comments: [],
          }],
          meta: {},
        }),
      };
    }

    if (url.includes("/transcription")) {
      return {
        ok: true,
        json: async () => ({
          transcription: {
            content: {
              language: "en",
              utterances: [{ speaker: "agent", text: "Hello from PaceOps." }],
            },
            created_at: "2026-06-15T12:00:00.000Z",
          },
        }),
      };
    }

    if (url.includes("/summary")) {
      return {
        ok: true,
        json: async () => ({ summary: { content: "Call went well.", created_at: "2026-06-15T12:01:00.000Z" } }),
      };
    }

    if (url.includes("/custom_summary_result")) {
      return { ok: false, status: 404, text: async () => "Not found" };
    }

    if (url.includes("/sentiments")) {
      return {
        ok: true,
        json: async () => ({
          sentiment: {
            id: 3865862294,
            call_id: 3865862294,
            participants: [
              { phone_number: "+353892144638", value: "POSITIVE", type: "external" },
              { user_id: 1825018, value: "NEUTRAL", type: "internal" },
            ],
          },
        }),
      };
    }

    if (url.includes("/topics")) {
      return {
        ok: true,
        json: async () => ({ topic: { content: ["pricing"], created_at: "2026-06-15T12:02:00.000Z" } }),
      };
    }

    if (url.includes("/action_items")) {
      return {
        ok: true,
        json: async () => ({ action_items: [{ id: 1, ai_generated: true, content: "Send proposal.", created_by: 1825018 }] }),
      };
    }

    if (url.includes("/playbook_result")) {
      return { ok: false, status: 403, text: async () => "Forbidden" };
    }

    if (url.includes("/evaluations")) {
      return {
        ok: true,
        json: async () => ({ evaluations: [{ scorecard: { name: "Discovery" }, score: { normalized_score: 92 } }] }),
      };
    }

    return {
      ok: true,
      json: async () => ({}),
    };
  };

  const result = await syncAircallData({
    organizationId: "org-1",
    apiId: "api-id",
    apiToken: "api-token",
  }, { serviceClient, fetcher });

  assert.equal(result.usersSynced, 1);
  assert.equal(result.callsSynced, 1);

  const userUpsert = state.upserts.find(entry => entry.table === "aircall_users");
  assert.equal(userUpsert.options.onConflict, "organization_id,aircall_user_id");
  assert.equal(userUpsert.rows[0].aircall_user_id, "1825018");

  const callUpsert = state.upserts.find(entry => entry.table === "aircall_calls");
  assert.equal(callUpsert.options.onConflict, "organization_id,aircall_call_id");
  assert.equal(callUpsert.rows[0].aircall_call_id, 3865862294);
  assert.equal(callUpsert.rows[0].direct_link, "https://phone.aircall.io/calls/3865862294");
  assert.equal(callUpsert.rows[0].recording_url, "https://assets.aircall.io/calls/3865862294/recording");
  assert.equal(callUpsert.rows[0].user_id, "user-1");
  assert.equal(callUpsert.rows[0].contact_id, "contact-1");
  assert.equal(callUpsert.rows[0].duration_seconds, 20);

  assert.equal(result.transcriptsSynced, 1);
  assert.equal(result.summariesSynced, 1);
  assert.equal(result.sentimentsSynced, 1);
  assert.equal(result.topicsSynced, 1);
  assert.equal(result.actionItemsSynced, 1);
  assert.equal(result.evaluationsSynced, 1);

  const transcriptUpsert = state.upserts.find(entry => entry.table === "aircall_call_transcripts");
  assert.equal(transcriptUpsert.rows[0].full_text, "Hello from PaceOps.");
  assert.equal(transcriptUpsert.rows[0].call_id, "call-row-1");

  const sentimentUpsert = state.upserts.find(entry => entry.table === "aircall_call_sentiments");
  assert.equal(sentimentUpsert.rows[0].sentiment_label, "POSITIVE");
  assert.equal(sentimentUpsert.rows[0].sentiment_score, 1);
  assert.deepEqual(sentimentUpsert.rows[0].segments, [
    { phone_number: "+353892144638", value: "POSITIVE", type: "external" },
    { user_id: 1825018, value: "NEUTRAL", type: "internal" },
  ]);
});

test("Aircall temporary recording link fetches a fresh signed recording URL", async () => {
  let requestedUrl = "";
  const payload = await createTemporaryAircallRecordingLink({
    callId: "3865862294",
    apiId: "api-id",
    apiToken: "api-token",
  }, {
    fetcher: async url => {
      requestedUrl = url;
      return {
        ok: true,
        json: async () => ({
          call: {
            id: 3865862294,
            recording: "https://temporary-recording.example.com/signed.mp3",
            asset: "https://assets.aircall.io/calls/3865862294/recording",
          },
        }),
      };
    },
  });

  assert.equal(requestedUrl, "https://api.aircall.io/v1/calls/3865862294");
  assert.equal(payload.recordingUrl, "https://temporary-recording.example.com/signed.mp3");
  assert.equal(payload.stableRecordingUrl, "https://assets.aircall.io/calls/3865862294/recording");
});
