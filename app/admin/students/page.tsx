"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBranchName } from "@/lib/constants/branches";

type Student = {
  id: string;
  enrollment_no: string;
  branch: string;
  batch_year: number;
  cgpa: number | null;
  active_backlogs: number;
  profile_complete: boolean;
  users?: { full_name: string | null; email: string } | null;
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [message, setMessage] = useState("Loading students...");

  useEffect(() => {
    fetch("/api/students?limit=50")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message ?? "Unable to load students.");
        setStudents(result.data?.items ?? []);
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
          <a className="text-link" href="/api/students/export">
            Export CSV
          </a>
          <Link className="text-link" href="/admin/dashboard">
            Admin dashboard
          </Link>
        </span>
      </header>
      <section className="listing-intro">
        <p className="eyebrow">Student directory</p>
        <h1>Every student record, in one view.</h1>
        <p className="dashboard-copy">
          Complete directory of registered students across all GBPUAT departments.
        </p>
      </section>
      <section className="faculty-list">
        {message ? (
          <div className="empty-state">
            <strong>{message}</strong>
          </div>
        ) : students.length ? (
          students.map((student) => (
            <article className="faculty-item" key={student.id}>
              <div>
                <span className="card-kicker">
                  {student.enrollment_no} · {getBranchName(student.branch)}
                </span>
                <h2>{student.users?.full_name ?? `Batch ${student.batch_year}`}</h2>
                {student.users?.email && (
                  <p style={{ margin: "2px 0 0", color: "var(--muted)", fontSize: "13px" }}>
                    {student.users.email}
                  </p>
                )}
              </div>
              <span>
                CGPA: {student.cgpa ?? "Pending"} · {student.active_backlogs} backlog(s) ·{" "}
                {student.profile_complete ? "Profile Complete" : "Profile Incomplete"}
              </span>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>No students found.</strong>
          </div>
        )}
      </section>
    </main>
  );
}