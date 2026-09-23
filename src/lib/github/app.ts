import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { App } from "octokit";
import { normalizePrivateKey } from "@/lib/github/private-key";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error("GitHub App configuration is incomplete.");
  }

  return value;
}

function getPrivateKey(): string {
  const environmentPrivateKey = process.env.GITHUB_PRIVATE_KEY;

  if (environmentPrivateKey?.trim()) {
    return normalizePrivateKey(environmentPrivateKey);
  }

  const privateKeyPath = getRequiredEnv("GITHUB_PRIVATE_KEY_PATH");

  try {
    return readFileSync(
      resolve(/*turbopackIgnore: true*/ process.cwd(), privateKeyPath),
      "utf8",
    ).trim();
  } catch {
    throw new Error("GitHub App configuration is incomplete.");
  }
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

  if (!Number.isInteger(appId) || appId <= 0) {
    throw new Error("GitHub App configuration is incomplete.");
  }

  if (!Number.isInteger(configuredInstallationId) || configuredInstallationId <= 0) {
    throw new Error("GitHub App configuration is incomplete.");
  }

  const privateKey = getPrivateKey();

  if (!privateKey.trim()) {
    throw new Error("GitHub App configuration is incomplete.");
  }

  installationId = configuredInstallationId;
  githubApp = new App({ appId, privateKey });

  return githubApp;
}

export async function getGitHubClient() {
  const app = getGitHubApp();

  return app.getInstallationOctokit(installationId!);
}
