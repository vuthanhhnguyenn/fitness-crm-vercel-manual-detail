import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/app/api/_mock-db';
import {
  ErrorResponseSchema,
  GetAppVersionResponseSchema,
  UpdateAppVersionBodySchema,
} from '@/app/api/_schemas/app-version.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'get',
  path: '/crm/app-versions/{id}',
  summary: 'Get app version by ID',
  description: 'Fetch a single app version record for the detail screen',
  tags: ['AppVersions'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'App version record ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    {
      status: 200,
      schema: GetAppVersionResponseSchema,
      description: 'App version detail',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'App version not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const appVersion = db.appVersions.getById(id);

    if (!appVersion) {
      return NextResponse.json({ error: 'アプリバージョンが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(appVersion, { status: 200 });
  } catch (error) {
    console.error('GET /crm/app-versions/[id] error:', error);
    return NextResponse.json({ error: 'アプリバージョンの取得に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'patch',
  path: '/crm/app-versions/{id}',
  summary: 'Update app version',
  description: 'Edit an existing app version record',
  tags: ['AppVersions'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'App version record ID',
      schema: { type: 'string' },
    },
  ],
  requestBody: {
    schema: UpdateAppVersionBodySchema,
    description: 'App version update payload',
  },
  responses: [
    {
      status: 200,
      schema: GetAppVersionResponseSchema,
      description: 'App version updated',
    },
    {
      status: 400,
      schema: ErrorResponseSchema,
      description: 'Validation error',
    },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'App version not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validationResult = UpdateAppVersionBodySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const updated = db.appVersions.update(id, validationResult.data);
    if (!updated) {
      return NextResponse.json({ error: 'アプリバージョンが見つかりません' }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PATCH /crm/app-versions/[id] error:', error);
    return NextResponse.json({ error: 'アプリバージョンの更新に失敗しました' }, { status: 500 });
  }
}

registerRoute({
  method: 'delete',
  path: '/crm/app-versions/{id}',
  summary: 'Delete app version',
  description: 'Soft-delete an app version record by id',
  tags: ['AppVersions'],
  parameters: [
    {
      name: 'id',
      in: 'path',
      required: true,
      description: 'App version record ID',
      schema: { type: 'string' },
    },
  ],
  responses: [
    { status: 204, description: 'App version deleted' },
    {
      status: 404,
      schema: ErrorResponseSchema,
      description: 'App version not found',
    },
    {
      status: 500,
      schema: ErrorResponseSchema,
      description: 'Internal server error',
    },
  ],
});

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = db.appVersions.softDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'アプリバージョンが見つかりません' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /crm/app-versions/[id] error:', error);
    return NextResponse.json({ error: 'アプリバージョンの削除に失敗しました' }, { status: 500 });
  }
}
