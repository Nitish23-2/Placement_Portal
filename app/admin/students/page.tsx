"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Student = { id: string; enrollment_no: string; branch: string; batch_year: number; cgpa: number | null; active_backlogs: number; profile_complete: boolean };

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [message, setMessage] = useState("Loading students...");
  useEffect(() => { fetch("/api/students?limit=50").then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "Unable to load students."); setStudents(result.data?.items ?? []); setMessage(""); }).catch((error: Error) => setMessage(error.message)); }, []);
  return <main className="portal-page"><header className="portal-header"><Link className="brand" href="/admin/dashboard"><span className="brand-mark">PP</span><span><strong>Placement Portal</strong><small>GBPUAT Pantnagar</small></span></Link><span className="admin-actions"><a className="text-link" href="/api/students/export">Export CSV</a><Link className="text-link" href="/admin/dashboard">Admin dashboard</Link></span></header><section className="listing-intro"><p className="eyebrow">Student directory</p><h1>Every student record, easy to find.</h1><p className="dashboard-copy">Search and export tools will expand here; the first directory view keeps the complete placement record accessible to admins.</p></section><section className="faculty-list">{message ? <div className="empty-state"><strong>{message}</strong></div> : students.length ? students.map((student) => <article className="faculty-item" key={student.id}><div><span className="card-kicker">{student.enrollment_no} / {student.branch}</span><h2>Batch {student.batch_year}</h2></div><span>{student.cgpa ?? "CGPA pending"} · {student.active_backlogs} backlog(s) · {student.profile_complete ? "Complete" : "Incomplete"}</span></article>) : <div className="empty-state"><strong>No students found.</strong></div>}</section></main>;
}