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
  active_backlogs?: number;
  profile_complete: boolean;
  users?: { full_name: string | null; email: string } | null;
};

export default function FacultyStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [message, setMessage] = useState("Loading department cohort...");

  useEffect(() => {
    fetch("/api/students")
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
        <p className="eyebrow">Department cohort</p>
        <h1>A clear view of your branch students.</h1>
        <p className="dashboard-copy">
          Track profile completion and academic profiles for students in your department scope.
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
                CGPA: {student.cgpa ?? "Pending"} · {student.profile_complete ? "Profile complete" : "Profile incomplete"}
              </span>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>No students registered in this department yet.</strong>
          </div>
        )}
      </section>
    </main>
  );
}