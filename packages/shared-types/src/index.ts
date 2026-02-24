// ─── Analytics Payload ───────────────────────────────────────
export interface TrackPayload {
    /** Event type */
    type: 'pageview' | 'click';
    /** Click target identifier (e.g. 'github', 'twitter', 'discord') */
    target?: string;
    /** document.referrer — truncated to 200 chars client-side */
    ref?: string;
    /** Client timestamp — Date.now() */
    ts: number;
    /** IANA timezone string */
    tz?: string;
}

// ─── Stats Response ──────────────────────────────────────────
export interface DailyStats {
    date: string;
    pageviews: number;
    uniqueVisitors: number;
    clicks: Record<string, number>;
}

export interface StatsResponse {
    days: DailyStats[];
    totalPageviews: number;
    totalUniques: number;
    totalClicks: Record<string, number>;
}

// ─── Social Link Config ──────────────────────────────────────
export interface SocialLink {
    id: string;
    label: string;
    url: string;
    icon: string; // SVG path or icon identifier
}

// ─── Site Config ─────────────────────────────────────────────
export interface SiteConfig {
    name: string;
    tagline: string;
    avatarUrl: string;
    socials: SocialLink[];
    analyticsEndpoint: string;
}
