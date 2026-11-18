import { documentationNavigation } from '../../lib/docs/documentation.server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = () => ({
  documentationNavigation: documentationNavigation(),
});
