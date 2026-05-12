"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, DollarSign } from "lucide-react";

type Contribution = { user_uuid: string; name: string; amount: number; paid: boolean; paid_at: string | null };

export function ContributionTracker({
  groupId, orderId, isLeader, currentUserId,
}: {
  groupId: string; orderId: string; isLeader: boolean; currentUserId: string;
}) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchContributions = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/orders/${orderId}/contributions`);
    if (res.ok) setContributions(await res.json());
    setLoading(false);
  }, [groupId, orderId]);

  useEffect(() => { fetchContributions(); }, [fetchContributions]);

  const togglePaid = async (userUuid: string, currentPaid: boolean) => {
    setToggling(userUuid);
    await fetch(`/api/groups/${groupId}/orders/${orderId}/contributions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_uuid: userUuid, paid: !currentPaid }),
    });
    await fetchContributions();
    setToggling(null);
  };

  if (loading) return <p className="text-sm text-muted-foreground py-4">Loading contributions...</p>;
  if (!contributions.length) return (
    <p className="text-sm text-muted-foreground py-4 text-center">
      No contributions yet — members need to save their quantities first.
    </p>
  );

  const totalOwed = contributions.reduce((s, c) => s + c.amount, 0);
  const totalPaid = contributions.filter((c) => c.paid).reduce((s, c) => s + c.amount, 0);
  const paidCount = contributions.filter((c) => c.paid).length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between text-sm bg-muted/40 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          <span className="font-medium">Total Order: <span className="text-primary">${totalOwed.toFixed(2)}</span></span>
        </div>
        <span className="text-muted-foreground">
          {paidCount}/{contributions.length} paid · ${totalPaid.toFixed(2)} collected
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: totalOwed > 0 ? `${(totalPaid / totalOwed) * 100}%` : "0%" }}
        />
      </div>

      {/* Per-member rows */}
      <div className="space-y-2">
        {contributions.map((c) => {
          const isMe = c.user_uuid === currentUserId;
          return (
            <div key={c.user_uuid}
              className="flex items-center justify-between py-2 px-1 border-b last:border-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-xs text-primary font-semibold">{c.name[0]?.toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{c.name}{isMe && <span className="text-muted-foreground font-normal ml-1">(you)</span>}</p>
                  <p className="text-xs text-muted-foreground">${c.amount.toFixed(2)} owed</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {c.paid ? (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Paid
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Circle className="w-3.5 h-3.5" /> Unpaid
                  </span>
                )}
                {isLeader && (
                  <Button size="sm" variant={c.paid ? "outline" : "default"}
                    className="h-7 text-xs"
                    onClick={() => togglePaid(c.user_uuid, c.paid)}
                    disabled={toggling === c.user_uuid}>
                    {toggling === c.user_uuid ? "..." : c.paid ? "Unmark" : "Mark Paid"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}