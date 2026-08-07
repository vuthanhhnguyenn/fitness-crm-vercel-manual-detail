'use client';

import { useState } from 'react';

import { decodeJWT } from '@/utils/auth.util';
import { format, parseISO } from 'date-fns';
import Cookies from 'universal-cookie';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmTransfersByIdResponse } from '@/lib/api/types.gen';

import { CookieNames } from '@/types/global.enum';

import { TransferApproveDialog } from './transfer-approve-dialog';
import { TransferRejectDialog } from './transfer-reject-dialog';
import { TransferStatusBadge } from './transfer-status-badge';

type TransferDetail = NonNullable<GetCrmTransfersByIdResponse>['transfer'];

interface Props {
  transfer: TransferDetail;
}

function getCurrentUserRole(): { role: string; store_id: string | null } {
  try {
    const cookies = new Cookies();
    const session = cookies.get<{ token?: string }>(CookieNames.Session);
    if (session?.token) {
      const payload = decodeJWT(session.token) as { role?: string; store_id?: string } | null;
      if (payload) {
        return { role: payload.role ?? 'headquarter', store_id: payload.store_id ?? null };
      }
    }
  } catch {
    // ignore
  }
  // fallback for dev / mock environment
  return { role: 'headquarter', store_id: null };
}

function canUserApprove(role: string, store_id: string | null, transfer: TransferDetail): boolean {
  if (['observer', 'trainer'].includes(role)) return false;
  if (['completed', 'rejected'].includes(transfer.status)) return false;

  if (['headquarter', 'manager'].includes(role)) return true;

  if (role === 'staff') {
    if (transfer.status === 'pending' && store_id === transfer.from_store_id) return true;
    if (
      transfer.status === 'from_store_approved' &&
      transfer.brand === 'fit365' &&
      store_id === transfer.to_store_id
    )
      return true;
  }

  return false;
}

export function TransferStatusAction({ transfer }: Readonly<Props>) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { role, store_id } = getCurrentUserRole();
  const canApprove = canUserApprove(role, store_id, transfer);

  const isFit365WaitingDest =
    transfer.brand === 'fit365' && transfer.status === 'from_store_approved';
  const approveLabel = isFit365WaitingDest ? '移籍先として承認' : '承認';

  const metaItems = [
    `申請日: ${format(parseISO(transfer.applied_at), 'yyyy/MM/dd HH:mm')}`,
    `最終更新: ${format(parseISO(transfer.updated_at), 'yyyy/MM/dd HH:mm')}`,
    ...(isFit365WaitingDest ? ['移籍先承認待ち'] : []),
  ];

  return (
    <>
      <div className="sticky top-6 flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">ステータス</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <TransferStatusBadge status={transfer.status} />

            <div className="space-y-1">
              {metaItems.map((item) => (
                <p key={item} className="text-muted-foreground text-center text-xs">
                  {item}
                </p>
              ))}
            </div>

            {canApprove && (
              <div className="flex w-full flex-col gap-2">
                <Button size="sm" className="w-full" onClick={() => setApproveOpen(true)}>
                  {approveLabel}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive w-full"
                  onClick={() => setRejectOpen(true)}
                >
                  却下
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TransferApproveDialog open={approveOpen} onOpenChange={setApproveOpen} transfer={transfer} />
      <TransferRejectDialog open={rejectOpen} onOpenChange={setRejectOpen} transfer={transfer} />
    </>
  );
}
