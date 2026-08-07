import { z } from 'zod';

export const LESSON_TYPE_OPTIONS = ['studio', 'personal'] as const;
export const SCHEDULE_MODE_OPTIONS = ['single', 'recurring'] as const;
export const REPEAT_TYPE_OPTIONS = ['weekly', 'biweekly', 'monthly'] as const;
export const END_CONDITION_OPTIONS = ['by_date', 'by_count', 'indefinite'] as const;
export const COURSE_TYPE_OPTIONS = ['30min', '60min', 'trial'] as const;
export const TRIAL_MODE_OPTIONS = ['inclusive', 'additional'] as const;

export const lessonScheduleFormSchema = z
  .object({
    lesson_type: z.enum(LESSON_TYPE_OPTIONS, { error: 'レッスン種別を選択してください' }),
    store_id: z.string().min(1, '店舗を選択してください'),
    studio_id: z.string().optional().default(''),
    course_type: z.enum(COURSE_TYPE_OPTIONS).optional(),
    schedule_mode: z.enum(SCHEDULE_MODE_OPTIONS, { error: 'スケジュールモードを選択してください' }),
    date: z.string().optional().default(''),
    start_date: z.string().optional().default(''),
    start_time: z.string().min(1, '開始時刻を入力してください'),
    repeat_type: z.enum(REPEAT_TYPE_OPTIONS).optional(),
    days_of_week: z.array(z.number().int().min(0).max(6)).optional().default([]),
    end_condition: z.enum(END_CONDITION_OPTIONS).optional(),
    end_date: z.string().optional().default(''),
    end_count: z.coerce.number().int().min(1).max(100).optional(),
    skip_holidays: z.boolean().default(false),
    lesson_id: z.string().min(1, 'レッスンを選択してください'),
    instructor_ids: z.array(z.string()).min(1, '少なくとも1名のインストラクターを選択してください'),
    capacity: z.coerce.number().int().nonnegative().optional(),
    is_published: z.boolean().default(true),
    trial_enabled: z.boolean().default(false),
    trial_mode: z.enum(TRIAL_MODE_OPTIONS).optional(),
    trial_capacity: z.coerce.number().int().min(1).max(5).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.lesson_type === 'studio' && (!value.studio_id || value.studio_id === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['studio_id'],
        message: 'スタジオを選択してください',
      });
    }
    if (value.lesson_type === 'personal' && !value.course_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['course_type'],
        message: 'コース種別を選択してください',
      });
    }
    if (
      value.lesson_type === 'studio' &&
      (value.capacity === undefined || value.capacity === null || value.capacity < 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['capacity'],
        message: '定員を入力してください',
      });
    }
    if (value.schedule_mode === 'single' && (!value.date || value.date === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['date'],
        message: '実施日を入力してください',
      });
    }
    if (value.schedule_mode === 'recurring') {
      if (!value.repeat_type) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['repeat_type'],
          message: '繰り返し種別を選択してください',
        });
      }
      if (!value.end_condition) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_condition'],
          message: '終了条件を選択してください',
        });
      }
      if (value.end_condition === 'by_date' && (!value.end_date || value.end_date === '')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_date'],
          message: '終了日を入力してください',
        });
      }
      if (value.end_condition === 'by_count' && (!value.end_count || value.end_count < 1)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['end_count'],
          message: '回数を入力してください（1-100）',
        });
      }
      if (!value.start_date || value.start_date === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['start_date'],
          message: '開始日を入力してください',
        });
      }
    }
    if (value.trial_enabled) {
      if (!value.trial_mode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['trial_mode'],
          message: '体験枠モードを選択してください',
        });
      }
      if (!value.trial_capacity || value.trial_capacity < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['trial_capacity'],
          message: '体験枠定員を入力してください（1-5）',
        });
      }
    }
  });

export type LessonScheduleFormValues = z.input<typeof lessonScheduleFormSchema>;
export type LessonScheduleFormSubmitValues = z.output<typeof lessonScheduleFormSchema>;

export const emptyLessonScheduleFormValues: LessonScheduleFormValues = {
  lesson_type: 'studio',
  store_id: '',
  studio_id: '',
  course_type: undefined,
  schedule_mode: 'single',
  date: '',
  start_date: '',
  start_time: '',
  repeat_type: undefined,
  days_of_week: [],
  end_condition: undefined,
  end_date: '',
  end_count: undefined,
  skip_holidays: false,
  lesson_id: '',
  instructor_ids: [],
  capacity: undefined,
  is_published: true,
  trial_enabled: false,
  trial_mode: undefined,
  trial_capacity: undefined,
};
