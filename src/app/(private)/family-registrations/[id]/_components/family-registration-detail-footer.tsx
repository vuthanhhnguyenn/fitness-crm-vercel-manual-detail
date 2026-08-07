'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

import type { GetCrmFamilyRegistrationsByIdResponse } from '@/lib/api/types.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  ApproveFamilyRegistrationModal,
  type SelectType,
} from '../../_components/approve-family-registration-modal';
import { RejectFamilyRegistrationModal } from '../../_components/reject-family-registration-modal';

export function FamilyRegistrationDetailFooter({
  registration,
}: Readonly<{ registration: GetCrmFamilyRegistrationsByIdResponse['registration'] }>) {
  const [target] = useState(() => registration);

  const [approveModalState, setApproveModalState] = useState<{
    status: boolean;
    type?: SelectType;
  }>({
    status: false,
    type: undefined,
  });
  const [rejectModalState, setRejectModalState] = useState<{ status: boolean; type?: SelectType }>({
    status: false,
    type: undefined,
  });

  const router = useRouter();

  const canReview = ['pending_review'].includes(registration.status);

  if (!canReview) return null;

  return (
    <>
      <ApproveFamilyRegistrationModal
        modalState={approveModalState}
        setModalState={setApproveModalState}
        registration={target}
        selectedIDs={[]}
        onOpenChange={(open) => setApproveModalState({ status: open, type: 'single' })}
        onSuccess={() => {
          setApproveModalState({ status: false, type: 'single' });
          router.push(navigate('/family-registrations'));
        }}
      />
      <RejectFamilyRegistrationModal
        modalState={rejectModalState}
        setModalState={setRejectModalState}
        registration={target}
        selectedIDs={[]}
        onOpenChange={(open) => setRejectModalState({ status: open, type: 'single' })}
        onSuccess={() => {
          setRejectModalState({ status: false, type: 'single' });
          router.push(navigate('/family-registrations'));
        }}
      />

      <div className="bg-background fixed right-0 bottom-0 left-0 border-t">
        <div className="mx-auto flex items-center justify-end gap-2 p-3">
          <Button
            variant="destructive"
            onClick={() => setRejectModalState({ status: true, type: 'single' })}
          >
            却下
          </Button>
          <Button onClick={() => setApproveModalState({ status: true, type: 'single' })}>
            承認
          </Button>
        </div>
      </div>
    </>
  );
}
