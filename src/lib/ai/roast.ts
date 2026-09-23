import { GoogleGenAI } from "@google/genai";
import { getGeminiClient, getGeminiModel } from "@/lib/ai/client";
import {
  RoastError,
  type RoastInput,
  type RoastResult,
} from "@/lib/ai/domain";
import type { AnalysisResult } from "@/lib/analysis/domain";
import type { DeveloperProfile } from "@/lib/github/domain";

export const ROAST_SYSTEM_INSTRUCTION = `You are GitRoast. Product identity: "Your GitHub profile. Brutally analyzed."

Your task is to write a funny, sharp, concise, developer-focused, playful, slightly brutal, and shareable roast of a developer based strictly on the supplied profile facts.

Critical rules:
1. Ground every claim strictly in the supplied facts. NEVER invent or hallucinate facts, numbers, or repositories.
2. You may make humorous interpretations of the supplied facts, but never make unsupported factual assertions.
3. NEVER make claims about:
   - intelligence, age, gender, mental health, salary, employment, or seniority
   - private GitHub activity or private repositories
   - personality traits as objective facts
   - contribution history or commit streaks (do not pretend repository push timestamps are contribution history)
4. Followers and following are numerical observations only. You may use their counts or ratio for a funny numerical metaphor, but NEVER treat them as evidence of social behavior, personality, popularity, relationships, communication habits, isolation, or social preferences. This prohibition controls both the roast and highlights: do not say or imply that the person follows people back, talks to people, has friends, is a hermit, is isolated, is popular, is influential, a celebrity, or prefers being alone. Do not say or imply that other people watch, copy, enter, or interact with the person because of these counts. Do not call the profile high-traffic or describe an audience, fans, attention, access, or notifications. Keep follower/following jokes grammatical observations about the numbers or ratio, not about what any person does. Allowed patterns: "24,208 followers and 9 following: a 2,690-to-1 numerical imbalance." and "24,208 followers and 9 following. Your GitHub inbox has apparently become a one-way street." Do not mention any other effect the counts have on the person or other people.
5. Repository and language metrics may be humorously interpreted, but NEVER use them to establish intelligence, skill level, career, seniority, personality, work preferences, or employment. Do not describe the person as a developer of any kind (for example, backend, senior, skilled, or employed) based on those metrics, and do not say forks show that people copy, improve on, or judge their work. Do not say the person manages, builds, relies on, chooses, or prefers anything based on a metric. For example, "CSS is the primary language across the repositories GitHub classified, which is a bold choice for someone sitting on 22,201 stars." is allowed; "You're not a real backend developer." is not.
6. Length constraints:
   - "roast": exactly 2 to 5 sentences. Suitable for a shareable card.
   - "highlights": exactly 2 to 4 punchy, short items.
7. Before returning, silently remove any phrase that turns a metric into a claim about a person or their social life, capability, career, or preferences. Keep the punchline on the observable number, repository, or GitHub classification.
8. Return JSON adhering to the specified schema:
   {
     "roast": "string",
     "highlights": ["string", "string"]
   }`;

export function buildRoastInput(
  profile: DeveloperProfile,
  analysis: AnalysisResult,
): RoastInput {
  return {
    username: profile.username,
    repositoryCount: analysis.metrics.repositoryCount,
    totalStars: analysis.metrics.totalStars,
    totalForks: analysis.metrics.totalForks,
    activeRepositories: analysis.metrics.activeRepositoryCount,
    archivedRepositories: analysis.metrics.archivedRepositoryCount,
    languageDistribution: { ...analysis.metrics.languageDistribution },
    primaryLanguage: analysis.metrics.primaryLanguage,
    followers: analysis.metrics.followerCount,
    following: analysis.metrics.followingCount,
    archetype: analysis.archetype.name,
    archetypeReasons: [...analysis.archetype.reasons],
    strengths: analysis.strengths.map((item) =>
      item.title ? `${item.title}: ${item.evidence}` : item.evidence,
    ),
    improvementAreas: analysis.improvementAreas.map((item) =>
      item.title ? `${item.title}: ${item.evidence}` : item.evidence,
    ),
  };
}

export function parseRoastResult(value: unknown): RoastResult {
  if (
    typeof value !== "object" ||
    value === null ||
    !("roast" in value) ||
    !("highlights" in value)
  ) {
    throw new RoastError(
      "Invalid Gemini roast response: expected object with roast and highlights.",
      "VALIDATION_ERROR",
    );
  }

  const { roast, highlights } = value as {
    roast: unknown;
    highlights: unknown;
  };

  if (typeof roast !== "string" || roast.trim().length === 0) {
    throw new RoastError(
      "Invalid Gemini roast response: roast must be a non-empty string.",
      "VALIDATION_ERROR",
    );
  }

  if (!Array.isArray(highlights)) {
    throw new RoastError(
      "Invalid Gemini roast response: highlights must be an array.",
      "VALIDATION_ERROR",
    );
  }

  const cleanedHighlights = highlights
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  if (
    cleanedHighlights.length < 2 ||
    cleanedHighlights.length > 4 ||
    cleanedHighlights.length !== highlights.length
  ) {
    throw new RoastError(
      "Invalid Gemini roast response: highlights must contain between 2 and 4 non-empty strings.",
      "VALIDATION_ERROR",
    );
  }

  return {
    roast: roast.trim(),
    highlights: cleanedHighlights,
  };
}

export async function generateRoast(
  profile: DeveloperProfile,
  analysis: AnalysisResult,
  client?: GoogleGenAI,
): Promise<RoastResult> {
  const ai = client ?? getGeminiClient();
  const input = buildRoastInput(profile, analysis);
  const model = getGeminiModel();

  const generateConfig = {
    systemInstruction: ROAST_SYSTEM_INSTRUCTION,
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        roast: {
          type: "string",
          description:
            "A 2 to 5 sentence developer roast grounded strictly in the provided facts.",
        },
        highlights: {
          type: "array",
          items: { type: "string" },
          description: "2 to 4 punchy, short roast highlights.",
        },
      },
      required: ["roast", "highlights"],
    },
  };

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: JSON.stringify(input),
      config: generateConfig,
    });
  } catch (error) {
    if (error instanceof RoastError) {
      throw error;
    }

    const safeMessage = error instanceof Error ? error.message : String(error);
    console.error("Gemini provider error:", safeMessage);

    throw new RoastError(
      "AI provider error during roast generation.",
      "PROVIDER_ERROR",
    );
  }

  if (!response?.text) {
    throw new RoastError(
      "Gemini returned an empty response.",
      "VALIDATION_ERROR",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text);
  } catch {
    throw new RoastError(
      "Failed to parse Gemini response as JSON.",
      "VALIDATION_ERROR",
    );
  }

  return parseRoastResult(parsed);
}
