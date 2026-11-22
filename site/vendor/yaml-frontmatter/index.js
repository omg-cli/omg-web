import { parseDocument } from 'yaml';

// The docs package reads only content and data. Keep format selection out of
// this adapter so frontmatter always stays data.
export default function readFrontmatter(source) {
  const lines = source.split('\n');
  const opening = lines[0]?.trimEnd();
  if (!opening?.startsWith('---') || opening.startsWith('----')) {
    return { data: {}, content: source };
  }
  const language = opening.slice(3).trim();
  if (language !== '' && language !== 'yaml') {
    throw new Error('Only YAML frontmatter is supported');
  }
  const closing = lines.findIndex((line, index) => index > 0 && line.trimEnd() === '---');
  if (closing === -1) throw new Error('Unclosed YAML frontmatter');

  const header = lines
    .slice(1, closing)
    .map(line => (line.endsWith('\r') ? line.slice(0, -1) : line))
    .join('\n');
  const document = parseDocument(header);
  if (document.errors.length > 0 || document.warnings.length > 0) {
    throw new Error('Invalid YAML frontmatter', {
      cause: document.errors[0] ?? document.warnings[0],
    });
  }
  const data = document.toJS({ maxAliasCount: 0 }) ?? {};
  if (typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('YAML frontmatter must be a mapping');
  }
  return { data, content: lines.slice(closing + 1).join('\n') };
}
