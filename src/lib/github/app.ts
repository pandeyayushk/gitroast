import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { App } from "octokit";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

let githubApp: App | undefined;
let installationId: number | undefined;

function getGitHubApp(): App {
  if (githubApp) {
    return githubApp;
  }

  const appId = Number(getRequiredEnv("GITHUB_APP_ID"));
  const configuredInstallationId = Number(
    getRequiredEnv("GITHUB_INSTALLATION_ID"),
  );
  const privateKeyPath = getRequiredEnv("GITHUB_PRIVATE_KEY_PATH");

  if (!Number.isInteger(appId) || appId <= 0) {
    throw new Error("GITHUB_APP_ID must be a positive integer.");
  }

  if (!Number.isInteger(configuredInstallationId) || configuredInstallationId <= 0) {
    throw new Error("GITHUB_INSTALLATION_ID must be a positive integer.");
  }

  let privateKey: string;

  try {
    privateKey = readFileSync(
      resolve(/*turbopackIgnore: true*/ process.cwd(), privateKeyPath),
      "utf8",
    );
  } catch {
    throw new Error("Unable to read the configured GitHub App private key.");
  }

  if (!privateKey.trim()) {
    throw new Error("The configured GitHub App private key is empty.");
  }

  installationId = configuredInstallationId;
  githubApp = new App({ appId, privateKey });

  return githubApp;
}

export async function getGitHubClient() {
  const app = getGitHubApp();

  return app.getInstallationOctokit(installationId!);
}
