/**
 * MemberHeadupCard
 *
 * The member identity block above the 休会・退会申請 detail: who the operator is looking at,
 * plus a way into the member record.
 *
 * Lives at the members domain root because A-03 (休会・退会申請) and A-01 FR-015
 * (ブラックリスト詳細) both render it — the nearest ancestor both routes share.
 *
 * Every field arrives already display-ready: the card maps nothing and carries no
 * feature vocabulary, so a caller holding enum values (member type, brand) resolves them
 * to Japanese labels first.
 */
import Link from 'next/link';

import { ArrowUpRight } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { navigate } from '@/lib/routes/routes.util';

export interface MemberHeadupCardProps {
  /** Internal record id — used only to build the member-detail link. */
  memberId: string;
  /** Operator-facing member number (the screen's 「ID」), never the record id. */
  memberNumber: string;
  name: string;
  nameKana?: string | null;
  /** The screen's 「旧No」 — present on migrated records only. */
  legacyMemberCode?: string | null;
  /** Japanese label, already resolved by the caller. */
  memberTypeLabel?: string | null;
  contractName?: string | null;
  storeName: string;
  facePhotoUrl?: string | null;
}

export function MemberHeadupCard({
  memberId,
  memberNumber,
  name,
  nameKana,
  legacyMemberCode,
  memberTypeLabel,
  contractName,
  storeName,
  facePhotoUrl,
}: Readonly<MemberHeadupCardProps>) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('');

  return (
    <Card className="mb-4 gap-0 py-0">
      <CardContent className="flex items-center gap-4 px-4 py-4">
        {/* `after:hidden` drops the Avatar root's circular ring, which stays round
            regardless of the square corners here. V0 renders a bare square photo. */}
        <Avatar className="size-24 shrink-0 rounded-lg after:hidden">
          <AvatarImage
            src={facePhotoUrl ?? undefined}
            alt={name}
            className="rounded-lg object-cover"
          />
          <AvatarFallback className="rounded-lg text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-base leading-tight font-bold">{name}</h2>
          {nameKana && <p className="text-muted-foreground text-xs leading-tight">{nameKana}</p>}

          <p className="text-muted-foreground font-mono text-xs leading-tight">
            ID: {memberNumber}
            {legacyMemberCode && <span className="ml-2">旧No: {legacyMemberCode}</span>}
            <span className="ml-2 font-sans">所属: {storeName}</span>
          </p>

          {(memberTypeLabel ?? contractName) && (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              {memberTypeLabel && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {memberTypeLabel}
                </Badge>
              )}
              {contractName && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  主契約: {contractName}
                </Badge>
              )}
            </div>
          )}
        </div>

        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1"
          render={<Link href={navigate('/members/[id]', memberId)} />}
        >
          会員詳細を開く
          <ArrowUpRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
