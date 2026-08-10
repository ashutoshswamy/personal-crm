"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { listNotifications, markNotificationsRead, type Notification } from "@/lib/notifications";

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export function NotificationsBell() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  async function refresh() {
    const token = await getToken();
    setItems(await listNotifications(token));
    setLoaded(true);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load, external polling source
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      const token = await getToken();
      await markNotificationsRead(token);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  function goTo(n: Notification) {
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="relative flex size-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex size-2 rounded-full bg-destructive" />
        )}
      </button>

      {open && (
        <>
          <button
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div
            ref={panelRef}
            className="fixed inset-x-4 top-16 z-50 w-auto rounded-2xl bg-popover text-popover-foreground shadow-lg ring-1 ring-foreground/5 sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80 dark:ring-foreground/10"
          >
            <div className="border-b px-4 py-2.5 text-sm font-medium">Notifications</div>
            <div className="max-h-96 overflow-y-auto">
              {!loaded ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => goTo(n)}
                    className="flex w-full flex-col gap-0.5 border-b px-4 py-3 text-left text-sm last:border-b-0 hover:bg-muted"
                  >
                    <span>{n.message}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
