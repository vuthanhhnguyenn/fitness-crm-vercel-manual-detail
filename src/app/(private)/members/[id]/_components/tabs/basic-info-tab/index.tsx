'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { formatDate } from '@/utils/format.util';
import { useQuery } from '@tanstack/react-query';
import { User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { getCrmMembersByMemberIdFamilyMembersOptions } from '@/lib/api/@tanstack/react-query.gen';
import { GetMemberDetailResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import { BRAND_LABELS } from '../../../../_constants/constants';
import { getTenureLabel } from '../../../../_utils';

export function BasicInfoTab({ member }: { member: GetMemberDetailResponse }) {
  const router = useRouter();
  const basic = member?.basic_info;
  const profile = member?.profile;
  const currentMemberId = basic?.id ?? '';
  const { data: familyMembersResponse, isLoading: isLoadingFamilyMembers } = useQuery({
    ...getCrmMembersByMemberIdFamilyMembersOptions({
      path: { member_id: currentMemberId },
    }),
    enabled: Boolean(currentMemberId),
  });

  if (!basic || !profile) {
    return null;
  }

  const currentMemberName = basic.name_kanji;
  const referrerMemberId = profile.referrer_member_id;

  const familyMembers = [
    { id: basic.id, name: basic.name_kanji, isSelf: true },
    ...(familyMembersResponse?.members ?? []).map((familyMember) => ({
      id: familyMember.id,
      name: familyMember.name_kanji,
      isSelf: false,
    })),
  ];
  const remainingFamilySlots =
    familyMembersResponse != null
      ? Math.max(familyMembersResponse.limit - familyMembersResponse.members.length - 1, 0)
      : null;

  return (
    <div className="flex flex-col items-start gap-4 md:flex-row">
      <div className="w-full md:w-[60%]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">入会情報</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">入会日</p>
                  <p className="text-sm font-medium">
                    {profile.joined_at ? formatDate(profile.joined_at) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">入会店舗</p>
                  <p className="text-sm font-medium">{profile.store_name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">ブランド</p>
                  <p className="text-sm font-medium">{BRAND_LABELS[profile.brand] || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">紹介者</p>
                  {referrerMemberId ? (
                    <Button
                      variant="link"
                      className="h-auto p-0 text-sm font-medium"
                      render={
                        <Link
                          href={navigate('/members/[id]', referrerMemberId, {
                            parentMemberId: currentMemberId,
                            parentName: currentMemberName,
                          })}
                        />
                      }
                    >
                      {referrerMemberId}
                    </Button>
                  ) : (
                    <p className="text-muted-foreground text-sm font-medium">—</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <p className="text-muted-foreground mb-1 text-xs">入会キャンペーン</p>
                  <p className="text-sm font-medium">{profile.join_route || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">家族会員</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex flex-col gap-2">
                {familyMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-2">
                    <User className="text-muted-foreground size-4 shrink-0" />
                    {m.isSelf ? (
                      <span className="text-sm font-medium">{m.name}</span>
                    ) : (
                      <Button
                        variant="link"
                        className="h-auto p-0 text-sm font-medium"
                        onClick={() => router.push(navigate('/members/[id]', m.id))}
                      >
                        {m.name}（{m.id}）
                      </Button>
                    )}
                    {m.isSelf && (
                      <Badge
                        variant="outline"
                        className="bg-primary/15 text-primary border-primary/20 text-[10px]"
                      >
                        本人
                      </Badge>
                    )}
                  </div>
                ))}

                <p className="text-muted-foreground mt-2 text-xs">
                  {isLoadingFamilyMembers
                    ? '家族会員情報を読み込み中...'
                    : remainingFamilySlots != null
                      ? `あと${remainingFamilySlots}名追加可能`
                      : '追加可能人数を取得できませんでした'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="w-full md:w-[40%]">
        <div className="sticky top-6 flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">来館情報</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid w-full grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">在籍期間</p>
                  <p className="text-sm font-semibold">{getTenureLabel(profile.joined_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">最終来館日</p>
                  <p className="text-sm font-semibold">—</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">今月来館回数</p>
                  <p className="text-sm font-semibold">—</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 text-xs">累計来館回数</p>
                  <p className="text-sm font-semibold">—</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
