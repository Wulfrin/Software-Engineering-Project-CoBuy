import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateGroupForm } from "@/components/create-group-form";
import { ArrowLeft } from "lucide-react";

export default function NewGroupPage() {
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
          <CardTitle>Create a New Group</CardTitle>
          <CardDescription>
            Set up a purchasing group and invite others with a unique code.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGroupForm />
        </CardContent>
      </Card>
    </div>
  );
}
