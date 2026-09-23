import { NextRequest, NextResponse } from "next/server";
import { GitHubUserNotFoundError } from "@/lib/github/client";
import { getDeveloperProfile } from "@/lib/github/profile-service";
import { parseGitHubUsername } from "@/lib/github/username";

function getSafeErrorStatus(error: unknown): number | "unknown" {
  return typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
    ? error.status
    : "unknown";
}

export async function GET(request: NextRequest) {
  const username = parseGitHubUsername(request.nextUrl.searchParams.get("username"));

  if (!username) {
    return NextResponse.json(
      { success: false, error: "A valid GitHub username is required." },
      { status: 400 },
    );
  }

  try {
    const profile = await getDeveloperProfile(username);

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    if (error instanceof GitHubUserNotFoundError) {
      return NextResponse.json(
        { success: false, error: "GitHub user not found." },
        { status: 404 },
      );
    }

    console.error("GitHub profile request failed.", {
      status: getSafeErrorStatus(error),
    });

    return NextResponse.json(
      { success: false, error: "Unable to fetch GitHub profile." },
      { status: 500 },
    );
  }
}
