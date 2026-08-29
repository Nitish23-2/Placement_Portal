import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NotificationInbox } from "@/components/notifications/NotificationInbox";

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  let profileComplete = false;
  let openDrivesCount = 0;
  let appliedCount = 0;
  let shortlistedCount = 0;
  let interviewCount = 0;
  let selectedCount = 0;
  let upcomingDrives: Array<{ id: string; title: string; apply_deadline: string | null; companies: { name: string } | null }> = [];
  let recentNotices: Array<{ id: string; title: string; created_at: string }> = [];

  if (supabase && user) {
    const { data: student } = await supabase
      .from("students")
      .select("id, profile_complete")
      .eq("user_id", user.id)
      .maybeSingle();

    if (student) {
      profileComplete = Boolean(student.profile_complete);

      const { data: apps } = await supabase
        .from("applications")
        .select("status")
        .eq("student_id", student.id);

      const appList = apps ?? [];
      appliedCount = appList.length;
      shortlistedCount = appList.filter((a) => a.status === "shortlisted").length;
      interviewCount = appList.filter((a) => a.status === "interview").length;
      selectedCount = appList.filter((a) => a.status === "selected").length;
    }

    const now = new Date().toISOString();
    const { data: openDrives, count } = await supabase
      .from("drives")
      .select("id, title, apply_deadline, companies(name)", { count: "exact" })
      .eq("status", "published")
      .or(`apply_deadline.is.null,apply_deadline.gte.${now}`)
      .order("apply_deadline", { ascending: true, nullsFirst: false })
      .limit(3);

    openDrivesCount = count ?? 0;
    upcomingDrives = (openDrives ?? []) as unknown as typeof upcomingDrives;

    const { data: notices } = await supabase
      .from("notices")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    recentNotices = notices ?? [];
  }

  return (
    <main className="portal-page">
      <header className="portal-header">
        <Link className="brand" href="/" aria-label="Placement Portal home">
          <span className="brand-mark">PP</span>
          <span><strong>Placement Portal</strong><small>GBPUAT Pantnagar</small></span>
        </Link>
        <span className="portal-status"><NotificationInbox /> Student workspace</span>
      </header>

      <section className="dashboard-intro">
        <p className="eyebrow">Your placement desk</p>
        <h1>{user?.user_metadata?.full_name ? `Good to see you, ${user.user_metadata.full_name}.` : "Your placement journey, in view."}</h1>
        {!supabase ? (
          <div className="setup-banner" role="status">
            <strong>Supabase is not connected yet.</strong>
            <span>Add the values from `.env.example` to `.env.local` to enable live account data.</span>
          </div>
        ) : (
          <p className="dashboard-copy">
            {profileComplete
              ? "Your profile is verified and ready for drive applications."
              : "Complete your biodata, academic records, and resume to unlock applications."}
          </p>
        )}
      </section>

      {/* Real-time stats row */}
      {supabase && user && (
        <section className="stats-row" aria-label="Application Summary" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <div className="stat-card" style={{ padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Profile</span>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0", color: profileComplete ? "#198754" : "#dc3545" }}>
              {profileComplete ? "Ready" : "Incomplete"}
            </p>
          </div>
          <div className="stat-card" style={{ padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Open Drives</span>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0" }}>{openDrivesCount}</p>
          </div>
          <div className="stat-card" style={{ padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Applied</span>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0" }}>{appliedCount}</p>
          </div>
          <div className="stat-card" style={{ padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Shortlisted</span>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0", color: "#0d6efd" }}>{shortlistedCount}</p>
          </div>
          <div className="stat-card" style={{ padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Interview</span>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0", color: "#fd7e14" }}>{interviewCount}</p>
          </div>
          <div className="stat-card" style={{ padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Selected</span>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, margin: "4px 0 0 0", color: "#198754" }}>{selectedCount}</p>
          </div>
        </section>
      )}

      {/* Main navigation cards */}
      <section className="dashboard-grid" aria-label="Student workspace sections">
        <Link className="dashboard-card dashboard-card-large" href="/profile">
          <span className="card-kicker">01 / Profile</span>
          <h2>Make your profile work for you.</h2>
          <p>{profileComplete ? "Update your contact, biodata, or resume as needed." : "Complete required records (Class X, XII, B.Tech, Semesters I-VIII) to apply."}</p>
          <span className="card-arrow">-&gt;</span>
        </Link>
        <Link className="dashboard-card" href="/drives">
          <span className="card-kicker">02 / Drives</span>
          <h2>Every opportunity, visible.</h2>
          <p>{openDrivesCount} active placement opportunities currently open for application.</p>
          <span className="card-arrow">-&gt;</span>
        </Link>
        <Link className="dashboard-card" href="/applications">
          <span className="card-kicker">03 / Applications</span>
          <h2>Track what happens next.</h2>
          <p>Follow your status transitions ({appliedCount} active applications submitted).</p>
          <span className="card-arrow">-&gt;</span>
        </Link>
      </section>

      {/* Upcoming deadlines & Recent notices */}
      {supabase && user && (upcomingDrives.length > 0 || recentNotices.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginTop: "36px" }}>
          {upcomingDrives.length > 0 && (
            <div style={{ background: "var(--surface-color, #ffffff)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Upcoming Deadlines</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {upcomingDrives.map((d) => (
                  <li key={d.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border-color, #f1f3f5)" }}>
                    <Link href={`/drives/${d.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <strong style={{ display: "block" }}>{d.title}</strong>
                      <small style={{ color: "var(--text-muted, #6c757d)" }}>
                        {d.companies?.name ? `${d.companies.name} • ` : ""}
                        {d.apply_deadline ? `Apply by ${new Date(d.apply_deadline).toLocaleDateString("en-IN")}` : "No deadline set"}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recentNotices.length > 0 && (
            <div style={{ background: "var(--surface-color, #ffffff)", padding: "20px", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "12px" }}>Recent Notices</h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {recentNotices.map((n) => (
                  <li key={n.id} style={{ padding: "8px 0", borderBottom: "1px solid var(--border-color, #f1f3f5)" }}>
                    <Link href="/notices" style={{ textDecoration: "none", color: "inherit" }}>
                      <strong style={{ display: "block" }}>{n.title}</strong>
                      <small style={{ color: "var(--text-muted, #6c757d)" }}>
                        {new Date(n.created_at).toLocaleDateString("en-IN")}
                      </small>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </main>
  );
}