import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Drive = {
  id: string;
  title: string;
  description: string | null;
  ctc_min: number | null;
  ctc_max: number | null;
  location: string | null;
  apply_deadline: string | null;
  eligibility_criteria: string | null;
  companies: { name: string; sector: string | null } | null;
};

function formatCtc(min: number | null, max: number | null) {
  if (min == null && max == null) return "Compensation to be announced";
  if (min != null && max != null) return `CTC ${min} - ${max} LPA`;
  return `CTC ${min ?? max} LPA`;
}

export default async function DrivesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; location?: string; min_ctc?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = Math.max(Number(resolvedParams.page ?? 1), 1);
  const search = resolvedParams.q?.trim() ?? "";
  const locationFilter = resolvedParams.location?.trim() ?? "";
  const minCtcFilter = resolvedParams.min_ctc ? Number(resolvedParams.min_ctc) : null;

  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  let query = supabase
    ? supabase
        .from("drives")
        .select("*, companies(name, sector)")
        .eq("status", "published")
        .order("apply_deadline", { ascending: true, nullsFirst: false })
    : null;

  if (query && search) {
    query = query.ilike("title", `%${search}%`);
  }
  if (query && locationFilter) {
    query = query.ilike("location", `%${locationFilter}%`);
  }
  if (query && minCtcFilter && !isNaN(minCtcFilter)) {
    query = query.gte("ctc_max", minCtcFilter);
  }

  const { data } = supabase && authData.user && query ? await query.range(from, to) : { data: null };

  const drives = (data ?? []) as Drive[];

  return (
    <main className="portal-page">
      <header className="portal-header">
        <Link className="brand" href="/dashboard">
          <span className="brand-mark">PP</span>
          <span>
            <strong>Placement Portal</strong>
            <small>GBPUAT Pantnagar</small>
          </span>
        </Link>
        <nav className="portal-nav">
          <Link href="/notices">Notices</Link>
          <Link href="/applications">Applications</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      </header>
      <section className="listing-intro">
        <p className="eyebrow">Open opportunities</p>
        <h1>Every published drive, in one view.</h1>
        <p className="dashboard-copy">
          Eligibility notes are shown for your own assessment. The portal does not hide drives based on branch, CGPA, batch, or backlogs.
        </p>

        {/* Search & Filter Controls */}
        <form method="GET" action="/drives" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "20px", padding: "16px", background: "var(--surface-color, #f8f9fa)", borderRadius: "8px", border: "1px solid var(--border-color, #e9ecef)" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem", fontWeight: 500 }}>
            Role Title Search
            <input name="q" defaultValue={search} placeholder="e.g. Graduate Engineer, Analyst" style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #ced4da)" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem", fontWeight: 500 }}>
            Location Filter
            <input name="location" defaultValue={locationFilter} placeholder="e.g. Remote, Pantnagar, Pune" style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #ced4da)" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "0.85rem", fontWeight: 500 }}>
            Min CTC (LPA)
            <input name="min_ctc" type="number" step="0.5" defaultValue={minCtcFilter ?? ""} placeholder="e.g. 6.0" style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-color, #ced4da)" }} />
          </label>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
            <button className="button button-accent" type="submit" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
              Filter Drives
            </button>
            {(search || locationFilter || minCtcFilter) && (
              <Link className="button button-quiet" href="/drives" style={{ padding: "8px 12px", fontSize: "0.85rem" }}>
                Reset
              </Link>
            )}
          </div>
        </form>
      </section>

      <section className="drive-list" aria-label="Published placement drives" style={{ marginTop: "24px" }}>
        {drives.length ? (
          drives.map((drive) => {
            const isClosed = drive.apply_deadline ? new Date() > new Date(drive.apply_deadline) : false;
            return (
              <Link className="drive-item" href={`/drives/${drive.id}`} key={drive.id}>
                <div>
                  <span className="card-kicker">
                    {drive.companies?.name ?? "Company"}{" "}
                    {drive.companies?.sector ? ` / ${drive.companies.sector}` : ""}
                  </span>
                  <h2>{drive.title}</h2>
                  <p>{drive.description ?? "Role details will be shared by the placement cell."}</p>
                </div>
                <div className="drive-meta">
                  <strong>{formatCtc(drive.ctc_min, drive.ctc_max)}</strong>
                  <span>{drive.location ?? "Location to be announced"}</span>
                  <span style={isClosed ? { color: "#842029", fontWeight: 600 } : {}}>
                    {drive.apply_deadline
                      ? `${isClosed ? "Closed on" : "Apply by"} ${new Date(drive.apply_deadline).toLocaleDateString("en-IN")}`
                      : "Deadline to be announced"}
                  </span>
                  <small>{drive.eligibility_criteria ?? "Review the role details and decide if it suits you."}</small>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="empty-state">
            <strong>No matching placement drives found.</strong>
            <span>
              {search || locationFilter || minCtcFilter
                ? "Try clearing filters to see all available opportunities."
                : "New opportunities will appear here for every student as soon as the placement cell publishes them."}
            </span>
          </div>
        )}
      </section>
      {(page > 1 || drives.length === pageSize) && (
        <nav className="pagination" aria-label="Drive pages" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          {page > 1 && (
            <Link className="button button-quiet" href={`/drives?page=${page - 1}${search ? `&q=${encodeURIComponent(search)}` : ""}${locationFilter ? `&location=${encodeURIComponent(locationFilter)}` : ""}`}>
              &larr; Previous page
            </Link>
          )}
          {drives.length === pageSize && (
            <Link className="button button-quiet" href={`/drives?page=${page + 1}${search ? `&q=${encodeURIComponent(search)}` : ""}${locationFilter ? `&location=${encodeURIComponent(locationFilter)}` : ""}`}>
              Next page <span aria-hidden="true">-&gt;</span>
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}