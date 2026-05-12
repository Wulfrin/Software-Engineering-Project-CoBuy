import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only the group leader can remove members
    const { data: group } = await supabase.from("groups").select("created_by").eq("group_id", id).single();
    if (group?.created_by !== user.id)
      return NextResponse.json({ error: "Only the group leader can remove members" }, { status: 403 });

    // Cannot remove the leader themselves
    if (userId === user.id)
      return NextResponse.json({ error: "The group leader cannot remove themselves" }, { status: 400 });

    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", id)
      .eq("user_uuid", userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}