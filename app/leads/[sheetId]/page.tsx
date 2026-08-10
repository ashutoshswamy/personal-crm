"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Nav } from "@/components/nav";
import { InviteDialog } from "@/components/invite-dialog";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { LeadDetailDialog } from "@/components/lead-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LEAD_STATUSES,
  createLead,
  deleteLead,
  formatCallbackDate,
  listLeads,
  parseCsv,
  parseXlsx,
  updateLead,
  type CsvGrid,
  type Lead,
  type LeadStatus,
} from "@/lib/leads";
import { getSheet, type Sheet } from "@/lib/sheets";

const STATUS_VARIANT: Record<LeadStatus, "default" | "secondary" | "outline" | "destructive"> = {
  Called: "outline",
  "Didn't Pickup": "secondary",
  "In Talk": "secondary",
  "Asked Portfolio": "secondary",
  Interested: "default",
  Locked: "default",
  "Not Interested": "destructive",
};

const EMPTY_FORM = { name: "", email: "", phone: "", company: "", callbackDate: "", comments: "" };

export default function SheetLeadsPage() {
  const { sheetId } = useParams<{ sheetId: string }>();
  const { ready, getToken } = useRequireAuth();

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [csvGrid, setCsvGrid] = useState<CsvGrid | null>(null);
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const token = await getToken();
    const [sheetInfo, leadRows] = await Promise.all([
      getSheet(token, sheetId),
      listLeads(token, sheetId),
    ]);
    setSheet(sheetInfo);
    setLeads(leadRows);
    setLoading(false);
  }, [getToken, sheetId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch depends on auth state settling
    if (ready) refresh();
  }, [ready, refresh]);

  const canWrite = sheet?.role === "owner" || sheet?.role === "write";
  const isOwner = sheet?.role === "owner";

  function openAddDialog() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEditDialog(lead: Lead) {
    setEditingId(lead.id);
    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      callbackDate: lead.callbackDate,
      comments: lead.comments,
    });
    setOpen(true);
  }

  async function saveForm() {
    if (!form.name.trim()) return;
    const token = await getToken();
    if (editingId) {
      const updated = await updateLead(token, sheetId, editingId, form);
      setLeads((prev) => prev.map((l) => (l.id === editingId ? updated : l)));
    } else {
      const created = await createLead(token, sheetId, form);
      setLeads((prev) => [created, ...prev]);
    }
    setOpen(false);
  }

  async function updateStatus(id: string, status: LeadStatus) {
    const token = await getToken();
    const updated = await updateLead(token, sheetId, id, { status });
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const token = await getToken();
    await deleteLead(token, sheetId, deleteTarget.id);
    setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  async function handleCsvSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isXlsx = /\.xlsx$/i.test(file.name);
    setCsvGrid(isXlsx ? await parseXlsx(file) : parseCsv(await file.text()));
    e.target.value = "";
  }

  async function handleCsvImport(mapped: Pick<Lead, "name" | "email" | "phone" | "company">[]) {
    const token = await getToken();
    const created = await Promise.all(mapped.map((l) => createLead(token, sheetId, l)));
    setLeads((prev) => [...created, ...prev]);
    setCsvGrid(null);
  }

  if (!ready || loading || !sheet) {
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
            <Link href="/leads" className="text-xs text-muted-foreground hover:text-foreground">
              ← All sheets
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">{sheet.name}</h1>
            <p className="text-sm text-muted-foreground">
              {leads.length} lead{leads.length === 1 ? "" : "s"} ·{" "}
              {sheet.role === "owner" ? "Owner" : sheet.role === "write" ? "Read & write" : "Read only"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <>
                <InviteDialog sheetId={sheetId} onInvited={refresh} />
                <Button
                  variant="outline"
                  nativeButton={false}
                  render={<Link href={`/leads/${sheetId}/logs`} />}
                >
                  Logs
                </Button>
              </>
            )}
            {canWrite && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={handleCsvSelect}
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Upload file
                </Button>
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger render={<Button onClick={openAddDialog}>Add lead</Button>} />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Edit lead" : "Add lead"}</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={form.company}
                          onChange={(e) => setForm({ ...form, company: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="callback">Call back date</Label>
                        <Input
                          id="callback"
                          type="date"
                          value={form.callbackDate}
                          onChange={(e) => setForm({ ...form, callbackDate: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="comments">Comments</Label>
                        <Textarea
                          id="comments"
                          value={form.comments}
                          onChange={(e) => setForm({ ...form, comments: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={saveForm}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            {canWrite
              ? "No leads yet. Add one or upload a CSV/XLSX file."
              : "No leads yet."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Call back</TableHead>
                <TableHead>Comments</TableHead>
                {canWrite && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer"
                  onClick={() => setDetailLead(lead)}
                >
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.company}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {canWrite ? (
                      <Select
                        value={lead.status}
                        onValueChange={(value) => updateStatus(lead.id, value as LeadStatus)}
                      >
                        <SelectTrigger size="sm">
                          <Badge variant={STATUS_VARIANT[lead.status]}>
                            <SelectValue />
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={STATUS_VARIANT[lead.status]}>{lead.status}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.callbackDate ? formatCallbackDate(lead.callbackDate) : "—"}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground" title={lead.comments}>
                    {lead.comments || "—"}
                  </TableCell>
                  {canWrite && (
                    <TableCell className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => openEditDialog(lead)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(lead)}>
                        Delete
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete lead</DialogTitle>
              <DialogDescription>
                Delete {deleteTarget?.name}? This cannot be undone.
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

        <CsvImportDialog grid={csvGrid} onCancel={() => setCsvGrid(null)} onImport={handleCsvImport} />

        <LeadDetailDialog
          lead={detailLead}
          onClose={() => setDetailLead(null)}
          onEdit={openEditDialog}
          canWrite={canWrite}
        />
      </div>
    </div>
  );
}
