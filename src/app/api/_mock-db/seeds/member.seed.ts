import type { PaymentSummary } from '@/app/api/_schemas/member.schema';

export const MOCK_PAYMENT_HISTORY: Array<{
  date: string;
  type: 'sale' | 'refund';
  content: string;
  amount: number;
  method: string;
}> = [
  { date: '2026/04/01', type: 'sale', content: '月会費（4月分）', amount: 9900, method: 'SBPS' },
  { date: '2026/03/28', type: 'refund', content: '返金処理', amount: -2200, method: 'SBPS' },
  { date: '2026/03/15', type: 'sale', content: '月会費（3月分）', amount: 9900, method: 'SBPS' },
  {
    date: '2026/03/10',
    type: 'sale',
    content: 'オプション追加（パーソナルトレーニング）',
    amount: 5500,
    method: 'JACCS',
  },
  {
    date: '2026/02/28',
    type: 'refund',
    content: 'オプション解約返金',
    amount: -1100,
    method: 'SBPS',
  },
  { date: '2026/02/15', type: 'sale', content: '月会費（2月分）', amount: 9900, method: 'SBPS' },
  { date: '2026/02/01', type: 'sale', content: 'ロッカー利用料', amount: 550, method: '現金' },
  { date: '2026/01/20', type: 'refund', content: 'オプション返金', amount: -3300, method: 'SBPS' },
  { date: '2026/01/15', type: 'sale', content: '月会費（1月分）', amount: 9900, method: 'SBPS' },
  { date: '2025/12/28', type: 'sale', content: 'プロテイン販売', amount: 2500, method: '現金' },
];

export const MOCK_BILLING_LIST: Array<{
  month: string;
  type: 'monthly' | 'oneTime';
  amount: number;
  status: 'pending' | 'paid' | 'uncollected' | 'written-off';
  billingDate: string;
}> = [
  { month: '2026年4月', type: 'monthly', amount: 9900, status: 'paid', billingDate: '2026/04/01' },
  { month: '2026年3月', type: 'monthly', amount: 9900, status: 'paid', billingDate: '2026/03/01' },
  {
    month: '2026年3月',
    type: 'oneTime',
    amount: 5500,
    status: 'pending',
    billingDate: '2026/03/10',
  },
  { month: '2026年2月', type: 'monthly', amount: 9900, status: 'paid', billingDate: '2026/02/01' },
  {
    month: '2026年1月',
    type: 'monthly',
    amount: 9900,
    status: 'uncollected',
    billingDate: '2026/01/01',
  },
  {
    month: '2025年12月',
    type: 'monthly',
    amount: 9900,
    status: 'paid',
    billingDate: '2025/12/01',
  },
  {
    month: '2025年11月',
    type: 'monthly',
    amount: 9900,
    status: 'written-off',
    billingDate: '2025/11/01',
  },
  {
    month: '2025年10月',
    type: 'monthly',
    amount: 9900,
    status: 'paid',
    billingDate: '2025/10/01',
  },
];

export function getPaymentSummary(): PaymentSummary {
  const currentMonthAmount = MOCK_BILLING_LIST.filter((item) => item.month === '2026年4月').reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const unpaidTotal = MOCK_BILLING_LIST.filter((item) =>
    ['uncollected', 'written-off'].includes(item.status),
  ).reduce((sum, item) => sum + item.amount, 0);

  const paidRecords = MOCK_BILLING_LIST.filter((item) => item.status === 'paid');
  const lastPaymentDate = paidRecords.length > 0 ? paidRecords[0]!.billingDate : null;

  return {
    currentMonthAmount,
    unpaidTotal,
    lastPaymentDate,
    paymentMethod: 'SBPS',
  };
}

export const MOCK_VISIT_RECORDS = [
  {
    id: 'vr-001',
    entry_time: '2026-04-23T18:00:00Z',
    exit_time: '2026-04-23T19:30:00Z',
    stay_time: 90,
    store_id: 'store-001',
    store_name: 'JOYFIT渋谷店',
    entry_method: 'qr_code',
  },
  {
    id: 'vr-002',
    entry_time: '2026-04-22T06:00:00Z',
    exit_time: '2026-04-22T07:15:00Z',
    stay_time: 75,
    store_id: 'store-002',
    store_name: 'JOYFIT新宿店',
    entry_method: 'ic_card',
  },
  {
    id: 'vr-003',
    entry_time: '2026-04-21T19:30:00Z',
    exit_time: null,
    stay_time: undefined,
    store_id: 'store-001',
    store_name: 'JOYFIT渋谷店',
    entry_method: 'qr_code',
  },
  {
    id: 'vr-004',
    entry_time: '2026-04-20T18:00:00Z',
    exit_time: '2026-04-20T20:00:00Z',
    stay_time: 120,
    store_id: 'store-001',
    store_name: 'JOYFIT渋谷店',
    entry_method: 'face_recognition',
  },
  {
    id: 'vr-005',
    entry_time: '2026-04-19T06:30:00Z',
    exit_time: '2026-04-19T08:00:00Z',
    stay_time: 90,
    store_id: 'store-003',
    store_name: 'FIT365六本木',
    entry_method: 'member_card',
  },
  {
    id: 'vr-006',
    entry_time: '2026-04-18T18:45:00Z',
    exit_time: '2026-04-18T19:45:00Z',
    stay_time: 60,
    store_id: 'store-002',
    store_name: 'JOYFIT新宿店',
    entry_method: 'qr_code',
  },
  {
    id: 'vr-007',
    entry_time: '2026-04-17T19:00:00Z',
    exit_time: null,
    stay_time: undefined,
    store_id: 'store-002',
    store_name: 'JOYFIT新宿店',
    entry_method: 'ic_card',
  },
  {
    id: 'vr-008',
    entry_time: '2026-04-16T07:00:00Z',
    exit_time: '2026-04-16T08:30:00Z',
    stay_time: 90,
    store_id: 'store-001',
    store_name: 'JOYFIT渋谷店',
    entry_method: 'face_recognition',
  },
] as const;

export const MOCK_LESSON_RESERVATIONS = [
  {
    id: 'lr-001',
    lesson_date: '2026-04-23',
    lesson_name: 'ボクシング基礎',
    instructor_name: '田中太郎',
    status: 'attended' as const,
  },
  {
    id: 'lr-002',
    lesson_date: '2026-04-22',
    lesson_name: 'ヨガ基礎',
    instructor_name: '鈴木花子',
    status: 'attended' as const,
  },
  {
    id: 'lr-003',
    lesson_date: '2026-04-21',
    lesson_name: 'パーソナルトレーニング',
    instructor_name: '佐藤次郎',
    status: 'absent' as const,
  },
  {
    id: 'lr-004',
    lesson_date: '2026-04-20',
    lesson_name: 'グループレッスン',
    instructor_name: '山田美咲',
    status: 'attended' as const,
  },
  {
    id: 'lr-005',
    lesson_date: '2026-04-19',
    lesson_name: 'ボクシング基礎',
    instructor_name: '田中太郎',
    status: 'cancelled' as const,
  },
  {
    id: 'lr-006',
    lesson_date: '2026-04-25',
    lesson_name: 'ピラティス',
    instructor_name: '中村優子',
    status: 'reserved' as const,
  },
  {
    id: 'lr-007',
    lesson_date: '2026-05-01',
    lesson_name: 'ダンスエクササイズ',
    instructor_name: '高橋健太',
    status: 'reserved' as const,
  },
  {
    id: 'lr-008',
    lesson_date: '2026-05-05',
    lesson_name: 'スイミング',
    instructor_name: '伊藤由美',
    status: 'reserved' as const,
  },
  {
    id: 'lr-009',
    lesson_date: '2026-04-18',
    lesson_name: 'ヨガ基礎',
    instructor_name: '鈴木花子',
    status: 'attended' as const,
  },
  {
    id: 'lr-010',
    lesson_date: '2026-04-17',
    lesson_name: 'パーソナルトレーニング',
    instructor_name: '佐藤次郎',
    status: 'cancelled' as const,
  },
] as const;

export const MOCK_MEMBER_ACCESS_SETTINGS: Record<
  string,
  { auth_method: string; ic_card_number: string | null; qr_code: string | null; gate_stop: boolean }
> = {
  'member-001': {
    auth_method: 'QRコード',
    ic_card_number: null,
    qr_code: 'QR123456789',
    gate_stop: false,
  },
  'member-002': {
    auth_method: 'ICカード',
    ic_card_number: 'IC-0002',
    qr_code: null,
    gate_stop: true,
  },
  'member-003': {
    auth_method: 'QRコード',
    ic_card_number: null,
    qr_code: 'QR987654321',
    gate_stop: false,
  },
  'member-004': {
    auth_method: '顔認証',
    ic_card_number: 'IC-0004',
    qr_code: 'QR111222333',
    gate_stop: false,
  },
};
