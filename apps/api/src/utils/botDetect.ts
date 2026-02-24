/**
 * Basic bot detection via User-Agent pattern matching.
 * Not bulletproof, but catches common scrapers and headless browsers.
 */
const BLOCKED_UA_PATTERNS: RegExp[] = [
    /HeadlessChrome/i,
    /PhantomJS/i,
    /Selenium/i,
    /puppeteer/i,
    /playwright/i,
    /\bbot\b/i,
    /crawler/i,
    /spider/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /node-fetch/i,
    /Go-http-client/i,
];

export function isBot(userAgent: string | null): boolean {
    if (!userAgent || userAgent.length < 10) return true;
    return BLOCKED_UA_PATTERNS.some((p) => p.test(userAgent));
}
