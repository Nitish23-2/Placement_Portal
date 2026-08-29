"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBranchName } from "@/lib/constants/branches";

type Applicant = {
  id: string;
  status: string;
  applied_at: string;
  students: {
    enrollment_no: string;
    branch: string;
    cgpa: number | null;
    active_backlogs?: number;
    resume_url?: string | null;
    users: { full_name: string | null; email: string } | null;
  } | null;
};

const statuses = ["applied", "shortlisted", "interview", "selected", "rejected"];

export default function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const [driveId, setDriveId] = useState("");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [message, setMessage] = useState("Loading applicants...");

  useEffect(() => {
    params
      .then(({ id }) => {
        setDriveId(id);
        return fetch(`/api/drives/${id}/applicants`);
      })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message ?? "Unable to load applicants.");
        setApplicants(result.data ?? []);
        setMessage("");
      })
      .catch((error: Error) => setMessage(error.message));
  }, [params]);

  async function updateStatus(id: string, status: string) {
    const response = await fetch(`/api/applications/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error?.message ?? "Unable to update status.");
      return;
    }
    setApplicants((current) =>
      current.map((applicant) => (applicant.id === id ? { ...applicant, status } : applicant))
    );
  }

  return (
    <main className="portal-page">
      <header className="portal-header">
        <Link className="brand" href="/admin/drives">
          <span className="brand-mark">PP</span>
          <span>
            <strong>Placement Portal</strong>
            <small>GBPUAT Pantnagar</small>
          </span>
        </Link>
        <span className="admin-actions">
          <a className="text-link" href={`/api/drives/${driveId}/applicants/export`}>
            Export CSV
          </a>
          <Link className="text-link" href="/admin/dashboard">
            Admin dashboard
          </Link>
        </span>
      </header>
      <section className="listing-intro">
        <p className="eyebrow">Applicant management</p>
        <h1>Move each application forward.</h1>
        <p className="dashboard-copy">
          Update candidate statuses as interview stages progress. Students are automatically notified of status changes.
        </p>
      </section>
      <section className="applicant-list" aria-label="Applicants">
        {message ? (
          <div className="empty-state">
            <strong>{message}</strong>
          </div>
        ) : applicants.length ? (
          applicants.map((applicant) => (
            <article className="applicant-item" key={applicant.id}>
              <div>
                <span className="card-kicker">
                  {applicant.students?.enrollment_no ?? "Student"} · {getBranchName(applicant.students?.branch)}
                </span>
                <h2>{applicant.students?.users?.full_name ?? "Unnamed student"}</h2>
                <p>
                  {applicant.students?.users?.email ?? ""} · Applied {new Date(applicant.applied_at).toLocaleDateString("en-IN")}
                </p>
                <small style={{ color: "var(--muted)", display: "block", marginTop: "4px" }}>
                  CGPA: {applicant.students?.cgpa ?? "Pending"} · Backlogs: {applicant.students?.active_backlogs ?? 0}
                  {applicant.students?.resume_url ? " · Resume on file" : " · No resume uploaded"}
                </small>
              </div>
              <select
                value={applicant.status}
                onChange={(event) => updateStatus(applicant.id, event.target.value)}
                aria-label={`Status for ${applicant.students?.users?.full_name ?? "applicant"}`}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.toUpperCase()}
                  </option>
                ))}
              </select>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>No applicants yet.</strong>
            <span>Applications will appear here as students apply to this drive.</span>
          </div>
        )}
      </section>
      <span hidden>{driveId}</span>
    </main>
  );
}