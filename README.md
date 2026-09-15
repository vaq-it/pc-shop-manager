# PC Shop Manager

Web app quản lý cửa hàng sửa vi tính: nhập linh kiện, bán hàng, bảo hành, dashboard, khách hàng.

## Stack
- Next.js 14 (App Router) + TypeScript
- Prisma ORM + PostgreSQL
- Tailwind CSS
- Zod (validate dữ liệu ở API)

## Cài đặt

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env từ mẫu, điền connection string PostgreSQL của bạn
cp .env.example .env

# 3. Tạo bảng trong database theo schema
npx prisma migrate dev --name init

# 4. (Tùy chọn) Đổ dữ liệu mẫu để test
npm run prisma:seed

# 5. Chạy dev server
npm run dev
```

App chạy tại http://localhost:3000

## Cấu trúc thư mục

```
app/
  page.tsx                 -> Dashboard (trang chủ)
  layout.tsx                -> Layout gốc + sidebar
  products/                 -> UI quản lý linh kiện (cần tự build thêm form)
  sales/                     -> UI bán hàng (cần tự build thêm form)
  customers/                 -> UI danh sách khách hàng
  warranty/                  -> UI tra cứu & xử lý bảo hành
  api/
    products/               -> CRUD linh kiện
    purchases/               -> Tạo phiếu nhập hàng (tự cộng tồn kho)
    sales/                    -> Tạo hóa đơn bán (tự trừ tồn kho + gắn bảo hành)
    warranty/                 -> Tạo & tra cứu phiếu bảo hành
    customers/                -> CRUD khách hàng
    dashboard/                -> Số liệu tổng hợp cho trang chủ
prisma/
  schema.prisma              -> Toàn bộ schema database (7 bảng)
  seed.ts                     -> Dữ liệu mẫu
lib/
  prisma.ts                   -> Prisma Client singleton
components/
  Sidebar.tsx                  -> Điều hướng
```

## Đã có sẵn (backend logic hoàn chỉnh)

- Schema database đầy đủ: Product, Supplier, PurchaseOrder, SalesOrder, Customer, WarrantyClaim
- API nhập hàng: tạo phiếu + tự động cộng tồn kho (dùng transaction)
- API bán hàng: kiểm tra tồn kho, trừ kho, tự tính `warrantyEndDate` theo `warrantyMonths` của từng linh kiện, tự tạo khách hàng mới nếu chưa có
- API bảo hành: tạo phiếu, chặn nếu đã hết hạn, cập nhật trạng thái xử lý
- API dashboard: doanh thu tháng, top linh kiện bán chạy, cảnh báo tồn kho thấp, số phiếu bảo hành đang chờ
- Trang Dashboard hoàn chỉnh (Server Component, fetch trực tiếp qua Prisma)

## Cần làm tiếp (UI cho các trang còn lại)

Các trang `app/products/page.tsx`, `app/sales/page.tsx`, `app/customers/page.tsx`, `app/warranty/page.tsx` mới chỉ là thư mục trống — bạn cần build UI (form thêm/sửa, bảng danh sách) gọi vào các API đã có sẵn ở trên. Vì phần logic nghiệp vụ khó nhất (transaction, tính tồn kho, tính bảo hành) đã xong ở API, phần UI còn lại chủ yếu là form + bảng, làm khá nhanh.

Gợi ý thứ tự làm tiếp:
1. `app/products/page.tsx` — bảng danh sách + form thêm/sửa linh kiện, form tạo phiếu nhập
2. `app/sales/page.tsx` — giao diện bán hàng kiểu POS (tìm linh kiện, thêm giỏ, xuất hóa đơn)
3. `app/warranty/page.tsx` — ô tìm theo SĐT khách, hiển thị các linh kiện còn/hết hạn, nút tạo phiếu bảo hành
4. `app/customers/page.tsx` — bảng khách hàng + lịch sử mua hàng khi click vào 1 khách

## Deploy gợi ý
- Database: Railway, Supabase, hoặc Neon (PostgreSQL free tier đủ dùng cho 1 cửa hàng)
- App: Vercel (deploy Next.js gần như 1 click) hoặc VPS nhỏ nếu muốn tự quản lý
