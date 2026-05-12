"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
export function MarkAllReadButton() {
  const router = useRouter();
  const handleClick = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    router.refresh();
  };
  return <Button variant="outline" size="sm" onClick={handleClick}><CheckCheck className="w-4 h-4 mr-1" />Mark all read</Button>;
}