'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { AlertTriangle } from 'lucide-react';

import { useScrollToFirstError } from '@/hooks/use-scroll-to-first-error';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import type {
  ContractFormSubmitValues,
  ContractFormValues,
} from '../_schemas/contract-form.schema';
import { ContractFormBasicInfo } from './contract-form-basic-info';
import { ContractFormConfirmation } from './contract-form-confirmation';
import { ContractFormPricingConditions } from './contract-form-pricing-conditions';
import { Stepper } from './contract-form-stepper';

interface ContractFormProps {
  isEdit?: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  onSubmit: (values: ContractFormSubmitValues) => void;
}

export function ContractForm({
  isEdit = false,
  isSubmitting = false,
  onCancel,
  onSubmit,
}: Readonly<ContractFormProps>) {
  const [currentStep, setCurrentStep] = useState(1);
  const form = useFormContext<ContractFormValues>();
  const scrollToFirstError = useScrollToFirstError();

  const handleNext = async () => {
    let fieldsToValidate: (keyof ContractFormValues)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'code', 'contract_type', 'brand'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['price_including_tax', 'tax_rate', 'accounting_code', 'start_date'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setCurrentStep((s) => s + 1);
    else scrollToFirstError();
  };

  return (
    <div className="flex flex-col gap-6">
      {isEdit && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="text-warning size-4" />
          <AlertDescription className="text-muted-foreground text-xs">
            料金や条件を変更すると、現在この契約プランに加入中の会員にも反映されます。
          </AlertDescription>
        </Alert>
      )}

      <Stepper currentStep={currentStep} />

      {currentStep === 1 && <ContractFormBasicInfo />}
      {currentStep === 2 && <ContractFormPricingConditions />}
      {currentStep === 3 && <ContractFormConfirmation />}

      <div className="flex items-center justify-between border-t p-4">
        <Button size="lg" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          キャンセル
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            variant="outline"
            disabled={currentStep === 1 || isSubmitting}
            onClick={() => setCurrentStep((s) => s - 1)}
          >
            前のステップ
          </Button>
          {currentStep < 3 ? (
            <Button size="lg" onClick={handleNext} disabled={isSubmitting}>
              次のステップ
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={form.handleSubmit(onSubmit as (values: ContractFormValues) => void)}
              disabled={isSubmitting}
            >
              {isEdit ? '更新する' : '登録する'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
