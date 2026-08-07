import type {
  CampaignChangeHistoryItem,
  CampaignDetail,
  CampaignListItem,
} from '@/app/api/_schemas/campaign.schema';

export type CampaignsType = {
  _rows: CampaignListItem[];
  _details: Record<string, CampaignDetail>;
  _changeHistory: Record<string, CampaignChangeHistoryItem[]>;
  _seeded: boolean;
  _seed(): void;
  getList(): CampaignListItem[];
  getById(id: string): CampaignDetail | undefined;
  getChangeHistory(id: string): CampaignChangeHistoryItem[];
  add(campaign: CampaignDetail): void;
  update(id: string, data: Partial<CampaignDetail>): CampaignDetail | undefined;
};
