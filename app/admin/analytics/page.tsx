"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBranchName } from "@/lib/constants/branches";

type Summary = {
  total_students: number;
  total_placed: number;
  placement_percentage: number;
  average_ctc: number;
  highest_ctc: number;
  by_branch: { branch: string; branch_name?: string; total: number; placed: number; avg_ctc?: number }[];
};

export default function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState("Loading analytics...");

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
        <Link className="brand" href="/admin/dashboard">
          <span className="brand-mark">PP</span>
          <span>
            <strong>Placement Portal</strong>
            <small>GBPUAT Pantnagar</small>
          </span>
        </Link>
        <span className="admin-actions">
          <a className="text-link" href="/api/analytics/export">
            Export CSV
          </a>
          <Link className="text-link" href="/admin/dashboard">
            Admin dashboard
          </Link>
        </span>
      </header>
      <section className="listing-intro">
        <p className="eyebrow">Placement analytics</p>
        <h1>Turn the record into a useful picture.</h1>
        <p className="dashboard-copy">
          Institution-wide placement metrics, average compensation, and branch-wise breakdown for accreditation and NIRF reporting.
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
                <span>Total students</span>
                <strong>{summary.total_students}</strong>
              </div>
              <div>
                <span>Total placed</span>
                <strong>{summary.total_placed}</strong>
              </div>
              <div>
                <span>Overall placed %</span>
                <strong>{summary.placement_percentage}%</strong>
              </div>
              <div>
                <span>Average CTC (LPA)</span>
                <strong>{summary.average_ctc ? `${summary.average_ctc} LPA` : "-"}</strong>
              </div>
            </section>

            {summary.highest_ctc > 0 && (
              <div style={{ marginTop: "16px", padding: "16px 20px", background: "var(--cream)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span><strong>Highest compensation offered:</strong></span>
                <strong style={{ fontSize: "18px", color: "#3b5c1c" }}>{summary.highest_ctc} LPA</strong>
              </div>
            )}

            <section className="faculty-list" style={{ marginTop: "24px" }}>
              {summary.by_branch.map((branch) => (
                <article className="faculty-item" key={branch.branch}>
                  <div>
                    <span className="card-kicker">
                      {branch.branch_name ?? getBranchName(branch.branch)}
                    </span>
                    <h2>{branch.placed} placed out of {branch.total} students</h2>
                  </div>
                  <span>
                    {branch.total > 0 ? Math.round((branch.placed / branch.total) * 100) : 0}% placed
                    {branch.avg_ctc ? ` · Avg ${branch.avg_ctc} LPA` : ""}
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