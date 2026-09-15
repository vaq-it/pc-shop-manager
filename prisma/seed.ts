import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const supplier = await prisma.supplier.create({
    data: { name: "Công ty Phân phối Linh kiện ABC", phone: "0901234567" },
  });

  await prisma.product.createMany({
    data: [
      {
        sku: "CPU-I5-12400F",
        name: "CPU Intel Core i5-12400F",
        category: "CPU",
        brand: "Intel",
        costPrice: 2800000,
        sellPrice: 3300000,
        quantityInStock: 5,
        lowStockAlert: 2,
        warrantyMonths: 36,
        supplierId: supplier.id,
      },
      {
        sku: "RAM-DDR4-16G-3200",
        name: "RAM Kingston Fury 16GB DDR4 3200MHz",
        category: "RAM",
        brand: "Kingston",
        costPrice: 650000,
        sellPrice: 850000,
        quantityInStock: 1,
        lowStockAlert: 3,
        warrantyMonths: 36,
        supplierId: supplier.id,
      },
      {
        sku: "SSD-NVME-500G",
        name: "SSD NVMe Samsung 970 Evo Plus 500GB",
        category: "STORAGE",
        brand: "Samsung",
        costPrice: 950000,
        sellPrice: 1250000,
        quantityInStock: 8,
        lowStockAlert: 2,
        warrantyMonths: 60,
        supplierId: supplier.id,
      },
    ],
  });

  await prisma.customer.create({
    data: { name: "Nguyễn Văn A", phone: "0912345678", address: "Q.1, TP.HCM" },
  });

  console.log("Seed dữ liệu mẫu thành công.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
