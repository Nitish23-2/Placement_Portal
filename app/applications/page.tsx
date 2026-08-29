"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Application = { id: string; status: string; applied_at: string; drives: { title: string; companies: { name: string } | null } | null };

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [message, setMessage] = useState("Loading applications...");
  useEffect(() => { fetch("/api/applications").then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "Unable to load applications."); setApplications(result.data ?? []); setMessage(""); }).catch((error: Error) => setMessage(error.message)); }, []);
  return <main className="portal-page"><header className="portal-header"><Link className="brand" href="/dashboard"><span className="brand-mark">PP</span><span><strong>Placement Portal</strong><small>GBPUAT Pantnagar</small></span></Link><nav className="portal-nav"><Link href="/drives">Drives</Link><Link href="/profile">Profile</Link></nav></header><section className="listing-intro"><p className="eyebrow">Your applications</p><h1>Keep an eye on what happens next.</h1><p className="dashboard-copy">Every status update stays attached to the drive where you applied.</p></section><section className="application-list" aria-label="Your applications">{message ? <div className="empty-state"><strong>{message}</strong></div> : applications.length ? applications.map((application) => <article className="application-item" key={application.id}><div><span className="card-kicker">{application.drives?.companies?.name ?? "Company"}</span><h2>{application.drives?.title ?? "Placement drive"}</h2><p>Applied {new Date(application.applied_at).toLocaleDateString("en-IN")}</p></div><span className={`status-pill status-${application.status}`}>{application.status}</span></article>) : <div className="empty-state"><strong>No applications yet.</strong><span>Browse the published drives and apply when you find the right opportunity.</span></div>}</section></main>;
}