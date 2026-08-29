import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="portal-page">
      <header className="portal-header"><Link className="brand" href="/dashboard"><span className="brand-mark">PP</span><span><strong>Placement Portal</strong><small>GBPUAT Pantnagar</small></span></Link><Link className="text-link" href="/dashboard">Back to dashboard</Link></header>
      <section className="dashboard-intro compact-intro"><p className="eyebrow">Student profile</p><h1>Your details, ready when you are.</h1><p className="dashboard-copy">The profile form will capture your branch, batch, academic record, biodata, and supporting documents.</p><div className="setup-banner"><strong>Profile form is the next build slice.</strong><span>Supabase connection and student table mapping are ready to be wired here.</span></div></section>
    </main>
  );
}