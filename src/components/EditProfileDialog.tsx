import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/lib/media";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type P = { id: string; username: string; display_name: string; bio: string | null; website: string | null; location: string | null; avatar_url: string | null };

export function EditProfileDialog({ profile }: { profile: P }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ display_name: profile.display_name, username: profile.username, bio: profile.bio ?? "", website: profile.website ?? "", location: profile.location ?? "", avatar_url: profile.avatar_url });

  const onPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image")) return toast.error("Please choose a photo");
    setBusy(true);
    try { const { url } = await uploadMedia(profile.id, file); setF((s) => ({ ...s, avatar_url: url })); }
    catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };

  const save = async () => {
    const username = f.username.trim().toLowerCase();
    if (!f.display_name.trim() || !/^[a-z0-9_.]{3,30}$/.test(username)) return toast.error("Name is required; username 3–30 letters, numbers, _ or .");
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ display_name: f.display_name.trim(), username, bio: f.bio.trim() || null, website: f.website.trim() || null, location: f.location.trim() || null, avatar_url: f.avatar_url }).eq("id", profile.id);
    setBusy(false);
    if (error) return toast.error(error.code === "23505" ? "That username is taken" : error.message);
    toast.success("Profile updated");
    setOpen(false);
    await qc.invalidateQueries();
    if (username !== profile.username) navigate({ to: "/u/$username", params: { username } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="secondary">Edit profile</Button></DialogTrigger>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Edit profile</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center gap-2">
          <label className="relative cursor-pointer">
            <UserAvatar src={f.avatar_url} name={f.display_name} size={88} />
            <span className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground"><Camera className="h-4 w-4" /></span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
          <span className="text-xs text-muted-foreground">Tap to change photo</span>
        </div>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={f.display_name} maxLength={60} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></div>
          <div><Label>Username</Label><Input value={f.username} maxLength={30} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
          <div><Label>Bio</Label><Textarea value={f.bio} maxLength={300} rows={3} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
          <div><Label>Website</Label><Input value={f.website} maxLength={200} placeholder="https://" onChange={(e) => setF({ ...f, website: e.target.value })} /></div>
          <div><Label>Location</Label><Input value={f.location} maxLength={80} onChange={(e) => setF({ ...f, location: e.target.value })} /></div>
        </div>
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
      </DialogContent>
    </Dialog>
  );
}
