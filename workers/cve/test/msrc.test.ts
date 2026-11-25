import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseMsrcAdvisory, parseMsrcChanges } from '../src/msrc.ts';

const released = '2026-11-10T08:00:00Z';
const revised = '2026-11-12T08:00:00Z';
const firstPath = '2026/msrc_cve-2026-124194.json';
const secondPath = '2026/msrc_cve-2026-112732.json';

test('reads the rolling Microsoft manifest without treating a partial line as a revision', () => {
  const changes = parseMsrcChanges(
    `"${firstPath}","${revised}"\r\n"${secondPath}","${released}"\r\n"2026/msrc_cve-`,
    true
  );
  assert.deepEqual(changes, [
    { id: 'CVE-2026-124194', path: firstPath, modified: '2026-11-12T08:00:00.000Z' },
    { id: 'CVE-2026-112732', path: secondPath, modified: '2026-11-10T08:00:00.000Z' },
  ]);
  assert.throws(
    () => parseMsrcChanges(`"../../outside.json","${revised}"`, false),
    /Microsoft CSAF change/
  );
  assert.throws(
    () => parseMsrcChanges(`"${firstPath}","${released}"\n"${secondPath}","${revised}"`, false),
    /Microsoft CSAF change/
  );
});

test('records the explicit Microsoft exploitation status for the matching CVE', () => {
  const [entry] = parseMsrcChanges(`"${firstPath}","${revised}"`, false);
  assert.ok(entry);
  const advisory = {
    document: { tracking: { initial_release_date: released, current_release_date: revised } },
    vulnerabilities: [
      {
        cve: 'CVE-2026-124194',
        threats: [
          {
            category: 'exploit_status',
            details:
              'Publicly Disclosed:No;Exploited:Yes;Latest Software Release:Exploitation Detected',
          },
        ],
      },
    ],
  };
  assert.deepEqual(parseMsrcAdvisory(advisory, entry), {
    cve_id: 'CVE-2026-124194',
    advisory_url: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2026-124194',
    published: '2026-11-10T08:00:00.000Z',
    modified: '2026-11-12T08:00:00.000Z',
    exploited: true,
  });
  const revisedAdvisory = {
    ...advisory,
    vulnerabilities: [
      {
        cve: 'CVE-2026-124194',
        threats: [
          { category: 'exploit_status', details: 'Publicly Disclosed:Yes;Exploited:No' },
          { category: 'impact', details: 'Exploited:Yes' },
        ],
      },
      ...advisory.vulnerabilities.map(vulnerability => ({
        ...vulnerability,
        cve: 'CVE-2026-112732',
      })),
    ],
  };
  assert.equal(parseMsrcAdvisory(revisedAdvisory, entry).exploited, false);
  assert.throws(
    () => parseMsrcAdvisory({ ...advisory, vulnerabilities: [] }, entry),
    /Microsoft CSAF record/
  );
  assert.throws(
    () =>
      parseMsrcAdvisory(
        {
          ...advisory,
          document: {
            tracking: { initial_release_date: released, current_release_date: released },
          },
        },
        entry
      ),
    /Microsoft CSAF record/
  );
});
