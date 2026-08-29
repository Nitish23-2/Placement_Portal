"use client";

import { ChangeEvent, useEffect, useState } from "react";

interface StudentDocument {
  id: string;
  doc_type: string;
  file_url: string;
  uploaded_at: string;
}

export function UploadFields() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);

  useEffect(() => {
    fetch("/api/students/me")
      .then(async (res) => {
        const data = await res.json();
        if (data?.data) {
          setResumeUrl(data.data.resume_url ?? null);
          setPhotoUrl(data.data.photo_url ?? null);
          setDocuments(data.data.student_documents ?? []);
        }
      })
      .catch(() => undefined);
  }, []);

  async function upload(url: string, body: FormData, input: HTMLInputElement, kind: "resume" | "photo" | "document") {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(url, { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message ?? "Upload failed.");
      setMessage("File uploaded successfully.");
      input.value = "";
      if (kind === "resume" && result.data?.resume_url) {
        setResumeUrl(result.data.resume_url);
      } else if (kind === "photo" && result.data?.photo_url) {
        setPhotoUrl(result.data.photo_url);
      } else if (kind === "document" && result.data) {
        setDocuments((prev) => [result.data, ...prev]);
      }
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
    void upload("/api/students/me/resume", body, event.target, "resume");
  }

  function documentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    body.append("doc_type", "supporting_document");
    void upload("/api/students/me/documents", body, event.target, "document");
  }

  function photoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append("file", file);
    void upload("/api/students/me/photo", body, event.target, "photo");
  }

  return (
    <section className="upload-fields" aria-labelledby="upload-title">
      <h2 id="upload-title">Supporting files &amp; Documents</h2>
      <div className="upload-grid">
        <label>
          Profile photo (JPEG or PNG, max 5MB)
          <input type="file" accept="image/jpeg,image/png" disabled={pending} onChange={photoChange} />
          <span className="field-hint">{photoUrl ? `Current photo uploaded (${photoUrl.split("/").pop()})` : "No photo uploaded yet"}</span>
        </label>
        <label>
          Resume PDF (Max 5MB)
          <input type="file" accept="application/pdf" disabled={pending} onChange={resumeChange} />
          {resumeUrl ? (
            <span className="field-hint" style={{ color: "#3b5c1c", fontWeight: 600 }}>
              ✓ Current resume uploaded ({resumeUrl.split("/").pop()})
            </span>
          ) : (
            <span className="field-hint">No resume uploaded yet</span>
          )}
        </label>
        <label>
          Supporting document (PDF, JPEG, PNG)
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            disabled={pending}
            onChange={documentChange}
          />
          {documents.length > 0 ? (
            <span className="field-hint" style={{ color: "#3b5c1c", fontWeight: 600 }}>
              ✓ {documents.length} document(s) on file
            </span>
          ) : (
            <span className="field-hint">Report cards, undertakings, ID proofs</span>
          )}
        </label>
      </div>
      {documents.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <p className="eyebrow">Uploaded documents</p>
          <ul style={{ paddingLeft: "20px", fontSize: "13px", color: "var(--muted)" }}>
            {documents.map((doc) => (
              <li key={doc.id}>
                {doc.doc_type} · {new Date(doc.uploaded_at).toLocaleDateString("en-IN")}
              </li>
            ))}
          </ul>
        </div>
      )}
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
    </section>
  );
}