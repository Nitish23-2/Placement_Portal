import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  let activeDrivesCount = 0;
  let totalDrivesCount = 0;
  let totalStudentsCount = 0;
  let totalCompaniesCount = 0;
  let pendingApplicationsCount = 0;
  let totalSelectedCount = 0;

  if (supabase) {
    const { count: drivesCount } = await supabase.from("drives").select("*", { count: "exact", head: true });
    const { count: activeDrives } = await supabase.from("drives").select("*", { count: "exact", head: true }).eq("status", "published");
    const { count: studentsCount } = await supabase.from("students").select("*", { count: "exact", head: true });
    const { count: companiesCount } = await supabase.from("companies").select("*", { count: "exact", head: true }).eq("status", "active");
    const { count: pendingApps } = await supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "applied");
    const { count: selectedApps } = await supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "selected");

    totalDrivesCount = drivesCount ?? 0;
    activeDrivesCount = activeDrives ?? 0;
    totalStudentsCount = studentsCount ?? 0;
    totalCompaniesCount = companiesCount ?? 0;
    pendingApplicationsCount = pendingApps ?? 0;
    totalSelectedCount = selectedApps ?? 0;
  }

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
        <span className="portal-status">Placement Cell Admin</span>
      </header>

      <section className="listing-intro">
        <p className="eyebrow">Operations & Institutional Desk</p>
        <h1>Keep the placement record moving.</h1>
        <p className="dashboard-copy">
          Create companies, publish drives, manage applicants, track student progression, and export institutional reports.
        </p>
      </section>

      {/* Real-time operational metrics */}
      <section className="stats-row" aria-label="Placement Overview" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <div className="stat-card" style={{ padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Drives</span>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0", color: "#198754" }}>{activeDrivesCount} <small style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-muted, #6c757d)" }}>/ {totalDrivesCount} total</small></p>
        </div>
        <div className="stat-card" style={{ padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pending Review</span>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0", color: pendingApplicationsCount > 0 ? "#fd7e14" : "inherit" }}>{pendingApplicationsCount}</p>
        </div>
        <div className="stat-card" style={{ padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Selected Offers</span>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0", color: "#0d6efd" }}>{totalSelectedCount}</p>
        </div>
        <div className="stat-card" style={{ padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Enrolled Students</span>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0" }}>{totalStudentsCount}</p>
        </div>
        <div className="stat-card" style={{ padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Active Recruiters</span>
          <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0" }}>{totalCompaniesCount}</p>
        </div>
      </section>

      {/* Main navigation cards */}
      <section className="dashboard-grid">
        <Link className="dashboard-card dashboard-card-large" href="/admin/companies">
          <span className="card-kicker">01 / Recruiters</span>
          <h2>Build the recruiter directory.</h2>
          <p>Create and maintain company records and visit history before opening a drive.</p>
          <span className="card-arrow">-&gt;</span>
        </Link>
        <Link className="dashboard-card" href="/admin/drives">
          <span className="card-kicker">02 / Drives</span>
          <h2>Shape the next opportunity.</h2>
          <p>Create drafts, upload JDs, publish drives, and manage applicants.</p>
          <span className="card-arrow">-&gt;</span>
        </Link>
        <Link className="dashboard-card" href="/admin/students">
          <span className="card-kicker">03 / Students</span>
          <h2>Keep the student record whole.</h2>
          <p>Review directory data, verify completeness, and export placement rosters.</p>
          <span className="card-arrow">-&gt;</span>
        </Link>
        <Link className="dashboard-card" href="/admin/notices">
          <span className="card-kicker">04 / Notices</span>
          <h2>Keep everyone informed.</h2>
          <p>Post updates and critical timeline reminders in the persistent feed.</p>
          <span className="card-arrow">-&gt;</span>
        </Link>
        <Link className="dashboard-card" href="/admin/analytics">
          <span className="card-kicker">05 / Analytics</span>
          <h2>See the institutional picture.</h2>
          <p>Review placement counts, CTC metrics, branch comparisons, and exports.</p>
          <span className="card-arrow">-&gt;</span>
        </Link>
      </section>
    </main>
  );
}