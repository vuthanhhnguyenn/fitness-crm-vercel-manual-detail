'use client';

import { useCallback, useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import { postCrmUploadsPresignMutation } from '@/lib/api/@tanstack/react-query.gen';

export type UploadCategory = 'avatar' | 'cv' | 'document' | 'other' | 'studio';
export type UploadContentType = 'image/jpeg' | 'image/png' | 'application/pdf';

export interface FileUploadResult {
  readonly url: string;
  readonly name: string;
  readonly size: number;
}

export type FileUploadOutcome =
  | ({ ok: true } & FileUploadResult)
  | { ok: false; reason: 'invalid_type' | 'too_large' | 'upload_failed' };

interface UseFileUploadOptions {
  readonly category?: UploadCategory;
  readonly maxSizeMB?: number;
  readonly acceptedTypes?: readonly UploadContentType[];
}

interface UseFileUploadResult {
  readonly uploadFile: (file: File) => Promise<FileUploadOutcome>;
  readonly isUploading: boolean;
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadResult {
  const { category = 'other', maxSizeMB = 5, acceptedTypes } = options;
  const { mutateAsync: getPresignUrl } = useMutation(postCrmUploadsPresignMutation());
  const [pendingCount, setPendingCount] = useState(0);

  const uploadFile = useCallback(
    async (file: File): Promise<FileUploadOutcome> => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        return { ok: false, reason: 'too_large' };
      }

      if (acceptedTypes && !acceptedTypes.includes(file.type as UploadContentType)) {
        return { ok: false, reason: 'invalid_type' };
      }

      setPendingCount((count) => count + 1);
      try {
        const presign = await getPresignUrl({
          body: { category, content_type: file.type as UploadContentType },
        });
        if (!presign?.presign_url) {
          return { ok: false, reason: 'upload_failed' };
        }

        const response = await fetch(presign.presign_url, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        if (!response.ok) {
          return { ok: false, reason: 'upload_failed' };
        }

        return { ok: true, url: presign.public_url, name: file.name, size: file.size };
      } catch {
        return { ok: false, reason: 'upload_failed' };
      } finally {
        setPendingCount((count) => count - 1);
      }
    },
    [acceptedTypes, category, getPresignUrl, maxSizeMB],
  );

  return { uploadFile, isUploading: pendingCount > 0 };
}
