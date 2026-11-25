BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '12s';

CREATE TABLE public.cve_vendor_signal (
    provider text NOT NULL,
    cve_id text NOT NULL CHECK (cve_id ~ '^CVE-[0-9]{4}-[0-9]{4,19}$'),
    advisory_url text NOT NULL CHECK (advisory_url LIKE 'https://%'),
    publisher_published_at timestamptz NOT NULL,
    publisher_modified_at timestamptz NOT NULL,
    reported_exploited boolean NOT NULL,
    first_received_at timestamptz NOT NULL,
    first_exploitation_received_at timestamptz,
    baseline boolean NOT NULL,
    PRIMARY KEY (provider, advisory_url, cve_id)
);

CREATE INDEX cve_vendor_signal_lookup
    ON public.cve_vendor_signal (cve_id, reported_exploited DESC, first_received_at DESC);

CREATE TABLE public.cve_vendor_signal_source (
    provider text PRIMARY KEY,
    etag text,
    checked_at timestamptz NOT NULL,
    successful_at timestamptz,
    complete boolean NOT NULL DEFAULT false
);

COMMENT ON TABLE public.cve_vendor_signal IS
    'Publisher disclosures and explicit exploitation reports, including CVEs not yet in the canonical archive.';

COMMIT;
