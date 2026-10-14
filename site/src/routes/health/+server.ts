import { healthResponse } from '../../lib/server/public-files';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ platform }) =>
  healthResponse(platform?.env.CF_VERSION_METADATA);
