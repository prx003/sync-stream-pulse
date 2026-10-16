import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BarChart3, Lock, Flag, Ban, Star, Clock, Heart, Smartphone, HelpCircle, Shield, KeyRound,
  FileText, ScrollText, LogOut, BadgeCheck, ChevronRight, ChevronLeft, Users, Eye, TrendingUp, Search, X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";

type View =
  | "home" | "insights" | "privacy" | "report" | "block" | "close" | "activity" | "favorites"
  | "devices" | "help" | "privacy-settings" | "accounts" | "policy" | "terms" | "verify";

export const Route = createFileRoute("/settings")({
  validateSearch: (s: Record<string, unknown>): { v?: View } => ({ v: (s["v"] as View) || undefined }),
  head: () => ({
    meta: [
      { title: "Settings · SAC Community" },
      { name: "description", content: "Insights, privacy, account controls and more for your SAC Community profile." },
      { property: "og:title", content: "Settings · SAC Community" },
      { property: "og:description", content: "Insights, privacy, account controls and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

const TITLES: Record<View, string> = {
  home: "Settings and activity", insights: "Insights", privacy: "Account privacy", report: "Report a problem",
  block: "Blocked", close: "Close connections", activity: "Recent activity", favorites: "Favorites",
  devices: "Device permissions", help: "Help", "privacy-settings": "Privacy settings", accounts: "Accounts & passwords",
  policy: "Privacy policy", terms: "Terms of use", verify: "Account verification",
};

/* ---------- small local-list helper (per user, on this device) ---------- */
function useLocalList(key: string, userId: string | null) {
  const k = `sac:${key}:${userId}`;
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    try { setList(JSON.parse(localStorage.getItem(k) || "[]")); } catch { setList([]); }
  }, [k]);
  const save = (next: string[]) => { setList(next); localStorage.setItem(k, JSON.stringify(next)); };
  const toggle = (id: string) => save(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  return { list, toggle };
}
function useLocalFlag(key: string, userId: string | null, def = false) {
  const k = `sac:flag:${key}:${userId}`;
  const [v, setV] = useState(def);
  useEffect(() => { const s = localStorage.getItem(k); if (s !== null) setV(s === "1"); }, [k]);
  return [v, (n: boolean) => { setV(n); localStorage.setItem(k, n ? "1" : "0"); }] as const;
}

function SettingsPage() {
  const { v = "home" } = Route.useSearch();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const go = (view: View) => navigate({ to: "/settings", search: view === "home" ? {} : { v: view } });

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <div className="mb-5 flex items-center gap-3">
        {v !== "home" && (
          <button onClick={() => go("home")} aria-label="Back" className="grid h-9 w-9 place-items-center rounded-full hover:bg-secondary">
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-xl font-black">{TITLES[v]}</h1>
      </div>
      {v === "home" ? <Home go={go} /> : !userId && !["help","policy","terms","devices"].includes(v) ? <SignInNote /> : null}
      {userId && <>
      {v === "insights" && <Insights />}
      {v === "privacy" && <Privacy />}
      {v === "report" && <Report />}
      {v === "block" && <PeopleList kind="blocked" />}
      {v === "close" && <PeopleList kind="close" />}
      {v === "activity" && <Activity />}
      {v === "favorites" && <PeopleList kind="favorites" />}
      {v === "devices" && <Devices />}
      {v === "help" && <Help />}
      {v === "privacy-settings" && <PrivacySettings />}
      {v === "accounts" && <Accounts />}
      {v === "policy" && <Doc kind="policy" />}
      {v === "terms" && <Doc kind="terms" />}
      {v === "verify" && <Verify />}</>}
      {!userId && v === "help" && <Help />}{!userId && v === "devices" && <Devices />}{!userId && v === "policy" && <Doc kind="policy" />}{!userId && v === "terms" && <Doc kind="terms" />}
    </div>
  );
}

/* ---------------- Home menu ---------------- */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">{children}</div>
    </section>
  );
}
function Row({ icon: Icon, label, hint, onClick, danger }: { icon: typeof Lock; label: string; hint?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left transition last:border-b-0 hover:bg-secondary ${danger ? "text-destructive" : ""}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      {!danger && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
    </button>
  );
}

function Home({ go }: { go: (v: View) => void }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); };
  return (
    <>
      <Section title="Your dashboard">
        <Row icon={BarChart3} label="Insights" hint="Followers, views & more" onClick={() => go("insights")} />
      </Section>
      <Section title="Appearance">
        <ThemeToggle />
      </Section>
      <Section title="Account settings">
        <Row icon={Lock} label="Account privacy" hint={profile?.is_private ? "Private" : "Public"} onClick={() => go("privacy")} />
        <Row icon={Flag} label="Report a problem" onClick={() => go("report")} />
        <Row icon={Ban} label="Blocked" onClick={() => go("block")} />
        <Row icon={Star} label="Close connections" onClick={() => go("close")} />
        <Row icon={Clock} label="Recent activity" onClick={() => go("activity")} />
        <Row icon={Heart} label="Favorites" onClick={() => go("favorites")} />
      </Section>
      <Section title="Info">
        <Row icon={Smartphone} label="Device permissions" onClick={() => go("devices")} />
        <Row icon={HelpCircle} label="Help" onClick={() => go("help")} />
        <Row icon={Shield} label="Privacy settings" onClick={() => go("privacy-settings")} />
        <Row icon={KeyRound} label="Accounts & passwords" onClick={() => go("accounts")} />
      </Section>
      <Section title="About">
        <Row icon={FileText} label="Privacy policy" onClick={() => go("policy")} />
        <Row icon={ScrollText} label="Terms of use" onClick={() => go("terms")} />
        <Row icon={BadgeCheck} label="Account verification" onClick={() => go("verify")} />
        <Row icon={LogOut} label="Log out" onClick={logout} danger />
      </Section>
    </>
  );
}

/* ---------------- Insights ---------------- */
const RANGES = [7, 30, 90] as const;
function Insights() {
  const { userId } = useAuth();
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const { data, isLoading } = useQuery({
    queryKey: ["insights", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: conns }, { data: posts }] = await Promise.all([
        supabase.from("connections").select("requester_id,addressee_id,status,created_at").or(`requester_id.eq.${userId},addressee_id.eq.${userId}`),
        supabase.from("content").select("id,title,type,created_at,media_url,cover_url").eq("author_id", userId!),
      ]);
      const ids = (posts ?? []).map((p) => p.id);
      const [{ data: likes }, { data: views }, { data: comments }] = ids.length
        ? await Promise.all([
            supabase.from("likes").select("content_id,created_at,user_id").in("content_id", ids),
            supabase.from("story_views").select("content_id,user_id").in("content_id", ids),
            supabase.from("comments").select("content_id,created_at").in("content_id", ids),
          ])
        : [{ data: [] }, { data: [] }, { data: [] }];
      return { conns: conns ?? [], posts: posts ?? [], likes: likes ?? [], views: views ?? [], comments: (comments ?? []) as { content_id: string; created_at: string }[] };
    },
  });

  const stats = useMemo(() => {
    if (!data) return null;
    const since = Date.now() - range * 864e5;
    const accepted = data.conns.filter((c) => c.status === "accepted");
    const followers = accepted.length;
    const newFollowers = accepted.filter((c) => +new Date(c.created_at) > since).length;
    const likesR = data.likes.filter((l) => +new Date(l.created_at) > since);
    const commentsR = data.comments.filter((c) => +new Date(c.created_at) > since);
    const reached = new Set([...data.likes.map((l) => l.user_id), ...data.views.map((v) => v.user_id)]).size;
    const views = data.views.length + data.likes.length * 3;
    // daily series
    const days = Math.min(range, 30);
    const series = Array.from({ length: days }, (_, i) => {
      const d = new Date(Date.now() - (days - 1 - i) * 864e5).toDateString();
      return {
        d,
        v: data.likes.filter((l) => new Date(l.created_at).toDateString() === d).length +
           accepted.filter((c) => new Date(c.created_at).toDateString() === d).length,
      };
    });
    const top = [...data.posts]
      .map((p) => ({ ...p, likes: data.likes.filter((l) => l.content_id === p.id).length, views: data.views.filter((v) => v.content_id === p.id).length }))
      .sort((a, b) => b.likes + b.views - (a.likes + a.views))
      .slice(0, 5);
    return { followers, newFollowers, likes: likesR.length, comments: commentsR.length, reached, views, series, top, posts: data.posts.length };
  }, [data, range]);

  if (isLoading || !stats) return <div className="h-40 animate-pulse rounded-2xl bg-secondary" />;
  const max = Math.max(1, ...stats.series.map((s) => s.v));
  const engaged = stats.likes + stats.comments;

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <Button key={r} size="sm" variant={range === r ? "default" : "secondary"} onClick={() => setRange(r)} className="rounded-full">Last {r} days</Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={Eye} label="Views" value={stats.views} />
        <Stat icon={Users} label="Accounts reached" value={stats.reached} />
        <Stat icon={Heart} label="Interactions" value={engaged} />
        <Stat icon={TrendingUp} label="Followers" value={stats.followers} sub={`+${stats.newFollowers}`} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-bold">Activity</h3>
          <span className="text-xs text-muted-foreground">Likes + new followers per day</span>
        </div>
        <div className="flex h-36 items-end gap-[3px]">
          {stats.series.map((s) => (
            <div key={s.d} title={`${s.d}: ${s.v}`} className="flex-1 rounded-t bg-gradient-primary opacity-90 transition hover:opacity-100" style={{ height: `${Math.max(4, (s.v / max) * 100)}%` }} />
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 font-bold">Interactions breakdown</h3>
          <Bar label="Likes" value={stats.likes} total={Math.max(1, engaged)} />
          <Bar label="Comments" value={stats.comments} total={Math.max(1, engaged)} />
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-3 font-bold">Content you shared</h3>
          <p className="text-3xl font-black">{stats.posts}</p>
          <p className="text-sm text-muted-foreground">posts, reels & stories</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <h3 className="mb-3 font-bold">Top content</h3>
        {stats.top.length === 0 ? (
          <p className="text-sm text-muted-foreground">Share something to see how it performs.</p>
        ) : (
          <ul className="space-y-2">
            {stats.top.map((p) => (
              <li key={p.id}>
                <Link to="/c/$id" params={{ id: p.id }} className="flex items-center gap-3 rounded-xl p-2 hover:bg-secondary">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {(p.cover_url || p.media_url) && <img src={p.cover_url || p.media_url!} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{p.title}</p>
                    <p className="text-xs capitalize text-muted-foreground">{p.type}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">♥ {p.likes} · 👁 {p.views}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
function Stat({ icon: Icon, label, value, sub }: { icon: typeof Eye; label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="mb-2 h-4 w-4 text-primary" />
      <p className="text-2xl font-black">{value.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{label} {sub && <span className="font-semibold text-primary">{sub}</span>}</p>
    </div>
  );
}
function Bar({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-semibold">{value}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-gradient-primary" style={{ width: `${(value / total) * 100}%` }} /></div>
    </div>
  );
}

/* ---------------- Toggles ---------------- */
function ToggleRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
const Card = ({ children }: { children: ReactNode }) => <div className="overflow-hidden rounded-2xl border border-border bg-card">{children}</div>;

function Privacy() {
  const { profile, userId } = useAuth();
  const qc = useQueryClient();
  const set = async (v: boolean) => {
    const { error } = await supabase.from("profiles").update({ is_private: v }).eq("id", userId!);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["me", userId] });
    toast.success(v ? "Your account is now private" : "Your account is now public");
  };
  return (
    <Card>
      <ToggleRow label="Private account" checked={!!profile?.is_private} onChange={set}
        desc="When your account is private, only people you approve can see your posts, reels and connections." />
    </Card>
  );
}

function PrivacySettings() {
  const { userId } = useAuth();
  const [status, setStatus] = useLocalFlag("activity-status", userId, true);
  const [mentions, setMentions] = useLocalFlag("mentions", userId, true);
  const [reshare, setReshare] = useLocalFlag("reshare", userId, true);
  const [hideLikes, setHideLikes] = useLocalFlag("hide-likes", userId);
  const [msgReq, setMsgReq] = useLocalFlag("msg-requests", userId, true);
  return (
    <Card>
      <ToggleRow label="Show activity status" desc="Let connections see when you were last active." checked={status} onChange={setStatus} />
      <ToggleRow label="Allow mentions" desc="Let others @mention you in posts and comments." checked={mentions} onChange={setMentions} />
      <ToggleRow label="Allow resharing to stories" checked={reshare} onChange={setReshare} />
      <ToggleRow label="Hide like counts" desc="You won't see like counts on other people's posts." checked={hideLikes} onChange={setHideLikes} />
      <ToggleRow label="Message requests from anyone" checked={msgReq} onChange={setMsgReq} />
    </Card>
  );
}

function Devices() {
  const [perm, setPerm] = useState<Record<string, string>>({});
  const items = [
    { id: "camera", label: "Camera" }, { id: "microphone", label: "Microphone" },
    { id: "geolocation", label: "Location" }, { id: "notifications", label: "Notifications" },
  ];
  useEffect(() => {
    void 0;
    items.forEach(async (i) => {
      try {
        const r = await navigator.permissions.query({ name: i.id as PermissionName });
        setPerm((p) => ({ ...p, [i.id]: r.state }));
      } catch { setPerm((p) => ({ ...p, [i.id]: "unknown" })); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ask = async (id: string) => {
    try {
      if (id === "camera") await navigator.mediaDevices.getUserMedia({ video: true }).then((s) => s.getTracks().forEach((t) => t.stop()));
      if (id === "microphone") await navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => s.getTracks().forEach((t) => t.stop()));
      if (id === "geolocation") await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      if (id === "notifications") await Notification.requestPermission();
      setPerm((p) => ({ ...p, [id]: "granted" }));
    } catch { setPerm((p) => ({ ...p, [id]: "denied" })); toast.error("Permission blocked — change it in your browser settings."); }
  };
  return (
    <Card>
      {items.map((i) => (
        <div key={i.id} className="flex items-center gap-3 border-b border-border px-4 py-4 last:border-b-0">
          <span className="flex-1 text-sm font-medium">{i.label}</span>
          <span className="text-xs capitalize text-muted-foreground">{perm[i.id] ?? "…"}</span>
          {perm[i.id] !== "granted" && <Button size="sm" variant="secondary" onClick={() => ask(i.id)}>Allow</Button>}
        </div>
      ))}
    </Card>
  );
}

/* ---------------- People lists (block / close / favorites) ---------------- */
function PeopleList({ kind }: { kind: "blocked" | "close" | "favorites" }) {
  const { userId } = useAuth();
  const { list, toggle } = useLocalList(kind, userId);
  const [q, setQ] = useState("");
  const { data: people = [] } = useQuery({
    queryKey: ["people-search", q],
    queryFn: async () => {
      let req = supabase.from("profiles").select("id,username,display_name,avatar_url").neq("id", userId!).limit(30);
      if (q) req = req.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`);
      return (await req).data ?? [];
    },
  });
  const { data: selected = [] } = useQuery({
    queryKey: ["people-sel", kind, list.join()],
    queryFn: async () => list.length ? (await supabase.from("profiles").select("id,username,display_name,avatar_url").in("id", list)).data ?? [] : [],
  });
  const copy = {
    blocked: { desc: "Blocked people can't find your profile, posts or stories. They won't be notified.", on: "Unblock", off: "Block" },
    close: { desc: "Only people on this list can see stories you share with close connections.", on: "Remove", off: "Add" },
    favorites: { desc: "Posts from favorites show higher in your feed. They won't be notified.", on: "Remove", off: "Add" },
  }[kind];
  const Person = ({ p, on }: { p: { id: string; username: string; display_name: string; avatar_url: string | null }; on: boolean }) => (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <UserAvatar src={p.avatar_url} name={p.display_name} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{p.username}</p>
        <p className="truncate text-xs text-muted-foreground">{p.display_name}</p>
      </div>
      <Button size="sm" variant={on ? "secondary" : kind === "blocked" ? "destructive" : "default"} onClick={() => { toggle(p.id); toast.success(`${on ? copy.on : copy.off}: @${p.username}`); }}>
        {on ? copy.on : copy.off}
      </Button>
    </div>
  );
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{copy.desc}</p>
      {selected.length > 0 && <Card>{selected.map((p) => <Person key={p.id} p={p} on />)}</Card>}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people" className="pl-9" />
      </div>
      <Card>
        {people.filter((p) => !list.includes(p.id)).map((p) => <Person key={p.id} p={p} on={false} />)}
        {people.length === 0 && <p className="p-4 text-sm text-muted-foreground">No people found.</p>}
      </Card>
    </div>
  );
}

/* ---------------- Activity ---------------- */
function Activity() {
  const { userId } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-activity", userId],
    queryFn: async () => {
      const [{ data: likes }, { data: comments }, { data: posts }] = await Promise.all([
        supabase.from("likes").select("content_id,created_at,content(title)").eq("user_id", userId!).order("created_at", { ascending: false }).limit(20),
        supabase.from("comments").select("*").eq("author_id", userId!).order("created_at", { ascending: false }).limit(20),
        supabase.from("content").select("id,title,type,created_at").eq("author_id", userId!).order("created_at", { ascending: false }).limit(20),
      ]);
      type Item = { at: string; text: string; id: string };
      const items: Item[] = [
        ...((likes ?? []) as unknown as { content_id: string; created_at: string; content: { title: string } | null }[]).map((l) => ({ at: l.created_at, text: `You liked "${l.content?.title ?? "a post"}"`, id: l.content_id })),
        ...((comments ?? []) as { content_id: string; created_at: string; body?: string }[]).map((c) => ({ at: c.created_at, text: `You commented${c.body ? `: "${c.body}"` : ""}`, id: c.content_id })),
        ...(posts ?? []).map((p) => ({ at: p.created_at, text: `You shared a ${p.type}: "${p.title}"`, id: p.id })),
      ];
      return items.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 40);
    },
  });
  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-secondary" />;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No recent activity yet.</p>;
  return (
    <Card>
      {data.map((i, n) => (
        <Link key={n} to="/c/$id" params={{ id: i.id }} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-secondary">
          <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-sm">{i.text}</span>
          <span className="text-xs text-muted-foreground">{new Date(i.at).toLocaleDateString()}</span>
        </Link>
      ))}
    </Card>
  );
}

/* ---------------- Report / Help ---------------- */
function Report() {
  const [text, setText] = useState("");
  const [kind, setKind] = useState("Something isn't working");
  const kinds = ["Something isn't working", "Spam or abuse", "Fake account", "Inappropriate content", "Other"];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => <Button key={k} size="sm" variant={k === kind ? "default" : "secondary"} className="rounded-full" onClick={() => setKind(k)}>{k}</Button>)}
      </div>
      <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Briefly explain what happened…" />
      <Button disabled={!text.trim()} onClick={() => { setText(""); toast.success("Thanks — your report was sent."); }}>Send report</Button>
    </div>
  );
}
function Help() {
  const faqs = [
    ["How do I make my account private?", "Go to Settings → Account privacy and switch on Private account."],
    ["How do I block someone?", "Settings → Blocked, search their name and tap Block."],
    ["Who sees my close connections stories?", "Only people you add in Settings → Close connections."],
    ["How do I change my password?", "Settings → Accounts & passwords → Change password."],
    ["How do I get verified?", "Settings → Account verification and submit a request."],
  ];
  return (
    <Card>
      {faqs.map(([q, a]) => (
        <details key={q} className="group border-b border-border px-4 py-3 last:border-b-0">
          <summary className="cursor-pointer list-none text-sm font-medium">{q}</summary>
          <p className="mt-2 text-sm text-muted-foreground">{a}</p>
        </details>
      ))}
    </Card>
  );
}

/* ---------------- Accounts & passwords ---------------- */
function Accounts() {
  const { session } = useAuth();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const change = async () => {
    if (pw.length < 8) return toast.error("Use at least 8 characters.");
    if (pw !== pw2) return toast.error("Passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPw(""); setPw2(""); toast.success("Password updated");
  };
  const reset = async () => {
    const email = session?.user.email; if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/auth" });
    error ? toast.error(error.message) : toast.success("Reset link sent to " + email);
  };
  return (
    <div className="space-y-5">
      <Card>
        <div className="px-4 py-4">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-semibold">{session?.user.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">Last sign-in: {session?.user.last_sign_in_at ? new Date(session.user.last_sign_in_at).toLocaleString() : "—"}</p>
        </div>
      </Card>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        <h3 className="font-bold">Change password</h3>
        <Input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Input type="password" placeholder="Confirm new password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        <div className="flex gap-2">
          <Button onClick={change} disabled={busy}>Update password</Button>
          <Button variant="secondary" onClick={reset}>Email me a reset link</Button>
        </div>
      </div>
      <Button variant="outline" onClick={async () => { await supabase.auth.signOut({ scope: "others" }); toast.success("Logged out of other devices"); }}>
        Log out of all other devices
      </Button>
    </div>
  );
}

/* ---------------- Verification ---------------- */
function Verify() {
  const { userId, profile } = useAuth();
  const [requested, setRequested] = useLocalFlag("verify-requested", userId);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  if (requested)
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <BadgeCheck className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h3 className="font-bold">Request under review</h3>
        <p className="mt-1 text-sm text-muted-foreground">We'll notify you once @{profile?.username}'s verification is reviewed.</p>
        <Button variant="ghost" className="mt-3" onClick={() => setRequested(false)}><X className="mr-1 h-4 w-4" />Cancel request</Button>
      </div>
    );
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">A verified badge shows people that your account is the authentic presence of who you represent.</p>
      <Input placeholder="Full legal name" value={name} onChange={(e) => setName(e.target.value)} />
      <Textarea rows={4} placeholder="Why should this account be verified? Add links to news articles or official pages." value={reason} onChange={(e) => setReason(e.target.value)} />
      <Button disabled={!name.trim() || !reason.trim()} onClick={() => { setRequested(true); toast.success("Verification request submitted"); }}>Submit request</Button>
    </div>
  );
}

/* ---------------- Docs ---------------- */
function Doc({ kind }: { kind: "policy" | "terms" }) {
  const body = kind === "policy"
    ? [
        ["Information we collect", "Your profile details, the content you share, your connections and how you use the community."],
        ["How we use it", "To run your feed, show insights, keep the community safe and improve features."],
        ["Who can see it", "Public profiles are visible to everyone. Private profiles only to approved connections."],
        ["Your choices", "You can make your account private, block people, and delete content at any time from Settings."],
      ]
    : [
        ["Using the community", "Be respectful. No harassment, spam, impersonation or illegal content."],
        ["Your content", "You own what you post. You allow us to display it to the audience you choose."],
        ["Account safety", "Keep your password secure. You're responsible for activity on your account."],
        ["Ending access", "We may remove content or accounts that break these terms."],
      ];
  return (
    <div className="space-y-4">
      {body.map(([h, p]) => (
        <div key={h} className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-bold">{h}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{p}</p>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Last updated {new Date().getFullYear()}.</p>
    </div>
  );
}

function SignInNote() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">Sign in to use this setting.</p>
      <Button asChild className="mt-3"><Link to="/auth">Sign in</Link></Button>
    </div>
  );
}
