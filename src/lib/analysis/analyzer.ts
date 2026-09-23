import type { DeveloperProfile } from "@/lib/github/domain";
import type { AnalysisEvidence, AnalysisMetrics, AnalysisResult, Archetype } from "@/lib/analysis/domain";

export function calculateMetrics(profile: DeveloperProfile): AnalysisMetrics {
  const languages: Record<string, number> = {};
  let totalStars = 0; let totalForks = 0; let archived = 0; let pushed = 0; let ageTotal = 0; let ageCount = 0;
  for (const repository of profile.repositories) {
    totalStars += repository.starCount; totalForks += repository.forkCount;
    if (repository.isArchived) archived += 1;
    if (repository.pushedAt) pushed += 1;
    if (repository.language) languages[repository.language] = (languages[repository.language] ?? 0) + 1;
    if (repository.createdAt && repository.updatedAt) { const age = new Date(repository.updatedAt).getTime() - new Date(repository.createdAt).getTime(); if (Number.isFinite(age) && age >= 0) { ageTotal += age / 86_400_000; ageCount += 1; } }
  }
  const primaryLanguage = Object.entries(languages).sort(([a, ac], [b, bc]) => bc - ac || a.localeCompare(b))[0]?.[0] ?? null;
  return { repositoryCount: profile.repositories.length, totalStars, totalForks, activeRepositoryCount: profile.repositories.length - archived, archivedRepositoryCount: archived, repositoriesWithPushes: pushed, languageDistribution: languages, primaryLanguage, averageRepositoryObservedLifetimeDays: ageCount ? Math.round(ageTotal / ageCount) : null, followerCount: profile.followerCount, followingCount: profile.followingCount };
}

function classify(metrics: AnalysisMetrics): Archetype {
  const languageCount = Object.keys(metrics.languageDistribution).length;
  if (languageCount >= 4) return { id: "polyglot", name: "The Polyglot", description: "Repository languages are broadly distributed.", reasons: [`Repositories use ${languageCount} languages.`] };
  if (metrics.repositoryCount >= 10 && metrics.repositoriesWithPushes >= 8) return { id: "maintainer", name: "The Maintainer", description: "A substantial repository set has observable push activity.", reasons: [`${metrics.repositoriesWithPushes} repositories have a recorded push date.`] };
  if (metrics.repositoryCount <= 3 && metrics.totalStars + metrics.totalForks >= 20) return { id: "specialist", name: "The Specialist", description: "A small repository set has measurable public engagement.", reasons: [`Repositories have ${metrics.totalStars + metrics.totalForks} combined stars and forks.`] };
  if (metrics.repositoryCount >= 6) return { id: "builder", name: "The Builder", description: "The profile contains a sustained set of repositories.", reasons: [`The profile contains ${metrics.repositoryCount} repositories.`] };
  return { id: "explorer", name: "The Explorer", description: "The profile currently has a smaller repository sample.", reasons: [`The profile contains ${metrics.repositoryCount} repositories.`] };
}

function findings(metrics: AnalysisMetrics): Pick<AnalysisResult, "strengths" | "improvementAreas"> {
  const strengths: AnalysisEvidence[] = []; const improvementAreas: AnalysisEvidence[] = []; const languages = Object.keys(metrics.languageDistribution).length;
  if (languages >= 3) strengths.push({ id: "language-breadth", title: "Language breadth", evidence: `Repositories use ${languages} languages.` });
  if (metrics.totalStars + metrics.totalForks >= 20) strengths.push({ id: "public-engagement", title: "Public engagement", evidence: `Repositories have ${metrics.totalStars} stars and ${metrics.totalForks} forks.` });
  if (metrics.repositoryCount > 0 && metrics.archivedRepositoryCount * 2 >= metrics.repositoryCount) improvementAreas.push({ id: "archived-share", title: "Archived project share", evidence: `${metrics.archivedRepositoryCount} of ${metrics.repositoryCount} repositories are archived.` });
  if (metrics.repositoryCount >= 4 && metrics.totalStars + metrics.totalForks === 0) improvementAreas.push({ id: "low-public-engagement", title: "Limited public engagement", evidence: `${metrics.repositoryCount} repositories have no recorded stars or forks.` });
  return { strengths, improvementAreas };
}

export function analyzeDeveloperProfile(profile: DeveloperProfile): AnalysisResult { const metrics = calculateMetrics(profile); return { metrics, archetype: classify(metrics), ...findings(metrics) }; }
