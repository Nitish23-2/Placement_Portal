"use client";

import { useEffect, useState } from "react";

type Notification = { id: string; title: string; body: string | null; read_at: string | null; created_at: string };

export function NotificationInbox() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => { fetch("/api/notifications").then(async (response) => { if (!response.ok) return; const result = await response.json(); setItems(result.data?.items ?? []); }).catch(() => undefined); }, []);
  async function markRead() { await fetch("/api/notifications", { method: "PATCH" }); setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() }))); }
  const unread = items.filter((item) => !item.read_at).length;
  return <div className="notification-inbox"><button className="notification-button" type="button" onClick={() => { setOpen((current) => !current); if (!open && unread) void markRead(); }} aria-expanded={open} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>Notifications {unread > 0 && <span>{unread}</span>}</button>{open && <div className="notification-panel"><strong>Notifications</strong>{items.length ? items.map((item) => <article key={item.id}><b>{item.title}</b><p>{item.body}</p><time>{new Date(item.created_at).toLocaleDateString("en-IN")}</time></article>) : <p className="dashboard-copy">No notifications yet.</p>}</div>}</div>;
}