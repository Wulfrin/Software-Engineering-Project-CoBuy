import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkAllReadButton } from "@/components/mark-all-read-button";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: notifs } = await supabase.from("notifications").select("*").eq("user_uuid", user.id).order("created_at", { ascending: false }).limit(50);
  const unreadCount = (notifs ?? []).filter((n: { read: boolean }) => !n.read).length;
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold">Notifications</h1>{unreadCount > 0 && <p className="text-muted-foreground mt-1">{unreadCount} unread</p>}</div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>
      {notifs && notifs.length > 0 ? (
        <div className="space-y-2">
          {notifs.map((n: { id: string; title: string; message?: string; type: string; link?: string; read: boolean; created_at: string }) => (
            <Card key={n.id} className={n.read ? "opacity-70" : "border-primary/30 bg-primary/5"}>
              <CardContent className="py-3 px-4">
                {n.link ? (
                  <Link href={n.link} className="block">
                    <p className="font-medium text-sm">{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </Link>
                ) : (
                  <div>
                    <p className="font-medium text-sm">{n.title}</p>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="w-10 h-10 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">No notifications yet</h3>
          <p className="text-sm text-muted-foreground">You will be notified about order updates and group activity.</p>
        </CardContent></Card>
      )}
    </div>
  );
}