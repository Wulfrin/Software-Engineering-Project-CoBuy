import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("orders")
      .select("*, products(*), order_items(*)")
      .eq("order_id", orderId)
      .single();

    if (error || !data) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id, orderId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status } = await req.json();
    const valid = ["draft", "active", "finalized", "completed"];
    if (!valid.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    // Only group leader can change status (created_by on groups)
    const { data: group } = await supabase.from("groups").select("created_by").eq("group_id", id).single();
    if (group?.created_by !== user.id) return NextResponse.json({ error: "Only the group leader can change order status" }, { status: 403 });

    const extra = status === "finalized" ? { finalized_at: new Date().toISOString() } : {};
    const { data, error } = await supabase
      .from("orders").update({ status, ...extra })
      .eq("order_id", orderId).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}