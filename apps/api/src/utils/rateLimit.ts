/**
 * Fixed-window rate limiter backed by Cloudflare KV.
 * Window: 1 minute. Max: 10 requests per IP per window.
 * KV entries auto-expire after 2 minutes (TTL 120s).
 */
export async function checkRateLimit(
    ip: string,
    kv: KVNamespace
): Promise<boolean> {
    const window = Math.floor(Date.now() / 60_000); // 1-min window
    const key = `rl:${ip}:${window}`;

    const count = parseInt((await kv.get(key)) ?? '0', 10);
    if (count >= 10) return false;

    await kv.put(key, String(count + 1), { expirationTtl: 120 });
    return true;
}
