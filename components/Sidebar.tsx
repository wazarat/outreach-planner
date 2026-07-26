"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Snowflake,
  Flame,
  PenSquare,
  Gem,
  Users,
  Compass,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cold", label: "Cold Outreach", icon: Snowflake },
  { href: "/warm", label: "Warm Outreach", icon: Flame },
  { href: "/content", label: "Content", icon: PenSquare },
  { href: "/offers", label: "Offers", icon: Gem },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/principles", label: "Principles", icon: Compass },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-ink-700 bg-ink-900 px-3 py-6">
      <div className="px-3 pb-8">
        <p className="text-lg font-semibold tracking-tight text-white">
          Outreach<span className="text-accent"> Planner</span>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">CanHav · DeFi &amp; FinTech</p>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-slate-400 hover:bg-ink-800 hover:text-slate-200"
              )}
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 text-[11px] leading-relaxed text-slate-600">
        Data lives in your Google Sheets. Edit here or in the sheet — both stay in sync.
      </div>
    </aside>
  );
}
