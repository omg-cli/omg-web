import { LEARNING_PAGES } from './catalog';

const loaders = {
  node: () => import('./content/node'),
  bun: () => import('./content/bun'),
  python: () => import('./content/python'),
  go: () => import('./content/go'),
  rust: () => import('./content/rust'),
  'task-runner': () => import('./content/task-runner'),
  'migrate-from-yay': () => import('./content/migrate-from-yay'),
  'node-npm-pnpm': () => import('./content/node-npm-pnpm'),
  'migrate-from-nvm': () => import('./content/migrate-from-nvm'),
  'migrate-from-asdf': () => import('./content/migrate-from-asdf'),
  'reproducible-dev-environments': () => import('./content/reproducible-dev-environments'),
  'omg-vs-yay': () => import('./content/omg-vs-yay'),
  'omg-vs-mise': () => import('./content/omg-vs-mise'),
  'omg-vs-asdf': () => import('./content/omg-vs-asdf'),
  'omg-vs-nvm': () => import('./content/omg-vs-nvm'),
  'omg-vs-pyenv': () => import('./content/omg-vs-pyenv'),
  'omg-vs-volta': () => import('./content/omg-vs-volta'),
};

export async function loadLearningPage(category: string, slug: string) {
  const meta = LEARNING_PAGES.find(page => page.category === category && page.slug === slug);
  if (!meta) return undefined;
  const { content } = await loaders[meta.slug]();
  return { meta, content };
}
