'use client';

import { useRouter } from 'next/navigation';

import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { navigate } from '@/lib/routes/routes.util';

interface ResponseDetailHeaderActionsProps {
  memberId: string;
  surveyId: string;
}

export function ResponseDetailHeaderActions({
  memberId,
  surveyId,
}: ResponseDetailHeaderActionsProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => router.push(navigate('/members/[id]', memberId))}
      >
        <ExternalLink className="size-4" />
        この会員の詳細を見る
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={() => router.push(navigate('/surveys/[id]', surveyId))}
      >
        <ExternalLink className="size-4" />
        アンケート詳細を見る
      </Button>
    </div>
  );
}
