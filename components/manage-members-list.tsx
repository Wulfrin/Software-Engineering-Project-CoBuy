"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Crown, UserX } from "lucide-react";

type Member = {
  user_uuid: string;
  name: string;
  role: string;
  joinedAt: string;
  isLeader: boolean;
  isMe: boolean;
};

export function ManageMembersList({ groupId, members }: { groupId: string; members: Member[] }) {
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the group?`)) return;
    setRemoving(userId);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to remove member");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-2">
      {members.map((m) => (
        <div key={m.user_uuid}
          className="flex items-center justify-between py-3 px-1 border-b last:border-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs text-primary font-semibold">
                {m.name[0]?.toUpperCase() ?? "M"}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-sm truncate">{m.name}</span>
                {m.isMe && <span className="text-xs text-muted-foreground">(you)</span>}
                {m.isLeader && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">
                {m.isLeader ? "Group Leader" : "Member"} · Joined {new Date(m.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          {!m.isLeader && (
            <Button size="sm" variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              onClick={() => handleRemove(m.user_uuid, m.name)}
              disabled={removing === m.user_uuid}>
              <UserX className="w-4 h-4 mr-1" />
              {removing === m.user_uuid ? "Removing..." : "Remove"}
            </Button>
          )}
        </div>
      ))}
      {error && <p className="text-sm text-destructive pt-2">{error}</p>}
    </div>
  );
}