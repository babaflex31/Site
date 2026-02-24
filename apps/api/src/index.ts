import { handleTrack } from './handlers/track';
import { handleStats } from './handlers/stats';
import { checkRateLimit } from './utils/rateLimit';
import { isBot } from './utils/botDetect';

export interface Env {
    KV: KVNamespace;
    ALLOWED_ORIGIN: string;
}

function corsHeaders(origin: string, allowed: string): HeadersInit {
    if (origin !== allowed) return {};
    return {
        'Access-Control-Allow-Origin': allowed,
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

function withCors(response: Response, origin: string, allowed: string): Response {
    const headers = new Headers(response.headers);
    const cors = corsHeaders(origin, allowed);
    for (const [k, v] of Object.entries(cors)) {
        headers.set(k, v);
    }
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const origin = request.headers.get('Origin') ?? '';
        const ip = request.headers.get('CF-Connecting-IP') ?? '0.0.0.0';

        // ── CORS preflight ──────────────────────────────────────
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(origin, env.ALLOWED_ORIGIN),
            });
        }

        // ── Bot check ───────────────────────────────────────────
        if (isBot(request.headers.get('User-Agent'))) {
            return new Response('Forbidden', { status: 403 });
        }

        // ── Routing ─────────────────────────────────────────────
        // POST /api/track — analytics beacon endpoint
        if (url.pathname === '/api/track' && request.method === 'POST') {
            // Content-Type guard (CSRF mitigation)
            if (request.headers.get('Content-Type') !== 'application/json') {
                return new Response('Bad Content-Type', { status: 400 });
            }

            // Rate limit
            const allowed = await checkRateLimit(ip, env.KV);
            if (!allowed) {
                return withCors(
                    new Response('Too Many Requests', { status: 429 }),
                    origin,
                    env.ALLOWED_ORIGIN
                );
            }

            const response = await handleTrack(request, env.KV, ip);
            return withCors(response, origin, env.ALLOWED_ORIGIN);
        }

        // GET /api/stats — admin stats endpoint (protect with CF Access in prod)
        if (url.pathname === '/api/stats' && request.method === 'GET') {
            const response = await handleStats(env.KV);
            return withCors(response, origin, env.ALLOWED_ORIGIN);
        }

        // ── 404 ─────────────────────────────────────────────────
        return new Response('Not Found', { status: 404 });
    },
};
