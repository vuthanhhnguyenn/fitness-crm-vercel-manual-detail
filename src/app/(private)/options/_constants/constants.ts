import {
  OptionCategory,
  OptionProrataMethod,
  OptionStatus,
  OptionType,
  OptionUsageRule,
} from '@/lib/api/types.gen';

export const OPTION_TYPE_LABELS: Record<OptionType, string> = {
  [OptionType.STANDARD]: '通常',
  [OptionType.METERED]: '都次',
  [OptionType.AUTO_ATTACHED]: '自動付与',
};

export const OPTION_TYPE_BADGE_CLASSES: Record<OptionType, string> = {
  [OptionType.STANDARD]: '',
  [OptionType.METERED]: 'bg-warning/15 text-warning border-warning/20',
  [OptionType.AUTO_ATTACHED]: 'bg-success/15 text-success border-success/20',
};

export const OPTION_STATUS_LABELS: Record<OptionStatus, string> = {
  [OptionStatus.ACTIVE]: '有効',
  [OptionStatus.INACTIVE]: '無効',
};

export const OPTION_STATUS_BADGE_CLASSES: Record<OptionStatus, string> = {
  [OptionStatus.ACTIVE]: 'bg-success/15 text-success border-success/20',
  [OptionStatus.INACTIVE]: 'bg-muted text-muted-foreground border-border',
};

export const OPTION_USAGE_RULE_LABELS: Record<OptionUsageRule, string> = {
  [OptionUsageRule.DISABLED]: '利用不可',
  [OptionUsageRule.ADD_REMOVE]: '追加・解約のみ',
  [OptionUsageRule.ADD_REMOVE_CHANGE]: '追加・解約・変更',
  [OptionUsageRule.CHANGE_REMOVE]: '変更・解約のみ',
};

export const OPTION_CATEGORY_LABELS: Record<OptionCategory, string> = {
  [OptionCategory.SUPPLEMENT]: 'サプリメント',
  [OptionCategory.DRINK]: 'ドリンク',
  [OptionCategory.RENTAL]: 'レンタル',
  [OptionCategory.LOCKER]: 'ロッカー',
  [OptionCategory.INSURANCE]: '保険・保証',
  [OptionCategory.SERVICE]: 'サービス',
};

export const OPTION_TYPE_DESCRIPTIONS: Record<OptionType, string> = {
  [OptionType.STANDARD]: '月単位で継続して課金されるオプションです',
  [OptionType.METERED]: '利用のたびに費用が発生します',
  [OptionType.AUTO_ATTACHED]: '入会時にベタ付けで自動的に付与されます',
};

export const OPTION_USAGE_RULE_DESCRIPTIONS: Record<OptionUsageRule, string> = {
  [OptionUsageRule.DISABLED]: '既存契約者のみ継続、新規追加は不可',
  [OptionUsageRule.ADD_REMOVE]: '会員は追加・解約のみ行えます',
  [OptionUsageRule.ADD_REMOVE_CHANGE]: '会員は追加・解約・変更のすべてを行えます',
  [OptionUsageRule.CHANGE_REMOVE]: '会員は変更・解約のみ行えます',
};

export const PRORATA_METHOD_LABELS: Record<OptionProrataMethod, string> = {
  [OptionProrataMethod.DAILY]: '日割り計算（日数按分）',
  [OptionProrataMethod.FIXED]: '固定金額',
};
