"use client";

import { FormEvent, useEffect, useState } from "react";

type ProfileValues = { branch: string; batch_year: string; cgpa: string; active_backlogs: string };

const emptyProfile: ProfileValues = { branch: "", batch_year: "", cgpa: "", active_backlogs: "0" };

export function ProfileForm() {
  const [values, setValues] = useState(emptyProfile);
  const [message, setMessage] = useState("Loading profile...");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    fetch("/api/students/me")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message ?? "Unable to load profile.");
        if (result.data) {
          setValues({ branch: result.data.branch ?? "", batch_year: String(result.data.batch_year ?? ""), cgpa: result.data.cgpa == null ? "" : String(result.data.cgpa), active_backlogs: String(result.data.active_backlogs ?? 0) });
        }
        setMessage("");
      })
      .catch((error: Error) => setMessage(error.message));
  }, []);

  function update(field: keyof ProfileValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/students/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, cgpa: values.cgpa ? values.cgpa : null }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Unable to save profile.");
      setMessage("Academic details saved. Complete the remaining profile sections before applying.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save profile.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <label>Branch<input required value={values.branch} onChange={(event) => update("branch", event.target.value)} placeholder="e.g. Mechanical Engineering" /></label>
      <div className="profile-fields">
        <label>Batch year<input required type="number" value={values.batch_year} onChange={(event) => update("batch_year", event.target.value)} placeholder="2027" /></label>
        <label>CGPA<input type="number" min="0" max="10" step="0.001" value={values.cgpa} onChange={(event) => update("cgpa", event.target.value)} placeholder="8.250" /></label>
        <label>Active backlogs<input required type="number" min="0" value={values.active_backlogs} onChange={(event) => update("active_backlogs", event.target.value)} /></label>
      </div>
      <button className="button button-accent" disabled={isPending || message === "Loading profile..."} type="submit">{isPending ? "Saving..." : "Save profile"} <span aria-hidden="true">-&gt;</span></button>
      {message && <p className="form-message" role="status">{message}</p>}
    </form>
  );
}