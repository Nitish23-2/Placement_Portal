"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

type Company = {
  id: string;
  name: string;
  sector: string | null;
  website: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: "active" | "archived";
};

type Visit = {
  id: string;
  visit_date: string;
  batch_year: number | null;
  roles_offered: string | null;
  ctc_min: number | null;
  ctc_max: number | null;
  offers_count: number;
  notes: string | null;
};

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived">("active");

  // Create form state
  const [name, setName] = useState("");
  const [sector, setSector] = useState("");
  const [website, setWebsite] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  // Selected company visits state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [visitRoles, setVisitRoles] = useState("");
  const [visitCtc, setVisitCtc] = useState("");
  const [visitOffers, setVisitOffers] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [visitPending, setVisitPending] = useState(false);
  const [visitMessage, setVisitMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    fetch("/api/companies")
      .then(async (res) => {
        const result = await res.json();
        if (isMounted) {
          if (res.ok && result.data) {
            setCompanies(result.data);
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

  async function submitCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sector: sector || null,
          website: website || null,
          contact_person: contactPerson || null,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message ?? "Unable to create company.");
      setCompanies((current) => [result.data, ...current]);
      setName("");
      setSector("");
      setWebsite("");
      setContactPerson("");
      setContactEmail("");
      setContactPhone("");
      setMessage("Company created successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to create company.");
    } finally {
      setPending(false);
    }
  }

  async function toggleArchive(company: Company) {
    const nextStatus = company.status === "active" ? "archived" : "active";
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message ?? "Failed to update company.");
      setCompanies((prev) => prev.map((c) => (c.id === company.id ? { ...c, status: nextStatus } : c)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function openVisits(company: Company) {
    setSelectedCompany(company);
    setVisitsLoading(true);
    setVisitMessage("");
    try {
      const res = await fetch(`/api/companies/${company.id}/visits`);
      const result = await res.json();
      if (res.ok) {
        setVisits(result.data ?? []);
      }
    } catch {
      // ignore
    } finally {
      setVisitsLoading(false);
    }
  }

  async function submitVisit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCompany) return;
    setVisitPending(true);
    setVisitMessage("");
    try {
      const res = await fetch(`/api/companies/${selectedCompany.id}/visits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visit_date: visitDate,
          roles_offered: visitRoles || undefined,
          ctc_max: visitCtc ? Number(visitCtc) : undefined,
          offers_count: visitOffers ? Number(visitOffers) : 0,
          notes: visitNotes || undefined,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message ?? "Failed to add visit record.");
      setVisits((prev) => [result.data, ...prev]);
      setVisitDate("");
      setVisitRoles("");
      setVisitCtc("");
      setVisitOffers("");
      setVisitNotes("");
      setVisitMessage("Visit record added.");
    } catch (err) {
      setVisitMessage(err instanceof Error ? err.message : "Error saving visit.");
    } finally {
      setVisitPending(false);
    }
  }

  const filteredCompanies = companies.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.sector && c.sector.toLowerCase().includes(q));
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
        <Link className="text-link" href="/admin/dashboard">
          Admin dashboard
        </Link>
      </header>

      <section className="admin-content">
        <p className="eyebrow">Recruiter Directory & Past Visits</p>
        <h1>Know who is coming to campus.</h1>
        <p className="dashboard-copy">
          Maintain recruiter profiles, contact details, and historical visit timelines.
        </p>

        {/* Create new company form */}
        <form className="admin-form" onSubmit={submitCompany} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <label style={{ gridColumn: "1 / -1" }}>
            Company name *
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tata Consultancy Services" />
          </label>
          <label>
            Sector
            <input value={sector} onChange={(e) => setSector(e.target.value)} placeholder="e.g. IT Services, Core Engineering" />
          </label>
          <label>
            Website
            <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://example.com" />
          </label>
          <label>
            Contact Person
            <input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Recruiter name" />
          </label>
          <label>
            Contact Email
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="recruiter@example.com" />
          </label>
          <label>
            Contact Phone
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+91 98765 43210" />
          </label>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "16px" }}>
            <button className="button button-accent" disabled={pending} type="submit">
              {pending ? "Creating..." : "Create company"} <span aria-hidden="true">-&gt;</span>
            </button>
            {message && <span style={{ fontSize: "0.9rem", color: message.includes("success") ? "#198754" : "#dc3545" }}>{message}</span>}
          </div>
        </form>

        {/* Search & Status Filters */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "20px" }}>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies or sectors..."
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-color, #ced4da)", flex: 1, minWidth: "200px" }}
          />
          <div style={{ display: "flex", gap: "6px" }}>
            {(["active", "archived", "all"] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`button ${statusFilter === s ? "button-accent" : "button-quiet"}`}
                onClick={() => setStatusFilter(s)}
                style={{ textTransform: "capitalize", fontSize: "0.85rem" }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Company List */}
        <div className="admin-list">
          <h2>Recruiters ({filteredCompanies.length})</h2>
          {loading ? (
            <p className="dashboard-copy">Loading companies...</p>
          ) : filteredCompanies.length ? (
            filteredCompanies.map((c) => (
              <div className="admin-list-item" key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px" }}>
                <div>
                  <strong>{c.name}</strong>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted, #6c757d)", marginTop: "4px" }}>
                    {c.sector ?? "General"} • {c.status.toUpperCase()}
                    {c.contact_person && ` • Contact: ${c.contact_person}`}
                    {c.contact_email && ` (${c.contact_email})`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => void openVisits(c)}
                    style={{ fontSize: "0.85rem" }}
                  >
                    Past Visits 📅
                  </button>
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => void toggleArchive(c)}
                    style={{ fontSize: "0.85rem", color: c.status === "active" ? "#6c757d" : "#198754" }}
                  >
                    {c.status === "active" ? "Archive" : "Unarchive"}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="dashboard-copy">No matching companies found.</p>
          )}
        </div>

        {/* Past Visits Modal / Drawer */}
        {selectedCompany && (
          <div style={{ marginTop: "32px", padding: "24px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #dee2e6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>Past Visits Timeline: {selectedCompany.name}</h3>
              <button type="button" className="button button-quiet" onClick={() => setSelectedCompany(null)}>Close ✕</button>
            </div>

            {/* Add Visit Form */}
            <form onSubmit={submitVisit} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              <label>
                Visit Date *
                <input required type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
              </label>
              <label>
                Roles Offered
                <input value={visitRoles} onChange={(e) => setVisitRoles(e.target.value)} placeholder="e.g. SDE, GET" />
              </label>
              <label>
                CTC Offered (LPA)
                <input type="number" step="0.1" value={visitCtc} onChange={(e) => setVisitCtc(e.target.value)} placeholder="e.g. 12.5" />
              </label>
              <label>
                Offers Extended
                <input type="number" value={visitOffers} onChange={(e) => setVisitOffers(e.target.value)} placeholder="e.g. 8" />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Notes / Feedback
                <input value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} placeholder="Hiring feedback or drive notes" />
              </label>
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "12px" }}>
                <button className="button button-accent" disabled={visitPending} type="submit" style={{ fontSize: "0.85rem" }}>
                  {visitPending ? "Saving..." : "Add Visit Record"}
                </button>
                {visitMessage && <span style={{ fontSize: "0.85rem" }}>{visitMessage}</span>}
              </div>
            </form>

            {/* Visits Timeline */}
            <div>
              <h4 style={{ margin: "12px 0" }}>Historical Visits ({visits.length})</h4>
              {visitsLoading ? (
                <p style={{ fontSize: "0.85rem" }}>Loading visits...</p>
              ) : visits.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted, #6c757d)" }}>No visits logged for this recruiter yet.</p>
              ) : (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {visits.map((v) => (
                    <li key={v.id} style={{ padding: "12px", background: "#ffffff", borderRadius: "6px", border: "1px solid var(--border-color, #e9ecef)", marginBottom: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <strong>{new Date(v.visit_date).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</strong>
                        {v.offers_count > 0 && <span style={{ color: "#198754", fontWeight: 600 }}>{v.offers_count} Offers</span>}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-muted, #6c757d)", marginTop: "4px" }}>
                        {v.roles_offered && `Roles: ${v.roles_offered}`}
                        {v.ctc_max && ` • CTC: ${v.ctc_max} LPA`}
                      </div>
                      {v.notes && <p style={{ fontSize: "0.8rem", margin: "6px 0 0 0", fontStyle: "italic" }}>{v.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}