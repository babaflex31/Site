import type { DailyStats, StatsResponse } from 'shared-types';

const TARGETS = [
    'github', 'twitter', 'discord', 'youtube', 'twitch',
    'instagram', 'tiktok', 'linkedin', 'spotify', 'steam', 'kick',
];

export async function handleStats(kv: KVNamespace): Promise<Response> {
    const days: DailyStats[] = [];
    let totalPageviews = 0;
    let totalUniques = 0;
    const totalClicks: Record<string, number> = {};

    // Last 30 days
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const date = d.toISOString().slice(0, 10);

        const pv = parseInt((await kv.get(`analytics:pageviews:${date}`)) ?? '0', 10);
        const uniqueRaw = await kv.get(`analytics:unique:${date}`);
        const uniques = uniqueRaw ? (JSON.parse(uniqueRaw) as string[]).length : 0;

        const clicks: Record<string, number> = {};
        for (const target of TARGETS) {
            const c = parseInt(
                (await kv.get(`analytics:clicks:${target}:${date}`)) ?? '0',
                10
            );
            if (c > 0) {
                clicks[target] = c;
                totalClicks[target] = (totalClicks[target] ?? 0) + c;
            }
        }

        totalPageviews += pv;
        totalUniques += uniques;

        days.push({ date, pageviews: pv, uniqueVisitors: uniques, clicks });
    }

    const response: StatsResponse = {
        days,
        totalPageviews,
        totalUniques,
        totalClicks,
    };

    return new Response(JSON.stringify(response), {
        headers: { 'Content-Type': 'application/json' },
    });
}
