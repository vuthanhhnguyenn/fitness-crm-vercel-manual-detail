import type { ManualNotificationRow } from '../_constants/manual-notification.constants';
import {
  MANUAL_NOTIFICATION_BRAND_LABELS,
  MANUAL_NOTIFICATION_CONTRACT_TYPE_LABELS,
  getManualNotificationDynamicAttributeLabel,
  getManualNotificationSelectedBrand,
} from '../_constants/manual-notification.constants';

type ManualNotificationTarget = ManualNotificationRow['target'];

export function formatManualNotificationTarget(target: ManualNotificationTarget): string {
  switch (target.type) {
    case 'all_members':
      return '全会員対象';
    case 'brands': {
      const brand = getManualNotificationSelectedBrand(target.brands);
      return brand ? MANUAL_NOTIFICATION_BRAND_LABELS[brand] : '配信対象未設定';
    }
    case 'stores':
      return target.stores.map((store) => store.name).join(' · ') || '配信対象未設定';
    case 'contract_type':
      return MANUAL_NOTIFICATION_CONTRACT_TYPE_LABELS[target.contractType];
    case 'membership_duration':
      return target.condition === 'within'
        ? `入会後${target.months}ヶ月以内`
        : `入会後${target.months}ヶ月以上`;
    case 'dynamic_attribute':
      return getManualNotificationDynamicAttributeLabel(target.attribute);
    case 'members':
      return target.members.length > 0 ? `${target.members.length}名を指定` : '配信対象未設定';
  }
}
