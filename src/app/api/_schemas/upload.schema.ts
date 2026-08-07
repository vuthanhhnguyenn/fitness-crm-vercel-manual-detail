import { z } from 'zod';

export const UploadCategory = z.enum(['avatar', 'cv', 'document', 'other', 'studio']);
export type UploadCategoryType = z.infer<typeof UploadCategory>;

export const PresignUploadRequestSchema = z
  .object({
    category: UploadCategory.openapi({
      example: 'avatar',
      description: 'Category of the file being uploaded',
    }),
    content_type: z
      .enum(['image/jpeg', 'image/png', 'application/pdf'])
      .openapi({ example: 'image/jpeg', description: 'MIME type of the file' }),
  })
  .openapi({ title: 'PresignUploadRequest' });

export const PresignUploadResponseSchema = z
  .object({
    presign_url: z.string().url().openapi({
      example: 'https://s3.amazonaws.com/bucket/key?X-Amz-Signature=...',
      description: 'Pre-signed URL to upload the file directly to S3 via HTTP PUT',
    }),
    public_url: z.string().url().openapi({
      example: 'https://cdn.mock.example.com/avatar/abc123.jpg',
      description: 'Public URL of the file after upload',
    }),
  })
  .openapi({ title: 'PresignUploadResponse', description: 'Pre-signed upload URL response' });

export type PresignUploadRequest = z.infer<typeof PresignUploadRequestSchema>;
export type PresignUploadResponse = z.infer<typeof PresignUploadResponseSchema>;
