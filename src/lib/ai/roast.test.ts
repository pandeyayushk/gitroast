import assert from "node:assert/strict";
import test from "node:test";
import { type GoogleGenAI } from "@google/genai";
import { getGeminiClient } from "@/lib/ai/client";
import { RoastError } from "@/lib/ai/domain";
import {
  buildRoastInput,
  generateRoast,
  parseRoastResult,
  ROAST_SYSTEM_INSTRUCTION,
} from "@/lib/ai/roast";
import type { AnalysisResult } from "@/lib/analysis/domain";
import type { DeveloperProfile, DeveloperRepository } from "@/lib/github/domain";

const mockRepo: DeveloperRepository = {
  id: 1,
  name: "test-repo",
  fullName: "test-user/test-repo",
  description: "A test repository",
  url: "https://github.com/test-user/test-repo",
  language: "TypeScript",
  starCount: 15,
  forkCount: 3,
  createdAt: "2022-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  pushedAt: "2024-01-02T00:00:00Z",
  isArchived: false,
  visibility: "public",
  defaultBranch: "main",
};

const mockProfile: DeveloperProfile = {
  username: "test-user",
  displayName: "Test User",
  avatarUrl: "https://avatars.githubusercontent.com/u/12345",
  profileUrl: "https://github.com/test-user",
  bio: "Test bio",
  location: "Test City",
  accountCreatedAt: "2021-01-01T00:00:00Z",
  followerCount: 42,
  followingCount: 10,
  publicRepositoryCount: 5,
  repositories: [mockRepo],
};

const mockAnalysis: AnalysisResult = {
  metrics: {
    repositoryCount: 5,
    totalStars: 15,
    totalForks: 3,
    activeRepositoryCount: 4,
    archivedRepositoryCount: 1,
    repositoriesWithPushes: 4,
    languageDistribution: { TypeScript: 80, JavaScript: 20 },
    primaryLanguage: "TypeScript",
    averageRepositoryObservedLifetimeDays: 365,
    followerCount: 42,
    followingCount: 10,
  },
  archetype: {
    id: "specialist",
    name: "Specialist",
    description: "Focused primarily on one stack.",
    reasons: ["TypeScript represents 80% of projects."],
  },
  strengths: [
    {
      id: "star-traction",
      title: "Star Traction",
      evidence: "15 total stars earned.",
    },
  ],
  improvementAreas: [
    {
      id: "archived-cleanup",
      title: "Archived Repositories",
      evidence: "1 archived repository retained.",
    },
  ],
};

test("RoastInput contains expected profile facts", () => {
  const input = buildRoastInput(mockProfile, mockAnalysis);

  assert.equal(input.username, "test-user");
  assert.equal(input.followers, 42);
  assert.equal(input.following, 10);
});

test("RoastInput contains expected analysis facts", () => {
  const input = buildRoastInput(mockProfile, mockAnalysis);

  assert.equal(input.repositoryCount, 5);
  assert.equal(input.totalStars, 15);
  assert.equal(input.totalForks, 3);
  assert.equal(input.activeRepositories, 4);
  assert.equal(input.archivedRepositories, 1);
  assert.deepEqual(input.languageDistribution, {
    TypeScript: 80,
    JavaScript: 20,
  });
  assert.equal(input.primaryLanguage, "TypeScript");
  assert.equal(input.archetype, "Specialist");
  assert.deepEqual(input.archetypeReasons, [
    "TypeScript represents 80% of projects.",
  ]);
  assert.deepEqual(input.strengths, ["Star Traction: 15 total stars earned."]);
  assert.deepEqual(input.improvementAreas, [
    "Archived Repositories: 1 archived repository retained.",
  ]);
});

test("Raw GitHub API objects are not passed through", () => {
  const input = buildRoastInput(mockProfile, mockAnalysis);

  assert.equal("repositories" in input, false);
  assert.equal("avatarUrl" in input, false);
  assert.equal("profileUrl" in input, false);
  assert.equal("bio" in input, false);
  assert.equal("location" in input, false);
  assert.equal("accountCreatedAt" in input, false);
  assert.equal("octokit" in input, false);
});

test("Valid Gemini JSON becomes RoastResult", async () => {
  const validPayload = {
    roast:
      "Five repositories and fifteen stars suggest a quiet dignity in the TypeScript trenches. One archived repository is kept like a forgotten museum exhibit.",
    highlights: ["TypeScript loyalist", "Museum curator of dead repos"],
  };

  const directResult = parseRoastResult(validPayload);
  assert.equal(directResult.roast, validPayload.roast);
  assert.deepEqual(directResult.highlights, validPayload.highlights);

  const mockClient = {
    models: {
      generateContent: async () => ({
        text: JSON.stringify(validPayload),
      }),
    },
  } as unknown as GoogleGenAI;

  const generatedResult = await generateRoast(
    mockProfile,
    mockAnalysis,
    mockClient,
  );
  assert.equal(generatedResult.roast, validPayload.roast);
  assert.deepEqual(generatedResult.highlights, validPayload.highlights);
});

test("Invalid Gemini output is rejected", async () => {
  assert.throws(
    () => parseRoastResult(null),
    (err) => err instanceof RoastError && err.code === "VALIDATION_ERROR",
  );
  assert.throws(
    () => parseRoastResult({}),
    (err) => err instanceof RoastError && err.code === "VALIDATION_ERROR",
  );
  assert.throws(
    () => parseRoastResult({ roast: "Valid roast but no highlights" }),
    (err) => err instanceof RoastError && err.code === "VALIDATION_ERROR",
  );
  assert.throws(
    () =>
      parseRoastResult({
        roast: "Valid roast",
        highlights: ["Only one highlight"],
      }),
    (err) => err instanceof RoastError && err.code === "VALIDATION_ERROR",
  );
  assert.throws(
    () =>
      parseRoastResult({
        roast: "Valid roast",
        highlights: ["1", "2", "3", "4", "5"],
      }),
    (err) => err instanceof RoastError && err.code === "VALIDATION_ERROR",
  );
  assert.throws(
    () =>
      parseRoastResult({
        roast: "   ",
        highlights: ["Valid 1", "Valid 2"],
      }),
    (err) => err instanceof RoastError && err.code === "VALIDATION_ERROR",
  );

  const invalidJsonClient = {
    models: {
      generateContent: async () => ({
        text: "Not a valid JSON",
      }),
    },
  } as unknown as GoogleGenAI;

  await assert.rejects(
    generateRoast(mockProfile, mockAnalysis, invalidJsonClient),
    (err) => err instanceof RoastError && err.code === "VALIDATION_ERROR",
  );
});

test("Missing API configuration fails safely", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    assert.throws(
      () => getGeminiClient(),
      (err) =>
        err instanceof RoastError &&
        err.code === "CONFIG_ERROR" &&
        err.message === "GEMINI_API_KEY is required.",
    );
  } finally {
    process.env.GEMINI_API_KEY = originalKey;
  }
});

test("Same profile + analysis produces the same RoastInput", () => {
  const input1 = buildRoastInput(mockProfile, mockAnalysis);
  const input2 = buildRoastInput(mockProfile, mockAnalysis);

  assert.deepEqual(input1, input2);
});

test("System instruction keeps follower and repository metric humor grounded", () => {
  assert.match(ROAST_SYSTEM_INSTRUCTION, /Followers and following are numerical observations only/);
  assert.match(
    ROAST_SYSTEM_INSTRUCTION,
    /follows people back, talks to people, has friends, is a hermit, is isolated, is popular, is influential, a celebrity, or prefers being alone/,
  );
  assert.match(
    ROAST_SYSTEM_INSTRUCTION,
    /audience, fans, attention, access, or notifications/,
  );
  assert.match(
    ROAST_SYSTEM_INSTRUCTION,
    /Repository and language metrics may be humorously interpreted/,
  );
  assert.match(
    ROAST_SYSTEM_INSTRUCTION,
    /intelligence, skill level, career, seniority, personality, work preferences, or employment/,
  );
});
