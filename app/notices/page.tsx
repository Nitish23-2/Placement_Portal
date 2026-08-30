import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Notice = {
  id: string;
  title: string;
  body: string | null;
  attachment_url?: string | null;
  category?: string;
  created_at: string;
  drives: { title: string; companies: { name: string } | null } | null;
};

export default async function NoticesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(Number((await searchParams).page ?? 1), 1);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();
  const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { data } =
    supabase && authData.user
      ? await supabase
          .from("notices")
          .select("*, drives(title, companies(name))")
          .order("created_at", { ascending: false })
          .range(from, to)
      : { data: null };

  const notices = (data ?? []) as Notice[];

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
          <Link href="/drives">Drives</Link>
          <Link href="/applications">Applications</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      </header>
      <section className="listing-intro">
        <p className="eyebrow">Placement cell updates</p>
        <h1>Nothing important gets lost in the chat.</h1>
        <p className="dashboard-copy">
          Every notice is retained in one shared feed and visible to every student.
        </p>
      </section>
      <section className="notice-list" aria-label="Placement notices">
        {notices.length ? (
          notices.map((notice) => (
            <article className="notice-item" key={notice.id} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <span className="card-kicker">
                    {notice.category ? `${notice.category.toUpperCase()} • ` : ""}
                    {notice.drives?.companies?.name ?? "Placement Cell"}{" "}
                    {notice.drives ? ` / ${notice.drives.title}` : ""}
                  </span>
                  <h2 style={{ margin: "4px 0" }}>{notice.title}</h2>
                </div>
                <time dateTime={notice.created_at} style={{ fontSize: "0.85rem", color: "var(--text-muted, #6c757d)", whiteSpace: "nowrap" }}>
                  {new Date(notice.created_at).toLocaleDateString("en-IN")}
                </time>
              </div>

              <p style={{ margin: 0, whiteSpace: "pre-line" }}>{notice.body ?? ""}</p>

              {notice.attachment_url && (
                <div style={{ marginTop: "4px" }}>
                  <a
                    className="button button-quiet"
                    href={`/api/notices/${notice.id}/attachment`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px" }}
                  >
                    📎 Download Attachment
                  </a>
                </div>
              )}
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>No notices yet.</strong>
            <span>Published drives and placement-cell updates will appear here for everyone.</span>
          </div>
        )}
      </section>
      {(page > 1 || notices.length === pageSize) && (
        <nav className="pagination" aria-label="Notice pages" style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
          {page > 1 && (
            <Link className="button button-quiet" href={`/notices?page=${page - 1}`}>
              &larr; Previous page
            </Link>
          )}
          {notices.length === pageSize && (
            <Link className="button button-quiet" href={`/notices?page=${page + 1}`}>
              Next page <span aria-hidden="true">-&gt;</span>
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}