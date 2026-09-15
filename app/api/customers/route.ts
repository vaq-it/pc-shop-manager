import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  address: z.string().optional(),
  note: z.string().optional(),
});

// GET /api/customers?search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;

  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search } },
          ],
        }
      : {},
    include: {
      orders: { select: { totalAmount: true } },
      _count: { select: { orders: true, claims: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const withTotals = customers.map((c) => ({
    ...c,
    totalSpent: c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
  }));

  return NextResponse.json(withTotals);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const customer = await prisma.customer.create({ data: parsed.data });
  return NextResponse.json(customer, { status: 201 });
}
