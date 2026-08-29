import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NotificationInbox } from "@/components/notifications/NotificationInbox";

export default async function DashboardPage() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

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
          <p className="dashboard-copy">Your profile, open drives, applications, and notices will live here.</p>
        )}
      </section>
      <section className="dashboard-grid" aria-label="Student workspace sections">
        <Link className="dashboard-card dashboard-card-large" href="/profile"><span className="card-kicker">01 / Profile</span><h2>Make your profile work for you.</h2><p>Complete your biodata once and reuse it for every application.</p><span className="card-arrow">-&gt;</span></Link>
        <Link className="dashboard-card" href="/drives"><span className="card-kicker">02 / Drives</span><h2>Every opportunity, visible.</h2><p>Browse all published drives and decide what fits.</p><span className="card-arrow">-&gt;</span></Link>
        <Link className="dashboard-card" href="/applications"><span className="card-kicker">03 / Applications</span><h2>Track what happens next.</h2><p>Follow your applications from applied to outcome.</p><span className="card-arrow">-&gt;</span></Link>
      </section>
    </main>
  );
}