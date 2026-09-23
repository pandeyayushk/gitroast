"use client";

import { FormEvent, useMemo, useState } from "react";

type Evidence = { id: string; title: string; evidence: string };
type ProfileResponse = {
  success: true;
  profile: { username: string; displayName: string | null; avatarUrl: string; profileUrl: string; bio: string | null; location: string | null; followerCount: number; followingCount: number };
  analysis: {
    metrics: { repositoryCount: number; totalStars: number; totalForks: number; activeRepositoryCount: number; archivedRepositoryCount: number; languageDistribution: Record<string, number>; primaryLanguage: string | null };
    archetype: { name: string; description: string };
    strengths: Evidence[];
    improvementAreas: Evidence[];
  };
  roast: { roast: string; highlights: string[] };
};
type ApiError = { success: false; error?: string };

const loadingSteps = ["Scanning public profile", "Indexing repositories", "Calculating the evidence", "Preparing the verdict"];
const number = new Intl.NumberFormat("en-US");

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="metric"><strong>{number.format(value)}</strong><span>{label}</span></div>;
}

function EvidenceList({ title, items, empty }: { title: string; items: Evidence[]; empty: string }) {
  const headingId = `evidence-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  return <section className="evidence-section" aria-labelledby={headingId}>
    <p className="section-kicker" id={headingId}>{title}</p>
    {items.length ? <ol className="evidence-list">{items.map((item, index) => <li key={item.id}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.evidence}</p></div></li>)}</ol> : <p className="empty-evidence">{empty}</p>}
  </section>;
}

export default function GitRoastApp() {
  const [username, setUsername] = useState("");
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const languages = useMemo(() => {
    if (!data) return [];
    const entries = Object.entries(data.analysis.metrics.languageDistribution);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    return entries.sort(([, left], [, right]) => right - left).map(([language, count]) => ({ language, count, percent: total ? Math.round((count / total) * 100) : 0 }));
  }, [data]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = username.trim().replace(/^@/, "");
    if (!trimmed) { setError("Enter a GitHub username first. The evidence will not summon itself."); setData(null); return; }
    setIsLoading(true); setError(""); setData(null);
    try {
      const response = await fetch(`/api/github/profile?username=${encodeURIComponent(trimmed)}`);
      const result = (await response.json()) as ProfileResponse | ApiError;
      if (!response.ok || !result.success) throw new Error("error" in result && result.error ? result.error : "The profile could not be analyzed right now.");
      setData(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The profile could not be analyzed right now.");
    } finally { setIsLoading(false); }
  }

  return <main className="site-shell">
    <header className="masthead"><a className="wordmark" href="#top" aria-label="GitRoast home">GIT<span>ROAST</span><i aria-hidden="true">_</i></a><p>Developer profile forensics / no mercy</p></header>
    <section className={data ? "intake compact" : "intake"} id="top">
      <p className="eyebrow">GitHub profile inspection unit</p>
      <h1>{data ? "ANALYSIS COMPLETE." : <>YOUR GITHUB<br />HAS OPINIONS.</>}</h1>
      {!data && <p className="intro">We have some too. Enter a public GitHub username and let the evidence speak badly of it.</p>}
      <form className="username-form" onSubmit={submit} noValidate>
        <label htmlFor="github-username">GitHub username</label>
        <div className="input-row"><span aria-hidden="true">github.com/</span><input id="github-username" name="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="yourusername" autoComplete="username" autoCapitalize="none" spellCheck="false" disabled={isLoading} aria-describedby={error ? "form-error" : undefined} /><button type="submit" disabled={isLoading}>{isLoading ? "ANALYZING" : data ? "RUN AGAIN" : "ROAST ME"}</button></div>
        {error && <p className="form-error" id="form-error" role="alert">{error}</p>}
      </form>
    </section>
    {isLoading && <section className="loading-report" aria-live="polite" aria-label="Analyzing GitHub profile"><div className="scan-line" aria-hidden="true" /><p className="eyebrow">Analysis in progress</p><h2>READING THE RECEIPTS.</h2><ol>{loadingSteps.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span>{step}</li>)}</ol></section>}
    {data && <article className="report" aria-labelledby="report-title">
      <div className="report-topline"><p>Analysis / 001</p><a href={data.profile.profileUrl} target="_blank" rel="noreferrer">VIEW ON GITHUB ↗</a></div>
      <section className="identity-block">
        {/* The avatar URL is supplied by GitHub at runtime. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.profile.avatarUrl} alt="" width={96} height={96} />
        <div><p className="eyebrow">Subject: @{data.profile.username}</p><h2 id="report-title">{data.analysis.archetype.name.toUpperCase()}</h2><p>{data.analysis.archetype.description}</p>{(data.profile.bio || data.profile.location) && <p className="profile-detail">{[data.profile.bio, data.profile.location].filter(Boolean).join(" · ")}</p>}</div>
      </section>
      <section className="metrics" aria-label="GitHub profile metrics"><Metric value={data.analysis.metrics.repositoryCount} label="Public repos" /><Metric value={data.analysis.metrics.totalStars} label="Stars collected" /><Metric value={data.analysis.metrics.totalForks} label="Forks issued" /></section>
      <div className="report-columns"><section className="profile-facts" aria-labelledby="profile-facts-title"><p className="section-kicker" id="profile-facts-title">The record</p><dl><div><dt>Followers</dt><dd>{number.format(data.profile.followerCount)}</dd></div><div><dt>Following</dt><dd>{number.format(data.profile.followingCount)}</dd></div><div><dt>Primary language</dt><dd>{data.analysis.metrics.primaryLanguage ?? "Unclassified"}</dd></div><div><dt>Active / archived</dt><dd>{data.analysis.metrics.activeRepositoryCount} / {data.analysis.metrics.archivedRepositoryCount}</dd></div></dl></section>
      <section className="language-section" aria-labelledby="language-title"><p className="section-kicker" id="language-title">Language evidence</p>{languages.length ? <ul className="language-list">{languages.map(({ language, count, percent }) => <li key={language}><div><span>{language}</span><span>{count} repo{count === 1 ? "" : "s"}</span></div><i><b style={{ width: `${percent}%` }} /></i></li>)}</ul> : <p className="empty-evidence">GitHub declined to classify the languages. Very on-brand.</p>}</section></div>
      <div className="evidence-grid"><EvidenceList title="What survived inspection" items={data.analysis.strengths} empty="Nothing was formally flagged as a strength. A brave result." /><EvidenceList title="Where it gets wobbly" items={data.analysis.improvementAreas} empty="No immediate weak spots in the available public data." /></div>
      <section className="roast-section" aria-labelledby="roast-title"><div className="roast-heading"><p className="eyebrow">Final assessment</p><p>Evidence-based slander</p></div><h2 id="roast-title">THE ROAST</h2><blockquote>{data.roast.roast}</blockquote><ul className="highlights" aria-label="Roast evidence">{data.roast.highlights.map((highlight, index) => <li key={highlight}><span>EXHIBIT {String(index + 1).padStart(2, "0")}</span>{highlight}</li>)}</ul></section>
    </article>}
    {!data && !isLoading && <footer>Public data only. Private repos remain safely out of this mess.</footer>}
  </main>;
}
