import { z } from 'zod';

import { Gender, MemberType } from '@/lib/api/types.gen';

const kanaRegex = /^[ァ-ンヴー\s]+$/;
const postalCodeRegex = /^\d{3}-?\d{4}$/;
const phoneRegex = /^\d{10,11}$/;

export const JOIN_ROUTE_OPTIONS = ['Web', '店頭', '紹介', 'その他'] as const;

export const memberFormSchema = z.object({
  last_name: z.string().min(1, '氏名（姓）は必須です').max(50, '50文字以内で入力してください'),
  first_name: z.string().min(1, '氏名（名）は必須です').max(50, '50文字以内で入力してください'),
  last_name_kana: z
    .string()
    .min(1, 'フリガナ（姓）は必須です')
    .max(50, '50文字以内で入力してください')
    .regex(kanaRegex, '全角カタカナで入力してください'),
  first_name_kana: z
    .string()
    .min(1, 'フリガナ（名）は必須です')
    .max(50, '50文字以内で入力してください')
    .regex(kanaRegex, '全角カタカナで入力してください'),
  gender: z.nativeEnum(Gender),
  birthday: z.string().min(1, '生年月日は必須です'),
  member_type: z.nativeEnum(MemberType).optional().or(z.literal('')),
  phone: z
    .string()
    .min(1, '電話番号は必須です')
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => phoneRegex.test(val), {
      message: '電話番号はハイフンなし10〜11桁で入力してください',
    }),
  email: z
    .string()
    .min(1, 'メールアドレスは必須です')
    .email('メールアドレスの形式が正しくありません'),
  postal_code: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || postalCodeRegex.test(val), {
      message: '郵便番号は7桁（ハイフンあり/なし）で入力してください',
    }),
  address: z.string().optional().or(z.literal('')),
  emergency_contact_name: z.string().optional().or(z.literal('')),
  emergency_contact_relationship: z.string().optional().or(z.literal('')),
  emergency_contact_phone: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => {
        if (!val) return true;
        return phoneRegex.test(val.replace(/\D/g, ''));
      },
      {
        message: '緊急連絡先の電話番号はハイフンなし10〜11桁で入力してください',
      },
    ),
  contract_name: z.string().min(1, '主契約は必須です'),
  join_date: z.string().min(1, '入会日は必須です'),
  join_store: z.string().optional().or(z.literal('')),
  brand: z.string().optional().or(z.literal('')),
  join_route: z.enum(JOIN_ROUTE_OPTIONS).optional().or(z.literal('')),
  referrer_member_id: z.string().optional().or(z.literal('')),
  member_photo_url: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type MemberFormValues = z.input<typeof memberFormSchema>;
export type MemberFormSubmitValues = z.output<typeof memberFormSchema>;

export const emptyMemberFormValues: MemberFormValues = {
  last_name: '',
  first_name: '',
  last_name_kana: '',
  first_name_kana: '',
  gender: Gender.OTHER,
  birthday: '',
  member_type: '',
  phone: '',
  email: '',
  postal_code: '',
  address: '',
  emergency_contact_name: '',
  emergency_contact_relationship: '',
  emergency_contact_phone: '',
  contract_name: '',
  join_date: '',
  join_store: '',
  brand: '',
  join_route: '',
  referrer_member_id: '',
  member_photo_url: '',
  notes: '',
};
