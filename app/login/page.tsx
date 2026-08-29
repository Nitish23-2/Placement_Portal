import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <Link className="auth-back" href="/">&lt;- Placement Portal</Link>
      <section className="auth-panel">
        <p className="eyebrow">Welcome back</p>
        <h1>Pick up where you left off.</h1>
        <p className="auth-intro">Sign in to follow drives, applications, and the latest placement notices.</p>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}