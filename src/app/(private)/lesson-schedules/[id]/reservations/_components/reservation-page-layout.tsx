'use client';

import { useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type {
  LessonScheduleListItem,
  MemoListResponse,
  Reservation,
  ReservationListResponse,
  ReservationStatsResponse,
  StudioSpaceGridResponse,
} from '@/lib/api/types.gen';

import { AddReservationDialog } from './add-reservation-dialog';
import { CancelReservationDialog } from './cancel-reservation-dialog';
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
  const [addReservationOpen, setAddReservationOpen] = useState(false);
  const [preselectedSpace, setPreselectedSpace] = useState<string | null>(null);
  const [cancelReservationOpen, setCancelReservationOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

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
              </CardContent>
            </Card>
          )}

          {/* Space grid */}
          <Card className="pb-0">
            <CardHeader>
              <CardTitle className="text-base font-semibold">スペース予約状況</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <SpaceReservationGrid
                data={spacesData}
                onAddReservation={handleOpenAddReservation}
                onCancelReservation={handleCancelFromGrid}
              />
            </CardContent>
          </Card>

          {/* Reservation list */}
          <ReservationListTable
            scheduleId={scheduleId}
            data={reservationsData}
            onAddReservation={() => handleOpenAddReservation()}
            onCancelReservation={handleOpenCancelReservation}
          />
        </div>

        {/* Right sidebar */}
        <div className="w-[320px] shrink-0 space-y-4">
          <ReservationStatsPanel schedule={schedule} statsData={statsData} />
          <SessionMemoCard scheduleId={scheduleId} memosData={memosData} />
        </div>
      </div>

      {/* Dialogs */}
      <AddReservationDialog
        open={addReservationOpen}
        onOpenChange={setAddReservationOpen}
        scheduleId={scheduleId}
        schedule={schedule}
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
