import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

import { ErrorResponseSchema } from './auth.schema';
import { MainContractTypeSchema } from './main-contract.schema';

extendZodWithOpenApi(z);

export const StoreLinkedMainContractSchema = z
  .object({
    id: z.string().openapi({ example: 'MC001' }),
    name: z.string().openapi({ example: 'レギュラー会員' }),
    contract_type: MainContractTypeSchema,
    price_including_tax: z.number().nonnegative().openapi({ example: 7700 }),
    linked_at: z.string().openapi({ example: '2024/04/01', description: '紐づけ日 (YYYY/MM/DD)' }),
  })
  .openapi({ title: 'StoreLinkedMainContract', description: '店舗に紐づく主契約' });

export const StoreLinkedOptionSchema = z
  .object({
    id: z.string().openapi({ example: 'OP002' }),
    name: z.string().openapi({ example: '水素水' }),
    related_option_name: z.string().nullable().openapi({ example: null }),
    price_including_tax: z.number().nonnegative().openapi({ example: 1100 }),
  })
  .openapi({ title: 'StoreLinkedOption', description: '店舗に紐づくオプション' });

export const GetStoreMainContractsResponseSchema = z
  .object({
    main_contracts: z.array(StoreLinkedMainContractSchema),
  })
  .openapi({ title: 'GetStoreMainContractsResponse' });

export const AddStoreMainContractsRequestSchema = z
  .object({
    main_contract_ids: z.array(z.string()).min(1),
  })
  .openapi({ title: 'AddStoreMainContractsRequest' });

export const AddStoreMainContractsResponseSchema = z
  .object({
    message: z.string().openapi({ example: '主契約を紐づけました' }),
    main_contracts: z.array(StoreLinkedMainContractSchema),
  })
  .openapi({ title: 'AddStoreMainContractsResponse' });

export const RemoveStoreMainContractResponseSchema = z
  .object({
    message: z.string().openapi({ example: '主契約の紐づけを解除しました' }),
  })
  .openapi({ title: 'RemoveStoreMainContractResponse' });

export const GetStoreOptionsResponseSchema = z
  .object({
    options: z.array(StoreLinkedOptionSchema),
  })
  .openapi({ title: 'GetStoreOptionsResponse' });

export const AddStoreOptionsRequestSchema = z
  .object({
    option_ids: z.array(z.string()).min(1),
  })
  .openapi({ title: 'AddStoreOptionsRequest' });

export const AddStoreOptionsResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'オプションを紐づけました' }),
    options: z.array(StoreLinkedOptionSchema),
  })
  .openapi({ title: 'AddStoreOptionsResponse' });

export const RemoveStoreOptionResponseSchema = z
  .object({
    message: z.string().openapi({ example: 'オプションの紐づけを解除しました' }),
  })
  .openapi({ title: 'RemoveStoreOptionResponse' });

export type StoreLinkedMainContract = z.infer<typeof StoreLinkedMainContractSchema>;
export type StoreLinkedOption = z.infer<typeof StoreLinkedOptionSchema>;
export type AddStoreMainContractsRequest = z.infer<typeof AddStoreMainContractsRequestSchema>;
export type AddStoreOptionsRequest = z.infer<typeof AddStoreOptionsRequestSchema>;

export { ErrorResponseSchema };
