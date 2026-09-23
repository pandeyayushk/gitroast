import { NextResponse } from "next/server";
import { getGitHubClient } from "@/lib/github/app";

export async function GET() {
  try {
    const octokit = await getGitHubClient();
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 1,
    });

    return NextResponse.json({
      success: true,
      installation: {
        repositoryCount: data.total_count,
      },
    });
  } catch (error) {
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : "unknown";

    console.error("GitHub authentication test failed.", { status });

    return NextResponse.json(
      {
        success: false,
        error: "GitHub authentication failed.",
      },
      { status: 500 },
    );
  }
}
