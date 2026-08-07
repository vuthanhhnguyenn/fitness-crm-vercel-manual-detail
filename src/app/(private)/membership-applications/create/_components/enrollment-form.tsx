'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { calcAge, isMinor } from '@/utils/age.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import {
  getCrmMembershipApplicationsEnrollmentFeeMastersOptions,
  postCrmMembershipApplicationsBlacklistCheckMutation,
  postCrmMembershipApplicationsDirectMutation,
} from '@/lib/api/@tanstack/react-query.gen';

import {
  type DirectEnrollmentFormValues,
  type EnrollmentFeeMaster,
  directEnrollmentSchema,
} from '../_schemas/enrollment-form.schema';
import { ApplicantInfoSection } from './applicant-info-section';
import { ApplicationTypeSection } from './application-type-section';
import { BlacklistResultSection } from './blacklist-result-section';
import { ContractInfoSection } from './contract-info-section';
import { CorporateInfoSection } from './corporate-info-section';
import { EmployeeDiscountSection } from './employee-discount-section';
import { FeeSection } from './fee-section';
import { MinorConsentDialog } from './minor-consent-dialog';
import { ProxyRecordSection } from './proxy-record-section';

// ─── Component ───────────────────────────────────────────────────────────────

export function EnrollmentForm() {
  const router = useRouter();
  const [blResult, setBlResult] = useState<'no-match' | 'match' | null>(null);
  const [minorDialogOpen, setMinorDialogOpen] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [pendingSubmitData, setPendingSubmitData] = useState<DirectEnrollmentFormValues | null>(
    null,
  );

  const form = useForm<DirectEnrollmentFormValues>({
    resolver: zodResolver(directEnrollmentSchema),
    defaultValues: {
      application_type: undefined,
      applicant: {
        last_name_kanji: '',
        first_name_kanji: '',
        last_name_kana: '',
        first_name_kana: '',
        date_of_birth: '',
        gender: undefined,
        phone: '',
        email: '',
        address: '',
        face_photo_url: '',
      },
      contract: {
        brand: undefined,
        store_id: '',
        plan_id: '',
        start_date: '',
        campaign_id: '',
        payment_method: undefined,
      },
      fees: {},
    },
    mode: 'onBlur',
  });

  const applicationType = useWatch({ control: form.control, name: 'application_type' });
  const brand = useWatch({ control: form.control, name: 'contract.brand' });

  const applicantFields = useWatch({
    control: form.control,
    name: [
      'applicant.last_name_kanji',
      'applicant.first_name_kanji',
      'applicant.last_name_kana',
      'applicant.first_name_kana',
      'applicant.date_of_birth',
      'applicant.gender',
      'applicant.phone',
      'applicant.email',
    ],
  });

  // Fee masters
  const { data: feeMastersData } = useQuery(
    getCrmMembershipApplicationsEnrollmentFeeMastersOptions({
      query: { brand: brand ?? undefined, applicationType: applicationType ?? undefined },
    }),
  );
  const feeMasters: EnrollmentFeeMaster[] = (feeMastersData?.items ?? []) as EnrollmentFeeMaster[];

  // BL check mutation
  const { mutate: checkBl } = useMutation({
    ...postCrmMembershipApplicationsBlacklistCheckMutation(),
    onSuccess: (data) => {
      setBlResult(data.matched ? 'match' : 'no-match');
    },
    onError: () => {
      setBlResult(null);
    },
  });

  const [lnk, fnk, lnKana, fnKana, dob, gender, phone, email] = applicantFields;
  const allApplicantFieldsFilled = Boolean(lnk && fnk && dob && gender && phone && email);
  const blState: 'unchecked' | 'no-match' | 'match' = allApplicantFieldsFilled
    ? (blResult ?? 'unchecked')
    : 'unchecked';

  // Debounced BL check
  const blTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!allApplicantFieldsFilled) return;
    if (blTimerRef.current) clearTimeout(blTimerRef.current);
    blTimerRef.current = setTimeout(() => {
      checkBl({
        body: {
          last_name_kanji: lnk,
          first_name_kanji: fnk,
          last_name_kana: lnKana ?? '',
          first_name_kana: fnKana ?? '',
          date_of_birth: dob,
          gender: gender,
          phone,
          email,
        },
      });
    }, 500);
    return () => {
      if (blTimerRef.current) clearTimeout(blTimerRef.current);
    };
  }, [allApplicantFieldsFilled, lnk, fnk, lnKana, fnKana, dob, gender, phone, email, checkBl]);

  // Submit mutation
  const { mutate: submitDirect } = useMutation({
    ...postCrmMembershipApplicationsDirectMutation(),
    onSuccess: () => {
      toast.success('入会申請を登録しました');
      router.push('/membership-applications');
    },
    onError: () => {
      toast.error('申請の登録に失敗しました');
    },
  });

  const callSubmitMutation = useCallback(
    (data: DirectEnrollmentFormValues) => {
      submitDirect({ body: data });
    },
    [submitDirect],
  );

  const handleFormSubmit = useCallback(
    (data: DirectEnrollmentFormValues) => {
      const dob = data.applicant.date_of_birth;
      const age = calcAge(dob);
      if (isMinor(age)) {
        setPendingSubmitData(data);
        setMinorDialogOpen(true);
        return;
      }
      callSubmitMutation(data);
    },
    [callSubmitMutation],
  );

  const onSubmit = form.handleSubmit(handleFormSubmit);

  const handleUploadingChange = useCallback((uploading: boolean) => {
    setUploadCount((prev) => (uploading ? prev + 1 : Math.max(0, prev - 1)));
  }, []);

  const handleBrandChange = useCallback(() => {
    form.resetField('contract.plan_id');
    form.resetField('fees');
  }, [form]);

  return (
    <>
      <Form {...form}>
        <form noValidate onSubmit={onSubmit} className="mx-auto flex max-w-240 flex-col gap-6">
          <ApplicationTypeSection control={form.control} />
          <ApplicantInfoSection control={form.control} onUploadingChange={handleUploadingChange} />
          <ContractInfoSection control={form.control} onBrandChange={handleBrandChange} />
          {applicationType === 'corporate' && (
            <CorporateInfoSection control={form.control} brand={brand ?? ''} />
          )}
          {applicationType === 'employee_discount' && (
            <EmployeeDiscountSection
              control={form.control}
              onUploadingChange={handleUploadingChange}
            />
          )}
          <ProxyRecordSection />
          <BlacklistResultSection state={blState} />
          <FeeSection
            control={form.control}
            setValue={form.setValue}
            brand={brand ?? ''}
            applicationType={applicationType ?? ''}
            feeMasters={feeMasters}
          />
          <div className="flex items-center justify-end gap-2 border-t p-4">
            <Button
              variant="outline"
              size="lg"
              type="button"
              onClick={() => router.push('/membership-applications')}
            >
              キャンセル
            </Button>
            <Button size="lg" type="submit" disabled={uploadCount > 0}>
              入会登録
            </Button>
          </div>
        </form>
      </Form>
      <MinorConsentDialog
        open={minorDialogOpen}
        onConfirm={() => {
          setMinorDialogOpen(false);
          if (pendingSubmitData) {
            callSubmitMutation(pendingSubmitData);
            setPendingSubmitData(null);
          }
        }}
        onCancel={() => {
          setMinorDialogOpen(false);
          setPendingSubmitData(null);
        }}
      />
    </>
  );
}
export type { DirectEnrollmentFormValues } from '../_schemas/enrollment-form.schema';
