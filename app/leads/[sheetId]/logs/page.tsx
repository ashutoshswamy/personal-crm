"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Nav } from "@/components/nav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSheet, listLogs, type LogEntry, type Sheet } from "@/lib/sheets";

export default function SheetLogsPage() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const { ready, getToken } = useRequireAuth();
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const refresh = useCallback(async () => {
    const token = await getToken();
    const sheetInfo = await getSheet(token, sheetId);
    setSheet(sheetInfo);
    if (sheetInfo.role !== "owner") {
      setForbidden(true);
      setLoading(false);
      return;
    }
    setLogs(await listLogs(token, sheetId));
    setLoading(false);
  }, [getToken, sheetId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch depends on auth state settling
    if (ready) refresh();
  }, [ready, refresh]);

  if (!ready || loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Nav />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div>
          <Link
            href={`/leads/${sheetId}`}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← {sheet?.name ?? "Sheet"}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Activity log</h1>
        </div>

        {forbidden ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            Only the sheet owner can view the activity log.
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No activity yet.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.userEmail}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.action.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
