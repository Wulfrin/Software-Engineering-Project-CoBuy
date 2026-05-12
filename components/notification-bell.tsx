"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const fetch = useCallback(async () => {
    const res = await window.fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setUnread(data.filter((n: { read: boolean }) => !n.read).length);
    }
  }, []);
  useEffect(() => { fetch(); const t = setInterval(fetch, 30000); return () => clearInterval(t); }, [fetch]);
  return (
    <Button asChild variant="ghost" size="icon" className="relative">
      <Link href="/notifications">
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>
    </Button>
  );
}