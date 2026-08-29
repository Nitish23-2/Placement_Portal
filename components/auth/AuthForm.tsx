"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getDomainHint, getSignupIdentity } from "@/lib/auth/domain";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (isSignup && !getSignupIdentity(email)) {
      setMessage("Use a student @gbpuat.ac.in or faculty @gbpuat-tech.ac.in email.");
      return;
    }

    setIsPending(true);
    try {
      const supabase = createClient();
      const result = isSignup
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName, ...getSignupIdentity(email) } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

      if (result.error) throw result.error;
      setMessage(isSignup ? "Check your college email to confirm your account." : "Signed in. Redirecting soon...");
      if (!isSignup) router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {isSignup && (
        <label>
          Full name
          <input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" />
        </label>
      )}
      <label>
        College email
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@gbpuat.ac.in" />
        {isSignup && <span className="field-hint">{getDomainHint(email)}</span>}
      </label>
      <label>
        Password
        <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" />
      </label>
      <button className="button button-accent auth-submit" disabled={isPending} type="submit">
        {isPending ? "Please wait..." : isSignup ? "Create account" : "Sign in"} <span aria-hidden="true">-&gt;</span>
      </button>
      {message && <p className="form-message" role="status">{message}</p>}
      <p className="auth-switch">
        {isSignup ? "Already registered? " : "New to the portal? "}
        <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link>
      </p>
    </form>
  );
}