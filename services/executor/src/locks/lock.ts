export type Lock = { key: string };

// Placeholder lock interface (Redis recommended).
// In production, must be a distributed lock with timeout and fencing token to avoid split-brain.
export interface LockProvider {
  acquire(key: string, ttlMs: number): Promise<Lock | null>;
  release(lock: Lock): Promise<void>;
}

export class NoopLockProvider implements LockProvider {
  async acquire(key: string, _ttlMs: number): Promise<Lock | null> {
    return { key };
  }
  async release(_lock: Lock): Promise<void> {}
}

