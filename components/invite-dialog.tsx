"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { inviteMember } from "@/lib/sheets";

export function InviteDialog({ sheetId, onInvited }: { sheetId: string; onInvited?: () => void }) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"read" | "write">("read");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleInvite() {
    if (!email.trim()) return;
    setError("");
    setSending(true);
    try {
      const token = await getToken();
      await inviteMember(token, sheetId, email.trim(), role);
      setEmail("");
      setOpen(false);
      onInvited?.();
    } catch (e) {
      setError(e instanceof Error ? e.message.replace(/^\d+\s/, "") : "Failed to invite.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline">Invite</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to sheet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Access</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "read" | "write")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">Read only</SelectItem>
                <SelectItem value="write">Read &amp; write</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            The invitee must already have an account — they&apos;ll get a notification with access.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleInvite} disabled={sending}>
            {sending ? "Inviting..." : "Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
