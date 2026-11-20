export default {
  arrowParens: 'avoid',
  bracketSpacing: true,
  endOfLine: 'lf',
  plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
  overrides: [{ files: ['.snyk', '**/.snyk'], options: { parser: 'yaml' } }],
  printWidth: 100,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
};
