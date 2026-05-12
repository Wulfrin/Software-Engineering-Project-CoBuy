import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("orders")
      .select("*, products(count)")
      .eq("group_id", id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, products } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({ group_id: id, title: title.trim(), description: description?.trim() || null, created_by: user.id, status: "draft" })
      .select().single();
    if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 });

    if (products?.length) {
      const rows = products
        .filter((p: { name?: string }) => p.name?.trim())
        .map((p: { name: string; unit_price: number; total_quantity?: number; description?: string }) => ({
          order_id: order.order_id,
          name: p.name.trim(),
          unit_price: Number(p.unit_price) || 0,
          total_quantity: p.total_quantity ? Number(p.total_quantity) : null,
          description: p.description?.trim() || null,
          added_by: user.id,
        }));
      if (rows.length) {
        const { error: prodErr } = await supabase.from("products").insert(rows);
        if (prodErr) return NextResponse.json({ error: prodErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ order_id: order.order_id }, { status: 201 });
  } catch { return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}