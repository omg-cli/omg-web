import { describe, expect, it } from 'vitest';
import { formatHour, formatRate, webVitalReadings } from './admin-traffic-view';

const sampled = {
  samples: 4,
  lcp_p75_ms: 1800,
  inp_p75_ms: 240,
  cls_p75: 0.2,
  ttfb_p75_ms: 900,
  fcp_p75_ms: null,
};

describe('operator traffic presentation', () => {
  it('rates Core Web Vitals against the published thresholds', () => {
    const readings = webVitalReadings(sampled);
    expect(readings.map(reading => [reading.label, reading.tone])).toEqual([
      ['LCP', 'good'],
      ['INP', 'needs-improvement'],
      ['CLS', 'needs-improvement'],
      ['TTFB', 'needs-improvement'],
      ['FCP', 'unsampled'],
    ]);
    expect(readings[0]?.value).toBe('1,800 ms');
    expect(readings[2]?.value).toBe('0.200');
  });

  it('formats UTC hours and rates', () => {
    expect(formatHour(3)).toBe('03:00 UTC');
    expect(formatRate(33.3)).toBe('33.3%');
  });
});
