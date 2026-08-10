"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createSheet, deleteSheet, listSheets, renameSheet, type Sheet } from "@/lib/sheets";

const ROLE_LABEL: Record<Sheet["role"], string> = {
  owner: "Owner",
  write: "Read & write",
  read: "Read only",
};

export default function SheetsPage() {
  const { ready, getToken } = useRequireAuth();
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [renameTarget, setRenameTarget] = useState<Sheet | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Sheet | null>(null);

  const refresh = useCallback(async () => {
    const token = await getToken();
    setSheets(await listSheets(token));
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch depends on auth state settling
    if (ready) refresh();
  }, [ready, refresh]);

  async function handleCreate() {
    if (!name.trim()) return;
    const token = await getToken();
    const sheet = await createSheet(token, name.trim());
    setSheets((prev) => [sheet, ...prev]);
    setName("");
    setOpen(false);
  }

  function openRename(sheet: Sheet) {
    setRenameTarget(sheet);
    setRenameValue(sheet.name);
  }

  async function handleRename() {
    if (!renameTarget || !renameValue.trim()) return;
    const token = await getToken();
    await renameSheet(token, renameTarget.id, renameValue.trim());
    setSheets((prev) =>
      prev.map((s) => (s.id === renameTarget.id ? { ...s, name: renameValue.trim() } : s))
    );
    setRenameTarget(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const token = await getToken();
    await deleteSheet(token, deleteTarget.id);
    setSheets((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sheets</h1>
            <p className="text-sm text-muted-foreground">
              {sheets.length} sheet{sheets.length === 1 ? "" : "s"}
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button>New sheet</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New sheet</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sheet-name">Name</Label>
                <Input
                  id="sheet-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Q1 outbound"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {sheets.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            No sheets yet. Create one to start adding leads.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {sheets.map((sheet) => (
              <Card key={sheet.id} className="overflow-hidden">
                <Link href={`/leads/${sheet.id}`} className="block transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{sheet.name}</CardTitle>
                      <Badge variant={sheet.role === "owner" ? "default" : "outline"}>
                        {ROLE_LABEL[sheet.role]}
                      </Badge>
                    </div>
                    <CardDescription>
                      Created {new Date(sheet.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Link>
                {sheet.role === "owner" && (
                  <CardFooter className="gap-2 border-t pt-4">
                    <Button variant="ghost" size="sm" onClick={() => openRename(sheet)}>
                      Rename
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(sheet)}>
                      Delete
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!renameTarget} onOpenChange={(v) => !v && setRenameTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename sheet</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rename-sheet">Name</Label>
              <Input
                id="rename-sheet"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={handleRename}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete sheet</DialogTitle>
              <DialogDescription>
                Delete &quot;{deleteTarget?.name}&quot;? This deletes all its leads, members, and
                logs. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
