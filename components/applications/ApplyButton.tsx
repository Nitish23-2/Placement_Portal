"use client";

import { useState } from "react";

export function ApplyButton({ driveId }: { driveId: string }) {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function apply() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ drive_id: driveId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Unable to apply.");
      setMessage("Application submitted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to apply.");
    } finally {
      setPending(false);
    }
  }

  return <div className="apply-action"><button className="button button-accent" disabled={pending} onClick={apply}>{pending ? "Submitting..." : "Apply to this drive"} <span aria-hidden="true">-&gt;</span></button>{message && <p className="form-message" role="status">{message}</p>}</div>;
}