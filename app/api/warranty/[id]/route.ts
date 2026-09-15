import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const claim = await prisma.warrantyClaim.update({
    where: { id: params.id },
    data: {
      status: body.status,
      note: body.note,
      resolvedAt: ["REPLACED", "REPAIRED", "REJECTED"].includes(body.status)
        ? new Date()
        : undefined,
    },
  });
  return NextResponse.json(claim);
}
