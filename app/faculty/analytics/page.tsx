"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Summary = {
  total_students: number;
  total_placed: number;
  placement_percentage: number;
  average_ctc: number;
  highest_ctc: number;
  by_branch: { branch: string; branch_name?: string; total: number; placed: number; avg_ctc?: number }[];
};

export default function FacultyAnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("Loading branch analytics...");

  useEffect(() => {
    fetch("/api/analytics/summary")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message ?? "Unable to load analytics.");
        setSummary(result.data);
        setMessage("");
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  return (
    <main className="portal-page">
      <header className="portal-header">
        <Link className="brand" href="/faculty/dashboard">
          <span className="brand-mark">PP</span>
          <span>
            <strong>Placement Portal</strong>
            <small>GBPUAT Pantnagar</small>
          </span>
        </Link>
        <Link className="text-link" href="/faculty/dashboard">
          Faculty dashboard
        </Link>
      </header>
      <section className="listing-intro">
        <p className="eyebrow">Department analytics</p>
        <h1>Measure progress without losing the people.</h1>
        <p className="dashboard-copy">
          Overview of placement rates and outcomes for your department cohort.
        </p>
      </section>

      {message ? (
        <div className="empty-state">
          <strong>{message}</strong>
        </div>
      ) : (
        summary && (
          <>
            <section className="metric-grid">
              <div>
                <span>Cohort students</span>
                <strong>{summary.total_students}</strong>
              </div>
              <div>
                <span>Students placed</span>
                <strong>{summary.total_placed}</strong>
              </div>
              <div>
                <span>Placement rate</span>
                <strong>{summary.placement_percentage}%</strong>
              </div>
              <div>
                <span>Avg CTC (LPA)</span>
                <strong>{summary.average_ctc ? `${summary.average_ctc} LPA` : "-"}</strong>
              </div>
            </section>

            <section className="faculty-list" style={{ marginTop: "24px" }}>
              {summary.by_branch.map((b) => (
                <article className="faculty-item" key={b.branch}>
                  <div>
                    <span className="card-kicker">{b.branch_name ?? b.branch.toUpperCase()}</span>
                    <h2>{b.placed} placed out of {b.total} registered</h2>
                  </div>
                  <span>
                    {b.total > 0 ? Math.round((b.placed / b.total) * 100) : 0}% success rate
                    {b.avg_ctc ? ` · Avg ${b.avg_ctc} LPA` : ""}
                  </span>
                </article>
              ))}
            </section>
          </>
        )
      )}
    </main>
  );
}