import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManageGroupForm } from "@/components/manage-group-form";
import { ManageMembersList } from "@/components/manage-members-list";
import { ArrowLeft, AlertTriangle, Copy } from "lucide-react";
import { CopyInviteButton } from "@/components/copy-invite-button";

type UserProfile = { auth_user_id: string; first_name: string; last_name: string; username: string; email: string };

function getDisplayName(uuid: string, profiles: UserProfile[]): string {
  const p = profiles.find((x) => x.auth_user_id === uuid);
  if (!p) return "Member";
  if (p.username) return p.username;
  const full = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  return full || p.email?.split("@")[0] || "Member";
}

export default async function ManageGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: group, error } = await supabase
    .from("groups")
    .select("*, id:group_id, leader_id:created_by, invite_code:join_code, group_members(user_uuid, joined_at, group_role)")
    .eq("group_id", id).single();
  if (error || !group) notFound();

  // Only the group leader can access this page
  if (group.leader_id !== user.id) redirect(`/groups/${id}`);

  const memberUuids: string[] = group.group_members?.map((m: { user_uuid: string }) => m.user_uuid) ?? [];
  const { data: profiles } = memberUuids.length
    ? await supabase.from("users").select("auth_user_id, first_name, last_name, username, email").in("auth_user_id", memberUuids)
    : { data: [] };

  const userProfiles: UserProfile[] = profiles ?? [];

  const members = (group.group_members ?? []).map((m: { user_uuid: string; joined_at: string; group_role: string }) => ({
    user_uuid: m.user_uuid,
    name: getDisplayName(m.user_uuid, userProfiles),
    role: m.group_role,
    joinedAt: m.joined_at,
    isLeader: m.user_uuid === group.leader_id,
    isMe: m.user_uuid === user.id,
  }));

  // Sort: leader first, then by join date
  members.sort((a: { isLeader: boolean; joinedAt: string }, b: { isLeader: boolean; joinedAt: string }) => {
    if (a.isLeader) return -1;
    if (b.isLeader) return 1;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  const isClosed = group.status === "closed";

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/groups/${id}`}><ArrowLeft className="w-4 h-4 mr-1" />Back to {group.name}</Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Manage Group</h1>
        <p className="text-muted-foreground mt-1">{group.name}</p>
      </div>

      {/* Group Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Group Settings</CardTitle>
          <CardDescription>Edit the group name, description, and status.</CardDescription>
        </CardHeader>
        <CardContent>
          <ManageGroupForm
            groupId={id}
            initialName={group.name}
            initialDescription={group.description ?? ""}
            initialStatus={group.status}
          />
        </CardContent>
      </Card>

      {/* Invite Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite Code</CardTitle>
          <CardDescription>Share this code to let people join the group.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-muted px-4 py-2.5 rounded-md text-lg font-mono tracking-widest text-center select-all">
              {group.invite_code}
            </code>
            <CopyInviteButton code={group.invite_code} />
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Members ({members.length})
          </CardTitle>
          <CardDescription>
            Remove members from the group. The group leader cannot be removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManageMembersList groupId={id} members={members} />
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {!isClosed && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Closing the group is permanent. Members will no longer be able to join or place new orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CloseGroupButton groupId={id} />
          </CardContent>
        </Card>
      )}

      {isClosed && (
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              This group is <strong>closed</strong>. No further changes can be made.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Server-action-based close button
function CloseGroupButton({ groupId }: { groupId: string }) {
  return (
    <form action={async () => {
      "use server";
      const supabase = await createClient();
      await supabase.from("groups").update({ status: "closed" }).eq("group_id", groupId);
      redirect(`/groups/${groupId}/manage`);
    }}>
      <Button type="submit" variant="destructive" className="w-full">
        Close Group Permanently
      </Button>
    </form>
  );
}