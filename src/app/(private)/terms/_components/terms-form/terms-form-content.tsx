import type { ChangeEvent, RefObject } from 'react';
import { useFormContext } from 'react-hook-form';

import { TEXTAREA_MAX_LENGTH } from '@/constants/app.constants';
import { Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import type { TermsFormValues } from '../../_schemas/terms-form.schema';
import { TermsFieldLabel } from './terms-form-basics';

interface TermsFormContentProps {
  pdfInputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  hasExistingPdf: boolean;
  showExistingPdf: boolean;
  existingPdfFileName?: string;
  selectedPdfFileName?: string;
  onReplacePdf: () => void;
  onCancelReplacePdf: () => void;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  relatedTermsRef?: {
    title: string;
    version: string;
  } | null;
}

export function TermsFormContent({
  pdfInputRef,
  isUploading,
  hasExistingPdf,
  showExistingPdf,
  existingPdfFileName,
  selectedPdfFileName,
  onReplacePdf,
  onCancelReplacePdf,
  onFileSelect,
  relatedTermsRef,
}: Readonly<TermsFormContentProps>) {
  const form = useFormContext<TermsFormValues>();
  const hasPdfError = Boolean(form.formState.errors.pdfUrl);

  return (
    <Card>
      <CardHeader>
        <CardTitle>内容</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <TermsFieldLabel optional>備考</TermsFieldLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  maxLength={TEXTAREA_MAX_LENGTH}
                  placeholder="規約に関する備考を入力"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pdfUrl"
          render={() => (
            <FormItem>
              <TermsFieldLabel required description="PDF形式のみ。10MB以下。">
                ファイル
              </TermsFieldLabel>
              <FormControl>
                {showExistingPdf ? (
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
                      onClick={onReplacePdf}
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
                    {hasExistingPdf ? (
                      <p className="text-muted-foreground text-xs">
                        現在のファイル「{existingPdfFileName}」を差し替えます
                      </p>
                    ) : null}
                    {selectedPdfFileName ? (
                      <div className="bg-muted/30 flex max-w-100 items-center gap-3 rounded-lg border px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{selectedPdfFileName}</p>
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit gap-1"
                        aria-invalid={hasPdfError}
                        disabled={isUploading}
                        onClick={() => pdfInputRef.current?.click()}
                      >
                        <Upload className="size-4" />
                        {isUploading ? 'アップロード中...' : 'PDFを選択する'}
                      </Button>
                    )}
                    {hasExistingPdf ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground w-fit text-xs"
                        onClick={onCancelReplacePdf}
                      >
                        キャンセル
                      </Button>
                    ) : null}
                  </div>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-1">
          <Label>規約本文</Label>
          <p className="text-muted-foreground text-xs">
            PDFアップロード後、規約本文はバックエンドで抽出して保持します。
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <Label>関連規約</Label>
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
