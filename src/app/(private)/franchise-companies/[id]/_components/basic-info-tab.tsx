import { formatDateYYYYMMDD, formatDateYYYYMMDD_HHMM } from '@/utils/date.util';
import { Building2 } from 'lucide-react';

import { Field } from '@/components/common/field';
import { StatusCard } from '@/components/common/status-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmFranchiseCompaniesByIdResponse } from '@/lib/api/types.gen';
import { FranchiseCompanyStatus } from '@/lib/api/types.gen';

import {
  FRANCHISE_COMPANY_BASIC_INFO_LABELS,
  FRANCHISE_COMPANY_STATUS_DISPLAY_LABELS,
} from '../_constants/detail.constants';

interface BasicInfoTabProps {
  franchiseCompany: GetCrmFranchiseCompaniesByIdResponse['franchise_company'];
  linkedStoreCount: number;
}

function formatValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'はい' : 'いいえ';
  return String(value);
}

function SummaryCard({
  status,
  statusLabel,
  linkedStoreCount,
  createdAt,
  updatedAt,
}: {
  status: FranchiseCompanyStatus;
  statusLabel: string;
  linkedStoreCount: number;
  createdAt: string | null | undefined;
  updatedAt: string | null | undefined;
}) {
  return (
    <StatusCard
      tone={status === FranchiseCompanyStatus.ACTIVE ? 'success' : 'muted'}
      icon={Building2}
      label={statusLabel}
      meta={[
        `管轄店舗数: ${linkedStoreCount}店舗`,
        `作成日: ${formatDateYYYYMMDD_HHMM(createdAt)}`,
        `更新日: ${formatDateYYYYMMDD_HHMM(updatedAt)}`,
      ]}
    />
  );
}

export function BasicInfoTab({ franchiseCompany, linkedStoreCount }: Readonly<BasicInfoTabProps>) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-[60%]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">法人基本情報</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              <Field
                label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.id}
                value={franchiseCompany.id}
                mono
              />
              <Field
                label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.corporate_number}
                value={formatValue(franchiseCompany.corporate_number)}
              />
              <Field
                label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.formal_name}
                value={formatValue(franchiseCompany.formal_name)}
              />
              <Field
                label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.display_name}
                value={formatValue(franchiseCompany.display_name)}
              />
              <Field
                label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.representative_name}
                value={formatValue(franchiseCompany.representative_name)}
              />
              <Field
                label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.phone}
                value={formatValue(franchiseCompany.phone)}
              />
              <div className="md:col-span-2">
                <Field
                  label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.head_office_address}
                  value={formatValue(franchiseCompany.head_office_address)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">担当者情報</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              <Field
                label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.contact_person}
                value={formatValue(franchiseCompany.contact_person)}
              />
              <Field
                label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.contact_phone}
                value={formatValue(franchiseCompany.contact_phone)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="text-base font-semibold">契約情報</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
              <Field
                label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.fc_contract_start_date}
                value={formatDateYYYYMMDD(franchiseCompany.fc_contract_start_date)}
              />
              <Field
                label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.fc_contract_renewal_date}
                value={formatDateYYYYMMDD(franchiseCompany.fc_contract_renewal_date)}
              />
              <Field
                label={FRANCHISE_COMPANY_BASIC_INFO_LABELS.royalty_rate}
                value={
                  franchiseCompany.royalty_rate === null ||
                  franchiseCompany.royalty_rate === undefined
                    ? '—'
                    : `${franchiseCompany.royalty_rate}%`
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full lg:w-[40%]">
        <div className="lg:sticky lg:top-0">
          <SummaryCard
            status={franchiseCompany.status}
            statusLabel={FRANCHISE_COMPANY_STATUS_DISPLAY_LABELS[franchiseCompany.status]}
            linkedStoreCount={linkedStoreCount}
            createdAt={franchiseCompany.created_at}
            updatedAt={franchiseCompany.updated_at}
          />
        </div>
      </div>
    </div>
  );
}
