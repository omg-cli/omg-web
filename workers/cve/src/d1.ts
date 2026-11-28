export type SqlValue = string | number | null;

export interface D1Prepared {
  bind(...values: SqlValue[]): D1Bound;
}

export interface D1Bound {
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ success?: boolean; meta?: { changes?: number } }>;
}

export interface D1Executor {
  prepare(sql: string): D1Prepared;
  batch<T = unknown>(statements: readonly D1Bound[]): Promise<{ results?: T[] }[]>;
}

export interface D1Client extends D1Executor {
  withSession?: (constraintOrBookmark?: string) => D1Executor;
}

export function readDb(db: D1Client): D1Executor {
  return db.withSession ? db.withSession('first-unconstrained') : db;
}

export function writeDb(db: D1Client): D1Executor {
  return db.withSession ? db.withSession('first-primary') : db;
}

export function chunkArray<T>(items: readonly T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function batchInChunks(
  db: D1Executor,
  statements: readonly D1Bound[],
  chunkSize = 50
): Promise<void> {
  for (const chunk of chunkArray(statements, chunkSize)) {
    if (chunk.length > 0) await db.batch(chunk);
  }
}
