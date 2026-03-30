import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GroupCard } from "@/components/group-card";
import { Users, Plus, LogIn } from "lucide-react";

export default async function GroupsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: groups } = await supabase
    .from("groups")
    .select("*, group_members(user_id)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Groups</h1>
          <p className="text-muted-foreground mt-1">
            All purchasing groups you belong to
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/groups/join">
              <LogIn className="w-4 h-4 mr-2" />
              Join Group
            </Link>
          </Button>
          <Button asChild>
            <Link href="/groups/new">
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Link>
          </Button>
        </div>
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
              You are not a member of any purchasing groups yet.
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
  );
}
