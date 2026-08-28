import { TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

export const InstructorRoleClassificationSchema = z.enum([
  'trainer',
  'instructor',
  'body_care_therapist',
]);

export const InstructorMinBookingLeadHoursSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(6),
  z.literal(12),
  z.literal(24),
  z.literal(48),
  z.literal(72),
]);

export const InstructorBufferMinutesSchema = z.union([
  z.literal(0),
  z.literal(15),
  z.literal(30),
  z.literal(45),
  z.literal(60),
]);

const textMaxMessage = `${TEXT_MAX_LENGTH}文字以内で入力してください。`;
const textareaMaxMessage = `${TEXTAREA_MAX_LENGTH}文字以内で入力してください。`;

export const InstructorFormSchema = z.object({
  lastName: z.string().trim().min(1, '氏名は必須です。').max(TEXT_MAX_LENGTH, textMaxMessage),
  firstName: z.string().trim().min(1, '氏名は必須です。').max(TEXT_MAX_LENGTH, textMaxMessage),
  romajiLastName: z.string().max(TEXT_MAX_LENGTH, textMaxMessage).optional().default(''),
  romajiFirstName: z.string().max(TEXT_MAX_LENGTH, textMaxMessage).optional().default(''),
  nickname: z.string().max(TEXT_MAX_LENGTH, textMaxMessage).optional().default(''),
  roleClassifications: z
    .array(InstructorRoleClassificationSchema)
    .min(1, '役割区分は必須です。')
    .max(3, '役割区分は3つまで選択できます。'),
  profileText: z.string().max(TEXTAREA_MAX_LENGTH, textareaMaxMessage).optional().default(''),
  instructingHistory: z
    .string()
    .max(TEXTAREA_MAX_LENGTH, textareaMaxMessage)
    .optional()
    .default(''),
  photoUrl: z.string().nullable().optional().default(null),
  minBookingLeadHours: InstructorMinBookingLeadHoursSchema.default(0),
  preBufferMinutes: InstructorBufferMinutesSchema.default(0),
  postBufferMinutes: InstructorBufferMinutesSchema.default(0),
  crmAccountLinkStaffId: z.string().nullable().optional().default(null),
  crmAccountLinkStaffName: z.string().nullable().optional().default(null),
});

export type InstructorFormInput = z.input<typeof InstructorFormSchema>;
export type InstructorFormValues = z.output<typeof InstructorFormSchema>;
export type InstructorFormMode = 'create' | 'edit';
export type InstructorEditableField =
  | 'nickname'
  | 'romaji_last_name'
  | 'romaji_first_name'
  | 'profile_text'
  | 'photo_url'
  | 'instructing_history'
  | 'buffer_settings';

export function joinFullName(lastName: string, firstName: string): string {
  return [lastName, firstName].filter((part) => part.trim().length > 0).join(' ');
}
