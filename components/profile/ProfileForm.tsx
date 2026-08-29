"use client";

import { FormEvent, useEffect, useState } from "react";

type ProfileValues = { branch: string; batch_year: string; cgpa: string; active_backlogs: string; dob: string; category: string; sex: string; degree: string; permanent_address: string; father_name: string; mobile_no: string; certificate_accepted: boolean };

const emptyProfile: ProfileValues = { branch: "", batch_year: "", cgpa: "", active_backlogs: "0", dob: "", category: "", sex: "", degree: "B.Tech", permanent_address: "", father_name: "", mobile_no: "", certificate_accepted: false };

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
          const general = result.data.biodata_json?.general ?? {};
          setValues({ ...emptyProfile, branch: result.data.branch === "Not set" ? "" : result.data.branch ?? "", batch_year: result.data.batch_year > 0 ? String(result.data.batch_year) : "", cgpa: result.data.cgpa == null ? "" : String(result.data.cgpa), active_backlogs: String(result.data.active_backlogs ?? 0), ...general, certificate_accepted: result.data.biodata_json?.certificate_accepted ?? false });
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
      const response = await fetch("/api/students/me", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ branch: values.branch, batch_year: values.batch_year, cgpa: values.cgpa ? values.cgpa : null, active_backlogs: values.active_backlogs, biodata_json: { general: { dob: values.dob, category: values.category, sex: values.sex, degree: values.degree, permanent_address: values.permanent_address, father_name: values.father_name, mobile_no: values.mobile_no }, education_summary: [], certificate_accepted: values.certificate_accepted } }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Unable to save profile.");
      setMessage("Profile details saved. Education records are still required before applying.");
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
      <div className="profile-fields">
        <label>Date of birth<input required type="date" value={values.dob} onChange={(event) => update("dob", event.target.value)} /></label>
        <label>Category<input required value={values.category} onChange={(event) => update("category", event.target.value)} placeholder="General / OBC / SC / ST / EWS" /></label>
        <label>Sex<input required value={values.sex} onChange={(event) => update("sex", event.target.value)} placeholder="Male / Female / Other" /></label>
      </div>
      <div className="profile-fields">
        <label>Degree<input required value={values.degree} onChange={(event) => update("degree", event.target.value)} /></label>
        <label>Father&apos;s name<input required value={values.father_name} onChange={(event) => update("father_name", event.target.value)} /></label>
        <label>Mobile number<input required value={values.mobile_no} onChange={(event) => update("mobile_no", event.target.value)} /></label>
      </div>
      <label>Permanent address<textarea required value={values.permanent_address} onChange={(event) => update("permanent_address", event.target.value)} rows={3} /></label>
      <label className="profile-check"><input type="checkbox" checked={values.certificate_accepted} onChange={(event) => setValues((current) => ({ ...current, certificate_accepted: event.target.checked }))} /> I certify that the information provided is accurate.</label>
      <button className="button button-accent" disabled={isPending || message === "Loading profile..."} type="submit">{isPending ? "Saving..." : "Save profile"} <span aria-hidden="true">-&gt;</span></button>
      {message && <p className="form-message" role="status">{message}</p>}
    </form>
  );
}