"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Company = { id: string; name: string };

export default function AdminDrivesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [message, setMessage] = useState("Loading companies...");
  const [pending, setPending] = useState(false);
  useEffect(() => { fetch("/api/companies").then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "Unable to load companies."); setCompanies(result.data ?? []); setCompanyId(result.data?.[0]?.id ?? ""); setMessage(""); }).catch((error: Error) => setMessage(error.message)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setMessage(""); try { const response = await fetch("/api/drives", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: companyId, title, description, eligibility_criteria: eligibility }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "Unable to create drive."); setTitle(""); setDescription(""); setEligibility(""); setMessage("Draft drive created. It is not visible to students until published."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create drive."); } finally { setPending(false); } }
  return <main className="portal-page"><header className="portal-header"><Link className="brand" href="/admin/dashboard"><span className="brand-mark">PP</span><span><strong>Placement Portal</strong><small>GBPUAT Pantnagar</small></span></Link><Link className="text-link" href="/admin/dashboard">Admin dashboard</Link></header><section className="admin-content"><p className="eyebrow">Drive builder</p><h1>Shape the next opportunity.</h1><form className="admin-form" onSubmit={submit}><label>Company<select required value={companyId} onChange={(event) => setCompanyId(event.target.value)}><option value="">Select a company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><label>Role title<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Jr. Software Developer" /></label><label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Role details and process" /></label><label>Eligibility information<textarea value={eligibility} onChange={(event) => setEligibility(event.target.value)} rows={3} placeholder="Shown for student self-assessment only" /></label><button className="button button-accent" disabled={pending || !companyId} type="submit">{pending ? "Creating..." : "Create draft drive"} <span aria-hidden="true">-&gt;</span></button>{message && <p className="form-message" role="status">{message}</p>}</form></section></main>;
}