'use client';

import type { ChangeEvent, RefObject } from 'react';
import { useFormContext } from 'react-hook-form';

import { TermsPdfUploadField } from '@/app/(private)/terms/_components/terms-form/sections/terms-pdf-upload-field';
import type { TermsFormValues } from '@/app/(private)/terms/_schemas/terms-form.schema';

import { OptionalMark } from '@/components/common/field-marker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const EXTRACTED_TEXT_PREVIEW = `第1条（総則）
本規約は本文書に定める条件を定めるものです。会員は本規約に同意のうえ、サービスを利用するものとします。

第2条（適用範囲）
本規約は全ての会員に適用されます。`;

export interface RelatedTermsRef {
  title: string;
  version: string;
}

interface TermsContentSectionProps {
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
  relatedTermsRef?: RelatedTermsRef | null;
}

export function TermsContentSection({
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
  relatedTermsRef,
}: Readonly<TermsContentSectionProps>) {
  const form = useFormContext<TermsFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">内容</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-4">
        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">
                備考
                <OptionalMark />
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="規約に関する備考を入力"
                  rows={4}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <TermsPdfUploadField
          pdfInputRef={pdfInputRef}
          isUploading={isUploading}
          hasExistingPdf={hasExistingPdf}
          showExistingFileChip={showExistingFileChip}
          existingPdfFileName={existingPdfFileName}
          attachedPdfName={attachedPdfName}
          onReplaceClick={onReplaceClick}
          onCancelReplace={onCancelReplace}
          onFileSelect={onFileSelect}
          onSetMockPdf={onSetMockPdf}
        />

        <div className="flex flex-col gap-2">
          <Label className="text-sm">規約本文</Label>
          <p className="text-muted-foreground text-xs">
            PDFアップロード時にテキストを自動抽出し、規約本文テキストとして保持します
          </p>
          {attachedPdfName ? (
            <div className="flex flex-col gap-2">
              <div className="bg-muted/30 max-h-50 max-w-160 overflow-auto rounded-lg border p-3">
                <p className="text-xs leading-relaxed whitespace-pre-wrap">
                  {EXTRACTED_TEXT_PREVIEW}
                </p>
              </div>
              <p className="text-muted-foreground text-[10px]">抽出元: {attachedPdfName}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              PDFファイルを選択すると、本文テキストが自動抽出されて表示されます
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-sm">関連規約</Label>
          {relatedTermsRef ? (
            <div className="bg-muted/30 flex max-w-100 items-center gap-3 rounded-lg border px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">
                  {relatedTermsRef.title} {relatedTermsRef.version}
                </p>
                <p className="text-muted-foreground text-[10px]">オリジナル規約（自動設定）</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">関連する規約が存在しません</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
