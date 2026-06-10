import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Loader2, Volume2, VolumeX, Sparkles, AlertCircle, Headphones, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useDeal } from "@/hooks/useDeals";
import { useLogObjection } from "@/hooks/useDealObjections";
import type { EngineState } from "@/types/engine";

const CHUNK_MS = 12_000; // send a chunk every ~12s

interface Tip {
  id: string;
  text: string;
  urgency: "low" | "med" | "high";
  at: number;
  step?: number;
}

interface Props {
  state: EngineState;
}

export default function LiveCoachPanel({ state }: Props) {
  const { user } = useAuth();
  const { activeDealId } = useActiveDeal();
  const { data: deal } = useDeal(activeDealId);
  const logObjection = useLogObjection();

  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ttsOn, setTtsOn] = useState(true);
  const [tips, setTips] = useState<Tip[]>([]);
  const [transcript, setTranscript] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);

  // Mic devices + meter
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [meterActive, setMeterActive] = useState(false);
  const [level, setLevel] = useState(0); // 0..100
  const [peak, setPeak] = useState(0);

  // Mic test states
  const [micTestRecording, setMicTestRecording] = useState(false);
  const [micTestProgress, setMicTestProgress] = useState(0);
  const [micTestAudioUrl, setMicTestAudioUrl] = useState<string | null>(null);
  const [micTestPlaying, setMicTestPlaying] = useState(false);

  // Voice selection
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");

  // Custom voice chime — recorded in the rep's own voice, plays before each spoken tip
  const [chimeUrl, setChimeUrl] = useState<string | null>(null);
  const [chimeRecording, setChimeRecording] = useState(false);
  const [chimeProgress, setChimeProgress] = useState(0);
  const [useChime, setUseChime] = useState(false);

  // Pause-aware speaking
  const [waitForPause, setWaitForPause] = useState(true);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef("");
  const taggedObjectionsRef = useRef<Set<string>>(new Set());
  const micTestTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const chimeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chimeRecRef = useRef<MediaRecorder | null>(null);

  // Meter refs
  const meterStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const peakRef = useRef(0);
  const peakDecayRef = useRef<number>(0);

  // Live silence tracking for "wait for pause" speaking
  const liveAnalyserRef = useRef<AnalyserNode | null>(null);
  const liveCtxRef = useRef<AudioContext | null>(null);
  const liveRafRef = useRef<number | null>(null);
  const lastVoiceAtRef = useRef<number>(0);
  const tipQueueRef = useRef<string[]>([]);
  const drainTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spokenRef = useRef(false);

  const loadDevices = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const mics = list.filter((d) => d.kind === "audioinput");
      setDevices(mics);
      setSelectedDeviceId((prev) => {
        if (prev && mics.some((m) => m.deviceId === prev)) return prev;
        return mics[0]?.deviceId ?? "";
      });
    } catch (e) {
      console.error("enumerateDevices failed", e);
    }
  }, []);

  useEffect(() => {
    loadDevices();
    const handler = () => loadDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", handler);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", handler);
    };
  }, [loadDevices]);

  useEffect(() => {
    return () => {
      stopAll();
      stopMeter();
      if (micTestTimerRef.current) clearInterval(micTestTimerRef.current);
      if (audioPlayerRef.current) { audioPlayerRef.current.pause(); audioPlayerRef.current = null; }
      if (micTestAudioUrl) URL.revokeObjectURL(micTestAudioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load TTS voices (async on Chrome)
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (!list.length) return;
      setVoices(list);
      setSelectedVoiceURI((prev) => {
        if (prev && list.some((v) => v.voiceURI === prev)) return prev;
        const en = list.find((v) => /en[-_]US/i.test(v.lang)) || list.find((v) => v.lang?.startsWith("en")) || list[0];
        return en?.voiceURI ?? "";
      });
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  function speakNow(text: string) {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const playUtterance = () => {
        const u = new SpeechSynthesisUtterance(text);
        const v = voices.find((vv) => vv.voiceURI === selectedVoiceURI);
        if (v) u.voice = v;
        u.rate = 1.02; u.pitch = 1; u.volume = 1;
        window.speechSynthesis.speak(u);
      };
      if (useChime && chimeUrl) {
        const a = new Audio(chimeUrl);
        a.onended = playUtterance;
        a.onerror = playUtterance;
        a.play().catch(playUtterance);
      } else {
        playUtterance();
      }
    } catch { /* ignore */ }
  }

  // Queue a tip and let the drain loop speak it once the homeowner pauses
  function queueTip(text: string) {
    if (!ttsOn) return;
    tipQueueRef.current.push(text);
    if (!waitForPause) {
      const next = tipQueueRef.current.shift();
      if (next) speakNow(next);
    }
  }

  function stopAll() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    if (drainTimerRef.current) clearInterval(drainTimerRef.current);
    drainTimerRef.current = null;
    if (liveRafRef.current != null) cancelAnimationFrame(liveRafRef.current);
    liveRafRef.current = null;
    try { liveAnalyserRef.current?.disconnect(); } catch { /* ignore */ }
    liveAnalyserRef.current = null;
    try { liveCtxRef.current?.close(); } catch { /* ignore */ }
    liveCtxRef.current = null;
    tipQueueRef.current = [];
    if (mediaRef.current && mediaRef.current.state !== "inactive") {
      try { mediaRef.current.stop(); } catch { /* ignore */ }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRef.current = null;
  }

  function stopMeter() {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    try { analyserRef.current?.disconnect(); } catch { /* ignore */ }
    analyserRef.current = null;
    try { audioCtxRef.current?.close(); } catch { /* ignore */ }
    audioCtxRef.current = null;
    meterStreamRef.current?.getTracks().forEach((t) => t.stop());
    meterStreamRef.current = null;
    setMeterActive(false);
    setLevel(0);
    setPeak(0);
    peakRef.current = 0;
  }

  async function startMeter() {
    if (meterActive) return;
    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      meterStreamRef.current = stream;

      // Refresh labels now that we have permission
      loadDevices();

      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        // RMS for stable level
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        // Scale: rms ~0..0.5 typical speech -> 0..100
        const lvl = Math.min(100, Math.round(rms * 220));
        setLevel(lvl);
        const now = performance.now();
        if (lvl > peakRef.current) {
          peakRef.current = lvl;
          peakDecayRef.current = now;
          setPeak(lvl);
        } else if (now - peakDecayRef.current > 700) {
          peakRef.current = Math.max(0, peakRef.current - 2);
          setPeak(peakRef.current);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      setMeterActive(true);
      tick();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Mic blocked";
      toast.error("Could not start meter: " + msg);
      stopMeter();
    }
  }

  // When device changes while meter is on, restart it on the new device
  useEffect(() => {
    if (!meterActive) return;
    stopMeter();
    // small delay to allow cleanup
    const id = setTimeout(() => { startMeter(); }, 50);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId]);

  // Mic test — record 3 seconds then play it back
  async function testMic() {
    if (micTestRecording) return;
    setMicTestAudioUrl(null);
    setMicTestRecording(true);
    setMicTestProgress(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: true, noiseSuppression: true, autoGainControl: true,
        },
      });

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";

      const rec = new MediaRecorder(stream, { mimeType: mime });
      const parts: Blob[] = [];
      rec.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(parts, { type: mime });
        const url = URL.createObjectURL(blob);
        setMicTestAudioUrl(url);
        setMicTestRecording(false);
        setMicTestProgress(100);
      };

      rec.start();
      let elapsed = 0;
      const TOTAL = 3000;
      micTestTimerRef.current = setInterval(() => {
        elapsed += 100;
        setMicTestProgress(Math.min((elapsed / TOTAL) * 100, 100));
        if (elapsed >= TOTAL) {
          if (micTestTimerRef.current) clearInterval(micTestTimerRef.current);
          micTestTimerRef.current = null;
          try { rec.stop(); } catch { /* ignore */ }
        }
      }, 100);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Mic blocked";
      toast.error("Mic check failed: " + msg);
      setMicTestRecording(false);
      setMicTestProgress(0);
    }
  }

  function playTestAudio() {
    if (!micTestAudioUrl) return;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    const audio = new Audio(micTestAudioUrl);
    audioPlayerRef.current = audio;
    setMicTestPlaying(true);
    audio.onended = () => setMicTestPlaying(false);
    audio.onerror = () => {
      setMicTestPlaying(false);
      toast.error("Could not play back test audio");
    };
    audio.play();
  }

  const sendChunk = useCallback(async (blob: Blob, mimeType: string) => {
    if (blob.size < 2000) return; // skip near-silent tiny chunks
    setBusy(true);
    try {
      const buf = await blob.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const CHUNK = 0x8000;
      for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
      }
      const audioBase64 = btoa(binary);

      const { data, error } = await supabase.functions.invoke("live-coach", {
        body: {
          audioBase64,
          mimeType,
          recentTranscript: transcriptRef.current.slice(-2000),
          dealContext: {
            homeowner: state.homeowner1,
            products: state.products,
            stage: state.currentStage,
            selectedOption: state.selectedOption,
          },
        },
      });
      if (error) throw error;
      const td = (data?.transcriptDelta as string) || "";
      const tip = (data?.tip as string) || "";
      const urgency = (data?.urgency as Tip["urgency"]) || "low";
      const objection = data?.objection as string | null;
      const step = data?.step as number | undefined;

      if (td.trim()) {
        transcriptRef.current = (transcriptRef.current + " " + td).trim();
        setTranscript(transcriptRef.current);
      }
      if (tip) {
        const t: Tip = { id: crypto.randomUUID(), text: tip, urgency, at: Date.now(), step };
        setTips((prev) => [t, ...prev].slice(0, 8));
        speak(tip);
      }
      if (objection && activeDealId && !taggedObjectionsRef.current.has(objection)) {
        taggedObjectionsRef.current.add(objection);
        logObjection.mutate({ dealId: activeDealId, objectionType: objection, notes: "Detected live by AI coach" });
      }
      if (sessionId) {
        await supabase.from("coaching_sessions").update({ transcript: transcriptRef.current }).eq("id", sessionId);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Coach error";
      console.error(msg);
      toast.error("Coach lost a beat: " + msg);
    } finally {
      setBusy(false);
    }
  }, [activeDealId, logObjection, sessionId, state.currentStage, state.homeowner1, state.products, state.selectedOption]);

  async function start() {
    if (!user) { toast.error("Sign in first"); return; }
    // Free up the meter stream so the recorder gets fresh exclusive access on some devices
    stopMeter();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: true, noiseSuppression: true, autoGainControl: true,
        },
      });
      streamRef.current = stream;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "audio/webm";

      const tick = async () => {
        if (!streamRef.current) return;
        const rec = new MediaRecorder(streamRef.current, { mimeType: mime });
        const parts: Blob[] = [];
        rec.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
        rec.onstop = () => {
          const blob = new Blob(parts, { type: mime });
          void sendChunk(blob, mime);
        };
        rec.start();
        setTimeout(() => { try { rec.stop(); } catch { /* ignore */ } }, CHUNK_MS - 200);
        mediaRef.current = rec;
      };

      const { data: sess, error: sessErr } = await supabase
        .from("coaching_sessions")
        .insert({ rep_id: user.id, deal_id: activeDealId, transcript: "" })
        .select("id")
        .single();
      if (sessErr) throw sessErr;
      setSessionId(sess.id);

      transcriptRef.current = "";
      taggedObjectionsRef.current = new Set();
      setTranscript("");
      setTips([]);
      setLastSummary(null);

      await tick();
      intervalRef.current = setInterval(tick, CHUNK_MS);
      setRecording(true);
      toast.success("Live coach listening");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Mic blocked";
      toast.error(msg);
      stopAll();
    }
  }

  async function stop() {
    stopAll();
    setRecording(false);
    window.speechSynthesis?.cancel();

    if (sessionId && transcriptRef.current.trim().length > 20) {
      setSummarizing(true);
      try {
        const { data, error } = await supabase.functions.invoke("coach-summary", {
          body: { transcript: transcriptRef.current },
        });
        if (error) throw error;
        const summary = (data?.summary as string) || "";
        await supabase.from("coaching_sessions").update({
          ended_at: new Date().toISOString(),
          transcript: transcriptRef.current,
          summary,
          next_steps: data?.nextSteps ?? [],
          detected_objections: data?.objections ?? [],
        }).eq("id", sessionId);
        setLastSummary(summary);
        toast.success("Session summarized & saved");
      } catch (e: unknown) {
        toast.error("Summary failed: " + (e instanceof Error ? e.message : "unknown"));
      } finally {
        setSummarizing(false);
      }
    } else if (sessionId) {
      await supabase.from("coaching_sessions").update({ ended_at: new Date().toISOString() }).eq("id", sessionId);
    }
  }

  const urgencyClass = (u: Tip["urgency"]) =>
    u === "high" ? "border-red-500/60 bg-red-500/10"
    : u === "med" ? "border-amber-500/50 bg-amber-500/10"
    : "border-primary/40 bg-primary/5";

  // Color the meter green/amber/red based on level
  const meterColor =
    level > 80 ? "bg-red-500"
    : level > 55 ? "bg-amber-500"
    : level > 8 ? "bg-green-500"
    : "bg-muted-foreground/40";

  return (
    <div className="card-premium p-6 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="rounded-xl gradient-brand p-3 shadow-[var(--shadow-glow)]">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display gradient-text">Live Manager on Duty</h3>
            <p className="text-xs text-muted-foreground">AI listens through your mic/AirPods and whispers the next move.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {ttsOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span>Speak tips</span>
            <Switch checked={ttsOn} onCheckedChange={setTtsOn} />
          </div>
          {!recording ? (
            <Button onClick={start} className="gradient-brand text-primary-foreground rounded-xl pressable" size="lg">
              <Mic className="h-4 w-4 mr-2" /> Start live coaching
            </Button>
          ) : (
            <Button onClick={stop} variant="destructive" className="rounded-xl pressable" size="lg">
              <MicOff className="h-4 w-4 mr-2" /> End & summarize
            </Button>
          )}
        </div>
      </div>

      {!activeDealId && (
        <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <AlertCircle className="h-4 w-4" /> No active deal selected — session will save without a deal link.
        </div>
      )}

      {/* Mic check card */}
      {!recording && (
        <div className="rounded-xl border border-hairline bg-muted/30 p-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Headphones className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">Mic check</h4>
                <p className="text-xs text-muted-foreground">Pick your input, watch the meter, then record a 3-second clip.</p>
              </div>
            </div>
            <Button
              onClick={loadDevices}
              variant="ghost"
              size="sm"
              className="rounded-lg text-xs"
              title="Refresh device list"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
          </div>

          {/* Device picker */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1 block">
                Microphone
              </label>
              <Select
                value={selectedDeviceId}
                onValueChange={setSelectedDeviceId}
              >
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder={devices.length ? "Choose a microphone" : "Grant mic access to see devices"} />
                </SelectTrigger>
                <SelectContent>
                  {devices.length === 0 && (
                    <SelectItem value="__none" disabled>No mics found</SelectItem>
                  )}
                  {devices.map((d, i) => (
                    <SelectItem key={d.deviceId || `dev-${i}`} value={d.deviceId || `dev-${i}`}>
                      {d.label || `Microphone ${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex md:justify-end">
              {!meterActive ? (
                <Button
                  onClick={startMeter}
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-hairline-strong"
                >
                  <Mic className="h-4 w-4 mr-1" /> Start meter
                </Button>
              ) : (
                <Button
                  onClick={stopMeter}
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-hairline-strong"
                >
                  <MicOff className="h-4 w-4 mr-1" /> Stop meter
                </Button>
              )}
            </div>
          </div>

          {/* Live level meter */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Input level</span>
              <span className="text-[11px] text-muted-foreground">
                {meterActive ? (level < 5 ? "Silent — try speaking" : level > 80 ? "Loud" : "Picking you up") : "Meter off"}
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full ${meterColor} transition-[width] duration-75`}
                style={{ width: `${level}%` }}
              />
              {/* Peak hold marker */}
              {meterActive && peak > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-foreground/80"
                  style={{ left: `calc(${peak}% - 1px)` }}
                />
              )}
              {/* Tick marks */}
              <div className="absolute inset-0 flex justify-between px-[2px] pointer-events-none">
                {[0, 25, 50, 75, 100].map((t) => (
                  <div key={t} className="w-px h-full bg-foreground/10" />
                ))}
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>0</span><span>quiet</span><span>good</span><span>hot</span><span>peak</span>
            </div>
          </div>

          {/* Record + playback */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
            <div className="flex items-center gap-2">
              {!micTestRecording ? (
                <Button onClick={testMic} size="sm" className="rounded-lg gradient-brand text-primary-foreground pressable">
                  <Mic className="h-4 w-4 mr-1" /> Record 3s test
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Recording…</span>
                  <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-100"
                      style={{ width: `${micTestProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {micTestAudioUrl && !micTestRecording && (
                <Button
                  onClick={playTestAudio}
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-hairline-strong"
                  disabled={micTestPlaying}
                >
                  {micTestPlaying ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Volume2 className="h-4 w-4 mr-1" />}
                  Play back
                </Button>
              )}
            </div>
            {micTestAudioUrl && !micTestRecording && (
              <div className="flex items-center gap-2 text-xs text-green-500">
                <CheckCircle2 className="h-4 w-4" /> Mic is working — you heard the playback.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Live coaching feed</h4>
            {busy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          {tips.length === 0 ? (
            <div className="rounded-xl border border-hairline bg-muted/30 p-5 text-sm text-muted-foreground">
              {recording ? "Listening… tips will appear here in seconds." : "Press Start to begin a live session."}
            </div>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {tips.map((t) => (
                <li key={t.id} className={`rounded-xl border p-4 ${urgencyClass(t.urgency)} animate-fade-in`}>
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase">{t.urgency}{t.step ? ` · step ${t.step}` : ""}</Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(t.at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug">{t.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2 space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Live transcript</h4>
          <div className="rounded-xl border border-hairline bg-muted/20 p-4 text-xs text-muted-foreground leading-relaxed h-[420px] overflow-y-auto whitespace-pre-wrap">
            {transcript || (recording ? "…" : "Transcript will appear here while you record.")}
          </div>
        </div>
      </div>

      {summarizing && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Loader2 className="h-4 w-4 animate-spin" /> Summarizing session…
        </div>
      )}
      {lastSummary && (
        <div className="rounded-xl bg-primary/5 border border-primary/30 p-4">
          <h5 className="text-sm font-semibold mb-1">Session summary</h5>
          <p className="text-sm text-muted-foreground leading-relaxed">{lastSummary}</p>
        </div>
      )}

      {deal?.id && (
        <p className="text-[11px] text-muted-foreground">Linked to deal: {deal.homeowner1 || deal.id.slice(0, 8)}</p>
      )}
    </div>
  );
}
