import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.enum([
    "CPU", "MAINBOARD", "RAM", "VGA", "PSU", "STORAGE",
    "CASE", "COOLING", "MONITOR", "LAPTOP_PART", "PERIPHERAL", "OTHER",
  ]),
  type: z.enum(["COMPONENT", "PREBUILT"]).default("COMPONENT"),
  brand: z.string().optional(),
  unit: z.string().default("cái"),
  costPrice: z.number().nonnegative(),
  sellPrice: z.number().nonnegative(),
  quantityInStock: z.number().int().nonnegative().default(0),
  lowStockAlert: z.number().int().nonnegative().default(2),
  warrantyMonths: z.number().int().nonnegative().default(12),
  supplierId: z.string().optional(),
});

// GET /api/products?search=&category=&lowStock=true
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const lowStock = searchParams.get("lowStock") === "true";

  const products = await prisma.product.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        category ? { category: category as any } : {},
      ],
    },
    include: { supplier: true },
    orderBy: { name: "asc" },
  });

  const filtered = lowStock
    ? products.filter((p) => p.quantityInStock <= p.lowStockAlert)
    : products;

  return NextResponse.json(filtered);
}

// POST /api/products
export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({
    where: { sku: parsed.data.sku },
  });
  if (existing) {
    return NextResponse.json(
      { error: "SKU đã tồn tại, vui lòng chọn mã khác" },
      { status: 409 }
    );
  }

  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json(product, { status: 201 });
}
