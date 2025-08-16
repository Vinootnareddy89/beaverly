
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from '@/context/auth-context';
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CreditCard,
  Calendar,
  Target,
  ShoppingCart,
  Bell,
} from "lucide-react";

const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/bills", label: "Bills", icon: CreditCard },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/habits", label: "Habits", icon: Target },
    { href: "/shopping", label: "Shopping List", icon: ShoppingCart },
    { href: "/reminders", label: "Reminders", icon: Bell },
];

const NavContent = () => {
    const pathname = usePathname();
    const isActive = (path: string) => (path === '/' ? pathname === '/' : pathname.startsWith(path));

    return (
         <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navLinks.map(({ href, label, icon: Icon }) => (
                 <Link
                    key={href}
                    href={href}
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                        isActive(href) ? "text-primary bg-muted" : "text-muted-foreground"
                    )}
                >
                    <Icon className="h-4 w-4" />
                    {label}
                </Link>
            ))}
        </nav>
    )
}

export function Sidebar() {
  const { user } = useAuth();

  if (!user) {
    // The AuthProvider will handle the redirect
    return null;
  }

  return (
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Image src="/beaver-lavender.png" alt="Beaverly Logo" width={24} height={24} />
              <span className="">Beaverly</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavContent />
          </div>
        </div>
      </div>
  );
}
