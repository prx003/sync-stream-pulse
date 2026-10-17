import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronLeft, Music, Pause, Play, Volume2, X } from "lucide-react";
import { TRACKS } from "@/lib/composer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";

type MusicSelection = { title: string; artist: string };
type Preview = { previewUrl: string; trackName: string; artistName: string };
const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function MusicPicker({ value, onPick }: { value: MusicSelection | null; onPick: (music: MusicSelection | null) => void }) {
  const [q, setQ] = useState("");
  const [track, setTrack] = useState(value);
  const [draft, setDraft] = useState(value ?? { title: "", artist: "" });
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [audioError, setAudioError] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const preview = useQuery({
    queryKey: ["music-preview", track?.title, track?.artist],
    enabled: !!track,
    staleTime: 30 * 60 * 1000,
    queryFn: async ({ signal }): Promise<Preview | null> => {
      if (!track) return null;
      const response = await fetch(`https://itunes.apple.com/search?${new URLSearchParams({ term: `${track.title} ${track.artist}`, entity: "song", limit: "5" })}`, { signal });
      if (!response.ok) throw new Error("Music previews are unavailable");
      const data: { results: Preview[] } = await response.json();
      return data.results.find((song) => song.previewUrl && song.trackName.toLowerCase().includes(track.title.toLowerCase())) ?? null;
    },
    retry: false,
  });

  useEffect(() => {
    if (audio.current) audio.current.volume = volume / 100;
  }, [volume, preview.data?.previewUrl]);

  const select = (song: MusicSelection) => {
    audio.current?.pause();
    setPlaying(false); setPosition(0); setDuration(0); setAudioError(false);
    setTrack(song); setDraft(song);
  };
  const toggle = async () => {
    const player = audio.current;
    if (!player) return;
    if (!player.paused) return player.pause();
    try { await player.play(); } catch { setAudioError(true); }
  };
  const list = TRACKS.filter((song) => `${song.title} ${song.artist}`.toLowerCase().includes(q.toLowerCase()));

  return <>
    <SheetHeader><SheetTitle>{track ? "Edit music" : "Add music"}</SheetTitle></SheetHeader>
    <div className="space-y-5 px-4 pb-6">
      {track ? <>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Choose another song" title="Choose another song" onClick={() => { audio.current?.pause(); setPlaying(false); setTrack(null); }}><ChevronLeft /></Button>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-social-action/10 text-social-action"><Music /></span>
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{track.title}</p><p className="truncate text-sm text-muted-foreground">{track.artist}</p></div>
        </div>
        <div className="space-y-4 border-y border-border py-4">
          <div className="flex items-center gap-3">
            <Button variant="social" size="icon" className="h-12 w-12 shrink-0 rounded-full" aria-label={playing ? "Pause music" : "Play music"} title={playing ? "Pause music" : "Play music"} disabled={!preview.data?.previewUrl || audioError} onClick={toggle}>{playing ? <Pause /> : <Play />}</Button>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-xs text-muted-foreground">{preview.isFetching ? "Loading preview…" : preview.isError || !preview.data || audioError ? "Preview unavailable for this song" : "Apple Music preview"}</p>
              <Slider aria-label="Music position" min={0} max={duration || 1} step={0.1} value={[position]} disabled={!duration} onValueChange={([next]) => { if (next !== undefined && audio.current) { audio.current.currentTime = next; setPosition(next); } }} />
              <div className="flex justify-between text-xs tabular-nums text-muted-foreground"><span>{time(position)}</span><span>{time(duration)}</span></div>
            </div>
          </div>
          <div className="flex items-center gap-3"><Volume2 className="h-4 w-4 text-muted-foreground" /><Slider aria-label="Music volume" min={0} max={100} step={1} value={[volume]} onValueChange={([next]) => next !== undefined && setVolume(next)} /><span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{volume}%</span></div>
          {preview.data?.previewUrl && <audio ref={audio} src={preview.data.previewUrl} preload="metadata" onLoadedMetadata={(e) => setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)} onTimeUpdate={(e) => setPosition(e.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setPosition(0); if (audio.current) audio.current.currentTime = 0; }} onError={() => setAudioError(true)} />}
        </div>
        <div className="space-y-3">
          <label className="block space-y-1.5 text-sm font-medium"><span>Song title</span><Input value={draft.title} maxLength={150} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
          <label className="block space-y-1.5 text-sm font-medium"><span>Artist</span><Input value={draft.artist} maxLength={150} onChange={(e) => setDraft({ ...draft, artist: e.target.value })} /></label>
        </div>
        <p className="text-xs text-muted-foreground">Preview only · Shared content includes the song name, not an audio soundtrack.</p>
        <Button variant="social" className="w-full" disabled={!draft.title.trim()} onClick={() => onPick({ title: draft.title.trim(), artist: draft.artist.trim() })}><Check />Done</Button>
      </> : <>
        <Input aria-label="Search music" placeholder="Search music" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="space-y-1">{list.map((song) => <div key={song.title} className="flex items-center gap-1">
          <Button variant="ghost" className="h-auto min-w-0 flex-1 justify-start gap-3 px-2 py-3 text-left" onClick={() => select(song)}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-social-action/10 text-social-action"><Music className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><b className="block truncate text-sm">{song.title}</b><span className="block truncate text-xs font-normal text-muted-foreground">{song.artist}</span></span>
            {value?.title === song.title && <Check className="h-4 w-4 shrink-0 text-social-action" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Preview ${song.title}`} title={`Preview ${song.title}`} onClick={() => select(song)}><Play className="h-4 w-4" /></Button>
        </div>)}</div>
        {q.trim() && !list.length && <Button variant="secondary" className="h-auto w-full whitespace-normal" onClick={() => select({ title: q.trim(), artist: "Original audio" })}>Use “{q.trim()}”</Button>}
      </>}
      {value && <Button variant="ghost" className="w-full text-destructive" onClick={() => onPick(null)}><X className="h-4 w-4" />Remove music</Button>}
    </div>
  </>;
}