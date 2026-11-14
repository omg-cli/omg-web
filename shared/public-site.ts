export const SITE_HOSTNAME = 'getomg.dev';
export const SITE_ORIGIN = `https://${SITE_HOSTNAME}`;

export const SOCIAL_CARD = {
  path: '/og/omg-social-20261113.png',
  width: 1200,
  height: 630,
  alt: 'OMG homepage showing package and runtime management with an Arch Linux command demo.',
} as const;

// Account sessions and the registered GitHub OAuth callback remain on .xyz.
export const ACCOUNT_ORIGIN = 'https://getomg.xyz';

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonLdValue[]
  | { readonly [key: string]: JsonLdValue };

/** Serialize structured data without permitting an HTML script-text breakout. */
export function serializeJsonLd(value: JsonLdValue): string {
  return JSON.stringify(value)
    .replaceAll('<', '\\u003c')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029');
}
