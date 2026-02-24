/**
 * IP hashing with daily rotating salt for privacy-first unique visitor tracking.
 * Cross-day tracking is impossible by design (GDPR compliant).
 */
export async function hashIP(ip: string, kv: KVNamespace): Promise<string> {
    const today = new Date().toISOString().slice(0, 10);
    const saltKey = `salt:${today}`;

    let salt = await kv.get(saltKey);
    if (!salt) {
        salt = crypto.randomUUID();
        await kv.put(saltKey, salt, { expirationTtl: 86400 });
    }

    const data = new TextEncoder().encode(`${salt}:${ip}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
