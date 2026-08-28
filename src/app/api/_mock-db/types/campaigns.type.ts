import type {
  CampaignChangeHistoryItem,
  CampaignRow,
  StoreCampaignLinkRow,
} from '@/app/api/_schemas/campaign.schema';

export type CampaignsType = {
  _rows: CampaignRow[];
  _changeHistory: Record<string, CampaignChangeHistoryItem[]>;
  _seeded: boolean;
  _seed(): void;
  getList(includeDeleted?: boolean): CampaignRow[];
  getById(id: string, includeDeleted?: boolean): CampaignRow | undefined;
  getChangeHistory(id: string): CampaignChangeHistoryItem[];
  appendChangeHistory(id: string, entries: CampaignChangeHistoryItem[]): void;
  nextId(): string;
  isCodeTaken(code: string, exceptId?: string): boolean;
  create(row: CampaignRow): CampaignRow;
  update(id: string, patch: Partial<CampaignRow>): CampaignRow | undefined;
  softDelete(id: string): CampaignRow | undefined;
};

export type StoreCampaignLinksType = {
  _rows: StoreCampaignLinkRow[];
  _seeded: boolean;
  _seed(): void;
  getByCampaignId(campaignId: string): StoreCampaignLinkRow[];
};
