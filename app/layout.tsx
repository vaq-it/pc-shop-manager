import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Quản lý cửa hàng sửa vi tính",
  description: "Nhập kho, bán hàng, bảo hành, khách hàng",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="flex">
        <Sidebar />
        <main className="flex-1 px-8 py-8 max-w-6xl">{children}</main>
      </body>
    </html>
  );
}
