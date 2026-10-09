import * as Sentry from '@sentry/cloudflare';
import { cleanupStripeEvents } from './handlers/billing';
import {
  cleanupAnalyticsRetention,
  refreshDocsAnalyticsAggregates,
} from './handlers/docs-analytics';
import { cleanupMarketingOfferLeads } from './handlers/marketing-offer';
import { cleanupExpiredAuditLogs } from './handlers/privacy';
import { reportError, reportInfo } from './observability';

interface ScheduledTask {
  readonly name: string;
  readonly run: () => Promise<void>;
}

export async function runScheduledJobs(
  db: D1Database,
  controller: ScheduledController
): Promise<void> {
  const tasks: ScheduledTask[] = [
    {
      name: 'docs_analytics.aggregate',
      run: () => refreshDocsAnalyticsAggregates(db, controller.scheduledTime),
    },
  ];
  if (controller.cron === '0 2 * * *') {
    tasks.push(
      { name: 'analytics_retention.cleanup', run: () => cleanupAnalyticsRetention(db) },
      { name: 'stripe_events.cleanup', run: () => cleanupStripeEvents(db) },
      { name: 'marketing_offer.cleanup', run: () => cleanupMarketingOfferLeads(db) },
      { name: 'audit_log.cleanup', run: () => cleanupExpiredAuditLogs(db) }
    );
  }

  // Settle every independent task before rejecting the invocation. A failed
  // aggregate must not prevent retention work or make Cloudflare report success.
  const outcomes = await Promise.allSettled(
    tasks.map(async task => {
      try {
        await task.run();
        reportInfo(`${task.name}_completed`);
      } catch (error) {
        reportError(`${task.name}_failed`, error);
        Sentry.captureException(error);
        throw error;
      }
    })
  );
  const failures = outcomes.filter(outcome => outcome.status === 'rejected');
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map(failure => failure.reason),
      `${failures.length} scheduled OMG task(s) failed`
    );
  }
  reportInfo('scheduled.completed');
}
