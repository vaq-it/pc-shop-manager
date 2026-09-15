import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const claimSchema = z.object({
  salesOrderItemId: z.string(),
  customerId: z.string().optional(),
  issueDescription: z.string().min(1),
  note: z.string().optional(),
});

// GET /api/warranty?phone=xxx - tra cứu bảo hành theo SĐT khách
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone");
  const status = searchParams.get("status");

  if (phone) {
    // Tìm tất cả các dòng hàng đã bán cho khách này, kèm trạng thái bảo hành
    const customer = await prisma.customer.findUnique({
      where: { phone },
      include: {
        orders: {
          include: { items: { include: { product: true, claims: true } } },
        },
      },
    });
    if (!customer) {
      return NextResponse.json({ error: "Không tìm thấy khách hàng" }, { status: 404 });
    }
    return NextResponse.json(customer);
  }

  const claims = await prisma.warrantyClaim.findMany({
    where: status ? { status: status as any } : {},
    include: {
      salesOrderItem: { include: { product: true, salesOrder: true } },
      customer: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(claims);
}

// POST /api/warranty - tạo phiếu bảo hành mới
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = claimSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.salesOrderItem.findUnique({
    where: { id: parsed.data.salesOrderItemId },
  });
  if (!item) {
    return NextResponse.json({ error: "Không tìm thấy dòng hàng đã bán" }, { status: 404 });
  }
  if (item.warrantyEndDate < new Date()) {
    return NextResponse.json(
      { error: "Linh kiện này đã hết hạn bảo hành" },
      { status: 400 }
    );
  }

  const claim = await prisma.warrantyClaim.create({ data: parsed.data });
  return NextResponse.json(claim, { status: 201 });
}
