export type AnalysisEvidence = { id: string; title: string; evidence: string };
export type AnalysisMetrics = { repositoryCount: number; totalStars: number; totalForks: number; activeRepositoryCount: number; archivedRepositoryCount: number; repositoriesWithPushes: number; languageDistribution: Record<string, number>; primaryLanguage: string | null; averageRepositoryObservedLifetimeDays: number | null; followerCount: number; followingCount: number };
export type Archetype = { id: "builder" | "specialist" | "polyglot" | "maintainer" | "explorer"; name: string; description: string; reasons: string[] };
export type AnalysisResult = { metrics: AnalysisMetrics; archetype: Archetype; strengths: AnalysisEvidence[]; improvementAreas: AnalysisEvidence[] };
