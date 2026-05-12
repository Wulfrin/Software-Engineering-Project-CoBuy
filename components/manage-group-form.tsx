"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "active",   label: "Active",   desc: "Open for new members and orders" },
  { value: "ordering", label: "Ordering", desc: "Actively collecting member quantities" },
];

export function ManageGroupForm({
  groupId, initialName, initialDescription, initialStatus,
}: {
  groupId: string;
  initialName: string;
  initialDescription: string;
  initialStatus: string;
}) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim(), status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const isClosed = initialStatus === "closed";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Group Name</Label>
        <Input id="name" value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }}
          disabled={isClosed} required maxLength={100} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea id="desc" value={description} onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
          disabled={isClosed} rows={3} maxLength={500} placeholder="Describe the group's purpose" />
      </div>
      {!isClosed && (
        <div className="space-y-2">
          <Label>Group Status</Label>
          <div className="space-y-2">
            {STATUS_OPTIONS.map((opt) => (
              <label key={opt.value}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors
                  ${status === opt.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                <input type="radio" name="status" value={opt.value}
                  checked={status === opt.value} onChange={() => { setStatus(opt.value); setSaved(false); }}
                  className="mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!isClosed && (
        <Button type="submit" disabled={saving || !name.trim()} className="w-full">
          {saving ? "Saving..." : saved ? <><CheckCircle className="w-4 h-4 mr-2" />Saved!</> : "Save Changes"}
        </Button>
      )}
      {isClosed && <p className="text-sm text-muted-foreground">This group is closed and cannot be edited.</p>}
    </form>
  );
}