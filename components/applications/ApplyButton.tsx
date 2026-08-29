"use client";

import Link from "next/link";
import { useState } from "react";

export function ApplyButton({ driveId }: { driveId: string }) {
  const [message, setMessage] = useState("");
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [pending, setPending] = useState(false);
  const [applied, setApplied] = useState(false);

  async function apply() {
    setPending(true);
    setMessage("");
    setIsProfileIncomplete(false);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drive_id: driveId }),
      });
      const result = await response.json();

      if (!response.ok) {
        if (result.error?.code === "PROFILE_INCOMPLETE") {
          setIsProfileIncomplete(true);
        }
        throw new Error(result.error?.message ?? "Unable to apply.");
      }

      setApplied(true);
      setMessage("Application submitted successfully. Check your dashboard for updates.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to apply.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="apply-action">
      {!applied ? (
        <button className="button button-accent" disabled={pending} onClick={apply}>
          {pending ? "Submitting..." : "Apply to this drive"} <span aria-hidden="true">-&gt;</span>
        </button>
      ) : (
        <span className="status-pill" style={{ background: "#d1e7dd", color: "#0f5132", padding: "10px 16px" }}>
          ✓ Applied
        </span>
      )}

      {message && (
        <div style={{ marginTop: "12px" }}>
          <p className="form-message" role="status">
            {message}
          </p>
          {isProfileIncomplete && (
            <Link
              className="button button-quiet"
              href="/profile"
              style={{ display: "inline-block", marginTop: "8px" }}
            >
              Go to Profile Form &rarr;
            </Link>
          )}
        </div>
      )}
    </div>
  );
}