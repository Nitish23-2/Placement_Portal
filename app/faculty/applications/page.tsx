"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBranchName } from "@/lib/constants/branches";

type Application = {
  id: string;
  status: string;
  applied_at: string;
  students: { enrollment_no: string; branch: string; cgpa?: number | null } | null;
  drives: { title: string; companies: { name: string } | null } | null;
};

export default function FacultyApplicationsPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [message, setMessage] = useState("Loading department applications...");

  useEffect(() => {
    fetch("/api/faculty/applications")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message ?? "Unable to load applications.");
        setItems(result.data ?? []);
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
        <p className="eyebrow">Department applications</p>
        <h1>Track where your students are in the process.</h1>
        <p className="dashboard-copy">
          Monitor application progression and placement outcomes for your department cohort.
        </p>
      </section>
      <section className="faculty-list">
        {message ? (
          <div className="empty-state">
            <strong>{message}</strong>
          </div>
        ) : items.length ? (
          items.map((item) => (
            <article className="faculty-item" key={item.id}>
              <div>
                <span className="card-kicker">
                  {item.students?.enrollment_no} · {getBranchName(item.students?.branch)} ·{" "}
                  {item.drives?.companies?.name ?? "Company"}
                </span>
                <h2>{item.drives?.title ?? "Drive"}</h2>
                <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                  Applied {new Date(item.applied_at).toLocaleDateString("en-IN")}
                  {item.students?.cgpa ? ` · CGPA ${item.students.cgpa}` : ""}
                </small>
              </div>
              <span className={`status-pill status-${item.status}`}>{item.status.toUpperCase()}</span>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>No applications found from this department yet.</strong>
          </div>
        )}
      </section>
    </main>
  );
}