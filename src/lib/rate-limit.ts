const buckets = new Map<string, number[]>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): { success: boolean; remaining: number; retryAfterMs: number } {
  const { limit, windowMs } = options;
  const now = Date.now();
  const cutoff = now - windowMs;

  const timestamps = (buckets.get(key) ?? []).filter((t) => t > cutoff);
  timestamps.push(now);
  buckets.set(key, timestamps);

  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) {
      if (v.length === 0 || v[v.length - 1] < cutoff) buckets.delete(k);
    }
  }

  const count = timestamps.length;
  if (count > limit) {
    return { success: false, remaining: 0, retryAfterMs: timestamps[0] + windowMs - now };
  }
  return { success: true, remaining: limit - count, retryAfterMs: 0 };
}
