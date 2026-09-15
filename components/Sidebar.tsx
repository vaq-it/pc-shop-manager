import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Tổng quan" },
  { href: "/products", label: "Linh kiện & Kho" },
  { href: "/sales", label: "Bán hàng" },
  { href: "/customers", label: "Khách hàng" },
  { href: "/warranty", label: "Bảo hành" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-line bg-panel min-h-screen">
      <div className="px-5 py-6 border-b border-line">
        <p className="text-sm text-muted">Cửa hàng</p>
        <p className="font-semibold text-ink">Sửa Vi Tính Manager</p>
      </div>
      <nav className="px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm text-ink hover:bg-paper transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
