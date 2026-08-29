import Link from "next/link";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <main className="portal-page">
      <header className="portal-header"><Link className="brand" href="/dashboard"><span className="brand-mark">PP</span><span><strong>Placement Portal</strong><small>GBPUAT Pantnagar</small></span></Link><Link className="text-link" href="/dashboard">Back to dashboard</Link></header>
      <section className="dashboard-intro compact-intro"><p className="eyebrow">Student profile</p><h1>Your details, ready when you are.</h1><p className="dashboard-copy">Start with the academic details used to keep your placement record accurate. More PRF fields will follow in the next profile slice.</p><ProfileForm /></section>
    </main>
  );
}