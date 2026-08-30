"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

type Notice = {
  id: string;
  title: string;
  body: string | null;
  category?: string;
  attachment_url?: string | null;
  archived?: boolean;
  created_at: string;
  drives?: { title: string } | null;
};

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [uploadingNoticeId, setUploadingNoticeId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/notices")
      .then(async (res) => {
        const result = await res.json();
        if (isMounted) {
          if (res.ok && result.data) {
            setNotices(result.data.items ?? result.data ?? []);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, category }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message ?? "Unable to create notice.");
      setNotices((prev) => [result.data, ...prev]);
      setTitle("");
      setBody("");
      setCategory("general");
      setMessage("Notice published to all students and faculty. You may now attach supporting files.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create notice.");
    } finally {
      setPending(false);
    }
  }

  async function handleAttachmentUpload(noticeId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingNoticeId(noticeId);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/notices/${noticeId}/attachment`, {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error?.message ?? "Attachment upload failed.");

      setNotices((prev) =>
        prev.map((n) => (n.id === noticeId ? { ...n, attachment_url: result.data.attachment_url } : n))
      );
      setMessage("Notice attachment uploaded successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Attachment upload failed.");
    } finally {
      setUploadingNoticeId(null);
      event.target.value = "";
    }
  }

  return (
    <main className="portal-page">
      <header className="portal-header">
        <Link className="brand" href="/admin/dashboard">
          <span className="brand-mark">PP</span>
          <span>
            <strong>Placement Portal</strong>
            <small>GBPUAT Pantnagar</small>
          </span>
        </Link>
        <Link className="text-link" href="/admin/dashboard">
          Admin dashboard
        </Link>
      </header>

      <section className="admin-content">
        <p className="eyebrow">Notice Board Management</p>
        <h1>Put the right information in reach.</h1>
        <p className="dashboard-copy">
          Notices are visible to all students and faculty across College of Technology, permanently recorded, and support PDF/image attachments.
        </p>

        {/* Publish Notice Form */}
        <form className="admin-form" onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "36px" }}>
          <label style={{ gridColumn: "1 / 2" }}>
            Notice Title *
            <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Mandatory Pre-Placement Talk: TCS" />
          </label>
          <label style={{ gridColumn: "2 / 3" }}>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="policy">Placement Policy</option>
              <option value="drive">Drive Specific</option>
            </select>
          </label>
          <label style={{ gridColumn: "1 / -1" }}>
            Message Body *
            <textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="Write complete notice details, schedule, venue..." />
          </label>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "16px" }}>
            <button className="button button-accent" disabled={pending} type="submit">
              {pending ? "Publishing..." : "Publish Notice"} <span aria-hidden="true">-&gt;</span>
            </button>
            {message && <span style={{ fontSize: "0.9rem", color: message.includes("success") || message.includes("published") ? "#198754" : "#dc3545" }}>{message}</span>}
          </div>
        </form>

        {/* Notice list */}
        <div className="admin-list">
          <h2>Active Notices ({notices.length})</h2>
          {loading ? (
            <p className="dashboard-copy">Loading notices...</p>
          ) : notices.length ? (
            notices.map((n) => (
              <div className="admin-list-item" key={n.id} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span className="card-kicker" style={{ textTransform: "capitalize" }}>
                      {n.category ?? "General"}{n.drives?.title ? ` • ${n.drives.title}` : ""}
                    </span>
                    <h3 style={{ margin: "2px 0" }}>{n.title}</h3>
                  </div>
                  <time style={{ fontSize: "0.8rem", color: "var(--text-muted, #6c757d)" }}>
                    {new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </time>
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-color, #495057)", whiteSpace: "pre-line" }}>
                  {n.body}
                </p>

                {/* Attachment Manager */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid var(--border-color, #f1f3f5)", paddingTop: "8px", fontSize: "0.85rem" }}>
                  {n.attachment_url ? (
                    <span style={{ color: "#198754", fontWeight: 500 }}>📎 Attachment Attached</span>
                  ) : (
                    <span style={{ color: "var(--text-muted, #6c757d)" }}>No attachment</span>
                  )}
                  <label style={{ cursor: "pointer", color: "#0d6efd", textDecoration: "underline", margin: 0 }}>
                    {uploadingNoticeId === n.id ? "Uploading..." : n.attachment_url ? "Replace Attachment" : "Attach Document/PDF"}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/*"
                      style={{ display: "none" }}
                      disabled={uploadingNoticeId === n.id}
                      onChange={(e) => void handleAttachmentUpload(n.id, e)}
                    />
                  </label>
                </div>
              </div>
            ))
          ) : (
            <p className="dashboard-copy">No notices published yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}