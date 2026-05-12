type Product = { product_id: string; name: string; unit_price: number };
type OrderItem = { product_id: string; user_uuid: string; quantity: number };
type Member = { uuid: string; name: string };

export function CostSplitTable({
  products, items, members,
}: {
  products: Product[]; items: OrderItem[]; members: Member[];
}) {
  if (!members.length || !products.length) return null;

  const getQty = (userUuid: string, productId: string) =>
    items.find((i) => i.user_uuid === userUuid && i.product_id === productId)?.quantity ?? 0;

  const memberTotal = (userUuid: string) =>
    products.reduce((sum, p) => sum + p.unit_price * getQty(userUuid, p.product_id), 0);

  const grandTotal = members.reduce((sum, m) => sum + memberTotal(m.uuid), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Product</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Price</th>
            {members.map((m) => (
              <th key={m.uuid} className="text-right py-2 px-3 font-medium max-w-[100px] truncate">
                {m.name}
              </th>
            ))}
            <th className="text-right py-2 pl-3 font-medium text-muted-foreground">Total Qty</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const totalQty = members.reduce((sum, m) => sum + getQty(m.uuid, p.product_id), 0);
            return (
              <tr key={p.product_id} className="border-b last:border-0">
                <td className="py-2 pr-4 font-medium">{p.name}</td>
                <td className="text-right py-2 px-3 text-muted-foreground">${p.unit_price.toFixed(2)}</td>
                {members.map((m) => {
                  const qty = getQty(m.uuid, p.product_id);
                  return (
                    <td key={m.uuid} className="text-right py-2 px-3">
                      {qty > 0 ? <span className="font-medium">{qty}</span> : <span className="text-muted-foreground">—</span>}
                    </td>
                  );
                })}
                <td className="text-right py-2 pl-3 text-muted-foreground">{totalQty}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 bg-muted/30">
            <td className="py-2 pr-4 font-semibold" colSpan={2}>My Cost Share</td>
            {members.map((m) => (
              <td key={m.uuid} className="text-right py-2 px-3 font-semibold text-primary">
                ${memberTotal(m.uuid).toFixed(2)}
              </td>
            ))}
            <td className="text-right py-2 pl-3 font-semibold">${grandTotal.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}