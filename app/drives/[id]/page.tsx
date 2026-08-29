import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyButton } from "@/components/applications/ApplyButton";
import { createClient } from "@/lib/supabase/server";

export default async function DriveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = supabase
    ? await supabase
        .from("drives")
        .select("*, companies(name, sector, website)")
        .eq("id", id)
        .eq("status", "published")
        .maybeSingle()
    : { data: null };

  if (!data) notFound();

  const isDeadlinePassed = data.apply_deadline ? new Date() > new Date(data.apply_deadline) : false;

  return (
    <main className="portal-page">
      <header className="portal-header">
        <Link className="brand" href="/drives">
          <span className="brand-mark">PP</span>
          <span>
            <strong>Placement Portal</strong>
            <small>GBPUAT Pantnagar</small>
          </span>
        </Link>
        <Link className="text-link" href="/drives">
          &larr; Back to all drives
        </Link>
      </header>
      <section className="detail-panel">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <p className="eyebrow">
            {data.companies?.name ?? "Company"} {data.companies?.sector ? ` / ${data.companies.sector}` : ""}
          </p>
          {isDeadlinePassed ? (
            <span className="status-pill" style={{ background: "#f8d7da", color: "#842029" }}>
              Applications Closed (Deadline Passed)
            </span>
          ) : (
            <span className="status-pill" style={{ background: "#d1e7dd", color: "#0f5132" }}>
              Accepting Applications
            </span>
          )}
        </div>
        <h1>{data.title}</h1>
        <p className="detail-description">{data.description ?? "Role details will be shared by the placement cell."}</p>
        <div className="detail-facts">
          <span>
            <strong>Compensation</strong>
            {data.ctc_min != null || data.ctc_max != null
              ? `${data.ctc_min ?? data.ctc_max} - ${data.ctc_max ?? data.ctc_min} LPA`
              : "To be announced"}
          </span>
          <span>
            <strong>Location</strong>
            {data.location ?? "To be announced"}
          </span>
          <span>
            <strong>Deadline</strong>
            {data.apply_deadline ? new Date(data.apply_deadline).toLocaleString("en-IN") : "To be announced"}
          </span>
        </div>
        <div className="eligibility-note">
          <strong>Eligibility information (Informational only)</strong>
          <p>{data.eligibility_criteria ?? "Review the role details and criteria to self-assess your candidacy."}</p>
          <small style={{ display: "block", marginTop: "8px", color: "var(--muted)" }}>
            * The portal does not filter or block students based on branch or scores. You decide whether to apply.
          </small>
        </div>
        {!isDeadlinePassed ? (
          <ApplyButton driveId={data.id} />
        ) : (
          <div className="empty-state" style={{ marginTop: "24px", background: "var(--cream)" }}>
            <strong>Applications for this drive are now closed.</strong>
            <span>The deadline for submitting an application was {new Date(data.apply_deadline!).toLocaleString("en-IN")}.</span>
          </div>
        )}
      </section>
    </main>
  );
}