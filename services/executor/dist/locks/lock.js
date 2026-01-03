export class NoopLockProvider {
    async acquire(key, _ttlMs) {
        return { key };
    }
    async release(_lock) { }
}
