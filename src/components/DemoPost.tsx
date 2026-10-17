import { useState } from "react";
import { Bookmark, Heart, Send, MessageCircle } from "lucide-react";
import { Button } from "./ui/button";
import { UserAvatar } from "./UserAvatar";
import { demoPosts } from "@/lib/demo-content";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function DemoPost({ post }: { post: (typeof demoPosts)[number] }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);
  return (
    <article className="overflow-hidden border-b border-border bg-background sm:rounded-lg sm:border">
      <header className="space-y-2 px-4 py-3">
        <div className="flex items-center gap-2 [&_svg]:size-6">
          <UserAvatar src={post.author.avatar_url} name={post.author.display_name} size={42} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{post.author.display_name}</p>
            <p className="truncate text-xs text-muted-foreground">@{post.author.username}</p>
          </div>
          <span className="text-xs font-semibold text-primary">Demo post</span>
        </div>

      </header>
      <img src={post.image} alt={post.title} width={768} height={1024} loading="lazy" className="aspect-[4/5] w-full object-cover" />
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2 [&_svg]:size-6">
          <Button variant="ghost" size="icon" aria-label="Like demo post" aria-pressed={liked} onClick={() => setLiked(!liked)}><Heart className={cn(liked && "fill-primary text-primary")} /></Button>
          <Button variant="ghost" size="icon" aria-label="Comment on demo post" onClick={() => setCommenting(!commenting)}><MessageCircle /></Button>
          <Button variant="ghost" size="icon" aria-label="Share demo post" onClick={async () => { try { await navigator.clipboard.writeText(window.location.origin); toast.success("Link copied"); } catch { toast.error("Unable to copy link"); } }}><Send /></Button>
          <Button variant="ghost" size="icon" className="ml-auto" aria-label="Save demo post" aria-pressed={saved} onClick={() => setSaved(!saved)}><Bookmark className={cn(saved && "fill-foreground")} /></Button>
        </div>
        <p className="text-sm font-semibold">{post.likes + Number(liked)} likes</p>
        <p className="text-sm"><span className="mr-2 font-semibold">{post.author.username}</span>{post.caption}</p>
        {comments.map((text, i) => <p key={i} className="break-words text-sm"><span className="font-semibold">You </span>{text}</p>)}
        {commenting && <form className="flex gap-2 border-t border-border pt-3" onSubmit={(e) => { e.preventDefault(); if (!comment.trim()) return; setComments([...comments, comment.trim()]); setComment(""); }}>
          <input aria-label="Demo comment" placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          <Button variant="ghost" type="submit" disabled={!comment.trim()}>Post</Button>
        </form>}
      </div>
    </article>
  );
}