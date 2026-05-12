import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Crown } from "lucide-react";

type Group = {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  leader_id: string;
  invite_code: string;
  created_at: string;
  group_members?: { user_uuid: string }[];
};

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ordering: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  closed: "bg-muted text-muted-foreground",
};

export function GroupCard({
  group,
  currentUserId,
}: {
  group: Group;
  currentUserId: string;
}) {
  const isLeader = group.leader_id === currentUserId;
  const memberCount = group.group_members?.length ?? 0;
  const statusClass = statusStyles[group.status] ?? statusStyles.CLOSED;

  return (
    <Link href={`/groups/${group.id}`} className="block h-full">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{group.name}</CardTitle>
            <span
              className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}`}
            >
              {group.status}
            </span>
          </div>
          {isLeader && (
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <Crown className="w-3 h-3" />
              Group Leader
            </div>
          )}
        </CardHeader>
        <CardContent>
          {group.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {group.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
