import type {
  AccessAuthMethod,
  AccessEventType,
  MemberAccessSettings,
  PaymentPeriod,
  PaymentSummary,
} from '@/app/api/_schemas/member.schema';
import { format } from 'date-fns';

/**
 * Mock helper: derive a deterministic seed value from a member ID.
 * Member-detail mocks vary their data per member via this seed instead of sharing one
 * global list (otherwise every member would show the exact same history).
 */
function memberSeed(memberId: string): number {
  return Number(memberId.replace(/\D/g, '')) || 0;
}

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
  status: 'pending' | 'confirmed' | 'paid' | 'uncollected' | 'written-off';
  billingDate: string;
}> = [
  {
    month: '2026年4月',
    type: 'monthly',
    amount: 9900,
    status: 'confirmed',
    billingDate: '2026/04/01',
  },
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

export const PAYMENT_PERIOD_LABELS: Record<PaymentPeriod, string> = {
  all: '全期間',
  thisMonth: '今月',
  lastMonth: '先月',
  '3months': '過去3ヶ月',
  '6months': '過去6ヶ月',
};

/** Per-member payment history (drops 0-3 trailing rows so members differ) */
export function getPaymentHistoryForMember(memberId: string): typeof MOCK_PAYMENT_HISTORY {
  const drop = memberSeed(memberId) % 4;
  return MOCK_PAYMENT_HISTORY.slice(0, MOCK_PAYMENT_HISTORY.length - drop);
}

/** Per-member billing list (drops 0-2 trailing rows so members differ) */
export function getBillingListForMember(memberId: string): typeof MOCK_BILLING_LIST {
  const drop = memberSeed(memberId) % 3;
  return MOCK_BILLING_LIST.slice(0, MOCK_BILLING_LIST.length - drop);
}

/**
 * Period filter for the payment ledger. Shared between the ledger and the payment summary
 * so the summary numbers never disagree with the list.
 * (The reference date is fixed at 2026-04-22 because this is a mock.)
 */
export function filterPaymentHistoryByPeriod(
  period: PaymentPeriod,
  memberId: string,
): typeof MOCK_PAYMENT_HISTORY {
  const history = getPaymentHistoryForMember(memberId);
  if (period === 'all') return [...history];

  const now = new Date('2026-04-22');
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

  return history.filter((item) => {
    const itemDate = new Date(item.date.replaceAll('/', '-'));

    switch (period) {
      case 'thisMonth':
        return itemDate >= monthStart;
      case 'lastMonth':
        return itemDate >= lastMonthStart && itemDate < monthStart;
      case '3months':
        return itemDate >= threeMonthsAgo;
      case '6months':
        return itemDate >= sixMonthsAgo;
      default:
        return true;
    }
  });
}

export function getPaymentSummary(memberId: string, period: PaymentPeriod = 'all'): PaymentSummary {
  const billingList = getBillingListForMember(memberId);
  const currentMonthAmount = billingList
    .filter((item) => item.month === '2026年4月')
    .reduce((sum, item) => sum + item.amount, 0);

  const unpaidTotal = billingList
    .filter((item) => ['uncollected', 'written-off'].includes(item.status))
    .reduce((sum, item) => sum + item.amount, 0);

  // Sales / refunds are aggregated with the same period filter as the ledger
  const records = filterPaymentHistoryByPeriod(period, memberId);

  const totalSales = records
    .filter((item) => item.type === 'sale')
    .reduce((sum, item) => sum + Math.max(0, item.amount), 0);
  const refundTotal = records
    .filter((item) => item.type === 'refund')
    .reduce((sum, item) => sum + Math.abs(item.amount), 0);

  const lastPayment = [...records]
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  return {
    periodLabel: PAYMENT_PERIOD_LABELS[period],
    totalSales,
    refundTotal,
    netAmount: totalSales - refundTotal,
    currentMonthAmount,
    unpaidTotal,
    lastPaymentDate: lastPayment?.date ?? null,
    paymentMethod: 'SBPS',
  };
}

type EntryExitEventMock = {
  id: string;
  occurredAt: string;
  storeId: string;
  storeName: string;
  eventType: AccessEventType;
  authMethod: AccessAuthMethod;
};

// Generated relative to "now" so the default month (current month) always has
// data, and the previous month is populated too (for MonthPicker navigation).
//
// One row = one gate event (入館 / 退館), matching both the UI prototype's
// 入退館履歴 table and the backend design doc (`eventType: entry | exit`).
// A visit that is still in progress simply has no `exit` row yet.
function buildEntryExitEvents(seed: number): EntryExitEventMock[] {
  const stores = [
    { id: 'store-001', name: 'JOYFIT渋谷店' },
    { id: 'store-002', name: 'JOYFIT新宿店' },
    { id: 'store-003', name: 'FIT365六本木' },
  ];
  const methods: AccessAuthMethod[] = ['qr', 'nfc', 'face', 'manual'];
  const now = new Date();
  const events: EntryExitEventMock[] = [];
  // 8〜15 visits spread over the last ~45 days (covers current + previous month).
  // The per-member seed varies count, store and time slot so members do not share one history
  const count = 8 + (seed % 8);
  for (let i = 0; i < count; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 3 - (seed % 3));
    const store = stores[(i + seed) % stores.length]!;
    const hour = (i + seed) % 2 === 0 ? 18 : 6;
    const entry = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0);
    const stillIn = i === 0 && seed % 5 === 2;
    const stay = 60 + ((i + seed) % 4) * 15;
    const authMethod = methods[(i + seed) % methods.length]!;
    const visitId = `${seed}-${String(i + 1).padStart(3, '0')}`;

    events.push({
      id: `ee-${visitId}-in`,
      occurredAt: entry.toISOString(),
      storeId: store.id,
      storeName: store.name,
      eventType: 'entry',
      authMethod,
    });

    if (!stillIn) {
      events.push({
        id: `ee-${visitId}-out`,
        occurredAt: new Date(entry.getTime() + stay * 60_000).toISOString(),
        storeId: store.id,
        storeName: store.name,
        eventType: 'exit',
        authMethod,
      });
    }
  }
  // Newest first, like the gate log itself
  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}

const entryExitEventsByMember = new Map<string, EntryExitEventMock[]>();

/** Per-member entry/exit events (deterministic seed; the same member always gets the same history) */
export function getEntryExitEventsForMember(memberId: string): EntryExitEventMock[] {
  let events = entryExitEventsByMember.get(memberId);
  if (!events) {
    events = buildEntryExitEvents(memberSeed(memberId));
    entryExitEventsByMember.set(memberId, events);
  }
  return events;
}

type LessonReservationMock = {
  id: string;
  lessonDate: string;
  lessonName: string;
  instructorName: string;
  status: 'attended' | 'absent' | 'cancelled' | 'reserved';
};

// Generated relative to "now" so the default month (current month) always has
// data, and the previous month is populated too (for MonthPicker navigation).
function buildLessonReservations(seed: number): LessonReservationMock[] {
  const lessons = [
    { name: 'ボクシング基礎', instructor: '田中太郎' },
    { name: 'ヨガ基礎', instructor: '鈴木花子' },
    { name: 'パーソナルトレーニング', instructor: '佐藤次郎' },
    { name: 'グループレッスン', instructor: '山田美咲' },
    { name: 'ピラティス', instructor: '中村優子' },
    { name: 'ダンスエクササイズ', instructor: '高橋健太' },
    { name: 'スイミング', instructor: '伊藤由美' },
  ];
  const statuses: LessonReservationMock['status'][] = [
    'attended',
    'attended',
    'absent',
    'cancelled',
    'reserved',
  ];
  const now = new Date();
  const records: LessonReservationMock[] = [];
  // 6〜12 reservations spread over the last ~45 days.
  // The per-member seed varies lessons and count
  const count = 6 + (seed % 7);
  for (let i = 0; i < count; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 5 - (seed % 4));
    const lesson = lessons[(i + seed) % lessons.length]!;
    records.push({
      id: `lr-${seed}-${String(i + 1).padStart(3, '0')}`,
      lessonDate: format(day, 'yyyy-MM-dd'),
      lessonName: lesson.name,
      instructorName: lesson.instructor,
      status: statuses[(i + seed) % statuses.length]!,
    });
  }
  return records;
}

const lessonReservationsByMember = new Map<string, LessonReservationMock[]>();

/** Per-member lesson reservations (deterministic seed; the same member always gets the same history) */
export function getLessonReservationsForMember(memberId: string): LessonReservationMock[] {
  let records = lessonReservationsByMember.get(memberId);
  if (!records) {
    records = buildLessonReservations(memberSeed(memberId));
    lessonReservationsByMember.set(memberId, records);
  }
  return records;
}

// camelCase per the A-01-01 design doc (naming unification for member-detail endpoints).
// `authMethod` stores the enum key (never a Japanese label) so it shares one
// vocabulary with the entry/exit events — the UI resolves labels via
// `_constants/auth-method.ts`.
export const MOCK_MEMBER_ACCESS_SETTINGS: Record<string, MemberAccessSettings> = {
  'member-001': {
    authMethod: 'qr',
    icCardNumber: null,
    qrCode: 'QR123456789',
    gateStop: false,
  },
  'member-002': {
    authMethod: 'nfc',
    icCardNumber: 'IC-0002',
    qrCode: null,
    gateStop: true,
  },
  'member-003': {
    authMethod: 'qr',
    icCardNumber: null,
    qrCode: 'QR987654321',
    gateStop: false,
  },
  'member-004': {
    authMethod: 'face',
    icCardNumber: 'IC-0004',
    qrCode: 'QR111222333',
    gateStop: false,
  },
};
