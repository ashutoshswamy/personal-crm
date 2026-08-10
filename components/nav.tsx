"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { NotificationsBell } from "@/components/notifications-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileDialog } from "@/components/profile-dialog";
import { UserAvatar } from "@/components/user-avatar";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
];

export function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-6">
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">Personal CRM</span>
          <span className="text-sm font-semibold tracking-tight sm:hidden">CRM</span>
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-xl px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:px-3",
                  pathname === link.href && "bg-muted text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          <ThemeToggle />
          <NotificationsBell />
          {user && (
            <ProfileDialog>
              <button className="flex items-center gap-2 rounded-xl px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <UserAvatar name={user.displayName || user.email || "?"} photoURL={user.photoURL} />
                <span className="hidden sm:inline">{user.displayName || user.email}</span>
              </button>
            </ProfileDialog>
          )}
          <Button variant="ghost" size="icon-sm" onClick={signOut} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
