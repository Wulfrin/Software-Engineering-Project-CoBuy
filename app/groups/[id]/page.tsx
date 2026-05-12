import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyInviteButton } from "@/components/copy-invite-button";
import { ArrowLeft, Crown, Users, Plus, ShoppingCart, ChevronRight } from "lucide-react";

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ordering: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  closed: "bg-muted text-muted-foreground",
};

const orderStatusStyles: Record<string, string> = {
  draft:     "bg-muted text-muted-foreground",
  active:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  finalized: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

type UserProfile = { auth_user_id: string; first_name: string; last_name: string; username: string; email: string };

function getDisplayName(uuid: string, profiles: UserProfile[]): string {
  const p = profiles.find((x) => x.auth_user_id === uuid);
  if (!p) return "Member";
  if (p.username) return p.username;
  const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return full || p.email?.split("@")[0] || "Member";
}

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: group, error } = await supabase
    .from("groups")
    .select("*, id:group_id, leader_id:created_by, invite_code:join_code, group_members(user_uuid, joined_at)")
    .eq("group_id", id).single();
  if (error || !group) notFound();

  const { data: orders } = await supabase
    .from("orders")
    .select("order_id, title, status, created_at, products(count)")
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  const memberUuids: string[] = group.group_members?.map((m: { user_uuid: string }) => m.user_uuid) ?? [];
  const { data: profiles } = memberUuids.length
    ? await supabase.from("users").select("auth_user_id, first_name, last_name, username, email").in("auth_user_id", memberUuids)
    : { data: [] };

  const userProfiles: UserProfile[] = profiles ?? [];
  const isLeader = group.leader_id === user?.id;
  const memberCount = group.group_members?.length ?? 0;
  const statusClass = statusStyles[group.status] ?? statusStyles.closed;

  return (
    <div className="space-y-6 max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/groups"><ArrowLeft className="w-4 h-4 mr-1" />Back to Groups</Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="text-3xl font-bold">{group.name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusClass}`}>{group.status}</span>
          </div>
          {isLeader && (
            <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 mb-2">
              <Crown className="w-4 h-4" />You are the Group Leader
            </div>
          )}
          {group.description && <p className="text-muted-foreground">{group.description}</p>}
        </div>
        {isLeader && (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={`/groups/${id}/manage`}>Manage Group</Link>
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Invite Code</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-muted px-4 py-2.5 rounded-md text-lg font-mono tracking-widest text-center select-all">{group.invite_code}</code>
              <CopyInviteButton code={group.invite_code} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Share this code to invite people to the group.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" />Members ({memberCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {group.group_members?.map((member: { user_uuid: string; joined_at: string }) => {
                const isMe = member.user_uuid === user?.id;
                const isMemberLeader = member.user_uuid === group.leader_id;
                const displayName = getDisplayName(member.user_uuid, userProfiles);
                return (
                  <div key={member.user_uuid} className="flex items-center gap-2 text-sm py-1">
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs text-primary font-semibold">{displayName[0]?.toUpperCase() ?? "M"}</span>
                    </div>
                    <span className={isMe ? "font-medium" : ""}>
                      {displayName}{isMe && <span className="text-muted-foreground font-normal ml-1">(you)</span>}
                    </span>
                    {isMemberLeader && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Orders</h2>
          {isLeader && group.status !== "closed" && (
            <Button asChild size="sm">
              <Link href={`/groups/${id}/orders/new`}><Plus className="w-4 h-4 mr-2" />New Order</Link>
            </Button>
          )}
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order: { order_id: string; title: string; status: string; created_at: string; products: { count: number }[] }) => {
              const productCount = order.products?.[0]?.count ?? 0;
              return (
                <Link key={order.order_id} href={`/groups/${id}/orders/${order.order_id}`} className="block">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          <ShoppingCart className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{order.title}</p>
                          <p className="text-xs text-muted-foreground">{productCount} product{productCount !== 1 ? "s" : ""} · {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${orderStatusStyles[order.status] ?? orderStatusStyles.draft}`}>{order.status}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <ShoppingCart className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm mb-1">No orders yet.</p>
              {isLeader && group.status !== "closed" && (
                <Button asChild size="sm" variant="outline" className="mt-4">
                  <Link href={`/groups/${id}/orders/new`}>Create First Order</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}