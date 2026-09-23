import assert from "node:assert/strict";
import test from "node:test";
import { analyzeDeveloperProfile, calculateMetrics } from "@/lib/analysis/analyzer";
import type { DeveloperProfile, DeveloperRepository } from "@/lib/github/domain";

const repo = (overrides: Partial<DeveloperRepository> = {}): DeveloperRepository => ({ id: 1, name: "repo", fullName: "user/repo", description: null, url: "https://github.com/user/repo", language: "TypeScript", starCount: 0, forkCount: 0, createdAt: "2020-01-01T00:00:00Z", updatedAt: "2021-01-01T00:00:00Z", pushedAt: "2021-01-01T00:00:00Z", isArchived: false, visibility: "public", defaultBranch: "main", ...overrides });
const profile = (repositories: DeveloperRepository[]): DeveloperProfile => ({ username: "user", displayName: null, avatarUrl: "", profileUrl: "", bio: null, location: null, accountCreatedAt: "2020-01-01T00:00:00Z", followerCount: 0, followingCount: 0, publicRepositoryCount: repositories.length, repositories });

test("handles empty and single-repository profiles", () => { assert.equal(calculateMetrics(profile([])).primaryLanguage, null); assert.equal(calculateMetrics(profile([repo({ starCount: 3, forkCount: 2 })])).totalStars, 3); });
test("aggregates languages, stars, forks, and archived repositories", () => { const metrics = calculateMetrics(profile([repo({ language: "JavaScript", starCount: 4, forkCount: 1 }), repo({ id: 2, language: "TypeScript", isArchived: true, starCount: 2, forkCount: 3 })])); assert.equal(metrics.totalForks, 4); assert.equal(metrics.archivedRepositoryCount, 1); assert.equal(metrics.primaryLanguage, "JavaScript"); });
test("selects deterministic archetypes and factual findings", () => { const input = profile([repo({ language: "TypeScript" }), repo({ id: 2, language: "JavaScript" }), repo({ id: 3, language: "Go" }), repo({ id: 4, language: "Rust" })]); const result = analyzeDeveloperProfile(input); assert.equal(result.archetype.id, "polyglot"); assert.equal(result.strengths[0]?.id, "language-breadth"); assert.deepEqual(result, analyzeDeveloperProfile(input)); });
test("detects archived and engagement patterns", () => { const result = analyzeDeveloperProfile(profile([repo({ isArchived: true }), repo({ id: 2, isArchived: true }), repo({ id: 3 }), repo({ id: 4 })])); assert.equal(result.improvementAreas.length, 2); });
