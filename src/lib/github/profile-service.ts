import { fetchGitHubRepositories, fetchGitHubUser } from "@/lib/github/client";
import type { DeveloperProfile } from "@/lib/github/domain";
import { normalizeDeveloperProfile } from "@/lib/github/normalizer";

export async function getDeveloperProfile(
  username: string,
): Promise<DeveloperProfile> {
  const [user, repositories] = await Promise.all([
    fetchGitHubUser(username),
    fetchGitHubRepositories(username),
  ]);

  return normalizeDeveloperProfile(user, repositories);
}
