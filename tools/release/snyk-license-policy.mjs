import assert from 'node:assert/strict';

/** Keep the owner's license approval separate from security and source policy. */
export function validateLicensePolicies(approvals, projects) {
  assert.equal(approvals.status, 'approved', 'License approval is required');
  assert.equal(approvals.securityIgnores, false);
  assert.equal(approvals.sourceExclusions, false);
  assert.deepEqual(
    projects.map(item => item.project).toSorted(),
    [...new Set(approvals.findings.map(item => item.project))].toSorted()
  );
  for (const { project, policy, lock } of projects) {
    const approved = approvals.findings.filter(finding => finding.project === project);
    assert.deepEqual(
      Object.keys(policy).toSorted(),
      ['ignore', 'version'],
      'No exclusions or other policy controls are approved'
    );
    assert.equal(policy.version, 'v1.25.0');
    assert.deepEqual(
      Object.keys(policy.ignore).toSorted(),
      approved.map(finding => finding.id).toSorted(),
      'Only the approved license IDs may be accepted'
    );
    for (const finding of approved) {
      assert.ok(finding.id.startsWith('snyk:lic:'), 'Security findings cannot be ignored');
      assert.match(
        finding.version,
        /^[0-9]+\.[0-9]+\.[0-9]+(?:-[A-Za-z0-9.-]+)?$/,
        'Approved versions cannot be ranges or wildcards'
      );
      assert.ok(['LGPL-3.0', 'MPL-2.0'].includes(finding.licenseCategory));
      const rules = policy.ignore[finding.id];
      const path = `* > ${finding.package}@${finding.version}`;
      assert.equal(rules.length, 1, 'One exact package/version rule is required');
      assert.deepEqual(Object.keys(rules[0]), [path], 'License exception versions must be exact');
      const details = rules[0][path];
      assert.deepEqual(Object.keys(details).toSorted(), ['created', 'reason']);
      assert.ok(
        details.reason.includes('Repository owner approved') &&
          details.reason.includes(`${finding.package}@${finding.version}`)
      );
      assert.ok(Number.isFinite(Date.parse(details.created)));
      const packages = Object.entries(lock.packages).filter(([name]) =>
        name.endsWith(`node_modules/${finding.package}`)
      );
      assert.ok(packages.length > 0, 'Approved package is missing from the lockfile');
      assert.ok(
        packages.every(([, entry]) => entry.version === finding.version),
        'Dependency version changed; license approval needs review'
      );
    }
  }
}
