"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BRANCHES, getBranchName } from "@/lib/constants/branches";

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState<"all" | "complete" | "incomplete">("all");

  useEffect(() => {
    let isMounted = true;
    fetch("/api/students?limit=200")
      .then(async (response) => {
        const result = await response.json();
        if (isMounted) {
          if (response.ok && result.data) {
            setStudents(result.data.items ?? result.data ?? []);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredStudents = students.filter((s) => {
    if (branchFilter !== "all" && s.branch !== branchFilter) return false;
    if (completionFilter === "complete" && !s.profile_complete) return false;
    if (completionFilter === "incomplete" && s.profile_complete) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = s.users?.full_name?.toLowerCase() ?? "";
      const email = s.users?.email?.toLowerCase() ?? "";
      const enroll = s.enrollment_no?.toLowerCase() ?? "";
      return name.includes(q) || email.includes(q) || enroll.includes(q);
    }
    return true;
  });

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
          <form action="/api/students/export">
            <button className="text-link export-button" type="submit">Export CSV</button>
          </form>
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

        {/* Filter Controls */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "20px", padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem", fontWeight: 500 }}>
            Search Student
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, Email, or Enrollment ID" style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #ced4da)" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem", fontWeight: 500 }}>
            Department
            <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #ced4da)" }}>
              <option value="all">All Departments</option>
              {BRANCHES.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.name} ({b.code.toUpperCase()})
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem", fontWeight: 500 }}>
            Profile Readiness
            <select value={completionFilter} onChange={(e) => setCompletionFilter(e.target.value as "all" | "complete" | "incomplete")} style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #ced4da)" }}>
              <option value="all">All Profiles</option>
              <option value="complete">Profile Complete</option>
              <option value="incomplete">Profile Incomplete</option>
            </select>
          </label>
        </div>
      </section>

      <section className="faculty-list" style={{ marginTop: "20px" }}>
        {loading ? (
          <div className="empty-state">
            <strong>Loading students directory...</strong>
          </div>
        ) : filteredStudents.length ? (
          filteredStudents.map((student) => (
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
                <strong style={{ color: student.profile_complete ? "#198754" : "#dc3545" }}>
                  {student.profile_complete ? "Profile Complete" : "Profile Incomplete"}
                </strong>
              </span>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>No matching students found.</strong>
          </div>
        )}
      </section>
    </main>
  );
}