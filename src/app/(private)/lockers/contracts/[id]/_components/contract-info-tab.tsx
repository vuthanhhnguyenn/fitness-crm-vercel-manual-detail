'use client';

import { useRouter } from 'next/navigation';

import { LockerPasswordEditor } from '@/app/(private)/lockers/_components/locker-password-editor';
import { formatDateYYYYMMDD } from '@/utils/date.util';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

import { Field } from '@/components/common/field';
import { StatusCard } from '@/components/common/status-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  getCrmLockersByIdQueryKey,
  getCrmLockersContractsByIdQueryKey,
  patchCrmLockersByIdSlotsBySlotIdMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import type {
  GetCrmLockersContractsByIdResponse,
  PatchCrmLockersByIdSlotsBySlotIdData,
} from '@/lib/api/types.gen';
import { LockerContractStatus } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { LOCKER_OPTION_TYPE_LABELS } from '../../../_constants/constants';
import { LOCKER_CONTRACT_STATUS_CARD_MAP } from '../_constants/locker-contract-status.constants';

type LockerContractDetail = NonNullable<GetCrmLockersContractsByIdResponse>['contract'];

interface ContractInfoTabProps {
  contract: LockerContractDetail;
}

export function ContractInfoTab({ contract }: ContractInfoTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const displayTerminationDate = contract.termination_date
    ? formatDateYYYYMMDD(contract.termination_date)
    : undefined;
  const statusCardConfig = LOCKER_CONTRACT_STATUS_CARD_MAP[contract.status];
  const slotId = `slot-${contract.locker_id}-${contract.locker_number}`;
  const updatePasswordMutation = useMutation({
    ...patchCrmLockersByIdSlotsBySlotIdMutation(),
    onSuccess: () => {
      toast.success('パスワードを更新しました');
      queryClient.invalidateQueries({
        queryKey: getCrmLockersContractsByIdQueryKey({ path: { id: contract.id } }),
      });
      queryClient.invalidateQueries({
        queryKey: getCrmLockersByIdQueryKey({ path: { id: contract.locker_id } }),
      });
    },
    onError: () => {
      toast.error('パスワードの更新に失敗しました');
    },
  });

  return (
    <div className="flex gap-4">
      <div className="flex w-[60%] flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">契約基本情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="契約ID" value={contract.contract_id} mono />
              <Field
                label="オプション契約"
                value={
                  <Badge variant="secondary" className="text-xs font-normal">
                    {contract.option_contract_name ||
                      LOCKER_OPTION_TYPE_LABELS[contract.contract_type]}
                  </Badge>
                }
              />
              <Field label="契約開始日" value={formatDateYYYYMMDD(contract.start_date)} />
              <Field label="契約終了日" value={formatDateYYYYMMDD(contract.end_date)} />
              <div>
                <p className="text-muted-foreground mb-1 text-xs">解約日</p>
                {displayTerminationDate ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm">{displayTerminationDate}</p>
                    <p className="text-muted-foreground text-[11px]">
                      解約日経過後、自動的に「開放待ち」状態へ遷移します
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">—（未解約）</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">契約者情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="会員ID" value={contract.member_id} mono />
              <Field label="氏名" value={contract.member_name} />
              <Field label="電話番号" value={contract.member_phone} />
              <Field label="メール" value={contract.member_email} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">ロッカー情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="ロッカーID" value={contract.locker_display_id} mono />
              <Field label="スロット番号" value={contract.locker_number} />
              <Field label="サイズ" value={contract.slot_size} />
              <Field label="エリア" value={contract.locker_area} />
            </div>
            <div className="mt-4 border-t pt-4">
              <Button
                variant="link"
                size="sm"
                className="h-auto gap-1 p-0 text-xs"
                onClick={() => router.push(navigate('/lockers/[id]', contract.locker_id))}
              >
                <ExternalLink className="size-3" />
                ロッカー詳細を見る
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">パスワード情報</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <LockerPasswordEditor
              currentPassword={contract.password}
              updatedAt={contract.password_updated_at}
              isSaving={updatePasswordMutation.isPending}
              onSave={(password) =>
                new Promise<void>((resolve, reject) => {
                  updatePasswordMutation.mutate(
                    {
                      path: { id: contract.locker_id, slotId },
                      body: {
                        password,
                      } satisfies NonNullable<PatchCrmLockersByIdSlotsBySlotIdData['body']>,
                    },
                    {
                      onSuccess: () => resolve(),
                      onError: (error) => reject(error),
                    },
                  );
                })
              }
            />
          </CardContent>
        </Card>
      </div>

      <div className="w-[40%]">
        <div className="sticky top-0 flex flex-col gap-4">
          <StatusCard
            tone={statusCardConfig.tone}
            icon={statusCardConfig.icon}
            label={statusCardConfig.label}
            meta={
              contract.status === LockerContractStatus.IN_USE
                ? `契約期間: ${formatDateYYYYMMDD(contract.start_date)} 〜 ${formatDateYYYYMMDD(contract.end_date)}`
                : [
                    displayTerminationDate ? `解約日: ${displayTerminationDate}` : undefined,
                    contract.status === LockerContractStatus.PENDING_RELEASE
                      ? '解約日経過後、自動的に「開放待ち」へ遷移します'
                      : '解約処理が完了しました',
                  ].filter((item): item is string => Boolean(item))
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">その他情報</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex flex-col gap-4">
                <Field label="作成日時" value={formatDateYYYYMMDD(contract.created_at)} />
                <Field label="更新日時" value={formatDateYYYYMMDD(contract.updated_at)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
