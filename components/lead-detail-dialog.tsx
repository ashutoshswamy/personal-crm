"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCallbackDate, type Lead, type LeadStatus } from "@/lib/leads";

const STATUS_VARIANT: Record<LeadStatus, "default" | "secondary" | "outline" | "destructive"> = {
  Called: "outline",
  "Didn't Pickup": "secondary",
  "In Talk": "secondary",
  "Asked Portfolio": "secondary",
  Interested: "default",
  Locked: "default",
  "Not Interested": "destructive",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export function LeadDetailDialog({
  lead,
  onClose,
  onEdit,
  canWrite,
}: {
  lead: Lead | null;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
  canWrite: boolean;
}) {
  return (
    <Dialog open={!!lead} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        {lead && (
          <>
            <DialogHeader>
              <DialogTitle>{lead.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email">{lead.email || "—"}</Field>
              <Field label="Phone">{lead.phone || "—"}</Field>
              <Field label="Company">{lead.company || "—"}</Field>
              <Field label="Status">
                <Badge variant={STATUS_VARIANT[lead.status]}>{lead.status}</Badge>
              </Field>
              <Field label="Call back">
                {lead.callbackDate ? formatCallbackDate(lead.callbackDate) : "—"}
              </Field>
              <Field label="Added">{new Date(lead.createdAt).toLocaleDateString()}</Field>
              <div className="col-span-2">
                <Field label="Comments">
                  <span className="whitespace-pre-wrap">{lead.comments || "—"}</span>
                </Field>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {canWrite && (
                <Button
                  onClick={() => {
                    onEdit(lead);
                    onClose();
                  }}
                >
                  Edit
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
