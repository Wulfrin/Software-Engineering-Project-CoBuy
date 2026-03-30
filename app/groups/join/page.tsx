import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { JoinGroupForm } from "@/components/join-group-form";
import { ArrowLeft } from "lucide-react";

export default function JoinGroupPage() {
  return (
    <div className="max-w-xl mx-auto">
      <Button asChild variant="ghost" className="mb-4 -ml-2">
        <Link href="/dashboard">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Join a Group</CardTitle>
          <CardDescription>
            Enter an invite code to join an existing purchasing group.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JoinGroupForm />
        </CardContent>
      </Card>
    </div>
  );
}
