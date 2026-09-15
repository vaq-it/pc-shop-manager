import { prisma } from "@/lib/prisma";
import { startOfMonth } from "date-fns";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount
  );
}

async function getDashboardData() {
  const monthStart = startOfMonth(new Date());

  const [revenueAgg, ordersThisMonth, allProducts, pendingClaims, totalCustomers] =
    await Promise.all([
      prisma.salesOrder.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: monthStart } },
      }),
      prisma.salesOrder.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.product.findMany(),
      prisma.warrantyClaim.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
      prisma.customer.count(),
    ]);

  const lowStockProducts = allProducts.filter((p) => p.quantityInStock <= p.lowStockAlert);

  return {
    revenue: Number(revenueAgg._sum.totalAmount ?? 0),
    ordersThisMonth,
    lowStockProducts,
    pendingClaims,
    totalCustomers,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink mb-1">Tổng quan cửa hàng</h1>
      <p className="text-muted mb-8">Số liệu tính từ đầu tháng đến hôm nay</p>

      <div className="grid grid-cols-4 gap-4 mb-10">
        <StatCard label="Doanh thu tháng này" value={formatVND(data.revenue)} />
        <StatCard label="Số hóa đơn" value={data.ordersThisMonth.toString()} />
        <StatCard label="Bảo hành đang xử lý" value={data.pendingClaims.toString()} tone={data.pendingClaims > 0 ? "warn" : "default"} />
        <StatCard label="Tổng khách hàng" value={data.totalCustomers.toString()} />
      </div>

      <section>
        <h2 className="text-lg font-medium text-ink mb-3">Linh kiện sắp hết hàng</h2>
        {data.lowStockProducts.length === 0 ? (
          <p className="text-muted text-sm">Tất cả linh kiện đều còn đủ tồn kho.</p>
        ) : (
          <div className="border border-line rounded-lg overflow-hidden bg-panel">
            <table className="w-full text-sm">
              <thead className="bg-paper text-muted">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Tên linh kiện</th>
                  <th className="text-left px-4 py-2 font-medium">SKU</th>
                  <th className="text-right px-4 py-2 font-medium">Tồn kho</th>
                  <th className="text-right px-4 py-2 font-medium">Ngưỡng cảnh báo</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-4 py-2 text-ink">{p.name}</td>
                    <td className="px-4 py-2 text-muted font-mono text-xs">{p.sku}</td>
                    <td className="px-4 py-2 text-right text-danger font-medium">
                      {p.quantityInStock}
                    </td>
                    <td className="px-4 py-2 text-right text-muted">{p.lowStockAlert}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warn";
}) {
  return (
    <div className="border border-line rounded-lg bg-panel px-4 py-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`text-xl font-semibold ${tone === "warn" ? "text-warn" : "text-ink"}`}>
        {value}
      </p>
    </div>
  );
}
