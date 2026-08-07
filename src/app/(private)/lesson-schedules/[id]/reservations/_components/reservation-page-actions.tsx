'use client';

import { useState } from 'react';

import { useAuthUser } from '@/contexts/auth-user.context';
import { Ban, Check, ChevronDown, Clock, MapPin, Pencil, Users } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { LessonScheduleListItem } from '@/lib/api/types.gen';
import { cn } from '@/lib/utils';

import { Permission } from '@/types/permission.type';

import { CancelLessonWizard } from './cancel-lesson-wizard';
import { ChangeInstructorDialog } from './change-instructor-dialog';
import { ChangeStudioDialog } from './change-studio-dialog';
import { ChangeTimeDialog } from './change-time-dialog';

interface ReservationPageActionsProps {
  scheduleId: string;
  schedule: LessonScheduleListItem;
  isCancelled: boolean;
  onIsCancelledChange: (cancelled: boolean) => void;
}

export function ReservationPageActions({
  scheduleId,
  schedule,
  isCancelled,
  onIsCancelledChange,
}: ReservationPageActionsProps) {
  const [changeInstructorOpen, setChangeInstructorOpen] = useState(false);
  const [changeTimeOpen, setChangeTimeOpen] = useState(false);
  const [changeStudioOpen, setChangeStudioOpen] = useState(false);
  const [cancelLessonOpen, setCancelLessonOpen] = useState(false);

  const { hasPermission } = useAuthUser();

  // Changing instructor/time/studio and cancelling the lesson are schedule-edit
  // operations (D-01 FR-003). Roles without schedule-manage (e.g. Observer)
  // see no action affordances.
  if (!hasPermission(Permission.LessonsScheduleManage)) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isCancelled}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1')}
          >
            <Pencil className="size-4" />
            この回を変更
            <ChevronDown className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setChangeInstructorOpen(true)}>
              <Users className="mr-2 size-4" />
              講師を変更する
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setChangeTimeOpen(true)}>
              <Clock className="mr-2 size-4" />
              時間を変更する
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setChangeStudioOpen(true)}>
              <MapPin className="mr-2 size-4" />
              スタジオを変更する
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isCancelled ? (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => onIsCancelledChange(false)}
          >
            <Check className="size-4" />
            中止を取り消す
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
            onClick={() => setCancelLessonOpen(true)}
          >
            <Ban className="size-4" />
            中止にする
          </Button>
        )}
      </div>

      <ChangeInstructorDialog
        open={changeInstructorOpen}
        onOpenChange={setChangeInstructorOpen}
        scheduleId={scheduleId}
        schedule={schedule}
      />

      <ChangeTimeDialog
        open={changeTimeOpen}
        onOpenChange={setChangeTimeOpen}
        scheduleId={scheduleId}
        schedule={schedule}
      />

      <ChangeStudioDialog
        open={changeStudioOpen}
        onOpenChange={setChangeStudioOpen}
        scheduleId={scheduleId}
        schedule={schedule}
      />

      <CancelLessonWizard
        open={cancelLessonOpen}
        onOpenChange={setCancelLessonOpen}
        scheduleId={scheduleId}
        schedule={schedule}
        onCancelled={() => onIsCancelledChange(true)}
      />
    </>
  );
}
