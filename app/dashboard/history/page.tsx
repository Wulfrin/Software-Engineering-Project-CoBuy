import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, CheckCircle, Clock, ChevronRight } from "lucide-react";

const statusStyles: Record<string, string> = {
  finalized: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Get all orders the user has allocations in, with computed cost
  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, quantity, products(unit_price, orders(order_id, title, status, finalized_at, group_id, groups(name)))")
    .eq("user_uuid", user.id)
    .gt("quantity", 0);

  // Group by order
  const orderMap: Record<string, { order_id: string; title: string; status: string; finalized_at: string | null; group_id: string; group_name: string; my_cost: number }> = {};
  for (const item of items ?? []) {
    const product = item.products as unknown as { unit_price: number; orders: { order_id: string; title: string; status: string; finalized_at: string | null; group_id: string; groups: { name: string } } };
    if (!product?.orders) continue;
    const o = product.orders;
    if (!["finalized", "completed"].includes(o.status)) continue;
    if (!orderMap[o.order_id]) {
      orderMap[o.order_id] = { order_id: o.order_id, title: o.title, status: o.status, finalized_at: o.finalized_at, group_id: o.group_id, group_name: o.groups?.name ?? "Group", my_cost: 0 };
    }
    orderMap[o.order_id].my_cost += item.quantity * product.unit_price;
  }

  // Get payment status for user across these orders
  const orderIds = Object.keys(orderMap);
  const { data: contribs } = orderIds.length
    ? await supabase.from("contributions").select("order_id, paid").eq("user_uuid", user.id).in("order_id", orderIds)
    : { data: [] };

  const history = Object.values(orderMap)
    .sort((a, b) => new Date(b.finalized_at ?? 0).getTime() - new Date(a.finalized_at ?? 0).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Purchase History</h1>
        <p className="text-muted-foreground mt-1">All finalized and completed orders you participated in.</p>
      </div>

      {history.length > 0 ? (
        <div className="space-y-3">
          {history.map((h) => {
            const contrib = (contribs ?? []).find((c: { order_id: string }) => c.order_id === h.order_id);
            const paid = contrib?.paid ?? false;
            return (
              <Link key={h.order_id} href={`/groups/${h.group_id}/orders/${h.order_id}`} className="block">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{h.title}</p>
                        <p className="text-xs text-muted-foreground">{h.group_name} · {h.finalized_at ? new Date(h.finalized_at).toLocaleDateString() : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">${h.my_cost.toFixed(2)}</p>
                        <div className="flex items-center gap-1 justify-end">
                          {paid
                            ? <><CheckCircle className="w-3 h-3 text-green-600" /><span className="text-xs text-green-600">Paid</span></>
                            : <><Clock className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Unpaid</span></>}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusStyles[h.status] ?? ""}`}>{h.status}</span>
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
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="w-10 h-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No purchase history yet</h3>
            <p className="text-sm text-muted-foreground">Once group orders are finalized, they will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}