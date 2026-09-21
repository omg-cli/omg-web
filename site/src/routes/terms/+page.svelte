<!-- Terms of service for the OMG Package Manager site, CLI, and licensing API. -->
<script lang="ts">
  import SeoHead from '../../lib/components/SeoHead.svelte';
  import { SITE_ORIGIN, serializeJsonLd } from '../../../../shared/public-site';

  const structuredData = serializeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_ORIGIN}/terms/#page`,
    url: `${SITE_ORIGIN}/terms/`,
    name: 'Terms of Service - OMG Package Manager',
    isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
    publisher: { '@id': `${SITE_ORIGIN}/#org` },
  });
</script>

<SeoHead
  title="Terms of Service - OMG Package Manager"
  description="Terms covering the OMG Package Manager website, the omg command-line tool, and the hosted account services: acceptable use, accounts, billing, and liability."
  path="/terms/"
  {structuredData}
/>

<main id="main-content" class="legal-shell">
  <p class="page-kicker">Service agreement</p>
  <h1 class="legal-title">Terms of service</h1>
  <p class="legal-meta">Last updated September 2, 2026</p>

  <div class="legal-body">
    <section>
      <h2>1. The service</h2>
      <p>
        OMG Package Manager ("OMG") is a free and open-source unified package manager CLI for Linux
        and macOS under the MIT License, with optional hosted account services providing telemetry
        and dashboards. Hosted services are provided under these terms.
      </p>
    </section>

    <section>
      <h2>2. Accounts and dashboard access</h2>
      <ul>
        <li>
          You are responsible for activity performed through your account and linked machine tokens.
        </li>
        <li>
          Account linking is optional. All CLI package and runtime features are free and fully
          functional locally without an account.
        </li>
      </ul>
    </section>

    <section>
      <h2>3. Acceptable use</h2>
      <ul>
        <li>No attempts to breach, overload, or abuse the service or its APIs.</li>
        <li>
          No submission of malicious content, including formula-injection payloads into profile
          fields that other users may export.
        </li>
        <li>No resale of hosted services without written agreement.</li>
      </ul>
    </section>

    <section>
      <h2>4. Disclaimer and liability</h2>
      <p>
        The service is provided "as is" without warranties of any kind. To the maximum extent
        permitted by law, OMG's operators are not liable for indirect, incidental, or consequential
        damages arising from use of the service.
      </p>
    </section>

    <section>
      <h2>5. Changes and contact</h2>
      <p>
        These terms may be updated; material changes will be announced on the site. Continued use
        after changes constitutes acceptance. Questions:
        <a href="mailto:support@latham.cloud">support@latham.cloud</a>.
      </p>
    </section>
  </div>

  <a href="/" class="legal-home">← Back to home</a>
</main>
