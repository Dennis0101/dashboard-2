function walk(obj, fn) {
    if (!obj || typeof obj !== "object")
        return;
    if (Array.isArray(obj)) {
        for (const v of obj)
            walk(v, fn);
        return;
    }
    for (const [k, v] of Object.entries(obj)) {
        fn(k, v);
        walk(v, fn);
    }
}
export function findBooleanFlags(obj, keys) {
    const trues = [];
    const falses = [];
    const keySet = new Set(keys.map((k) => k.toLowerCase()));
    walk(obj, (k, v) => {
        if (!keySet.has(k.toLowerCase()))
            return;
        if (typeof v === "boolean")
            (v ? trues : falses).push(k);
        if (typeof v === "string") {
            const s = v.toLowerCase();
            if (s === "true" || s === "yes" || s === "1")
                trues.push(k);
            if (s === "false" || s === "no" || s === "0")
                falses.push(k);
        }
        if (typeof v === "number") {
            if (v === 1)
                trues.push(k);
            if (v === 0)
                falses.push(k);
        }
    });
    return { trues, falses };
}
export function requireExplicitWithdrawalDisabled(obj) {
    // We only pass when we can *explicitly* confirm withdrawals are disabled.
    const flags = findBooleanFlags(obj, [
        "enableWithdrawals",
        "withdraw",
        "withdrawal",
        "isWithdraw",
        "canWithdraw",
        "withdrawEnabled",
        "withdrawSwitch",
        "enableWithdraw"
    ]);
    if (flags.trues.length > 0)
        return { ok: false, reason: "withdrawals_enabled", detail: `flags_true=${flags.trues.join(",")}` };
    if (flags.falses.length > 0)
        return { ok: true };
    return { ok: false, reason: "withdrawal_permission_unknown" };
}
