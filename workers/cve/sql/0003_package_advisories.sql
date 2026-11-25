BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '12s';

CREATE TABLE public.cve_package_advisory (
    id text PRIMARY KEY CHECK (id ~ '^GHSA-[a-z0-9]{4}(-[a-z0-9]{4}){2}$'),
    cve_id text CHECK (cve_id ~ '^CVE-[0-9]{4}-[0-9]{4,19}$'),
    kind text NOT NULL CHECK (kind IN ('reviewed', 'malware')),
    advisory_url text NOT NULL CHECK (advisory_url = 'https://github.com/advisories/' || id),
    published_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    withdrawn_at timestamptz,
    observed_at timestamptz NOT NULL,
    packages jsonb NOT NULL CHECK (jsonb_typeof(packages) = 'array')
);

CREATE INDEX cve_package_advisory_recent
    ON public.cve_package_advisory (kind, published_at DESC, id DESC)
    WHERE withdrawn_at IS NULL;

CREATE TABLE public.cve_package_advisory_source (
    kind text PRIMARY KEY CHECK (kind IN ('reviewed', 'malware')),
    window_from timestamptz NOT NULL,
    window_until timestamptz NOT NULL,
    cursor text,
    revision integer NOT NULL DEFAULT 0,
    checked_at timestamptz,
    successful_at timestamptz,
    retry_at timestamptz,
    complete boolean NOT NULL DEFAULT false,
    CHECK (window_from <= window_until)
);

COMMIT;
