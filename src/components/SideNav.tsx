"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, PenSquare, ScrollText, Stamp } from "lucide-react";
import ConnectionBadge from "@/components/ConnectionBadge";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/influencers", label: "Creator list", icon: Users },
  { href: "/compose", label: "Compose", icon: PenSquare },
  { href: "/sends", label: "Send log", icon: ScrollText },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-line bg-paper-raised">
      <div className="md:sticky md:top-0 md:h-screen flex md:flex-col">
        <div className="px-5 py-5 border-b border-line flex items-center gap-2.5">
          <Stamp className="text-teal shrink-0" size={22} strokeWidth={2.25} />
          <div className="leading-tight">
            <p className="font-display font-bold text-[15px] tracking-tight">Outreach Engine</p>
            <p className="font-mono text-[10px] text-ink-soft tracking-wide uppercase">Brandley.ai MVP</p>
          </div>
        </div>

        <nav className="flex md:flex-col px-2.5 py-3 gap-1 overflow-x-auto md:overflow-visible">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`focus-ring flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? "bg-teal text-paper"
                    : "text-ink-soft hover:bg-line/40 hover:text-ink"
                }`}
              >
                <Icon size={16} strokeWidth={2.25} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-4 py-4 border-t border-line hidden md:block">
          <ConnectionBadge />
        </div>
      </div>
    </aside>
  );
}