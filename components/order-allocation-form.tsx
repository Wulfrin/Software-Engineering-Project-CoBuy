"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, Save, CheckCircle } from "lucide-react";

type Product = { product_id: string; name: string; unit_price: number; total_quantity: number | null; description: string | null };
type Item = { product_id: string; quantity: number };

export function OrderAllocationForm({
  groupId, orderId, products, myItems, isLocked,
}: {
  groupId: string; orderId: string; products: Product[]; myItems: Item[]; isLocked: boolean;
}) {
  const initQty = Object.fromEntries(
    products.map((p) => [p.product_id, myItems.find((i) => i.product_id === p.product_id)?.quantity ?? 0])
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(initQty);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const setQty = (productId: string, val: string) => {
    setSaved(false);
    setQuantities((prev) => ({ ...prev, [productId]: Math.max(0, parseInt(val) || 0) }));
  };

  const myTotal = products.reduce((sum, p) => sum + p.unit_price * (quantities[p.product_id] ?? 0), 0);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/orders/${orderId}/items`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allocations: products.map((p) => ({ product_id: p.product_id, quantity: quantities[p.product_id] ?? 0 })),
        }),
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

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <ShoppingCart className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No products added to this order yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {products.map((p) => {
          const qty = quantities[p.product_id] ?? 0;
          const cost = p.unit_price * qty;
          return (
            <Card key={p.product_id}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${p.unit_price.toFixed(2)} / unit
                      {p.total_quantity && <span className="ml-2">· {p.total_quantity} available</span>}
                    </p>
                    {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setQty(p.product_id, String(Math.max(0, qty - 1)))}
                        disabled={isLocked || qty === 0}
                        className="w-7 h-7 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40">−</button>
                      <Input type="number" min="0" value={qty} onChange={(e) => setQty(p.product_id, e.target.value)}
                        disabled={isLocked}
                        className="w-16 text-center h-8 text-sm" />
                      <button type="button" onClick={() => setQty(p.product_id, String(qty + 1))}
                        disabled={isLocked}
                        className="w-7 h-7 rounded border flex items-center justify-center text-sm hover:bg-muted disabled:opacity-40">+</button>
                    </div>
                    <span className="text-sm font-medium w-16 text-right text-primary">
                      ${cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 flex items-center justify-between">
          <span className="font-semibold">My Total</span>
          <span className="text-xl font-bold text-primary">${myTotal.toFixed(2)}</span>
        </CardContent>
      </Card>

      {!isLocked && (
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving..." : saved ? <><CheckCircle className="w-4 h-4 mr-2" />Saved!</> : <><Save className="w-4 h-4 mr-2" />Save My Quantities</>}
          </Button>
        </div>
      )}
      {isLocked && <p className="text-sm text-muted-foreground text-center">This order is locked — allocations cannot be changed.</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}