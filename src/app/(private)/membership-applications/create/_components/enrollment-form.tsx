'use client';
// Holds local UI/dialog state and mutation calls — client-only.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, useFormState, useWatch } from 'react-hook-form';

import { useRouter } from 'next/navigation';

import { calcAge, isBelowMinAge } from '@/utils/age.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';

import type { BlacklistCheckState } from '@/lib/api';
import {
  getCrmMembershipApplicationsEnrollmentFeeMastersOptions,
  getCrmStoresOptions,
  postCrmMembershipApplicationsBlacklistCheckMutation,
  postCrmMembershipApplicationsDirectMutation,
} from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import {
  type DirectEnrollmentFormValues,
  type EnrollmentFeeMaster,
  directEnrollmentSchema,
} from '../_schemas/enrollment-form.schema';
import { ApplicantInfoSection } from './applicant-info-section';
import { BlacklistResultSection } from './blacklist-result-section';
import { ContractInfoSection, PLAN_OPTIONS } from './contract-info-section';
import { EnrollmentRouteSection } from './enrollment-route-section';
import { FeeSection } from './fee-section';
import { ProxyRecordSection } from './proxy-record-section';

interface EnrollmentFormProps {
  readonly prefillFamilyName?: string;
  readonly prefillGivenName?: string;
  readonly prefillFamilyNameKana?: string;
  readonly prefillGivenNameKana?: string;
  readonly prefillBirthDate?: string;
  readonly prefillPhone?: string;
  readonly prefillEmail?: string;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'クレジットカード（SBPS）',
  bank_transfer: '口座振替（JACCS）',
};

export function EnrollmentForm(props: Readonly<EnrollmentFormProps>) {
  const router = useRouter();
  const isPrefilled = Boolean(
    props.prefillFamilyName ||
    props.prefillGivenName ||
    props.prefillFamilyNameKana ||
    props.prefillGivenNameKana ||
    props.prefillBirthDate ||
    props.prefillPhone ||
    props.prefillEmail,
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [blCheckResult, setBlCheckResult] = useState<BlacklistCheckState>('not_checked');

  const form = useForm<DirectEnrollmentFormValues>({
    resolver: zodResolver(directEnrollmentSchema),
    defaultValues: {
      applicant: {
        family_name: props.prefillFamilyName ?? '',
        given_name: props.prefillGivenName ?? '',
        family_name_kana: props.prefillFamilyNameKana ?? '',
        given_name_kana: props.prefillGivenNameKana ?? '',
        birth_date: props.prefillBirthDate ?? '',
        gender: undefined,
        phone: props.prefillPhone ?? '',
        email: props.prefillEmail ?? '',
        address: '',
        face_photo_id: '',
      },
      contract: {
        brand_id: undefined,
        store_id: '',
        plan_id: '',
        usage_start_date: '',
        payment_method: undefined,
        campaign_id: null,
        enrollment_fee_master_id: null,
      },
      consent: {
        agreement_datetime: '',
        parental_consent: false,
      },
    },
    mode: 'onChange',
  });

  const handleUploadingChange = useCallback((uploading: boolean) => {
    setUploadCount((prev) => (uploading ? prev + 1 : Math.max(0, prev - 1)));
  }, []);

  const brand = useWatch({ control: form.control, name: 'contract.brand_id' });
  const storeId = useWatch({ control: form.control, name: 'contract.store_id' });
  const planId = useWatch({ control: form.control, name: 'contract.plan_id' });
  const paymentMethod = useWatch({ control: form.control, name: 'contract.payment_method' });
  const birthDate = useWatch({ control: form.control, name: 'applicant.birth_date' });
  const agreementDatetime = useWatch({ control: form.control, name: 'consent.agreement_datetime' });
  const parentalConsent = useWatch({ control: form.control, name: 'consent.parental_consent' });

  // Cross-field errors (age vs brand, parental consent) must be re-validated
  // whenever brand or birth date changes, or they silently vanish (RHF onChange
  // mode + zodResolver only re-runs the field that changed by default).
  useEffect(() => {
    if (brand || birthDate) {
      void form.trigger(['applicant.birth_date', 'consent.parental_consent']);
    }
  }, [brand, birthDate, form]);

  const handleBrandChange = useCallback(() => {
    form.resetField('contract.plan_id');
    form.resetField('contract.enrollment_fee_master_id');
  }, [form]);

  const { data: storesData } = useQuery(getCrmStoresOptions());
  const storeLabel = storesData?.stores?.find((s) => s.id === storeId)?.name ?? storeId;
  const planLabel = PLAN_OPTIONS.find((p) => p.value === planId)?.label ?? planId;

  const { data: feeMastersData } = useQuery({
    ...getCrmMembershipApplicationsEnrollmentFeeMastersOptions({
      query: { brand_id: brand || undefined },
    }),
    enabled: brand === 'JOYFIT',
  });
  const feeMasters: EnrollmentFeeMaster[] = feeMastersData?.masters ?? [];

  const applicantFields = useWatch({
    control: form.control,
    name: [
      'applicant.family_name',
      'applicant.given_name',
      'applicant.family_name_kana',
      'applicant.given_name_kana',
      'applicant.birth_date',
      'applicant.phone',
      'applicant.email',
      'applicant.address',
    ],
  });
  const [familyName, givenName, familyNameKana, givenNameKana, dob, phone, email, address] =
    applicantFields;
  const allApplicantFieldsFilled = Boolean(
    familyName && givenName && familyNameKana && givenNameKana && dob && phone && email,
  );

  const { errors: applicantErrors } = useFormState({
    control: form.control,
    name: [
      'applicant.family_name',
      'applicant.given_name',
      'applicant.family_name_kana',
      'applicant.given_name_kana',
      'applicant.birth_date',
      'applicant.phone',
      'applicant.email',
      'applicant.address',
    ],
  });
  const hasInvalidApplicantField = Boolean(
    applicantErrors.applicant?.family_name ||
    applicantErrors.applicant?.given_name ||
    applicantErrors.applicant?.family_name_kana ||
    applicantErrors.applicant?.given_name_kana ||
    applicantErrors.applicant?.birth_date ||
    applicantErrors.applicant?.phone ||
    applicantErrors.applicant?.email ||
    applicantErrors.applicant?.address,
  );
  const applicantReadyForBlacklistCheck = allApplicantFieldsFilled && !hasInvalidApplicantField;

  const { mutate: checkBlacklist } = useMutation({
    ...postCrmMembershipApplicationsBlacklistCheckMutation(),
    onSuccess: (data) => setBlCheckResult(data.state),
    onError: () => setBlCheckResult('not_checked'),
  });
  const blState: BlacklistCheckState = applicantReadyForBlacklistCheck
    ? blCheckResult
    : 'not_checked';

  useEffect(() => {
    if (!applicantReadyForBlacklistCheck) return;
    const timer = setTimeout(() => {
      checkBlacklist({
        body: {
          family_name: familyName,
          given_name: givenName,
          family_name_kana: familyNameKana,
          given_name_kana: givenNameKana,
          birth_date: dob,
          phone,
          email,
          address: address || undefined,
        },
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [
    applicantReadyForBlacklistCheck,
    familyName,
    givenName,
    familyNameKana,
    givenNameKana,
    dob,
    phone,
    email,
    address,
    checkBlacklist,
  ]);

  // Guards against duplicate registrations from clicks that land faster than a
  // React re-render can disable the button — isPending alone lags one commit.
  const isSubmittingRef = useRef(false);
  const submitMutation = useMutation({
    ...postCrmMembershipApplicationsDirectMutation(),
    onSuccess: () => {
      setCompleteOpen(true);
    },
    onError: () => {
      toast.error('申請の登録に失敗しました');
    },
    onSettled: () => {
      isSubmittingRef.current = false;
    },
  });

  async function handlePrimaryClick() {
    const valid = await form.trigger();
    if (!valid) return;
    setConfirmOpen(true);
  }

  function handleConfirmSubmit() {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setConfirmOpen(false);
    submitMutation.mutate({ body: form.getValues() });
  }

  function handleComplete() {
    setCompleteOpen(false);
    toast.success('入会申請を登録しました（未審査）');
    router.push(navigate('/membership-applications'));
  }

  const age = birthDate ? calcAge(birthDate) : null;
  const belowMin = age !== null && brand ? isBelowMinAge(age, brand) : false;
  const isMinor = age !== null && !belowMin && age < 18;
  const isSubmitDisabled = belowMin || (isMinor && !parentalConsent) || !agreementDatetime;

  return (
    <>
      <Form {...form}>
        <form
          noValidate
          onSubmit={(e) => e.preventDefault()}
          className="mx-auto flex max-w-240 flex-col gap-6"
        >
          <EnrollmentRouteSection />
          <ApplicantInfoSection
            control={form.control}
            onUploadingChange={handleUploadingChange}
            isPrefilled={isPrefilled}
          />
          <ContractInfoSection control={form.control} onBrandChange={handleBrandChange} />
          <ProxyRecordSection control={form.control} />
          <BlacklistResultSection state={blState} />
          <FeeSection control={form.control} feeMasters={feeMasters} />
          <div className="flex items-center justify-end gap-2 border-t p-4">
            <Button
              variant="outline"
              size="lg"
              type="button"
              onClick={() => router.push(navigate('/membership-applications'))}
            >
              キャンセル
            </Button>
            <Button
              size="lg"
              type="button"
              disabled={uploadCount > 0 || isSubmitDisabled}
              onClick={handlePrimaryClick}
            >
              入会登録
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>入会申請の内容を確認</AlertDialogTitle>
            <AlertDialogDescription>
              下記の内容で入会申請を登録します。申請は「未審査」として入会申請一覧に追加され、審査・承認後に会員レコードが生成されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">入会経路</span>
              <span className="font-medium">手動</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ブランド</span>
              <span>{brand || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">入会店舗</span>
              <span>{storeId ? storeLabel : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">プラン</span>
              <span>{planId ? planLabel : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">決済方法</span>
              <span>{paymentMethod ? PAYMENT_METHOD_LABELS[paymentMethod] : '—'}</span>
            </div>
            {age !== null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">年齢</span>
                <span>
                  {age}歳
                  {isMinor && parentalConsent && (
                    <span className="text-success ml-2 text-xs">保護者同意確認済み</span>
                  )}
                </span>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitMutation.isPending}>戻る</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit} disabled={submitMutation.isPending}>
              申請を登録
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>入会申請を登録しました</AlertDialogTitle>
            <AlertDialogDescription>
              申請を「未審査」として入会申請一覧に追加しました。審査・承認後に会員レコードが生成されます。入会申請一覧に戻ります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleComplete}>完了</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
export type { DirectEnrollmentFormValues } from '../_schemas/enrollment-form.schema';
