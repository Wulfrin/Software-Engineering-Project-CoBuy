import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase.from("users").select("app_role").eq("auth_user_id", userId).single();
  return data?.app_role === "admin";
}
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkAdmin(supabase, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkAdmin(supabase, user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { auth_user_id, app_role } = await req.json();
  const valid = ["member", "leader", "admin"];
  if (!auth_user_id || !valid.includes(app_role)) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { error } = await supabase.from("users").update({ app_role }).eq("auth_user_id", auth_user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}