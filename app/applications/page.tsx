"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HistoryItem = {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  remarks: string | null;
};

type Application = {
  id: string;
  status: "applied" | "shortlisted" | "interview" | "selected" | "rejected";
  applied_at: string;
  drives: {
    id: string;
    title: string;
    location: string | null;
    companies: { name: string } | null;
  } | null;
  history?: HistoryItem[];
};

const STAGES = ["applied", "shortlisted", "interview", "selected"] as const;

function getStageIndex(status: string) {
  if (status === "rejected") return -1;
  return STAGES.indexOf(status as typeof STAGES[number]);
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyMap, setHistoryMap] = useState<Record<string, HistoryItem[]>>({});

  useEffect(() => {
    fetch("/api/applications")
      .then(async (res) => {
        const result = await res.json();
        if (!res.ok) throw new Error(result.error?.message ?? "Unable to load applications.");
        setApplications(result.data ?? []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  async function toggleTimeline(appId: string) {
    if (selectedAppId === appId) {
      setSelectedAppId(null);
      return;
    }

    setSelectedAppId(appId);
    if (!historyMap[appId]) {
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/applications/${appId}/history`);
        const result = await res.json();
        if (res.ok && result.data) {
          setHistoryMap((prev) => ({ ...prev, [appId]: result.data }));
        }
      } catch {
        // silent fallback
      } finally {
        setHistoryLoading(false);
      }
    }
  }

  return (
    <main className="portal-page">
      <header className="portal-header">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">PP</span>
          <span>
            <strong>Placement Portal</strong>
            <small>GBPUAT Pantnagar</small>
          </span>
        </Link>
        <nav className="portal-nav">
          <Link href="/drives">Drives</Link>
          <Link href="/notices">Notices</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      </header>

      <section className="listing-intro">
        <p className="eyebrow">Your applications</p>
        <h1>Keep track of what happens next.</h1>
        <p className="dashboard-copy">
          Review application status, stage progression, and timeline notes for every drive you have applied to.
        </p>
      </section>

      <section className="application-list" aria-label="Your submitted applications">
        {loading ? (
          <div className="empty-state">
            <strong>Loading your applications...</strong>
          </div>
        ) : error ? (
          <div className="empty-state" style={{ borderColor: "#f5c2c7" }}>
            <strong style={{ color: "#842029" }}>Error loading applications</strong>
            <span>{error}</span>
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <strong>No applications yet.</strong>
            <span>Browse the published placement drives and apply when you find the right opportunity.</span>
          </div>
        ) : (
          applications.map((app) => {
            const currentIdx = getStageIndex(app.status);
            const isRejected = app.status === "rejected";
            const appHistory = historyMap[app.id] ?? [];

            return (
              <article className="application-item" key={app.id} style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                  <div>
                    <span className="card-kicker">
                      {app.drives?.companies?.name ?? "Recruiter"}{" "}
                      {app.drives?.location ? `• ${app.drives.location}` : ""}
                    </span>
                    <h2 style={{ margin: "4px 0" }}>{app.drives?.title ?? "Placement drive"}</h2>
                    <p style={{ color: "var(--text-muted, #6c757d)", fontSize: "0.9rem", margin: 0 }}>
                      Applied on {new Date(app.applied_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className={`status-pill status-${app.status}`} style={{ textTransform: "capitalize", fontWeight: 600 }}>
                    {app.status}
                  </span>
                </div>

                {/* Status Stepper Progression */}
                <div className="status-stepper" style={{ display: "flex", alignItems: "center", width: "100%", margin: "8px 0", gap: "8px" }}>
                  {isRejected ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                      <div style={{ padding: "4px 12px", borderRadius: "16px", background: "#f8d7da", color: "#842029", fontSize: "0.85rem", fontWeight: 600 }}>
                        Application Outcome: Not Selected
                      </div>
                    </div>
                  ) : (
                    STAGES.map((stage, idx) => {
                      const isComplete = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={stage} style={{ display: "flex", alignItems: "center", flex: 1, gap: "8px" }}>
                          <div
                            style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              background: isCurrent ? "#0d6efd" : isComplete ? "#198754" : "#e9ecef",
                              color: isComplete ? "#ffffff" : "#6c757d",
                              flexShrink: 0,
                            }}
                          >
                            {isComplete && !isCurrent ? "✓" : idx + 1}
                          </div>
                          <span
                            style={{
                              fontSize: "0.85rem",
                              fontWeight: isCurrent ? 700 : isComplete ? 600 : 400,
                              color: isCurrent ? "#0d6efd" : isComplete ? "inherit" : "#6c757d",
                              textTransform: "capitalize",
                            }}
                          >
                            {stage}
                          </span>
                          {idx < STAGES.length - 1 && (
                            <div
                              style={{
                                flex: 1,
                                height: "2px",
                                background: idx < currentIdx ? "#198754" : "#e9ecef",
                              }}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Timeline toggle button */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => void toggleTimeline(app.id)}
                    style={{ fontSize: "0.85rem", cursor: "pointer", background: "none", border: "none", color: "#0d6efd" }}
                  >
                    {selectedAppId === app.id ? "Hide timeline ▲" : "View status timeline ▼"}
                  </button>
                </div>

                {/* Status history dropdown */}
                {selectedAppId === app.id && (
                  <div style={{ background: "var(--surface-color, #f8f9fa)", padding: "16px", borderRadius: "6px", border: "1px solid var(--border-color, #e9ecef)" }}>
                    <h4 style={{ margin: "0 0 12px 0", fontSize: "0.95rem" }}>Application Timeline</h4>
                    {historyLoading ? (
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted, #6c757d)" }}>Loading timeline...</p>
                    ) : appHistory.length === 0 ? (
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted, #6c757d)" }}>
                        No status transitions recorded yet. Initial status: Applied.
                      </p>
                    ) : (
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {appHistory.map((h) => (
                          <li key={h.id} style={{ display: "flex", flexDirection: "column", gap: "4px", paddingBottom: "10px", borderBottom: "1px solid var(--border-color, #dee2e6)", marginBottom: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: 600, fontSize: "0.85rem", textTransform: "capitalize" }}>
                                {h.old_status ? `${h.old_status} → ` : ""}{h.new_status}
                              </span>
                              <time style={{ fontSize: "0.75rem", color: "var(--text-muted, #6c757d)" }}>
                                {new Date(h.changed_at).toLocaleString("en-IN")}
                              </time>
                            </div>
                            {h.remarks && (
                              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-color, #333333)", fontStyle: "italic" }}>
                                Note: &ldquo;{h.remarks}&rdquo;
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}