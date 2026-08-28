import { Button } from '@/components/ui/button';

interface TermsFormActionsProps {
  hasSubmitErrors: boolean;
  isSubmitting: boolean;
  isUploading: boolean;
  isEditMode: boolean;
  isDirty: boolean;
  onCancel: () => void;
}

export function TermsFormActions({
  hasSubmitErrors,
  isSubmitting,
  isUploading,
  isEditMode,
  isDirty,
  onCancel,
}: Readonly<TermsFormActionsProps>) {
  return (
    <div className="flex items-center justify-end gap-2 border-t p-4">
      {hasSubmitErrors && (
        <p className="text-destructive mr-auto text-xs">未入力の項目があります</p>
      )}
      <Button type="button" size="lg" variant="outline" disabled={isSubmitting} onClick={onCancel}>
        キャンセル
      </Button>
      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting || isUploading || (isEditMode && !isDirty)}
      >
        {isEditMode ? '保存する' : '登録する'}
      </Button>
    </div>
  );
}
