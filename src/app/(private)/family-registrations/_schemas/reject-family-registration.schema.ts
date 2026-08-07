import { z } from 'zod';

export const RejectFamilyRegistrationSchema = z.object({
  rejection_reason: z.string().min(1, '却下理由は必須です'),
});

export type RejectFamilyRegistrationSchema = z.infer<typeof RejectFamilyRegistrationSchema>;
