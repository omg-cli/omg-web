import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { validateLicensePolicies } from './snyk-license-policy.mjs';

const { parse } = createRequire(new URL('../../site/package.json', import.meta.url))('yaml');
const json = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
const approvals = json('docs/operations/snyk-license-approvals-2026-11-20.json');
const projects = [
  ['omg-web', ''],
  ['omg-site', 'site/'],
  ['omg-saas-workers', 'workers/api/'],
].map(([project, directory]) => ({
  project,
  policy: parse(readFileSync(new URL(`../../${directory}.snyk`, import.meta.url), 'utf8')),
  lock: json(`${directory}package-lock.json`),
}));

test('approved license policies match all three project graphs', () => {
  validateLicensePolicies(approvals, projects);
});

test('security ignores and source exclusions are rejected', () => {
  const security = structuredClone(projects);
  security[0].policy.ignore['SNYK-JS-UNDICI-22291102'] = [{ '*': { reason: 'not approved' } }];
  assert.throws(() => validateLicensePolicies(approvals, security));
  const excluded = structuredClone(projects);
  excluded[0].policy.exclude = { code: ['**'] };
  assert.throws(() => validateLicensePolicies(approvals, excluded));
});

test('license version wildcards and unapproved license IDs are rejected', () => {
  const wildcard = structuredClone(projects);
  const id = Object.keys(wildcard[0].policy.ignore)[0];
  wildcard[0].policy.ignore[id] = [{ '*': { reason: 'not approved' } }];
  assert.throws(() => validateLicensePolicies(approvals, wildcard));
  const unapproved = structuredClone(projects);
  unapproved[0].policy.ignore['snyk:lic:npm:unapproved:AGPL-3.0'] = [{ '*': {} }];
  assert.throws(() => validateLicensePolicies(approvals, unapproved));
  const range = structuredClone(approvals);
  range.findings[0].version = '^1.3.4';
  assert.throws(() => validateLicensePolicies(range, projects));
});

test('dependency upgrades reopen license review instead of broadening an exception', () => {
  const changed = structuredClone(projects);
  const finding = approvals.findings.find(item => item.project === changed[0].project);
  const name = Object.keys(changed[0].lock.packages).find(item =>
    item.endsWith(`node_modules/${finding.package}`)
  );
  changed[0].lock.packages[name].version = '99.0.0';
  assert.throws(() => validateLicensePolicies(approvals, changed), /version changed/);
});
