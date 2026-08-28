'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type {
  LessonScheduleListItem,
  MemoListResponse,
  Reservation,
  ReservationListResponse,
  ReservationStatsResponse,
  StudioSpaceGridResponse,
} from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { AddReservationDialog } from './add-reservation-dialog';
import { CANCEL_REASON_OPTIONS } from './cancel-lesson-wizard';
import { CancelReservationDialog } from './cancel-reservation-dialog';
import { PtLimitedProfileCard } from './pt-limited-profile-card';
import { ReservationListTable } from './reservation-list-table';
import { ReservationStatsPanel } from './reservation-stats-panel';
import { SessionMemoCard } from './session-memo-card';
import { SpaceReservationGrid } from './space-reservation-grid';

interface ReservationPageLayoutProps {
  scheduleId: string;
  schedule: LessonScheduleListItem;
  reservationsData: ReservationListResponse;
  statsData: ReservationStatsResponse;
  spacesData: StudioSpaceGridResponse;
  memosData: MemoListResponse;
  isCancelled: boolean;
}

export function ReservationPageLayout({
  scheduleId,
  schedule,
  reservationsData,
  statsData,
  spacesData,
  memosData,
  isCancelled,
}: ReservationPageLayoutProps) {
  const router = useRouter();
  const [addReservationOpen, setAddReservationOpen] = useState(false);
  const [preselectedSpace, setPreselectedSpace] = useState<string | null>(null);
  const [cancelReservationOpen, setCancelReservationOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const handleNavigateToMember = (memberId: string) => {
    router.push(navigate('/members/[id]', memberId));
  };

  const handleOpenAddReservation = (spaceNumber?: string) => {
    setPreselectedSpace(spaceNumber ?? null);
    setAddReservationOpen(true);
  };

  const handleOpenCancelReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setCancelReservationOpen(true);
  };

  const handleCancelFromGrid = (reservationId: string) => {
    const reservation = reservationsData.reservations.find((r) => r.id === reservationId);
    if (reservation) handleOpenCancelReservation(reservation);
  };

  const remainingSeats = statsData.stats.remaining_seats;
  const isPersonalSession = schedule.lesson_type === 'personal';
  const primaryReservation = reservationsData.reservations[0] ?? null;

  return (
    <>
      <div className="flex gap-x-6 gap-y-4 px-6 py-4">
        {/* Left column */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Cancelled status card */}
          {isCancelled && (
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive text-base font-semibold">中止済み</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <p className="text-muted-foreground">
                  このレッスンは中止されています。変更操作はできません。
                </p>
                {schedule.cancelled_at && (
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                    <span className="text-muted-foreground">中止日時</span>
                    <span className="font-medium">
                      {(() => {
                        try {
                          return format(new Date(schedule.cancelled_at), 'yyyy/M/d HH:mm', {
                            locale: ja,
                          });
                        } catch {
                          return schedule.cancelled_at;
                        }
                      })()}
                    </span>
                    {schedule.cancelled_by && (
                      <>
                        <span className="text-muted-foreground">担当者</span>
                        <span className="font-medium">{schedule.cancelled_by}</span>
                      </>
                    )}
                    {schedule.cancel_reason && (
                      <>
                        <span className="text-muted-foreground">中止理由</span>
                        <span className="font-medium">
                          {CANCEL_REASON_OPTIONS[schedule.cancel_reason] ?? schedule.cancel_reason}
                        </span>
                      </>
                    )}
                    {schedule.cancel_reason_detail && (
                      <>
                        <span className="text-muted-foreground">詳細</span>
                        <span className="font-medium">{schedule.cancel_reason_detail}</span>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Space grid (studio lessons) / limited profile card (PT sessions) */}
          {isPersonalSession ? (
            <PtLimitedProfileCard reservation={primaryReservation} />
          ) : (
            <Card className="pb-0">
              <CardHeader>
                <CardTitle className="text-base font-semibold">スペース予約状況</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <SpaceReservationGrid
                  schedule={schedule}
                  data={spacesData}
                  onAddReservation={handleOpenAddReservation}
                  onCancelReservation={handleCancelFromGrid}
                  onNavigateToMember={handleNavigateToMember}
                />
              </CardContent>
            </Card>
          )}

          {/* Reservation list */}
          <ReservationListTable
            scheduleId={scheduleId}
            schedule={schedule}
            data={reservationsData}
            isCancelled={isCancelled}
            onAddReservation={() => handleOpenAddReservation()}
            onCancelReservation={handleOpenCancelReservation}
          />
        </div>

        {/* Right sidebar */}
        <div className="w-[320px] shrink-0 space-y-4">
          {!isPersonalSession && (
            <ReservationStatsPanel schedule={schedule} statsData={statsData} />
          )}
          <SessionMemoCard scheduleId={scheduleId} schedule={schedule} memosData={memosData} />
        </div>
      </div>

      {/* Dialogs */}
      <AddReservationDialog
        open={addReservationOpen}
        onOpenChange={setAddReservationOpen}
        scheduleId={scheduleId}
        schedule={schedule}
        spacesData={spacesData}
        preselectedSpaceNumber={preselectedSpace}
        remainingSeats={remainingSeats}
      />

      <CancelReservationDialog
        open={cancelReservationOpen}
        onOpenChange={setCancelReservationOpen}
        scheduleId={scheduleId}
        reservation={selectedReservation}
      />
    </>
  );
}
