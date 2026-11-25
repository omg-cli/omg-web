import type {
  D1Database,
  D1DatabaseSession,
  D1ExecResult,
  D1Meta,
  D1PreparedStatement,
  D1Result,
  D1SessionBookmark,
} from '@cloudflare/workers-types';
import postgres, { type Sql as PgClient } from 'postgres';
import * as Schema from 'effect/Schema';

type SqlParam = string | number | null | Uint8Array;
type UnsafeRunner = Pick<PgClient, 'unsafe'>;
type PgScalar = string | number | boolean | null | Uint8Array;
interface UnsafeRow {
  readonly [column: string]: PgScalar | undefined;
}

const isString = Schema.is(Schema.String);
const isNumber = Schema.is(Schema.Number);
const isBoolean = Schema.is(Schema.Boolean);

interface PreparedQuery {
  readonly sql: string;
  readonly params: SqlParam[];
}

const tableInfo = /^\s*PRAGMA\s+table_info\s*\(\s*"((?:[^"]|"")*)"\s*\)\s*;?\s*$/i;
const postgresTableInfo = `
  SELECT a.attnum - 1 AS cid,
         a.attname AS name,
         pg_catalog.format_type(a.atttypid, a.atttypmod) AS type,
         a.attnotnull::int AS "notnull",
         pg_catalog.pg_get_expr(d.adbin, d.adrelid) AS dflt_value,
         coalesce(pg_catalog.array_position(i.indkey::smallint[], a.attnum), 0) AS pk
  FROM pg_catalog.pg_attribute AS a
  LEFT JOIN pg_catalog.pg_attrdef AS d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  LEFT JOIN pg_catalog.pg_index AS i ON i.indrelid = a.attrelid AND i.indisprimary
  WHERE a.attrelid = pg_catalog.to_regclass(pg_catalog.quote_ident($1))
    AND a.attnum > 0 AND NOT a.attisdropped
  ORDER BY a.attnum
`;

/**
 * Translates the SQLite/D1 SQL syntax used by omg-web into PostgreSQL SQL
 * compatible with the sqlite_date/datetime/julianday/json_extract/strftime
 * helper functions installed in omg_platform.
 */
export function translateD1SqlToPostgres(input: string, params: SqlParam[] = []): PreparedQuery {
  // Better Auth falls back to this D1 query to validate the real auth tables.
  const table = tableInfo.exec(input)?.[1];
  if (table !== undefined) {
    return { sql: postgresTableInfo, params: [table.replaceAll('""', '"')] };
  }

  let idx = 0;
  let out = '';
  let inSingle = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i] ?? '';
    if (ch === "'") {
      out += ch;
      if (inSingle && input[i + 1] === "'") {
        out += "'";
        i++;
      } else {
        inSingle = !inSingle;
      }
      continue;
    }
    if (!inSingle && ch === '?') {
      out += `$${++idx}`;
      continue;
    }
    out += ch;
  }

  out = out.replace(/\bdate\s*\(/gi, 'sqlite_date(');
  out = out.replace(/\bAS\s+REAL\b/gi, 'AS DOUBLE PRECISION');
  out = out.replace(/\bunixepoch\('subsec'\)/gi, 'EXTRACT(EPOCH FROM statement_timestamp())');
  out = out.replace(/\bunixepoch\(\)/gi, 'FLOOR(EXTRACT(EPOCH FROM statement_timestamp()))');

  if (/^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i.test(out)) {
    out = out.replace(/^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i, 'INSERT INTO');
    if (!/\bON\s+CONFLICT\b/i.test(out)) {
      out = out.replace(/;?\s*$/, ' ON CONFLICT DO NOTHING');
    }
  }

  return { sql: out, params };
}

function buildD1Meta(changes: number, rowsRead: number): D1Meta & Record<string, number | boolean> {
  return {
    duration: 0,
    size_after: 0,
    rows_read: rowsRead,
    rows_written: changes,
    last_row_id: 0,
    changed_db: changes > 0,
    changes,
  };
}

function normalizeParams(values: readonly unknown[]): SqlParam[] {
  return values.map(v => {
    if (v === undefined || v === null) return null;
    if (isBoolean(v)) return v ? 1 : 0;
    if (v instanceof ArrayBuffer) return new Uint8Array(v);
    if (isString(v) || isNumber(v) || v instanceof Uint8Array) return v;
    return String(v);
  });
}

interface PgQueryTags {
  readonly application: string;
  readonly route: string;
}

function encodeTagValue(v: string): string {
  return encodeURIComponent(v).replaceAll("'", '%27');
}

function formatCommenterSuffix(tags?: PgQueryTags): string {
  if (!tags) return '';
  return ` /*application='${encodeTagValue(tags.application)}',route='${encodeTagValue(tags.route)}'*/`;
}

async function execQuery<T>(
  runner: UnsafeRunner,
  sql: string,
  params: SqlParam[],
  commentSuffix: string
): Promise<{ rows: T[]; changes: number }> {
  const translated = translateD1SqlToPostgres(sql, params);
  const result = await runner.unsafe(translated.sql + commentSuffix, translated.params);
  // SAFETY: Callers supply the expected D1 row projection type T (matching D1Database.all/first contract).
  const rows = Array.from(result) as T[];
  const changes = isNumber(result.count) ? result.count : 0;
  return { rows, changes };
}

interface PgD1Handle {
  readonly db: D1Database;
  close(): Promise<void>;
}

/**
 * Creates a D1Database-compatible adapter backed by PlanetScale PostgreSQL
 * through Cloudflare Hyperdrive (PgBouncer transaction pooling on port 6432).
 */
export function createPgD1(connectionString: string, tags?: PgQueryTags): PgD1Handle {
  const commentSuffix = formatCommenterSuffix(tags);
  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
    fetch_types: false,
    types: {
      bigint: {
        to: 20,
        from: [20],
        serialize: (x: number | string) => String(x),
        parse: (x: string) => Number(x),
      },
      numeric: {
        to: 1700,
        from: [1700],
        serialize: (x: number | string) => String(x),
        parse: (x: string) => Number(x),
      },
    },
  });

  const internals = new WeakMap<D1PreparedStatement, PreparedQuery>();

  const makeStatement = (sql: string, params: SqlParam[]): D1PreparedStatement => {
    function raw<T = unknown[]>(options: { columnNames: true }): Promise<[string[], ...T[]]>;
    function raw<T = unknown[]>(options?: { columnNames?: false }): Promise<T[]>;
    async function raw<T = unknown[]>(options?: {
      columnNames?: boolean;
    }): Promise<T[] | [string[], ...T[]]> {
      const translated = translateD1SqlToPostgres(sql, params);
      const result = await client
        .unsafe(translated.sql + commentSuffix, translated.params)
        .values();
      // SAFETY: The caller supplies T for the selected column values.
      const rows = Array.from(result) as T[];
      return options?.columnNames ? [result.columns.map(column => column.name), ...rows] : rows;
    }

    const stmt: D1PreparedStatement = {
      bind(...values: unknown[]): D1PreparedStatement {
        return makeStatement(sql, normalizeParams(values));
      },
      async first<T = UnsafeRow>(colName?: string): Promise<T | null> {
        const { rows } = await execQuery<UnsafeRow>(client, sql, params, commentSuffix);
        const row = rows[0];
        if (!row) return null;
        if (colName !== undefined) {
          // SAFETY: Matches D1PreparedStatement.first(colName) contract returning the requested column or null.
          return (row[colName] ?? null) as T | null;
        }
        // SAFETY: Matches D1PreparedStatement.first<T>() contract returning the first row object.
        return row as T;
      },
      async run<T = UnsafeRow>(): Promise<D1Result<T>> {
        const { rows, changes } = await execQuery<T>(client, sql, params, commentSuffix);
        return {
          results: rows,
          success: true,
          meta: buildD1Meta(changes, rows.length),
        };
      },
      async all<T = UnsafeRow>(): Promise<D1Result<T>> {
        const { rows, changes } = await execQuery<T>(client, sql, params, commentSuffix);
        return {
          results: rows,
          success: true,
          meta: buildD1Meta(changes, rows.length),
        };
      },
      raw,
    };
    internals.set(stmt, { sql, params });
    return stmt;
  };

  const session: D1DatabaseSession = {
    prepare(query: string): D1PreparedStatement {
      return makeStatement(query, []);
    },
    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      if (statements.length === 0) return [];
      const results: D1Result<T>[] = [];
      await client.begin(async tx => {
        for (const s of statements) {
          const internal = internals.get(s);
          if (!internal) {
            throw new Error('Invalid prepared statement passed to pg-d1 batch');
          }
          const { rows, changes } = await execQuery<T>(
            tx,
            internal.sql,
            internal.params,
            commentSuffix
          );
          results.push({
            results: rows,
            success: true,
            meta: buildD1Meta(changes, rows.length),
          });
        }
      });
      return results;
    },
    getBookmark(): D1SessionBookmark | null {
      return null;
    },
  };

  const db: D1Database = {
    prepare: session.prepare,
    batch: session.batch,
    async exec(query: string): Promise<D1ExecResult> {
      const translated = translateD1SqlToPostgres(query);
      await client.unsafe(translated.sql, translated.params);
      return { count: 1, duration: 0 };
    },
    withSession(): D1DatabaseSession {
      return session;
    },
    dump(): Promise<ArrayBuffer> {
      return Promise.reject(new Error('D1 dump() is not supported on PostgreSQL backend'));
    },
  };

  return {
    db,
    async close(): Promise<void> {
      await client.end({ timeout: 5 });
    },
  };
}
