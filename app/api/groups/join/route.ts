import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { code } = await request.json();
    if (!code?.trim()) return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    const { data: result, error: rpcError } = await supabase.rpc("join_group", { join_code_param: code.trim().toUpperCase() });
    if (rpcError) return NextResponse.json({ error: "Failed to join group" }, { status: 500 });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    // Notify the group leader
    const group = result.group;
    if (group?.created_by && group.created_by !== user.id) {
      const { data: joinerProfile } = await supabase.from("users").select("username, first_name, last_name, email").eq("auth_user_id", user.id).single();
      const joinerName = joinerProfile?.username || [joinerProfile?.first_name, joinerProfile?.last_name].filter(Boolean).join(" ").trim() || user.email?.split("@")[0] || "Someone";
      await supabase.from("notifications").insert({
        user_uuid: group.created_by,
        title: "New member joined",
        message: `${joinerName} joined your group "${group.name}".`,
        type: "member_join",
        link: `/groups/${group.group_id}/manage`,
      });
    }
    return NextResponse.json({ message: "Successfully joined the group", group: result.group }, { status: 200 });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}