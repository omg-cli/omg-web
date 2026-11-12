import { agentResponse, documentationEntries } from '../../lib/docs/documentation.server';
import type { RequestHandler } from './$types';

export const prerender = false;
export const GET: RequestHandler = async () => {
  const entries = await documentationEntries();
  return agentResponse(
    [
      '# OMG complete documentation',
      'Release reference: v0.1.224. Individual guides retain their own source references and review dates. Source review is not platform execution certification.',
      ...entries.map(entry => entry.markdown),
    ].join('\n\n---\n\n'),
    'text/plain; charset=utf-8'
  );
};
