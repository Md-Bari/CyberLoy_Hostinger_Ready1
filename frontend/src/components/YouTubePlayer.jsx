import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw, Lock, Sparkles, Clock, Check } from 'lucide-react';
import { api } from '../lib/api';

export default function YouTubePlayer({
    videoId,
    lessonId,
    initialProgress = 0,
    isCompleted = false,
    requiredPercentage = 100,
    onProgressUpdate,
    onCompleted,
}) {
    const [watchPercentage, setWatchPercentage] = useState(initialProgress);
    const [completed, setCompleted] = useState(isCompleted);
    const [duration, setDuration] = useState(600);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncSuccess, setSyncSuccess] = useState(false);

    const playerRef = useRef(null);
    const containerIdRef = useRef(`yt-container-${lessonId}-${Math.random().toString(36).substr(2, 7)}`);
    const tickerRef = useRef(null);
    const lastPosRef = useRef(0);
    const heartbeatCounterRef = useRef(0);

    useEffect(() => {
        setWatchPercentage(initialProgress);
        setCompleted(isCompleted);
    }, [initialProgress, isCompleted, lessonId]);

    // Clean 11-char YouTube ID
    const cleanVideoId = (() => {
        if (!videoId) return '3Kq1MIfTWCE';
        if (videoId.length === 11) return videoId;
        const match = String(videoId).match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
        return match ? match[1] : videoId;
    })();

    // 1. Initialize YouTube IFrame Player API
    useEffect(() => {
        if (!cleanVideoId) return;

        let isMounted = true;

        const initPlayer = () => {
            const el = document.getElementById(containerIdRef.current);
            if (!window.YT || !window.YT.Player || !el) return;

            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    // silent
                }
            }

            try {
                playerRef.current = new window.YT.Player(containerIdRef.current, {
                    host: 'https://www.youtube-nocookie.com',
                    videoId: cleanVideoId,
                    playerVars: {
                        autoplay: 0,
                        controls: 1,
                        rel: 0,
                        modestbranding: 1,
                        iv_load_policy: 3,
                        enablejsapi: 1,
                        playsinline: 1,
                    },
                    events: {
                        onReady: (event) => {
                            if (!isMounted) return;
                            try {
                                const dur = event.target.getDuration();
                                if (dur && dur > 0) {
                                    setDuration(Math.round(dur));
                                }
                            } catch (err) {}
                        },
                        onStateChange: (event) => {
                            if (!isMounted) return;
                            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                setIsPlaying(true);
                            } else if (event.data === window.YT.PlayerState.PAUSED) {
                                setIsPlaying(false);
                                syncProgressToBackend();
                            } else if (event.data === window.YT.PlayerState.ENDED) {
                                setIsPlaying(false);
                                syncProgressToBackend(true);
                            }
                        },
                    },
                });
            } catch (err) {
                console.warn('YT Player init error:', err);
            }
        };

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            if (firstScriptTag && firstScriptTag.parentNode) {
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else {
                document.head.appendChild(tag);
            }
            window.onYouTubeIframeAPIReady = initPlayer;
        } else {
            setTimeout(initPlayer, 100);
        }

        return () => {
            isMounted = false;
            if (tickerRef.current) clearInterval(tickerRef.current);
            if (playerRef.current && typeof playerRef.current.destroy === 'function') {
                try {
                    playerRef.current.destroy();
                } catch (e) {}
            }
        };
    }, [cleanVideoId, lessonId]);

    // 2. Active 1-Second Playback Ticker
    useEffect(() => {
        if (isPlaying) {
            tickerRef.current = setInterval(() => {
                let currentPos = currentTime + 1;

                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                    try {
                        const ytTime = playerRef.current.getCurrentTime();
                        if (ytTime !== undefined && !isNaN(ytTime)) {
                            currentPos = ytTime;
                        }
                        const ytDur = playerRef.current.getDuration();
                        if (ytDur && ytDur > 0) {
                            setDuration(Math.round(ytDur));
                        }
                    } catch (e) {}
                }

                setCurrentTime(currentPos);

                // Auto-sync heartbeat every 5 seconds while playing
                heartbeatCounterRef.current += 1;
                if (heartbeatCounterRef.current >= 5) {
                    heartbeatCounterRef.current = 0;
                    syncProgressToBackend();
                }
            }, 1000);
        } else {
            if (tickerRef.current) {
                clearInterval(tickerRef.current);
                tickerRef.current = null;
            }
        }

        return () => {
            if (tickerRef.current) clearInterval(tickerRef.current);
        };
    }, [isPlaying, currentTime, duration, lessonId]);

    // 3. Sync Progress and Record in Database
    const syncProgressToBackend = async (isEnd = false) => {
        let pos = currentTime;
        let dur = duration || 600;

        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
            try {
                const pTime = playerRef.current.getCurrentTime();
                const pDur = playerRef.current.getDuration();
                if (pTime !== undefined && !isNaN(pTime)) pos = pTime;
                if (pDur && pDur > 0) dur = Math.round(pDur);
            } catch (e) {}
        }

        if (isEnd) pos = dur;

        const prevPos = lastPosRef.current;
        lastPosRef.current = pos;

        const start = Math.max(0, Math.floor(prevPos));
        const end = Math.ceil(pos);

        setSyncing(true);
        try {
            const res = await api.recordVideoProgress({
                lesson_id: lessonId,
                current_position: pos,
                duration: dur,
                interval_start: start,
                interval_end: end,
                video_id: cleanVideoId,
            });

            if (res.watch_percentage !== undefined) {
                setWatchPercentage(res.watch_percentage);
                onProgressUpdate && onProgressUpdate(res);
            }

            if (res.lesson_completed) {
                setCompleted(true);
                onCompleted && onCompleted(res);
            }

            setSyncSuccess(true);
            setTimeout(() => setSyncSuccess(false), 2000);
        } catch (e) {
            console.error('Video heartbeat error:', e);
        } finally {
            setSyncing(false);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="space-y-4">
            {/* Video Theatre Frame */}
            <div className="relative w-full aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                <div id={containerIdRef.current} className="w-full h-full" />
            </div>

            {/* Video Playback & Timer Progress Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full">
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                        <span className="text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            <span>Watching: <strong className="text-white">{formatTime(currentTime)} / {formatTime(duration)}</strong></span>
                            {syncing && (
                                <span className="flex items-center gap-1 text-[10px] text-cyan-400 animate-pulse">
                                    <RefreshCw className="w-3 h-3 animate-spin" /> saving to DB...
                                </span>
                            )}
                            {syncSuccess && (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                                    <Check className="w-3 h-3" /> saved!
                                </span>
                            )}
                        </span>
                        <span className="font-bold text-white">
                            {watchPercentage}% Watched
                        </span>
                    </div>

                    {/* Live Progress Bar */}
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 relative">
                        <div
                            className={`h-full transition-all duration-500 rounded-full ${
                                completed
                                    ? 'bg-emerald-400'
                                    : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(watchPercentage, Math.round((currentTime / Math.max(duration, 1)) * 100)))}%` }}
                        />
                    </div>
                </div>

                {/* Status & Manual Sync Button */}
                <div className="shrink-0 flex items-center gap-2">
                    {completed ? (
                        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold font-mono">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Lesson Completed (100%)</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-mono">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                                <span>{requiredPercentage}% Required to Unlock Next</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => syncProgressToBackend()}
                                disabled={syncing}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono font-semibold border border-slate-700 transition flex items-center gap-1"
                                title="Sync current watch position with server"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                                <span>Sync DB</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
