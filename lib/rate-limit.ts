/**
 * Rate Limiter in-memory para Next.js Middleware.
 *
 * Usa sliding window com Map. Limpa entries expirados automaticamente.
 * Reseta em redeploy (aceitável para proteção contra abuso).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Limpeza automática a cada 60s para evitar memory leak
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60_000;

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // ms until oldest entry expires
}

/**
 * Verifica se o request deve ser permitido.
 *
 * @param key - Identificador único (ex: IP + rota)
 * @param maxRequests - Máximo de requests na janela
 * @param windowMs - Tamanho da janela em ms
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  cleanup(windowMs);

  const now = Date.now();
  const cutoff = now - windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps fora da janela
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetIn: oldest + windowMs - now,
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetIn: windowMs,
  };
}
