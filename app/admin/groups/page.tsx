import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
const statusStyles: Record<string, string> = { active: "text-green-600", ordering: "text-blue-600", closed: "text-muted-foreground" };
export default async function AdminGroupsPage() {
  const supabase = await createClient();
  const { data: groups } = await supabase.from("groups").select("group_id, name, status, created_at, group_members(count), orders(count)").order("created_at", { ascending: false });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Groups ({groups?.length ?? 0})</h1>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {(groups ?? []).map((g: { group_id: string; name: string; status: string; created_at: string; group_members: { count: number }[]; orders: { count: number }[] }) => (
              <Link key={g.group_id} href={`/groups/${g.group_id}`} className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.group_members?.[0]?.count ?? 0} members · {g.orders?.[0]?.count ?? 0} orders · {new Date(g.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium capitalize ${statusStyles[g.status] ?? ""}`}>{g.status}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}