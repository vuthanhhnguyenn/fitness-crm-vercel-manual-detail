'use client';

import { useCallback, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { postCrmUploadsPresignMutation } from '@/lib/api/@tanstack/react-query.gen';

type UploadCategory = 'avatar' | 'cv' | 'document' | 'other' | 'studio';
type UploadContentType = 'image/jpeg' | 'image/png';

const DEFAULT_ACCEPTED_TYPES: UploadContentType[] = ['image/jpeg', 'image/png'];

interface UseImageUploadOptions {
  readonly category?: UploadCategory;
  readonly maxSizeMB?: number;
  readonly acceptedTypes?: readonly UploadContentType[];
  readonly errorMessage?: string;
}

interface UseImageUploadResult {
  /** Upload một file, trả về public URL hoặc null nếu lỗi/không hợp lệ. */
  readonly uploadFile: (file: File) => Promise<string | null>;
  /** Upload nhiều file song song, chỉ trả về các URL upload thành công. */
  readonly uploadFiles: (files: File[]) => Promise<string[]>;
  readonly isUploading: boolean;
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadResult {
  const {
    category = 'other',
    maxSizeMB = 5,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    errorMessage = 'アップロードに失敗しました',
  } = options;

  const { mutateAsync: getPresignUrl } = useMutation(postCrmUploadsPresignMutation());
  const [pendingCount, setPendingCount] = useState(0);

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`ファイルサイズは${maxSizeMB}MB以下にしてください`);
        return null;
      }

      if (!acceptedTypes.includes(file.type as UploadContentType)) {
        toast.error(errorMessage);
        return null;
      }

      setPendingCount((count) => count + 1);
      try {
        const presign = await getPresignUrl({
          body: {
            category: category as 'avatar' | 'cv' | 'document' | 'other',
            content_type: file.type as UploadContentType,
          },
        });

        const presignUrl = presign?.presign_url;
        if (!presignUrl) {
          toast.error(errorMessage);
          return null;
        }

        const res = await fetch(presignUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });

        if (!res.ok) {
          toast.error(errorMessage);
          return null;
        }

        return presign.public_url;
      } catch {
        toast.error(errorMessage);
        return null;
      } finally {
        setPendingCount((count) => count - 1);
      }
    },
    [acceptedTypes, category, errorMessage, getPresignUrl, maxSizeMB],
  );

  const uploadFiles = useCallback(
    async (files: File[]): Promise<string[]> => {
      const results = await Promise.all(files.map((file) => uploadFile(file)));
      return results.filter((url): url is string => url !== null);
    },
    [uploadFile],
  );

  return { uploadFile, uploadFiles, isUploading: pendingCount > 0 };
}
