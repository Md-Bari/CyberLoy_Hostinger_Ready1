import React, { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    LiveKitRoom,
    PreJoin,
    VideoConference,
    useParticipants,
    useRoomInfo,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { MediaDeviceFailure } from 'livekit-client';
import { ArrowLeft, Check, Link2, Loader2, RotateCcw, ShieldCheck, Users, VideoOff } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import './LiveClassPage.css';

const roomOptions = {
    adaptiveStream: true,
    dynacast: true,
    videoCaptureDefaults: { resolution: { width: 1280, height: 720 } },
    audioCaptureDefaults: { echoCancellation: true, autoGainControl: true, noiseSuppression: true },
};

function describeDeviceFailure(failure, kind) {
    const device = kind === 'audioinput' ? 'microphone' : kind === 'videoinput' ? 'camera' : 'camera or microphone';
    switch (failure) {
        case MediaDeviceFailure.NotFound:
            return `No ${device} found on this device. You can still watch, listen and chat.`;
        case MediaDeviceFailure.PermissionDenied:
            return `Access to your ${device} was blocked. Allow it from the address bar and turn it on again.`;
        case MediaDeviceFailure.DeviceInUse:
            return `Your ${device} is being used by another app. Close it and try again.`;
        default:
            return `Could not start your ${device}.`;
    }
}

function useClock() {
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(timer);
    }, []);
    return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function CopyLinkButton({ className = '' }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        const url = new URL(window.location.href);
        // Never share credentials: the link only identifies the session.
        url.searchParams.delete('token');
        url.searchParams.delete('ws_url');
        try {
            await navigator.clipboard.writeText(url.toString());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Copy this meeting link', url.toString());
        }
    };
    return (
        <button type="button" onClick={copy} className={`lc-chip ${className}`}>
            {copied ? <Check size={16} /> : <Link2 size={16} />}
            <span>{copied ? 'Link copied' : 'Copy joining info'}</span>
        </button>
    );
}

function MeetingTopBar({ meeting }) {
    const clock = useClock();
    const participants = useParticipants();
    const { name } = useRoomInfo();

    return (
        <div className="lc-topbar">
            <div className="lc-topbar-left">
                <span className="lc-clock">{clock}</span>
                <span className="lc-divider">|</span>
                <span className="lc-title" title={name}>{meeting.title || name}</span>
                {meeting.is_host && (
                    <span className="lc-host-badge"><ShieldCheck size={14} /> Host</span>
                )}
            </div>
            <div className="lc-topbar-right">
                <CopyLinkButton className="lc-hide-sm" />
                <span className="lc-chip" title="People in this call">
                    <Users size={16} />
                    <span>{participants.length}</span>
                </span>
            </div>
        </div>
    );
}

function CenteredCard({ children }) {
    return (
        <div className="lc-screen lc-centered" data-lk-theme="default">
            <div className="lc-card">{children}</div>
        </div>
    );
}

export default function LiveClassPage() {
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const sessionId = searchParams.get('session');
    // Legacy links embedded a shared token directly in the URL.
    const legacyToken = searchParams.get('token');
    const legacyWsUrl = searchParams.get('ws_url');
    const legacyRoom = searchParams.get('room');

    const [meeting, setMeeting] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [stage, setStage] = useState('loading'); // loading | lobby | call | left | error
    const [choices, setChoices] = useState(null);
    const [notice, setNotice] = useState('');

    const loadMeeting = useCallback(async () => {
        setStage('loading');
        setLoadError('');
        try {
            if (sessionId) {
                setMeeting(await api.joinCourseLiveSession(sessionId));
            } else if (legacyToken && legacyWsUrl) {
                setMeeting({ token: legacyToken, ws_url: legacyWsUrl, room_name: legacyRoom, title: legacyRoom });
            } else {
                throw new Error('This classroom link is incomplete. Open the live class from its course page.');
            }
            setStage('lobby');
        } catch (error) {
            setLoadError(error?.message || 'Unable to load this live class.');
            setStage('error');
        }
    }, [sessionId, legacyToken, legacyWsUrl, legacyRoom]);

    useEffect(() => {
        loadMeeting();
    }, [loadMeeting]);

    useEffect(() => {
        if (!notice) return undefined;
        const timer = setTimeout(() => setNotice(''), 7000);
        return () => clearTimeout(timer);
    }, [notice]);

    const backHref = meeting?.course_id ? `/courses/${meeting.course_id}` : '/courses';
    const secure = typeof window === 'undefined' || window.isSecureContext;

    if (stage === 'loading') {
        return (
            <CenteredCard>
                <Loader2 className="lc-spin" size={32} />
                <p className="lc-muted">Getting your classroom ready…</p>
            </CenteredCard>
        );
    }

    if (stage === 'error') {
        return (
            <CenteredCard>
                <VideoOff size={36} className="lc-danger" />
                <h1>Can&apos;t join this live class</h1>
                <p className="lc-muted">{loadError}</p>
                <div className="lc-actions">
                    <button type="button" className="lc-btn lc-btn-primary" onClick={loadMeeting}>Try again</button>
                    <Link className="lc-btn" to="/courses">Back to courses</Link>
                </div>
            </CenteredCard>
        );
    }

    if (stage === 'left') {
        return (
            <CenteredCard>
                <h1>You left the meeting</h1>
                <p className="lc-muted">{meeting?.title}</p>
                <div className="lc-actions">
                    <button type="button" className="lc-btn" onClick={() => setStage('lobby')}>
                        <RotateCcw size={16} /> Rejoin
                    </button>
                    <Link className="lc-btn lc-btn-primary" to={backHref}>Return to course</Link>
                </div>
            </CenteredCard>
        );
    }

    if (stage === 'lobby') {
        return (
            <div className="lc-screen lc-lobby" data-lk-theme="default">
                <div className="lc-lobby-header">
                    <Link to={backHref} className="lc-chip"><ArrowLeft size={16} /> Back</Link>
                </div>
                <div className="lc-lobby-body">
                    <div className="lc-lobby-preview">
                        {secure ? (
                            <PreJoin
                                defaults={{ username: meeting?.name || user?.name || 'Guest', videoEnabled: true, audioEnabled: true }}
                                persistUserChoices={false}
                                joinLabel="Join now"
                                micLabel="Microphone"
                                camLabel="Camera"
                                onError={(error) => console.warn('Lobby device preview failed:', error)}
                                onSubmit={(values) => {
                                    setChoices(values);
                                    setStage('call');
                                }}
                            />
                        ) : (
                            <div className="lc-insecure">
                                <VideoOff size={32} />
                                <p>Camera and microphone need a secure (HTTPS) connection. You can still join to watch and chat.</p>
                                <button
                                    type="button"
                                    className="lc-btn lc-btn-primary"
                                    onClick={() => {
                                        setChoices({ videoEnabled: false, audioEnabled: false });
                                        setStage('call');
                                    }}
                                >
                                    Join without camera
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="lc-lobby-info">
                        <h1>Ready to join?</h1>
                        <p className="lc-lobby-title">{meeting?.title}</p>
                        {meeting?.course_title && <p className="lc-muted">{meeting.course_title}</p>}
                        {meeting?.host_name && <p className="lc-muted">Hosted by {meeting.host_name}</p>}
                        <p className="lc-muted lc-small">
                            Joining as <strong>{meeting?.name || user?.name}</strong>
                            {meeting?.is_host ? ' · You are the host' : ''}
                        </p>
                        <CopyLinkButton />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="lc-screen lc-call" data-lk-theme="default">
            <LiveKitRoom
                serverUrl={meeting.ws_url}
                token={meeting.token}
                connect
                options={{
                    ...roomOptions,
                    videoCaptureDefaults: { ...roomOptions.videoCaptureDefaults, deviceId: choices?.videoDeviceId || undefined },
                    audioCaptureDefaults: { ...roomOptions.audioCaptureDefaults, deviceId: choices?.audioDeviceId || undefined },
                }}
                video={secure && !!choices?.videoEnabled}
                audio={secure && !!choices?.audioEnabled}
                onDisconnected={() => setStage('left')}
                onError={(error) => setNotice(error?.message || 'Connection problem.')}
                onMediaDeviceFailure={(failure, kind) => setNotice(describeDeviceFailure(failure, kind))}
                className="lc-room"
            >
                <MeetingTopBar meeting={meeting} />
                <div className="lc-stage">
                    <VideoConference />
                </div>
            </LiveKitRoom>
            {notice && (
                <div className="lc-toast" role="status">
                    <span>{notice}</span>
                    <button type="button" onClick={() => setNotice('')} aria-label="Dismiss">×</button>
                </div>
            )}
        </div>
    );
}
