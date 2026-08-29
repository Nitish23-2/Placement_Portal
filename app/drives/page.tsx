import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Drive = { id: string; title: string; description: string | null; ctc_min: number | null; ctc_max: number | null; location: string | null; apply_deadline: string | null; eligibility_criteria: string | null; companies: { name: string; sector: string | null } | null };

function formatCtc(min: number | null, max: number | null) {
  if (min == null && max == null) return "Compensation to be announced";
  if (min != null && max != null) return `CTC ${min} - ${max} LPA`;
  return `CTC ${min ?? max} LPA`;
}

export default async function DrivesPage() {
  const supabase = await createClient();
  const { data: authData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { data } = supabase && authData.user ? await supabase.from("drives").select("*, companies(name, sector)").eq("status", "published").order("apply_deadline", { ascending: true, nullsFirst: false }) : { data: null };
  const drives = (data ?? []) as Drive[];

  return <main className="portal-page"><header className="portal-header"><Link className="brand" href="/dashboard"><span className="brand-mark">PP</span><span><strong>Placement Portal</strong><small>GBPUAT Pantnagar</small></span></Link><nav className="portal-nav"><Link href="/notices">Notices</Link><Link href="/profile">Profile</Link></nav></header><section className="listing-intro"><p className="eyebrow">Open opportunities</p><h1>Every published drive, in one view.</h1><p className="dashboard-copy">Eligibility notes are shown for your own assessment. The portal does not hide drives based on branch, CGPA, batch, or backlogs.</p></section><section className="drive-list" aria-label="Published placement drives">{drives.length ? drives.map((drive) => <article className="drive-item" key={drive.id}><div><span className="card-kicker">{drive.companies?.name ?? "Company"} {drive.companies?.sector ? ` / ${drive.companies.sector}` : ""}</span><h2>{drive.title}</h2><p>{drive.description ?? "Role details will be shared by the placement cell."}</p></div><div className="drive-meta"><strong>{formatCtc(drive.ctc_min, drive.ctc_max)}</strong><span>{drive.location ?? "Location to be announced"}</span><span>{drive.apply_deadline ? `Apply by ${new Date(drive.apply_deadline).toLocaleDateString("en-IN")}` : "Deadline to be announced"}</span><small>{drive.eligibility_criteria ?? "Review the role details and decide if it suits you."}</small></div></article>) : <div className="empty-state"><strong>No published drives yet.</strong><span>New opportunities will appear here for every student as soon as the placement cell publishes them.</span></div>}</section></main>;
}