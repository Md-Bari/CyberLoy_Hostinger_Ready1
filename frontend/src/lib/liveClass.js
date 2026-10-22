export function buildLiveClassLink(liveUrl) {
    if (!liveUrl) return '';

    try {
        if (/^wss?:\/\//i.test(liveUrl)) {
            const parsed = new URL(liveUrl);
            const room = parsed.searchParams.get('room');
            const token = parsed.searchParams.get('token');
            const wsUrl = `${parsed.protocol}//${parsed.host}`;

            if (!room && !token) {
                return liveUrl;
            }

            const target = new URL(`${window.location.origin}/live-class`);
            if (room) target.searchParams.set('room', room);
            if (token) target.searchParams.set('token', token);
            if (wsUrl) target.searchParams.set('ws_url', wsUrl);

            return target.toString();
        }

        if (/^https?:\/\//i.test(liveUrl)) {
            // Our own classroom links: keep the session query but use the origin
            // the user is browsing from, so links work on localhost, LAN or prod.
            const parsed = new URL(liveUrl);
            if (parsed.pathname.replace(/\/+$/, '').endsWith('/live-class')) {
                return `${window.location.origin}/live-class${parsed.search}`;
            }
            return liveUrl;
        }
    } catch (error) {
        console.warn('Unable to normalize LiveKit join URL:', error);
    }

    return liveUrl;
}
