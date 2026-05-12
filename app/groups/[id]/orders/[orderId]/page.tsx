import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderAllocationForm } from "@/components/order-allocation-form";
import { CostSplitTable } from "@/components/cost-split-table";
import { ArrowLeft, Crown, Plus } from "lucide-react";

const statusStyles: Record<string, string> = {
  draft:     "bg-muted text-muted-foreground",
  active:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  finalized: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const STATUS_FLOW: Record<string, string> = {
  draft: "active", active: "finalized", finalized: "completed",
};
const STATUS_LABELS: Record<string, string> = {
  draft: "Activate Order", active: "Finalize Order", finalized: "Mark Completed",
};

type UserProfile = { auth_user_id: string; first_name: string; last_name: string; username: string; email: string };

function getDisplayName(uuid: string, profiles: UserProfile[]): string {
  const p = profiles.find((x) => x.auth_user_id === uuid);
  if (!p) return "Member";
  if (p.username) return p.username;
  const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return full || p.email?.split("@")[0] || "Member";
}

export default async function OrderDetailPage({
  params,
}: { params: Promise<{ id: string; orderId: string }> }) {
  const { id: groupId, orderId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, products(*), order_items(*)")
    .eq("order_id", orderId)
    .single();
  if (error || !order) notFound();

  const { data: group } = await supabase.from("groups")
    .select("name, created_by, group_members(user_uuid)")
    .eq("group_id", groupId).single();
  if (!group) notFound();

  const memberUuids: string[] = (group.group_members ?? []).map((m: { user_uuid: string }) => m.user_uuid);
  const { data: profiles } = memberUuids.length
    ? await supabase.from("users").select("auth_user_id, first_name, last_name, username, email").in("auth_user_id", memberUuids)
    : { data: [] };

  const userProfiles: UserProfile[] = profiles ?? [];
  const isLeader = group.created_by === user.id;
  const isLocked = order.status === "finalized" || order.status === "completed";
  const myItems = (order.order_items ?? []).filter((i: { user_uuid: string }) => i.user_uuid === user.id);
  const members = memberUuids.map((uuid) => ({ uuid, name: getDisplayName(uuid, userProfiles) }));
  const nextStatus = STATUS_FLOW[order.status];

  return (
    <div className="space-y-6 max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/groups/${groupId}`}><ArrowLeft className="w-4 h-4 mr-1" />Back to {group.name}</Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="text-3xl font-bold">{order.title}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusStyles[order.status] ?? statusStyles.draft}`}>
              {order.status}
            </span>
          </div>
          {order.description && <p className="text-muted-foreground">{order.description}</p>}
        </div>
        {isLeader && (
          <div className="flex gap-2 shrink-0 flex-wrap">
            {order.status !== "completed" && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/groups/${groupId}/orders/${orderId}/products/new`}>
                  <Plus className="w-4 h-4 mr-1" /> Add Product
                </Link>
              </Button>
            )}
            {nextStatus && (
              <form action={async () => {
                "use server";
                const s = await createClient();
                await s.from("orders").update({ status: nextStatus, ...(nextStatus === "finalized" ? { finalized_at: new Date().toISOString() } : {}) }).eq("order_id", orderId);
              }}>
                <Button size="sm" type="submit">
                  <Crown className="w-4 h-4 mr-1" />{STATUS_LABELS[order.status]}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* My Allocation */}
      <div>
        <h2 className="text-lg font-semibold mb-3">My Allocation</h2>
        <OrderAllocationForm
          groupId={groupId} orderId={orderId}
          products={order.products ?? []}
          myItems={myItems} isLocked={isLocked}
        />
      </div>

      {/* Cost Split Summary */}
      {(order.order_items?.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Group Cost Split</CardTitle>
          </CardHeader>
          <CardContent>
            <CostSplitTable products={order.products ?? []} items={order.order_items ?? []} members={members} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}