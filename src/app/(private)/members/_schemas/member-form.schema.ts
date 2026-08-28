import { TEXT_MAX_LENGTH } from '@/constants/app.constants';
import { z } from 'zod';

import { Gender } from '@/lib/api/types.gen';

export const NAME_MAX_LENGTH = 50;

const kanaRegex = /^[ァ-ヶー・\s]+$/;
const postalCodeRegex = /^\d{3}-?\d{4}$/;
const phoneRegex = /^\d{10,11}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requiredName = (blankMessage: string) =>
  z
    .string()
    .max(NAME_MAX_LENGTH, '50文字以内で入力してください')
    .refine((value) => value.trim().length > 0, { message: blankMessage });

const requiredKana = (blankMessage: string) =>
  z
    .string()
    .max(NAME_MAX_LENGTH, '50文字以内で入力してください')
    .refine((value) => value.trim().length > 0, { message: blankMessage })
    .refine((value) => value.trim().length === 0 || kanaRegex.test(value.trim()), {
      message: '全角カタカナで入力してください',
    });

export const memberFormSchema = z.object({
  last_name: requiredName('氏名（姓）を入力してください'),
  first_name: requiredName('氏名（名）を入力してください'),
  last_name_kana: requiredKana('フリガナ（姓）を入力してください'),
  first_name_kana: requiredKana('フリガナ（名）を入力してください'),
  birthday: z.string().min(1, '生年月日を入力してください'),
  gender: z.nativeEnum(Gender, { message: '性別を選択してください' }),
  postal_code: z
    .string()
    .max(TEXT_MAX_LENGTH)
    .refine((value) => value.trim().length === 0 || postalCodeRegex.test(value.trim()), {
      message: '郵便番号は7桁（ハイフンあり/なし）で入力してください',
    }),
  address: z.string().max(TEXT_MAX_LENGTH, '255文字以内で入力してください'),
  phone: z
    .string()
    .max(TEXT_MAX_LENGTH)
    .refine((value) => value.trim().length > 0, { message: '電話番号を入力してください' })
    .refine((value) => value.trim().length === 0 || phoneRegex.test(value.replace(/\D/g, '')), {
      message: '電話番号はハイフンなし10〜11桁で入力してください',
    })
    .transform((value) => value.replace(/\D/g, '')),
  email: z
    .string()
    .max(TEXT_MAX_LENGTH)
    .refine((value) => value.trim().length > 0, { message: 'メールアドレスを入力してください' })
    .refine((value) => value.trim().length === 0 || emailRegex.test(value.trim()), {
      message: 'メールアドレスの形式が正しくありません',
    }),
});

export type MemberFormValues = z.input<typeof memberFormSchema>;
export type MemberFormSubmitValues = z.output<typeof memberFormSchema>;

export const emptyMemberFormValues: MemberFormValues = {
  last_name: '',
  first_name: '',
  last_name_kana: '',
  first_name_kana: '',
  birthday: '',
  // Cast: the form starts with no selection; the Select placeholder covers the
  // empty state and submit-time validation rejects a missing choice.
  gender: '' as MemberFormValues['gender'],
  postal_code: '',
  address: '',
  phone: '',
  email: '',
};

/** 性別 options in prototype order (男性/女性/その他/回答しない). */
export const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: Gender.MALE, label: '男性' },
  { value: Gender.FEMALE, label: '女性' },
  { value: Gender.OTHER, label: 'その他' },
  { value: Gender.PREFER_NOT_TO_SAY, label: '回答しない' },
];
