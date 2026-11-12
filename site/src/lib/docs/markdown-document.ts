import { Schema } from 'effect';

const Source = Schema.Struct({
  repo: Schema.Literal('omg-cli/omg'),
  path: Schema.String,
  reviewedCommit: Schema.String,
  reviewedAt: Schema.String,
});

const Metadata = Schema.Struct({
  title: Schema.String,
  description: Schema.String,
  navLabel: Schema.String,
  section: Schema.Literals(['Start here', 'Guides', 'Reference', 'Runtimes']),
  order: Schema.Number,
  release: Schema.String,
  source: Source,
  implementation: Schema.Array(Schema.String),
});

export type MarkdownDocumentMetadata = typeof Metadata.Type;
export const decodeDocumentationMetadata = Schema.decodeUnknownSync(Metadata);

export function documentationMetadata(
  metadata: MarkdownDocumentMetadata
): MarkdownDocumentMetadata {
  if (!metadata.title.trim() || !metadata.navLabel.trim() || !metadata.description.trim()) {
    throw new Error('Documentation titles, labels, and descriptions must not be empty');
  }
  if (metadata.description.length > 160)
    throw new Error('Documentation description exceeds 160 characters');
  if (!Number.isSafeInteger(metadata.order) || metadata.order < 0)
    throw new Error('Invalid documentation order');
  if (!/^v\d+\.\d+\.\d+$/u.test(metadata.release))
    throw new Error('Documentation needs a release baseline');
  if (!/^[0-9a-f]{40}$/u.test(metadata.source.reviewedCommit))
    throw new Error('Documentation needs a full source commit');
  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(metadata.source.reviewedAt) ||
    Number.isNaN(Date.parse(metadata.source.reviewedAt)) ||
    new Date(metadata.source.reviewedAt).toISOString().slice(0, 10) !== metadata.source.reviewedAt
  ) {
    throw new Error('Invalid documentation review date');
  }
  for (const path of [metadata.source.path, ...metadata.implementation]) {
    if (!/^[\w./-]+$/u.test(path) || path.startsWith('/') || path.split('/').includes('..')) {
      throw new Error('Invalid documentation source path');
    }
  }
  return metadata;
}
