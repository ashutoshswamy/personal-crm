"use client";

import { useRef, useState } from "react";
import { updateProfile } from "firebase/auth";
import { useAuth } from "@/components/auth-provider";
import { UserAvatar } from "@/components/user-avatar";
import { resizeImageToDataUrl } from "@/lib/image";
import { avatarUrl, deleteAvatar, uploadAvatar } from "@/lib/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type PendingPhoto = { action: "keep" } | { action: "remove" } | { action: "upload"; dataUrl: string };

export function ProfileDialog({ children }: { children: React.ReactElement }) {
  const { user, getToken, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user?.displayName ?? "");
  const [pending, setPending] = useState<PendingPhoto>({ action: "keep" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrl =
    pending.action === "upload" ? pending.dataUrl : pending.action === "remove" ? null : user?.photoURL;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setName(user?.displayName ?? "");
      setPending({ action: "keep" });
      setError("");
    }
  }

  async function handlePickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setPending({ action: "upload", dataUrl: await resizeImageToDataUrl(file, 256) });
    } catch {
      setError("Could not read that image.");
    }
    e.target.value = "";
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      let photoURL = user.photoURL;

      if (pending.action === "upload") {
        await uploadAvatar(token, pending.dataUrl);
        photoURL = avatarUrl(user.uid);
      } else if (pending.action === "remove") {
        await deleteAvatar(token);
        photoURL = null;
      }

      await updateProfile(user, { displayName: name.trim(), photoURL });
      refreshUser();
      setOpen(false);
    } catch {
      setError("Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={children} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <UserAvatar name={name || user?.email || "?"} photoURL={previewUrl} className="size-16" />
            <div className="flex flex-col gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePickPhoto}
              />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Change photo
              </Button>
              {previewUrl && (
                <Button variant="ghost" size="sm" onClick={() => setPending({ action: "remove" })}>
                  Remove
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
