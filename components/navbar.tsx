import Link from "next/link";
import { ShoppingCart, LayoutDashboard, Users, History } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { NotificationBell } from "@/components/notification-bell";
import { Button } from "@/components/ui/button";

interface NavbarProps { userEmail?: string; }

export function Navbar({ userEmail }: NavbarProps) {
  return (
    <nav className="border-b bg-background sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CoBuy</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard" className="flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4" />Dashboard
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/groups" className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />My Groups
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/history" className="flex items-center gap-1.5">
                <History className="w-4 h-4" />History
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userEmail && <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[160px]">{userEmail}</span>}
          <NotificationBell />
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}