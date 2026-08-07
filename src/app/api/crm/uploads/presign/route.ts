import { NextRequest, NextResponse } from 'next/server';

import {
  PresignUploadRequestSchema,
  PresignUploadResponseSchema,
} from '@/app/api/_schemas/upload.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/uploads/presign',
  summary: 'Get pre-signed URL for direct S3 upload',
  tags: ['Uploads'],
  requestBody: { schema: PresignUploadRequestSchema, description: 'Presign upload request' },
  responses: [
    { status: 200, schema: PresignUploadResponseSchema, description: 'Pre-signed URL generated' },
    { status: 400, schema: PresignUploadResponseSchema, description: 'Bad request' },
  ],
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = PresignUploadRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { category, content_type } = parsed.data;
    const uuid = crypto.randomUUID();
    const ext =
      content_type === 'image/png' ? 'png' : content_type === 'application/pdf' ? 'pdf' : 'jpg';

    // Mock: in production this would call S3 SDK to generate a real presigned URL
    const presign_url = `https://s3.mock.example.com/${category}/${uuid}.${ext}?X-Amz-Signature=mock`;
    const public_url = `https://cdn.mock.example.com/${category}/${uuid}.${ext}`;

    return NextResponse.json({ presign_url, public_url }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
