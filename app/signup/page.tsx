import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <main className="auth-page">
      <Link className="auth-back" href="/">&lt;- Placement Portal</Link>
      <section className="auth-panel">
        <p className="eyebrow">First step</p>
        <h1>Your placement workspace starts here.</h1>
        <p className="auth-intro">Create an account with your college email. Your role and student or faculty details are detected automatically.</p>
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}