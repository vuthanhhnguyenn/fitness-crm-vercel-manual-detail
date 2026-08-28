import { Button } from '@/components/ui/button';

interface BannerFormActionsProps {
  hasSubmitErrors: boolean;
  isSubmitting: boolean;
  isUploading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export function BannerFormActions({
  hasSubmitErrors,
  isSubmitting,
  isUploading,
  onCancel,
  onSubmit,
}: BannerFormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2 border-t p-4">
      {hasSubmitErrors && (
        <p className="text-destructive mr-auto text-xs">未入力の項目があります</p>
      )}
      <Button type="button" size="lg" variant="outline" onClick={onCancel} disabled={isSubmitting}>
        キャンセル
      </Button>
      <Button type="button" size="lg" onClick={onSubmit} disabled={isSubmitting || isUploading}>
        {isSubmitting ? '保存中...' : '保存する'}
      </Button>
    </div>
  );
}
