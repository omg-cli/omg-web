import type { Plugin, PluginOption } from 'vite';

export function markdownTransform<Context, Arguments extends unknown[], Result>(
  transform: (this: Context, code: string, id: string, ...arguments_: Arguments) => Result
) {
  return function (this: Context, code: string, id: string, ...arguments_: Arguments) {
    if (id.split('?')[0]?.endsWith('.svelte')) return null;
    return transform.call(this, code, id, ...arguments_);
  };
}

/** SveltePress wraps all pages by default; this app uses its layout only for Markdown. */
export function documentationOnlyPlugins(core: PluginOption): PluginOption[] {
  const plugins = Array.isArray(core) ? core : [core];
  return plugins.map(plugin => {
    if (
      !plugin ||
      Array.isArray(plugin) ||
      !('name' in plugin) ||
      plugin.name !== '@sveltepress/vite' ||
      !('transform' in plugin)
    )
      return plugin;
    const hook = plugin.transform;
    if (!hook) throw new Error('Missing SveltePress transform hook');
    const transform = 'handler' in hook ? hook.handler : hook;
    // SveltePress's legacy HMR hook also wraps native .svelte pages. Vite's normal
    // invalidation already reloads Markdown; omit that hook for this mixed app.
    const { handleHotUpdate: _handleHotUpdate, ...scoped } = plugin;
    return { ...scoped, transform: markdownTransform(transform) } satisfies Plugin;
  });
}
