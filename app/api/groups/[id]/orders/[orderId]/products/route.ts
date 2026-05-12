import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; orderId: string }> }
) {
  try {
    const { id, orderId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: group } = await supabase.from("groups").select("created_by").eq("group_id", id).single();
    if (group?.created_by !== user.id) return NextResponse.json({ error: "Only the group leader can add products" }, { status: 403 });

    const { name, description, unit_price, total_quantity } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    if (unit_price === undefined || Number(unit_price) < 0) return NextResponse.json({ error: "Valid unit price is required" }, { status: 400 });

    const { data, error } = await supabase.from("products").insert({
      order_id: orderId, name: name.trim(),
      description: description?.trim() || null,
      unit_price: Number(unit_price),
      total_quantity: total_quantity ? Number(total_quantity) : null,
      added_by: user.id,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}