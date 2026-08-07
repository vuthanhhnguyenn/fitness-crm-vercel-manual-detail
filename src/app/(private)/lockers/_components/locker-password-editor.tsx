'use client';

import { useState } from 'react';

import { formatDateYYYYMMDD } from '@/utils/date.util';
import { Eye, EyeOff, Shuffle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LockerPasswordEditorProps {
  currentPassword: string | null;
  updatedAt?: string | null;
  isSaving?: boolean;
  onSave: (password: string) => Promise<unknown> | unknown;
}

export function LockerPasswordEditor({
  currentPassword,
  updatedAt,
  isSaving = false,
  onSave,
}: LockerPasswordEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const generatePassword = () => {
    setNewPassword(String(Math.floor(1000 + Math.random() * 9000)));
  };

  const resetEditor = () => {
    setNewPassword('');
    setIsEditing(false);
  };

  const handleSave = () => {
    if (newPassword.length !== 4) return;
    Promise.resolve(onSave(newPassword)).then(() => {
      resetEditor();
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <p className="text-muted-foreground mb-1 text-xs">現在のパスワード</p>
          <div className="flex items-center gap-2">
            <p className="font-mono text-sm font-medium tracking-widest">
              {currentPassword ? (isVisible ? currentPassword : '••••') : '―'}
            </p>
            {currentPassword && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setIsVisible((prev) => !prev)}
              >
                {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            )}
          </div>
        </div>

        {updatedAt !== undefined && (
          <p className="text-sm">最終変更日: {updatedAt ? formatDateYYYYMMDD(updatedAt) : '―'}</p>
        )}
      </div>

      {!isEditing ? (
        <div className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setIsEditing(true)}
          >
            パスワードを変更
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-muted-foreground mb-1 text-xs">新しいパスワード</p>
            <div className="flex items-center gap-2">
              <Input
                className="max-w-50 font-mono text-sm"
                placeholder="4桁の数字"
                maxLength={4}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1 text-xs"
                onClick={generatePassword}
              >
                <Shuffle className="size-4" />
                ランダム生成
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="text-xs"
              disabled={newPassword.length !== 4 || isSaving}
              onClick={handleSave}
            >
              保存
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" onClick={resetEditor}>
              キャンセル
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
