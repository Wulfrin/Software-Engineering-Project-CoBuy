import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET: compute each member's cost share + fetch paid status
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id, orderId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get all items with product prices
    const { data: items } = await supabase
      .from("order_items")
      .select("user_uuid, quantity, products(unit_price)")
      .eq("order_id", orderId);

    // Get paid status
    const { data: contribs } = await supabase
      .from("contributions").select("user_uuid, paid, paid_at").eq("order_id", orderId);

    // Get member profiles
    const { data: members } = await supabase
      .from("group_members").select("user_uuid").eq("group_id", id).eq("membership_status", "active");

    const memberUuids = (members ?? []).map((m: { user_uuid: string }) => m.user_uuid);
    const { data: profiles } = memberUuids.length
      ? await supabase.from("users").select("auth_user_id, username, first_name, last_name, email").in("auth_user_id", memberUuids)
      : { data: [] };

    function getName(uuid: string) {
      const p = (profiles ?? []).find((x: { auth_user_id: string }) => x.auth_user_id === uuid) as { username?: string; first_name?: string; last_name?: string; email?: string } | undefined;
      if (!p) return "Member";
      if (p.username) return p.username;
      const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
      return full || p.email?.split("@")[0] || "Member";
    }

    // Group items by user and compute totals
    const totals: Record<string, number> = {};
    for (const item of items ?? []) {
      const price = (item.products as unknown as { unit_price: number })?.unit_price ?? 0;
      totals[item.user_uuid] = (totals[item.user_uuid] ?? 0) + item.quantity * price;
    }

    const result = Object.entries(totals)
      .filter(([, amount]) => amount > 0)
      .map(([uuid, amount]) => {
        const c = (contribs ?? []).find((x: { user_uuid: string }) => x.user_uuid === uuid);
        return { user_uuid: uuid, name: getName(uuid), amount, paid: c?.paid ?? false, paid_at: c?.paid_at ?? null };
      });

    return NextResponse.json(result);
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

// PATCH: leader marks a member as paid/unpaid
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id, orderId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: group } = await supabase.from("groups").select("created_by").eq("group_id", id).single();
    if (group?.created_by !== user.id)
      return NextResponse.json({ error: "Only the group leader can mark contributions" }, { status: 403 });

    const { user_uuid, paid } = await req.json();
    if (!user_uuid) return NextResponse.json({ error: "user_uuid required" }, { status: 400 });

    const { error } = await supabase.from("contributions").upsert({
      order_id: orderId, user_uuid,
      paid: !!paid,
      paid_at: paid ? new Date().toISOString() : null,
      marked_by: user.id,
    }, { onConflict: "order_id,user_uuid" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify the member if marking as paid
    if (paid) {
      const { data: order } = await supabase.from("orders").select("title, group_id").eq("order_id", orderId).single();
      await supabase.from("notifications").insert({
        user_uuid, title: "Payment confirmed",
        message: `Your contribution for "${order?.title}" has been marked as paid.`,
        type: "payment", link: `/groups/${id}/orders/${orderId}`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}