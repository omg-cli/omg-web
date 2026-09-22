/** Presentation for the operator traffic report. Thresholds match web.dev Core Web Vitals. */

export interface SiteWebVitals {
  readonly samples: number;
  readonly lcp_p75_ms: number | null;
  readonly inp_p75_ms: number | null;
  readonly cls_p75: number | null;
  readonly ttfb_p75_ms: number | null;
  readonly fcp_p75_ms: number | null;
}

type VitalTone = 'good' | 'needs-improvement' | 'poor';

export interface VitalReading {
  readonly label: string;
  readonly detail: string;
  readonly value: string;
  readonly tone: VitalTone | 'unsampled';
}

const NUMBER_FORMAT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function tone(value: number, good: number, poor: number): VitalTone {
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function milliseconds(
  value: number | null,
  good: number,
  poor: number,
  label: string,
  detail: string
): VitalReading {
  if (value === null) {
    return { label, detail, value: 'No samples', tone: 'unsampled' };
  }
  return {
    label,
    detail,
    value: `${NUMBER_FORMAT.format(value)} ms`,
    tone: tone(value, good, poor),
  };
}

/** Turn recorded p75 vitals into labeled readings. LCP, INP, and CLS are the ranking vitals. */
export function webVitalReadings(vitals: SiteWebVitals): readonly VitalReading[] {
  const cls =
    vitals.cls_p75 === null
      ? {
          label: 'CLS',
          detail: 'Layout stability. Good at 0.1 or below.',
          value: 'No samples',
          tone: 'unsampled' as const,
        }
      : {
          label: 'CLS',
          detail: 'Layout stability. Good at 0.1 or below.',
          value: vitals.cls_p75.toFixed(3),
          tone: tone(vitals.cls_p75, 0.1, 0.25),
        };
  return [
    milliseconds(vitals.lcp_p75_ms, 2500, 4000, 'LCP', 'Largest content. Good at 2.5s or below.'),
    milliseconds(vitals.inp_p75_ms, 200, 500, 'INP', 'Interaction delay. Good at 200ms or below.'),
    cls,
    milliseconds(
      vitals.ttfb_p75_ms,
      800,
      1800,
      'TTFB',
      'Server response. Diagnostic, not a ranking vital.'
    ),
    milliseconds(
      vitals.fcp_p75_ms,
      1800,
      3000,
      'FCP',
      'First content. Diagnostic, not a ranking vital.'
    ),
  ];
}

/** Format one UTC hour bucket from the recorded pageview histogram. */
export function formatHour(hour: number): string {
  return `${String(Math.trunc(hour)).padStart(2, '0')}:00 UTC`;
}

/** Format a 0–100 rate with one decimal place. */
export function formatRate(value: number): string {
  return `${value.toFixed(1)}%`;
}
