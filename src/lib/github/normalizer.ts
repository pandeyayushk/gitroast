import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import type { DeveloperProfile, DeveloperRepository } from "@/lib/github/domain";

export type GitHubUser =
  RestEndpointMethodTypes["users"]["getByUsername"]["response"]["data"];
export type GitHubRepository =
  RestEndpointMethodTypes["repos"]["listForUser"]["response"]["data"][number];

function normalizeVisibility(
  visibility: string | undefined,
): DeveloperRepository["visibility"] {
  if (visibility === "public" || visibility === "private" || visibility === "internal") {
    return visibility;
  }

  return null;
}

export function normalizeRepository(
  repository: GitHubRepository,
): DeveloperRepository {
  return {
    id: repository.id,
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description ?? null,
    url: repository.html_url,
    language: repository.language ?? null,
    starCount: repository.stargazers_count ?? 0,
    forkCount: repository.forks_count ?? 0,
    createdAt: repository.created_at ?? null,
    updatedAt: repository.updated_at ?? null,
    pushedAt: repository.pushed_at ?? null,
    isArchived: repository.archived ?? false,
    visibility: normalizeVisibility(repository.visibility),
    defaultBranch: repository.default_branch ?? null,
  };
}

export function normalizeDeveloperProfile(
  user: GitHubUser,
  repositories: GitHubRepository[],
): DeveloperProfile {
  return {
    username: user.login,
    displayName: user.name,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    bio: user.bio,
    location: user.location,
    accountCreatedAt: user.created_at,
    followerCount: user.followers,
    followingCount: user.following,
    publicRepositoryCount: user.public_repos,
    repositories: repositories.map(normalizeRepository),
  };
}
