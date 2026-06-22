import assert from "node:assert/strict";
import test from "node:test";
import { assertSafeRemoteImageUrl, ingestContactProfileImage } from "../src/server/contactProfileImages.js";

test("contact image ingest blocks non-HTTPS and local URLs", () => {
  assert.throws(() => assertSafeRemoteImageUrl("http://example.com/a.jpg"), /HTTPS/);
  assert.throws(() => assertSafeRemoteImageUrl("https://localhost/a.jpg"), /not allowed/);
  assert.throws(() => assertSafeRemoteImageUrl("https://127.0.0.1/a.jpg"), /not allowed/);
  assert.equal(assertSafeRemoteImageUrl("https://media.licdn.com/profile.jpg").hostname, "media.licdn.com");
});

test("contact image ingest uploads supported image bytes to Supabase Storage", async () => {
  const uploads = [];
  const serviceClient = {
    storage: {
      from(bucket) {
        return {
          async upload(path, bytes, options) {
            uploads.push({ bucket, path, bytes, options });
            return { error: null };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: `https://example.supabase.co/storage/v1/object/public/${bucket}/${path}` } };
          },
        };
      },
    },
  };

  const result = await ingestContactProfileImage({
    imageUrl: "https://media.licdn.com/profile.jpg",
    organizationId: "org-1",
    providerContactId: "ctc_123",
    source: "lemlist",
  }, {
    serviceClient,
    fetcher: async () => new Response(Buffer.from("image-bytes"), {
      status: 200,
      headers: { "content-type": "image/jpeg", "content-length": "11" },
    }),
  });

  assert.equal(uploads.length, 1);
  assert.equal(uploads[0].bucket, "profile-images");
  assert.match(uploads[0].path, /^org-1\/contacts\/ctc_123\/\d+-lemlist\.jpg$/);
  assert.equal(uploads[0].options.contentType, "image/jpeg");
  assert.match(result.profilePictureUrl, /\/profile-images\/org-1\/contacts\/ctc_123\//);
});
