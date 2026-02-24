import type { TrackPayload } from 'shared-types';
import { hashIP } from '../utils/hash';

/** Max allowed age of a beacon timestamp (±30 seconds) */
const MAX_AGE_MS = 30_000;

/** Valid click targets */
const VALID_TARGETS = new Set([
    'github',
    'twitter',
    'discord',
    'youtube',
    'twitch',
    'instagram',
    'tiktok',
    'linkedin',
    'spotify',
    'steam',
    'kick',
]);

function isValidTimestamp(ts: number): boolean {
    return Math.abs(Date.now() - ts) < MAX_AGE_MS;
}

function validatePayload(body: unknown): body is TrackPayload {
    if (!body || typeof body !== 'object') return false;
    const b = body as Record<string, unknown>;

    if (!['pageview', 'click'].includes(b.type as string)) return false;
    if (typeof b.ts !== 'number') return false;
    if (b.target !== undefined && typeof b.target !== 'string') return false;
    if (b.ref !== undefined && typeof b.ref !== 'string') return false;
    if (b.tz !== undefined && typeof b.tz !== 'string') return false;

    return true;
}

export async function handleTrack(
    request: Request,
    kv: KVNamespace,
    ip: string
): Promise<Response> {
    // ── Parse & validate ──────────────────────────────────────
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return new Response('Invalid JSON', { status: 400 });
    }

    if (!validatePayload(body)) {
        return new Response('Invalid payload', { status: 400 });
    }

    // Payload size guard
    if (JSON.stringify(body).length > 512) {
        return new Response('Payload too large', { status: 413 });
    }

    // Replay protection
    if (!isValidTimestamp(body.ts)) {
        return new Response('Timestamp expired', { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);

    // ── Track page view ───────────────────────────────────────
    if (body.type === 'pageview') {
        // Increment pageview counter
        const pvKey = `analytics:pageviews:${today}`;
        const currentPv = parseInt((await kv.get(pvKey)) ?? '0', 10);
        await kv.put(pvKey, String(currentPv + 1), {
            expirationTtl: 86400 * 90, // keep 90 days
        });

        // Track unique visitor (IP hash with daily-rotating salt)
        const ipHash = await hashIP(ip, kv);
        const uniqueKey = `analytics:unique:${today}`;
        const existingRaw = await kv.get(uniqueKey);
        const existing: string[] = existingRaw ? JSON.parse(existingRaw) : [];

        if (!existing.includes(ipHash)) {
            existing.push(ipHash);
            await kv.put(uniqueKey, JSON.stringify(existing), {
                expirationTtl: 86400 * 90,
            });
        }
    }

    // ── Track click ───────────────────────────────────────────
    if (body.type === 'click' && body.target) {
        // Sanitize target — only allow known social IDs
        const target = body.target.toLowerCase().slice(0, 30);
        if (!VALID_TARGETS.has(target)) {
            return new Response('Invalid target', { status: 400 });
        }

        const clickKey = `analytics:clicks:${target}:${today}`;
        const currentClicks = parseInt((await kv.get(clickKey)) ?? '0', 10);
        await kv.put(clickKey, String(currentClicks + 1), {
            expirationTtl: 86400 * 90,
        });
    }

    // Beacon API expects 204 No Content
    return new Response(null, { status: 204 });
}
