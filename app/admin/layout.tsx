import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/navbar";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await supabase.from("users").select("app_role").eq("auth_user_id", user.id).single();
  if (profile?.app_role !== "admin") redirect("/dashboard");
  const { data: claims } = await supabase.auth.getClaims();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar userEmail={claims?.claims?.email as string} />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded font-semibold">ADMIN</span>
          <nav className="flex gap-3 text-sm">
            <a href="/admin" className="hover:underline">Dashboard</a>
            <a href="/admin/users" className="hover:underline">Users</a>
            <a href="/admin/groups" className="hover:underline">Groups</a>
          </nav>
        </div>
        {children}
      </div>
    </div>
  );
}