"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Nav } from "@/components/nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LEAD_STATUSES,
  formatCallbackDate,
  listAllLeads,
  type LeadStatus,
  type LeadWithSheet,
} from "@/lib/leads";

const STATUS_VARIANT: Record<LeadStatus, "default" | "secondary" | "outline" | "destructive"> = {
  Called: "outline",
  "Didn't Pickup": "secondary",
  "In Talk": "secondary",
  "Asked Portfolio": "secondary",
  Interested: "default",
  Locked: "default",
  "Not Interested": "destructive",
};

// Funnel color deepens as a lead advances toward Locked; stalled/dropped stages break the gradient.
const STATUS_COLOR: Record<LeadStatus, string> = {
  Called: "var(--chart-1)",
  "Didn't Pickup": "var(--border)",
  "In Talk": "var(--chart-2)",
  "Asked Portfolio": "var(--chart-3)",
  "Not Interested": "var(--destructive)",
  Interested: "var(--chart-4)",
  Locked: "var(--chart-5)",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const router = useRouter();
  const { ready, getToken } = useRequireAuth();
  const [leads, setLeads] = useState<LeadWithSheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch depends on auth state settling
    (async () => {
      const token = await getToken();
      setLeads(await listAllLeads(token));
      setLoading(false);
    })();
  }, [ready, getToken]);

  if (!ready || loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const total = leads.length;
  const locked = leads.filter((l) => l.status === "Locked").length;
  const interested = leads.filter((l) => l.status === "Interested").length;
  const today = todayIso();
  const dueCallbacks = leads
    .filter((l) => l.callbackDate && l.callbackDate <= today)
    .sort((a, b) => a.callbackDate.localeCompare(b.callbackDate));
  const upcomingCallbacks = leads
    .filter((l) => l.callbackDate && l.callbackDate > today)
    .sort((a, b) => a.callbackDate.localeCompare(b.callbackDate))
    .slice(0, 5);
  const recentLeads = [...leads]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
  const statusCounts = LEAD_STATUSES.map((status) => ({
    status,
    count: leads.filter((l) => l.status === status).length,
  }));

  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of all your leads</p>
          </div>
          <Button nativeButton={false} render={<Link href="/leads" />} className="self-start sm:self-auto">
            Manage leads
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Total leads</CardDescription>
              <CardTitle className="text-3xl">{total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Interested</CardDescription>
              <CardTitle className="text-3xl">{interested}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Locked</CardDescription>
              <CardTitle className="text-3xl">{locked}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Callbacks due</CardDescription>
              <CardTitle className="text-3xl">{dueCallbacks.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status breakdown</CardTitle>
              <CardDescription>
                {total} lead{total === 1 ? "" : "s"} across {LEAD_STATUSES.length} stages
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {total === 0 ? (
                <p className="text-sm text-muted-foreground">No leads yet.</p>
              ) : (
                <>
                  <div
                    className="flex h-3 w-full overflow-hidden rounded-sm border border-border"
                    role="img"
                    aria-label={statusCounts
                      .map((s) => `${s.status}: ${s.count}`)
                      .join(", ")}
                  >
                    {statusCounts.map(({ status, count }) =>
                      count === 0 ? null : (
                        <div
                          key={status}
                          title={`${status} — ${count}`}
                          className="h-full first:rounded-l-sm last:rounded-r-sm"
                          style={{
                            width: `${(count / total) * 100}%`,
                            backgroundColor: STATUS_COLOR[status],
                          }}
                        />
                      ),
                    )}
                  </div>

                  <div className="flex flex-col">
                    {statusCounts.map(({ status, count }, i) => (
                      <div
                        key={status}
                        className="flex items-center gap-3 border-b border-border/60 py-2 text-sm last:border-b-0"
                      >
                        <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: STATUS_COLOR[status] }}
                          aria-hidden
                        />
                        <span className="flex-1 truncate font-medium">{status}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {count}
                          <span className="ml-1 text-xs">
                            ({total ? Math.round((count / total) * 100) : 0}%)
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Upcoming callbacks</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {dueCallbacks.length === 0 && upcomingCallbacks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No callbacks scheduled.</p>
              ) : (
                <>
                  {dueCallbacks.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{lead.name}</span>
                      <span className="text-destructive">{formatCallbackDate(lead.callbackDate)}</span>
                    </div>
                  ))}
                  {upcomingCallbacks.map((lead) => (
                    <div key={lead.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{lead.name}</span>
                      <span className="text-muted-foreground">{formatCallbackDate(lead.callbackDate)}</span>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent leads</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sheet</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLeads.map((lead) => (
                    <TableRow
                      key={lead.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/leads/${lead.sheetId}`)}
                    >
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-muted-foreground">{lead.sheetName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.company || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[lead.status]}>{lead.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.createdAt.slice(0, 10)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
