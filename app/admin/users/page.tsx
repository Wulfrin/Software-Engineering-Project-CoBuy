import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminRoleSelect } from "@/components/admin-role-select";
export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: users } = await supabase.from("users").select("user_id, auth_user_id, email, username, first_name, last_name, app_role, is_active, created_at").order("created_at", { ascending: false });
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Users ({users?.length ?? 0})</h1>
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {(users ?? []).map((u: { user_id: number; auth_user_id: string; email: string; username?: string; first_name?: string; last_name?: string; app_role: string; is_active: boolean; created_at: string }) => {
              const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.email?.split("@")[0];
              return (
                <div key={u.user_id} className="flex items-center justify-between px-4 py-3 gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                  <AdminRoleSelect userId={u.auth_user_id} currentRole={u.app_role} />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}