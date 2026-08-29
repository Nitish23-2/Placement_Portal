import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplyButton } from "@/components/applications/ApplyButton";
import { createClient } from "@/lib/supabase/server";

export default async function DriveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = supabase ? await supabase.from("drives").select("*, companies(name, sector, website)").eq("id", id).eq("status", "published").maybeSingle() : { data: null };
  if (!data) notFound();
  return <main className="portal-page"><header className="portal-header"><Link className="brand" href="/drives"><span className="brand-mark">PP</span><span><strong>Placement Portal</strong><small>GBPUAT Pantnagar</small></span></Link><Link className="text-link" href="/drives">All drives</Link></header><section className="detail-panel"><p className="eyebrow">{data.companies?.name ?? "Company"} {data.companies?.sector ? ` / ${data.companies.sector}` : ""}</p><h1>{data.title}</h1><p className="detail-description">{data.description ?? "Role details will be shared by the placement cell."}</p><div className="detail-facts"><span><strong>Compensation</strong>{data.ctc_min != null || data.ctc_max != null ? `${data.ctc_min ?? data.ctc_max} - ${data.ctc_max ?? data.ctc_min} LPA` : "To be announced"}</span><span><strong>Location</strong>{data.location ?? "To be announced"}</span><span><strong>Deadline</strong>{data.apply_deadline ? new Date(data.apply_deadline).toLocaleString("en-IN") : "To be announced"}</span></div><div className="eligibility-note"><strong>Eligibility information</strong><p>{data.eligibility_criteria ?? "Review the role details and decide if it suits you."}</p></div><ApplyButton driveId={data.id} /></section></main>;
}