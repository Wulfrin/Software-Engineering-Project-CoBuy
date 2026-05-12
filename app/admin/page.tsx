import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Users2, ShoppingCart, CheckCircle } from "lucide-react";
export default async function AdminPage() {
  const supabase = await createClient();
  const [{ count: userCount }, { count: groupCount }, { count: orderCount }, { count: completedCount }] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("groups").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed"),
  ]);
  const stats = [
    { label: "Total Users", value: userCount ?? 0, icon: Users },
    { label: "Total Groups", value: groupCount ?? 0, icon: Users2 },
    { label: "Total Orders", value: orderCount ?? 0, icon: ShoppingCart },
    { label: "Completed Orders", value: completedCount ?? 0, icon: CheckCircle },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-3xl font-bold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}