import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GroupCard } from "@/components/group-card";
import { Users, Plus, LogIn } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: groups } = await supabase
    .from("groups")
    .select("*, group_members(user_id)")
    .order("created_at", { ascending: false })
    .limit(6);

  const firstName = user?.email?.split("@")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {firstName}!</h1>
        <p className="text-muted-foreground mt-1">
          Manage your group purchases below.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
        <Button asChild size="lg" className="h-14 flex items-center gap-2">
          <Link href="/groups/new">
            <Plus className="w-5 h-5" />
            Create a Group
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-14 flex items-center gap-2"
        >
          <Link href="/groups/join">
            <LogIn className="w-5 h-5" />
            Join with Code
          </Link>
        </Button>
      </div>

      {/* My Groups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Groups</h2>
          {groups && groups.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/groups">View all →</Link>
            </Button>
          )}
        </div>

        {groups && groups.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                currentUserId={user?.id ?? ""}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No groups yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-6">
                Create your first purchasing group or join an existing one with
                an invite code.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="/groups/new">Create a Group</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/groups/join">Join with Code</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
