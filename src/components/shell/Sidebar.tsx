"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/today", label: "Today", icon: "T" },
  { href: "/jobs", label: "Jobs", icon: "J" },
  { href: "/invoices", label: "Invoices", icon: "I" },
  { href: "/quotes", label: "Quotes", icon: "Q" },
  { href: "/assistant", label: "Assistant", icon: "A" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-slate-200 bg-white lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:block lg:px-6 lg:py-6">
        <Link href="/today" className="block">
          <p className="text-xl font-bold tracking-tight text-slate-950">Admin Ghost</p>
          <p className="text-xs font-medium text-slate-500">AI admin for busy tradies</p>
        </Link>

        <nav className="flex gap-2 overflow-x-auto lg:mt-8 lg:block lg:space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition lg:w-full ${
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs ${
                    active ? "bg-white/15" : "bg-slate-100"
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 hidden rounded-lg bg-cyan-50 p-4 lg:block">
          <p className="text-sm font-semibold text-slate-950">Ghost Plumbing</p>
          <p className="mt-1 text-xs leading-5 text-cyan-800">
            Demo workspace for Mike, a Christchurch plumber getting admin done from the van.
          </p>
        </div>
      </div>
    </aside>
  );
}
