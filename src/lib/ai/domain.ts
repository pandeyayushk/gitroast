export type RoastResult = {
  roast: string;
  highlights: string[];
};

export type RoastInput = {
  username: string;
  repositoryCount: number;
  totalStars: number;
  totalForks: number;
  activeRepositories: number;
  archivedRepositories: number;
  languageDistribution: Record<string, number>;
  primaryLanguage: string | null;
  followers: number;
  following: number;
  archetype: string;
  archetypeReasons: string[];
  strengths: string[];
  improvementAreas: string[];
};

export type RoastErrorCode =
  | "CONFIG_ERROR"
  | "PROVIDER_ERROR"
  | "VALIDATION_ERROR";

export class RoastError extends Error {
  constructor(
    message: string,
    public readonly code: RoastErrorCode,
  ) {
    super(message);
    this.name = "RoastError";
  }
}
