'use client';

import { useState } from 'react';

import { Link2Off } from 'lucide-react';

import { RoleGatedButton } from '@/components/common/role-gated-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { Permission } from '@/types/permission.type';

interface RemoveActionButtonProps {
  readonly dialogTitle: string;
  readonly dialogDescription: string;
  readonly isPending?: boolean;
  readonly onConfirm: () => void;
}

export function RemoveActionButton({
  dialogTitle,
  dialogDescription,
  isPending = false,
  onConfirm,
}: RemoveActionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <RoleGatedButton
            requiredPermission={Permission.StoresConfigContract}
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive/80 hover:text-destructive size-7"
            aria-label="紐づけを解除"
          >
            <Link2Off className="size-4" />
          </RoleGatedButton>
        }
      ></AlertDialogTrigger>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>キャンセル</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            解除する
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
