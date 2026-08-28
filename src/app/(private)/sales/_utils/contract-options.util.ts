import type {
  GetCrmMembersByIdContractsMainContractResponse,
  GetCrmMembersByIdContractsOptionContractsResponse,
} from '@/lib/api';

export interface ContractOption {
  id: string;
  label: string;
  amount: number;
  taxRate: number;
}

/**
 * Mirrors the server's `billingRecords.getMemberContractOptions` derivation exactly — both read
 * from the same member main-contract/option-contracts data so contract_id stays resolvable.
 */
export function buildContractOptions(
  mainContract: GetCrmMembersByIdContractsMainContractResponse | undefined,
  optionContracts: GetCrmMembersByIdContractsOptionContractsResponse | undefined,
): ContractOption[] {
  const options: ContractOption[] = [];
  if (mainContract) {
    options.push({
      id: 'main',
      label: `主契約：${mainContract.planName}`,
      amount: mainContract.monthlyFee,
      taxRate: 0.1,
    });
  }
  for (const option of optionContracts ?? []) {
    options.push({
      id: option.id,
      label: `オプション：${option.name}`,
      amount: option.monthlyFee,
      taxRate: 0.1,
    });
  }
  return options;
}
