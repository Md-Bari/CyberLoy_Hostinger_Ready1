import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle2, RefreshCw, Lock, Clock, Check } from 'lucide-react';
import { api } from '../lib/api';

export default function YouTubePlayer({
    videoId,
    lessonId,
    lessonDuration = 0,       // Admin-configured required watch time in seconds (authoritative)
    initialProgress = 0,
    isCompleted = false,
    requiredPercentage = 100,
    onProgressUpdate,
    onCompleted,
}) {
    const [watchPercentage, setWatchPercentage] = useState(initialProgress);
    const [completed, setCompleted] = useState(isCompleted);
    const [currentTime, setCurrentTime] = useState(0);      // YouTube playback position
    const [activeSeconds, setActiveSeconds] = useState(0);  // Real seconds user has watched
    const [isPlaying, setIsPlaying] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);

    // Refs — stable across renders, safe to read in closures
    const playerRef = useRef(null);
    const containerIdRef = useRef(`yt-${lessonId}-${Math.random().toString(36).substr(2, 6)}`);
    const tickerRef = useRef(null);
    const activeSecondsRef = useRef(0);   // Mirror of activeSeconds state
    const currentTimeRef = useRef(0);     // Mirror of currentTime state
    const lastSyncPosRef = useRef(0);     // Last YouTube position synced
    const lastSyncActiveRef = useRef(0);  // activeSeconds value at last sync — for computing delta
    const heartbeatRef = useRef(0);
    const lessonDurRef = useRef(lessonDuration > 0 ? lessonDuration : 0);
    const ytActualDurRef = useRef(0);

    // Effective display duration: admin-set takes priority, fall back to YouTube actual
    const getDisplayDuration = () =>
        lessonDurRef.current > 0 ? lessonDurRef.current : (ytActualDurRef.current > 0 ? ytActualDurRef.current : 600);


    const [displayDuration, setDisplayDuration] = useState(lessonDuration > 0 ? lessonDuration : 600);

    useEffect(() => {
        setWatchPercentage(initialProgress);
        setCompleted(isCompleted);
    }, [initialProgress, isCompleted, lessonId]);

    // Clean 11-char YouTube ID
    const cleanVideoId = (() => {
        if (!videoId) return '3Kq1MIfTWCE';
        if (videoId.length === 11) return videoId;
        const m = String(videoId).match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
        return m ? m[1] : videoId;
    })();

    // ─── Sync active watch time to backend ───────────────────────────────────
    const syncProgressToBackend = useCallback(async (isEnd = false) => {
        const effectiveDur = getDisplayDuration();
        let pos = currentTimeRef.current;

        if (playerRef.current?.getCurrentTime) {
            try {
                const t = playerRef.current.getCurrentTime();
                if (t !== undefined && !isNaN(t)) pos = t;
            } catch (_) {}
        }

        if (isEnd) pos = effectiveDur;

        // Delta = new active seconds accumulated since the last sync
        const activeDelta = activeSecondsRef.current - lastSyncActiveRef.current;
        lastSyncActiveRef.current = activeSecondsRef.current;

        const prevPos = lastSyncPosRef.current;
        lastSyncPosRef.current = pos;

        const start = Math.max(0, Math.floor(prevPos));
        const end   = Math.ceil(pos);

        setSyncing(true);
        try {
            const res = await api.recordVideoProgress({
                lesson_id:            lessonId,
                current_position:     pos,
                duration:             effectiveDur,
                active_seconds_delta: Math.max(0, activeDelta), // Real seconds watched since last sync
                interval_start:       start,
                interval_end:         end,
                video_id:             cleanVideoId,
            });

            if (res.watch_percentage !== undefined) {
                setWatchPercentage(res.watch_percentage);
                onProgressUpdate?.(res);
            }
            if (res.lesson_completed) {
                setCompleted(true);
                onCompleted?.(res);
            }

            setSyncSuccess(true);
            setTimeout(() => setSyncSuccess(false), 2000);
        } catch (e) {
            console.error('Video heartbeat error:', e);
        } finally {
            setSyncing(false);
        }
    }, [lessonId, cleanVideoId, onProgressUpdate, onCompleted]);

    // ─── 1. Initialize YouTube IFrame Player API ──────────────────────────────
    useEffect(() => {
        if (!cleanVideoId) return;
        let mounted = true;

        const initPlayer = () => {
            const el = document.getElementById(containerIdRef.current);
            if (!window.YT?.Player || !el) return;

            try { playerRef.current?.destroy?.(); } catch (_) {}

            try {
                playerRef.current = new window.YT.Player(containerIdRef.current, {
                    host: 'https://www.youtube-nocookie.com',
                    videoId: cleanVideoId,
                    playerVars: { autoplay: 0, controls: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, enablejsapi: 1, playsinline: 1 },
                    events: {
                        onReady: (event) => {
                            if (!mounted) return;
                            try {
                                const ytDur = event.target.getDuration();
                                if (ytDur > 0) {
                                    ytActualDurRef.current = Math.round(ytDur);
                                    // Only show YouTube duration if admin didn't set one
                                    if (lessonDurRef.current === 0) setDisplayDuration(Math.round(ytDur));
                                }
                            } catch (_) {}
                        },
                        onStateChange: (event) => {
                            if (!mounted) return;
                            const S = window.YT.PlayerState;
                            if (event.data === S.PLAYING)      setIsPlaying(true);
                            else if (event.data === S.PAUSED)  { setIsPlaying(false); syncProgressToBackend(); }
                            else if (event.data === S.ENDED)   { setIsPlaying(false); syncProgressToBackend(true); }
                        },
                    },
                });
            } catch (err) { console.warn('YT init error:', err); }
        };

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
            window.onYouTubeIframeAPIReady = initPlayer;
        } else {
            setTimeout(initPlayer, 100);
        }

        return () => {
            mounted = false;
            if (tickerRef.current) clearInterval(tickerRef.current);
            try { playerRef.current?.destroy?.(); } catch (_) {}
        };
    }, [cleanVideoId, lessonId]);

    // ─── 2. Stable 1-second ticker — NO currentTime in deps ──────────────────
    useEffect(() => {
        if (isPlaying) {
            tickerRef.current = setInterval(() => {
                // Read real playback position from YouTube
                if (playerRef.current?.getCurrentTime) {
                    try {
                        const t = playerRef.current.getCurrentTime();
                        if (t !== undefined && !isNaN(t)) {
                            currentTimeRef.current = t;
                            setCurrentTime(t);
                        }
                    } catch (_) {
                        currentTimeRef.current += 1;
                        setCurrentTime(currentTimeRef.current);
                    }
                } else {
                    currentTimeRef.current += 1;
                    setCurrentTime(currentTimeRef.current);
                }

                // Accumulate real wall-clock seconds the user has been watching
                activeSecondsRef.current += 1;
                setActiveSeconds(activeSecondsRef.current);

                // Heartbeat every 5 seconds
                heartbeatRef.current += 1;
                if (heartbeatRef.current >= 5) {
                    heartbeatRef.current = 0;
                    syncProgressToBackend();
                }

                // ─── KEY: If admin-set duration reached, immediately complete ──
                const requiredSec = lessonDurRef.current > 0 ? lessonDurRef.current : null;
                if (requiredSec && activeSecondsRef.current >= requiredSec) {
                    syncProgressToBackend(true);
                }
            }, 1000);
        } else {
            clearInterval(tickerRef.current);
            tickerRef.current = null;
        }

        return () => clearInterval(tickerRef.current);
    }, [isPlaying, syncProgressToBackend]); // currentTime intentionally excluded

    const formatTime = (s) => {
        if (!s || isNaN(s)) return '0:00';
        return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    };

    // Progress bar fills based on active seconds watched vs required duration
    const required = lessonDurRef.current > 0 ? lessonDurRef.current : getDisplayDuration();
    const liveProgress = Math.min(100, Math.round((activeSecondsRef.current / Math.max(required, 1)) * 100));
    const displayProgress = Math.max(watchPercentage, liveProgress);

    return (
        <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            <div id={containerIdRef.current} className="w-full h-full" />
        </div>
    );
}

