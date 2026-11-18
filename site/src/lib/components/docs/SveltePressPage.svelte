<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Schema } from 'effect';
  import { decodeDocumentationMetadata, documentationMetadata } from '../../docs/markdown-document';
  import MarkdownDocPage from './MarkdownDocPage.svelte';
  const decodeOutline = Schema.decodeUnknownSync(
    Schema.Struct({
      headings: Schema.Array(
        Schema.Struct({ id: Schema.String, title: Schema.String, depth: Schema.Number })
      ),
    })
  );
  let { fm, children }: { fm: unknown; children: Snippet } = $props();
  const metadata = $derived(documentationMetadata(decodeDocumentationMetadata(fm)));
  const headings = $derived(decodeOutline(fm).headings);
</script>

<MarkdownDocPage {metadata} {headings}>{@render children()}</MarkdownDocPage>
