BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '12s';

CREATE TABLE public.cve_osv_package_advisory (
    id text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'),
    cve_id text CHECK (cve_id ~ '^CVE-[0-9]{4}-[0-9]{4,19}$'),
    kind text NOT NULL CHECK (kind IN ('reviewed', 'malware')),
    advisory_url text NOT NULL CHECK (advisory_url = 'https://osv.dev/vulnerability/' || id),
    published_at timestamptz,
    revision text COLLATE "C" NOT NULL,
    withdrawn_at timestamptz,
    observed_at timestamptz NOT NULL,
    packages jsonb NOT NULL CHECK (jsonb_typeof(packages) = 'array')
);

CREATE INDEX cve_osv_package_advisory_recent
    ON public.cve_osv_package_advisory (kind, published_at DESC, id DESC)
    WHERE withdrawn_at IS NULL AND published_at IS NOT NULL AND jsonb_array_length(packages) > 0;

CREATE TABLE public.cve_osv_package_source (
    ecosystem text PRIMARY KEY CHECK (ecosystem IN ('npm', 'PyPI', '[EMPTY]')),
    checked_at timestamptz NOT NULL,
    successful_at timestamptz,
    complete boolean NOT NULL
);

COMMIT;
