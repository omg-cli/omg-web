import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import OrganizationsPage from './+page.svelte';

describe('operator organization directory', () => {
  it('recovers an empty later page after results shrink while preserving search', () => {
    const result = render(OrganizationsPage, {
      props: {
        data: {
          operatorName: 'Operator',
          search: 'Acme & Sons',
          directory: {
            organizations: [],
            pagination: { page: 2, pageSize: 25, total: 1, pages: 1 },
          },
        },
        form: null,
        params: {},
      },
    });
    expect(result.body).toContain('Return to first page');
    expect(result.body).toContain('?page=1&amp;q=Acme%20%26%20Sons');
    expect(result.body).not.toContain('No organizations match this search.');
    expect(result.body).not.toContain('Page 2 of 1');
  });

  it.each([
    { page: 1, pages: 3, previous: false, next: true },
    { page: 2, pages: 3, previous: true, next: true },
    { page: 3, pages: 3, previous: true, next: false },
    { page: 40, pages: 41, previous: true, next: false },
    { page: 1, pages: 1, previous: false, next: false },
  ])('navigates bounded directory page $page of $pages while preserving search', pagination => {
    const result = render(OrganizationsPage, {
      props: {
        data: {
          operatorName: 'Operator',
          search: 'Acme & Sons',
          directory: {
            organizations: [],
            pagination: { pageSize: 25, total: pagination.pages * 25, ...pagination },
          },
        },
        form: null,
        params: {},
      },
    });
    expect(result.body.includes('Previous')).toBe(pagination.previous);
    expect(result.body.includes('Next')).toBe(pagination.next);
    if (pagination.previous)
      expect(result.body).toContain(`?page=${pagination.page - 1}&amp;q=Acme%20%26%20Sons`);
    if (pagination.next)
      expect(result.body).toContain(`?page=${pagination.page + 1}&amp;q=Acme%20%26%20Sons`);
  });

  it('renders browser-safe entitlement and workspace summaries', () => {
    const result = render(OrganizationsPage, {
      props: {
        data: {
          operatorName: 'Operator',
          search: '',
          directory: {
            organizations: [
              {
                name: 'Acme Engineering',
                slug: 'acme-engineering',
                tier: 'team',
                status: 'active',
                seatsUsed: 2,
                seatLimit: 5,
                pendingInvitations: 1,
                activeMachines: 3,
                lastAuditAt: '2026-08-29T12:00:00.000Z',
              },
            ],
            pagination: { page: 1, pageSize: 25, total: 1, pages: 1 },
          },
        },
        form: null,
        params: {},
      },
    });
    expect(result.body).toContain('Acme Engineering');
    expect(result.body).toContain('acme-engineering');
    expect(result.body).toContain('team · active');
    expect(result.body).toContain('Aug 29, 2026, 12:00 PM UTC');
    expect(result.body).toContain('/admin/organizations/support/?slug=acme-engineering');
    expect(result.body).not.toContain('customer-private-id');
    expect(result.body).not.toContain('license-key');
    expect(result.body).not.toContain('member-private-id');
  });
});
