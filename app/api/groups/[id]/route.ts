import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: group, error } = await supabase
      .from("groups")
      .select(`*, id:group_id, leader_id:created_by, invite_code:join_code, group_members(user_uuid, joined_at)`)
      .eq("group_id", id).single();

    if (error || !group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    return NextResponse.json(group);
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (!body.name?.trim()) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      updateData.name = body.name.trim();
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }
    if (body.status !== undefined) {
      const valid = ["active", "ordering", "closed"];
      if (!valid.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      updateData.status = body.status;
    }
    if (!Object.keys(updateData).length)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    const { data: group, error: updateError } = await supabase
      .from("groups").update(updateData)
      .eq("group_id", id).eq("created_by", user.id)
      .select().single();

    if (updateError || !group)
      return NextResponse.json({ error: "Failed to update or insufficient permissions" }, { status: 403 });

    return NextResponse.json({ ...group, id: group.group_id });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}