"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddProductForm({ groupId, orderId }: { groupId: string; orderId: string }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/orders/${orderId}/products`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), unit_price: parseFloat(price) || 0, total_quantity: qty ? parseInt(qty) : null, description: desc.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add product");
      router.push(`/groups/${groupId}/orders/${orderId}`);
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Error"); setLoading(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2"><Label>Product Name *</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Rice 25kg bag" required maxLength={100} /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Unit Price ($) *</Label><Input type="number" min="0" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00" required /></div>
        <div className="space-y-2"><Label>Total Qty Available <span className="text-muted-foreground font-normal">(optional)</span></Label><Input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)} placeholder="e.g. 100" /></div>
      </div>
      <div className="space-y-2"><Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label><Input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Brand, specs, etc." maxLength={200} /></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading || !name.trim() || !price} className="w-full">{loading ? "Adding..." : "Add Product"}</Button>
    </form>
  );
}