import { NextRequest, NextResponse } from 'next/server';

import { UploadResponseSchema } from '@/app/api/_schemas/membership-application.schema';
import { registerRoute } from '@/app/api/_scripts/register-route';

registerRoute({
  method: 'post',
  path: '/crm/uploads',
  summary: 'Upload image file',
  tags: ['Uploads'],
  responses: [
    { status: 200, schema: UploadResponseSchema, description: 'Upload successful' },
    { status: 400, schema: UploadResponseSchema, description: 'Bad request' },
  ],
});

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only image/jpeg and image/png are allowed.' },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 5 MB limit.' }, { status: 400 });
    }

    const uuid = crypto.randomUUID();
    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const url = `https://cdn.mock.example.com/uploads/${uuid}.${ext}`;

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
