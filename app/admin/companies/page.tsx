"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Company = { id: string; name: string; sector: string | null };

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [message, setMessage] = useState("Loading companies...");
  const [pending, setPending] = useState(false);
  useEffect(() => { fetch("/api/companies").then(async (response) => { const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "Unable to load companies."); setCompanies(result.data ?? []); setMessage(""); }).catch((error: Error) => setMessage(error.message)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPending(true); setMessage(""); try { const response = await fetch("/api/companies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, sector }) }); const result = await response.json(); if (!response.ok) throw new Error(result.error?.message ?? "Unable to create company."); setCompanies((current) => [...current, result.data]); setName(""); setSector(""); setMessage("Company created."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to create company."); } finally { setPending(false); } }
  return <main className="portal-page"><header className="portal-header"><Link className="brand" href="/admin/dashboard"><span className="brand-mark">PP</span><span><strong>Placement Portal</strong><small>GBPUAT Pantnagar</small></span></Link><Link className="text-link" href="/admin/dashboard">Admin dashboard</Link></header><section className="admin-content"><p className="eyebrow">Company directory</p><h1>Know who is coming to campus.</h1><form className="admin-form" onSubmit={submit}><label>Company name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="PIE Infotech" /></label><label>Sector<input value={sector} onChange={(event) => setSector(event.target.value)} placeholder="IT Services" /></label><button className="button button-accent" disabled={pending} type="submit">{pending ? "Creating..." : "Create company"} <span aria-hidden="true">-&gt;</span></button>{message && <p className="form-message" role="status">{message}</p>}</form><div className="admin-list"><h2>Saved companies</h2>{companies.length ? companies.map((company) => <div className="admin-list-item" key={company.id}><strong>{company.name}</strong><span>{company.sector ?? "Sector not set"}</span></div>) : <p className="dashboard-copy">{message || "No companies yet."}</p>}</div></section></main>;
}