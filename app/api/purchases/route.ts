import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const purchaseSchema = z.object({
  supplierId: z.string().optional(),
  note: z.string().optional(),
  createdBy: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
        unitCost: z.number().nonnegative(),
      })
    )
    .min(1, "Phiếu nhập cần ít nhất 1 linh kiện"),
});

// GET /api/purchases - lịch sử nhập hàng
export async function GET() {
  const purchases = await prisma.purchaseOrder.findMany({
    include: { supplier: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(purchases);
}

// POST /api/purchases - tạo phiếu nhập + tự động cộng tồn kho
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { supplierId, note, createdBy, items } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const purchaseOrder = await tx.purchaseOrder.create({
      data: {
        supplierId,
        note,
        createdBy,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitCost: i.unitCost,
          })),
        },
      },
      include: { items: true },
    });

    // Cộng tồn kho cho từng linh kiện trong phiếu
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantityInStock: { increment: item.quantity } },
      });
    }

    return purchaseOrder;
  });

  return NextResponse.json(result, { status: 201 });
}
