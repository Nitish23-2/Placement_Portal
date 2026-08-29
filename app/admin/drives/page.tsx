"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Company = { id: string; name: string };
type Drive = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "closed";
  ctc_min: number | null;
  ctc_max: number | null;
  location: string | null;
  apply_deadline: string | null;
  eligibility_criteria: string | null;
  jd_url: string | null;
  companies: { name: string } | null;
};

export default function AdminDrivesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [drives, setDrives] = useState<Drive[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "closed">("all");

  // Form states
  const [companyId, setCompanyId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ctcMin, setCtcMin] = useState("");
  const [ctcMax, setCtcMax] = useState("");
  const [location, setLocation] = useState("");
  const [applyDeadline, setApplyDeadline] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  // JD Upload state
  const [uploadingDriveId, setUploadingDriveId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetch("/api/companies?status=active"),
      fetch("/api/drives"),
    ])
      .then(async ([compRes, driveRes]) => {
        const compJson = await compRes.json();
        const driveJson = await driveRes.json();

        if (isMounted) {
          if (compRes.ok && compJson.data) {
            setCompanies(compJson.data);
            if (compJson.data.length && !companyId) {
              setCompanyId(compJson.data[0].id);
            }
          }
          if (driveRes.ok && driveJson.data) {
            setDrives(driveJson.data.items ?? driveJson.data);
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
  }, [companyId]);

  async function submitDrive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");

    try {
      const res = await fetch("/api/drives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          title,
          description: description || null,
          ctc_min: ctcMin ? Number(ctcMin) : null,
          ctc_max: ctcMax ? Number(ctcMax) : null,
          location: location || null,
          apply_deadline: applyDeadline ? new Date(applyDeadline).toISOString() : null,
          eligibility_criteria: eligibility || null,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message ?? "Unable to create drive.");

      setDrives((prev) => [result.data, ...prev]);
      setTitle("");
      setDescription("");
      setCtcMin("");
      setCtcMax("");
      setLocation("");
      setApplyDeadline("");
      setEligibility("");
      setMessage("Draft drive created successfully. Upload JD or publish when ready.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to create drive.");
    } finally {
      setPending(false);
    }
  }

  async function changeStatus(id: string, action: "publish" | "close") {
    try {
      const res = await fetch(`/api/drives/${id}/${action}`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message ?? `Unable to ${action} drive.`);

      setDrives((prev) => prev.map((d) => (d.id === id ? { ...d, status: result.data.status } : d)));
      setMessage(action === "publish" ? "Drive published and notice broadcast dispatched." : "Drive closed.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : `Error changing status.`);
    }
  }

  async function handleJdUpload(driveId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDriveId(driveId);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/drives/${driveId}/jd`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message ?? "JD upload failed.");

      setDrives((prev) => prev.map((d) => (d.id === driveId ? { ...d, jd_url: result.data.jd_url } : d)));
      setMessage("Job description PDF uploaded successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "JD upload failed.");
    } finally {
      setUploadingDriveId(null);
      event.target.value = "";
    }
  }

  const filteredDrives = drives.filter((d) => {
    if (statusFilter === "all") return true;
    return d.status === statusFilter;
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
        <p className="eyebrow">Drive Builder & Management</p>
        <h1>Shape the next opportunity.</h1>
        <p className="dashboard-copy">
          Create drafts, configure compensation and deadlines, attach Job Descriptions (PDF), and publish drives.
        </p>

        {/* Create Drive Form */}
        <form className="admin-form" onSubmit={submitDrive} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "36px" }}>
          <label style={{ gridColumn: "1 / -1" }}>
            Recruiter *
            <select required value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">Select a company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Role Title *
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Graduate Engineer Trainee (GET)" />
          </label>
          <label>
            Min CTC (LPA)
            <input type="number" step="0.1" value={ctcMin} onChange={(e) => setCtcMin(e.target.value)} placeholder="e.g. 6.5" />
          </label>
          <label>
            Max CTC (LPA)
            <input type="number" step="0.1" value={ctcMax} onChange={(e) => setCtcMax(e.target.value)} placeholder="e.g. 10.0" />
          </label>
          <label>
            Job Location
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Pantnagar / Remote / Pune" />
          </label>
          <label>
            Application Deadline
            <input type="datetime-local" value={applyDeadline} onChange={(e) => setApplyDeadline(e.target.value)} />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Description & Hiring Process
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Provide overview, rounds, test dates..." />
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Eligibility Notes (Informational Only)
            <textarea value={eligibility} onChange={(e) => setEligibility(e.target.value)} rows={2} placeholder="e.g. Open to B.Tech EE, ME, CSE (>= 6.5 CGPA). Drives remain visible to all students." />
          </label>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "16px" }}>
            <button className="button button-accent" disabled={pending || !companyId} type="submit">
              {pending ? "Creating..." : "Create Draft Drive"} <span aria-hidden="true">-&gt;</span>
            </button>
            {message && <span style={{ fontSize: "0.9rem", color: message.includes("success") || message.includes("published") ? "#198754" : "#dc3545" }}>{message}</span>}
          </div>
        </form>

        {/* Filter controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>
          <h2>Drives ({filteredDrives.length})</h2>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["all", "draft", "published", "closed"] as const).map((s) => (
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

        {/* Drive List */}
        <div className="admin-list">
          {loading ? (
            <p className="dashboard-copy">Loading drives...</p>
          ) : filteredDrives.length ? (
            filteredDrives.map((drive) => (
              <div className="admin-list-item" key={drive.id} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                  <div>
                    <span className="card-kicker">{drive.companies?.name ?? "Company"}</span>
                    <h3 style={{ margin: "2px 0" }}>{drive.title}</h3>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted, #6c757d)", marginTop: "4px" }}>
                      Status: <strong style={{ textTransform: "capitalize" }}>{drive.status}</strong>
                      {drive.location && ` • Location: ${drive.location}`}
                      {drive.apply_deadline && ` • Deadline: ${new Date(drive.apply_deadline).toLocaleString("en-IN")}`}
                      {drive.ctc_max && ` • CTC: ${drive.ctc_min ? `${drive.ctc_min} - ` : ""}${drive.ctc_max} LPA`}
                    </div>
                  </div>
                  <span className={`status-pill status-${drive.status}`}>
                    {drive.status}
                  </span>
                </div>

                {/* Actions & JD Upload row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderTop: "1px solid var(--border-color, #f1f3f5)", paddingTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {drive.jd_url ? (
                      <span style={{ fontSize: "0.85rem", color: "#198754" }}>✓ JD Attached</span>
                    ) : (
                      <span style={{ fontSize: "0.85rem", color: "var(--text-muted, #6c757d)" }}>No JD attached</span>
                    )}
                    <label style={{ cursor: "pointer", fontSize: "0.85rem", color: "#0d6efd", textDecoration: "underline", margin: 0 }}>
                      {uploadingDriveId === drive.id ? "Uploading PDF..." : drive.jd_url ? "Replace JD PDF" : "Upload JD PDF"}
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: "none" }}
                        disabled={uploadingDriveId === drive.id}
                        onChange={(e) => void handleJdUpload(drive.id, e)}
                      />
                    </label>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <Link className="button button-quiet" href={`/admin/drives/${drive.id}/applicants`} style={{ fontSize: "0.85rem" }}>
                      View Applicants →
                    </Link>
                    {drive.status === "draft" && (
                      <button className="button button-accent" onClick={() => void changeStatus(drive.id, "publish")} style={{ fontSize: "0.85rem" }}>
                        Publish Drive
                      </button>
                    )}
                    {drive.status === "published" && (
                      <button className="button button-quiet" onClick={() => void changeStatus(drive.id, "close")} style={{ fontSize: "0.85rem", color: "#842029" }}>
                        Close Drive
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="dashboard-copy">No matching placement drives found.</p>
          )}
        </div>
      </section>
    </main>
  );
}