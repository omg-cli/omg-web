import { dev } from '$app/env';

// The dev client uses a per-request bootstrap. Production emits a hashed prerendered bootstrap.
export const prerender = !dev;
