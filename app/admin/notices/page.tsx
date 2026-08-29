"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function AdminNoticesPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setMessage(""); try { const response = await fetch("/api/notices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, body }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "Unable to create notice."); setTitle(""); setBody(""); setMessage("Notice published to every student."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create notice."); } finally { setPending(false); } }
  return <main className="portal-page"><header className="portal-header"><Link className="brand" href="/admin/dashboard"><span className="brand-mark">PP</span><span><strong>Placement Portal</strong><small>GBPUAT Pantnagar</small></span></Link><Link className="text-link" href="/admin/dashboard">Admin dashboard</Link></header><section className="admin-content"><p className="eyebrow">Notice board</p><h1>Put the right information in reach.</h1><p className="dashboard-copy">Standalone notices are visible to every student and retained in the shared board.</p><form className="admin-form" onSubmit={submit}><label>Title<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Placement cell update" /></label><label>Message<textarea required value={body} onChange={(event) => setBody(event.target.value)} rows={7} placeholder="Write the notice" /></label><button className="button button-accent" disabled={pending} type="submit">{pending ? "Publishing..." : "Publish notice"} <span aria-hidden="true">-&gt;</span></button>{message && <p className="form-message" role="status">{message}</p>}</form></section></main>;
}