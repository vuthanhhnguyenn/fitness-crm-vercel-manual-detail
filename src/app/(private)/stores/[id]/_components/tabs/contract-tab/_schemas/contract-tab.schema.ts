import { z } from 'zod';

export const contractTypeSchema = z.enum([
  'general',
  'oneDay',
  'family',
  'kids',
  'student',
  'corporate',
  'welfare',
  'prepaid',
  'special',
]);

export const storeMainContractSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  contract_type: contractTypeSchema,
  price_including_tax: z.number().nonnegative(),
  linked_at: z.string().min(1),
});

export const storeOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  related_option_name: z.string().nullable(),
  price_including_tax: z.number().nonnegative(),
});

export const storeContractTabDataSchema = z.object({
  main_contracts: z.array(storeMainContractSchema),
  options: z.array(storeOptionSchema),
});

export type StoreMainContract = z.infer<typeof storeMainContractSchema>;
export type StoreOption = z.infer<typeof storeOptionSchema>;
export type StoreContractTabData = z.infer<typeof storeContractTabDataSchema>;
