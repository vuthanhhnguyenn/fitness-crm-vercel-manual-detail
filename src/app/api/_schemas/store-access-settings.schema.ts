import { StoreListBrandSchema } from '@/app/api/_schemas/store.schema';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const PermittedStoreSchema = z
  .object({
    id: z.string(),
    store_name: z.string(),
    brand: StoreListBrandSchema,
    setup_date: z.string().openapi({ description: '設定日 (yyyy/MM/dd)' }),
  })
  .openapi('PermittedStore', {
    title: 'PermittedStore',
    description: '相互利用グループの許可店舗行',
  });

export const JoyUsageFeeSchema = z
  .object({
    id: z.string(),
    option_name: z.string(),
    fee: z.number().openapi({ description: '料金（税込）' }),
  })
  .openapi('JoyUsageFee', {
    title: 'JoyUsageFee',
    description: 'どこでもJOY利用料金の行',
  });

export const StoreAccessSettingsSchema = z
  .object({
    mutual_use_enabled: z.boolean(),
    start_date: z.string(),
    end_date: z.string(),
    under18_start_time: z.string(),
    under18_end_time: z.string(),
    permitted_stores: z.array(PermittedStoreSchema),
    joy_usage_fees: z.array(JoyUsageFeeSchema),
  })
  .openapi('StoreAccessSettings', {
    title: 'StoreAccessSettings',
    description: '店舗の入退室・相互利用設定（mock）',
  });

export const GetStoreAccessSettingsResponseSchema = StoreAccessSettingsSchema.openapi(
  'GetStoreAccessSettingsResponse',
  {
    title: 'GetStoreAccessSettingsResponse',
  },
);

export const UpdateStoreAccessSettingsRequestSchema = StoreAccessSettingsSchema.openapi(
  'UpdateStoreAccessSettingsRequest',
  {
    title: 'UpdateStoreAccessSettingsRequest',
  },
);

export const UpdateStoreAccessSettingsResponseSchema = z
  .object({
    message: z.string(),
    access_settings: StoreAccessSettingsSchema,
  })
  .openapi('UpdateStoreAccessSettingsResponse', {
    title: 'UpdateStoreAccessSettingsResponse',
  });

export type StoreAccessSettings = z.infer<typeof StoreAccessSettingsSchema>;
