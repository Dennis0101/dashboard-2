export function allowedTimeframesForTier(tier) {
    // Server-enforced. Mobile may show the full list, but API rejects disallowed use.
    if (tier === "basic")
        return ["1m", "5m", "1h", "1d", "1w"];
    if (tier === "pro")
        return ["15s", "1m", "5m", "1h", "1d", "1w"];
    return ["5s", "15s", "1m", "5m", "1h", "1d", "1w", "1y"];
}
export function assertTimeframeAllowed(tier, timeframe) {
    const allowed = new Set(allowedTimeframesForTier(tier));
    if (!allowed.has(timeframe)) {
        throw new Error("timeframe_not_allowed_for_tier");
    }
}
export function aiStrengthForTier(tier) {
    // Higher tiers may allow lower confidence thresholds (still bounded by risk/fail-safe rules).
    if (tier === "basic")
        return { mode: "conservative", minConfidence: 0.8 };
    if (tier === "pro")
        return { mode: "balanced", minConfidence: 0.7 };
    return { mode: "aggressive", minConfidence: 0.6 };
}
