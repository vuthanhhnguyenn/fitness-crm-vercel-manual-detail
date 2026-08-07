import type {
  GetOptionDiscountsResponse,
  OptionDiscountChangeHistoryItem,
  OptionDiscountDetail,
} from '@/app/api/_schemas/option-discount.schema';

export type OptionDiscountType = {
  _rows: GetOptionDiscountsResponse['option_discounts'];
  _changeHistory: Record<string, OptionDiscountChangeHistoryItem[]>;
  _seeded: boolean;
  _seed(): void;
  getList(): GetOptionDiscountsResponse['option_discounts'];
  getById(id: string): OptionDiscountDetail | undefined;
  add(data: {
    name: string;
    code: string;
    description?: string | null;
    target_contracts: string[];
    target_options: string[];
    discount_type: string;
    discount_value: number;
    conditions: string;
    store_id?: string | null;
    status?: string;
  }): OptionDiscountDetail;
  update(
    id: string,
    data: {
      name?: string;
      code?: string;
      description?: string | null;
      target_contracts?: string[];
      target_options?: string[];
      discount_type?: string;
      discount_value?: number;
      conditions?: string;
      store_id?: string | null;
      status?: string;
    },
  ): OptionDiscountDetail | undefined;
  delete(id: string): boolean;
  getChangeHistory(id: string): OptionDiscountChangeHistoryItem[];
};
