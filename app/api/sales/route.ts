import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const saleSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().optional(), // nếu khách mới, tạo nhanh
  customerPhone: z.string().optional(),
  createdBy: z.string().optional(),
  paymentStatus: z.enum(["PAID", "PARTIAL", "UNPAID"]).default("PAID"),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
      })
    )
    .min(1, "Hóa đơn cần ít nhất 1 linh kiện"),
});

// GET /api/sales - lịch sử bán hàng
export async function GET() {
  const sales = await prisma.salesOrder.findMany({
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(sales);
}

// POST /api/sales - tạo hóa đơn: kiểm tra tồn kho, trừ kho, gắn bảo hành
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { customerId, customerName, customerPhone, createdBy, paymentStatus, note, items } =
    parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Xác định khách hàng: dùng ID có sẵn, hoặc tạo mới nếu có tên+sđt, hoặc để trống (khách vãng lai)
      let finalCustomerId = customerId;
      if (!finalCustomerId && customerPhone) {
        const customer = await tx.customer.upsert({
          where: { phone: customerPhone },
          update: {},
          create: { name: customerName || "Khách lẻ", phone: customerPhone },
        });
        finalCustomerId = customer.id;
      }

      // Kiểm tra tồn kho đủ hàng trước khi trừ
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i) => i.productId) } },
      });
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) throw new Error(`Không tìm thấy linh kiện ${item.productId}`);
        if (product.quantityInStock < item.quantity) {
          throw new Error(`"${product.name}" không đủ tồn kho (còn ${product.quantityInStock})`);
        }
      }

      const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      const code = `HD-${Date.now().toString().slice(-8)}`;

      const salesOrder = await tx.salesOrder.create({
        data: {
          code,
          customerId: finalCustomerId,
          createdBy,
          totalAmount,
          paymentStatus,
          note,
          items: {
            create: items.map((i) => {
              const product = products.find((p) => p.id === i.productId)!;
              const warrantyEnd = new Date();
              warrantyEnd.setMonth(warrantyEnd.getMonth() + product.warrantyMonths);
              return {
                productId: i.productId,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                warrantyStartDate: new Date(),
                warrantyEndDate: warrantyEnd,
              };
            }),
          },
        },
        include: { items: { include: { product: true } }, customer: true },
      });

      // Trừ tồn kho
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantityInStock: { decrement: item.quantity } },
        });
      }

      return salesOrder;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
