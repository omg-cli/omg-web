import { describe, expect, it } from 'vitest';
import { normalizePostgresTimestamp, translateD1SqlToPostgres } from './pg-d1';

describe('PostgreSQL account database compatibility', () => {
  it('reads Better Auth table metadata from the PostgreSQL catalog', () => {
    const query = translateD1SqlToPostgres('PRAGMA table_info("auth_session")');

    expect(query.sql).toContain('pg_catalog.pg_attribute');
    expect(query.sql).toContain('pg_catalog.to_regclass(pg_catalog.quote_ident($1))');
    expect(query.params).toEqual(['auth_session']);
  });

  it('passes metadata identifiers as bound values', () => {
    const query = translateD1SqlToPostgres(`PRAGMA table_info("account's ""records""")`);

    expect(query.sql).not.toContain("account's");
    expect(query.params).toEqual([`account's "records"`]);
  });

  it('preserves session placeholder binding', () => {
    expect(
      translateD1SqlToPostgres('SELECT token FROM auth_session WHERE user_id = ?', ['user'])
    ).toEqual({
      sql: 'SELECT token FROM auth_session WHERE user_id = $1',
      params: ['user'],
    });
  });

  it('reads legacy account timestamps as ISO dates', () => {
    const iso = '2025-07-13T14:15:16.000Z';
    const stored = String(Date.parse(iso));

    expect(normalizePostgresTimestamp(stored, 'created_at')).toBe(iso);
    expect(normalizePostgresTimestamp(stored, 'updated_at')).toBe(iso);
    expect(normalizePostgresTimestamp(stored, 'expiresAt')).toBe(iso);
  });

  it('preserves ISO dates, missing dates and unrelated values', () => {
    const iso = '2025-07-13T14:15:16.000Z';
    const stored = String(Date.parse(iso));

    expect(normalizePostgresTimestamp(iso, 'created_at')).toBe(iso);
    expect(normalizePostgresTimestamp(null, 'expires_at')).toBeNull();
    expect(normalizePostgresTimestamp(stored, 'account_id')).toBe(stored);
  });
});
