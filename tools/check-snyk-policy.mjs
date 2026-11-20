import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { validateLicensePolicies } from './release/snyk-license-policy.mjs';

const { parse } = createRequire(new URL('../site/package.json', import.meta.url))('yaml');
const json = async path =>
  JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const approvals = await json('docs/operations/snyk-license-approvals-2026-11-20.json');
const projects = [];
for (const [project, directory] of [
  ['omg-web', ''],
  ['omg-site', 'site/'],
  ['omg-saas-workers', 'workers/api/'],
]) {
  projects.push({
    project,
    policy: parse(await readFile(new URL(`../${directory}.snyk`, import.meta.url), 'utf8')),
    lock: await json(`${directory}package-lock.json`),
  });
}
validateLicensePolicies(approvals, projects);
process.stdout.write(
  `[snyk-policy] verified ${approvals.findings.length} approved, version-scoped license exceptions; no security ignores or source exclusions\n`
);
