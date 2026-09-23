const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,98}[a-z\d])?$/i;

export function parseGitHubUsername(value: string | null): string | null {
  const username = value?.trim();

  if (!username || !GITHUB_USERNAME_PATTERN.test(username)) {
    return null;
  }

  return username;
}
