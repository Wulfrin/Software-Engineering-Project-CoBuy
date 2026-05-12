import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// PUT: upsert all allocations for the current user on this order
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: order } = await supabase.from("orders").select("status").eq("order_id", orderId).single();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status === "finalized" || order.status === "completed")
      return NextResponse.json({ error: "Order is locked" }, { status: 400 });

    const { allocations } = await req.json() as { allocations: { product_id: string; quantity: number }[] };
    if (!Array.isArray(allocations)) return NextResponse.json({ error: "allocations array required" }, { status: 400 });

    const rows = allocations.map((a) => ({
      order_id: orderId,
      product_id: a.product_id,
      user_uuid: user.id,
      quantity: Math.max(0, Math.floor(Number(a.quantity) || 0)),
    }));

    const { error } = await supabase.from("order_items").upsert(rows, {
      onConflict: "order_id,product_id,user_uuid",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}