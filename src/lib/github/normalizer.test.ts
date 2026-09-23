import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeDeveloperProfile,
  normalizeRepository,
  type GitHubRepository,
  type GitHubUser,
} from "@/lib/github/normalizer";

const user = {
  login: "octocat",
  name: "The Octocat",
  avatar_url: "https://avatars.githubusercontent.com/u/1",
  html_url: "https://github.com/octocat",
  bio: "GitHub mascot",
  location: "Internet",
  created_at: "2011-01-25T18:44:36Z",
  followers: 100,
  following: 2,
  public_repos: 8,
  node_id: "raw-user-field",
} as unknown as GitHubUser;

const repository = {
  id: 1,
  name: "hello-world",
  full_name: "octocat/hello-world",
  description: "A sample repository",
  html_url: "https://github.com/octocat/hello-world",
  language: "TypeScript",
  stargazers_count: 42,
  forks_count: 7,
  created_at: "2020-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  pushed_at: "2024-01-02T00:00:00Z",
  archived: false,
  visibility: "public",
  default_branch: "main",
  node_id: "raw-repository-field",
} as unknown as GitHubRepository;

test("normalizes the GitHub profile into the application domain model", () => {
  const profile = normalizeDeveloperProfile(user, [repository]);

  assert.deepEqual(profile, {
    username: "octocat",
    displayName: "The Octocat",
    avatarUrl: "https://avatars.githubusercontent.com/u/1",
    profileUrl: "https://github.com/octocat",
    bio: "GitHub mascot",
    location: "Internet",
    accountCreatedAt: "2011-01-25T18:44:36Z",
    followerCount: 100,
    followingCount: 2,
    publicRepositoryCount: 8,
    repositories: [normalizeRepository(repository)],
  });
});

test("does not expose raw GitHub repository fields", () => {
  const normalizedRepository = normalizeRepository(repository);

  assert.equal("node_id" in normalizedRepository, false);
  assert.equal("owner" in normalizedRepository, false);
});
