import assert from "node:assert/strict";
import test from "node:test";
import { normalizePrivateKey } from "@/lib/github/private-key";

test("normalizes an escaped PEM stored in an environment variable", () => {
  const privateKey = normalizePrivateKey(
    "  -----BEGIN PRIVATE KEY-----\\r\\nabc\\r\\n-----END PRIVATE KEY-----\\r\\n  ",
  );

  assert.equal(
    privateKey,
    "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
  );
});

test("preserves a multiline PEM while trimming surrounding whitespace", () => {
  const privateKey = normalizePrivateKey(
    "\n-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----\n",
  );

  assert.equal(
    privateKey,
    "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
  );
});
