import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddProductForm } from "@/components/add-product-form";
import { ArrowLeft } from "lucide-react";
export default async function AddProductPage({ params }: { params: Promise<{ id: string; orderId: string }> }) {
  const { id, orderId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: group } = await supabase.from("groups").select("created_by, name").eq("group_id", id).single();
  if (!group || group.created_by !== user.id) redirect(`/groups/${id}/orders/${orderId}`);
  const { data: order } = await supabase.from("orders").select("title, status").eq("order_id", orderId).single();
  if (!order || order.status === "completed") redirect(`/groups/${id}/orders/${orderId}`);
  return (
    <div className="max-w-xl mx-auto">
      <Button asChild variant="ghost" className="mb-4 -ml-2"><Link href={`/groups/${id}/orders/${orderId}`}><ArrowLeft className="w-4 h-4 mr-1" />Back to order</Link></Button>
      <Card>
        <CardHeader><CardTitle>Add Product</CardTitle><CardDescription>Add a product to <strong>{order.title}</strong>.</CardDescription></CardHeader>
        <CardContent><AddProductForm groupId={id} orderId={orderId} /></CardContent>
      </Card>
    </div>
  );
}