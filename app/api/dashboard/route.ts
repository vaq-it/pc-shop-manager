import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, subDays } from "date-fns";

export async function GET() {
  const monthStart = startOfMonth(new Date());
  const sevenDaysAgo = subDays(new Date(), 7);

  const [
    revenueThisMonth,
    ordersThisMonth,
    allProducts,
    pendingClaims,
    recentSales,
    topProducts,
    totalCustomers,
  ] = await Promise.all([
    prisma.salesOrder.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: monthStart } },
    }),
    prisma.salesOrder.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.product.findMany(),
    prisma.warrantyClaim.count({
      where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    }),
    prisma.salesOrder.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.salesOrderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.customer.count(),
  ]);

  const lowStockProducts = allProducts
    .filter((p) => p.quantityInStock <= p.lowStockAlert)
    .slice(0, 10);

  const topProductIds = topProducts.map((t) => t.productId);
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
  });

  const topProductsWithNames = topProducts.map((t) => ({
    product: topProductDetails.find((p) => p.id === t.productId),
    soldQuantity: t._sum.quantity ?? 0,
  }));

  return NextResponse.json({
    revenueThisMonth: revenueThisMonth._sum.totalAmount ?? 0,
    ordersThisMonth,
    lowStockProducts,
    pendingWarrantyClaims: pendingClaims,
    recentSales,
    topProducts: topProductsWithNames,
    totalCustomers,
  });
}
