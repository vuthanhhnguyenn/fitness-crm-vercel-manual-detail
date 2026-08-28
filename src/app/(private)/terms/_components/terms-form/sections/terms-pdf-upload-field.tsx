'use client';

import type { ChangeEvent, RefObject } from 'react';
import { useFormContext } from 'react-hook-form';

import type { TermsFormValues } from '@/app/(private)/terms/_schemas/terms-form.schema';
import { Upload } from 'lucide-react';

import { RequiredMark } from '@/components/common/field-marker';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface TermsPdfUploadFieldProps {
  pdfInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  hasExistingPdf: boolean;
  showExistingFileChip: boolean;
  existingPdfFileName?: string;
  attachedPdfName?: string;
  onReplaceClick: () => void;
  onCancelReplace: () => void;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onSetMockPdf?: () => void;
}

export function TermsPdfUploadField({
  pdfInputRef,
  isUploading,
  hasExistingPdf,
  showExistingFileChip,
  existingPdfFileName,
  attachedPdfName,
  onReplaceClick,
  onCancelReplace,
  onFileSelect,
  onSetMockPdf,
}: Readonly<TermsPdfUploadFieldProps>) {
  const form = useFormContext<TermsFormValues>();
  const { errors } = form.formState;

  return (
    <FormField
      control={form.control}
      name="pdfUrl"
      render={() => (
        <FormItem>
          <FormLabel className="text-sm">
            ファイル
            <RequiredMark />
          </FormLabel>
          <p className="text-muted-foreground text-xs">PDF形式のみ。10MB以下。</p>
          <FormControl>
            {showExistingFileChip ? (
              <div className="bg-muted/30 flex max-w-100 items-center gap-3 rounded-lg border px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{existingPdfFileName}</p>
                  <p className="text-muted-foreground text-[10px]">現在のファイル</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1 text-xs"
                  onClick={onReplaceClick}
                >
                  <Upload className="size-3" />
                  差し替え
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={onFileSelect}
                />
                {hasExistingPdf && (
                  <p className="text-muted-foreground text-xs">
                    現在のファイル「{existingPdfFileName}」を差し替えます
                  </p>
                )}
                {attachedPdfName ? (
                  <div className="bg-muted/30 flex max-w-100 items-center gap-3 rounded-lg border px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{attachedPdfName}</p>
                      <p className="text-muted-foreground text-[10px]">選択済みのファイル</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-1 text-xs"
                      disabled={isUploading}
                      onClick={() => pdfInputRef.current?.click()}
                    >
                      <Upload className="size-3" />
                      変更
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit gap-1"
                      aria-invalid={!!errors.pdfUrl}
                      disabled={isUploading}
                      onClick={() => pdfInputRef.current?.click()}
                    >
                      <Upload className="size-4" />
                      {isUploading ? 'アップロード中...' : 'PDFを選択する'}
                    </Button>
                    {onSetMockPdf && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground w-fit gap-1 text-xs"
                        disabled={isUploading}
                        onClick={onSetMockPdf}
                      >
                        モックPDFを設定
                      </Button>
                    )}
                  </div>
                )}
                {hasExistingPdf && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground w-fit text-xs"
                    onClick={onCancelReplace}
                  >
                    キャンセル
                  </Button>
                )}
              </div>
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
