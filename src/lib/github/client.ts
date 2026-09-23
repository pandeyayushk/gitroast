import { getGitHubClient } from "@/lib/github/app";
import type { GitHubRepository, GitHubUser } from "@/lib/github/normalizer";

const REPOSITORIES_PER_PAGE = 100;
const MAX_REPOSITORY_PAGES = 20;

export class GitHubUserNotFoundError extends Error {
  constructor() {
    super("GitHub user not found.");
    this.name = "GitHubUserNotFoundError";
  }
}

export class GitHubRepositoryLimitError extends Error {
  constructor() {
    super("GitHub repository pagination limit reached.");
    this.name = "GitHubRepositoryLimitError";
  }
}

function hasStatus(error: unknown, status: number): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === status
  );
}

export async function fetchGitHubUser(username: string): Promise<GitHubUser> {
  const octokit = await getGitHubClient();

  try {
    const { data } = await octokit.rest.users.getByUsername({ username });

    return data;
  } catch (error) {
    if (hasStatus(error, 404)) {
      throw new GitHubUserNotFoundError();
    }

    throw error;
  }
}

export async function fetchGitHubRepositories(
  username: string,
): Promise<GitHubRepository[]> {
  const octokit = await getGitHubClient();
  const repositories: GitHubRepository[] = [];

  try {
    for (let page = 1; page <= MAX_REPOSITORY_PAGES; page += 1) {
      const { data } = await octokit.rest.repos.listForUser({
        username,
        type: "owner",
        sort: "full_name",
        direction: "asc",
        per_page: REPOSITORIES_PER_PAGE,
        page,
      });

      repositories.push(...data);

      if (data.length < REPOSITORIES_PER_PAGE) {
        return repositories;
      }
    }
  } catch (error) {
    if (hasStatus(error, 404)) {
      throw new GitHubUserNotFoundError();
    }

    throw error;
  }

  throw new GitHubRepositoryLimitError();
}
