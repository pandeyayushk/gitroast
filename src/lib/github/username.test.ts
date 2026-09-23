import assert from "node:assert/strict";
import test from "node:test";
import { parseGitHubUsername } from "@/lib/github/username";

test("accepts a trimmed GitHub username", () => {
  assert.equal(parseGitHubUsername("  octo-cat  "), "octo-cat");
});

test("rejects missing, URL-shaped, and malformed GitHub usernames", () => {
  assert.equal(parseGitHubUsername(null), null);
  assert.equal(parseGitHubUsername("https://github.com/octocat"), null);
  assert.equal(parseGitHubUsername("-octocat"), null);
  assert.equal(parseGitHubUsername("octocat-"), null);
  assert.equal(parseGitHubUsername("octo_cat"), null);
});
