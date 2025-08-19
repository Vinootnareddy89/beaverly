
"use client";

import * as React from "react";
import { Sidebar, NavContent } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, PanelLeft } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { FirestoreStatus } from "@/components/dashboard/firestore-status";
import Link from "next/link";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LiveDateTime } from "@/components/dashboard/live-datetime";


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();

  return (
      <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
          <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
             <Sheet>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="md:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs p-0">
                    <div className="flex h-full max-h-screen flex-col gap-2">
                        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                            <Link href="/" className="flex items-center gap-2 font-semibold">
                                <Image src="/beaver-lavender.png" alt="Beaverly Logo" width={24} height={24} />
                                <span className="">Beaverly</span>
                            </Link>
                        </div>
                        <div className="flex-1 overflow-y-auto pt-2">
                            <NavContent />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
             <div className="w-full flex-1">
                {/* Can be used for page titles or breadcrumbs in the future */}
             </div>
             <div className="flex items-center gap-4">
                <LiveDateTime />
                <FirestoreStatus />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="secondary" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.photoURL || undefined} alt={user?.email || ''} />
                          <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">Toggle user menu</span>
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
              {children}
          </main>
        </div>
      </div>
  );
}
