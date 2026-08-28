import type { ReactNode } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface MemberHeadupCardProps {
  /** The member identifier as displayed (会員番号 on the member screens). */
  memberId: string;
  /** 旧会員番号. Renders an em dash when the member has none. */
  oldMemberNo?: string | null;
  name: string;
  nameKana?: string | null;
  /** 会員種別 (display label). */
  memberType?: string | null;
  /** 主契約名. */
  contractName?: string | null;
  /** 顔写真 URL. Falls back to the initials when absent. */
  facePhotoUrl?: string | null;
  /** Avatar initials. Derived from `name` when omitted. */
  avatarFallback?: string;
  /**
   * 会員ステータス badge, passed in as a slot rather than derived here: the status vocabulary,
   * colors and dot rule live in the members route's constants, and `components/common` does not
   * import from `app/`.
   */
  statusBadge?: ReactNode;
  /**
   * Optional content rendered at the right edge of the identity row — for a transfer, the origin
   * store label + name; other screens could pass a button or link instead. A plain node (not a
   * `storeName: string`) since what belongs there varies by screen.
   */
  asideContent?: ReactNode;
  /** Extra content appended below the identity row, separated by a rule (e.g. a summary strip). */
  children?: ReactNode;
  className?: string;
}

/**
 * Member identity head-up card: avatar, name + status, kana, IDs and the 会員種別 / 主契約 badges.
 *
 * Shared by the member detail screen and screens that are *about* a member without being it (e.g.
 * a transfer request), so "who is this?" reads identically everywhere. Screen-specific extras stay
 * out of here: the member detail screen's current-status strip is passed in as `children`, and its
 * status badge as `statusBadge`.
 */
export function MemberHeadupCard({
  memberId,
  oldMemberNo,
  name,
  nameKana,
  memberType,
  contractName,
  facePhotoUrl,
  avatarFallback,
  statusBadge,
  asideContent,
  children,
  className,
}: Readonly<MemberHeadupCardProps>) {
  // 山田 太郎 → 山太. Matches the member detail screen's lastName[0] + firstName[0] derivation,
  // since the name it passes is those two joined by a space.
  const initials =
    avatarFallback ??
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('');

  return (
    <Card className={className ? `gap-0 py-0 ${className}` : 'gap-0 py-0'}>
      <CardContent className="flex flex-col gap-4 px-4 py-4">
        <div className="flex items-center gap-4">
          <Avatar className="size-24 shrink-0 rounded-lg after:rounded-lg">
            <AvatarImage
              src={facePhotoUrl ?? undefined}
              alt={name}
              className="rounded-lg object-cover"
            />
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-bold">{name}</p>
              {statusBadge}
            </div>
            {nameKana && <p className="text-muted-foreground mt-1 text-xs">{nameKana}</p>}
            <div className="text-muted-foreground mt-1 font-mono text-xs">
              ID: {memberId} / 旧No: {oldMemberNo ?? '—'}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {memberType && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  {memberType}
                </Badge>
              )}
              {contractName && (
                <Badge variant="outline" className="text-[10px] font-normal">
                  主契約: {contractName}
                </Badge>
              )}
            </div>
          </div>
          {asideContent && <div className="shrink-0">{asideContent}</div>}
        </div>

        {children && (
          <>
            <Separator />
            {children}
          </>
        )}
      </CardContent>
    </Card>
  );
}
