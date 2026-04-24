"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { navItems } from "./nav-items";

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="layout-root">
      <aside className="left-rail">
        <div className="brand">
          <div className="brand-kicker">Odoo AI Edition</div>
          <h1>Governed Delivery Console</h1>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="content">{children}</main>
    </div>
  );
}
