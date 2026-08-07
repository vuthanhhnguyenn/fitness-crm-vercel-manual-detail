'use client';

import { Check } from 'lucide-react';

const STEPS = [
  { id: 1, label: '基本情報', description: '契約の基本設定' },
  { id: 2, label: '料金・条件', description: '料金体系と利用条件' },
  { id: 3, label: '確認', description: '入力内容の確認' },
];

interface StepperProps {
  currentStep: number;
}

export function Stepper({ currentStep }: Readonly<StepperProps>) {
  return (
    <div className="flex items-center justify-center gap-2">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex size-8 items-center justify-center rounded-full text-sm font-medium ${
                step.id <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step.id < currentStep ? <Check className="size-4" /> : step.id}
            </div>
            <div className="flex flex-col">
              <span
                className={`text-sm font-medium ${
                  step.id === currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
          {index < STEPS.length - 1 && (
            <div className={`h-px w-12 ${step.id < currentStep ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  );
}
