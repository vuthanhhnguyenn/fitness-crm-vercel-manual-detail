import { NextRequest } from 'next/server';

import { db } from '@/app/api/_mock-db';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { PATCH as actionNotification } from './[id]/action/route';
import { GET as getNotification, PATCH as updateNotification } from './[id]/route';
import { GET as getFormConfig } from './form-config/route';
import { POST as createNotification, GET as listNotifications } from './route';
import { GET as listTargetMembers } from './target-options/members/route';
import { GET as listTargetStores } from './target-options/stores/route';
import { POST as previewTarget } from './target-preview/route';

const API_ORIGIN = 'http://localhost/api';

function bearerToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ id: userId })).toString('base64url');
  return `test.${payload}.signature`;
}

function request(
  path: string,
  options: { method?: string; userId?: string; body?: unknown } = {},
): NextRequest {
  const headers = new Headers();
  if (options.userId) headers.set('Authorization', `Bearer ${bearerToken(options.userId)}`);
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  return new NextRequest(`${API_ORIGIN}${path}`, {
    method: options.method ?? 'GET',
    headers,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
}

const notificationBody = {
  title: 'Contract test notification',
  target: { type: 'all_members' as const },
  channels: ['push' as const],
  contents: { push: { title: 'Contract test notification', body: 'Test body' } },
  timing: { type: 'immediate' as const },
  intent: 'save' as const,
};

test('manual notification route contracts cover happy and error paths', async (context) => {
  let notificationId = '';

  await context.test('list route returns scoped data and rejects missing auth', async () => {
    const success = await listNotifications(request('/crm/notifications', { userId: 'U-002' }));
    assert.equal(success.status, 200);
    const successBody = await success.json();
    assert.ok(successBody.items.some((item: { id: string }) => item.id === 'N-002'));

    const observer = await listNotifications(
      request('/crm/notifications?limit=50', { userId: 'U-005' }),
    );
    assert.equal(observer.status, 200);
    const observerBody = await observer.json();
    assert.ok(observerBody.items.some((item: { id: string }) => item.id === 'N-002'));
    assert.ok(!observerBody.items.some((item: { id: string }) => item.id === 'N-004'));

    const unauthorized = await listNotifications(request('/crm/notifications'));
    assert.equal(unauthorized.status, 401);
  });

  await context.test(
    'create route persists the creator scope and rejects invalid input',
    async () => {
      const success = await createNotification(
        request('/crm/notifications', {
          method: 'POST',
          userId: 'U-002',
          body: notificationBody,
        }),
      );
      assert.equal(success.status, 201);
      const successBody = await success.json();
      notificationId = successBody.item.id;
      const row = db.manualNotifications.getById(notificationId);
      assert.deepEqual(row?.recipientScopeStoreIds, ['store-001']);

      const invalid = await createNotification(
        request('/crm/notifications', { method: 'POST', userId: 'U-002', body: null }),
      );
      assert.equal(invalid.status, 400);
    },
  );

  await context.test('detail route has stable counts and a not-found path', async () => {
    const staffResponse = await getNotification(
      request(`/crm/notifications/${notificationId}`, { userId: 'U-002' }),
      { params: Promise.resolve({ id: notificationId }) },
    );
    const headquarterResponse = await getNotification(
      request(`/crm/notifications/${notificationId}`, { userId: 'U-001' }),
      { params: Promise.resolve({ id: notificationId }) },
    );
    assert.equal(staffResponse.status, 200);
    assert.equal(headquarterResponse.status, 200);
    assert.equal(
      (await staffResponse.json()).item.targetCount,
      (await headquarterResponse.json()).item.targetCount,
    );

    const missing = await getNotification(
      request('/crm/notifications/N-missing', { userId: 'U-001' }),
      { params: Promise.resolve({ id: 'N-missing' }) },
    );
    assert.equal(missing.status, 404);
  });

  await context.test('update route accepts a valid draft and rejects an invalid body', async () => {
    const success = await updateNotification(
      request(`/crm/notifications/${notificationId}`, {
        method: 'PATCH',
        userId: 'U-002',
        body: { ...notificationBody, title: 'Updated contract test notification' },
      }),
      { params: Promise.resolve({ id: notificationId }) },
    );
    assert.equal(success.status, 200);

    const invalid = await updateNotification(
      request(`/crm/notifications/${notificationId}`, {
        method: 'PATCH',
        userId: 'U-002',
        body: null,
      }),
      { params: Promise.resolve({ id: notificationId }) },
    );
    assert.equal(invalid.status, 400);
  });

  await context.test(
    'draft distribution actions return detailed validation errors without changing state',
    async () => {
      const incompleteDraftBody = {
        ...notificationBody,
        title: '',
        contents: { push: { title: '', body: '' } },
      };
      const expectedLabels = ['タイトル（管理用）', 'プッシュ通知本文', 'プッシュ通知タイトル'];

      for (const testCase of [
        {
          action: 'request_approval' as const,
          target: { type: 'all_members' as const },
        },
        {
          action: 'send' as const,
          target: { type: 'stores' as const, storeIds: ['store-001'] },
        },
      ]) {
        const created = await createNotification(
          request('/crm/notifications', {
            method: 'POST',
            userId: 'U-002',
            body: { ...incompleteDraftBody, target: testCase.target },
          }),
        );
        assert.equal(created.status, 201);
        const createdBody = await created.json();
        const draftId = createdBody.item.id as string;
        const beforeAction = structuredClone(db.manualNotifications.getById(draftId));
        assert.equal(beforeAction?.status, 'draft');

        const response = await actionNotification(
          request(`/crm/notifications/${draftId}/action`, {
            method: 'PATCH',
            userId: 'U-002',
            body: { action: testCase.action },
          }),
          { params: Promise.resolve({ id: draftId }) },
        );
        assert.equal(response.status, 400);

        const responseBody = await response.json();
        for (const label of expectedLabels) assert.match(responseBody.error, new RegExp(label));
        assert.doesNotMatch(
          responseBody.error,
          /contents\.push|Title is required|Content is required/,
        );

        const afterAction = db.manualNotifications.getById(draftId);
        assert.equal(afterAction?.status, 'draft');
        assert.deepEqual(afterAction, beforeAction);
      }
    },
  );

  await context.test('approval keeps Staff scope and invalid actions return 400', async () => {
    const requestApproval = await actionNotification(
      request(`/crm/notifications/${notificationId}/action`, {
        method: 'PATCH',
        userId: 'U-002',
        body: { action: 'request_approval' },
      }),
      { params: Promise.resolve({ id: notificationId }) },
    );
    assert.equal(requestApproval.status, 200);

    const approve = await actionNotification(
      request(`/crm/notifications/${notificationId}/action`, {
        method: 'PATCH',
        userId: 'U-001',
        body: { action: 'approve' },
      }),
      { params: Promise.resolve({ id: notificationId }) },
    );
    assert.equal(approve.status, 200);
    const approvedRow = db.manualNotifications.getById(notificationId);
    assert.deepEqual(approvedRow?.recipientScopeStoreIds, ['store-001']);
    assert.deepEqual(approvedRow?.targetStoreIds, ['store-001']);

    const invalid = await actionNotification(
      request(`/crm/notifications/${notificationId}/action`, {
        method: 'PATCH',
        userId: 'U-001',
        body: { action: 'unknown' },
      }),
      { params: Promise.resolve({ id: notificationId }) },
    );
    assert.equal(invalid.status, 400);
  });

  await context.test('form-config route returns data and rejects missing auth', async () => {
    const success = await getFormConfig(
      request('/crm/notifications/form-config', { userId: 'U-003' }),
    );
    assert.equal(success.status, 200);
    assert.ok((await success.json()).templates.length > 0);

    const unauthorized = await getFormConfig(request('/crm/notifications/form-config'));
    assert.equal(unauthorized.status, 401);
  });

  await context.test('target-preview route enforces the Staff store scope', async () => {
    const success = await previewTarget(
      request('/crm/notifications/target-preview', {
        method: 'POST',
        userId: 'U-002',
        body: { type: 'stores', storeIds: ['store-001'] },
      }),
    );
    assert.equal(success.status, 200);

    const forbidden = await previewTarget(
      request('/crm/notifications/target-preview', {
        method: 'POST',
        userId: 'U-002',
        body: { type: 'stores', storeIds: ['store-002'] },
      }),
    );
    assert.equal(forbidden.status, 403);
  });

  await context.test(
    'store target options use I-03 Manager scope and reject missing auth',
    async () => {
      const success = await listTargetStores(
        request('/crm/notifications/target-options/stores?limit=50', { userId: 'U-003' }),
      );
      assert.equal(success.status, 200);
      const successBody = await success.json();
      assert.ok(successBody.items.some((store: { id: string }) => store.id === 'store-007'));

      const unauthorized = await listTargetStores(
        request('/crm/notifications/target-options/stores'),
      );
      assert.equal(unauthorized.status, 401);
    },
  );

  await context.test(
    'member target options scope Staff results and reject missing auth',
    async () => {
      const success = await listTargetMembers(
        request('/crm/notifications/target-options/members?limit=50', { userId: 'U-002' }),
      );
      assert.equal(success.status, 200);
      const successBody = await success.json();
      assert.ok(successBody.items.length > 0);
      assert.ok(
        successBody.items.every((member: { id: string }) =>
          db.members
            .getList()
            .some(
              (row) =>
                row.id === member.id && row.store_id === 'store-001' && row.status === 'active',
            ),
        ),
      );

      const unauthorized = await listTargetMembers(
        request('/crm/notifications/target-options/members'),
      );
      assert.equal(unauthorized.status, 401);
    },
  );
});
