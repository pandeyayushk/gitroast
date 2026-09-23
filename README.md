# GitRoast

> Your GitHub profile. Brutally analyzed.

GitRoast analyzes a public GitHub profile and turns its activity, repositories, languages, stars, forks, and social metrics into a deterministic developer profile and an AI-generated roast.

**Live:** https://gitroast-omega.vercel.app/

---

## What is GitRoast?

GitRoast takes a GitHub username and produces a compact developer analysis.

It combines:

- GitHub profile data
- Repository statistics
- Language distribution
- Repository activity
- Stars and forks
- Followers and following
- Deterministic developer analysis
- AI-generated roast

The goal isn't to build another GitHub dashboard.

It's to answer a much more important question:

> **What does your GitHub profile say about you?**

And then make fun of it.

---

## Features

### GitHub Profile Analysis

GitRoast fetches public GitHub profile and repository information and normalizes it into a consistent internal developer profile.

### Developer Metrics

The analysis includes metrics such as:

- Public repositories
- Total stars
- Total forks
- Active repositories
- Archived repositories
- Followers
- Following
- Primary language
- Language distribution
- Repository activity

### Developer Archetypes

GitRoast deterministically assigns an archetype based on observable repository and profile metrics.

Current archetypes include:

- **Polyglot**
- **Maintainer**
- **Specialist**
- **Builder**
- **Explorer**

The classification is based on measurable GitHub activity rather than an AI guess.

### Strengths & Areas for Improvement

The analysis engine produces factual, metric-backed observations about the profile.

### AI Roast

The AI receives the calculated analysis rather than raw GitHub API responses.

This keeps the roast grounded in actual profile metrics and reduces unsupported claims.

### Shareable Results

Users can:

- Copy the roast
- Share the result using the browser's native sharing functionality
- Fall back to copying the share text when native sharing isn't available

---

## How It Works

```text
GitHub Username
       │
       ▼
GitHub App Authentication
       │
       ▼
GitHub Data Pipeline
       │
       ▼
DeveloperProfile
       │
       ▼
Deterministic Analysis
       │
       ├── Metrics
       ├── Archetype
       ├── Strengths
       └── Improvements
       │
       ▼
AI Roast
       │
       ▼
GitRoast Report