"use client";

import { ChangeEvent, useState } from "react";

export function UploadFields() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function upload(url: string, body: FormData, input: HTMLInputElement) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(url, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Upload failed.");
      setMessage("File uploaded successfully.");
      input.value = "";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setPending(false);
    }
  }

  function resumeChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    void upload("/api/students/me/resume", body, event.target);
  }

  function documentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    body.append("doc_type", "supporting_document");
    void upload("/api/students/me/documents", body, event.target);
  }

  return <section className="upload-fields" aria-labelledby="upload-title"><h2 id="upload-title">Supporting files</h2><div className="upload-grid"><label>Resume PDF<input type="file" accept="application/pdf" disabled={pending} onChange={resumeChange} /></label><label>Supporting document<input type="file" accept="application/pdf,image/jpeg,image/png" disabled={pending} onChange={documentChange} /></label></div>{message && <p className="form-message" role="status">{message}</p>}</section>;
}