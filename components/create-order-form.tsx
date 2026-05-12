"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

type ProductRow = { name: string; unit_price: string; total_quantity: string; description: string };

export function CreateOrderForm({ groupId }: { groupId: string }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([
    { name: "", unit_price: "", total_quantity: "", description: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateProduct = (i: number, field: keyof ProductRow, value: string) =>
    setProducts((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));

  const addProduct = () =>
    setProducts((prev) => [...prev, { name: "", unit_price: "", total_quantity: "", description: "" }]);

  const removeProduct = (i: number) =>
    setProducts((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const validProducts = products.filter((p) => p.name.trim());
    try {
      const res = await fetch(`/api/groups/${groupId}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(), description: description.trim(),
          products: validProducts.map((p) => ({
            name: p.name.trim(),
            unit_price: parseFloat(p.unit_price) || 0,
            total_quantity: p.total_quantity ? parseInt(p.total_quantity) : null,
            description: p.description.trim() || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      router.push(`/groups/${groupId}/orders/${data.order_id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Order Title *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. March Bulk Buy" required maxLength={100} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="desc">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What are we buying this time?" rows={2} maxLength={500} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Products</Label>
          <Button type="button" size="sm" variant="outline" onClick={addProduct}>
            <Plus className="w-3 h-3 mr-1" /> Add Product
          </Button>
        </div>
        {products.map((p, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Product {i + 1}</span>
              {products.length > 1 && (
                <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeProduct(i)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Name *</Label>
                <Input value={p.name} onChange={(e) => updateProduct(i, "name", e.target.value)} placeholder="e.g. Rice (25 kg bag)" maxLength={100} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit Price ($)</Label>
                <Input type="number" min="0" step="0.01" value={p.unit_price} onChange={(e) => updateProduct(i, "unit_price", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total Available Qty <span className="text-muted-foreground">(optional)</span></Label>
                <Input type="number" min="1" value={p.total_quantity} onChange={(e) => updateProduct(i, "total_quantity", e.target.value)} placeholder="e.g. 100" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notes <span className="text-muted-foreground">(optional)</span></Label>
                <Input value={p.description} onChange={(e) => updateProduct(i, "description", e.target.value)} placeholder="Brand, specs, etc." maxLength={200} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading || !title.trim()}>
        {loading ? "Creating..." : "Create Order"}
      </Button>
    </form>
  );
}