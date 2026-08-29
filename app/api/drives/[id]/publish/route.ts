import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  const { data: drive, error: driveError } = await auth.supabase.from("drives").select("id, title, description, company_id, status").eq("id", id).maybeSingle();
  if (driveError) return NextResponse.json({ data: null, error: { message: driveError.message, code: "DATABASE_ERROR" } }, { status: 500 });
  if (!drive) return NextResponse.json({ data: null, error: { message: "Drive not found.", code: "NOT_FOUND" } }, { status: 404 });
  if (drive.status !== "draft") return NextResponse.json({ data: null, error: { message: "Only draft drives can be published.", code: "VALIDATION_ERROR" } }, { status: 400 });
  const { data: published, error } = await auth.supabase.from("drives").update({ status: "published" }).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  const { error: noticeError } = await auth.supabase.from("notices").insert({ title: `New drive: ${drive.title}`, body: drive.description ?? "A new placement drive is now open. Review the drive details and apply if it suits you.", drive_id: drive.id, posted_by: auth.user.id });
  if (noticeError) return NextResponse.json({ data: null, error: { message: noticeError.message, code: "DATABASE_ERROR" } }, { status: 500 });
  return NextResponse.json({ data: published, error: null });
}