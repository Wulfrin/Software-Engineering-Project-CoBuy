import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateOrderForm } from "@/components/create-order-form";
import { ArrowLeft } from "lucide-react";

export default async function NewOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: group } = await supabase.from("groups").select("created_by, name, status").eq("group_id", id).single();
  if (!group) notFound();
  if (group.created_by !== user.id) redirect(`/groups/${id}`);
  if (group.status === "closed") redirect(`/groups/${id}`);

  return (
    <div className="max-w-2xl mx-auto">
      <Button asChild variant="ghost" className="mb-4 -ml-2">
        <Link href={`/groups/${id}`}><ArrowLeft className="w-4 h-4 mr-1" />Back to {group.name}</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Create New Order</CardTitle>
          <CardDescription>Add an order for <strong>{group.name}</strong> and specify what products are available.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrderForm groupId={id} />
        </CardContent>
      </Card>
    </div>
  );
}