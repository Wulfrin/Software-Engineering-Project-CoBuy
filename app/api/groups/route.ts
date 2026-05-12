import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: groups, error } = await supabase
      .from("groups")
      .select(`
        *,
        id:group_id,
        leader_id:created_by,
        invite_code:join_code,
        group_members(user_uuid)
      `)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(groups ?? []);
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, description } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "Group name is required" }, { status: 400 });
    if (name.length > 100) return NextResponse.json({ error: "Group name must be 100 characters or less" }, { status: 400 });

    // Use RPC to bypass RLS (same pattern as join_group)
    const { data: result, error: rpcError } = await supabase.rpc("create_group", {
      p_name: name.trim(),
      p_description: description?.trim() || null,
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (!result?.success) {
      return NextResponse.json({ error: result?.error ?? "Failed to create group" }, { status: 500 });
    }

    return NextResponse.json({ id: result.group_id, ...result }, { status: 201 });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}