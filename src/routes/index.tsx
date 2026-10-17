import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RequireAuth, useAuth } from "@/lib/auth";
import { fetchContent, fetchMyReactions } from "@/lib/content";
import { ContentCard } from "@/components/ContentCard";
import { StoriesRail } from "@/components/Stories";
import { DemoPost } from "@/components/DemoPost";
import { demoPosts } from "@/lib/demo-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home · SAC Community" },
      { name: "description", content: "Your SAC Community feed: posts, reels, tweets, business events, tickets and news." },
      { property: "og:title", content: "SAC Community" },
      { property: "og:description", content: "Share, connect and discover local businesses on SAC Community." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <RequireAuth><Feed /></RequireAuth>,
});

const FEED_TYPES = ["post", "reel", "tweet", "event", "ticket", "news"];

export function useReactions() {
  const { userId } = useAuth();
  return useQuery({ queryKey: ["reactions", userId], queryFn: () => fetchMyReactions(userId) });
}

function Feed() {
  const { data, isLoading, error } = useQuery({ queryKey: ["feed"], queryFn: () => fetchContent({ types: FEED_TYPES }) });
  const { data: r } = useReactions();
  return (
    <div className="relative mx-auto max-w-[540px] pt-2 sm:px-5 sm:pt-5">
      <StoriesRail />
      <section className="min-w-0 space-y-4 pb-16 sm:space-y-6">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-card" />)}
        {error && <p className="rounded-xl bg-destructive/15 p-4 text-sm">Couldn't load the feed. {(error as Error).message}</p>}
        {r && data?.map((c) => <ContentCard key={c.id} c={c} liked={r.liked.has(c.id)} saved={r.saved.has(c.id)} />)}
        {demoPosts.map((post) => <DemoPost key={post.id} post={post} />)}
      </section>
    </div>
  );
}
