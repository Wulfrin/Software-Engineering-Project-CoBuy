import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: group, error } = await supabase
      .from("groups")
      .select(
        `
        *,
        id:group_id,
        leader_id:created_by,
        invite_code:join_code,
        group_members(user_uuid, joined_at)
      `
      )
      .eq("group_id", id)
      .single();

    if (error || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();
    const validStatuses = ["active", "ordering", "closed"];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: active, ordering, closed" },
        { status: 400 }
      );
    }

    // Only the group leader (created_by) can update
    const { data: group, error: updateError } = await supabase
      .from("groups")
      .update({ status })
      .eq("group_id", id)
      .eq("created_by", user.id)
      .select()
      .single();

    if (updateError || !group) {
      return NextResponse.json(
        { error: "Failed to update group or insufficient permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json({ ...group, id: group.group_id });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
